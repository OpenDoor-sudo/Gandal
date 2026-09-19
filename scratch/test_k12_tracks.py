"""K-12 track catalog, intent, one-topic advance, and OKF writes."""
import os
import shutil
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from gandal_space import k12_tracks as tracks

STUDENT = "TrackTestK12"
PROFILE_DIR = os.path.join(PROJECT_ROOT, "student_profiles", STUDENT)

REQUIRED = (
    "counting", "place value", "addition", "subtraction", "multiplication",
    "division", "fraction", "decimal", "percent", "ratio", "integer",
    "equation", "inequalit", "function", "slope", "pythagor", "triangle",
    "circle", "volume", "area", "probability", "mean", "quadratic",
    "factor", "exponent", "logarithm", "trig", "derivative", "integral",
    "limit", "matrix", "complex", "vector", "normal", "permutation",
    "conic", "radian", "sine",
)


def _cleanup():
    if os.path.isdir(PROFILE_DIR):
        shutil.rmtree(PROFILE_DIR)


def run_tests():
    _cleanup()
    try:
        print("=== Catalog ===")
        subjects = tracks.list_subjects()
        ids = [s["id"] for s in subjects]
        assert ids == [
            "mathematics", "physics", "chemistry", "biology",
            "philosophy", "english", "french",
        ]
        math = next(s for s in subjects if s["id"] == "mathematics")
        assert math["walkable"] is True
        assert math["topic_count"] >= 150
        for sid in ("physics", "chemistry", "biology", "philosophy", "english", "french"):
            row = next(s for s in subjects if s["id"] == sid)
            assert row["walkable"] is True
            assert row["status"] == "ready"
            assert row["topic_count"] >= 70
        titles = " ".join(
            (t["title"] + " " + " ".join(t.get("aliases") or [])).lower()
            for t in tracks.MATH_TOPICS
        )
        missing = [k for k in REQUIRED if k not in titles]
        assert not missing, missing
        assert tracks.first_topic("english")["title"] == "The English alphabet"
        assert tracks.first_topic("french")["title"] == "L'alphabet français"
        assert tracks.first_topic("physics")["title"] == "Our five senses"
        assert tracks.first_topic("chemistry")["title"] == "Materials around us"
        assert tracks.first_topic("biology")["title"] == "Living and nonliving"
        assert tracks.first_topic("philosophy")["title"] == "Asking why"
        print(f"Math topics: {len(tracks.MATH_TOPICS)}")
        print(f"Physics: {len(tracks.PHYSICS_TOPICS)} Chemistry: {len(tracks.CHEMISTRY_TOPICS)}")
        print(f"Biology: {len(tracks.BIOLOGY_TOPICS)} Philosophy: {len(tracks.PHILOSOPHY_TOPICS)}")
        print(f"English: {len(tracks.ENGLISH_TOPICS)} French: {len(tracks.FRENCH_TOPICS)}")
        print("Catalog PASSED\n")

        print("=== Intent ===")
        scratch = tracks.parse_intent("I want to learn math from scratch")
        assert scratch["wants_track"] and scratch["from_scratch"]
        assert scratch["subject"] == "mathematics"
        frac = tracks.parse_intent("teach me fractions")
        assert frac["topic"] and "fraction" in frac["topic"]["title"].lower()
        alg = tracks.parse_intent("I want to learn algebra")
        assert alg["topic"] and alg["topic"]["band"] == "Algebra I"
        photo = tracks.parse_intent("How does Photosynthesis work?")
        assert photo["wants_track"] is False
        teach_photo = tracks.parse_intent("teach me photosynthesis")
        assert teach_photo["wants_track"] is True
        assert teach_photo["subject"] == "biology"
        assert teach_photo["topic"] and "photosynthesis" in teach_photo["topic"]["title"].lower()
        letter_a = tracks.parse_intent("Practice reading the alphabet: Letter A")
        assert letter_a["wants_track"] is False
        print("Intent PASSED\n")

        print("=== Start from scratch + one topic ===")
        started = tracks.start_track(STUDENT, "mathematics", from_scratch=True)
        assert started["success"] is True
        first = tracks.first_topic("mathematics")
        assert started["topic"]["id"] == first["id"]
        assert started["topic"]["title"] == "Counting to 20"
        assert started["topic"]["index"] == 0
        assert "ONE K-12 topic" in started["topic"]["lesson_prompt"]
        progress = tracks.current_progress(STUDENT)
        assert progress["topic"]["id"] == first["id"]
        state_path = os.path.join(PROFILE_DIR, "session_state.md")
        state_txt = open(state_path, encoding="utf-8").read()
        assert "K-12 Track" in state_txt
        assert "Counting to 20" in state_txt
        print("Start PASSED\n")

        print("=== Quiz miss records struggle, no advance ===")
        missed = tracks.apply_quiz(STUDENT, first["id"], False, question="What is 2?")
        assert missed["correct"] is False
        assert missed["advanced"] is False
        assert tracks.current_progress(STUDENT)["topic"]["id"] == first["id"]
        subj_txt = open(os.path.join(PROFILE_DIR, "subject_Mathematics.md"), encoding="utf-8").read()
        assert "Counting to 20" in subj_txt
        print("Struggle PASSED\n")

        print("=== Quiz pass advances to next hidden topic ===")
        nxt = tracks.next_topic("mathematics", first["id"])
        passed = tracks.apply_quiz(STUDENT, first["id"], True, question="What is 2?")
        assert passed["advanced"] is True
        assert passed["topic"]["id"] == nxt["id"]
        assert passed["topic"]["title"] != first["title"]
        print("Advance PASSED\n")

        print("=== Physics / English walk + OKF ===")
        phy = tracks.start_track(STUDENT, "physics", from_scratch=True)
        assert phy["success"] is True
        assert phy["topic"]["title"] == "Our five senses"
        assert "ONE K-12 topic" in phy["topic"]["lesson_prompt"]
        assert "GraphCard" in phy["topic"]["lesson_prompt"]
        phy_next = tracks.next_topic("physics", phy["topic"]["id"])
        phy_miss = tracks.apply_quiz(STUDENT, phy["topic"]["id"], False, question="What is a push?")
        assert phy_miss["advanced"] is False
        phy_txt = open(os.path.join(PROFILE_DIR, "subject_Physics.md"), encoding="utf-8").read()
        assert "Our five senses" in phy_txt
        phy_pass = tracks.apply_quiz(STUDENT, phy["topic"]["id"], True)
        assert phy_pass["advanced"] is True
        assert phy_pass["topic"]["id"] == phy_next["id"]

        eng = tracks.handle_intent(STUDENT, "I want to learn english from scratch")
        assert eng["matched"] is True
        assert eng["topic"]["title"] == "The English alphabet"
        assert "We will start English from the beginning" in eng["reply"]
        assert "PronunciationCard" in eng["topic"]["lesson_prompt"]
        state_txt = open(os.path.join(PROFILE_DIR, "session_state.md"), encoding="utf-8").read()
        assert "The English alphabet" in state_txt
        print("Other subjects PASSED\n")

        print("=== Intent handler ===")
        handled = tracks.handle_intent(STUDENT, "I want to learn math from scratch")
        assert handled["matched"] is True
        assert handled["topic"]["id"] == first["id"]
        ignored = tracks.handle_intent(STUDENT, "How does Photosynthesis work?")
        assert ignored["matched"] is False
        print("Handler PASSED\n")

        print("=== ALL K-12 TRACK TESTS PASSED ===")
    finally:
        _cleanup()


if __name__ == "__main__":
    run_tests()
