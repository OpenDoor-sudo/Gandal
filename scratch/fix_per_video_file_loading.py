import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Ensure loadTextbookPDF saves lastActiveVideoId to localStorage immediately on invocation
old_func_start = """      async function loadTextbookPDF(
        videoId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
        time = null,
        clickedItem = null,
        chapterTitle = "",
      ) {"""

new_func_start = """      async function loadTextbookPDF(
        videoId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
        time = null,
        clickedItem = null,
        chapterTitle = "",
      ) {
        if (videoId) {
          localStorage.setItem("lastActiveVideoId", videoId);
          activeVideoId = videoId;
          window.ACTIVE_DATABASE_VIDEO_ID = videoId;
        }"""

if old_func_start in txt:
    txt = txt.replace(old_func_start, new_func_start)
    print("Successfully updated loadTextbookPDF to save lastActiveVideoId synchronously!")

# 2. Remove defaultLessonStartTime override since 02_Les problèmes sanitaires.mp4 is its own video file
old_seek_calc = """                let defaultLessonStartTime = 0;
                const vidCheck = (data.video_id || videoId || "").toLowerCase();
                if (vidCheck.includes("sanitaire")) {
                  defaultLessonStartTime = 72; // 01:12 in lecture video where teacher starts Les Problères Sanitaires
                } else if (vidCheck.includes("alimentaire")) {
                  defaultLessonStartTime = 61; // 01:01 in lecture video where teacher starts Les Problères Alimentaires
                }

                const rawSavedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;
                const savedTime = rawSavedTime > 0 ? rawSavedTime : defaultLessonStartTime;"""

new_seek_calc = """                const savedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;"""

if old_seek_calc in txt:
    txt = txt.replace(old_seek_calc, new_seek_calc)
    print("Successfully cleaned up timestamp seek override for independent video files!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Applied video loading fixes to index.html!")
