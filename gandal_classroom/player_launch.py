"""Start the local OpenMAIC player if it is not already listening."""

import os
import subprocess
import urllib.request

PLAYER_PORT = int(os.environ.get("GANDAL_CLASSROOM_PLAYER_PORT", "3210"))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_started = False


def player_url() -> str:
    return f"http://127.0.0.1:{PLAYER_PORT}/gandal-topic"


def player_ready() -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PLAYER_PORT}/", timeout=1.5) as resp:
            return resp.status < 500
    except Exception:
        return False


def ensure_player() -> dict:
    global _started
    url = player_url()
    if player_ready():
        return {"success": True, "ready": True, "starting": False, "url": url, "fallback": False}
    script = os.path.join(ROOT, "gandal_classroom", "player", "run_player.sh")
    if not _started and os.path.isfile(script):
        log_path = "/tmp/gandal-classroom-player.log"
        log = open(log_path, "ab")
        subprocess.Popen(
            ["bash", script],
            cwd=ROOT,
            stdout=log,
            stderr=log,
            start_new_session=True,
        )
        _started = True
    return {
        "success": True,
        "ready": False,
        "starting": True,
        "url": url,
        "fallback": False,
        "detail": "Starting the classroom player. The first launch installs it.",
    }
