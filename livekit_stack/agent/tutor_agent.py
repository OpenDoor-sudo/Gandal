# tutor_agent.py - LiveKit WebRTC Socratic Tutor Agent using Gemini Live API
import sys
from types import ModuleType

# Workaround: Mock livekit.local_inference to bypass Windows native DLL crashes
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

import os
import sqlite3
import json
import logging
import lancedb
import asyncio
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import AgentSession, Agent, ConversationItemAddedEvent, UserInputTranscribedEvent
from livekit.agents.voice.room_io import RoomOptions
from livekit.plugins.google.realtime import RealtimeModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tutor-agent")

# Ensure log output can handle non-ASCII characters such as accented French text
for handler in logger.handlers:
    if hasattr(handler, "stream") and hasattr(handler.stream, "reconfigure"):
        handler.stream.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(PROJECT_ROOT)

# Global memory cache to track greeted videos within the active server process
GREETED_VIDEOS_CACHE = set()

import datetime

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

# Load credentials from parent .env file if available
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
        logger.info(f"Loaded credentials from '{env_path}'")
    except Exception as err:
        logger.warning(f"Failed to read .env file: {err}")

# Ensure LiveKit cloud/dev variables are populated
if "LIVEKIT_URL" not in os.environ:
    os.environ["LIVEKIT_URL"] = "ws://localhost:7880"
if "LIVEKIT_API_KEY" not in os.environ:
    os.environ["LIVEKIT_API_KEY"] = "devkey"
if "LIVEKIT_API_SECRET" not in os.environ:
    os.environ["LIVEKIT_API_SECRET"] = "secretsecretsecretsecretsecretsecretsecret"

# Connect to LanceDB curriculum vector database
if os.path.exists("/app/.lancedb"):
    LANCEDB_DIR = "/app/.lancedb"
else:
    LANCEDB_DIR = os.path.join(PROJECT_ROOT, ".lancedb")

TABLE_RAG = "curriculum_rag"
TABLE_VIDEO = "curriculum_video_blocks"

try:
    db = lancedb.connect(LANCEDB_DIR)
    table_rag = db.open_table(TABLE_RAG)
    table_video = db.open_table(TABLE_VIDEO)
    logger.info(f"Connected to LanceDB at '{LANCEDB_DIR}'. Both RAG and Video tables loaded.")
except Exception as e:
    logger.error(f"Failed connecting to LanceDB: {e}")
    table_rag = None
    table_video = None

# Socratic tutoring system instructions
SYSTEM_INSTRUCTIONS = (
    "You are GANDHO, the Socratic Tutor. Respond in English.\n"
    "Explain physics, economics, or calculus concepts socraticly. Do not give the answers directly.\n"
    "Do not write the final numerical formula or answer directly. Ask guiding Socratic questions. Keep responses under 3 sentences.\n"
    "If a concept requires specific curriculum guidelines (like target mastery, core definitions, or local criteria), use the search_curriculum tool to retrieve them."
)

