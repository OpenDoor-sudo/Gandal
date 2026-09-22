#!/usr/bin/env bash
# Start the patched OpenMAIC classroom player and the Gemma/Gemini proxy.
# Does not replace ./boot_linux.sh. The Classroom tab iframes this process.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLAYER_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECKOUT="${GANDAL_OPENMAIC_CHECKOUT:-$PLAYER_DIR/checkout}"
PORT="${GANDAL_CLASSROOM_PLAYER_PORT:-3210}"
PROXY_PORT="${GANDAL_CLASSROOM_PROXY_PORT:-8099}"
PIN="$(tr -d '[:space:]' < "$PLAYER_DIR/PIN")"

export PATH="${HOME}/.nvm/versions/node/v22.22.2/bin:${PATH}"

if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/" ; then
  echo "[classroom] player already listening on ${PORT}"
  exit 0
fi

if [[ ! -f "$CHECKOUT/package.json" ]]; then
  mkdir -p "$(dirname "$CHECKOUT")"
  if [[ -f /tmp/OpenMAIC/package.json ]]; then
    ln -s /tmp/OpenMAIC "$CHECKOUT"
  else
    git clone --depth 1 https://github.com/THU-MAIC/OpenMAIC.git "$CHECKOUT"
    git -C "$CHECKOUT" fetch --depth 1 origin "$PIN"
    git -C "$CHECKOUT" checkout "$PIN"
  fi
fi

python3 "$PLAYER_DIR/apply_patches.py" "$CHECKOUT"

if ! curl -sf -o /dev/null "http://127.0.0.1:${PROXY_PORT}/v1/models"; then
  (cd "$ROOT" && python3 -m gandal_classroom.openai_proxy >/tmp/gandal-classroom-proxy.log 2>&1 & echo $! > /tmp/gandal-classroom-proxy.pid)
fi

cd "$CHECKOUT"
if [[ ! -d node_modules ]]; then
  pnpm install
fi

# The player talks only to the local proxy. The proxy tries Gemma, then Gemini.
unset GOOGLE_API_KEY GEMINI_API_KEY || true
export OPENAI_API_KEY="${OPENAI_API_KEY:-gandal-local}"
export OPENAI_BASE_URL="http://127.0.0.1:${PROXY_PORT}/v1"
export OPENAI_MODELS="${LOCAL_LLM_MODEL:-gemma-4-e4b}"
export ALLOWED_FRAME_ANCESTORS="${ALLOWED_FRAME_ANCESTORS:-http://127.0.0.1:8000 http://localhost:8000}"
export PORT="$PORT"

exec pnpm exec next dev --hostname 127.0.0.1 --port "$PORT"
