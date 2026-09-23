#!/usr/bin/env bash
# Start the pinned OpenMAIC app (their UI) and serve it with next start.
# Lesson generation uses gemini-3.8-flash and the user's Google key.
# It does not call open.maic.chat. Does not replace ./boot_linux.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLAYER_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECKOUT="${GANDAL_OPENMAIC_CHECKOUT:-$PLAYER_DIR/checkout}"
PORT="${GANDAL_CLASSROOM_PLAYER_PORT:-3210}"
PIN="$(tr -d '[:space:]' < "$PLAYER_DIR/PIN")"

export PATH="${HOME}/.nvm/versions/node/v22.22.2/bin:${PATH}"
# A background launch has no TTY. Without this, Corepack stops at
# "Do you want to continue? [Y/n]" before it downloads pnpm.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/" ; then
  echo "[classroom] player already listening on ${PORT}"
  exit 0
fi

read_env_key() {
  local file="$1" name="$2" line
  line="$(grep -E "^${name}=" "$file" | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

if [[ -z "${GOOGLE_API_KEY:-}" && -z "${GEMINI_API_KEY:-}" && -f "$ROOT/.env" ]]; then
  GOOGLE_API_KEY="$(read_env_key "$ROOT/.env" GOOGLE_API_KEY)"
  GEMINI_API_KEY="$(read_env_key "$ROOT/.env" GEMINI_API_KEY)"
fi
if [[ -z "${GOOGLE_API_KEY:-}" && -n "${GEMINI_API_KEY:-}" ]]; then
  GOOGLE_API_KEY="$GEMINI_API_KEY"
fi
case "${GOOGLE_API_KEY:-}" in
  ""|your_google_api_key_here|changeme|none|null) unset GOOGLE_API_KEY || true ;;
  *) export GOOGLE_API_KEY ;;
esac

# Their generator talks to Google as this model. No hosted OpenMAIC route.
export GOOGLE_MODELS="gemini-3.8-flash"
export DEFAULT_MODEL="google:gemini-3.8-flash"
unset OPENAI_BASE_URL || true

export ALLOWED_FRAME_ANCESTORS="${ALLOWED_FRAME_ANCESTORS:-http://127.0.0.1:8000 http://localhost:8000 http://127.0.0.1:3000 http://localhost:3000}"
export PORT="$PORT"

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

cd "$CHECKOUT"
if [[ ! -d node_modules ]]; then
  pnpm install
fi

# Prefer a production server. The dev server holds too much RAM on an 8 GB laptop.
if [[ ! -f .next/BUILD_ID ]]; then
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" pnpm exec next build
fi

exec pnpm exec next start --hostname 127.0.0.1 --port "$PORT"
