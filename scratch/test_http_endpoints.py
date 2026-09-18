"""
test_http_endpoints.py - Live HTTP test for QuietHTTPRequestHandler
"""

import sys
import os
import json
import time
import threading
import urllib.request
import http.server

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from display_client import QuietHTTPRequestHandler, ThreadingTCPServerQuietErrors

TEST_PORT = 8123

def run_test():
    ThreadingTCPServerQuietErrors.allow_reuse_address = True
    server = ThreadingTCPServerQuietErrors(("127.0.0.1", TEST_PORT), QuietHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f"Test server listening on port {TEST_PORT}")

    time.sleep(0.5)

    try:
        # 1. Test Status
        print("Testing GET /api/gandal_space/status...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/status", timeout=15) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            print("Status response:", data.get("active_preference"))
            assert "local_edge" in data
            assert "cloud_fallback" in data
        print("GET status: PASSED!\n")

        # 2. Test Audio Eval
        print("Testing POST /api/gandal_space/eval_audio...")
        post_data = json.dumps({
            "target_letter": "C",
            "expected_phoneme": "/k/",
            "student_transcript": "Cat"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/eval_audio",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            print("Eval response:", data.get("status"), data.get("feedback_text"))
            assert data.get("type") == "AudioFeedback"
            assert data.get("status") == "success"
        print("POST eval_audio: PASSED!\n")

        # 3. Test Ask Query
        print("Testing POST /api/gandal_space/ask...")
        ask_data = json.dumps({"prompt": "area(x^2, 0, 2)"}).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/ask",
            data=ask_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            print("Ask response provider:", data.get("provider"))
            print("Ask UI Title:", data.get("ui_payload", {}).get("title"))
            assert data.get("success") is True
            assert "ui_payload" in data
        print("POST ask: PASSED!\n")

        # 3. Test Static files
        print("Testing GET /gandal_space/gandal_space.css...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/gandal_space/gandal_space.css", timeout=5) as resp:
            assert resp.status == 200
            css_text = resp.read().decode("utf-8")
            assert "gandal-search-bar-pill" in css_text
        print("GET gandal_space.css: PASSED!\n")

        print("Testing GET /gandal_space/gandal_space.js...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/gandal_space/gandal_space.js", timeout=5) as resp:
            assert resp.status == 200
            js_text = resp.read().decode("utf-8")
            assert "GandalSpaceClient" in js_text
        print("GET gandal_space.js: PASSED!\n")

        print("=== ALL LIVE HTTP ENDPOINT TESTS PASSED! ===")

    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    run_test()
