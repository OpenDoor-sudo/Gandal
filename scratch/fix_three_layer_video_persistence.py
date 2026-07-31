import os

# 1. Update display_client.py save_session_info and do_GET / do_POST
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

save_info_func = """def save_session_info(video_id, pdf_path=None):
    try:
        session_data = {}
        if os.path.exists(SESSION_JSON_PATH):
            try:
                with open(SESSION_JSON_PATH, "r", encoding="utf-8") as f:
                    session_data = json.load(f)
            except Exception:
                pass
        if video_id:
            session_data["active_video_id"] = video_id
        if pdf_path:
            session_data["active_pdf_path"] = pdf_path
        with open(SESSION_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(session_data, f, indent=2)
        print(f"[SESSION] Saved session info: active_video_id={video_id}", flush=True)
    except Exception as e:
        print(f"[SESSION ERROR] Failed to save session info: {e}", flush=True)
"""

# Replace or add save_session_info in display_client.py
if "def save_session_info" in py_txt:
    start_pos = py_txt.find("def save_session_info")
    end_pos = py_txt.find("def ", start_pos + 1)
    if start_pos != -1 and end_pos != -1:
        py_txt = py_txt[:start_pos] + save_info_func + "\n\n" + py_txt[end_pos:]
else:
    py_txt = save_info_func + "\n\n" + py_txt

# Update do_GET index hydration in display_client.py so it respects valid active_video_id in active_session.json
old_hydration = """                if not v_id or v_id in ["vid_economics_01", "vid_physics_01", "vid_chemistry_organic_chemistry"]:
                    if active_track in ["k12/12th_SM/Economics", "k12/TSM/Economics", "calculus", "12th Grade"]:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" """

new_hydration = """                if not v_id:
                    if active_track in ["k12/12th_SM/Economics", "k12/TSM/Economics", "calculus", "12th Grade"]:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" """

if old_hydration in py_txt:
    py_txt = py_txt.replace(old_hydration, new_hydration)

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py with robust session persistence!")

# 2. Update index.html bootActiveSessionVideo logic
html_path = 'index.html'
html_txt = open(html_path, 'r', encoding='utf-8').read()

old_boot_session = """        (async function bootActiveSessionVideo() {
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

new_boot_session = """        (async function bootActiveSessionVideo() {
          // Priority 1: Check localStorage first for instant page reload restoration
          let lastVid = localStorage.getItem("lastActiveVideoId");

          // Priority 2: Query active_session.json from server
          try {
            const sessionResp = await fetch('/get_active_session');
            if (sessionResp.ok) {
              const sessionData = await sessionResp.json();
              if (sessionData && sessionData.active_video_id) {
                lastVid = sessionData.active_video_id;
              }
            }
          } catch(e) {
            console.warn('[SESSION BOOT WARN]', e);
          }

          if (lastVid) {
            activeVideoId = lastVid;
            window.ACTIVE_DATABASE_VIDEO_ID = lastVid;
          }

          loadTextbookPDF(activeVideoId);
        })();"""

if old_boot_session in html_txt:
    html_txt = html_txt.replace(old_boot_session, new_boot_session)
    open(html_path, 'w', encoding='utf-8').write(html_txt)
    print("Successfully updated index.html bootActiveSessionVideo sequence!")
