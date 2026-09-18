#!/usr/bin/env bash
# Start only the local LiveKit media server (port 7880). Does not start Ollama/Kokoro/GPU.
# Required when LIVEKIT_URL is ws://127.0.0.1:7880. Skip this if .env points at LiveKit Cloud.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK="$(cd "$(dirname "$0")" && pwd)"
cd "$STACK"

if [ -n "${SUDO_USER:-}" ] || [ "$(id -u)" = "0" ]; then
  echo "[FAIL] Do not start LiveKit with sudo."
  exit 1
fi

if python3 - <<'PY'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.4)
try:
    s.connect(("127.0.0.1", 7880))
except Exception:
    raise SystemExit(1)
finally:
    s.close()
PY
then
  echo "[OK] LiveKit already listening on 127.0.0.1:7880"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "[LIVEKIT] Starting livekit-server via docker compose (host network, port 7880)..."
  docker compose -f "$STACK/docker-compose.yml" up -d livekit-server
  sleep 1
  if python3 - <<'PY'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.6)
try:
    s.connect(("127.0.0.1", 7880))
except Exception:
    raise SystemExit(1)
finally:
    s.close()
PY
  then
    echo "[OK] LiveKit listening on ws://127.0.0.1:7880"
    echo "     Dev keys in livekit.yaml: API key devkey / secret as in .env.example"
    exit 0
  fi
  echo "[WARN] docker compose up did not open :7880. Check: docker compose -f livekit_stack/docker-compose.yml logs livekit-server"
fi

if command -v livekit-server >/dev/null 2>&1; then
  echo "[LIVEKIT] Starting local livekit-server binary with $STACK/livekit.yaml"
  exec livekit-server --config "$STACK/livekit.yaml"
fi

cat <<EOF
[FAIL] No LiveKit server on 127.0.0.1:7880.

Gandho's Gemini Live path needs a LiveKit SFU. Pick one:

  1) Docker (this repo):
       bash livekit_stack/run_livekit_server.sh
     (requires Docker; starts only the livekit-server service)

  2) LiveKit Cloud — in .env set:
       LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud
       LIVEKIT_API_KEY=...
       LIVEKIT_API_SECRET=...
       ONLINE_MODE=1
       OFFLINE_MODE=0

Do not paste those secrets into chat. Keep them in .env (gitignored).
EOF
exit 1
