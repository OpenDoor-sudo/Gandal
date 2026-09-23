"""Gandho checks Code-tab Python against the learner's intent.

Uses the classroom hybrid: Gemma 4 E4B first, then gemini-3.8-flash only when
that port is down and a real Google key exists. English or French only.
"""

import json
import re

from gandal_classroom.hybrid import complete, docker_hint, unavailable_message
from gandal_space.agent_engine import local_llm_base_url, local_llm_model

_CJK = re.compile(r"[\u3400-\u9fff\uf900-\ufaff]")

SYSTEM = """You are Gandho. You review one Python snippet on the Code tab.
This is not a classroom lesson and you are not introducing a new subject.
Compare the current Python with the learner's intent. If they asked a question, answer that question using the intent and the Python as context.
Reply with JSON only, in the requested language (English or French). Never use Chinese.
Keys:
- right: what the code already does that matches the intent
- wrong: what is missing or incorrect compared with the intent
- how: the concrete change that would match the intent
- answer: a direct reply to the question, or an empty string when there is no question
"""


def _locale(value: str) -> str:
    return "fr" if str(value or "").lower().startswith("fr") else "en"


def _clean(text: str) -> str:
    return _CJK.sub("", text or "").strip()


def unavailable_text(locale: str) -> str:
    locale = _locale(locale)
    if locale == "fr":
        text = (
            "Il faut Gemma ou une clé Gemini. Gemma 4 E4B ne répond pas sur "
            f"{local_llm_base_url()} (modèle {local_llm_model()}), "
            "et aucune clé Google utilisable n'est définie."
        )
    else:
        text = unavailable_message()
    return text + docker_hint()


def _parse(text: str) -> dict:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw).strip()
    data = None
    try:
        data = json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            try:
                data = json.loads(raw[start:end + 1])
            except Exception:
                data = None
    if not isinstance(data, dict):
        return {"right": "", "wrong": "", "how": "", "answer": _clean(raw)}
    return {
        "right": _clean(str(data.get("right") or "")),
        "wrong": _clean(str(data.get("wrong") or "")),
        "how": _clean(str(data.get("how") or "")),
        "answer": _clean(str(data.get("answer") or "")),
    }


def review(intent: str, code: str, question: str = "", locale: str = "en") -> dict:
    locale = _locale(locale)
    intent = (intent or "").strip()
    question = (question or "").strip()
    code = code if isinstance(code, str) else ""
    if not intent and not question:
        message = (
            "Écris ce que tu essaies de faire."
            if locale == "fr"
            else "Write what you are trying to do."
        )
        return {
            "success": False,
            "available": True,
            "message": message,
            "right": "",
            "wrong": "",
            "how": "",
            "answer": "",
            "provider": "none",
        }
    language = "French" if locale == "fr" else "English"
    user = (
        f"Language: {language}\n"
        f"Intent:\n{intent or '(none)'}\n\n"
        f"Python:\n{code}\n\n"
        f"Question:\n{question or '(none — check the code against the intent)'}\n"
    )
    text, provider, engine = complete(SYSTEM, user)
    if not text or not str(text).strip():
        return {
            "success": False,
            "available": False,
            "message": unavailable_text(locale),
            "right": "",
            "wrong": "",
            "how": "",
            "answer": "",
            "provider": provider,
            "engine_type": engine,
        }
    parts = _parse(str(text))
    if not any(parts.values()):
        message = (
            "La réponse de Gandho n'était ni en anglais ni en français."
            if locale == "fr"
            else "Gandho's reply was not in English or French."
        )
        return {
            "success": False,
            "available": True,
            "message": message,
            "right": "",
            "wrong": "",
            "how": "",
            "answer": "",
            "provider": provider,
            "engine_type": engine,
        }
    return {
        "success": True,
        "available": True,
        "message": "",
        "provider": provider,
        "engine_type": engine,
        **parts,
    }


def handle_http(method: str, path: str, body: bytes = b""):
    if path == "/api/gandal_code/review" and method == "POST":
        try:
            data = json.loads(body.decode("utf-8") or "{}")
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}
        payload = review(
            data.get("intent") or "",
            data.get("code") or "",
            data.get("question") or "",
            data.get("locale") or "en",
        )
        return 200, payload
    return 404, {"success": False, "error": "Unknown code route."}
