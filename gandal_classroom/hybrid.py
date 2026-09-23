"""Classroom model calls: Gemma 4 E4B first, then gemini-3.8-flash.

Inside a container, 127.0.0.1 is the container, not the host where Gemma
listens. Prefer Docker host networking so that address is the host. If you
use a bridge network instead, set:

    LOCAL_LLM_URL=http://host.docker.internal:8080/v1

and add extra_hosts: ["host.docker.internal:host-gateway"].
See gandal_classroom/docker-compose.yml.
"""

import json
import os
import urllib.request

from gandal_space.agent_engine import (
    default_engine,
    gemini_model_name,
    local_llm_base_url,
    local_llm_model,
    _real_google_api_key,
)


def unavailable_message() -> str:
    return default_engine._unavailable_message()


def engine_flags():
    """Return (gemma_up, gemini_up)."""
    local_ok, _ = default_engine.check_local_llm_status()
    gemini_ok, _ = default_engine.check_gemini_status()
    return bool(local_ok), bool(gemini_ok)


def _complete_local(system: str, user: str):
    base = local_llm_base_url()
    payload = {
        "model": local_llm_model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.4,
        "max_tokens": 4096,
    }
    try:
        req = urllib.request.Request(
            f"{base}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "GandalClassroom/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=55) as resp:
            if resp.status != 200:
                return None
            data = json.loads(resp.read().decode("utf-8") or "{}")
            return ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
    except Exception as exc:
        print(f"[GANDAL CLASSROOM] Gemma ({base}) error: {exc}")
        return None


def _complete_gemini(system: str, user: str):
    api_key = _real_google_api_key()
    if not api_key:
        return None
    model = gemini_model_name()
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "GandalClassroom/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8") or "{}")
        parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])
        return "".join(str(p.get("text") or "") for p in parts if isinstance(p, dict))
    except Exception as exc:
        print(f"[GANDAL CLASSROOM] Gemini ({model}) error: {exc}")
        return None


def complete(system: str, user: str):
    """Try Gemma, then Gemini. Returns (text_or_none, provider, engine_type)."""
    local_ok, gemini_ok = engine_flags()
    if local_ok:
        text = _complete_local(system, user)
        if text and str(text).strip():
            return str(text), f"Gemma 4 E4B ({local_llm_model()})", "offline_edge"
    if gemini_ok:
        text = _complete_gemini(system, user)
        if text and str(text).strip():
            return str(text), f"Gemini ({gemini_model_name()})", "cloud_fallback"
    return None, "none", "unavailable"


def docker_hint() -> str:
    in_docker = os.path.exists("/.dockerenv") or os.environ.get("GANDAL_IN_DOCKER") == "1"
    if not in_docker:
        return ""
    return (
        " This process looks containerized. If Gemma runs on the host, use "
        "network_mode: host, or set LOCAL_LLM_URL=http://host.docker.internal:8080/v1."
    )
