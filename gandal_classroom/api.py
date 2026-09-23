"""HTTP handlers for the Classroom tab. Display client and the space server both call these."""

import json

from gandal_classroom.hybrid import docker_hint, engine_flags, unavailable_message
from gandal_classroom.lesson import generate_lesson, normalize_locale
from gandal_space.agent_engine import gemini_model_name, local_llm_base_url, local_llm_model


def status_payload() -> dict:
    local_ok, gemini_ok = engine_flags()
    if local_ok:
        preference = "Edge/Gemma"
    elif gemini_ok:
        preference = "Gemini"
    else:
        preference = "unavailable"
    return {
        "success": True,
        "local_edge": {
            "available": local_ok,
            "model": local_llm_model(),
            "endpoint": local_llm_base_url(),
        },
        "cloud_fallback": {
            "available": gemini_ok,
            "model": gemini_model_name(),
        },
        "active_preference": preference,
        "error": None if (local_ok or gemini_ok) else unavailable_message() + docker_hint(),
        "locales": ["en", "fr"],
        "default_locale": "en",
    }


def generate_payload(topic: str, locale: str = "en") -> dict:
    return generate_lesson(topic, normalize_locale(locale))


def player_payload() -> dict:
    from gandal_classroom.player_launch import ensure_player

    return ensure_player()


def handle_http(method: str, path: str, body: bytes = b""):
    """Return (status_code, payload) for a classroom API path."""
    if path == "/api/gandal_classroom/status" and method == "GET":
        return 200, status_payload()
    if path == "/api/gandal_classroom/generate" and method == "POST":
        try:
            data = json.loads(body.decode("utf-8") or "{}")
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}
        return 200, generate_payload(data.get("topic") or "", data.get("locale") or "en")
    if path == "/api/gandal_classroom/player" and method == "GET":
        return 200, player_payload()
    return 404, {"success": False, "error": "Unknown classroom route."}
