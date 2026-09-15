# Ventuno Q — Local-First Audit & Readiness

**Doctrine:** Curriculum + on-device Gemma first. Online (Gemini Live / cloud APIs) only when the question is **not in curriculum** or **too hard for local**.

**Default env on appliance:** `OFFLINE_MODE=1`

---

## Feature scorecard

| Feature | Class | Local path | Online path | Status |
|--------|--------|------------|-------------|--------|
| Lesson video / PDF / vault progress | **Offline on Q** | `curriculum_staging/`, `vault.db` | — | OK |
| Curriculum RAG (LanceDB + MiniLM) | **Needs local service** | `.lancedb/`, SentenceTransformer | — (bake weights on image) | OK |
| Text Socratic tutoring | **Needs local service** → fallback | Gemma `:8080` via `qwen_omni_client` | OpenRouter / Gemini after miss | OK cascade |
| **Live voice tutor (default)** | **Needs local service** | LiveKit `:7880` + `tutor_agent_offline.py` (Gemma E4B native audio / HF S2S + Kokoro `:8880`) | Gemini Live via `tutor_agent.py` only if `ONLINE_MODE=1` / `--online` | **Fixed** — offline default |
| LiveKit browser URL | **Needs local service** | `/token` returns `ws://127.0.0.1:7880` | Cloud WSS only if `LIVEKIT_URL` set | **Fixed** |
| Kokoro / Magpie TTS | **Needs local service** | Riva `:50051` → Kokoro `:8880` | Google TTS only if `OFFLINE_MODE!=1` | **Fixed** |
| Timestamp / flashcard translate | **Needs local service** → fallback | Cache + local LLM loop | Gemini batch only if online allowed | **Fixed** |
| Circuits 3D atelier | **Offline on Q** | Vendored Three.js + curriculum JSON | — | OK |
| Circuits ask API | **Needs local service** → fallback | Gemma `:8080` + step template | Gemini if online + local miss | **Fixed** |
| Virtual Labs canvas / offline_sims | **Offline on Q** | Local HTML/JS sims | — | OK |
| Chem/physics solvers | **Needs local service** | ChemPy / SymPy / RDKit in-process | — | OK when deps installed on image |
| PubChem inspector | **Online fallback only** | Local cache first | NCBI after miss | OK (honest badges) |
| STEM graphs / OCR | **Needs local service** → fallback | Vendored engines + local vision | Gemini vision after miss | OK |
| Profiles / lab progress | **Offline on Q** | SQLite + `localStorage` | — | OK |
| Cameras / mic / speaker HW | **Offline on Q** | CSI / USB / local audio | — | HW-dependent |
| eSIM | **Online fallback only** | ModemManager local | Cellular when curriculum/cloud burst needed | Boot scripts present |

---

## P0 fixes applied (this branch)

1. Browser LiveKit URL no longer hardcodes cloud — uses `/token` → `LIVEKIT_URL` → `ws://127.0.0.1:7880`
2. `/token` returns `livekitUrl` + `offlineMode`
3. `run_agent.py` defaults to **offline** Gemma agent (`OFFLINE_MODE=1`); Gemini Live requires `--online` / `ONLINE_MODE=1`
4. `boot_appliance.sh` exports local-first env and starts offline tutor agent
5. `/api/circuits/ask` queries local LLM before Gemini
6. TTS prefers Riva → Kokoro before Google; Google blocked when `OFFLINE_MODE=1`
7. Batch translations try local path first; Gemini skipped when offline

---

## Remaining P1 (before sealed factory image)

- [ ] Bake `all-MiniLM-L6-v2`, Gemma 4 E4B, Kokoro, and HF S2S weights into the Q image (`HF_HUB_OFFLINE=1`)
- [ ] Vendor fonts / KaTeX / TF.js (remove Google Fonts & jsDelivr from first paint)
- [ ] Replace browser Web Speech STT in Circuits with local STT (Gemma native audio / Whisper)
- [ ] Pre-warm PubChem curriculum cache for taught compounds
- [ ] Single shared `local_miss_then_online()` policy helper used by orchestrator, circuits, translate

---

## Ventuno Q hardware → “you’re ready to go”

When you have:

| Hardware | Role |
|----------|------|
| Arduino Ventuno Q board | On-device Gemma 4 E4B + NPU |
| Desk / document camera | Work observation / OCR |
| Webcam (face) | Presence / Socratic session |
| Speaker + mic | Kokoro TTS + native audio / HF S2S |
| eSIM / modem | Optional online fallback only |

And the image includes:

- Local LiveKit (`:7880`)
- Gemma OpenAI-compatible server (`:8080`)
- Kokoro TTS (`:8880`) + optional Riva Magpie
- Offline agent: `tutor_agent_offline.py` (Gemma native audio ↔ HF S2S ↔ Kokoro)
- Curriculum + LanceDB baked in
- `OFFLINE_MODE=1` (default)

**Then yes — you are ready to run local-first**, including the live conversational tutor path you built (Gemma 4 E4B native audio + Kokoro, HF S2S-managed), with **Gemini Flash Live only as the online escape hatch** when curriculum/local miss.

That is **appliance production-ready** for Ventuno Q — not “needs the cloud to teach.”
