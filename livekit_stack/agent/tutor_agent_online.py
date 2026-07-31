# tutor_agent_online.py - LiveKit WebRTC Agent for Online Testing Phase
import sys
from types import ModuleType
import numpy as np

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
            # Standard audio threshold: if voice RMS energy is above 200, return 1.0 (speaking), else 0.0
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

import os
import logging
import asyncio
import urllib.request
import json
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("online-agent")

# Load environment variables from parent directory .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
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

# Connect to LanceDB (curriculum_video_blocks table)
import lancedb
if os.path.exists("/app/.lancedb"):
    LANCEDB_DIR = "/app/.lancedb"
else:
    LANCEDB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".lancedb"))

try:
    db = lancedb.connect(LANCEDB_DIR)
    # Check if table exists, otherwise wait for ingestion script to run
    if "curriculum_video_blocks" in db.list_tables():
        table = db.open_table("curriculum_video_blocks")
        logger.info(f"Connected to LanceDB at '{LANCEDB_DIR}'. curriculum_video_blocks loaded.")
    else:
        table = None
        logger.warning(f"curriculum_video_blocks table not found in LanceDB. Please run preprocess_curriculum.py first.")
except Exception as e:
    logger.error(f"Failed connecting to LanceDB: {e}")
    table = None

from livekit import agents, rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, stt
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import google, silero, openai

# Custom local Faster-Whisper STT plugin
class FasterWhisperSTT(stt.STT):
    def __init__(self):
        super().__init__(
            capabilities=stt.STTCapabilities(
                streaming=False,
                interim_results=False
            )
        )
        import io
        from faster_whisper import WhisperModel
        # Load lightweight Whisper tiny model running natively on CPU
        self._whisper = WhisperModel("tiny", device="cpu", compute_type="int8")

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

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to LiveKit Cloud Room: {ctx.room.name}")
    
    # 1. Setup VAD (Silero) and STT (Local Faster-Whisper wrapped in a StreamAdapter)
    vad = silero.VAD.load()
    local_stt = FasterWhisperSTT()
    stt_instance = stt.StreamAdapter(stt=local_stt, vad=vad)
    
    # Load active session info to determine locale
    active_locale = "en_US"
    session_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "active_session.json"))
    if os.path.exists(session_file):
        try:
            with open(session_file, "r") as sf:
                s_data = json.load(sf)
                active_locale = s_data.get("active_locale", "en_US")
        except Exception as e:
            logger.warning(f"Failed to read active_session.json: {e}")
    logger.info(f"[AGENT STARTUP] Active Locale resolved to: {active_locale}")

    # 2. Setup LLM (Gemini 2.5 Flash via google plugin)
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    if not google_api_key:
        logger.error("GOOGLE_API_KEY is not defined in the environment. Exiting.")
        return
        
    online_llm = google.LLM(
        model="gemini-flash-latest",
        api_key=google_api_key
    )
    
    # 3. Setup TTS (Check if Kokoro is running, else fallback to SAPI5/Google TTS server)
    kokoro_url = "http://localhost:8880/v1"
    use_kokoro = False
    try:
        # Check if local Kokoro-FastAPI is active
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
        logger.warning("Local Kokoro TTS not active. Falling back to local SAPI5/Google TTS voice via port 8000.")
        tts = openai.TTS(
            model="tts-1",
            voice="local",
            api_key="local-sapi",
            base_url="http://localhost:8000/v1",
            response_format="wav"
        )

    # 4. Initialize Voice Agent and Session
    system_instructions = "You are GANDHO, the Socratic Tutor."
    if active_locale == "fr_FR":
        system_instructions += " Respond ONLY in French. Always ask socratic guidance questions in French."
        
    agent = Agent(
        instructions=system_instructions,
        vad=vad,
        stt=stt_instance,
        llm=online_llm,
        tts=tts,
        chat_ctx=llm.ChatContext()
    )
    
    session = AgentSession(
        vad=vad,
        stt=stt_instance,
        llm=online_llm,
        tts=tts,
    )
 
    # 5. Hybrid LanceDB routing handler
    @session.on("user_speech_committed")
    def on_user_speech(msg: rtc.ChatMessage):
        student_query = msg.content
        logger.info(f"Student asked: {student_query}")
        
        if table is None:
            logger.warning("LanceDB curriculum table is not loaded. Defaulting to general knowledge.")
            system_prompt = (
                "You are GANDHO, the Socratic Tutor. The curriculum database is offline.\n"
                "Answer the student's question using your global body of knowledge. Ask guiding Socratic questions. Keep responses under 3 sentences."
            )
            if active_locale == "fr_FR":
                system_prompt += " RESPOND ONLY IN FRENCH. Ask questions in French."
            agent.chat_ctx.messages.clear()
            agent.chat_ctx.append(role="system", text=system_prompt)
            return
 
        try:
            # Vector/Full-Text Search the student's query in our preprocessed blocks
            results = table.search(student_query).limit(1).to_list()
            
            # Filter out the dummy entry if it returned
            results = [r for r in results if r["video_id"] != "dummy"]
            
            if results:
                match = results[0]
                logger.info(f"[LANCEDB MATCH] Found matching curriculum content in video '{match['video_id']}' at timestamp {match['timestamp']}")
                
                system_prompt = (
                    "You are GANDHO, the Socratic Tutor. The student is asking a question about their video curriculum.\n"
                    f"Based on the preprocessed video segment at timestamp {match['timestamp']} (Title: {match['title']}), "
                    f"here is the exact context: {match['transcript_summary']}.\n"
                    "Guide the student using ONLY this curriculum context. Do not give the answers directly. Ask guiding questions. Keep responses under 3 sentences."
                )
                if active_locale == "fr_FR":
                    system_prompt += " RESPOND ONLY IN FRENCH. Ask questions in French."
            else:
                logger.info("[LANCEDB MATCH] No curriculum match found. Falling back to Gemini's global knowledge.")
                system_prompt = (
                    "You are GANDHO, the Socratic Tutor. Answer the student's question using your global body of knowledge.\n"
                    "Do not give the answers directly. Ask guiding Socratic questions. Keep responses under 3 sentences."
                )
                if active_locale == "fr_FR":
                    system_prompt += " RESPOND ONLY IN FRENCH. Ask questions in French."
                
            agent.chat_ctx.messages.clear()
            agent.chat_ctx.append(role="system", text=system_prompt)
            
        except Exception as err:
            logger.error(f"[ROUTING ERROR] Error querying LanceDB: {err}")
 
    # Connect to room and play initial greeting
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    await session.start(agent, room=ctx.room)
    logger.info("Agent successfully connected and listening...")
    
    greeting = "Hello! I am GANDHO, your Socratic tutor. Let's discuss your curriculum video."
    if active_locale == "fr_FR":
        greeting = "Bonjour ! Je suis GANDHO, votre tuteur socratique en ligne. Parlons de votre vidéo de cours."
        
    await session.say(greeting, allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
