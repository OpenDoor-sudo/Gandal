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
            assert row["walkable"] is False
            assert row["status"] == "skeleton"
        titles = " ".join(
            (t["title"] + " " + " ".join(t.get("aliases") or [])).lower()
            for t in tracks.MATH_TOPICS
        )
        missing = [k for k in REQUIRED if k not in titles]
        assert not missing, missing
        print(f"Math topics: {len(tracks.MATH_TOPICS)}")
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

        print("=== Skeleton subjects ===")
        physics = tracks.start_track(STUDENT, "physics", from_scratch=True)
        assert physics["success"] is False
        assert physics["walkable"] is False
        assert "Mathematics" in physics["error"]
        print("Skeleton PASSED\n")

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
