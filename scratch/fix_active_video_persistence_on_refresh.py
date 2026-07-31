import os

# 1. Update display_client.py to add /get_active_session route
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

get_session_route = """@routes.get('/get_active_session')
async def get_active_session_route(request):
    try:
        info = load_session_info()
        return web.json_response({
            "status": "success",
            "active_video_id": info.get("active_video_id"),
            "active_pdf_path": info.get("active_pdf_path"),
            "active_locale": info.get("active_locale", "fr_FR")
        })
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=500)
"""

if "/get_active_session" not in py_txt:
    insert_pos = py_txt.find("@routes.post('/save_active_session')")
    if insert_pos != -1:
        py_txt = py_txt[:insert_pos] + get_session_route + "\n\n" + py_txt[insert_pos:]
        open(py_path, 'w', encoding='utf-8').write(py_txt)
        print("Successfully added /get_active_session route to display_client.py!")

# 2. Update index.html loadTextbookPDF and window.onload
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Update loadTextbookPDF to save active video ID to localStorage
old_pdf_start = """      async function loadTextbookPDF(
        videoId = "vid_economics_01",
        seekTime = null,
        chapterItem = null,
        chapterTitle = null,
      ) {"""

new_pdf_start = """      async function loadTextbookPDF(
        videoId = "vid_economics_01",
        seekTime = null,
        chapterItem = null,
        chapterTitle = null,
      ) {
        if (videoId) {
          localStorage.setItem("lastActiveVideoId", videoId);
        }"""

if old_pdf_start in txt:
    txt = txt.replace(old_pdf_start, new_pdf_start)

# Update window.onload to query active session / localStorage before loading textbook
old_onload = """        // Load active video's data, textbook, and preprocessed timestamps/flashcards
        loadTextbookPDF(activeVideoId);"""

new_onload = """        // Load active video's data, textbook, and preprocessed timestamps/flashcards
        (async function bootActiveSessionVideo() {
          let lastVid = localStorage.getItem("lastActiveVideoId");
          try {
            const sessionResp = await fetch('/get_active_session');
            const sessionData = await sessionResp.json();
            if (sessionData && sessionData.active_video_id) {
              lastVid = sessionData.active_video_id;
            }
          } catch(e) {
            console.warn('[SESSION BOOT WARN]', e);
          }

          if (lastVid) {
            activeVideoId = lastVid;
          }
          loadTextbookPDF(activeVideoId);
        })();"""

if old_onload in txt:
    txt = txt.replace(old_onload, new_onload)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated index.html window.onload to restore active lesson on refresh!")
