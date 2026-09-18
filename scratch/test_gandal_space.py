"""
test_gandal_space.py - Automated verification for Gandal Space
Tests:
  1. Agent engine status check
  2. Math query with calculus breakdown (area(x^2, 0, 2))
  3. Phonics query with PronunciationCard
  4. Audio pronunciation evaluation
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Set root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from gandal_space.agent_engine import default_engine

def run_tests():
    print("=== TEST 1: System Status ===")
    status = default_engine.get_system_status()
    print("Local Edge Available:", status["local_edge"]["available"])
    print("Cloud Fallback Available:", status["cloud_fallback"]["available"])
    print("Active Preference:", status["active_preference"])
    assert "local_edge" in status
    assert "cloud_fallback" in status
    print("Test 1 PASSED!\n")

    print("=== TEST 2: Math Calculus Query: area(x^2, 0, 2) ===")
    res_math = default_engine.process_query("area(x^2, 0, 2)")
    assert res_math["success"] is True
    payload_math = res_math["ui_payload"]
    print("Provider:", res_math["provider"])
    print("Title:", payload_math.get("title"))
    print("Subject:", payload_math.get("subject"))
    print("Child Types:", [c.get("type") for c in payload_math.get("children", [])])
    assert any(c.get("type") in ["FormulaCard", "Card", "TextBlock"] for c in payload_math.get("children", []))
    print("Test 2 PASSED!\n")

    print("=== TEST 3: Phonics & Alphabet Query: Practice letter A ===")
    res_phonics = default_engine.process_query("practice reading the alphabet letter A")
    assert res_phonics["success"] is True
    payload_phonics = res_phonics["ui_payload"]
    print("Provider:", res_phonics["provider"])
    print("Title:", payload_phonics.get("title"))
    child_types = [c.get("type") for c in payload_phonics.get("children", [])]
    print("Child Types:", child_types)
    assert "PronunciationCard" in child_types or "Card" in child_types
    print("Test 3 PASSED!\n")

    print("=== TEST 4: Pronunciation Audio Evaluation ===")
    res_audio = default_engine.evaluate_pronunciation(
        target_letter="A",
        expected_phoneme="/eɪ/",
        student_transcript="A Apple"
    )
    print("Audio Feedback:", res_audio)
    assert res_audio["type"] == "AudioFeedback"
    assert res_audio["status"] == "success"
    assert res_audio["score"] >= 90
    print("Test 4 PASSED!\n")

    print("=== ALL AUTOMATED TESTS PASSED! ===")

if __name__ == "__main__":
    run_tests()
