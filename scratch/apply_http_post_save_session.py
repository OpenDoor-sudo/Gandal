import os

py_path = 'display_client.py'
txt = open(py_path, 'r', encoding='utf-8').read()

old_dopost_start = """    def do_POST(self):
        clean_path = self.path.split('?')[0]

        # Route for updating active view state (dashboard, split_workspace, evaluation, screen_share)"""

new_dopost_start = """    def do_POST(self):
        clean_path = self.path.split('?')[0]

        if clean_path == '/save_active_session':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
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
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            return

        # Route for updating active view state (dashboard, split_workspace, evaluation, screen_share)"""

if old_dopost_start in txt:
    txt = txt.replace(old_dopost_start, new_dopost_start)
    open(py_path, 'w', encoding='utf-8').write(txt)
    print("Successfully added /save_active_session handler to do_POST in display_client.py!")
