# Online testing guide (desktop, no Ventuno Q yet)

You built a **hybrid** system. Every feature must work **online** (now) and **offline on Q** (when hardware arrives).

## Quick start — ONLINE mode on your current machine

```bash
export ONLINE_MODE=1
export OFFLINE_MODE=0
export GOOGLE_API_KEY=your_key_here
# Optional LiveKit Cloud (if not using local :7880)
export LIVEKIT_URL="wss://YOUR_PROJECT.livekit.cloud"
export LIVEKIT_API_KEY=...
export LIVEKIT_API_SECRET=...
# Optional alias used by /token when ONLINE_MODE=1
export LIVEKIT_CLOUD_URL="$LIVEKIT_URL"

python3 display_client.py
# separate terminal:
python3 livekit_stack/agent/run_agent.py --online start
```

In the browser console (once), you can also flip UI helpers:

```js
localStorage.setItem("ONLINE_MODE", "1");
localStorage.setItem("LIVEKIT_URL", "wss://YOUR_PROJECT.livekit.cloud");
location.reload();
```

## What ONLINE mode exercises

| Feature | Online path |
|--------|-------------|
| Live Socratic voice | Gemini Live via `tutor_agent.py` + LiveKit Cloud/local |
| Circuits ask | Local LLM if up, else Gemini |
| Translations | Local cache/LLM first, else Gemini |
| TTS | Riva/Kokoro if up, else Google TTS |
| PubChem / enrichment | Network APIs after cache miss |

## What to re-test on Ventuno Q later

```bash
export OFFLINE_MODE=1
export ONLINE_MODE=0
# Gemma :8080, Kokoro :8880, LiveKit :7880 must be running
bash boot_appliance.sh
```

Then verify the same features offline, and that hard/out-of-curriculum questions still escalate online via eSIM when you enable fallback.
