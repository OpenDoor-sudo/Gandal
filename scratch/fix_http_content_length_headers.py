import os

# 1. Update display_client.py get_active_session and save_active_session with Content-Length headers
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_get_handler = """        if clean_path == '/get_active_session':
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

new_get_handler = """        if clean_path == '/get_active_session':
            info = load_session_info()
            res_payload = {
                "status": "success",
                "active_video_id": info.get("active_video_id"),
                "active_pdf_path": info.get("active_pdf_path"),
                "active_locale": info.get("active_locale", "fr_FR")
            }
            body_bytes = json.dumps(res_payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body_bytes)
            return"""

if old_get_handler in py_txt:
    py_txt = py_txt.replace(old_get_handler, new_get_handler)

old_post_handler = """        if clean_path == '/save_active_session':
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
            return"""

new_post_handler = """        if clean_path == '/save_active_session':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                v_id = data.get("active_video_id")
                p_path = data.get("active_pdf_path")
                if v_id:
                    save_session_info(v_id, p_path)
                    print(f"[SESSION HTTP POST] Saved active_session.json video_id={v_id}", flush=True)
                res_bytes = json.dumps({"status": "success", "active_video_id": v_id}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
            except Exception as e:
                err_bytes = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.end_headers()
                self.wfile.write(err_bytes)
            return"""

if old_post_handler in py_txt:
    py_txt = py_txt.replace(old_post_handler, new_post_handler)

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py HTTP handlers with explicit Content-Length headers!")

# 2. Update index.html bootActiveSessionVideo sequence
html_path = 'index.html'
html_txt = open(html_path, 'r', encoding='utf-8').read()

old_boot_seq = """        (async function bootActiveSessionVideo() {
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

new_boot_seq = """        (async function bootActiveSessionVideo() {
          let lastVid = localStorage.getItem("lastActiveVideoId");

          // Priority 1: If localStorage has saved video ID, set it immediately
          if (lastVid) {
            activeVideoId = lastVid;
            window.ACTIVE_DATABASE_VIDEO_ID = lastVid;
          }

          // Priority 2: Query active_session.json from server asynchronously
          try {
            const sessionResp = await fetch('/get_active_session');
            if (sessionResp.ok) {
              const sessionData = await sessionResp.json();
              if (sessionData && sessionData.active_video_id) {
                lastVid = sessionData.active_video_id;
                activeVideoId = lastVid;
                window.ACTIVE_DATABASE_VIDEO_ID = lastVid;
              }
            }
          } catch(e) {
            console.warn('[SESSION BOOT WARN]', e);
          }

          loadTextbookPDF(activeVideoId);
        })();"""

if old_boot_seq in html_txt:
    html_txt = html_txt.replace(old_boot_seq, new_boot_seq)

open(html_path, 'w', encoding='utf-8').write(html_txt)
print("Successfully updated index.html bootActiveSessionVideo to apply localStorage synchronously!")
