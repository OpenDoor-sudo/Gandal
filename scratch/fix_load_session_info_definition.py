import os

py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

# Remove buggy top lines 1-20
if py_txt.startswith("def save_session_info"):
    pos = py_txt.find("# display_client.py")
    if pos != -1:
        py_txt = py_txt[pos:]

session_funcs = """def load_session_info():
    session_data = {}
    try:
        if os.path.exists(SESSION_JSON_PATH):
            with open(SESSION_JSON_PATH, "r", encoding="utf-8") as f:
                session_data = json.load(f)
    except Exception as e:
        print(f"[SESSION LOAD WARN] {e}")
    return session_data

def save_session_info(video_id, pdf_path=None):
    try:
        session_data = load_session_info()
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

if "def load_session_info" not in py_txt:
    insert_pos = py_txt.find("SESSION_JSON_PATH =")
    if insert_pos != -1:
        line_end = py_txt.find("\n", insert_pos)
        py_txt = py_txt[:line_end+1] + "\n" + session_funcs + "\n" + py_txt[line_end+1:]

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully defined load_session_info and save_session_info cleanly in display_client.py!")
