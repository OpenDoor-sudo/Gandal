# Gandal Full Stack — one branch for everything

Branch: **`cursor/gandal-full-stack-c6f0`**

Merges:
- **Circuits 3D Atelier** + Virtual Labs polish + local-first audit
- **StudyDesk redesign** (Gandho beside PDF) + voice/ingest/math lab fixes

## Verified voice reference

The online voice path is compared against
[`OpenDoor-sudo/VentunoGandal`](https://github.com/OpenDoor-sudo/VentunoGandal)
at commit `a7c3385bb14e893b75b84b740b9822fbcc611ddb`.

The port preserves its critical behavior:

- Load LiveKit and Google credentials from the project-root `.env`
- Use `gemini-3.1-flash-live-preview`
- Enable the mutable-context compatibility required by LiveKit Google 1.8
- Start `AgentSession` with `RoomOptions(close_on_disconnect=False)`
- Speak the greeting only after the student audio track is subscribed

## Pull this branch

```bash
cd ~/Gandal_ventuno_ai
git fetch origin
git checkout cursor/gandal-full-stack-c6f0
git pull origin cursor/gandal-full-stack-c6f0
cp .env.example .env   # then edit with your keys
```

## Start (desktop online voice test)

Terminal 1:
```bash
python3 display_client.py
```

Terminal 2:
```bash
python3 livekit_stack/agent/run_agent.py start
```

The watcher defaults to **Gemini Live** (`tutor_agent.py`). Use `--offline` only on Ventuno Q.

## Gandho greets but never hears you?

That usually means **LiveKit did not connect** and an old fallback spoke a greeting without a real mic session.

Checklist:
1. `.env` has `GOOGLE_API_KEY`, `ONLINE_MODE=1`, `OFFLINE_MODE=0`
2. Agent watcher is running: `python3 livekit_stack/agent/run_agent.py start`
3. Browser console shows `[LIVEKIT] Microphone published` (not `Voice fallback`)
4. `tutor_agent.log` shows `[MIC CHECK] RoomIO linked microphone to identity=...`
5. Only one watcher: `pkill -f run_agent.py` then start again

## What's included

| Feature | Included |
|---------|----------|
| Circuits 3D breadboard | Yes |
| Virtual Labs + badges/challenges | Yes |
| StudyDesk + Gandho rail | Yes |
| Gemini Live two-way voice | Yes |
| Local-first / offline path | Yes (`--offline` or `OFFLINE_MODE=1`) |
| Online testing docs | `ONLINE_TESTING.md` |
| Appliance audit | `LOCAL_FIRST_AUDIT.md` |
