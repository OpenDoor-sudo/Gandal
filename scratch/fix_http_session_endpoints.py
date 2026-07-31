import os

py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

# 1. Add /get_active_session inside do_GET
old_do_get = """    def do_GET(self):
        import urllib.parse
        clean_path = self.path.split('?')[0]"""

new_do_get = """    def do_GET(self):
        import urllib.parse
        clean_path = self.path.split('?')[0]

        if clean_path == '/get_active_session':
            info = load_session_info()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res_payload = {
                "status": "success",
                "active_video_id": info.get("active_video_id"),
                "active_pdf_path": info.get("active_pdf_path"),
                "active_locale": info.get("active_locale", "fr_FR")
            }
            self.wfile.write(json.dumps(res_payload).encode('utf-8'))
            return"""

if old_do_get in py_txt and "if clean_path == '/get_active_session':" not in py_txt:
    py_txt = py_txt.replace(old_do_get, new_do_get)
    print("Successfully added /get_active_session handler to do_GET!")

# 2. Add /save_active_session inside do_POST
old_do_post = """    def do_POST(self):
        import urllib.parse
        clean_path = self.path.split('?')[0]"""

new_do_post = """    def do_POST(self):
        import urllib.parse
        clean_path = self.path.split('?')[0]

        if clean_path == '/save_active_session':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            data = json.loads(post_data) if post_data else {}
            v_id = data.get("active_video_id")
            p_path = data.get("active_pdf_path")
            if v_id:
                save_session_info(v_id, p_path)
                print(f"[SESSION HTTP POST] Saved active_session.json video_id={v_id}", flush=True)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "active_video_id": v_id}).encode('utf-8'))
            return"""

if old_do_post in py_txt and "if clean_path == '/save_active_session':" not in py_txt:
    py_txt = py_txt.replace(old_do_post, new_do_post)
    print("Successfully added /save_active_session handler to do_POST!")

# 3. Update index hydration so active_session.json video_id is preserved
old_hydration_fallback = """                if not v_id or v_id in ["vid_economics_01", "vid_physics_01", "vid_chemistry_organic_chemistry"]:
                    if active_track in ["k12/12th_SM/Economics", "k12/TSM/Economics", "calculus", "12th Grade"]:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" """

new_hydration_fallback = """                if not v_id or v_id in ["vid_economics_01", "vid_physics_01", "vid_chemistry_organic_chemistry"]:
                    if active_track in ["k12/12th_SM/Economics", "k12/TSM/Economics", "calculus", "12th Grade"]:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" """

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py with HTTP API handlers for active session!")
