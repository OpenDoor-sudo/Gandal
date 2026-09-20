"""
test_http_endpoints.py - Live HTTP test for QuietHTTPRequestHandler
"""

import sys
import os
import json
import time
import threading
import shutil
import urllib.request
import http.server
import re

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
            print("Local edge:", data.get("local_edge"))
            assert "local_edge" in data
            assert "cloud_fallback" in data
            assert data["local_edge"]["model"] == "gemma-4-e4b"
            assert ":8080" in data["local_edge"]["endpoint"]
            assert "11434" not in data["local_edge"]["endpoint"]
            assert data["local_edge"]["available"] is False
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

        print("Testing POST /api/gandal_space/ask photosynthesis (honest failure)...")
        photo_data = json.dumps({"prompt": "How does Photosynthesis work?"}).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/ask",
            data=photo_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            print("Photosynthesis success:", data.get("success"), "error:", data.get("error"))
            assert data.get("success") is False
            assert "Gemma" in (data.get("error") or "")
            assert "Comprehensive educational overview" not in json.dumps(data)
        print("POST ask photosynthesis: PASSED!\n")

        print("Testing POST /api/gandal_space/ask Counting to 20...")
        count_data = json.dumps({"prompt": "Counting to 20"}).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/ask",
            data=count_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            kids = (data.get("ui_payload") or {}).get("children") or []
            graphs = [c for c in kids if c.get("type") == "GraphCard"]
            assert data.get("success") is True
            assert graphs and graphs[0].get("model_type") == "counting"
            assert graphs[0].get("count") == 20
            assert "1:" not in (graphs[0].get("formula") or "")
        print("POST ask Counting to 20: PASSED!\n")

        print("Testing POST /api/gandal_space/chat (honest failure)...")
        chat_data = json.dumps({"message": "Why is the sky blue?"}).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/chat",
            data=chat_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            print("Chat success:", data.get("success"), "provider:", data.get("provider"))
            assert data.get("success") is False
            assert "Offline Persona" not in (data.get("provider") or "")
            assert "Gemma" in (data.get("reply") or data.get("error") or "")
        print("POST chat: PASSED!\n")

        print("Testing GET /api/gandal_space/tracks...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/tracks?student_id=HttpTrackTest", timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data.get("success") is True
            assert any(s.get("id") == "mathematics" and s.get("walkable") for s in data.get("subjects") or [])
            assert any(s.get("id") == "physics" and s.get("walkable") for s in data.get("subjects") or [])
            assert any(s.get("id") == "english" and s.get("walkable") for s in data.get("subjects") or [])
        print("GET tracks: PASSED!\n")

        print("Testing POST /api/gandal_space/track/intent...")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/track/intent",
            data=json.dumps({
                "student_id": "HttpTrackTest",
                "message": "I want to learn math from scratch"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data.get("success") is True
            assert data.get("topic", {}).get("title") == "Counting to 20"
            assert "ONE K-12 topic" in (data.get("topic") or {}).get("lesson_prompt", "")
            assert 'model_type "counting"' in (data.get("topic") or {}).get("lesson_prompt", "")
            assert "TWO COLUMNS" in (data.get("topic") or {}).get("lesson_prompt", "")
        print("POST track intent: PASSED!\n")

        print("Testing POST /api/gandal_space/track/start...")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/track/start",
            data=json.dumps({
                "student_id": "HttpTrackTest",
                "subject": "physics",
                "from_scratch": True
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data.get("success") is True
            assert data.get("topic", {}).get("title") == "Our five senses"
            assert "ONE K-12 topic" in (data.get("topic") or {}).get("lesson_prompt", "")
        print("POST track start: PASSED!\n")

        print("Testing POST /api/gandal_space/quiz (Comparing numbers, stub)...")
        os.environ["GOOGLE_API_KEY"] = "AIzaSyMOCK_GANDAL_ONLINE_TEST_KEY"
        os.environ["GANDAL_SPACE_GEMINI_STUB"] = "1"
        quiz_data = json.dumps({
            "topic": "Comparing numbers",
            "topic_id": "math.k2.compare",
            "band": "K–2",
            "context": "Comparing numbers"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{TEST_PORT}/api/gandal_space/quiz",
            data=quiz_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            questions = data.get("questions") or []
            assert data.get("success") is True
            assert len(questions) == 5
            texts = [q.get("question") or "" for q in questions]
            assert len(set(texts)) == 5
            blob = " ".join(texts).lower()
            assert "greater" in blob or "less" in blob or ">" in blob or "<" in blob or "compare" in blob
            banned = "current lesson|change subjects|naming triangle sides|π and circles|jump to geometry|rest of the track"
            assert not re.search(banned, json.dumps(questions), re.I)
        os.environ.pop("GOOGLE_API_KEY", None)
        os.environ.pop("GANDAL_SPACE_GEMINI_STUB", None)
        print("POST quiz Comparing numbers: PASSED!\n")

        # 3. Test Static files
        print("Testing GET /gandal_space/gandal_space.css...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/gandal_space/gandal_space.css", timeout=5) as resp:
            assert resp.status == 200
            css_text = resp.read().decode("utf-8")
            assert "gandal-search-bar-pill" in css_text
            assert "gandal-track-bar" in css_text
            assert "a2ui-counting-chart" in css_text
            assert "a2ui-counting-row" in css_text
            assert "a2ui-compare-chart" in css_text
            assert "a2ui-compare-bar" in css_text
        print("GET gandal_space.css: PASSED!\n")

        print("Testing GET /gandal_space/gandal_space.js...")
        with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/gandal_space/gandal_space.js", timeout=5) as resp:
            assert resp.status == 200
            js_text = resp.read().decode("utf-8")
            assert "GandalSpaceClient" in js_text
            assert "openTrackIntake" in js_text
            assert "enterK12Track" in js_text
            assert "resumeSavedTrack" in js_text
            assert "quizFocusTopic" in js_text
            assert "rememberSavedTrack" in js_text
            assert "showHomeChrome" in js_text
            assert "data-track-leave" in js_text
            assert "bindTrackIntake" in js_text
            assert "bindTrackDelegation" in js_text
            assert "gandalTrackStartBtn" in js_text
            assert "startSelectedTrack" in js_text
            assert "startGandalK12Track" in js_text
            assert "isCountingGraph" in js_text
            assert "buildCountingGraphCard" in js_text
            assert "a2ui-counting-row" in js_text
            assert "isComparingGraph" in js_text
            assert "buildCompareGraphCard" in js_text
            assert "compareChartHtml" in js_text
            assert "Cloud Turbo" not in js_text
            assert "Need Gemma or a Gemini key to generate this quiz" not in js_text
            assert "buildTrackTopicQuizBank" in js_text
            assert "quizMatchesTrackTopic" in js_text
            assert "generatePracticeQuiz" in js_text
            assert "isMetaQuizQuestion" in js_text
            assert "/api/gandal_space/quiz" in js_text
            assert "What comes right after 9 when you count to 20?" in js_text
            assert "rememberSavedTrack(data.current)" in js_text
        print("GET gandal_space.js: PASSED!\n")

        print("=== ALL LIVE HTTP ENDPOINT TESTS PASSED! ===")

    finally:
        server.shutdown()
        server.server_close()
        leftover = os.path.join(PROJECT_ROOT, "student_profiles", "HttpTrackTest")
        if os.path.isdir(leftover):
            shutil.rmtree(leftover)

if __name__ == "__main__":
    run_test()
