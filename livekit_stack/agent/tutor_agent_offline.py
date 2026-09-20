# tutor_agent_offline.py - LiveKit Agent for 100% Offline Local Operation
import sys
from types import ModuleType
import numpy as np

# Honor caller-set hub flags. Do not force HF offline: Faster-Whisper tiny
# weights must be downloadable on a first Linux boot.
import os

# Workaround: Mock VAD with a pure-python RMS implementation to bypass native Windows DLL crashes
class MockVAD:
    def __init__(self, *args, **kwargs):
        pass
    def predict(self, window):
        try:
            if len(window) == 0:
                return 0.0
            # Calculate RMS energy of the audio chunk
            rms = np.sqrt(np.mean(window.astype(np.float32) ** 2))
            # Audio threshold: if voice RMS energy is above 200, return 1.0 (speaking), else 0.0
            return 1.0 if rms > 200.0 else 0.0
        except Exception:
            return 0.0

mock_module = ModuleType("livekit.local_inference")
mock_module.EOT_MAX_SAMPLES = 1000
mock_module.VAD_WINDOW_SAMPLES = 512
mock_module.EOT = object
mock_module.VAD = MockVAD
mock_module.init_eot = lambda *args, **kwargs: None
mock_module.init_vad = lambda *args, **kwargs: None
sys.modules["livekit.local_inference"] = mock_module

import logging
import asyncio
import urllib.request
import json
import lancedb

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("offline-agent")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(PROJECT_ROOT)

SESSION_JSON_PATH = os.environ.get(
    "SESSION_JSON_PATH",
    os.path.join(os.environ.get("GANDHO_PROJECT_ROOT", PROJECT_ROOT), "active_session.json"),
)

# Load environment variables from parent directory .env
env_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        k = parts[0].strip()
                        v = parts[1].strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v
        logger.info(f"Loaded variables from '{env_path}'")
    except Exception as err:
        logger.warning(f"Failed to read .env file: {err}")

# Import OKF Student Memory Graph manager
try:
    import student_memory
    logger.info("Successfully loaded student_memory OKF module.")
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    import student_memory

# Connect to LanceDB (curriculum_video_blocks table)
LANCEDB_DIR = os.path.join(PROJECT_ROOT, ".lancedb")
try:
    db = lancedb.connect(LANCEDB_DIR)
    if "curriculum_video_blocks" in db.list_tables():
        table = db.open_table("curriculum_video_blocks")
        logger.info(f"Connected to LanceDB at '{LANCEDB_DIR}'. curriculum_video_blocks loaded.")
    else:
        table = None
        logger.warning("curriculum_video_blocks table not found in LanceDB.")
except Exception as e:
    logger.error(f"Failed connecting to LanceDB: {e}")
    table = None

from livekit import agents, rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, stt
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import silero, openai

# Faster-Whisper is the working offline STT. There is no Gemma native-audio /
# Hexagon NPU pipeline in this tree; USE_NATIVE_AUDIO_INPUT is ignored.
class FasterWhisperSTT(stt.STT):
    def __init__(self):
        super().__init__(
            capabilities=stt.STTCapabilities(
                streaming=False,
                interim_results=False
            )
        )
        try:
            from faster_whisper import WhisperModel
            self._whisper = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception as err:
            raise RuntimeError(
                "Faster-Whisper STT failed to load the 'tiny' model. Install faster-whisper "
                "and allow the model download (unset HF_HUB_OFFLINE). "
                "Gemma native-audio / NPU STT is not implemented in this tree."
            ) from err

    @property
    def model(self) -> str:
        return "whisper-tiny"

    async def _recognize_impl(
        self,
        buffer,
        *,
        language: str | None = None,
        conn_options = None,
    ) -> stt.SpeechEvent:
        try:
            import io
            combined = rtc.combine_audio_frames(buffer)
            wav_bytes = combined.to_wav_bytes()
            
            loop = asyncio.get_running_loop()
            
            def transcribe_sync():
                segments, info = self._whisper.transcribe(io.BytesIO(wav_bytes), beam_size=1)
                text = "".join([segment.text for segment in segments]).strip()
                return text, info.language

            text, lang = await loop.run_in_executor(None, transcribe_sync)
            
            return stt.SpeechEvent(
                type=stt.SpeechEventType.FINAL_TRANSCRIPT,
                alternatives=[
                    stt.SpeechData(
                        language=lang,
                        text=text
                    )
                ]
            )
        except Exception as err:
            logger.error(f"[LOCAL WHISPER ERROR] Transcription failed: {err}")
            raise

import datetime

OFFLINE_GREETED_VIDEOS_CACHE = set()

