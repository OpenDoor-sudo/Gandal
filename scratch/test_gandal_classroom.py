"""Classroom lesson kit, language lock, and hybrid routing."""
import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from gandal_classroom import lesson
from gandal_classroom.api import handle_http
from gandal_classroom.lesson import SYSTEM_PROMPT, contains_cjk

CJK_FILES = (".py", ".js", ".css", ".yml")


def _assert_no_cjk(blob, label):
    assert not contains_cjk(blob), label


def _model_json():
    return json.dumps({
        "title": "Leaf light",
        "scenes": [
            {"id": "slides", "type": "slides", "title": "Slides", "slides": [
                {"title": "Light", "bullets": ["Blue and red"], "notes": "Start here"}
            ]},
            {"id": "viz3d", "type": "viz3d", "title": "3D view", "caption": "Orbit", "objects": [
                {"id": "core", "label": "Leaf", "color": "#22c55e", "radius": 1, "orbit": 0, "phase": 0}
            ]},
            {"id": "simulation", "type": "simulation", "title": "Wavelength laboratory", "kind": "wavelength",
             "caption": "Blue and red.", "control": {"label": "Wavelength", "min": 380, "max": 750, "value": 450, "unit": "nm"},
             "start_label": "Start", "reset_label": "Reset"},
            {"id": "game", "type": "game", "title": "Game", "rounds": [
                {"prompt": "Which light?", "choices": [{"label": "Blue and red", "correct": True}, {"label": "Only green", "correct": False}]}
            ]},
        ],
        "teacher": [
            {"scene": "simulation", "say": "I set 450 nanometers and start the light.", "actions": [
                {"op": "set_control", "value": 450}, {"op": "start"}
            ]}
        ],
    })


def run_tests():
    print("=== No Chinese in the classroom module ===")
    root = os.path.join(PROJECT_ROOT, "gandal_classroom")
    for dirpath, _, files in os.walk(root):
        for name in files:
            if not name.endswith(CJK_FILES):
                continue
            path = os.path.join(dirpath, name)
            text = open(path, encoding="utf-8").read()
            lowered = text.lower()
            # lesson.py names the codes only so it can refuse them.
            # apply_patches.py names the locale files it deletes and the menu
            # phrases it translates out of the player.
            if name == "lesson.py":
                _assert_no_cjk(text, path)
                assert lowered.count("zh-cn") == 1 and lowered.count("zh-tw") == 1, path
            elif name == "apply_patches.py":
                assert "zh-cn" in lowered and "zh-tw" in lowered, path
                assert "Gandho" in text, path
            else:
                _assert_no_cjk(text, path)
                assert "zh-cn" not in lowered and "zh-tw" not in lowered, path
    topic_page = os.path.join(root, "player", "topic_page.tsx")
    topic_text = open(topic_page, encoding="utf-8").read()
    _assert_no_cjk(topic_text, topic_page)
    assert "Gandho" in topic_text and "widget_setState" in topic_text and "spotlight" in topic_text
    _assert_no_cjk(SYSTEM_PROMPT, "system prompt")
    assert "French" in SYSTEM_PROMPT and "English" in SYSTEM_PROMPT

    print("=== Scene kit ===")
    en = lesson.build_scene_kit("Photosynthesis", "en")
    kinds = [s["type"] for s in en["scenes"]]
    assert kinds == ["slides", "viz3d", "simulation", "game", "mindmap", "code"], kinds
    sim = next(s for s in en["scenes"] if s["type"] == "simulation")
    assert sim["kind"] == "wavelength"
    assert sim["start_label"] == "Start"
    _assert_no_cjk(json.dumps(en, ensure_ascii=False), "en kit")

    fr = lesson.build_scene_kit("La photosynthese", "fr")
    fr_sim = next(s for s in fr["scenes"] if s["type"] == "simulation")
    assert fr_sim["start_label"] == "Démarrer"
    assert fr_sim["reset_label"] == "Recommencer"
    assert fr["locale"] == "fr"
    _assert_no_cjk(json.dumps(fr, ensure_ascii=False), "fr kit")

    generic = lesson.build_scene_kit("Fractions", "en")
    assert next(s for s in generic["scenes"] if s["type"] == "simulation")["kind"] == "intensity"
    assert "Fractions" in generic["title"]

    print("=== Locale lock ===")
    assert lesson.normalize_locale("zh-CN") == "en"
    assert lesson.normalize_locale("zh-TW") == "en"
    assert lesson.normalize_locale("fr-FR") == "fr"
    assert lesson.normalize_locale("") == "en"
    hidden = lesson.build_scene_kit("光合作用", "en")
    assert hidden["title"] == "Classroom topic"
    _assert_no_cjk(json.dumps(hidden, ensure_ascii=False), "stripped topic")

    print("=== Unavailable engines ===")
    original_complete = lesson.complete
    original_flags = lesson.engine_flags
    lesson.complete = lambda system, user: (None, "none", "unavailable")
    lesson.engine_flags = lambda: (False, False)
    try:
        missed = lesson.generate_lesson("Photosynthesis", "en")
        assert missed["success"] is False
        assert "Gemma" in missed["error"] and "Gemini" in missed["error"]
        assert missed["lesson"]["lesson_source"] == "scene_kit"
        assert len(missed["lesson"]["scenes"]) == 6
        _assert_no_cjk(json.dumps(missed, ensure_ascii=False), "unavailable payload")

        print("=== Model lesson ===")
        lesson.complete = lambda system, user: (_model_json(), "Gemini (gemini-3.8-flash)", "cloud_fallback")
        lesson.engine_flags = lambda: (False, True)
        made = lesson.generate_lesson("Photosynthesis", "en")
        assert made["success"] is True
        assert made["engine_type"] == "cloud_fallback"
        assert made["lesson"]["lesson_source"] == "model"
        assert [s["type"] for s in made["lesson"]["scenes"]] == list(lesson.REQUIRED_SCENES)
        assert "gemini-3.8-flash" in made["provider"]

        print("=== Chinese model output is dropped ===")
        lesson.complete = lambda system, user: ('{"title": "光合作用", "scenes": []}', "Gemma 4 E4B", "offline_edge")
        lesson.engine_flags = lambda: (True, False)
        dropped = lesson.generate_lesson("Photosynthesis", "fr")
        assert dropped["success"] is False
        _assert_no_cjk(json.dumps(dropped, ensure_ascii=False), "dropped chinese")
        assert dropped["lesson"]["locale"] == "fr"
    finally:
        lesson.complete = original_complete
        lesson.engine_flags = original_flags

    print("=== HTTP ===")
    status, payload = handle_http("GET", "/api/gandal_classroom/status", b"")
    assert status == 200
    assert payload["default_locale"] == "en"
    assert payload["locales"] == ["en", "fr"]
    status, payload = handle_http("POST", "/api/gandal_classroom/generate", b'{"topic": "", "locale": "zh-CN"}')
    assert payload["success"] is False
    assert payload["lesson"] is None
    status, missing = handle_http("GET", "/api/gandal_classroom/nope", b"")
    assert status == 404

    space_js = open(os.path.join(PROJECT_ROOT, "gandal_space", "gandal_space.js"), encoding="utf-8").read()
    assert "Our Space" in space_js and "Classroom" in space_js
    assert "Quiz me" in space_js and "Tableau Noir" in space_js
    assert "gandalClassroomMount" in space_js

    print("ALL CLASSROOM TESTS PASSED")


if __name__ == "__main__":
    run_tests()
