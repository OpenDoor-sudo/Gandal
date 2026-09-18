#!/usr/bin/env bash
# boot_linux.sh — Linux desktop / Docker boot for the Gandal classroom server.
# Does not pretend this host is a Jetson Orin, Ventuno Q, or Gemma NPU box.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

WITH_AGENT=0
for arg in "$@"; do
  case "$arg" in
    --with-agent|--agent) WITH_AGENT=1 ;;
    -h|--help)
      echo "Usage: ./boot_linux.sh [--with-agent]"
      echo "  Starts display_client.py on :8000 / :8001."
      echo "  --with-agent also starts livekit_stack/agent/run_agent.py (needs LiveKit deps)."
      exit 0
      ;;
  esac
done

echo "======================================================================"
echo "  Gandal — Linux classroom boot"
echo "  repo: $ROOT"
echo "======================================================================"

if ! command -v python3 >/dev/null 2>&1; then
  echo "[FAIL] python3 is required."
  exit 1
fi
echo "[OK] $(python3 --version)"

if [ ! -f "$ROOT/vault.db" ]; then
  echo "[WARN] vault.db missing. Running init_vault.py..."
  python3 "$ROOT/init_vault.py"
fi
echo "[OK] vault.db present"

if ! python3 -c "import websockets" 2>/dev/null; then
  echo "[FAIL] Python package 'websockets' is not installed."
  echo "       pip install websockets"
  echo "       (optional classroom extras: pip install -r requirements-online.txt)"
  exit 1
fi
echo "[OK] websockets importable"

if command -v ffmpeg >/dev/null 2>&1; then
  echo "[OK] ffmpeg $(ffmpeg -version 2>/dev/null | head -n 1)"
else
  echo "[WARN] ffmpeg is not on PATH. LiveKit tutor audio often fails on Linux without it."
  echo "       sudo apt install ffmpeg"
fi

if [ -n "${SUDO_USER:-}" ] || [ "$(id -u)" = "0" ]; then
  echo "[FAIL] Do not boot with sudo. The browser, PulseAudio, and .env must belong to your user."
  echo "       python3 livekit_stack/agent/run_agent.py --online start"
  exit 1
fi

probe_livekit() {
  local host="127.0.0.1"
  local port="7880"
  if python3 - "$host" "$port" <<'PY'
import socket, sys
host, port = sys.argv[1], int(sys.argv[2])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.6)
try:
    s.connect((host, port))
except Exception:
    sys.exit(1)
finally:
    s.close()
PY
  then
    echo "[OK] LiveKit TCP $host:$port is open"
    return 0
  fi
  echo "[WARN] No LiveKit server on $host:$port. Gandho cannot talk until you start one:"
  echo "       bash livekit_stack/run_livekit_server.sh"
  echo "       or set LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud in .env"
  return 1
}
probe_livekit || true

if [ ! -f "$ROOT/.env" ]; then
  echo "[WARN] .env is missing (gitignored). Gemini Live, Spatius, and cloud Gandal Space will stay unavailable."
else
  echo "[OK] .env present (keys are not printed)"
fi

if [ -z "${GOOGLE_API_KEY:-}" ]; then
  # Load from .env without printing values
  if [ -f "$ROOT/.env" ] && grep -q '^GOOGLE_API_KEY=.\+' "$ROOT/.env" 2>/dev/null; then
    echo "[OK] GOOGLE_API_KEY is set in .env"
  else
    echo "[WARN] GOOGLE_API_KEY unset — Gemini Live tutor will not start."
  fi
fi

MP4_COUNT="$(find "$ROOT/curriculum_staging" -type f \( -iname '*.mp4' -o -iname '*.m4v' \) 2>/dev/null | wc -l | tr -d ' ')"
MP3_COUNT="$(find "$ROOT" \( -path "$ROOT/curriculum_staging/*" -o -path "$ROOT/static/videos/*" \) -type f -iname '*.mp3' 2>/dev/null | wc -l | tr -d ' ')"
echo "[MEDIA] lecture MP4 files found: $MP4_COUNT  |  MP3 files found: $MP3_COUNT"
if [ "$MP4_COUNT" = "0" ]; then
  echo "[WARN] No lecture MP4s in this tree (.gitignore drops videos). Lessons will degrade to missing-file handling — this is not a silent fake player."
fi

SESSION_PATH="$ROOT/active_session.json"
echo "[SESSION] classroom will write: $SESSION_PATH"

if pgrep -f "python3? -u? ?display_client.py" >/dev/null 2>&1 || pgrep -f "python3 display_client.py" >/dev/null 2>&1; then
  echo "[INFO] Stopping existing display_client.py..."
  pkill -f "display_client.py" || true
  sleep 1
fi

export PYTHONUNBUFFERED=1
nohup python3 -u "$ROOT/display_client.py" > "$ROOT/display_client.log" 2>&1 &
DISPLAY_PID=$!
echo "[BOOT] display_client.py pid=$DISPLAY_PID  log=$ROOT/display_client.log"

HEALTH_URL="http://127.0.0.1:8000/api/health"
echo -n "[BOOT] Waiting for $HEALTH_URL "
ok=0
for _ in $(seq 1 40); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    ok=1
    echo " OK"
    break
  fi
  if ! kill -0 "$DISPLAY_PID" 2>/dev/null; then
    echo
    echo "[FAIL] display_client.py exited before becoming healthy. Last log lines:"
    tail -n 40 "$ROOT/display_client.log" || true
    exit 1
  fi
  echo -n "."
  sleep 0.25
done
if [ "$ok" != "1" ]; then
  echo
  echo "[FAIL] Server did not become healthy in time. Last log lines:"
  tail -n 40 "$ROOT/display_client.log" || true
  exit 1
fi

echo "[HEALTH] $(curl -sS "$HEALTH_URL")"
echo "[OK] Classroom UI: http://127.0.0.1:8000/"

if [ "$WITH_AGENT" = "1" ]; then
  if [ ! -f "$ROOT/livekit_stack/agent/run_agent.py" ]; then
    echo "[FAIL] --with-agent requested but livekit_stack/agent/run_agent.py is missing."
    exit 1
  fi
  echo "[VOICE] Starting LiveKit watcher (FORCE_OFFLINE=${FORCE_OFFLINE:-0} OFFLINE_MODE=${OFFLINE_MODE:-0})"
  echo "[VOICE] Never sudo this process. Use python3, in the same conda env as the classroom."
  pkill -f "run_agent.py" 2>/dev/null || true
  if [ "${FORCE_OFFLINE:-0}" = "1" ] || [ "${OFFLINE_MODE:-0}" = "1" ]; then
    AGENT_ARGS=(--offline start)
  else
    AGENT_ARGS=(--online start)
  fi
  nohup python3 -u "$ROOT/livekit_stack/agent/run_agent.py" "${AGENT_ARGS[@]}" > "$ROOT/tutor_agent.log" 2>&1 &
  echo "[VOICE] run_agent.py pid=$!  log=$ROOT/tutor_agent.log"
  echo "[WARN] Voice still needs LiveKit (:7880 or Cloud) plus GOOGLE_API_KEY (Gemini)."
else
  echo "[INFO] Voice worker not started."
  echo "       Terminal 2: bash livekit_stack/run_livekit_server.sh   # skip if LIVEKIT_URL is Cloud wss://"
  echo "       Terminal 3: python3 livekit_stack/agent/run_agent.py --online start"
fi

echo "======================================================================"
echo "  Listening. Ctrl+C stops this script; display_client.py stays up unless you pkill it."
echo "  Stop: pkill -f display_client.py"
echo "======================================================================"

wait "$DISPLAY_PID"
