"""
test_gandal_space.py - Automated verification for Gandal Space
Tests:
  1. Agent engine status points at Gemma 4 E4B / LOCAL_LLM_URL :8080
  2. Math curriculum chip still works when Gemma is down
  3. Phonics query with PronunciationCard
  4. Audio pronunciation evaluation
  5. Photosynthesis fails honestly when Gemma is down (no fake biology stub)
  6. Chat fails honestly when Gemma is down (no Offline Persona)
  7. Mock OpenAI-compat Gemma on LOCAL_LLM_URL serves ask + chat
"""

import sys
import os
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

os.environ.pop("GOOGLE_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("LOCAL_LLM_URL", None)
os.environ.pop("LOCAL_LLM_MODEL", None)

from gandal_space import agent_engine as ae


MOCK_A2UI = {
    "type": "Container",
    "direction": "vertical",
    "title": "Photosynthesis (Gemma mock)",
    "subject": "Biology",
    "summary": "Chlorophyll captures photons to split water and fix CO2 into sugar.",
    "suggested_followups": ["What is the Calvin cycle?"],
    "children": [
        {
            "type": "TextBlock",
            "content": "Light reactions in the thylakoid membrane produce ATP and NADPH.",
        },
        {
            "type": "QuizCard",
            "question": "Where do the light-dependent reactions occur?",
            "options": ["Thylakoid membrane", "Cytoplasm", "Nucleus", "Cell wall"],
            "answer_index": 0,
            "explanation": "Photosystems sit in the thylakoid membrane of the chloroplast.",
        },
    ],
}


class _MockGemmaHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path.rstrip("/").endswith("/models"):
            body = json.dumps({"data": [{"id": "gemma-4-e4b"}]}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if not self.path.rstrip("/").endswith("/chat/completions"):
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0) or 0)
        raw = self.rfile.read(length)
        req = json.loads(raw.decode("utf-8") or "{}")
        messages = req.get("messages") or []
        system = ""
        for m in messages:
            if m.get("role") == "system":
                system = m.get("content") or ""
                break
        if "A2UI" in system or "JSON object" in system:
            content = json.dumps(MOCK_A2UI)
        else:
            content = "Chlorophyll captures photons; this reply is from mock Gemma 4 E4B."
        body = json.dumps({
            "choices": [{"message": {"role": "assistant", "content": content}}]
        }).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _start_mock():
    server = HTTPServer(("127.0.0.1", 0), _MockGemmaHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def run_tests():
    engine = ae.GandalSpaceEngine()

    print("=== TEST 1: System Status (Gemma :8080, not Ollama :11434) ===")
    status = engine.get_system_status()
    print("Local Edge Available:", status["local_edge"]["available"])
    print("Cloud Fallback Available:", status["cloud_fallback"]["available"])
    print("Active Preference:", status["active_preference"])
    print("Endpoint:", status["local_edge"]["endpoint"])
    print("Model:", status["local_edge"]["model"])
    assert "local_edge" in status
    assert "cloud_fallback" in status
    assert status["local_edge"]["model"] == "gemma-4-e4b"
    endpoint = status["local_edge"]["endpoint"]
    assert ":8080" in endpoint
    assert "11434" not in endpoint
    assert status["local_edge"]["available"] is False
    assert status["cloud_fallback"]["available"] is False
    assert "Gemma" in status["active_preference"] or "Unavailable" in status["active_preference"]
    print("Test 1 PASSED!\n")

    print("=== TEST 2: Math Calculus Query: area(x^2, 0, 2) ===")
    res_math = engine.process_query("area(x^2, 0, 2)")
    assert res_math["success"] is True
    payload_math = res_math["ui_payload"]
    print("Provider:", res_math["provider"])
    print("Title:", payload_math.get("title"))
    print("Subject:", payload_math.get("subject"))
    print("Child Types:", [c.get("type") for c in payload_math.get("children", [])])
    assert any(c.get("type") in ["FormulaCard", "Card", "TextBlock"] for c in payload_math.get("children", []))
    print("Test 2 PASSED!\n")

    print("=== TEST 3: Phonics & Alphabet Query: Practice letter A ===")
    res_phonics = engine.process_query("practice reading the alphabet letter A")
    assert res_phonics["success"] is True
    payload_phonics = res_phonics["ui_payload"]
    print("Provider:", res_phonics["provider"])
    print("Title:", payload_phonics.get("title"))
    child_types = [c.get("type") for c in payload_phonics.get("children", [])]
    print("Child Types:", child_types)
    assert "PronunciationCard" in child_types or "Card" in child_types
    print("Test 3 PASSED!\n")

    print("=== TEST 4: Pronunciation Audio Evaluation ===")
    res_audio = engine.evaluate_pronunciation(
        target_letter="A",
        expected_phoneme="/eɪ/",
        student_transcript="A Apple"
    )
    print("Audio Feedback:", res_audio)
    assert res_audio["type"] == "AudioFeedback"
    assert res_audio["status"] == "success"
    assert res_audio["score"] >= 90
    print("Test 4 PASSED!\n")

    print("=== TEST 5: Photosynthesis is honest failure without Gemma ===")
    res_photo = engine.process_query("How does Photosynthesis work?")
    print("Photosynthesis result:", {k: res_photo.get(k) for k in ("success", "engine_type", "error", "provider")})
    assert res_photo["success"] is False
    assert res_photo.get("engine_type") == "unavailable"
    err = (res_photo.get("error") or "").lower()
    assert "gemma" in err and "8080" in err
    payload = res_photo.get("ui_payload") or {}
    summary = (payload.get("summary") or "")
    assert "Comprehensive educational overview" not in summary
    print("Test 5 PASSED!\n")

    print("=== TEST 6: Chat is honest failure without Gemma ===")
    chat = engine.chat_with_gandho("Why is the sky blue?")
    print("Chat:", {k: chat.get(k) for k in ("success", "provider")})
    print("Reply:", (chat.get("reply") or "")[:160])
    assert chat["success"] is False
    assert "Offline Persona" not in (chat.get("provider") or "")
    assert "gemma" in (chat.get("reply") or "").lower()
    print("Test 6 PASSED!\n")

    print("=== TEST 7: Mock Gemma OpenAI-compat wiring ===")
    mock = _start_mock()
    try:
        os.environ["LOCAL_LLM_URL"] = f"http://127.0.0.1:{mock.server_address[1]}/v1"
        os.environ["LOCAL_LLM_MODEL"] = "gemma-4-e4b"
        live = ae.GandalSpaceEngine()
        live_status = live.get_system_status()
        print("Mock status:", live_status["local_edge"])
        assert live_status["local_edge"]["available"] is True
        assert live_status["active_preference"] == "Edge/Gemma"

        asked = live.process_query("How does Photosynthesis work?")
        print("Mock ask provider:", asked.get("provider"), "title:", (asked.get("ui_payload") or {}).get("title"))
        assert asked["success"] is True
        assert asked["engine_type"] == "offline_edge"
        assert "Gemma 4 E4B" in asked["provider"]
        assert asked["ui_payload"]["title"] == "Photosynthesis (Gemma mock)"
        assert "Comprehensive educational overview" not in (asked["ui_payload"].get("summary") or "")

        talked = live.chat_with_gandho("Explain chlorophyll in one sentence.")
        print("Mock chat:", talked.get("provider"), talked.get("reply"))
        assert talked["success"] is True
        assert "mock Gemma 4 E4B" in talked["reply"]
        assert talked["provider"].startswith("Gemma 4 E4B")
    finally:
        mock.shutdown()
        os.environ.pop("LOCAL_LLM_URL", None)
        os.environ.pop("LOCAL_LLM_MODEL", None)
    print("Test 7 PASSED!\n")

    print("=== TEST 8: Gemini online fallback when Gemma is down ===")
    os.environ["GOOGLE_API_KEY"] = "AIzaSyMOCK_GANDAL_ONLINE_TEST_KEY"
    os.environ["GANDAL_SPACE_GEMINI_STUB"] = "1"
    os.environ.pop("LOCAL_LLM_URL", None)
    cloud = ae.GandalSpaceEngine()
    cloud_status = cloud.get_system_status()
    print("Cloud status:", cloud_status["active_preference"], cloud_status["cloud_fallback"])
    assert cloud_status["local_edge"]["available"] is False
    assert cloud_status["cloud_fallback"]["available"] is True
    assert cloud_status["active_preference"] == "Google Gemini (Cloud Fallback)"
    asked = cloud.process_query("Teach this ONE K-12 topic. Topic: Counting to 20. Band: K–2.")
    print("Cloud ask:", asked.get("provider"), asked.get("engine_type"), (asked.get("ui_payload") or {}).get("title"))
    assert asked["success"] is True
    assert asked["engine_type"] == "cloud_fallback"
    assert "Gemini" in asked["provider"]
    assert (asked.get("ui_payload") or {}).get("title") == "Counting to 20"
    os.environ.pop("GOOGLE_API_KEY", None)
    os.environ.pop("GANDAL_SPACE_GEMINI_STUB", None)
    print("Test 8 PASSED!\n")

    print("=== ALL AUTOMATED TESTS PASSED! ===")


if __name__ == "__main__":
    run_tests()
