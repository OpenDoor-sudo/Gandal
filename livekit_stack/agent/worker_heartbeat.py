"""Local heartbeat so /api/voice_status can tell if the LiveKit worker is alive."""
from __future__ import annotations

import json
import os
import time

HEARTBEAT_NAME = "gandho_worker.heartbeat"


def heartbeat_path(project_root):
    return os.path.join(project_root, HEARTBEAT_NAME)


def write_worker_heartbeat(project_root, extra=None):
    payload = {"pid": os.getpid(), "ts": time.time()}
    if extra:
        payload.update(extra)
    path = heartbeat_path(project_root)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    os.replace(tmp, path)
    return path


def read_worker_heartbeat(project_root, max_age_s=90):
    path = heartbeat_path(project_root)
    if not os.path.isfile(path):
        return {
            "running": False,
            "age_s": None,
            "path": path,
            "detail": "No worker heartbeat. Start: python3 livekit_stack/agent/run_agent.py --online start",
        }
    try:
        age = max(0.0, time.time() - os.path.getmtime(path))
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception as err:
        return {"running": False, "age_s": None, "path": path, "detail": str(err)}
    running = age <= max_age_s
    detail = "Worker heartbeat is fresh." if running else (
        "Worker heartbeat is stale (%.0fs). Restart python3 livekit_stack/agent/run_agent.py --online start"
        % age
    )
    return {
        "running": running,
        "age_s": round(age, 1),
        "path": path,
        "pid": data.get("pid"),
        "ffmpeg": data.get("ffmpeg"),
        "registered": data.get("registered"),
        "detail": detail,
    }
