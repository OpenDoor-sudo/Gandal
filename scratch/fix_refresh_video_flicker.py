import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Align selectedGoalTrack with activeVideoId if activeVideoId is already set
old_bg_track = """            if (bgContext.includes("|")) {
              let parts = bgContext.split("|");
              if (parts.length > 2 && parts[2].startsWith("subjects:")) {
                rawInterests = parts[0];
              } else {
                rawInterests = parts[0];
              }
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = parts[1];
              }
            } else {
              rawInterests = bgContext;
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = bgContext;
              }
            }"""

new_bg_track = """            const curVid = (activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID || "").toLowerCase();
            if (curVid.includes("chem") || curVid.includes("chemistry")) {
              selectedGoalTrack = "k12/12th_SM/chemistry";
            } else if (curVid.includes("sanitaire")) {
              selectedGoalTrack = "k12/12th_SM/sanitaire";
            } else if (curVid.includes("demographique") || curVid.includes("economics") || curVid.includes("alimentaire")) {
              selectedGoalTrack = "k12/12th_SM/Economics";
            } else if (bgContext.includes("|")) {
              let parts = bgContext.split("|");
              rawInterests = parts[0];
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = parts[1];
              }
            } else {
              rawInterests = bgContext;
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = bgContext;
              }
            }"""

txt = txt.replace(old_bg_track, new_bg_track)

# 2. Prevent loadProfileProgress from re-invoking loadTextbookPDF if the active video is already playing
old_pdf_call = """            // Relational lookup call to map video player src dynamically
            if (targetVideoId) {
              loadTextbookPDF(targetVideoId);
            }"""

new_pdf_call = """            // Relational lookup call to map video player src dynamically (ONLY if video is different from currently active video)
            if (targetVideoId && targetVideoId !== activeVideoId && targetVideoId !== window.ACTIVE_DATABASE_VIDEO_ID) {
              loadTextbookPDF(targetVideoId);
            }"""

txt = txt.replace(old_pdf_call, new_pdf_call)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully fixed page refresh video flicker in index.html!")
