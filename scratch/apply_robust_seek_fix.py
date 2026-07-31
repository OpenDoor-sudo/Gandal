import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update loadTextbookPDF progress calculation and seek restoration
old_seek_block = """                const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                const savedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;
                const savedMaxTime = dbSavedMaxTime > 0 ? dbSavedMaxTime : localSavedMaxTime;
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;

                // Ensure maxTimeWatched is initialized to saved position so anti-seeking check doesn't reset it to 0
                maxTimeWatched = Math.max(savedMaxTime, effectiveRestoreTime, maxTimeWatched || 0);

                if (srcPathname !== targetPathname) {
                  video.src = data.video_file_path;
                  video.load();
                  emittedTranscripts.clear();
                  const tutorContainer = document.getElementById(
                    "tutorTranscriptContainer",
                  );
                  if (tutorContainer) {
                    tutorContainer.innerHTML = "";
                  }

                  let restoreDone = false;
                  const performSeekRestore = () => {
                    if (restoreDone) return;
                    restoreDone = true;
                    try {
                      window.isProgrammaticSeek = true;
                      if (effectiveRestoreTime > 0.5) {
                        console.log("[SEEK_DEBUG] Restoring video position to:", effectiveRestoreTime);
                        if (effectiveRestoreTime > maxTimeWatched) {
                          maxTimeWatched = effectiveRestoreTime;
                        }
                        video.currentTime = effectiveRestoreTime;
                      }
                      video
                        .play()
                        .catch((e) =>
                          console.log(
                            "[PLAY_DEBUG] Autoplay prevented play:",
                            e,
                          ),
                        );
                    } catch (e) {
                      console.warn("[SEEK_DEBUG] Seek restore failed:", e);
                    }
                  };

                  if (video.readyState >= 1) {
                    performSeekRestore();
                  } else {
                    video.addEventListener("loadedmetadata", performSeekRestore, { once: true });
                    video.addEventListener("canplay", performSeekRestore, { once: true });
                  }
                } else {
                  // Same video file is already loaded — seek if chapter was clicked OR restore saved progress
                  if (effectiveRestoreTime > 0.5 && targetTimeSecs !== null) {
                    console.log("[SEEK_DEBUG] Same-src resume to:", effectiveRestoreTime);
                    window.isProgrammaticSeek = true;
                    if (effectiveRestoreTime > maxTimeWatched) {
                      maxTimeWatched = effectiveRestoreTime;
                    }
                    video.currentTime = effectiveRestoreTime;
                  }"""

new_seek_block = """                window.isRestoringVideoProgress = true;

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
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;

                maxTimeWatched = Math.max(savedMaxTime, effectiveRestoreTime, maxTimeWatched || 0);

                if (srcPathname !== targetPathname) {
                  video.src = encodeURI(data.video_file_path);
                  video.load();
                  emittedTranscripts.clear();
                  const tutorContainer = document.getElementById(
                    "tutorTranscriptContainer",
                  );
                  if (tutorContainer) {
                    tutorContainer.innerHTML = "";
                  }

                  let restoreDone = false;
                  const performSeekRestore = () => {
                    if (restoreDone) return;
                    restoreDone = true;
                    try {
                      window.isProgrammaticSeek = true;
                      if (effectiveRestoreTime > 0.5) {
                        console.log("[PROGRESS_RESTORE] Restoring video position to:", effectiveRestoreTime);
                        if (effectiveRestoreTime > maxTimeWatched) {
                          maxTimeWatched = effectiveRestoreTime;
                        }
                        video.currentTime = effectiveRestoreTime;
                      }

                      const startPlayback = () => {
                        const p = video.play();
                        if (p && p.catch) {
                          p.catch((e) => console.log("[PLAY_DEBUG] Autoplay prevented play:", e));
                        }
                        setTimeout(() => { window.isRestoringVideoProgress = false; }, 1000);
                      };

                      if (effectiveRestoreTime > 0.5) {
                        let seekedHandled = false;
                        const onSeeked = () => {
                          if (seekedHandled) return;
                          seekedHandled = true;
                          video.removeEventListener("seeked", onSeeked);
                          startPlayback();
                        };
                        video.addEventListener("seeked", onSeeked, { once: true });
                        setTimeout(onSeeked, 350);
                      } else {
                        startPlayback();
                      }
                    } catch (e) {
                      console.warn("[PROGRESS_RESTORE] Seek restore failed:", e);
                      window.isRestoringVideoProgress = false;
                    }
                  };

                  if (video.readyState >= 1) {
                    performSeekRestore();
                  } else {
                    video.addEventListener("loadedmetadata", performSeekRestore, { once: true });
                    video.addEventListener("canplay", performSeekRestore, { once: true });
                  }
                } else {
                  // Same video file is already loaded — seek if chapter was clicked OR restore saved progress
                  if (effectiveRestoreTime > 0.5) {
                    console.log("[PROGRESS_RESTORE] Same-src resume to:", effectiveRestoreTime);
                    window.isProgrammaticSeek = true;
                    if (effectiveRestoreTime > maxTimeWatched) {
                      maxTimeWatched = effectiveRestoreTime;
                    }
                    video.currentTime = effectiveRestoreTime;
                  }
                  setTimeout(() => { window.isRestoringVideoProgress = false; }, 1000);"""

txt = txt.replace(old_seek_block, new_seek_block)

# 2. Update timeupdate event listener to guard against isRestoringVideoProgress
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
print("Successfully applied robust seek restoration fix to index.html!")
