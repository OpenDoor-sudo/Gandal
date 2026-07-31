import os, re

# Update index.html
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update loadTextbookPDF progress resolution & restoration flag
old_restore_block = """const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                const savedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;
                const savedMaxTime = dbSavedMaxTime > 0 ? dbSavedMaxTime : localSavedMaxTime;
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;"""

new_restore_block = """window.isRestoringVideoProgress = true;

                const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                const savedTime = Math.max(dbSavedTime, localSavedTime);
                const savedMaxTime = Math.max(dbSavedMaxTime, localSavedMaxTime);
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;"""

txt = txt.replace(old_restore_block, new_restore_block)

# 2. Reset isRestoringVideoProgress flag after seek completion
old_perform_seek = """                    try {
                      window.isProgrammaticSeek = true;
                      if (effectiveRestoreTime > 0.5) {
                        console.log("[SEEK_DEBUG] Restoring video position to:", effectiveRestoreTime);
                        if (effectiveRestoreTime > maxTimeWatched) {
                          maxTimeWatched = effectiveRestoreTime;
                        }
                        video.currentTime = effectiveRestoreTime;
                      }"""

new_perform_seek = """                    try {
                      window.isProgrammaticSeek = true;
                      if (effectiveRestoreTime > 0.5) {
                        console.log("[PROGRESS_RESTORE] Restoring video position to:", effectiveRestoreTime);
                        if (effectiveRestoreTime > maxTimeWatched) {
                          maxTimeWatched = effectiveRestoreTime;
                        }
                        video.currentTime = effectiveRestoreTime;
                      }
                      setTimeout(() => { window.isRestoringVideoProgress = false; }, 800);"""

txt = txt.replace(old_perform_seek, new_perform_seek)

# 3. Update mainVideo timeupdate listener to respect isRestoringVideoProgress
old_timeupdate = """mainVideo.addEventListener("timeupdate", () => {
            if (
              Math.abs(floatingVideo.currentTime - mainVideo.currentTime) > 0.3
            ) {
              floatingVideo.currentTime = mainVideo.currentTime;
            }
            if (!window.timelineLocked) {
              if (mainVideo.currentTime > maxTimeWatched) {
                maxTimeWatched = mainVideo.currentTime;
              }
            }
            if (typeof activeVideoId !== "undefined" && activeVideoId) {"""

new_timeupdate = """mainVideo.addEventListener("timeupdate", () => {
            if (window.isRestoringVideoProgress) {
              return;
            }
            if (
              Math.abs(floatingVideo.currentTime - mainVideo.currentTime) > 0.3
            ) {
              floatingVideo.currentTime = mainVideo.currentTime;
            }
            if (!window.timelineLocked) {
              if (mainVideo.currentTime > maxTimeWatched) {
                maxTimeWatched = mainVideo.currentTime;
              }
            }
            if (typeof activeVideoId !== "undefined" && activeVideoId) {"""

txt = txt.replace(old_timeupdate, new_timeupdate)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated index.html with rock-solid progress resuming!")

# Update display_client.py /api/save_progress handler
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_save_sql = """cursor.execute(\"\"\"
                        INSERT INTO student_progress_video (student_id, video_id, last_position, max_position)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(student_id, video_id) DO UPDATE SET
                            last_position = excluded.last_position,
                            max_position = ?,
                            last_updated = CURRENT_TIMESTAMP;
                    \"\"\", (student_id, video_id, current_time, final_max_time, final_max_time))"""

new_save_sql = """# Ignore 0.0s progress updates if a valid position is already saved
                    cursor.execute("SELECT last_position FROM student_progress_video WHERE student_id = ? AND video_id = ?", (student_id, video_id))
                    last_pos_row = cursor.fetchone()
                    save_pos = current_time
                    if last_pos_row and current_time < 0.5 and float(last_pos_row[0]) > 0.5:
                        save_pos = float(last_pos_row[0])

                    cursor.execute(\"\"\"
                        INSERT INTO student_progress_video (student_id, video_id, last_position, max_position)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(student_id, video_id) DO UPDATE SET
                            last_position = ?,
                            max_position = ?,
                            last_updated = CURRENT_TIMESTAMP;
                    \"\"\", (student_id, video_id, save_pos, final_max_time, save_pos, final_max_time))"""

py_txt = py_txt.replace(old_save_sql, new_save_sql)
open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py save_progress handler!")
