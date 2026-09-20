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
        user = ""
        for m in messages:
            if m.get("role") == "user":
                user += " " + str(m.get("content") or "")
        if "five distinct" in user.lower() or "practice quiz" in user.lower() or "five quizcard" in user.lower():
            content = json.dumps({
                "type": "Container",
                "title": "Comparing numbers",
                "children": [
                    {
                        "type": "QuizCard",
                        "question": "Which number is greater: 8 or 3?",
                        "options": ["8", "3", "5", "11"],
                        "answer_index": 0,
                        "explanation": "8 is greater than 3.",
                    },
                    {
                        "type": "QuizCard",
                        "question": "Which symbol makes this true: 9 __ 4?",
                        "options": [">", "<", "=", "+"],
                        "answer_index": 0,
                        "explanation": "9 > 4.",
                    },
                    {
                        "type": "QuizCard",
                        "question": "Which number is less: 12 or 15?",
                        "options": ["12", "15", "27", "3"],
                        "answer_index": 0,
                        "explanation": "12 < 15.",
                    },
                    {
                        "type": "QuizCard",
                        "question": "Compare 6 and 6. Which is true?",
                        "options": ["6 = 6", "6 > 6", "6 < 6", "6 is greater"],
                        "answer_index": 0,
                        "explanation": "Equal numbers use =.",
                    },
                    {
                        "type": "QuizCard",
                        "question": "Which sentence is correct: 2 compared with 7?",
                        "options": ["2 is less than 7", "2 is greater than 7", "2 equals 7", "They cannot be compared"],
                        "answer_index": 0,
                        "explanation": "2 < 7.",
                    },
                ],
            })
        elif "practice quizzes" in system.lower() or "exactly 5" in system.lower():
            content = json.dumps({
                "questions": [
                    {
                        "question": "Which number is greater: 8 or 3?",
                        "options": ["8", "3", "5", "11"],
                        "answer_index": 0,
                        "explanation": "8 is greater than 3.",
                    },
                    {
                        "question": "Which symbol makes this true: 9 __ 4?",
                        "options": [">", "<", "=", "+"],
                        "answer_index": 0,
                        "explanation": "9 > 4.",
                    },
                    {
                        "question": "Which number is less: 12 or 15?",
                        "options": ["12", "15", "27", "3"],
                        "answer_index": 0,
                        "explanation": "12 < 15.",
                    },
                    {
                        "question": "Compare 6 and 6. Which is true?",
                        "options": ["6 = 6", "6 > 6", "6 < 6", "6 is greater"],
                        "answer_index": 0,
                        "explanation": "Equal numbers use =.",
                    },
                    {
                        "question": "Which sentence is correct: 2 compared with 7?",
                        "options": ["2 is less than 7", "2 is greater than 7", "2 equals 7", "They cannot be compared"],
                        "answer_index": 0,
                        "explanation": "2 < 7.",
                    },
                ]
            })
        elif "A2UI" in system or "JSON object" in system:
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

    print("=== TEST 9: Counting GraphCard is two-column; other graphs unchanged ===")
    res_count = engine.process_query("Counting to 20")
    assert res_count["success"] is True
    kids = (res_count.get("ui_payload") or {}).get("children") or []
    count_graphs = [c for c in kids if c.get("type") == "GraphCard"]
    assert len(count_graphs) == 1
    assert count_graphs[0].get("model_type") == "counting"
    assert count_graphs[0].get("count") == 20
    assert "1:" not in (count_graphs[0].get("formula") or "")
    assert "●" not in (count_graphs[0].get("formula") or "")

    wrapped = {
        "type": "Container",
        "title": "Each number represents a quantity.",
        "children": [{
            "type": "GraphCard",
            "model_type": "function_plot",
            "title": "Each number represents a quantity.",
            "formula": "1:● 2:●● 3:●●● 4:●●●● 5:●●●●●",
            "description": "This interactive visual shows a group of objects. 1:● 2:●● 3:●●●",
        }],
    }
    out = ae.normalize_counting_graph_cards(wrapped, "Counting to 20")
    g = out["children"][0]
    assert g["model_type"] == "counting"
    assert g["count"] == 20
    assert "1:" not in (g.get("formula") or "")
    assert "1:" not in (g.get("description") or "")
    assert "This interactive visual shows a group of objects." in (g.get("description") or "")

    geo = {
        "type": "Container",
        "title": "Triangle",
        "children": [{
            "type": "GraphCard",
            "model_type": "geometry_triangle",
            "title": "Triangle ABC",
            "formula": "triangle",
        }],
    }
    geo_out = ae.normalize_counting_graph_cards(geo, "triangle")
    assert geo_out["children"][0]["model_type"] == "geometry_triangle"

    res_area = engine.process_query("area(x^2, 0, 2)")
    area_graphs = [c for c in (res_area.get("ui_payload") or {}).get("children") or [] if c.get("type") == "GraphCard"]
    assert area_graphs
    assert area_graphs[0].get("model_type") != "counting"
    assert area_graphs[0].get("formula") == "x^2"
    print("Test 9 PASSED!\n")

    print("=== TEST 10: Dynamic Quiz me — 5 distinct content MCQs, no meta pad ===")
    meta = {
        "question": 'Which statement is true about "Comparing numbers"?',
        "options": [
            "It is the current lesson (K–2).",
            "It is about naming triangle sides.",
            "It is only about π and circles.",
            "It is finished and we should change subjects.",
        ],
        "answer_index": 0,
        "explanation": "Stay with Comparing numbers.",
    }
    assert ae.is_meta_quiz_item(meta) is True
    assembled = ae.assemble_practice_quiz(
        "Comparing numbers",
        {"questions": [meta]},
        band="K–2",
        topic_id="math.k2.compare",
    )
    assert len(assembled) == 5
    assert all(not ae.is_meta_quiz_item(q) for q in assembled)
    assert len({q["question"] for q in assembled}) == 5
    compare_blob = " ".join(q["question"] for q in assembled).lower()
    assert "greater" in compare_blob or "less" in compare_blob or "compare" in compare_blob

    alphabet = ae.topic_derived_content_quiz("The English alphabet", topic_id="eng.k2.alphabet")
    assert len(alphabet) == 5
    assert len({q["question"] for q in alphabet}) == 5
    assert all(not ae.is_meta_quiz_item(q) for q in alphabet)
    alpha_blob = " ".join(q["question"] for q in alphabet).lower()
    assert "letter" in alpha_blob or "alphabet" in alpha_blob

    dead = ae.GandalSpaceEngine()
    no_llm = dead.generate_practice_quiz("Comparing numbers", topic_id="math.k2.compare")
    assert no_llm["success"] is False
    assert "gemma" in (no_llm.get("error") or "").lower()
    assert no_llm.get("questions") == []

    os.environ["GOOGLE_API_KEY"] = "AIzaSyMOCK_GANDAL_ONLINE_TEST_KEY"
    os.environ["GANDAL_SPACE_GEMINI_STUB"] = "1"
    cloud = ae.GandalSpaceEngine()
    stub_quiz = cloud.generate_practice_quiz(
        "Comparing numbers",
        context="Comparing numbers",
        band="K–2",
        topic_id="math.k2.compare",
    )
    assert stub_quiz["success"] is True
    assert stub_quiz["engine_type"] == "cloud_fallback"
    assert "Gemini" in stub_quiz["provider"]
    qs = stub_quiz["questions"]
    assert len(qs) == 5
    assert len({q["question"] for q in qs}) == 5
    assert all(not ae.is_meta_quiz_item(q) for q in qs)
    stub_blob = " ".join(q["question"] for q in qs).lower()
    assert any(k in stub_blob for k in ("greater", "less", "compare", ">", "<", "="))

    silent = ae.GandalSpaceEngine()
    silent._query_gemini = lambda prompt, system_instruction=None: None
    silent._query_local_llm = lambda prompt, system_instruction=None: None
    despite = silent.generate_practice_quiz("Comparing numbers", topic_id="math.k2.compare")
    assert despite["success"] is True
    assert despite["engine_type"] == "cloud_fallback"
    assert len(despite["questions"]) == 5
    os.environ.pop("GOOGLE_API_KEY", None)
    os.environ.pop("GANDAL_SPACE_GEMINI_STUB", None)

    mock = _start_mock()
    try:
        os.environ["LOCAL_LLM_URL"] = f"http://127.0.0.1:{mock.server_address[1]}/v1"
        os.environ["LOCAL_LLM_MODEL"] = "gemma-4-e4b"
        live = ae.GandalSpaceEngine()
        gemma_quiz = live.generate_practice_quiz("Comparing numbers", topic_id="math.k2.compare")
        assert gemma_quiz["success"] is True
        assert gemma_quiz["engine_type"] == "offline_edge"
        assert "Gemma 4 E4B" in gemma_quiz["provider"]
        gqs = gemma_quiz["questions"]
        assert len(gqs) == 5
        assert "Which number is greater: 8 or 3?" in [q["question"] for q in gqs]
        assert all(not ae.is_meta_quiz_item(q) for q in gqs)
    finally:
        mock.shutdown()
        os.environ.pop("LOCAL_LLM_URL", None)
        os.environ.pop("LOCAL_LLM_MODEL", None)
    print("Test 10 PASSED!\n")

    print("=== TEST 11: Comparing numbers graph is towers, not sgn(x) ===")
    assert ae.gemini_model_name() == "gemini-3.1-flash"
    wrapped = {
        "type": "Container",
        "title": "Comparing numbers",
        "children": [{
            "type": "GraphCard",
            "model_type": "function_plot",
            "title": "Comparing Numbers. Learn to compare numbers using greater than, less than.",
            "formula": "sgn(x)",
        }],
    }
    out = ae.normalize_compare_graph_cards(wrapped, "Comparing numbers")
    g = out["children"][0]
    assert g["model_type"] == "compare"
    assert g.get("left") == 5
    assert g.get("right") == 10
    assert "sgn" not in (g.get("formula") or "").lower()

    os.environ["GOOGLE_API_KEY"] = "AIzaSyMOCK_GANDAL_ONLINE_TEST_KEY"
    os.environ["GANDAL_SPACE_GEMINI_STUB"] = "1"
    cloud = ae.GandalSpaceEngine()
    asked = cloud.process_query("Teach this ONE K-12 topic. Topic: Comparing numbers. Band: K–2.")
    kids = (asked.get("ui_payload") or {}).get("children") or []
    graphs = [c for c in kids if c.get("type") == "GraphCard"]
    assert graphs and graphs[0].get("model_type") == "compare"
    os.environ.pop("GOOGLE_API_KEY", None)
    os.environ.pop("GANDAL_SPACE_GEMINI_STUB", None)

    res_area = engine.process_query("area(x^2, 0, 2)")
    area_graphs = [c for c in (res_area.get("ui_payload") or {}).get("children") or [] if c.get("type") == "GraphCard"]
    assert area_graphs
    assert area_graphs[0].get("model_type") != "compare"
    print("Test 11 PASSED!\n")

    print("=== ALL AUTOMATED TESTS PASSED! ===")


if __name__ == "__main__":
    run_tests()