def get_time_greeting(locale_str: str = "fr_FR") -> str:
    """Calculate time-appropriate greeting based on local system time."""
    hour = datetime.datetime.now().hour
    if locale_str == "fr_FR":
        if 5 <= hour < 12:
            return "Bonjour"
        elif 12 <= hour < 17:
            return "Bon après-midi"
        else:
            return "Bonsoir"
    else:
        if 5 <= hour < 12:
            return "Good morning"
        elif 12 <= hour < 17:
            return "Good afternoon"
        else:
            return "Good evening"

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to LiveKit Offline Room: {ctx.room.name}")
    
    local_llm_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:8080/v1")
    if os.environ.get("USE_NATIVE_AUDIO_INPUT", "0") == "1":
        logger.warning(
            "[OFFLINE STT] USE_NATIVE_AUDIO_INPUT=1 is set, but Gemma native-audio / NPU "
            "STT is not implemented. Using Faster-Whisper instead (no fake base64 transcripts)."
        )

    # 1. Setup VAD (Silero) and Faster-Whisper STT
    vad = silero.VAD.load()
    logger.info("[OFFLINE STT] Mode: Faster-Whisper (tiny, CPU).")
    audio_in = FasterWhisperSTT()
        
    stt_instance = stt.StreamAdapter(stt=audio_in, vad=vad)
    
    # 2. Resolve Active Locale and OKF Student Profile
    active_locale = "en_US"
    session_file = SESSION_JSON_PATH
    student_id = "Alseny"
    s_data = {}
    if os.path.exists(session_file):
        try:
            with open(session_file, "r") as sf:
                s_data = json.load(sf)
                active_locale = s_data.get("active_locale", "en_US")
                student_id = s_data.get("active_student_id") or s_data.get("active_student_name") or "Alseny"
        except Exception as e:
            logger.warning(f"Failed to read active_session.json: {e}")
    else:
        logger.warning(
            f"[SESSION] {session_file} is missing. Using student_id={student_id!r}. "
            "Start display_client.py so the classroom can write this file."
        )

    logger.info(f"[OFFLINE AGENT STARTUP] Student ID: '{student_id}' | Active Locale: {active_locale} | session={session_file}")

    # Load OKF Student Memory Profile
    okf_meta, okf_body = student_memory.get_subject_profile(student_id, "general")
    student_style = okf_meta.get("learning_style", "visual")
    student_struggles = okf_meta.get("struggles", [])
    if isinstance(student_struggles, list):
        student_struggles_str = ", ".join(student_struggles)
    else:
        student_struggles_str = str(student_struggles)

    # 3. Setup Local LLM (OpenAI-compatible local server on port 8080 or llama.cpp)
    local_llm_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:8080/v1")
    logger.info(f"Connecting to Local LLM endpoint at: {local_llm_url}")
    
    offline_llm = openai.LLM(
        model="gemma-4-e4b",
        api_key="local-offline",
        base_url=local_llm_url
    )
    
    # 4. Setup TTS (Kokoro server or local SAPI5/TTS port 8000)
    kokoro_url = os.environ.get("KOKORO_URL", "http://localhost:8880/v1")
    use_kokoro = False
    try:
        req = urllib.request.Request(f"{kokoro_url}/models", method="GET")
        with urllib.request.urlopen(req, timeout=0.5) as r:
            if r.status == 200:
                use_kokoro = True
    except Exception:
        pass
        
    if use_kokoro:
        logger.info(f"Local Kokoro TTS server detected at {kokoro_url}. Routing audio output to Kokoro.")
        tts = openai.TTS(
            model="kokoro",
            voice="af_alloy",
            api_key="not-needed",
            base_url=kokoro_url
        )
    else:
        logger.error(
            "[OFFLINE TTS] Kokoro is not reachable at %s. There is no local Piper/SAPI/NPU TTS "
            "in this tree. Speech output will fail until Kokoro is started on :8880 "
            "(or KOKORO_URL points at a real OpenAI-compatible TTS).",
            kokoro_url,
        )
        tts = openai.TTS(
            model="tts-1",
            voice="local",
            api_key="local-sapi",
            base_url="http://localhost:8000/v1",
            response_format="wav"
        )

    # 5. Build Socratic System Prompt with OKF Personalization & Savant Matrix
    savant_context_offline = ""
    try:
        from savant_curriculum_matrix import get_savant_and_connections_context
        active_vid_id = s_data.get("active_video_id", "default_vid") if s_data else "default_vid"
        savant_context_offline = get_savant_and_connections_context(active_vid_id, "General", active_locale)
    except Exception as s_err:
        logger.warning(f"Failed to load savant matrix in offline agent: {s_err}")

    base_instructions = (
        f"You are GANDHO, an empathetic offline Socratic Tutor.\n"
        f"You are tutoring student {student_id.capitalize()}.\n"
        f"Student Learning Style: {student_style}.\n"
        f"Areas Student Struggles With: {student_struggles_str}.\n"
        f"{savant_context_offline}\n"
        "GUIDELINES:\n"
        "1. Adapt greetings to local system time (Bonjour/Good morning, Bon après-midi/Good afternoon, Bonsoir/Good evening).\n"
        "2. DO NOT introduce yourself as 'GANDHO, the Socratic tutor' again if you have already greeted the student during the current video lesson.\n"
        "3. Occasionally ask warm, non-invasive personal questions (e.g. 'How are you feeling today?', 'How is your family doing?') to build personal rapport.\n"
        "4. Include quick historical savant bios, cross-chapter connections, and real-world applications when introducing or explaining topics.\n"
        "5. Never give answers directly. Guide the student with Socratic questions.\n"
        "6. Keep responses short and conversational (under 3 sentences).\n"
        "7. Encourage critical thinking step-by-step."
    )
    if active_locale == "fr_FR":
        base_instructions += "\nIMPORTANT: Respond ONLY in French. Always ask guiding questions in French."

    agent = Agent(
        instructions=base_instructions,
        vad=vad,
        stt=stt_instance,
        llm=offline_llm,
        tts=tts,
        chat_ctx=llm.ChatContext()
    )
    
    session = AgentSession(
        vad=vad,
        stt=stt_instance,
        llm=offline_llm,
        tts=tts,
    )

    # 6. Hybrid LanceDB routing handler & Lab Control
    @session.on("user_speech_committed")
    def on_user_speech(msg: rtc.ChatMessage):
        student_query = msg.content
        logger.info(f"[OFFLINE] Student asked: {student_query}")
        
        # Check for direct lab voice commands in offline speech
        q_lower = student_query.lower()
        if any(w in q_lower for w in ["drop", "lâche", "lache", "gravity", "gravité", "gravite", "wave", "onde", "orbit", "satellite", "reset", "reinit"]):
            cmd_action = "drop_balls" if ("drop" in q_lower or "lâche" in q_lower or "lache" in q_lower) else ("set_gravity" if "grav" in q_lower else ("switch_mode" if ("wave" in q_lower or "onde" in q_lower or "orbit" in q_lower) else "reset"))
            cmd_payload = {"action": cmd_action, "query": student_query}
            try:
                raw_bytes = json.dumps(cmd_payload).encode("utf-8")
                asyncio.create_task(ctx.room.local_participant.publish_data(raw_bytes, topic="lab-control"))
            except Exception:
                pass
            try:
                import urllib.request
                req = urllib.request.Request(
                    "http://localhost:8000/api/v1/lab/command",
                    data=json.dumps(cmd_payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                urllib.request.urlopen(req, timeout=0.5)
            except Exception:
                pass

        if table is None:
            logger.warning("LanceDB curriculum table is offline. Using local LLM general knowledge.")
            return

        try:
            results = table.search(student_query).limit(1).to_list()
            results = [r for r in results if r.get("video_id") != "dummy"]
            
            if results:
                match = results[0]
                logger.info(f"[OFFLINE LANCEDB MATCH] Video '{match.get('video_id')}' at timestamp {match.get('timestamp')}")
                
                context_prompt = (
                    f"{base_instructions}\n"
                    f"Curriculum Segment Context (Title: {match.get('title')}, Time: {match.get('timestamp')}):\n"
                    f"{match.get('transcript_summary')}\n"
                    "Use this exact curriculum context to guide the student Socratically."
                )
                if active_locale == "fr_FR":
                    context_prompt += " RESPOND ONLY IN FRENCH."
                agent.chat_ctx.messages.clear()
                agent.chat_ctx.append(role="system", text=context_prompt)
            else:
                agent.chat_ctx.messages.clear()
                agent.chat_ctx.append(role="system", text=base_instructions)
                
        except Exception as err:
            logger.error(f"[OFFLINE ROUTING ERROR] Error searching LanceDB: {err}")

    # Connect to room and play initial greeting
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    await session.start(agent, room=ctx.room)
    logger.info("Offline Agent successfully connected and listening...")
    
    time_salutation = get_time_greeting(active_locale)
    active_vid = s_data.get("active_video_id", "default_vid") if s_data else "default_vid"
    is_new_vid = active_vid not in OFFLINE_GREETED_VIDEOS_CACHE
    OFFLINE_GREETED_VIDEOS_CACHE.add(active_vid)

    if active_locale == "fr_FR":
        if is_new_vid:
            greeting = f"{time_salutation} {student_id.capitalize()} ! Je suis GANDHO, votre tuteur socratique. Comment vas-tu aujourd'hui ? Prêt à étudier ?"
        else:
            greeting = f"{time_salutation} {student_id.capitalize()} ! Je suis toujours là avec toi. Qu'aimerais-tu explorer maintenant ?"
    else:
        if is_new_vid:
            greeting = f"{time_salutation} {student_id.capitalize()}! I am GANDHO, your Socratic tutor. How are you doing today? Ready to dive in?"
        else:
            greeting = f"{time_salutation} {student_id.capitalize()}! I'm right here with you. What would you like to explore next?"
        
    await session.say(greeting, allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
