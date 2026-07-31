import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update loadTextbookPDF in index.html to set video title overlay and seek to lesson timestamp
old_subel_logic = """            const subEl = document.getElementById("videoSubject");
            if (subEl) {
              if (activeTitle) {
                subEl.innerText = activeTitle.toUpperCase();
              } else {
                if (videoId === "vid_economics_01") {
                  subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
                } else if (videoId === "vid_calculus_01") {
                  subEl.innerText = "CHAPITRE 1: CALCULUS & DERIVATIVES";
                } else if (videoId === "vid_physics_01") {
                  subEl.innerText = "CHAPITRE 1: HARMONIC OSCILLATORS";
                } else if (videoId === "vid_philosophy_01") {
                  subEl.innerText = "CHAPITRE 1: STOIC PHILOSOPHY";
                } else {
                  subEl.innerText = "CHAPTER 1: LESSON INTRO";
                }
              }
            }"""

new_subel_logic = """            const subEl = document.getElementById("videoSubject");
            if (subEl) {
              const vLower = (data.video_id || videoId || "").toLowerCase();
              if (vLower.includes("sanitaire")) {
                subEl.innerText = "LES PROBLÈMES SANITAIRES";
              } else if (vLower.includes("alimentaire")) {
                subEl.innerText = "LES PROBLÈMES ALIMENTAIRES";
              } else if (vLower.includes("demographique")) {
                subEl.innerText = "LES PROBLÈMES DÉMOGRAPHIQUES";
              } else if (activeTitle) {
                subEl.innerText = activeTitle.toUpperCase();
              } else {
                subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
              }
            }"""

if old_subel_logic in txt:
    txt = txt.replace(old_subel_logic, new_subel_logic)
    print("Successfully updated videoSubject title overlay logic!")

# 2. Add automatic lesson start seeking for Sanitaires and Alimentaires in loadTextbookPDF
old_video_seek_start = """                const dbSavedTime = parseFloat(data.last_position || 0);
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

new_video_seek_start = """                const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                let defaultLessonStartTime = 0;
                const vidCheck = (data.video_id || videoId || "").toLowerCase();
                if (vidCheck.includes("sanitaire")) {
                  defaultLessonStartTime = 72; // 01:12 in lecture video where teacher starts Les Problèmes Sanitaires
                } else if (vidCheck.includes("alimentaire")) {
                  defaultLessonStartTime = 61; // 01:01 in lecture video where teacher starts Les Problèmes Alimentaires
                }

                const rawSavedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;
                const savedTime = rawSavedTime > 0 ? rawSavedTime : defaultLessonStartTime;
                const savedMaxTime = dbSavedMaxTime > 0 ? dbSavedMaxTime : localSavedMaxTime;
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;"""

if old_video_seek_start in txt:
    txt = txt.replace(old_video_seek_start, new_video_seek_start)
    print("Successfully added lesson start timestamp seeking logic!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied overlay title and timestamp seeking fixes to index.html!")
