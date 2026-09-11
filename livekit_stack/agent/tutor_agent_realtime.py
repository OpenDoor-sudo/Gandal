# tutor_agent_realtime.py - Native Gemini Multimodal Live API Agent with Dynamic State & Video Context
import os
import logging
import asyncio
import sqlite3
import json
from dotenv import load_dotenv
from types import ModuleType
import sys

# Workaround: Mock local_inference to bypass Windows native DLL crashes
class MockVAD:
    def __init__(self, *args, **kwargs):
        pass
    def predict(self, window):
        return 0.0

mock_module = ModuleType("livekit.local_inference")
mock_module.EOT_MAX_SAMPLES = 1000
mock_module.VAD_WINDOW_SAMPLES = 512
mock_module.EOT = object
mock_module.VAD = MockVAD
mock_module.init_eot = lambda *args, **kwargs: None
mock_module.init_vad = lambda *args, **kwargs: None
sys.modules["livekit.local_inference"] = mock_module

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("realtime-agent")

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
    if "curriculum_video_blocks" in db.table_names():
        table = db.open_table("curriculum_video_blocks")
        logger.info(f"Connected to LanceDB at '{LANCEDB_DIR}'. curriculum_video_blocks loaded.")
    else:
        table = None
        logger.warning(f"curriculum_video_blocks table not found in LanceDB. Please run preprocess_curriculum.py first.")
except Exception as e:
    logger.error(f"Failed connecting to LanceDB: {e}")
    table = None

from livekit import agents, rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import google

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to LiveKit Cloud Room: {ctx.room.name}")
    
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    if not google_api_key:
        logger.error("GOOGLE_API_KEY is not defined in the environment. Exiting.")
        return

    # 1. Resolve Active Video ID and Human-Readable Title
    active_video_id = None
    session_json_path = "c:/Users/lalyb/Desktop/ventuno_ai_testbed/active_session.json"
    if os.path.exists(session_json_path):
        try:
            with open(session_json_path, "r", encoding="utf-8") as f:
                active_video_id = json.load(f).get("active_video_id")
                logger.info(f"[SESSION] Loaded active video ID '{active_video_id}' from shared session file.")
        except Exception as e:
            logger.warning(f"Failed to read active_session.json: {e}")
            
    video_title = "your active lesson"
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "vault.db"))
    if active_video_id and os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (active_video_id,))
            row = cursor.fetchone()
            if row:
                video_title = row[0]
                logger.info(f"[SQLITE] Resolved video_id '{active_video_id}' to title: '{video_title}'")
            conn.close()
        except Exception as e:
            logger.warning(f"Failed to query SQLite database for video title: {e}")

    # 2. Query LanceDB for curriculum segments context
    initial_instructions = (
        "You are GANDHO, the Socratic Tutor. The student is currently studying their video curriculum.\n"
        "Guide the student using Socratic questioning. Do not give direct answers. Keep responses under 3 sentences."
    )
    if active_video_id and table is not None:
        try:
            # Fetch segments for the active video
            results = table.search("").where(f"video_id = '{active_video_id}'").limit(5).to_list()
            # Filter out dummy entries
            results = [r for r in results if r["video_id"] != "dummy"]
            if results:
                combined_summaries = "\n".join([f"- Segment at timestamp {r['timestamp']}: {r['transcript_summary']}" for r in results])
                initial_instructions = (
                    "You are GANDHO, the Socratic Tutor. The student is currently studying their video curriculum.\n"
                    f"Active Video: '{video_title}' (Video ID: {active_video_id})\n"
                    f"Curriculum context segments:\n{combined_summaries}\n"
                    "Guide the student using ONLY this curriculum context. Do not give the answers directly. Ask guiding questions. Keep responses under 3 sentences."
                )
                logger.info(f"[CONTEXT] Seeding Gemini Live instructions with {len(results)} curriculum segments for '{video_title}'.")
        except Exception as err:
            logger.warning(f"Failed to load LanceDB curriculum summaries: {err}")
        
    # 3. Initialize the Native Gemini Multimodal Live model (runs fully in the cloud)
    realtime_llm = google.realtime.RealtimeModel(
        model="gemini-2.0-flash-exp",
        api_key=google_api_key,
        voice="Aoede",  # Options: Aoede, Puck, Charon, Kore, Fenrir
        instructions=initial_instructions
    )
    
    # Initialize Voice Agent in native Realtime mode (VAD, STT, and TTS are bypassed locally!)
    agent = Agent(
        instructions="You are GANDHO, the Socratic Tutor.",
        llm=realtime_llm,
        chat_ctx=llm.ChatContext()
    )
    
    session = AgentSession(
        llm=realtime_llm,
    )
 
    # Hybrid LanceDB routing handler (updates system instructions based on user conversation changes)
    @session.on("user_speech_committed")
    def on_user_speech(msg: rtc.ChatMessage):
        student_query = msg.content
        logger.info(f"Student asked: {student_query}")
        
        if table is None:
            return
 
        try:
            results = table.search(student_query).limit(1).to_list()
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
                
                agent.chat_ctx.messages.clear()
                agent.chat_ctx.append(role="system", text=system_prompt)
                if session.activity and hasattr(session.activity, "_rt_session") and session.activity._rt_session:
                    asyncio.create_task(session.activity._rt_session.update(instructions=system_prompt))
            
        except Exception as err:
            logger.error(f"[ROUTING ERROR] Error querying LanceDB: {err}")
 
    # Listen for final conversation messages and stream them to the room data channel
    @session.on("conversation_item_added")
    def on_conversation_item(ev: agents.voice.ConversationItemAddedEvent):
        item = ev.item
        if isinstance(item, llm.ChatMessage):
            logger.info(f"[CHAT EVENT] Role: {item.role}, Text: {item.text_content}")
            payload_data = {
                "type": "chat_message",
                "role": item.role,
                "text": item.text_content,
                "timestamp": ev.created_at
            }
            asyncio.create_task(ctx.room.local_participant.publish_data(
                payload=json.dumps(payload_data).encode('utf-8'),
                topic="tutor-transcripts"
            ))
 
    # Connect to room and start the session
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    await session.start(agent, room=ctx.room)
    logger.info("Agent successfully connected and listening...")
    
    # Trigger initial greeting referencing the active video title
    greeting_instruction = (
        f"Hello! Introduce yourself as GANDHO, the Socratic Tutor, state that you are ready to discuss their "
        f"active curriculum video '{video_title}', and ask what questions they have."
    )
    session.generate_reply(
        user_message=llm.ChatMessage(
            role="user",
            content=greeting_instruction
        )
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