# LiveKit connection entrypoint
async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)

    # 1. Dynamically resolve active student, video, title, locale, and deployment mode
    active_video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
    student_name = "Student"
    video_title = "Les Problèmes Démographiques"
    locale = "fr_FR"
    active_mode = "CLASSROOM"
    active_pdf_path = None
    
    session_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "active_session.json"))
    if os.path.exists(session_json_path):
        try:
            with open(session_json_path, "r", encoding="utf-8") as f:
                s_data = json.load(f)
                active_video_id = s_data.get("active_video_id", active_video_id)
                active_pdf_path = s_data.get("active_pdf_path")
                locale = s_data.get("active_locale", locale)
                if s_data.get("active_student_name"):
                    student_name = s_data.get("active_student_name")
                elif s_data.get("active_student_id"):
                    student_name = s_data.get("active_student_id")
                if s_data.get("active_mode"):
                    active_mode = s_data.get("active_mode")
        except Exception as e:
            logger.warning(f"Failed to read active_session.json: {e}")

    # Check connected remote participants for dynamic student name and mode metadata
    for p in ctx.room.remote_participants.values():
        if p.name and p.name not in ["student_01", "student"]:
            student_name = p.name
        elif p.identity and p.identity not in ["student_01", "student"]:
            student_name = p.identity
        if p.metadata:
            try:
                p_meta = json.loads(p.metadata)
                if p_meta.get("student_name"):
                    student_name = p_meta.get("student_name")
                if p_meta.get("mode"):
                    active_mode = p_meta.get("mode")
                if p_meta.get("video_id"):
                    active_video_id = p_meta.get("video_id")
            except Exception:
                pass
            
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "vault.db"))
    video_timeline_context = ""
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Resolve video title
            if active_video_id:
                cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (active_video_id,))
                title_row = cursor.fetchone()
                if title_row and title_row[0]:
                    video_title = title_row[0]
                elif "demographique" in active_video_id.lower():
                    video_title = "Les Problèmes Démographiques"
                elif "sanitaire" in active_video_id.lower():
                    video_title = "Les Problèmes Sanitaires"
                elif "alimentaire" in active_video_id.lower():
                    video_title = "Les Problèmes Alimentaires"
                elif "chem" in active_video_id.lower():
                    video_title = "Chimie Organique"
                else:
                    video_title = active_video_id.replace("vid_", "").replace("economics_extraeconomiques_", "").replace("_", " ").title()

            # Query and append chapters to ground the tutoring context directly in the system prompt
            if active_video_id:
                cursor.execute("""
                    SELECT timestamp, title, description 
                    FROM video_timestamps 
                    WHERE video_id = ?
                    ORDER BY timestamp ASC
                """, (active_video_id,))
                rows = cursor.fetchall()
                if rows:
                    video_timeline_context = f"\nVideo Chapters & Content summaries for '{video_title}':\n"
                    for ts, title, desc in rows:
                        video_timeline_context += f"- [{ts}] {title}: {desc}\n"
            conn.close()
            logger.info(f"[DYNAMIC BOOT] Resolved student: '{student_name}' | Mode: '{active_mode}' | Locale: '{locale}' | Video: '{video_title}' ({active_video_id})")
        except Exception as e:
            logger.warning(f"Failed to query SQLite for dynamic instructions: {e}")

    # Resolve active subject
    active_subject = "Economics"
    if active_video_id:
        try:
            parent_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            if parent_parent_dir not in sys.path:
                sys.path.append(parent_parent_dir)
            from orchestrator import get_subject_by_video_id
            active_subject = get_subject_by_video_id(active_video_id)
        except Exception as e:
            logger.warning(f"Failed to resolve subject: {e}")

    # Read student memory from OKF files if in Solo mode
    student_style = "Visual & Step-by-Step"
    student_excels_str = ""
    student_struggles_str = ""
    
    if active_mode == "SOLO":
        try:
            import student_memory
            import re
            prof_meta, prof_body = student_memory.load_or_create_subject_profile(student_name, active_subject)
            student_style = prof_meta.get("learning_style", "Visual & Step-by-Step")
            
            def extract_bullets_section(body, heading):
                pattern = rf"## {re.escape(heading)}[^\n]*\n(.*?)(?=\n## |\Z)"
                match = re.search(pattern, body, re.DOTALL)
                if match:
                    bullets = []
                    for line in match.group(1).strip().splitlines():
                        line_strip = line.strip().lstrip("*-").strip()
                        if line_strip:
                            bullets.append(f"- {line_strip}")
                    return "\n".join(bullets)
                return ""
                
            student_excels_str = extract_bullets_section(prof_body, "Where They Excel")
            student_struggles_str = extract_bullets_section(prof_body, "Where They Struggle")
        except Exception as mem_err:
            logger.warning(f"Failed to load OKF student memory: {mem_err}")

    # Helper to rebuild dynamic instructions based on client view state (dashboard, split_workspace, evaluation, screen_share)
    def rebuild_dynamic_instructions(view_state: str, pdf_path: str, pdf_name: str, view_context: str = "") -> str:
        if locale == "fr_FR":
            lang_instruction = (
                "IMPORTANT: Speak and respond in French. Tu dois parler en français.\n"
                "If the student shares an English document, PDF, slide, or screen, read it and explain/discuss it in French."
            )
            role_instruction = "Vous êtes GANDHO, le tuteur socratique. Soyez chaleureux, bavard, explicatif et stimulant."
        else:
            lang_instruction = "Respond in English."
            role_instruction = "You are GANDHO, the Socratic Tutor. Be warm, chatty, explanatory, and intellectually engaging."

        # Dynamic Mode Description
        if active_mode == "CLASSROOM":
            mode_guideline = (
                f"### MODE: CLASSROOM FLEET (Interactive Lecture)\n"
                f"- The classroom is watching the master lesson '{video_title}'.\n"
                f"- The student asking you a question right now is {student_name} from their desk tablet/laptop.\n"
                f"- Address {student_name} warmly by name ({student_name}), answer their specific question about '{video_title}' clearly in 2-3 sentences, and provide a helpful Socratic guiding thought.\n"
            )
        elif active_mode == "POD":
            mode_guideline = (
                f"### MODE: STUDY POD (Collaborative Table Group)\n"
                f"- Students are collaborating at a table group on '{video_title}'.\n"
                f"- The student speaking right now is {student_name}.\n"
                f"- Address {student_name} warmly and guide the group's collaborative reasoning.\n"
            )
        else:
            mode_guideline = (
                f"### MODE: SOLO OWNER (1-on-1 Personalized Tutoring)\n"
                f"- You are in a 1-on-1 private tutoring session with {student_name}.\n"
                f"- You are studying the video lesson '{video_title}'.\n"
                f"- Address {student_name} warmly by name and personalize your Socratic dialogue to their pace.\n"
            )

        chatty_socratic_guidelines = (
            "STYLE & SOCRATIC PEDAGOGICAL GUIDELINES:\n"
            f"- {mode_guideline}"
            "- Adapt greetings to local system time (Bonjour / Bon après-midi / Bonsoir in French; Good morning / Good afternoon / Good evening in English).\n"
            "- Always call the student by their logged-in name: " + student_name + ".\n"
            "- EXPLANATION FIRST: Always provide a clear, thorough explanation or conceptual breakdown FIRST (2-3 structured sentences explaining the core idea clearly) before asking follow-up questions.\n"
            "- LISTEN & FOLLOW USER INTENT IN TEXTBOOKS/PDFs: When the student opens or navigates a textbook, PDF, or audiobook, acknowledge their exact location. Ask if they want a conceptual explanation first, or if they prefer to jump straight into questions or debate. Follow their preference!\n"
            "- INTELLECTUAL DEBATE & RESPECTFUL PUSHBACK (Philosophy, Ethics, Literature, History): For debate-oriented subjects, act as a real Socratic debate partner! Do NOT just passively agree with everything the student says. If the student makes an assertion or argument, respectfully push back with counter-arguments, test their logic, and foster a vibrant back-and-forth intellectual dialogue!\n"
            "- VIDEO LESSON MODE & HAND-RAISE: When watching a video lesson or when the student raises their hand/asks a question, answer their specific question about '" + video_title + "' directly and guide them with a Socratic question.\n"
            "- Do NOT give away direct numerical answers, final option letters (A, B, C, D) on quizzes, or formulas directly without guiding the student to reason through the steps."
        )

        if view_state == "screen_share":
            location_info = ""
            if view_context and "Question 1:" in view_context:
                location_info = f"\nThe student is currently in the Evaluation/Mastery tab working on a quiz. Screen content:\n{view_context}\n"
            elif view_context and ("Reviewing textbook" in view_context or "Whiteboard" in view_context):
                location_info = f"\nThe student is currently working in the split-screen workspace. Context:\n{view_context}\n"
            
            instructions = (
                f"Role:\n"
                f"{role_instruction}\n"
                f"{lang_instruction}\n"
                f"The student's name is {student_name}.\n"
                f"IMPORTANT: The student is currently sharing their screen with you.{location_info}\n"
                f"Your task is to look carefully at the live video stream of what the student is showing on their screen (e.g. book title, author, chapter, text, diagram, or slides).\n"
                f"Read the exact title and text on their screen. Explain the key points first, and then discuss or debate it with them.\n"
                f"CRITICAL: DO NOT guess or assume the shared material is about 'Economics' or any default topic unless the text on the shared screen explicitly says so! Read and discuss ONLY what is visually visible on the shared screen.\n"
                f"DO NOT try to relate or connect the conversation back to the playing video lesson unless the student explicitly asks about it.\n"
                f"{chatty_socratic_guidelines}"
            )
        elif view_state == "split_workspace" and pdf_path:
            workspace_context_str = f"\nActive workspace details: {view_context}\n" if view_context else ""
            instructions = (
                f"Role:\n"
                f"{role_instruction}\n"
                f"{lang_instruction}\n"
                f"The student's name is {student_name}.\n"
                f"IMPORTANT: The student is currently studying the textbook: '{pdf_name}' (PDF path: {pdf_path}) in the split-screen workspace.\n"
                f"{workspace_context_str}"
                f"CRITICAL: You HAVE DIRECT FULL ACCESS to the complete content of this textbook '{pdf_name}' in your LanceDB vector database via the search_curriculum tool.\n"
                f"Whenever the student asks any question about the textbook, author, introduction, definitions, chapters, or concepts, YOU MUST IMMEDIATELY CALL THE search_curriculum(query) TOOL to retrieve the exact text.\n"
                f"NEVER tell the student that you don't have access to the textbook or ask them to read text aloud to you. You have full access to search the textbook via search_curriculum!\n"
                f"Always give a clear conceptual explanation of the text/page FIRST when asked, or ask the student if they prefer an explanation or direct debate. In Philosophy/Literature, actively debate and respectfully push back on their points with counter-arguments!\n"
                f"DO NOT try to relate the conversation back to the playing video lesson unless the student explicitly asks. Focus 100% on the textbook '{pdf_name}'.\n"
                f"{chatty_socratic_guidelines}"
            )
        elif view_state == "evaluation":
            quiz_context_str = f"\nActive Quiz Questions on the student's screen:\n{view_context}\n" if view_context else ""
            instructions = (
                f"Role:\n"
                f"{role_instruction}\n"
                f"{lang_instruction}\n"
                f"The student's name is {student_name}.\n"
                f"IMPORTANT: The student is currently in the Evaluation/Mastery tab working on a Multiple Choice Quiz (MCQ).\n"
                f"{quiz_context_str}"
                f"Your task is to focus directly on the MCQs on the student's screen. Read the questions and answer choices aloud with the student, explain the underlying concept or terms briefly, and ask Socratic questions to help them eliminate wrong choices and solve the question step-by-step.\n"
                f"DO NOT give direct answers, final option letters (A, B, C, D), or numerical formulas directly. DO NOT relate back to the main video unless asked.\n"
                f"{chatty_socratic_guidelines}"
            )
        elif view_state == "virtual_labs":
            telemetry_detail = ""
            if view_context:
                try:
                    parsed = json.loads(view_context) if isinstance(view_context, str) and view_context.strip().startswith("{") else view_context
                    if isinstance(parsed, dict):
                        telemetry_detail = "\nCURRENT EXPERIMENT LIVE TELEMETRY & MEASUREMENTS:\n"
                        for k, v in parsed.items():
                            telemetry_detail += f"- {k}: {v}\n"
                    else:
                        telemetry_detail = f"\nCURRENT EXPERIMENT CONTEXT:\n{view_context}\n"
                except Exception:
                    telemetry_detail = f"\nCURRENT EXPERIMENT CONTEXT:\n{view_context}\n"

            instructions = (
                f"Role:\n"
                f"{role_instruction}\n"
                f"{lang_instruction}\n"
                f"The student's name is {student_name}.\n"
                f"IMPORTANT: The student is actively working inside the STEM VIRTUAL LABS (Chemistry Titration & Dilution, Physics Mechanics & Free Fall, RDKit Organic Molecules, SymPy Wave Calculus, or PubChem Database).\n"
                f"{telemetry_detail}\n"
                f"CRITICAL SOCRATIC LAB INSTRUCTIONS:\n"
                f"- You have DIRECT REAL-TIME VISION of the student's lab bench through the telemetry above and via the get_virtual_lab_status() tool.\n"
                f"- Always address {student_name} warmly, acknowledge the exact experiment they are running, and refer to their real measurements (pH, mL volume, reagents, gravity, speed, formula, or molecule name).\n"
                f"- Act as an encouraging, inspiring Socratic science professor: ask what they predict will happen, guide them to interpret their readings, and help them achieve the lab mission step-by-step.\n"
                f"- NEVER give direct numerical answers immediately; encourage hypotheses, observation, and reasoning.\n"
                f"{chatty_socratic_guidelines}"
            )
        else:
            instructions = (
                f"Role:\n"
                f"{role_instruction}\n"
                f"{lang_instruction}\n"
                f"The student's name is {student_name}.\n"
                f"You are currently discussing the active video lecture '{video_title}'.\n"
                f"{video_timeline_context}\n"
                f"DO NOT force the student to stay strictly on the video if they bring up broader topics or screen shares.\n"
                f"{chatty_socratic_guidelines}"
            )

        # Read OKF Session State Bookmark for memory recall continuity in Solo mode
        last_bookmark_str = ""
        if active_mode == "SOLO":
            sess_state_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "student_profiles", student_name, "session_state.md"))
            if os.path.exists(sess_state_file):
                try:
                    with open(sess_state_file, "r", encoding="utf-8") as sf:
                        last_bookmark_str = sf.read()
                except Exception:
                    pass

        # Append Student Memory Context to instructions
        memory_context = (
            f"\n\n## STUDENT PERSONALIZATION & PROGRESS (STRICTLY CONFIDENTIAL)\n"
            f"- Student Name: {student_name}\n"
            f"- Deployment Mode: {active_mode}\n"
            f"- Learning Style: {student_style}\n"
        )
        if student_excels_str:
            memory_context += f"- Excel Areas in {active_subject}:\n{student_excels_str}\n"
        if student_struggles_str:
            memory_context += f"- Struggle Areas in {active_subject} (Adapt your Socratic guidance to address these!):\n{student_struggles_str}\n"
        if last_bookmark_str and active_mode == "SOLO":
            memory_context += f"- OKF PREVIOUS SESSION BOOKMARK & RECALL:\n{last_bookmark_str}\n"

        # Resolve Savant & Interdisciplinary Connections Matrix
        savant_context = ""
        try:
            from savant_curriculum_matrix import get_savant_and_connections_context
            savant_context = get_savant_and_connections_context(active_video_id, active_subject, locale)
        except Exception as s_err:
            logger.warning(f"Failed to load savant matrix: {s_err}")

        instructions += memory_context + "\n" + savant_context
        return instructions

    # Resolve initial states
    initial_view_state = "dashboard"
    initial_view_context = ""
    initial_pdf_path = ""
    initial_pdf_name = ""
    if os.path.exists(session_json_path):
        try:
            with open(session_json_path, "r", encoding="utf-8") as f:
                s_data = json.load(f)
                initial_view_state = s_data.get("active_view_state", "dashboard")
                initial_view_context = s_data.get("active_view_context", "")
                initial_pdf_path = s_data.get("active_pdf_path", "")
                initial_pdf_name = s_data.get("active_pdf_name", "")
        except Exception:
            pass

    dynamic_instructions = rebuild_dynamic_instructions(initial_view_state, initial_pdf_path, initial_pdf_name, initial_view_context)

    # Load voice preference from active_session.json
    voice_pref = "Aoede"
    if os.path.exists(session_json_path):
        try:
            with open(session_json_path, "r", encoding="utf-8") as f:
                voice_pref = json.load(f).get("tutor_voice", "Aoede")
        except Exception:
            pass
            
    # Initialize Gemini 2.0 Flash Live API model
    google_key = os.environ.get("GOOGLE_API_KEY", "")
    gemini_live = RealtimeModel(
        model="gemini-3.1-flash-live-preview",
        voice=voice_pref,  # Dynamically loaded voice (Aoede, Puck, Charon, Kore, Fenrir)
        instructions=dynamic_instructions,
        api_key=google_key
    )

    async def translate_via_gemini(text: str, target_locale: str) -> str:
        google_key = os.environ.get("GOOGLE_API_KEY")
        if not google_key or not text.strip():
            return text
    
        lang_map = {
            "en_US": "English",
            "fr_FR": "French",
            "zh_CN": "Chinese",
            "es_ES": "Spanish",
            "pt_PT": "Portuguese",
            "ar_AE": "Arabic"
        }
        target_lang = lang_map.get(target_locale, "English")
    
        try:
            from google import genai
            client = genai.Client(api_key=google_key)
            prompt = (
                f"You are a professional real-time translator. Translate the following text into fluent, natural {target_lang}. "
                f"Respond ONLY with the translation. Do not add explanations, notes, or quotes.\n\nText:\n{text}"
            )
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            translated = response.text.strip().strip('"')
            logger.info(f"[TOOL TRANSLATION] Translated text to {target_lang} successfully.")
            return translated
        except Exception as e:
            logger.warning(f"[TOOL TRANSLATION ERROR] Gemini translate failed: {e}")
            return text

    # Define curriculum RAG tool using closure
    @llm.function_tool(
        description="Search the curriculum database for physics, economics, or calculus guidelines and definitions."
    )
    async def search_curriculum(query: str) -> str:
        """Search the curriculum for context matching the query."""
        logger.info(f"[TOOL USE] Gemini Live requested curriculum search for query: '{query}'")
        if not table_rag and not table_video:
            return "No curriculum database connected."
        
        try:
            # 1. Resolve student and instructor locales dynamically
            db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "vault.db"))
            student_locale = "en_US"
            instructor_locale = "en_US"
            
            # Read active_video_id and active_pdf_path from active_session.json
            active_video_id = None
            active_pdf_path = None
            session_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "active_session.json"))
            if os.path.exists(session_path):
                try:
                    with open(session_path, "r") as sf:
                        sdata = json.load(sf)
                        active_video_id = sdata.get("active_video_id")
                        active_pdf_path = sdata.get("active_pdf_path")
                except Exception as e:
                    logger.warning(f"Failed to read active_session.json: {e}")

            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    
                    # Resolve student locale
                    cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                    user_row = cursor.fetchone()
                    if user_row:
                        student_name = user_row[0]
                        cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (student_name,))
                        loc_row = cursor.fetchone()
                        if loc_row:
                            student_locale = loc_row[0]
                            
                    # Resolve instructor locale
                    if active_video_id:
                        cursor.execute("""
                            SELECT i.locale 
                            FROM instructors i
                            JOIN lesson_metadata lm ON i.instructor_id = lm.instructor_id
                            WHERE lm.video_id = ?
                        """, (active_video_id,))
                        row = cursor.fetchone()
                        if row:
                            instructor_locale = row[0]
                    elif active_pdf_path:
                        cursor.execute("""
                            SELECT i.locale 
                            FROM instructors i
                            JOIN lesson_metadata lm ON i.instructor_id = lm.instructor_id
                            WHERE lm.pdf_file_path = ? OR lm.pdf_file_path = ?
                        """, (active_pdf_path, "/" + active_pdf_path.lstrip("/")))
                        row = cursor.fetchone()
                        if row:
                            instructor_locale = row[0]
                    conn.close()
                except Exception as e:
                    logger.warning(f"Failed to query locales from SQLite: {e}")

            logger.info(f"[TOOL USE] Student locale: {student_locale} | Instructor locale: {instructor_locale}")

            # 2. Translate search query to instructor locale if mismatch
            target_query = query
            if student_locale != instructor_locale:
                target_query = await translate_via_gemini(query, instructor_locale)
                logger.info(f"[TOOL USE] Translated query '{query}' to '{target_query}' for database matching.")

            # 3. Clean and split target_query
            STOPWORDS = {
                "what", "is", "the", "of", "and", "a", "to", "in", "that", "for", "it", "on", 
                "with", "as", "at", "by", "an", "be", "this", "are", "can", "you", "tell", 
                "me", "about", "explain", "how", "why", "who", "where", "your", "my", "does",
                "do", "did", "have", "has", "had", "le", "la", "les", "de", "du", "un", "une", 
                "et", "est", "en", "pour", "dans", "sur", "ce", "cette", "ces", "qui", "que", 
                "quoi", "comment", "expliquer", "parler", "nous", "vous", "je", "tu", "il", "elle"
            }
            clean_query = target_query.lower().replace("?", "").replace(".", "").replace(",", "").replace(";", "")
            raw_words = clean_query.split()
            user_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 1]
            
            if not user_words:
                user_words = [w for w in raw_words if len(w) > 1]
            if not user_words:
                user_words = raw_words
                
            user_words_set = set(user_words)
            logger.info(f"[TOOL USE] Filtered query keywords for matching: {user_words_set}")

            # 4. Search curriculum_video_blocks (supports both video and ingested PDF textbook chunks)
            if table_video:
                pdf_slug = None
                if active_pdf_path:
                    import re
                    base_pdf_name = os.path.basename(active_pdf_path)
                    base_no_ext, _ = os.path.splitext(base_pdf_name)
                    pdf_slug = "book_" + re.sub(r'[^a-zA-Z0-9_]', '_', base_no_ext).lower()[:40]

                all_video_rows = []
                try:
                    if pdf_slug:
                        all_video_rows = table_video.search().where(f"video_id = '{pdf_slug}'").limit(200).to_list()
                    if not all_video_rows and active_video_id:
                        all_video_rows = table_video.search().where(f"video_id = '{active_video_id}'").limit(200).to_list()
                    if not all_video_rows:
                        all_video_rows = table_video.search().limit(300).to_list()
                except Exception as db_ex:
                    logger.warning(f"LanceDB video search filter error: {db_ex}")
                    all_video_rows = table_video.search().limit(300).to_list()
                
                best_overlap = 0
                best_video_row = None
                for row in all_video_rows:
                    text = f"{row.get('title', '')} {row.get('transcript_summary', '')} {row.get('vector_payload', '')} {row.get('keywords', '')}".lower()
                    text_clean = text.replace("?", "").replace(".", "").replace(",", "").replace(";", "")
                    text_words = set(text_clean.split())
                    
                    overlap = len(user_words_set.intersection(text_words))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_video_row = row
                
                required_threshold = 1 if len(user_words_set) <= 2 else 2
                if best_overlap >= required_threshold and best_video_row:
                    ts = best_video_row.get("timestamp", "Page 1")
                    title = best_video_row.get("title", "Course document")
                    summary = best_video_row.get("vector_payload") or best_video_row.get("transcript_summary", "")
                    
                    # Translate summary back to student locale if mismatch
                    if student_locale != instructor_locale:
                        summary = await translate_via_gemini(summary, student_locale)
                        title = await translate_via_gemini(title, student_locale)

                    logger.info(f"[TOOL USE SUCCESS] Match found in LanceDB! Overlap: {best_overlap} words.")
                    return f"From the textbook/course document ({title} - {ts}):\n{summary}"

            # 5. Fallback to curriculum_rag (textbooks)
            if table_rag:
                active_subject = None
                if active_pdf_path:
                    # Check custom_books.json for subject mapping
                    custom_books_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "custom_books.json"))
                    if os.path.exists(custom_books_path):
                        try:
                            with open(custom_books_path, "r", encoding="utf-8") as bf:
                                custom_books = json.load(bf)
                                for cb in custom_books:
                                    if cb.get("path") == active_pdf_path:
                                        active_subject = cb.get("subject")
                                        break
                        except Exception:
                            pass
                    
                    # Regex map if not found in custom_books
                    if not active_subject:
                        p_lower = active_pdf_path.lower()
                        if "economics" in p_lower:
                            active_subject = "Economics"
                        elif "physics" in p_lower:
                            active_subject = "Physics"
                        elif "math" in p_lower or "calculus" in p_lower:
                            active_subject = "Mathematics"
                        elif "philosophy" in p_lower or "stoic" in p_lower:
                            active_subject = "Philosophy"
                        elif "history" in p_lower:
                            active_subject = "History"
                        elif "literature" in p_lower or "hamlet" in p_lower:
                            active_subject = "Literature"
                
                all_rag_rows = []
                try:
                    if active_subject:
                        logger.info(f"[TOOL USE] Querying LanceDB table_rag filtered by subject: '{active_subject}'")
                        all_rag_rows = table_rag.search().where(f"subject = '{active_subject}'").limit(500).to_list()
                    if not all_rag_rows:
                        logger.info(f"[TOOL USE] Querying LanceDB table_rag without subject filter (limit 500)")
                        all_rag_rows = table_rag.search().limit(500).to_list()
                except Exception as db_err:
                    logger.error(f"[TOOL USE] LanceDB query failed, fallback to all limit 500: {db_err}")
                    all_rag_rows = table_rag.search().limit(500).to_list()

                best_overlap = 0
                best_rag_row = None
                for row in all_rag_rows:
                    text = row.get("raw_transcript_text", "").lower()
                    text_clean = text.replace("?", "").replace(".", "").replace(",", "").replace(";", "")
                    text_words = set(text_clean.split())
                    
                    overlap = len(user_words_set.intersection(text_words))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_rag_row = row
                
                required_threshold = 1 if len(user_words_set) <= 2 else 2
                if best_overlap >= required_threshold and best_rag_row:
                    context = best_rag_row.get("raw_transcript_text", "")
                    
                    # Translate context back to student locale if mismatch
                    if student_locale != instructor_locale:
                        context = await translate_via_gemini(context, student_locale)

                    logger.info(f"[TOOL USE SUCCESS] Match found in textbooks! Overlap: {best_overlap} words.")
                    return f"From the textbook guidelines/course syllabus:\n{context}"
        except Exception as err:
            logger.error(f"[TOOL USE ERROR] LanceDB lookup failed: {err}")
            return f"Error querying curriculum: {str(err)}"
            
        return "No matching curriculum guidelines or video transcript sections found for this topic."

    async def get_virtual_lab_status() -> str:
        """Returns the real-time live telemetry and state of the student's active STEM Virtual Lab experiment (current chemistry pH, volume, reagents in beaker, physics velocity, gravity, masses, organic molecule SMILES, standing waves). Call this tool whenever the student asks about their lab, experiment, or measurements."""
        try:
            session_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "active_session.json"))
            if os.path.exists(session_path):
                with open(session_path, "r", encoding="utf-8") as sf:
                    sdata = json.load(sf)
                ctx = sdata.get("active_view_context", "")
                if ctx:
                    try:
                        parsed = json.loads(ctx) if isinstance(ctx, str) and ctx.strip().startswith("{") else ctx
                        logger.info(f"[TOOL USE SUCCESS] Retrieved live virtual lab telemetry: {parsed}")
                        return f"Current Student Lab Telemetry & Active Experiment:\n{json.dumps(parsed, indent=2, ensure_ascii=False)}"
                    except Exception:
                        return f"Current Student Lab State:\n{ctx}"
            return "The student is currently in the Virtual Lab, but has not yet selected an experiment or added reagents."
        except Exception as e:
            logger.error(f"[TOOL USE ERROR] Failed to fetch lab telemetry: {e}")
            return f"Error reading lab telemetry: {e}"

    # Instantiate Agent Session and Configuration
    session = AgentSession(
        llm=gemini_live,
        tools=[search_curriculum, get_virtual_lab_status]
    )
    
    agent = Agent(
        instructions=dynamic_instructions,
        llm=gemini_live,
        tools=[search_curriculum, get_virtual_lab_status]
    )

    session_transcripts = []
    synthesis_triggered = False

    async def run_synthesis():
        nonlocal synthesis_triggered
        if synthesis_triggered:
            return
        synthesis_triggered = True
        try:
            import student_memory
            import urllib.request
            google_key = os.environ.get("GOOGLE_API_KEY", "").strip()

            # Allow local offline memory synthesis even when no cloud key is configured.
            local_available = False
            try:
                with urllib.request.urlopen("http://localhost:8080/v1/models", timeout=0.3) as response:
                    local_available = response.status == 200
            except Exception:
                local_available = False

            if not google_key and not local_available:
                logger.warning("[MEMORY SYNTHESIS] No GOOGLE_API_KEY configured and no local offline LLM server detected. Synthesis skipped.")
                return

            await student_memory.synthesize_session_memory(
                student_name,
                active_subject,
                list(session_transcripts),
                google_key
            )
            logger.info("[MEMORY SYNTHESIS COMPLETE] Saved updated student profile and logs to disk.")
        except Exception as se:
            logger.error(f"[MEMORY SYNTHESIS ERROR] Failed running synthesizer: {se}")

    # Add resilient handlers on disconnect/error
    @ctx.room.on("disconnected")
    def on_room_disconnected():
        logger.warning("Room connection lost. Triggering memory synthesis...")
        asyncio.create_task(run_synthesis())

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        if track.kind == "audio":
            logger.info(f"[AUDIO TRACK SUBSCRIBED] Student '{participant.identity}' audio track active.")
            asyncio.create_task(send_greeting())
        elif track.kind == "video":
            logger.info(f"[VIDEO TRACK SUBSCRIBED] Subscribed to video track {track.sid} from participant {participant.identity}")
            
            async def forward_video():
                video_stream = rtc.VideoStream(track)
                last_frame_time = 0.0
                try:
                    async for event in video_stream:
                        now = asyncio.get_event_loop().time()
                        # Forward at most 1 frame per second to prevent Realtime API vision buffer overflow
                        if now - last_frame_time >= 1.0:
                            last_frame_time = now
                            if hasattr(session, "_activity") and session._activity:
                                session._activity.push_video(event.frame)
                except Exception as e:
                    logger.warning(f"Error in forward_video stream: {e}")
                finally:
                    await video_stream.aclose()
            
            asyncio.create_task(forward_video())

    @session.on("user_started_speaking")
    def on_user_speaking():
        logger.info(f"[TURN DETECTION] Student '{student_name}' started speaking into microphone.")

    @session.on("user_stopped_speaking")
    def on_user_stopped():
        logger.info(f"[TURN DETECTION] Student '{student_name}' stopped speaking. Waiting for Gemini response...")

    @session.on("agent_started_speaking")
    def on_agent_speaking():
        logger.info("[TURN DETECTION] Gandho started speaking audio response.")

    @session.on("agent_stopped_speaking")
    def on_agent_stopped():
        logger.info("[TURN DETECTION] Gandho finished speaking audio response. Listening for student reply...")

    @session.on("user_input_transcribed")
    def on_user_transcribed(ev: UserInputTranscribedEvent):
        logger.info(f"[USER TRANSCRIPTION] Student said: '{ev.transcript}' (is_final={ev.is_final})")

    @session.on("error")
    def on_session_error(err):
        logger.error(f"Session error: {err}")

    @session.on("close")
    def on_session_close():
        logger.info("Session closed. Triggering memory synthesis...")
        asyncio.create_task(run_synthesis())

    # Listen for final conversation messages and stream them to the room data channel
    @session.on("conversation_item_added")
    def on_conversation_item(ev: ConversationItemAddedEvent):
        item = ev.item
        if isinstance(item, llm.ChatMessage):
            logger.info(f"[CHAT EVENT] Role: {item.role}, Text: {item.text_content}")
            if item.text_content:
                session_transcripts.append({
                    "role": item.role,
                    "text": item.text_content
                })
            payload_data = {
                "type": "chat_message",
                "role": item.role,
                "text": item.text_content,
                "timestamp": getattr(ev, "created_at", None) or 0
            }
            asyncio.create_task(ctx.room.local_participant.publish_data(
                payload=json.dumps(payload_data).encode('utf-8'),
                topic="tutor-transcripts"
            ))

    # Background task to monitor view state updates and dynamically refresh the system prompt
    async def monitor_session_changes():
        nonlocal locale, video_title, video_timeline_context
        last_view_state = initial_view_state
        last_view_context = initial_view_context
        last_pdf_path = initial_pdf_path
        last_locale = locale
        last_video_id = active_video_id
        
        while True:
            await asyncio.sleep(0.5)
            if not session or not session._activity:
                continue
            try:
                if os.path.exists(session_json_path):
                    with open(session_json_path, "r", encoding="utf-8") as f:
                        sdata = json.load(f)
                    
                    view_state = sdata.get("active_view_state", "dashboard")
                    view_context = sdata.get("active_view_context", "")
                    pdf_path = sdata.get("active_pdf_path", "")
                    pdf_name = sdata.get("active_pdf_name", "")
                    current_locale = sdata.get("active_locale", "en_US")
                    current_video_id = sdata.get("active_video_id")
                    
                    video_id_changed = (current_video_id != last_video_id)
                    view_state_changed = (view_state != last_view_state)
                    view_context_changed = (view_context != last_view_context)
                    
                    if (view_state_changed or 
                        view_context_changed or
                        pdf_path != last_pdf_path or 
                        current_locale != last_locale or 
                        video_id_changed):
                        
                        last_view_state = view_state
                        last_view_context = view_context
                        last_pdf_path = pdf_path
                        last_locale = current_locale
                        locale = current_locale
                        
                        if video_id_changed:
                            last_video_id = current_video_id
                            # Re-query sqlite to update video_title and video_timeline_context dynamically
                            if current_video_id and os.path.exists(db_path):
                                try:
                                    conn = sqlite3.connect(db_path)
                                    cursor = conn.cursor()
                                    cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (current_video_id,))
                                    title_row = cursor.fetchone()
                                    if title_row:
                                        video_title = title_row[0]
                                    
                                    # Fetch chapters
                                    cursor.execute("""
                                        SELECT timestamp, title, description 
                                        FROM video_timestamps 
                                        WHERE video_id = ? 
                                        ORDER BY timestamp ASC
                                    """, (current_video_id,))
                                    chapters = cursor.fetchall()
                                    video_timeline_context = ""
                                    if chapters:
                                        video_timeline_context = "\nVideo Chapters & Content summaries you taught:\n"
                                        for ts, title, desc in chapters:
                                            video_timeline_context += f"- [{ts}] {title}: {desc}\n"
                                    conn.close()
                                    logger.info(f"[DYNAMIC UPDATE] Resolved video_id '{current_video_id}' to title: '{video_title}'")
                                except Exception as e:
                                    logger.warning(f"Failed to query SQLite during dynamic state update: {e}")
                        
                        new_instructions = rebuild_dynamic_instructions(view_state, pdf_path, pdf_name, view_context)
                        logger.info(f"[DYNAMIC UPDATE] View state is '{view_state}', locale is '{current_locale}', video is '{video_title}'. Updating system prompt...")
                        
                        # Update the active session instructions using the realtime session API.
                        if hasattr(session, "_activity") and session._activity and hasattr(session._activity, "_rt_session") and session._activity._rt_session:
                            try:
                                await session._activity._rt_session.update(instructions=new_instructions)
                            except TypeError:
                                logger.debug("Realtime session update does not support instruction payloads in this LiveKit version; continuing with the existing session configuration.")
                            except Exception as update_err:
                                logger.warning(f"Failed to update active session instructions: {update_err}")
                            
                        def parse_lab_info(ctx):
                            lab_t = "Laboratoire STEM"
                            lab_telemetry = ""
                            if ctx:
                                try:
                                    p = json.loads(ctx) if isinstance(ctx, str) and ctx.strip().startswith("{") else ctx
                                    if isinstance(p, dict):
                                        lab_t = p.get("title", lab_t)
                                        parts = []
                                        if "current_ph" in p: parts.append(f"pH {p['current_ph']}")
                                        if "total_volume_ml" in p: parts.append(f"{p['total_volume_ml']} mL")
                                        if "gravity" in p: parts.append(f"g = {p['gravity']}")
                                        if "formula" in p: parts.append(f"formule {p['formula']}")
                                        if "smiles" in p: parts.append(f"SMILES {p['smiles']}")
                                        if "parameters" in p: parts.append(str(p["parameters"]))
                                        if parts: lab_telemetry = ", ".join(parts)
                                        elif "status" in p: lab_telemetry = p["status"]
                                except Exception:
                                    pass
                            return lab_t, lab_telemetry

                        # Proactively greet the user on view state changes
                        if view_state_changed:
                            if locale == "fr_FR":
                                if view_state == "screen_share":
                                    transition_prompt = "Dis à l'étudiant en français : 'J'ai activé la vision de votre écran. Je regarde ce que vous partagez — quel document ou livre souhaitez-vous que nous examinions ensemble ?'"
                                elif view_state == "split_workspace":
                                    transition_prompt = f"Dis à l'étudiant en français : 'Nous sommes dans l'espace de travail partagé pour le manuel \"{pdf_name}\". Discutons de cette section !'"
                                elif view_state == "evaluation":
                                    transition_prompt = "Dis à l'étudiant en français : 'Je vois que vous êtes sur l'évaluation. Lisons les questions à choix multiples ensemble et résolvons-les étape par étape !'"
                                elif view_state == "virtual_labs":
                                    lab_t, lab_tel = parse_lab_info(view_context)
                                    tel_clause = f" avec vos mesures en direct ({lab_tel})" if lab_tel else ""
                                    transition_prompt = f"Dis à l'étudiant en français : 'Bienvenue dans le laboratoire virtuel STEM ! Je vois votre manipulation \"{lab_t}\"{tel_clause}. Que souhaitez-vous tester ou mesurer en premier ?'"
                                else:
                                    transition_prompt = "Dis à l'étudiant en français : 'De retour sur le tableau de bord ! Comment puis-je vous aider maintenant ?'"
                            else:
                                if view_state == "screen_share":
                                    transition_prompt = "Tell the student: 'I see your screen stream now! What document, book, or problem would you like us to review together?'"
                                elif view_state == "split_workspace":
                                    transition_prompt = f"Tell the student: 'We are in the split-screen workspace reviewing the textbook \"{pdf_name}\". What section or concept would you like to explore?'"
                                elif view_state == "evaluation":
                                    transition_prompt = "Tell the student: 'I see you are on the Evaluation quiz! Let's read through the multiple choice questions together and work through them step-by-step.'"
                                elif view_state == "virtual_labs":
                                    lab_t, lab_tel = parse_lab_info(view_context)
                                    tel_clause = f" with your live measurements ({lab_tel})" if lab_tel else ""
                                    transition_prompt = f"Tell the student: 'Welcome to the STEM Virtual Lab! I can see you are on \"{lab_t}\"{tel_clause}. What would you like us to test or observe first?'"
                                else:
                                    transition_prompt = "Tell the student: 'Back on the main screen! What would you like to explore or discuss next?'"
                            
                            session.generate_reply(user_input=transition_prompt)
                        elif view_state == "virtual_labs" and view_context_changed and not view_state_changed:
                            # Student switched experiment while inside Virtual Labs
                            lab_t, lab_tel = parse_lab_info(view_context)
                            last_t, _ = parse_lab_info(last_view_context)
                            if lab_t != last_t and "Catalog" not in lab_t and "Hub" not in lab_t:
                                if locale == "fr_FR":
                                    transition_prompt = f"Dis à l'étudiant en français : 'Je vois que vous venez d'ouvrir l'expérience \"{lab_t}\" ! Je surveille vos mesures en direct. Quelle est votre première hypothèse ?'"
                                else:
                                    transition_prompt = f"Tell the student: 'I see you just opened the \"{lab_t}\" experiment! I am tracking your live telemetry. What is your initial hypothesis?'"
                                session.generate_reply(user_input=transition_prompt)
            except Exception as monitor_err:
                logger.warning(f"Error in monitor_session_changes loop: {monitor_err}")

    greeting_sent = False
    async def send_greeting():
        nonlocal greeting_sent
        if greeting_sent:
            return
        greeting_sent = True

        # Wait up to 5s for session activity to be established by session.start()
        for _ in range(20):
            if getattr(session, "_activity", None) is not None:
                break
            await asyncio.sleep(0.25)
            
        logger.info("Triggering initial greeting referencing the active video title...")
        try:
            # Resolve current view state from session json
            v_state = "dashboard"
            p_name = ""
            if os.path.exists(session_json_path):
                try:
                    with open(session_json_path, "r", encoding="utf-8") as f:
                        s_data = json.load(f)
                        v_state = s_data.get("active_view_state", "dashboard")
                        p_name = s_data.get("active_pdf_name", "")
                except Exception:
                    pass
            
            # Calculate time-appropriate salutation
            time_salutation = get_time_greeting(locale)

            # Check if this video has already been greeted in the current process
            is_new_video = (active_video_id not in GREETED_VIDEOS_CACHE)
            GREETED_VIDEOS_CACHE.add(active_video_id)

            if locale == "fr_FR":
                if v_state == "screen_share":
                    greeting_instruction = (
                        f"Dis à {student_name} en français : '{time_salutation} {student_name} ! Je regarde votre partage d'écran — quel document ou concept souhaitez-vous analyser ensemble ?'"
                    )
                elif v_state == "split_workspace":
                    greeting_instruction = (
                        f"Dis à {student_name} en français : '{time_salutation} {student_name} ! Nous sommes sur le document \"{p_name}\". Souhaitez-vous une explication des points clés ou passons-nous directement à vos questions ?'"
                    )
                elif v_state == "evaluation":
                    greeting_instruction = (
                        f"Dis à {student_name} en français : '{time_salutation} {student_name} ! Je vois que vous êtes sur l'évaluation. Lisons les questions ensemble et résolvons-les pas à pas.'"
                    )
                elif active_mode == "CLASSROOM":
                    greeting_instruction = (
                        f"Dis brièvement à {student_name} en français : '{time_salutation} {student_name} ! Je t'écoute, quelle est ta question sur la leçon \"{video_title}\" ?'"
                    )
                elif active_mode == "POD":
                    greeting_instruction = (
                        f"Dis brièvement à {student_name} en français : '{time_salutation} {student_name} ! Comment puis-je vous aider, toi et ton groupe, sur la leçon \"{video_title}\" ?'"
                    )
                else:
                    greeting_instruction = (
                        f"Dis chaleureusement à {student_name} en français : '{time_salutation} {student_name} ! Ravi d'étudier la leçon \"{video_title}\" avec toi. Quelle question as-tu ?'"
                    )
            else:
                if v_state == "screen_share":
                    greeting_instruction = (
                        f"Say to {student_name}: '{time_salutation} {student_name}! I see your screen stream now — what document or problem would you like to review together?'"
                    )
                elif v_state == "split_workspace":
                    greeting_instruction = (
                        f"Say to {student_name}: '{time_salutation} {student_name}! We are in the workspace for \"{p_name}\". Would you like a key concept overview first or jump straight into questions?'"
                    )
                elif v_state == "evaluation":
                    greeting_instruction = (
                        f"Say to {student_name}: '{time_salutation} {student_name}! I see you are on the Evaluation quiz. Let's work through the questions step-by-step!'"
                    )
                elif active_mode == "CLASSROOM":
                    greeting_instruction = (
                        f"Say concisely to {student_name}: '{time_salutation} {student_name}! I am listening, what is your question about the lesson \"{video_title}\"?'"
                    )
                elif active_mode == "POD":
                    greeting_instruction = (
                        f"Say concisely to {student_name}: '{time_salutation} {student_name}! How can I assist your group with \"{video_title}\"?'"
                    )
                else:
                    greeting_instruction = (
                        f"Say warmly to {student_name}: '{time_salutation} {student_name}! Great to study \"{video_title}\" together. What would you like to explore?'"
                    )

            # Retry waiting for session._activity to become ready after session.start connects
            for _ in range(12):
                if getattr(session, "_activity", None):
                    break
                await asyncio.sleep(0.5)

            if getattr(session, "_activity", None):
                session.generate_reply(
                    user_input=greeting_instruction
                )
            else:
                logger.info("Session not active after 6 seconds waiting; skipping greeting.")
        except Exception as e:
            logger.error(f"Failed sending initial greeting: {e}")

    # Launch background tasks for greeting and live session state monitoring
    asyncio.create_task(send_greeting())
    asyncio.create_task(monitor_session_changes())

    # Start audio track listener and join room (blocking call)
    logger.info("Starting AgentSession...")
    await session.start(agent, room=ctx.room, room_options=RoomOptions(close_on_disconnect=False))
    logger.info("Voice Socratic Tutor agent session terminated.")
    


if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        load_threshold=0.98      # Raise from default 0.7 — prevents CPU spikes on a dev machine from blocking voice connections
    ))
