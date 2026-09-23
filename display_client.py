# display_client.py — Ventuno Q classroom HTTP/WebSocket server
# Hardware: Arduino Ventuno Q (Qualcomm Hexagon NPU). Desktop simulation supported.
# Voice TTS: Kokoro-82M via LiveKit (not NVIDIA Riva).
# Storage:  512 GB M.2 2280 NVMe SSD
# Note: The dashboard strictly uses local full-length calculus/physics tracks.

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
ENV_FILE = os.path.join(PROJECT_ROOT, ".env")
os.chdir(PROJECT_ROOT)

# Load API keys from .env if present (always override to allow dynamic config changes)
def load_env():
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if line.lower().startswith("export "):
                        line = line[7:].strip()
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        k = parts[0].strip()
                        v = parts[1].strip().strip('"').strip("'")
                        os.environ[k] = v
        except Exception as e:
            print(f"[ENV] Error reading .env: {e}")

load_env()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import asyncio
import http.server
import socketserver
import threading
import websockets
import sqlite3
import json

try:
    from orchestrator import check_subject_gating
except Exception as _orch_err:
    print(f"[BOOT] Orchestrator not loaded ({_orch_err}). Subject gating disabled for this process.")

    def check_subject_gating(attempted_video_id):
        return True, ""

# Virtual Labs science solvers (RDKit, SymPy, PubChem, ChemPy)
LABS_BACKEND_DIR = os.path.join(PROJECT_ROOT, "antigravity_labs", "chemistry_backend")
if os.path.exists(LABS_BACKEND_DIR) and LABS_BACKEND_DIR not in sys.path:
    sys.path.insert(0, LABS_BACKEND_DIR)

science_solvers = None
chem_main = None
LABS_SOLVERS_AVAILABLE = False
try:
    import science_solvers as _science_solvers
    science_solvers = _science_solvers
    LABS_SOLVERS_AVAILABLE = True
except Exception as _labs_err:
    print(f"[LABS] Science solvers notice: {_labs_err}")
    LABS_SOLVERS_AVAILABLE = False
    science_solvers = None

try:
    from main import calculate_mixture as chem_calculate_mixture
    CHEM_MIX_AVAILABLE = True
except Exception:
    CHEM_MIX_AVAILABLE = False
    chem_main = None

    def chem_calculate_mixture(solutions, indicator="phenolphthalein", temp_c=25.0):
        total_vol = 0.0
        names = []
        for item in solutions or []:
            if isinstance(item, dict):
                names.append(item.get("name") or item.get("formula") or "reagent")
                total_vol += float(item.get("volume_ml") or 0)
        if LABS_SOLVERS_AVAILABLE and hasattr(science_solvers, "calculate_mixture"):
            return science_solvers.calculate_mixture(solutions, indicator, temp_c)
        return {
            "success": False,
            "error": "ChemPy/FastAPI chemistry backend is not installed. Use the client-side mixer or pip-install antigravity_labs/chemistry_backend.",
            "total_volume_ml": total_vol,
            "indicator_state": indicator or "none",
            "reaction_summary": "ChemPy unavailable — no server-side pH was computed.",
            "neutralization_status": "unavailable",
            "species_concentrations": {},
            "chempy_active": False,
            "reagents": names,
            "temp_c": temp_c,
        }


def get_subject_by_video_id(video_id):
    if not video_id:
        return "Physics"
    vid_lower = str(video_id).lower()
    if "chemistry" in vid_lower or "chimie" in vid_lower:
        return "Chemistry"
    if "physics" in vid_lower or "physique" in vid_lower:
        return "Physics"
    if "philosophy" in vid_lower or "phil_" in vid_lower:
        return "Philosophy"
    if "calculus" in vid_lower or "calc" in vid_lower or "mathematics" in vid_lower or "/math" in vid_lower or vid_lower.startswith("math"):
        return "Mathematics"
    if "economics" in vid_lower or "extraeconomiques" in vid_lower:
        return "Economics"

    try:
        conn = sqlite3.connect(VAULT_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT i.subjects_list
            FROM lesson_metadata lm
            JOIN instructors i ON lm.instructor_id = i.instructor_id
            WHERE lm.video_id = ?
        """, (video_id,))
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            subjects = str(row[0])
            subjects_l = subjects.lower()
            if "calculus" in subjects_l or "mathematics" in subjects_l:
                return "Mathematics"
            if "economics" in subjects_l:
                return "Economics"
            return subjects.split(",")[0].strip() or "Physics"
    except Exception:
        pass

    return "Physics"


def lookup_student_answer(student_answers, q_id):
    if not isinstance(student_answers, dict):
        return None
    if q_id in student_answers:
        return student_answers[q_id]
    q_str = str(q_id)
    if q_str in student_answers:
        return student_answers[q_str]
    try:
        q_int = int(q_id)
        if q_int in student_answers:
            return student_answers[q_int]
    except (TypeError, ValueError):
        pass
    return None


def answers_match(student_ans, correct_ans):
    if student_ans is None or correct_ans is None:
        return False
    return str(student_ans).strip().upper() == str(correct_ans).strip().upper()


def split_quiz_sets(main_items, alt_items, is_practice, is_alt):
    main_items = list(main_items or [])
    alt_items = list(alt_items or [])
    if is_practice:
        extras = main_items[3:] + alt_items
        return extras[:30]
    if is_alt:
        target = alt_items[:3] if alt_items else main_items[:3]
        return target
    return main_items[:3]


def find_next_curriculum_lesson(cursor, video_id):
    cursor.execute("SELECT video_id, chapter_id, unlocked FROM curriculum_tree ORDER BY rowid ASC")
    rows = cursor.fetchall()
    subject_prefix = ""
    if video_id and "_" in video_id:
        parts = video_id.split("_")
        if len(parts) >= 2:
            subject_prefix = parts[0] + "_" + parts[1]
    idx = -1
    for i, r in enumerate(rows):
        if r[0] == video_id:
            idx = i
            break
    if idx == -1:
        return None, None
    if subject_prefix:
        for i in range(idx + 1, len(rows)):
            if rows[i][0].startswith(subject_prefix):
                return rows[i][0], rows[i][1]
    if idx + 1 < len(rows):
        return rows[idx + 1][0], rows[idx + 1][1]
    return None, None

import base64
import time
import hmac
import hashlib
import urllib.parse
import urllib.request
import urllib.error
import socket
import shutil

TRANSLATION_CACHE_FILE = os.path.join(PROJECT_ROOT, "translation_cache.json")
SESSION_JSON_PATH = os.path.join(PROJECT_ROOT, "active_session.json")
_SESSION_FILE_LOCK = threading.RLock()

def load_session_info():
    with _SESSION_FILE_LOCK:
        session_data = {}
        try:
            if os.path.exists(SESSION_JSON_PATH):
                with open(SESSION_JSON_PATH, "r", encoding="utf-8") as f:
                    session_data = json.load(f)
        except Exception as e:
            print(f"[SESSION LOAD WARN] {e}")
        return session_data


def merge_session_info(updates):
    """Atomically merge fields so concurrent view/video/token writes cannot erase context."""
    with _SESSION_FILE_LOCK:
        session_data = load_session_info()
        session_data.update({k: v for k, v in (updates or {}).items() if v is not None})
        temp_path = SESSION_JSON_PATH + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)
        os.replace(temp_path, SESSION_JSON_PATH)
        return session_data

def save_session_info(video_id, pdf_path=None):
    try:
        updates = {}
        if video_id and isinstance(video_id, str) and video_id.startswith("vid_") and video_id != "gandal_space_active":
            updates["active_video_id"] = video_id
        if pdf_path:
            updates["active_pdf_path"] = pdf_path
        if updates:
            merge_session_info(updates)
        print(f"[SESSION] Saved session info: active_video_id={video_id}", flush=True)
    except Exception as e:
        print(f"[SESSION ERROR] Failed to save session info: {e}", flush=True)


def _student_badges_db():
    return os.path.abspath(os.path.join(PROJECT_ROOT, "vault.db"))


def _ensure_student_badges(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS student_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL DEFAULT 'Alseny',
            badge_id TEXT NOT NULL,
            title TEXT,
            xp INTEGER NOT NULL DEFAULT 0,
            awarded_at TEXT DEFAULT (datetime('now')),
            UNIQUE(student_id, badge_id)
        )
    """)


def _list_student_badges(student_id="Alseny"):
    db_path = _student_badges_db()
    if not os.path.exists(db_path):
        return []
    conn = sqlite3.connect(db_path)
    try:
        _ensure_student_badges(conn)
        rows = conn.execute(
            "SELECT badge_id, title, xp, awarded_at FROM student_badges WHERE student_id=? ORDER BY id DESC",
            (student_id,),
        ).fetchall()
        return [{"badge_id": r[0], "title": r[1], "xp": r[2], "awarded_at": r[3]} for r in rows]
    finally:
        conn.close()


def _award_student_badge(badge_id, title="", xp=0, student_id="Alseny"):
    db_path = _student_badges_db()
    if not badge_id or not os.path.exists(db_path):
        return False
    conn = sqlite3.connect(db_path)
    try:
        _ensure_student_badges(conn)
        conn.execute(
            "INSERT OR IGNORE INTO student_badges (student_id, badge_id, title, xp) VALUES (?, ?, ?, ?)",
            (student_id, badge_id, title, int(xp or 0)),
        )
        conn.commit()
        return True
    finally:
        conn.close()

VAULT_DB_PATH = os.path.join(PROJECT_ROOT, "vault.db")
MANUAL_LOCALE_SELECTION = None
GEMINI_DISABLED = False

def load_translation_cache():
    if os.path.exists(TRANSLATION_CACHE_FILE):
        try:
            with open(TRANSLATION_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_translation_cache(cache):
    try:
        with open(TRANSLATION_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[CACHE ERROR] Failed to save translation cache: {e}")

def hash_proctor_pin(pin):
    return hashlib.sha256(f"ventuno-proctor-v1:{pin}".encode("utf-8")).hexdigest()


def get_proctor_pin_hash():
    session_data = load_session_info()
    stored = (session_data.get("proctor_pin_hash") or "").strip()
    if stored:
        return stored
    env_pin = os.environ.get("PROCTOR_PIN", "").strip()
    pin = env_pin or "1234"
    digest = hash_proctor_pin(pin)
    try:
        merge_session_info({
            "proctor_pin_hash": digest,
            "proctor_pin_is_default": not bool(env_pin),
        })
    except Exception:
        pass
    return digest


def list_saved_notebooks():
    notebooks = []
    vault_dir = os.path.join(PROJECT_ROOT, "saved_notebooks")
    if not os.path.isdir(vault_dir):
        return notebooks
    for name in sorted(os.listdir(vault_dir)):
        if name.lower().endswith(".pdf"):
            fpath = os.path.join(vault_dir, name)
            notebooks.append({
                "filename": name,
                "url": "/saved_notebooks/" + urllib.parse.quote(name),
                "bytes": os.path.getsize(fpath),
            })
    return notebooks


def generate_livekit_token(api_key, api_secret, room_name, participant_identity, name=None, metadata=None, admin=False, include_agent=False):
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    now = int(time.time())
    video_grant = {
        "roomJoin": True,
        "room": room_name,
        "roomCreate": True,
        "canPublish": True,
        "canSubscribe": True,
        "canPublishData": True,
        "canPublishSources": [
            "camera",
            "microphone",
            "screen_share",
            "screen_share_audio",
        ],
    }
    if admin:
        video_grant["roomAdmin"] = True
        video_grant["roomList"] = True
    payload = {
        "iss": api_key,
        "sub": participant_identity,
        "name": name or participant_identity,
        "nbf": now - 60,
        "exp": now + 7200,
        "video": video_grant,
    }
    if include_agent:
        payload["roomConfig"] = {"agents": [{"agentName": livekit_agent_name()}]}
    else:
        # Empty agentName = default unnamed worker (Windows + Linux Cloud).
        payload["roomConfig"] = {"agents": [{}]}
    if metadata:
        payload["metadata"] = json.dumps(metadata) if isinstance(metadata, dict) else str(metadata)

    def base64_url_encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

    header_b64 = base64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = base64_url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(api_secret.encode("utf-8"), signature_input, hashlib.sha256).digest()
    signature_b64 = base64_url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


DEFAULT_SOCRATIC_ROOM = "socratic_tutor_room"
DEFAULT_LIVEKIT_AGENT_NAME = "gandho"
DEFAULT_GEMINI_LIVE_MODEL = "gemini-3.1-flash-live-preview"


def livekit_agent_name():
    """Must match WorkerOptions.agent_name in tutor_agent.py (default gandho)."""
    return os.environ.get("LIVEKIT_AGENT_NAME", "").strip() or DEFAULT_LIVEKIT_AGENT_NAME


def gemini_live_model_for_client():
    return os.environ.get("GEMINI_LIVE_MODEL", DEFAULT_GEMINI_LIVE_MODEL).strip() or DEFAULT_GEMINI_LIVE_MODEL


def livekit_http_origin(ws_url):
    u = (ws_url or "").strip().rstrip("/")
    if u.startswith("wss://"):
        return "https://" + u[6:]
    if u.startswith("ws://"):
        return "http://" + u[5:]
    if u.startswith("http://") or u.startswith("https://"):
        return u
    return "http://" + u if u else "http://127.0.0.1:7880"


def prefer_ipv4_livekit_url(ws_url):
    """Rewrite localhost → 127.0.0.1 so Linux does not hang on ::1 while LiveKit is IPv4-only."""
    u = (ws_url or "").strip()
    if not u:
        return u
    for scheme in ("ws://", "wss://", "http://", "https://"):
        needle = scheme + "localhost"
        if u.lower().startswith(needle):
            return scheme + "127.0.0.1" + u[len(needle):]
    return u


def livekit_tcp_target(ws_url):
    u = prefer_ipv4_livekit_url(ws_url or "ws://127.0.0.1:7880")
    for prefix in ("wss://", "ws://", "https://", "http://"):
        if u.lower().startswith(prefix):
            u = u[len(prefix):]
            break
    u = u.split("/", 1)[0]
    host, _, port_s = u.partition(":")
    host = host.strip() or "127.0.0.1"
    if host.lower() == "localhost":
        host = "127.0.0.1"
    try:
        port = int(port_s) if port_s else (443 if str(ws_url).startswith(("wss://", "https://")) else 7880)
    except ValueError:
        port = 7880
    return host, port


def probe_livekit_tcp(ws_url, timeout=0.8):
    host, port = livekit_tcp_target(ws_url)
    sock = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        return True, host, port, ""
    except Exception as err:
        return False, host, port, str(err)
    finally:
        if sock is not None:
            try:
                sock.close()
            except Exception:
                pass


def _agent_helper(name):
    agent_dir = os.path.join(PROJECT_ROOT, "livekit_stack", "agent")
    if agent_dir not in sys.path:
        sys.path.insert(0, agent_dir)
    return __import__(name)


def find_ffmpeg():
    try:
        return _agent_helper("ffmpeg_path").find_ffmpeg() or ""
    except Exception:
        return shutil.which("ffmpeg") or ("/usr/bin/ffmpeg" if os.path.isfile("/usr/bin/ffmpeg") else "")


def ffmpeg_on_path():
    return bool(find_ffmpeg())


def ensure_ffmpeg_on_path():
    try:
        return _agent_helper("ffmpeg_path").ensure_ffmpeg_on_path() or ""
    except Exception:
        path = find_ffmpeg()
        if path:
            os.environ["PATH"] = os.path.dirname(path) + os.pathsep + os.environ.get("PATH", "")
        return path


def worker_heartbeat_status():
    try:
        return _agent_helper("worker_heartbeat").read_worker_heartbeat(PROJECT_ROOT)
    except Exception as err:
        return {"running": False, "age_s": None, "detail": str(err)}


ensure_ffmpeg_on_path()


def mint_socratic_room(identity):
    if str(os.environ.get("LIVEKIT_SHARED_ROOM", "")).strip().lower() in ("1", "true", "yes"):
        return DEFAULT_SOCRATIC_ROOM
    chars = []
    for ch in (identity or "student"):
        chars.append(ch if ch.isalnum() else "-")
    slug = "".join(chars).strip("-")[:32] or "student"
    return f"socratic-{slug}-{int(time.time())}"


def livekit_connect_urls(primary):
    urls = []
    rewritten = prefer_ipv4_livekit_url(primary)
    for candidate in (
        rewritten,
        primary,
        prefer_ipv4_livekit_url(os.environ.get("LIVEKIT_FALLBACK_URL", "").strip()),
        os.environ.get("LIVEKIT_FALLBACK_URL", "").strip(),
    ):
        candidate = (candidate or "").strip()
        if candidate and candidate not in urls:
            urls.append(candidate)
    if rewritten.startswith("ws://127.0.0.1:") or rewritten.startswith("ws://localhost:"):
        if "ws://127.0.0.1:7880" not in urls:
            urls.append("ws://127.0.0.1:7880")
    return urls


def dispatch_livekit_agent(room_name, metadata=None, livekit_url=None, agent_name=""):
    """Ask LiveKit Cloud/local to put the default (unnamed) Gandho worker in this room."""
    api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
    api_secret = os.environ.get("LIVEKIT_API_SECRET", "secretsecretsecretsecretsecretsecretsecret")
    livekit_url = prefer_ipv4_livekit_url(
        (livekit_url or os.environ.get("LIVEKIT_URL", "ws://127.0.0.1:7880")).strip()
    )
    origin = livekit_http_origin(livekit_url)
    admin_token = generate_livekit_token(api_key, api_secret, room_name, "ventuno-dispatch", name="dispatch", admin=True)
    body = {"room": room_name, "metadata": json.dumps(metadata or {"tutor": "gandho"})}
    if agent_name:
        body["agent_name"] = agent_name
    url = origin + "/twirp/livekit.AgentDispatchService/CreateDispatch"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": "Bearer " + admin_token,
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            raw = resp.read().decode("utf-8", "replace")
            print(f"[LIVEKIT DISPATCH] {resp.status} room={room_name} agent={agent_name or '(default unnamed)'} {raw[:180]}", flush=True)
            return True, raw
    except Exception as err:
        print(f"[LIVEKIT DISPATCH] {url} failed: {err}", flush=True)
        return False, str(err)


def translate_timestamps(timestamps_list, target_locale):
    global GEMINI_DISABLED
    if not timestamps_list:
        return timestamps_list
        
    cache = load_translation_cache()
    lst_hash = hashlib.md5(json.dumps(timestamps_list, sort_keys=True).encode('utf-8')).hexdigest()
    cache_key = f"ts_{lst_hash}_{target_locale}"
    if cache_key in cache:
        print(f"[TRANSLATE CACHE] Hit for timestamps ({target_locale})")
        return cache[cache_key]
        
    lang_map = {
        "en_US": "English",
        "fr_FR": "French",
        "zh_CN": "Chinese",
        "es_ES": "Spanish",
        "pt_PT": "Portuguese",
        "ar_AE": "Arabic"
    }
    target_lang = lang_map.get(target_locale, "English")
    google_key = os.environ.get("GOOGLE_API_KEY")
    
    def fallback_translate():
        print("[TRANSLATE TIMESTAMPS] Falling back to LLM translation loop...")
        translated = []
        for ts in timestamps_list:
            t_title = translate_via_llm(ts["title"], target_locale)
            t_desc = translate_via_llm(ts["description"], target_locale)
            translated.append({
                "timestamp": ts["timestamp"],
                "title": t_title,
                "description": t_desc
            })
        return translated

    def do_batch_translate():
        global GEMINI_DISABLED
        # LOCAL-FIRST: always try on-device LLM/cache path before Gemini
        local_result = fallback_translate()
        if GEMINI_DISABLED or not google_key or os.environ.get("OFFLINE_MODE", "1") == "1":
            return local_result
        import time
        max_attempts = 5
        backoff = 2
        for attempt in range(max_attempts):
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=google_key)
                
                simple_list = []
                for ts in timestamps_list:
                    simple_list.append({
                        "timestamp": ts["timestamp"],
                        "title": ts["title"],
                        "description": ts["description"]
                    })
                    
                prompt = (
                    f"Translate the 'title' and 'description' fields of these video timeline segments into {target_lang}.\n"
                    "CRITICAL: Keep the translated text extremely natural, match exactly what a teacher speaking would say, "
                    "and preserve all technical terms. Return the resulting array in the exact same JSON format."
                )
                
                response = client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=[json.dumps(simple_list), prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(
                                type=types.Type.OBJECT,
                                properties={
                                    "timestamp": types.Schema(type=types.Type.STRING),
                                    "title": types.Schema(type=types.Type.STRING),
                                    "description": types.Schema(type=types.Type.STRING)
                                },
                                required=["timestamp", "title", "description"]
                            )
                        )
                    )
                )
                translated_list = json.loads(response.text.strip())
                return translated_list
            except Exception as e:
                print(f"[TRANSLATE TIMESTAMPS WARNING] Gemini attempt {attempt+1}/{max_attempts} failed: {e}")
                err_str = str(e).lower()
                if "resource_exhausted" in err_str or "depleted" in err_str or "billing" in err_str or "429" in err_str:
                    GEMINI_DISABLED = True
                    print("[CIRCUIT BREAKER] Depleted Gemini credits detected. Disabling Gemini globally.")
                    return fallback_translate()
                if attempt == max_attempts - 1:
                    print(f"[TRANSLATE TIMESTAMPS ERROR] Gemini failed: {e}. Falling back to LLM translation loop...")
                    return fallback_translate()
                time.sleep(1)
                
    result = do_batch_translate()
    cache[cache_key] = result
    save_translation_cache(cache)
    return result

def generate_socratic_chat_response(question, video_id, student_name=None, instructor_name=None):
    q_lower = (question or "").lower().strip()
    v_lower = (video_id or "").lower()
    
    # Retrieve student name from DB if not provided
    s_name = student_name
    if not s_name:
        try:
            conn = sqlite3.connect(VAULT_DB_PATH)
            cur = conn.cursor()
            cur.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
            r = cur.fetchone()
            conn.close()
            if r and r[0]:
                s_name = r[0]
        except Exception:
            pass
    if not s_name:
        s_name = "Alseny"

    t_name = instructor_name or "GANDHO"

    # Greetings check
    is_greeting = any(w in q_lower for w in ["bonjour", "salut", "hello", "hi", "coucou", "good morning", "good evening", "gandho"])

    if is_greeting:
        lesson_title = "les problèmes démographiques"
        if "sanitaire" in v_lower:
            lesson_title = "les problèmes sanitaires"
        elif "alimentaire" in v_lower:
            lesson_title = "les problèmes alimentaires"
        elif "chem" in v_lower:
            lesson_title = "la chimie organique"
        return f"Bonjour {s_name} ! Je suis {t_name}, votre tuteur Socratic. Je suis ravi de vous retrouver pour ce cours sur {lesson_title}. Comment puis-je vous aider aujourd'hui dans votre apprentissage ?"
    elif "sanitaire" in v_lower or "sanitaire" in q_lower or "santé" in q_lower or "maladie" in q_lower or "ebola" in q_lower:
        return f"Bonjour {s_name} ! Concernant les problèmes sanitaires, la prévalence des maladies endémiques (comme le paludisme, le choléra et le VIH) impacte directement l'espérance de vie et la productivité du travail. Quels facteurs d'infrastructure de santé ou d'eau potable pensez-vous être prioritaires ?"
    elif "alimentaire" in v_lower or "alimentaire" in q_lower or "faim" in q_lower or "nutrition" in q_lower or "fao" in q_lower:
        return f"Bonjour {s_name} ! Les problèmes alimentaires et la sous-alimentation limitent le développement humain. Des organisations internationales comme la FAO, le FIDA et le PAM agissent pour soutenir l'agriculture locale et la sécurité alimentaire. Comment puis-je vous aider sur ce sujet ?"
    elif "demographique" in v_lower or "population" in q_lower or "malthus" in q_lower or "natalité" in q_lower:
        return f"Bonjour {s_name} ! Selon l'analyse démographique du cours (et la théorie malthusienne), lorsque la population s'accroît rapidement alors que la production alimentaire n'augmente que lentement, la pauvreté s'aggrave si l'économie ne s'adapte pas. Quelle question avez-vous sur cette leçon ?"
    elif "chem" in v_lower or "chimie" in q_lower or "alkylammonium" in q_lower or "amine" in q_lower:
        return f"Bonjour {s_name} ! En chimie organique, les cations d'alkylammonium (R-NH3+) se comportent comme des acides faibles en cédant un proton H+ à l'eau, formant l'amine R-NH2 et des ions hydronium H3O+ à l'équilibre."
    else:
        return f"Bonjour {s_name} ! En analysant la leçon active sur les caractéristiques extra-économiques, quel élément clé selon vous explique ce phénomène ?"


def translate_flashcards(flashcards_list, target_locale):
    global GEMINI_DISABLED
    if not flashcards_list:
        return flashcards_list
        
    cache = load_translation_cache()
    lst_hash = hashlib.md5(json.dumps(flashcards_list, sort_keys=True).encode('utf-8')).hexdigest()
    cache_key = f"fc_{lst_hash}_{target_locale}"
    if cache_key in cache:
        print(f"[TRANSLATE CACHE] Hit for flashcards ({target_locale})")
        return cache[cache_key]
        
    lang_map = {
        "en_US": "English",
        "fr_FR": "French",
        "zh_CN": "Chinese",
        "es_ES": "Spanish",
        "pt_PT": "Portuguese",
        "ar_AE": "Arabic"
    }
    target_lang = lang_map.get(target_locale, "English")
    google_key = os.environ.get("GOOGLE_API_KEY")

    def fallback_translate():
        print("[TRANSLATE FLASHCARDS] Falling back to LLM translation loop...")
        translated = []
        for fc in flashcards_list:
            t_front = translate_via_llm(fc.get("front", ""), target_locale)
            t_back = translate_via_llm(fc.get("back", ""), target_locale)
            t_hint = translate_via_llm(fc.get("hint", ""), target_locale)
            translated.append({
                "front": t_front,
                "back": t_back,
                "hint": t_hint
            })
        return translated

    def do_batch_translate():
        global GEMINI_DISABLED
        # LOCAL-FIRST: always try on-device LLM/cache path before Gemini
        local_result = fallback_translate()
        if GEMINI_DISABLED or not google_key or os.environ.get("OFFLINE_MODE", "1") == "1":
            return local_result
        import time
        max_attempts = 5
        backoff = 2
        for attempt in range(max_attempts):
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=google_key)
                
                simple_list = []
                for fc in flashcards_list:
                    simple_list.append({
                        "front": fc.get("front", ""),
                        "back": fc.get("back", ""),
                        "hint": fc.get("hint", "")
                    })
                    
                prompt = (
                    f"Translate the 'front', 'back', and 'hint' fields of these educational flashcards into {target_lang}.\n"
                    "Keep the translated text extremely natural and accurate. Return the resulting array in the exact same JSON format."
                )
                
                response = client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=[json.dumps(simple_list), prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(
                                type=types.Type.OBJECT,
                                properties={
                                    "front": types.Schema(type=types.Type.STRING),
                                    "back": types.Schema(type=types.Type.STRING),
                                    "hint": types.Schema(type=types.Type.STRING)
                                },
                                required=["front", "back", "hint"]
                            )
                        )
                    )
                )
                translated_list = json.loads(response.text.strip())
                return translated_list
            except Exception as e:
                print(f"[TRANSLATE FLASHCARDS WARNING] Gemini attempt {attempt+1}/{max_attempts} failed: {e}")
                err_str = str(e).lower()
                if "resource_exhausted" in err_str or "depleted" in err_str or "billing" in err_str or "429" in err_str:
                    GEMINI_DISABLED = True
                    print("[CIRCUIT BREAKER] Depleted Gemini credits detected. Disabling Gemini globally.")
                    return fallback_translate()
                if attempt == max_attempts - 1:
                    print(f"[TRANSLATE FLASHCARDS ERROR] Gemini failed: {e}. Falling back to LLM translation loop...")
                    return fallback_translate()
                time.sleep(1)
                
    result = do_batch_translate()
    cache[cache_key] = result
    save_translation_cache(cache)
    return result

def translate_single_text(text, target_locale):
    global GEMINI_DISABLED
    if not text:
        return text
    if target_locale in translations and text in translations[target_locale]:
        return translations[target_locale][text]
    lang_map = {
        "en_US": "English",
        "fr_FR": "French",
        "zh_CN": "Chinese",
        "es_ES": "Spanish",
        "pt_PT": "Portuguese",
        "ar_AE": "Arabic"
    }
    target_lang = lang_map.get(target_locale, "English")
    google_key = os.environ.get("GOOGLE_API_KEY")
    if not google_key:
        return translate_via_llm(text, target_locale)
    import time
    max_attempts = 5
    backoff = 2
    for attempt in range(max_attempts):
        try:
            from google import genai
            client = genai.Client(api_key=google_key)
            prompt = f"Translate the following text into fluent, natural {target_lang}. Respond ONLY with the translation: \"{text}\""
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            return response.text.strip().strip('"')
        except Exception as e:
            print(f"[TRANSLATE TEXT WARNING] Gemini attempt {attempt+1}/{max_attempts} failed: {e}")
            if attempt == max_attempts - 1:
                print(f"[TRANSLATE TEXT ERROR] Gemini failed: {e}. Falling back to original text.")
                return text
            time.sleep(backoff)
            backoff *= 2

# Legacy wrappers for backwards compatibility
def translate_timestamps_to_french(timestamps_list):
    return translate_timestamps(timestamps_list, "fr_FR")

def translate_flashcards_to_french(flashcards_list):
    return translate_flashcards(flashcards_list, "fr_FR")

# Helper function to generate a valid mock 1-second WAV silence file
def make_mock_wav():
    # 44 bytes WAV header for 8000Hz, 16-bit mono PCM (silence)
    num_samples = 8000
    data_size = num_samples * 2
    file_size = 36 + data_size
    header = bytearray(44)
    header[0:4] = b'RIFF'
    header[4:8] = file_size.to_bytes(4, 'little')
    header[8:12] = b'WAVE'
    header[12:16] = b'fmt '
    header[16:20] = (16).to_bytes(4, 'little')
    header[20:22] = (1).to_bytes(2, 'little')
    header[22:24] = (1).to_bytes(2, 'little')
    header[24:28] = (8000).to_bytes(4, 'little')
    header[28:32] = (16000).to_bytes(4, 'little')
    header[32:34] = (2).to_bytes(2, 'little')
    header[34:36] = (16).to_bytes(2, 'little')
    header[36:40] = b'data'
    header[40:44] = data_size.to_bytes(4, 'little')
    data = bytes(data_size)
    return bytes(header) + data

# Helper function to wrap raw PCM bytes into a standard browser-playable WAV stream
def pcm_to_wav(pcm_bytes, sample_rate=16000):
    data_size = len(pcm_bytes)
    file_size = 36 + data_size
    header = bytearray(44)
    header[0:4] = b'RIFF'
    header[4:8] = file_size.to_bytes(4, 'little')
    header[8:12] = b'WAVE'
    header[12:16] = b'fmt '
    header[16:20] = (16).to_bytes(4, 'little') # Subchunk1Size (16 for PCM)
    header[20:22] = (1).to_bytes(2, 'little')  # AudioFormat (1 for PCM)
    header[22:24] = (1).to_bytes(2, 'little')  # NumChannels (Mono = 1)
    header[24:28] = sample_rate.to_bytes(4, 'little')
    byte_rate = sample_rate * 1 * 2  # SampleRate * NumChannels * BitsPerSample/8 (16/8 = 2)
    header[28:32] = byte_rate.to_bytes(4, 'little')
    header[32:34] = (2).to_bytes(2, 'little')  # BlockAlign (NumChannels * BitsPerSample/8)
    header[34:36] = (16).to_bytes(2, 'little') # BitsPerSample (16)
    header[36:40] = b'data'
    header[40:44] = data_size.to_bytes(4, 'little')
    return bytes(header) + pcm_bytes



def _port_in_use(port):
    import socket as _socket
    sock = _socket.socket(_socket.AF_INET, _socket.SOCK_STREAM)
    try:
        sock.settimeout(0.4)
        return sock.connect_ex(("127.0.0.1", int(port))) == 0
    finally:
        sock.close()

HTTP_PORT = 8000
WS_PORT = 8001

# Deployment Mode configuration ("SINGLE" vs "CLASSROOM" vs "LAB")
_saved_mode = str(load_session_info().get("active_mode") or os.environ.get("DEPLOYMENT_MODE", "SINGLE")).upper()
DEPLOYMENT_MODE = _saved_mode if _saved_mode in ("SINGLE", "CLASSROOM", "LAB") else "SINGLE"

# Track connected WebSocket client sockets and classroom session state
connected_clients = set()
connected_students_map = {}
active_mic_speaker = None

# Mode 3: LAB Mode Pod Session maps
pod_sessions = {}
connected_pod_map = {}

MAIN_ASYNCIO_LOOP = None
NETWORK_EVENT_LOG = []
DEFAULT_SOCRATIC_ROOM = "socratic_tutor_room"
LOCAL_AVATAR_FALLBACK = "/static/professor_evans_avatar.png"


def append_network_log(msg, level="info"):
    NETWORK_EVENT_LOG.append({
        "time": time.strftime("%H:%M:%S"),
        "level": level,
        "msg": str(msg),
    })
    if len(NETWORK_EVENT_LOG) > 80:
        del NETWORK_EVENT_LOG[:-80]


def forward_gpio_udp(payload):
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.sendto(json.dumps(payload).encode("utf-8"), ("127.0.0.1", 8002))
        append_network_log(f"UDP 8002 {payload.get('action') or payload.get('event')}")
    except Exception as e:
        append_network_log(f"UDP 8002 failed: {e}", "error")
        print(f"[WS -> UDP ERROR] Failed to forward: {e}")
    finally:
        sock.close()


def local_avatar_url(path):
    if not path:
        return LOCAL_AVATAR_FALLBACK
    raw = str(path).strip()
    if raw.startswith("/static/") or raw.startswith("data:"):
        return raw
    if raw.startswith("http://") or raw.startswith("https://"):
        return LOCAL_AVATAR_FALLBACK
    if os.path.exists(os.path.join(PROJECT_ROOT, raw.lstrip("/"))):
        return "/" + raw.lstrip("/")
    return LOCAL_AVATAR_FALLBACK


def sync_broadcast_ws(payload_dict):
    global MAIN_ASYNCIO_LOOP
    if not connected_clients:
        return
    msg = json.dumps(payload_dict)
    if MAIN_ASYNCIO_LOOP and MAIN_ASYNCIO_LOOP.is_running():
        for ws in list(connected_clients):
            try:
                asyncio.run_coroutine_threadsafe(ws.send(msg), MAIN_ASYNCIO_LOOP)
            except Exception:
                pass

async def broadcast_to_pod(pod_id, message_str, exclude_ws=None):
    if pod_id in pod_sessions:
        for ws in list(pod_sessions[pod_id].get("sockets", set())):
            if ws != exclude_ws:
                try:
                    await ws.send(message_str)
                except Exception as e:
                    print(f"[POD WS WARN] Send failed for socket in pod {pod_id}: {e}")

# MCQ Quiz questions answers mapping for grading
QUIZ_QUESTIONS = {
    "Demographics": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "A" },
            { "id": 5, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" }
        ]
    },
    "Chemistry": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" }
        ]
    },
    "Economics": {
        "main": [
            { "id": 1, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "B" }
        ]
    },
    "Sanitaire": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" }
        ]
    },
    "calculus": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ]
    },
    "College": {
        "main": [
            { "id": 1, "correct": "B" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "A" },
            { "id": 5, "correct": "B" }
        ]
    }
}


translations = {
    "fr_FR": {
        "Downloaded Library": "Bibliothèque téléchargée",
        "K-12 Education": "Éducation K-12",
        "College Level": "Niveau universitaire",
        "Independent Learner": "Apprenant indépendant",
        "Professional Certificates": "Certificats professionnels",
        
        # Subjects
        "Chemistry": "Chimie",
        "chemistry": "chimie",
        "Economics": "Économie",
        "Economics & Calculus": "Économie & Calcul",
        "Physics": "Physique",
        "physics": "physique",
        "Mathematics": "Mathématiques",
        "Calculus": "Calcul",
        "English Literature": "Littérature anglaise",
        "World History": "Histoire mondiale",
        "Corporate Finance": "Finance d'entreprise",
        "Macroeconomics": "Macroéconomie",
        "Data Structures": "Structures de données",
        "Data Structures & Algorithms": "Structures de données & Algorithmes",
        "Neural Networks & Deep Learning": "Réseaux de neurones & Apprentissage profond",
        "Operating Systems": "Systèmes d'exploitation",
        "Electrical Circuits": "Circuits électriques",
        "Mechanical Statics": "Statique mécanique",
        "Differential Equations": "Équations différentielles",
        "Linear Algebra": "Algèbre linéaire",
        "Biochemistry": "Biochimie",
        "Human Anatomy": "Anatomie humaine",
        "Amateur Rocketry": "Fusées amateurs",
        "Chess Grandmaster Strategy": "Stratégie de grand maître d'échecs",
        "Digital Cinematography": "Cinématographie numérique",
        "Music Theory & Composition": "Théorie musicale & Composition",
        "Conversational French": "Français conversationnel",
        "Mandarin Chinese": "Chinois mandarin",
        "Socratic Dialogues": "Dialogues socratiques",
        "Stoicism & Ethics": "Stoïcisme & Éthique",
        "CompTIA Security+": "CompTIA Security+",
        "Network Security": "Sécurité réseau",
        "Google Data Analytics": "Google Data Analytics",
        "PMP Certification": "Certification PMP",
        "AWS Solutions Architect": "AWS Solutions Architect",
        "Cisco CCNA Networking": "Réseaux Cisco CCNA",
        
        # Economics Flashcards
        "What are the three main international institutions mentioned that actively combat hunger and agricultural underdevelopment?": "Quelles sont les trois principales institutions internationales mentionnées qui luttent activement contre la faim et le sous-développement agricole ?",
        "The FAO (Food and Agriculture Organization of the United Nations), IFAD (International Fund for Agricultural Development), and the WFP (World Food Programme).": "La FAO (Organisation des Nations Unies pour l'alimentation et l'agriculture), le FIDA (Fonds international de développement agricole) et le PAM (Programme alimentaire mondial).",
        "Think of the acronyms of three UN-affiliated organizations for food, agricultural development, and global food aid.": "Pensez aux acronymes de trois organisations affiliées à l'ONU pour l'alimentation, le développement agricole et l'aide alimentaire mondiale.",
        "Why do population growth and soaring food prices worsen the food situation in underdeveloped countries?": "Pourquoi la croissance démographique et la flambée des prix alimentaires aggravent-elles la situation alimentaire dans les pays sous-développés ?",
        "Population growth creates an imbalance by increasing the population faster than agricultural production, while soaring prices make food inaccessible for low-income households.": "La croissance démographique crée un déséquilibre en augmentant la population plus rapidement que la production agricole, tandis que la flambée des prix rend la nourriture inaccessible pour les ménages à faible revenu.",
        "Reflect on the relationship between the number of consumers, the speed of production, and purchasing power.": "Réfléchissez à la relation entre le nombre de consommateurs, la vitesse de production et le pouvoir d'achat.",
        "How do agricultural mechanization and water management help solve food problems?": "Comment la mécanisation agricole et la gestion de l'eau aident-elles à résoudre les problèmes alimentaires ?",
        "They increase productivity and crop yields while freeing production from weather hazards through controlled irrigation systems.": "Elles augmentent la productivité et les rendements agricoles tout en libérant la production des aléas climatiques grâce à des systèmes d'irrigation contrôlés.",
        "Think about the impact of modern technology and irrigation on the consistency and quantity of harvests.": "Pensez à l'impact de la technologie moderne et de l'irrigation sur la régularité et la quantité des récoltes.",
        
        # Economics Timestamps
        "Introduction and food institutions": "Introduction et institutions alimentaires",
        "Presentation of international institutions such as the FAO, IFAD, and the WFP, which work to combat hunger worldwide.": "Présentation des institutions internationales telles que la FAO, le FIDA et le PAM, qui luttent contre la faim dans le monde.",
        "The causes of food problems": "Les causes des problèmes alimentaires",
        "Analysis of the factors causing food shortages, including rising prices, low agricultural productivity, population growth, and a lack of savings.": "Analyse des facteurs à l'origine des pénuries alimentaires, notamment la hausse des prix, la faible productivité agricole, la croissance démographique et le manque d'épargne.",
        "The consequences of undernutrition": "Les conséquences de la sous-alimentation",
        "Explanation of the physical and intellectual impacts of malnutrition, as well as food dependency and the loss of foreign exchange for underdeveloped countries.": "Explication des impacts physiques et intellectuels de la malnutrition, ainsi que de la dépendance alimentaire et de la perte de devises pour les pays sous-développés.",
        "Solutions to ensure self-sufficiency": "Solutions pour assurer l'autosuffisance",
        "Discussion on pathways to improvement, including agricultural mechanization, water management, price controls, and support from international institutions.": "Discussion sur les voies d'amélioration, notamment la mécanisation agricole, la gestion de l'eau, le contrôle des prix et le soutien des institutions internationales.",
        
        # Books
        "chemistry_bonds": "Liaisons chimiques",
        "chemistry_bonds.pdf": "Liaisons chimiques",
        "Chemistry Bonds": "Liaisons chimiques",
        "pendulum_handbook": "Manuel du pendule",
        "pendulum_handbook.pdf": "Manuel du pendule",
        "Pendulum Handbook": "Manuel du pendule",
        "stoic_propositions": "Propositions stoïciennes",
        "stoic_propositions.pdf": "Propositions stoïciennes",
        "Stoic Propositions": "Propositions stoïciennes",
        "calculus_derivatives": "Dérivées du calcul",
        "calculus_derivatives.pdf": "Dérivées du calcul",
        "Calculus Derivatives": "Dérivées du calcul",
        "les_characteristiques_extraeconomiques": "Les caractéristiques extra-économiques",
        "les_characteristiques_extraeconomiques.pdf": "Les caractéristiques extra-économiques",
        "Les Caractéristiques Extra-Économiques": "Les caractéristiques extra-économiques",
        "Caractéristiques Extra-économiques": "Caractéristiques Extra-économiques",
        "Économie Globale & Croissance": "Économie Globale & Croissance",
        "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
            "Le calcul est l'étude mathématique du changement continu, englobant le calcul différentiel et le calcul intégral.",
        "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
            "La dérivée d'une fonction f(x) représente le taux de variation instantané de la valeur de la fonction par rapport à sa variable x.",
        "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
            "Géométriquement, la dérivée en un point x correspond à la pente m de la tangente au graphique de la fonction f(x) = x^3 - 3x.",
        "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
            "La chimie est l'étude de la matière, de ses propriétés, de comment et pourquoi les substances se combinent ou se séparent.",
        "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
            "La physique est la science naturelle qui étudie la matière, ses constituants fondamentaux, son mouvement et son comportement à travers l'espace et le temps.",
        
        # Onboarding Translations
        "What is your first and last name?": "Quel est votre nom et prénom ?",
        "Welcome to Gandal AI. What is your first and last name?": "Bienvenue sur Gandal AI. Quel est votre nom et prénom ?",
        "Nice to meet you! Let's get started by setting up your academic profile.": "Ravi de vous rencontrer ! Commençons par configurer votre profil académique.",
        "What are you interested in learning today?": "Qu'est-ce qui vous intéresse d'apprendre aujourd'hui ?",
        "Select the option that best matches your learning objectives.": "Sélectionnez l'option qui correspond le mieux à vos objectifs d'apprentissage.",
        "What is your preferred study schedule?": "Quel est votre emploi du temps d'étude préféré ?",
        "Choose a routine that fits your lifestyle. You can study anytime!": "Choisissez une routine qui convient à votre style de vie. Vous pouvez étudier à tout moment !",
        "What is your current level of expertise in this field?": "Quel est votre niveau d'expertise actuel dans ce domaine ?",
        "Don't worry, we customize material to challenge you perfectly.": "Ne vous inquiétez pas, nous personnalisons le contenu pour vous stimuler parfaitement.",
        "Which specific topics within this path excite you most?": "Quels sujets spécifiques de ce parcours vous passionnent le plus ?",
        "Select all areas of interest to tailor your curriculum ledger.": "Sélectionnez tous les domaines d'intérêt pour personnaliser votre programme d'études.",
        "Academic Setup Complete": "Configuration académique terminée",
        "Your AI-driven personalized curriculum has been fully synthesized.": "Votre programme d'études personnalisé basé sur l'IA a été entièrement synthétisé.",
        "Setup Complete. Speak enter classroom to begin.": "Configuration terminée. Dites entrer dans la classe pour commencer.",
        "Entering the classroom now.": "Entrée dans la classe en cours.",
        "Nice to meet you, ": "Enchanté de vous rencontrer, ",
        "K-12 selected.": "K-12 sélectionné.",
        "Professional selected.": "Professionnel sélectionné.",
        "College selected.": "Université sélectionnée.",
        "Independent selected.": "Indépendant sélectionné.",
        "Midnight selected.": "Minuit sélectionné.",
        "Morning selected.": "Matin sélectionné.",
        "Mid-day selected.": "Midi sélectionné.",
        "Flexible selected.": "Flexible sélectionné.",
        "Beginner selected.": "Débutant sélectionné.",
        "Intermediate selected.": "Intermédiaire sélectionné.",
        "Advanced selected.": "Avancé sélectionné.",
        "Completing setup.": "Configuration en cours de finalisation.",
        "Full Name": "Nom complet",
        "Ask anything...": "Demandez n'importe quoi...",

        # Evaluation/Quiz Questions & Options
        "What is the derivative of f(x) = x^2?": "Quelle est la dérivée de f(x) = x^2 ?",
        "2x": "2x",
        "x": "x",
        "2": "2",
        "x^2": "x^2",
        "What is the limit of (1/x) as x approaches infinity?": "Quelle est la limite de (1/x) lorsque x tend vers l'infini ?",
        "1": "1",
        "0": "0",
        "infinity": "infini",
        "-1": "-1",
        "If f(x) = 3x - 5, what is f'(x)?": "Si f(x) = 3x - 5, quelle est f'(x) ?",
        "3": "3",
        "-5": "-5",
        "3x": "3x",
        "Geometrically, the derivative represents:": "Géométriquement, la dérivée représente :",
        "Area under the curve": "L'aire sous la courbe",
        "Slope of the tangent line": "La pente de la tangente",
        "Y-intercept": "L'ordonnée à l'origine",
        "Volume of rotation": "Le volume de révolution",
        "What is the derivative of a constant function?": "Quelle est la dérivée d'une fonction constante ?",
        "The constant itself": "La constante elle-même",
        "Infinity": "L'infini",

        "What is the derivative of f(x) = x^3?": "Quelle est la dérivée de f(x) = x^3 ?",
        "3x^2": "3x^2",
        "3x": "3x",
        "What is the limit of x as x approaches 5?": "Quelle est la limite de x lorsque x tend vers 5 ?",
        "5": "5",
        "If f(x) = 4x + 2, what is f'(x)?": "Si f(x) = 4x + 2, quelle est f'(x) ?",
        "4": "4",
        "4x": "4x",
        "Which of the following is differentiable everywhere?": "Lequel des éléments suivants est dérivable partout ?",
        "|x|": "|x|",
        "1/x": "1/x",
        "sqrt(x)": "sqrt(x)",
        "What is the slope of a horizontal line?": "Quelle est la pente d'une ligne horizontale ?",
        "Undefined": "Indéfinie",

        "The period of a simple pendulum depends on:": "La période d'un pendule simple dépend de :",
        "Bob mass": "La masse de la bobine",
        "String length": "La longueur du fil",
        "Oscillation amplitude": "L'amplitude de l'oscillation",
        "String thickness": "L'épaisseur du fil",
        "What is the acceleration due to gravity on Earth (approx)?": "Quelle est l'accélération due à la gravité sur Terre (environ) ?",
        "9.8 m/s^2": "9,8 m/s²",
        "1.6 m/s^2": "1,6 m/s²",
        "100 m/s^2": "100 m/s²",
        "0 m/s^2": "0 m/s²",
        "In simple harmonic motion, the restoring force is proportional to:": "Dans un mouvement harmonique simple, la force de rappel est proportionnelle à :",
        "Velocity": "La vitesse",
        "Displacement": "Au déplacement",
        "Mass": "La masse",
        "Time elapsed": "Le temps écoulé",
        "What is the standard unit of frequency?": "Quelle est l'unité standard de fréquence ?",
        "Newton": "Newton",
        "Hertz": "Hertz",
        "Joule": "Joule",
        "Watt": "Watt",
        "Damping in a pendulum system causes the amplitude to:": "L'amortissement dans un système de pendule fait que l'amplitude :",
        "Increase linearly": "Augmente linéairement",
        "Remain constant": "Reste constante",
        "Decay exponentially": "Décroît de manière exponentielle",
        "Oscillate randomly": "Oscille de manière aléatoire",

        "What decreases the period of a simple pendulum?": "Qu'est-ce qui diminue la période d'un pendule simple ?",
        "Shorter length": "Une longueur plus courte",
        "Greater mass": "Une masse plus grande",
        "Larger bob size": "Une taille de bobine plus grande",
        "Smaller gravity": "Une gravité plus faible",
        "The period T of an oscillation is equal to:": "La période T d'une oscillation est égale à :",
        "1 / f": "1 / f",
        "f": "f",
        "2 * pi * f": "2 * pi * f",
        "f^2": "f^2",
        "What force restores a pendulum to its equilibrium position?": "Quelle force ramène un pendule à sa position d'équilibre ?",
        "Tension": "La tension",
        "Gravity": "La gravité",
        "Frictional drag": "La traînée de friction",
        "Centripetal force": "La force centripète",
        "An undamped pendulum in a vacuum will oscillate:": "Un pendule non amorti dans le vide oscillera :",
        "Indefinitely": "Indéfiniment",
        "For exactly 10 seconds": "Pendant exactement 10 secondes",
        "Not at all": "Pas du tout",
        "With increasing frequency": "Avec une fréquence croissante",
        "If the local acceleration due to gravity g increases, the pendulum period T:": "Si l'accélération locale due à la gravité g augmente, la période du pendule T :",
        "Increases": "Augmente",
        "Decreases": "Diminue",
        "Stays the same": "Reste la même",
        "Doubles": "Double",

        "Covalent bonds involve:": "Les liaisons covalentes impliquent :",
        "Sharing electrons": "Le partage d'électrons",
        "Transferring electrons": "Le transfert d'électrons",
        "Metallic sea of electrons": "Une mer d'électrons métalliques",
        "No electron interaction": "Aucune interaction électronique",
        "What is the chemical formula for water?": "Quelle est la formule chimique de l'eau ?",
        "CO2": "CO2",
        "H2O": "H2O",
        "NaCl": "NaCl",
        "HCl": "HCl",
        "Ionic bonds typically form between:": "Les liaisons ioniques se forment généralement entre :",
        "Two non-metals": "Deux non-métaux",
        "Metals and non-metals": "Des métaux et des non-métaux",
        "Noble gases": "Des gaz nobles",
        "Two metals": "Deux métaux",
        "What is the pH of pure water at room temperature?": "Quel est le pH de l'eau pure à température ambiante ?",
        "1": "1",
        "7": "7",
        "14": "14",
        "0": "0",
        "The most abundant gas in Earth's atmosphere is:": "Le gaz le plus abondant dans l'atmosphère terrestre est :",
        "Oxygen": "L'oxygène",
        "Nitrogen": "L'azote",
        "Carbon Dioxide": "Le dioxyde de carbone",
        "Hydrogen": "L'hydrogène",

        "Sharing of three pairs of electrons forms a:": "Le partage de trois paires d'électrons forme une :",
        "Single bond": "Liaison simple",
        "Double bond": "Liaison double",
        "Triple bond": "Liaison triple",
        "Ionic bond": "Liaison ionique",
        "Which element has atomic number 1?": "Quel élément a le numéro atomique 1 ?",
        "Helium": "L'hélium",
        "Hydrogen": "L'hydrogène",
        "Carbon": "Le carbone",
        "Oxygen": "L'oxygène",
        "An acidic solution has a pH value of:": "Une solution acide a une valeur de pH de :",
        "Greater than 7": "Supérieure à 7",
        "Less than 7": "Inférieure à 7",
        "Exactly 7": "Égale à 7",
        "Exactly 14": "Égale à 14",
        "Which of the following is classified as a noble gas?": "Lequel des éléments suivants est classé comme un gaz noble ?",
        "Chlorine": "Le chlore",
        "What is the electric charge of an electron?": "Quelle est la charge électrique d'un électron ?",
        "Positive": "Positive",
        "Negative": "Négative",
        "Neutral": "Neutre",
        "Variable": "Variable",

        # Onboarding Cards Step 2
        "K-12 Education": "Éducation K-12",
        "Core curriculum mastery from primary years through high school graduation.": "Maîtrise du programme de base, des années primaires jusqu'à la fin des études secondaires.",
        "Professional Certificates": "Certificats professionnels",
        "Industry-aligned skill paths for career advancement and technical mastery.": "Parcours de compétences alignés sur l'industrie pour l'avancement de carrière et la maîtrise technique.",
        "College Level": "Niveau universitaire",
        "Advanced academic subjects, research methods, and degree-level concepts.": "Sujets académiques avancés, méthodes de recherche et concepts de niveau universitaire.",
        "Independent Learner": "Apprenant indépendant",
        "Custom exploration of niche topics, hobbies, and lifelong self-improvement.": "Exploration personnalisée de sujets de niche, de passe-temps et d'auto-amélioration tout au long de la vie.",

        # Onboarding Cards Step 3
        "Midnight Session": "Session de minuit",
        "Late night focus, designed for uninterrupted deep work.": "Focus tard dans la nuit, conçu pour un travail approfondi ininterrompu.",
        "Morning Focus": "Focus du matin",
        "Start your day with high-retention cognitive priming.": "Commencez votre journée avec un amorçage cognitif à forte rétention.",
        "Mid-day Review": "Révision de la mi-journée",
        "Quick learning bursts to supplement your daily routine.": "De courtes sessions d'apprentissage pour compléter votre routine quotidienne.",
        "Flexible": "Flexible",
        "Adaptable sessions that fit around your active schedule.": "Des sessions adaptables qui s'intègrent dans votre emploi du temps actif.",

        # Onboarding Cards Step 4
        "Beginner": "Débutant",
        "Starting from scratch. No prior experience or technical background in this specific area.": "Partir de zéro. Aucune expérience préalable ou bagage technique dans ce domaine spécifique.",
        "Intermediate": "Intermédiaire",
        "I have some foundation. Familiar with basic concepts but need help connecting complex ideas.": "J'ai quelques bases. Familier avec les concepts de base mais j'ai besoin d'aide pour relier des idées complexes.",
        "Advanced": "Avancé",
        "Looking for mastery. Deeply technical or theoretical understanding, seeking edge-case expertise.": "À la recherche de la maîtrise. Compréhension profondément technique ou théorique, recherche d'une expertise pointue.",

        # Onboarding Topics & Timeline Steps
        "Calculus": "Calcul",
        "Classical Pendulums": "Pendules classiques",
        "Math": "Maths",
        "Physics": "Physique",
        "Goal Selection": "Sélection de l'objectif",
        "Study Schedule": "Emploi du temps",
        "Level Check": "Niveau d'expertise",
        "Interests": "Intérêts",
        "Goals": "Objectifs",
        "Schedule": "Calendrier",
        "Level": "Niveau",
        "Topics": "Sujets",

        # Onboarding Buttons & Layout Elements
        "Continue": "Continuer",
        "Previous Step": "Étape précédente",
        "Finish Setup": "Terminer la configuration",
        "Re-Configure Preferences": "Reconfigurer les préférences",
        "Enter Classroom": "Entrer dans la classe",
        "STUDENT CLASSROOM PREVIEW": "APERÇU DE LA CLASSE DE L'ÉTUDIANT",
        "AI Tutor Live Feed": "Flux en direct du tuteur IA",
        "Listening...": "Écoute...",
        "Limits & Derivatives": "Limites et dérivées",

        # Instructor profiles & popovers
        "Cognitive Science Specialist": "Spécialiste en sciences cognitives",
        "Ancient Socratic Mentor": "Mentor socratique antique",
        "Quantum Physics Pioneer": "Pionnier de la physique quantique",
        "Calculus Specialist": "Spécialiste du calcul",
        "8 years": "8 ans",
        "25 years": "25 ans",
        "40 years": "40 ans",
        "10 years": "10 ans",
        "20 years": "20 ans",
        "15 years": "15 ans",
        "Dr. Sophia AI is a Cognitive Science Specialist, specializing in AI-driven socratic tutor systems, machine learning, and cognitive neuroscience.": "La Dre Sophia AI est une spécialiste en sciences cognitives, spécialisée dans les systèmes de tuteurs socratiques basés sur l'IA, l'apprentissage automatique et les neurosciences cognitives.",
        "Socrates was a classical Greek philosopher credited as one of the founders of Western philosophy, known for the Socratic method of dialogue.": "Socrate était un philosophe grec classique considéré comme l'un des fondateurs de la philosophie occidentale, connu pour la méthode socratique de dialogue.",
        "Albert Einstein was a theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics, with a lifetime of academic exploration.": "Albert Einstein était un physicien théoricien qui a développé la théorie de la relativité, l'un des deux piliers de la physique moderne, avec toute une vie d'exploration académique.",
        "Professor Evans is a passionate Calculus Specialist with 10 years of experience teaching differential and integral calculus, focusing on visual and intuitive graphing approaches.": "Le professeur Evans est un spécialiste passionné du calcul avec 10 ans d'expérience dans l'enseignement du calcul différentiel et intégral, se concentrant sur des approches graphiques visuelles et intuitives.",
        "Professor Marcus is a senior Philosophy Specialist with 20 years of academic teaching experience. He specializes in Ancient Socratic dialogues and Stoic philosophy.": "Le professeur Marcus est un spécialiste principal de la philosophie avec 20 ans d'expérience dans l'enseignement académique. Il se spécialise dans les dialogues socratiques antiques et la philosophie stoïcienne.",
        "Dr. Harris is an esteemed specialist in Physics with 15 years of experience in quantum mechanics and educational research. Dedicated to helping students grasp complex physical concepts.": "Le Dr Harris est un spécialiste estimé en physique avec 15 ans d'expérience en mécanique quantique et en recherche éducative. Dédié à aider les étudiants à saisir des concepts physiques complexes."
    },
    "es_ES": {
        "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
            "El cálculo es el estudio matemático del cambio continuo, que abarca el cálculo diferencial y el cálculo integral.",
        "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
            "La derivada de una función f(x) representa la tasa instantánea de cambio del valor de la función con respecto a su variable x.",
        "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
            "Geométricamente, la derivada en un punto x corresponde a la pendiente m de la recta tangente a la gráfica de la función f(x) = x^3 - 3x.",
        "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
            "La química es el estudio de la materia, sus propiedades, cómo y por qué las sustancias se combinan o se separan.",
        "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
            "La física es la ciencia natural que estudia la materia, sus constituyentes fundamentales, su movimiento y comportamiento a través del espacio y el tiempo.",
        
        # Onboarding Translations
        "What is your first and last name?": "¿Cuál es tu nombre y apellido?",
        "Welcome to Gandal AI. What is your first and last name?": "Bienvenido a Gandal AI. ¿Cuál es tu nombre y apellido?",
        "Nice to meet you! Let's get started by setting up your academic profile.": "¡Gusto en conocerte! Comencemos configurando tu perfil académico.",
        "What are you interested in learning today?": "¿Qué te interesa aprender hoy?",
        "Select the option that best matches your learning objectives.": "Selecciona la opción que mejor se adapte a tus objetivos de aprendizaje.",
        "What is your preferred study schedule?": "¿Cuál es tu horario de estudio preferido?",
        "Choose a routine that fits your lifestyle. You can study anytime!": "Elige una rutina que se adapte a tu estilo de vida. ¡Puedes estudiar en cualquier momento!",
        "What is your current level of expertise in this field?": "¿Cuál es tu nivel actual de experiencia en este campo?",
        "Don't worry, we customize material to challenge you perfectly.": "No te preocupes, personalizamos el material para desafiarte a la perfección.",
        "Which specific topics within this path excite you most?": "¿Qué temas específicos dentro de este camino te entusiasman más?",
        "Select all areas of interest to tailor your curriculum ledger.": "Selecciona todas las áreas de interés para adaptar tu plan de estudios.",
        "Academic Setup Complete": "Configuración académica completada",
        "Your AI-driven personalized curriculum has been fully synthesized.": "Tu plan de estudios personalizado impulsado por IA ha sido completamente sintetizado.",
        "Setup Complete. Speak enter classroom to begin.": "Configuración completada. Di entrar al aula para comenzar.",
        "Entering the classroom now.": "Entrando al aula ahora.",
        "Nice to meet you, ": "Gusto en conocerte, ",
        "K-12 selected.": "K-12 seleccionado.",
        "Professional selected.": "Profesional seleccionado.",
        "College selected.": "Universidad seleccionada.",
        "Independent selected.": "Independiente seleccionado.",
        "Midnight selected.": "Sesión de medianoche seleccionada.",
        "Morning selected.": "Sesión de mañana seleccionada.",
        "Mid-day selected.": "Sesión de mediodía seleccionada.",
        "Flexible selected.": "Sesión flexible seleccionada.",
        "Beginner selected.": "Principiante seleccionado.",
        "Intermediate selected.": "Intermedio seleccionado.",
        "Advanced selected.": "Avanzado seleccionado.",
        "Completing setup.": "Completando configuración."
    },
    "zh_CN": {
        "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
            "微积分是研究连续变化的数学学科，包括微分学和积分学。",
        "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
            "函数 f(x) 的导数表示函数值相对于其变量 x 的瞬时变化率。",
        "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
            "在几何上，点 x 处的导数对应于函数图像 f(x) = x^3 - 3x 的切线斜率 m。",
        "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
            "化学是研究物质、其性质以及物质如何及为什么结合或分离的科学。",
        "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
            "物理学是研究物质、其基本组成部分、其在空间和时间中的运动和行为的自然科学。",
        
        # Onboarding Translations
        "What is your first and last name?": "你的名字和姓氏是什么？",
        "Welcome to Gandal AI. What is your first and last name?": "欢迎来到 Gandal AI。你的名字和姓氏是什么？",
        "Nice to meet you! Let's get started by setting up your academic profile.": "很高兴见到你！让我们开始设置你的学术档案。",
        "What are you interested in learning today?": "你今天对学习什么感兴趣？",
        "Select the option that best matches your learning objectives.": "选择最符合你学习目标的选项。",
        "What is your preferred study schedule?": "你首选的学习时间表是什么？",
        "Choose a routine that fits your lifestyle. You can study anytime!": "选择适合你生活方式的常规。你可以随时学习！",
        "What is your current level of expertise in this field?": "你目前在该领域的专业水平如何？",
        "Don't worry, we customize material to challenge you perfectly.": "不用担心，我们会定制材料来完美地挑战你。",
        "Which specific topics within this path excite you most?": "这个路径中哪些特定主题最让你兴奋？",
        "Select all areas of interest to tailor your curriculum ledger.": "选择所有感兴趣的领域以定制你的课程体系。",
        "Academic Setup Complete": "学术设置已完成",
        "Your AI-driven personalized curriculum has been fully synthesized.": "你的 AI 驱动个性化课程体系已完全合成。",
        "Setup Complete. Speak enter classroom to begin.": "设置已完成。说 进入教室 以开始。",
        "Entering the classroom now.": "现在进入教室。",
        "Nice to meet you, ": "很高兴见到你，",
        "K-12 selected.": "已选择K-12。",
        "Professional selected.": "已选择职业。",
        "College selected.": "已选择大学。",
        "Independent selected.": "已选择独立学习。",
        "Midnight selected.": "已选择半夜时间段。",
        "Morning selected.": "已选择早上时间段。",
        "Mid-day selected.": "已选择中午时间段。",
        "Flexible selected.": "已选择弹性时间段。",
        "Beginner selected.": "已选择初学者级。",
        "Intermediate selected.": "已选择中级。",
        "Advanced selected.": "已选择高级。",
        "Completing setup.": "完成设置。"
    },
    "pt_PT": {
        "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
            "O cálculo é o estudo matemático da mudança contínua, abrangendo o cálculo diferencial e o cálculo integral.",
        "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
            "A derivada de uma função f(x) representa a taxa de mudança instantânea do valor da função em relação à sua variável x.",
        "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
            "Geometricamente, a derivada em um ponto x corresponde à inclinação m da linha tangente ao gráfico da função f(x) = x^3 - 3x.",
        "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
            "A química é o estudo da matéria, suas propriedades, como e por que as substâncias se combinam ou se separam.",
        "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
            "A física é a ciência natural que estuda a matéria, seus constituintes fundamentais, seu movimento e comportamento através do espaço e do tempo.",
        
        # Onboarding Translations
        "What is your first and last name?": "Qual é o seu nome e sobrenome?",
        "Welcome to Gandal AI. What is your first and last name?": "Bem-vindo ao Gandal AI. Qual é o seu nome e sobrenome?",
        "Nice to meet you! Let's get started by setting up your academic profile.": "Prazer em conhecer-te! Vamos começar configurando o teu perfil académico.",
        "What are you interested in learning today?": "O que você está interessado em aprender hoje?",
        "Select the option that best matches your learning objectives.": "Selecione a opção que melhor corresponde aos seus objetivos de aprendizagem.",
        "What is your preferred study schedule?": "Qual é o seu cronograma de estudos preferido?",
        "Choose a routine that fits your lifestyle. You can study anytime!": "Escolha uma rotina que se adapte ao seu estilo de vida. Pode estudar a qualquer hora!",
        "What is your current level of expertise in this field?": "Qual é o seu nível atual de experiência neste campo?",
        "Don't worry, we customize material to challenge you perfectly.": "Não se preocupe, personalizamos o material para desafiá-lo perfeitamente.",
        "Which specific topics within this path excite you most?": "Quais tópicos específicos dentro deste caminho mais te entusiasmam?",
        "Select all areas of interest to tailor your curriculum ledger.": "Selecione todas as áreas de interesse para personalizar o seu currículo.",
        "Academic Setup Complete": "Configuração académica concluída",
        "Your AI-driven personalized curriculum has been fully synthesized.": "O seu currículo personalizado impulsionado por IA foi totalmente sintetizado.",
        "Setup Complete. Speak enter classroom to begin.": "Configuração concluída. Diga entrar na sala de aula para começar.",
        "Entering the classroom now.": "Entrando na sala de aula agora.",
        "Nice to meet you, ": "Prazer em conhecer-te, ",
        "K-12 selected.": "K-12 selecionado.",
        "Professional selected.": "Profissional selecionado.",
        "College selected.": "Ensino superior selecionado.",
        "Independent selected.": "Independente selecionado.",
        "Midnight selected.": "Sessão da meia-noite selecionada.",
        "Morning selected.": "Sessão da manhã selecionada.",
        "Mid-day selected.": "Sessão do meio-dia selecionada.",
        "Flexible selected.": "Sessão flexível selecionada.",
        "Beginner selected.": "Iniciante selecionado.",
        "Intermediate selected.": "Intermediário selecionado.",
        "Advanced selected.": "Avançado selecionado.",
        "Completing setup.": "Concluindo a configuração."
    },
    "ar_AE": {
        "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
            "التفاضل والتكامل هو الدراسة الرياضية للتغير المستمر، ويشمل حساب التفاضل وحساب التكامل.",
        "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
            "مشتقة دالة f(x) تمثل معدل التغير اللحظي لقيمة الدالة بالنسبة لمتغيرها x.",
        "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
            "هندسيًا، المشتقة عند نقطة x تقابل ميل الخط المماس لمخطط الدالة f(x) = x^3 - 3x.",
        "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
            "الكيمياء هي دراسة المادة وخواصها وكيف ولماذا تتحد المواد أو تنفصل.",
        "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
            "الفيزياء هي العلم الطبيعي الذي يدرس المادة ومكوناتها الأساسية وحركتها وسلوكها عبر المكان والزمان.",
        
        # Onboarding Translations
        "What is your first and last name?": "ما هو اسمك الأول والأخير؟",
        "Welcome to Gandal AI. What is your first and last name?": "مرحبًا بك في Gandal AI. ما هو اسمك الأول والأخير؟",
        "Nice to meet you! Let's get started by setting up your academic profile.": "سررت بلقائك! لنبدأ بإعداد ملفك الشخصي الأكاديمي.",
        "What are you interested in learning today?": "ما الذي ترغب في تعلمه اليوم؟",
        "Select the option that best matches your learning objectives.": "اختر الخيار الذي يتوافق بشكل أفضل مع أهدافك التعليمية.",
        "What is your preferred study schedule?": "ما هو جدول الدراسة المفضل لديك؟",
        "Choose a routine that fits your lifestyle. You can study anytime!": "اختر روتينًا يناسب نمط حياتك. يمكنك الدراسة في أي وقت!",
        "What is your current level of expertise in this field?": "ما هو مستواك الحالي من الخبرة في هذا المجال؟",
        "Don't worry, we customize material to challenge you perfectly.": "لا تقلق، نحن نخصص المواد لتحديك بشكل مثالي.",
        "Which specific topics within this path excite you most?": "ما هي المواضيع المحددة في هذا المسار التي تثير حماسك أكثر؟",
        "Select all areas of interest to tailor your curriculum ledger.": "حدد جميع مجالات الاهتمام لتخصيص سجل المناهج الدراسية الخاص بك.",
        "Academic Setup Complete": "اكتمل الإعداد الأكاديمي",
        "Your AI-driven personalized curriculum has been fully synthesized.": "تم تصنيع منهجك الدراسي المخصص المعتمد على الذكاء الاصطناعي بالكامل.",
        "Setup Complete. Speak enter classroom to begin.": "اكتمل الإعداد. قل دخول الفصل الدراسي للبدء.",
        "Entering the classroom now.": "دخول الفصل الدراسي الآن.",
        "Nice to meet you, ": "سررت بلقائك، ",
        "K-12 selected.": "تم اختيار K-12.",
        "Professional selected.": "تم اختيار مهني.",
        "College selected.": "تم اختيار جامعي.",
        "Independent selected.": "تم اختيار مستقل.",
        "Midnight selected.": "تم اختيار جلسة منتصف الليل.",
        "Morning selected.": "تم اختيار جلسة الصباح.",
        "Mid-day selected.": "تم اختيار جلسة منتصف النهار.",
        "Flexible selected.": "تم اختيار جلسة مرنة.",
        "Beginner selected.": "تم اختيار مبتدئ.",
        "Intermediate selected.": "تم اختيار متوسط.",
        "Advanced selected.": "تم اختيار متقدم.",
        "Completing setup.": "جاري إكمال الإعداد."
    }
}


def _space_student_id(explicit=None):
    if explicit and str(explicit).strip():
        return str(explicit).strip()
    session_data = load_session_info()
    return (
        session_data.get("active_student_id")
        or session_data.get("student_id")
        or "Alseny"
    )


def query_local_llm(prompt, system_prompt=None, timeout=8):
    """Ventuno Q local-first: call Gemma/OpenAI-compatible server on :8080. Returns text or None."""
    import urllib.request
    import json as _json
    local_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:8080/v1").rstrip("/")
    model = os.environ.get("LOCAL_LLM_MODEL", "gemma-4-e4b")
    try:
        health = urllib.request.Request(local_url + "/models")
        with urllib.request.urlopen(health, timeout=1.5) as resp:
            if resp.status != 200:
                return None
    except Exception:
        return None
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    payload = _json.dumps({
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 512
    }).encode("utf-8")
    req = urllib.request.Request(
        local_url + "/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
            return (data.get("choices") or [{}])[0].get("message", {}).get("content")
    except Exception as e:
        print(f"[LOCAL LLM] query failed: {e}")
        return None


def query_local_kokoro_tts(text, voice="af_heart", timeout=10):
    """Try Kokoro OpenAI-compatible TTS on :8880. Returns audio bytes or None."""
    import urllib.request
    import json as _json
    base = os.environ.get("KOKORO_TTS_URL", "http://localhost:8880/v1").rstrip("/")
    payload = _json.dumps({
        "model": os.environ.get("KOKORO_TTS_MODEL", "kokoro"),
        "input": text,
        "voice": voice,
        "response_format": "mp3"
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            base + "/audio/speech",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print(f"[KOKORO TTS] unavailable: {e}")
        return None

def translate_via_llm(text, target_locale):
    """
    Translates text to the target locale using local LLM if running, or Google Gemini.
    """
    global GEMINI_DISABLED
    if not text:
        return text
    if target_locale in translations and text in translations[target_locale]:
        return translations[target_locale][text]
        
    # Check persistent cache
    cache = load_translation_cache()
    cache_key = f"text_{text}_{target_locale}"
    if cache_key in cache:
        return cache[cache_key]
        
    def _do_translate():
        global GEMINI_DISABLED
        lang_map = {
            "en_US": "English",
            "fr_FR": "French",
            "zh_CN": "Chinese",
            "es_ES": "Spanish",
            "pt_PT": "Portuguese",
            "ar_AE": "Arabic"
        }
        target_lang = lang_map.get(target_locale, "English")
        
        system_prompt = f"You are a professional real-time translator. Translate the user's input text into fluent, natural {target_lang}. Respond ONLY with the translation. Do not add explanations, notes, or quotes."
        user_prompt = text
        
        import urllib.request
        import json
        import os
        
        # 1. Local LLM Server Check
        local_running = False
        try:
            req = urllib.request.Request("http://localhost:8080/v1/models")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    local_running = True
        except Exception:
            pass
            
        if local_running:
            try:
                url = "http://localhost:8080/v1/chat/completions"
                payload = {
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.1
                }
                req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    return result["choices"][0]["message"]["content"].strip()
            except Exception as e:
                print(f"[TRANSLATE API ERROR] Local LLM translate failed: {e}")
                
        # 2. Google Gemini Fallback (Strict - No OpenRouter)
        google_key = os.environ.get("GOOGLE_API_KEY")
        if not google_key and os.path.exists(".env"):
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if line.strip() and not line.startswith("#"):
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2:
                                k, v = parts
                                if k.strip() == "GOOGLE_API_KEY":
                                    google_key = v.strip().strip('"').strip("'")
                                    os.environ["GOOGLE_API_KEY"] = google_key
            except Exception:
                pass

        if google_key and google_key != "your_google_api_key_here" and not GEMINI_DISABLED:
            try:
                from google import genai
                client = genai.Client(api_key=google_key)
                prompt = f"{system_prompt}\n\nTranslate this text:\n{user_prompt}"
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                return response.text.strip().strip('"')
            except Exception as e:
                print(f"[TRANSLATE API ERROR] Gemini translate failed: {e}. Falling back to OpenRouter...")
                err_str = str(e).lower()
                if "resource_exhausted" in err_str or "depleted" in err_str or "billing" in err_str or "429" in err_str:
                    GEMINI_DISABLED = True
                    print("[CIRCUIT BREAKER] Depleted Gemini credits detected. Disabling Gemini globally.")
                try:
                    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
                    if not openrouter_key and os.path.exists(".env"):
                        with open(".env", "r") as env_f:
                            for line in env_f:
                                if "OPENROUTER_API_KEY" in line:
                                    openrouter_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                    break
                    if openrouter_key and openrouter_key != "your_openrouter_api_key_here":
                        url = "https://openrouter.ai/api/v1/chat/completions"
                        headers = {
                            "Authorization": f"Bearer {openrouter_key}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "http://localhost:8000",
                            "X-Title": "Ventuno Q Sandbox"
                        }
                        data = {
                            "model": "google/gemma-4-31b-it",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.3
                        }
                        req = urllib.request.Request(
                            url, 
                            data=json.dumps(data).encode("utf-8"), 
                            headers=headers,
                            method="POST"
                        )
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            res_data = json.loads(resp.read().decode("utf-8"))
                            return res_data["choices"][0]["message"]["content"].strip().strip('"')
                except Exception as or_err:
                    print(f"[TRANSLATE API ERROR] OpenRouter translate failed: {or_err}. Returning original text as fallback.")
                return text
                
        # If Gemini is disabled or key not present, try OpenRouter directly
        if GEMINI_DISABLED:
            try:
                openrouter_key = os.environ.get("OPENROUTER_API_KEY")
                if not openrouter_key and os.path.exists(".env"):
                    with open(".env", "r") as env_f:
                        for line in env_f:
                            if "OPENROUTER_API_KEY" in line:
                                openrouter_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                break
                if openrouter_key and openrouter_key != "your_openrouter_api_key_here":
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {openrouter_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "Ventuno Q Sandbox"
                    }
                    data = {
                        "model": "google/gemma-4-31b-it",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3
                    }
                    req = urllib.request.Request(
                        url, 
                        data=json.dumps(data).encode("utf-8"), 
                        headers=headers,
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        res_data = json.loads(resp.read().decode("utf-8"))
                        return res_data["choices"][0]["message"]["content"].strip().strip('"')
            except Exception as or_err:
                pass
        return text

    translated_text = _do_translate()
    cache[cache_key] = translated_text
    save_translation_cache(cache)
    return translated_text

def generate_and_cache_dense_transcripts(vid_path, vid_id, locale="en_US"):
    """
    Extracts audio, uploads it to Gemini, transcribes it, translates it if locale is fr_FR,
    and inserts it into the SQLite video_transcripts table.
    """
    import os
    import sqlite3
    import time
    from google import genai
    from google.genai import types

    # 1. Determine key and client
    google_key = os.environ.get("GOOGLE_API_KEY")
    if not google_key and os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if "GOOGLE_API_KEY" in line:
                    google_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not google_key:
        print("[BG TRANSCRIPTION] No GOOGLE_API_KEY found. Skipping dense transcripts generation.")
        return

    # Extract audio path (temp_mp3)
    temp_mp3 = os.path.join("scratch", f"{vid_id}_transcript_temp.mp3")
    os.makedirs("scratch", exist_ok=True)
    
    # Extract audio from video
    import qwen_omni_client
    if not qwen_omni_client.extract_audio_from_video(vid_path, temp_mp3):
        print("[BG TRANSCRIPTION] Audio extraction failed for dense transcripts.")
        return
        
    try:
        client = genai.Client(api_key=google_key)
        print(f"[BG TRANSCRIPTION] Uploading audio file '{temp_mp3}' to Gemini...")
        uploaded_file = client.files.upload(file=temp_mp3)
        
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_file = client.files.get(name=uploaded_file.name)
            
        if uploaded_file.state.name == "FAILED":
            print("[BG TRANSCRIPTION] File processing failed on Gemini.")
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass
            return
            
        prompt = """
        You are an expert audio transcription engine. Transcribe the uploaded audio track file.
        Generate a sentence-by-sentence transcription with timestamps in the format MM:SS.
        Break down the audio into small, natural spoken sentences (around 5-15 words each). 
        For each sentence, provide the start timestamp.
        Return the transcription strictly as a JSON array of objects, where each object has "timestamp" (e.g. "00:05", "00:12") and "text" (the spoken words in the language of the audio).
        Do not add any markdown formatting, wrappers, or extra explanations. Respond ONLY with the JSON array.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        import json
        transcript_data = json.loads(response.text.strip())
        print(f"[BG TRANSCRIPTION] Successfully generated {len(transcript_data)} segments.")
        
        # Clean up Gemini file
        try:
            client.files.delete(name=uploaded_file.name)
        except Exception:
            pass
            
        # Clean up temp mp3
        try:
            if os.path.exists(temp_mp3):
                os.remove(temp_mp3)
        except Exception:
            pass
        
        # Cache in SQLite
        conn = sqlite3.connect(VAULT_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_transcripts (
                video_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                text TEXT NOT NULL,
                translated_text TEXT,
                PRIMARY KEY (video_id, timestamp)
            );
        """)
        
        # Clear existing
        cursor.execute("DELETE FROM video_transcripts WHERE video_id = ?", (vid_id,))
        
        # Check if the audio is already in the target locale (e.g. French video with French target)
        is_french_audio = "french" in vid_path.lower() or "economiques" in vid_path.lower() or "extraeconomiques" in vid_path.lower()
        is_french_target = locale.startswith("fr")
        
        for segment in transcript_data:
            ts = segment.get("timestamp")
            text = segment.get("text")
            if ts and text:
                translated_text = None
                if is_french_target:
                    if is_french_audio:
                        translated_text = text
                    else:
                        translated_text = translate_via_llm(text, "fr_FR")
                cursor.execute("""
                    INSERT OR REPLACE INTO video_transcripts (video_id, timestamp, text, translated_text)
                    VALUES (?, ?, ?, ?)
                """, (vid_id, ts, text, translated_text))
                
        conn.commit()
        conn.close()
        print(f"[BG TRANSCRIPTION] Cached {len(transcript_data)} transcript rows in SQLite.")
        
    except Exception as e:
        print(f"[BG TRANSCRIPTION ERROR] Failed: {e}")
        try:
            if os.path.exists(temp_mp3):
                os.remove(temp_mp3)
        except Exception:
            pass


def _graph_voice_to_wav(audio_bytes, mime_type):
    """Convert a browser clip to 16 kHz mono WAV when ffmpeg is available."""
    import subprocess
    import tempfile

    mime = (mime_type or "").lower()
    if "wav" in mime:
        return audio_bytes, "audio/wav"
    suffix = ".webm"
    if "mpeg" in mime or "mp3" in mime:
        suffix = ".mp3"
    elif "ogg" in mime:
        suffix = ".ogg"
    elif "mp4" in mime or "m4a" in mime:
        suffix = ".m4a"
    src = dst = None
    try:
        fd, src = tempfile.mkstemp(suffix=suffix)
        os.write(fd, audio_bytes)
        os.close(fd)
        dst = src + ".wav"
        proc = subprocess.run(
            ["ffmpeg", "-y", "-i", src, "-ac", "1", "-ar", "16000", "-f", "wav", dst],
            capture_output=True,
            timeout=20,
        )
        if proc.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 44:
            with open(dst, "rb") as wf:
                return wf.read(), "audio/wav"
        print(f"[GRAPH VOICE] ffmpeg convert skipped: {(proc.stderr or b'')[:200]}", flush=True)
    except FileNotFoundError:
        print("[GRAPH VOICE] ffmpeg not installed; uploading original clip.", flush=True)
    except Exception as err:
        print(f"[GRAPH VOICE] ffmpeg convert skipped: {err}", flush=True)
    finally:
        for path in (src, dst):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
    return audio_bytes, (mime_type or "audio/webm").split(";")[0].strip() or "audio/webm"


def _parse_graph_voice_payload(text):
    raw = (text or "").strip().strip("`").strip()
    if raw.lower().startswith("json"):
        raw = raw[4:].strip()
    transcript = ""
    formula = ""
    json_start = raw.find("{")
    json_end = raw.rfind("}")
    if json_start >= 0 and json_end > json_start:
        try:
            parsed = json.loads(raw[json_start:json_end + 1])
            if isinstance(parsed, dict):
                transcript = str(parsed.get("transcript") or parsed.get("text") or parsed.get("raw") or "").strip()
                formula = str(parsed.get("formula") or "").strip()
        except Exception:
            parsed = None
    if not transcript:
        transcript = raw
        if transcript.lower() in ("empty", "{}", "null"):
            transcript = ""
    if "\n" in transcript:
        transcript = " ".join(line.strip() for line in transcript.splitlines() if line.strip())
    return transcript.strip().strip('"').strip("'"), formula.strip().strip('"').strip("'")


def transcribe_spoken_math_formula(audio_bytes, mime_type="audio/webm", locale="en-US"):
    """Transcribe a short microphone clip. Never invent a default formula like 3x+5."""
    load_env()
    api_key = (os.environ.get("GOOGLE_API_KEY") or "").strip()
    if not api_key:
        return {"success": False, "error": "GOOGLE_API_KEY is not set, so spoken graph input cannot be transcribed."}
    if not audio_bytes or len(audio_bytes) < 200:
        return {"success": False, "error": "Audio clip was empty. Click the mic, speak, then click again to stop."}

    wav_bytes, wav_mime = _graph_voice_to_wav(audio_bytes, mime_type)
    prompt = (
        "Listen to this microphone recording.\n"
        f"The speaker is likely using {locale} (French or English).\n"
        "Return ONLY JSON: {\"transcript\":\"...\",\"formula\":\"...\"}\n"
        "transcript = the exact words spoken. Do not translate. Do not summarize.\n"
        "formula = a plottable expression derived ONLY from those words "
        "(e.g. 'trois x plus cinq' -> '3x + 5', 'sinus de x' -> 'sin(x)'). "
        "If the words are not a math formula, set formula to \"\".\n"
        "If the clip is silent or unintelligible, return {\"transcript\":\"\",\"formula\":\"\"}.\n"
        "NEVER invent 3x+5, x^2-4, or sin(x) unless those numbers/words were actually spoken."
    )

    model_text = ""
    try:
        from google import genai
        from google.genai import types
        import tempfile

        suffix = ".wav" if "wav" in (wav_mime or "") else ".webm"
        fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        os.write(fd, wav_bytes)
        os.close(fd)
        client = genai.Client(api_key=api_key)
        uploaded = None
        try:
            uploaded = client.files.upload(file=tmp_path)
            checks = 0
            while getattr(getattr(uploaded, "state", None), "name", "") == "PROCESSING" and checks < 40:
                time.sleep(1)
                uploaded = client.files.get(name=uploaded.name)
                checks += 1
            if getattr(getattr(uploaded, "state", None), "name", "") == "FAILED":
                return {"success": False, "error": "Could not process the microphone clip."}
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[uploaded, prompt],
                config=types.GenerateContentConfig(
                    temperature=0,
                    response_mime_type="application/json",
                    max_output_tokens=256,
                ),
            )
            model_text = (getattr(response, "text", None) or "").strip()
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
            if uploaded is not None:
                try:
                    client.files.delete(name=uploaded.name)
                except Exception:
                    pass
    except Exception as genai_err:
        print(f"[GRAPH VOICE] Files API transcription failed: {genai_err}", flush=True)
        try:
            import requests
            mime = (wav_mime or "audio/webm").split(";")[0].strip() or "audio/webm"
            audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "generationConfig": {"temperature": 0, "maxOutputTokens": 256, "responseMimeType": "application/json"},
                "contents": [{"parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": mime, "data": audio_b64}},
                ]}],
            }
            resp = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=45)
            if resp.status_code != 200:
                return {"success": False, "error": f"Transcription failed ({resp.status_code})."}
            model_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as rest_err:
            print(f"[GRAPH VOICE] REST transcription failed: {rest_err}", flush=True)
            return {"success": False, "error": "Could not transcribe the microphone clip."}

    transcript, formula = _parse_graph_voice_payload(model_text)
    if not transcript:
        return {"success": False, "error": "Nothing was heard. Click the voice button, speak, then click again to stop."}
    print(f"[GRAPH VOICE] heard={transcript!r} formula={formula!r}", flush=True)
    return {"success": True, "raw": transcript, "transcript": transcript, "formula": formula}


# ---------------------------------------------------------
# 1. HTTP Server for Serving index.html Dashboard
# ---------------------------------------------------------
def _serve_classroom_api(handler, method):
    """Classroom tab API. Our Space routes stay in do_GET / do_POST."""
    clean_path = handler.path.split("?")[0]
    if not clean_path.startswith("/api/gandal_classroom/"):
        return False
    raw = b""
    if method == "POST":
        length = int(handler.headers.get("Content-Length", 0) or 0)
        if length:
            raw = handler.rfile.read(length)
    from gandal_classroom.api import handle_http
    status, payload = handle_http(method, clean_path, raw)
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
    handler.wfile.flush()
    return True


def _serve_code_api(handler, method):
    """Code tab review API. Our Space and Classroom routes stay unchanged."""
    clean_path = handler.path.split("?")[0]
    if not clean_path.startswith("/api/gandal_code/"):
        return False
    raw = b""
    if method == "POST":
        length = int(handler.headers.get("Content-Length", 0) or 0)
        if length:
            raw = handler.rfile.read(length)
    from gandal_code.review import handle_http
    status, payload = handle_http(method, clean_path, raw)
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
    handler.wfile.flush()
    return True


class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Suppress request logs to keep orchestrator console outputs clean
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        # Allow the STEM Graphs iframe (same origin) to use the microphone.
        self.send_header("Permissions-Policy", "microphone=(self), camera=(self)")
        path = (getattr(self, "path", "") or "").split("?", 1)[0].lower()
        if path.endswith(".wasm"):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        if (path.startswith("/gandal_space/") or path.startswith("/gandal_classroom/") or path.startswith("/gandal_code/")) and (path.endswith(".js") or path.endswith(".css")):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def guess_type(self, path):
        lower = str(path).lower()
        if lower.endswith(".wasm"):
            return "application/wasm"
        return super().guess_type(path)

    def translate_path(self, path):
        import urllib.parse
        parsed = urllib.parse.urlparse(path).path
        if parsed.startswith("/offline_sims/"):
            rel = urllib.parse.unquote(parsed[len("/offline_sims/"):].lstrip("/"))
            target = os.path.normpath(os.path.join(PROJECT_ROOT, "antigravity_labs", "offline_sims", rel))
            labs_root = os.path.normpath(os.path.join(PROJECT_ROOT, "antigravity_labs", "offline_sims"))
            if target.startswith(labs_root):
                return target
        return super().translate_path(path)

    def do_GET(self):
        import urllib.parse
        if _serve_classroom_api(self, "GET"):
            return
        if _serve_code_api(self, "GET"):
            return
        clean_path = self.path.split('?')[0]

        if clean_path == '/api/gandal_space/status':
            try:
                from gandal_space.agent_engine import default_engine
                status_data = default_engine.get_system_status()
            except Exception as _e:
                status_data = {"error": str(_e)}
            body = json.dumps(status_data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/tracks':
            try:
                import gandal_space.k12_tracks as tracks
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                student_id = _space_student_id((qs.get("student_id") or [None])[0])
                payload = {
                    "success": True,
                    "student_id": student_id,
                    "subjects": tracks.list_subjects(),
                    "current": tracks.current_progress(student_id),
                }
            except Exception as _e:
                payload = {"success": False, "error": str(_e)}
            body = json.dumps(payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/track/current':
            try:
                import gandal_space.k12_tracks as tracks
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                student_id = _space_student_id((qs.get("student_id") or [None])[0])
                payload = {
                    "success": True,
                    "student_id": student_id,
                    "current": tracks.current_progress(student_id),
                }
            except Exception as _e:
                payload = {"success": False, "error": str(_e)}
            body = json.dumps(payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/proctor_pin_status':
            session_data = load_session_info()
            body = json.dumps({
                "success": True,
                "configured": bool(session_data.get("proctor_pin_hash")),
                "is_default": bool(session_data.get("proctor_pin_is_default", True)),
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path in ['/api/v1/health', '/api/health', '/api/v1/chemistry/health']:
            body = json.dumps({
                "status": "ok",
                "service": "Gandal Virtual Labs",
                "solvers": bool(LABS_SOLVERS_AVAILABLE),
                "chem_mix": bool(CHEM_MIX_AVAILABLE),
                "mode": DEPLOYMENT_MODE,
                "ws_clients": len(connected_clients),
                "pods": len(pod_sessions),
                "session_json_path": SESSION_JSON_PATH,
                "session_json_exists": os.path.exists(SESSION_JSON_PATH),
                "platform": sys.platform,
                "force_offline": os.environ.get("FORCE_OFFLINE", os.environ.get("OFFLINE_MODE", "0")),
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path == '/api/voice_status':
            livekit_url = prefer_ipv4_livekit_url(
                os.environ.get("LIVEKIT_URL", "ws://127.0.0.1:7880").strip() or "ws://127.0.0.1:7880"
            )
            session_data = load_session_info()
            engine = "gemini" if (
                str(os.environ.get("VOICE_ENGINE", "auto")).lower() == "gemini"
                or (
                    os.environ.get("FORCE_OFFLINE", os.environ.get("OFFLINE_MODE", "0")) not in ("1", "true", "True")
                    and bool(os.environ.get("GOOGLE_API_KEY", "").strip())
                    and session_data.get("student_online") is not False
                )
            ) else "auto"
            if os.environ.get("FORCE_OFFLINE", os.environ.get("OFFLINE_MODE", "0")) in ("1", "true", "True"):
                engine = "gemma"
            elif str(os.environ.get("VOICE_ENGINE", "")).lower() == "gemma":
                engine = "gemma"
            elif bool(os.environ.get("GOOGLE_API_KEY", "").strip()) and (
                session_data.get("student_online") in (True, 1, "1", "true")
                or str(os.environ.get("VOICE_ENGINE", "auto")).lower() == "gemini"
            ):
                engine = "gemini"
            reachable, lk_host, lk_port, lk_err = probe_livekit_tcp(livekit_url)
            has_google = bool(os.environ.get("GOOGLE_API_KEY", "").strip())
            ffmpeg_path = find_ffmpeg()
            worker = worker_heartbeat_status()
            hints = []
            if not reachable:
                hints.append(
                    "No LiveKit server on %s:%s (%s). On Linux start one with "
                    "bash livekit_stack/run_livekit_server.sh, or set LIVEKIT_URL to your LiveKit Cloud wss:// URL."
                    % (lk_host, lk_port, lk_err or "connection refused")
                )
            if not has_google and engine != "gemma":
                hints.append("GOOGLE_API_KEY is unset in .env — Gemini Live cannot speak.")
            if not ffmpeg_path:
                hints.append(
                    "ffmpeg was not found (conda PATH often hides /usr/bin). "
                    "sudo apt install ffmpeg, then restart display_client.py AND the worker in the same conda env."
                )
            if not worker.get("running"):
                hints.append(
                    worker.get("detail")
                    or "Gandho worker is not running. In conda base: python3 livekit_stack/agent/run_agent.py --online start  (never sudo)."
                )
            hints.append(
                "Firefox is supported. Open http://127.0.0.1:8000/ (not a LAN hostname) so the mic and autoplay work. Click the mic once — Firefox will not play tutor audio without that gesture (Chrome often autoplays after getUserMedia)."
            )
            hints.append("After apt install ffmpeg, restart both terminals or conda will still report ffmpeg: false.")
            body = json.dumps({
                "success": True,
                "livekit_url": livekit_url,
                "livekit_host": livekit_http_origin(livekit_url),
                "livekit_reachable": reachable,
                "livekit_tcp": {"host": lk_host, "port": lk_port, "error": lk_err},
                "ffmpeg": bool(ffmpeg_path),
                "ffmpeg_path": ffmpeg_path or "",
                "worker_running": bool(worker.get("running")),
                "worker_heartbeat_age_s": worker.get("age_s"),
                "worker_detail": worker.get("detail"),
                "has_google_api_key": has_google,
                "has_livekit_api_key": bool(os.environ.get("LIVEKIT_API_KEY", "").strip()) and os.environ.get("LIVEKIT_API_KEY") != "devkey",
                "gemini_live_model": gemini_live_model_for_client(),
                "agent_name": livekit_agent_name(),
                "student_online": session_data.get("student_online"),
                "active_livekit_room": session_data.get("active_livekit_room"),
                "voice_engine": engine,
                "force_offline": os.environ.get("FORCE_OFFLINE", os.environ.get("OFFLINE_MODE", "0")),
                "platform": sys.platform,
                "secure_origin_hint": "http://127.0.0.1:8000/",
                "hint": " ".join(hints),
                "hints": hints,
            }).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path == '/api/get_network_logs':
            body = json.dumps({
                "success": True,
                "logs": NETWORK_EVENT_LOG[-50:],
                "ws_clients": len(connected_clients),
                "pods": [
                    {"pod_id": pid, "members": list(pdata.get("members", [])), "sockets": len(pdata.get("sockets", set()))}
                    for pid, pdata in pod_sessions.items()
                ],
                "active_mic_speaker": active_mic_speaker,
                "mode": DEPLOYMENT_MODE,
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path in ['/api/saved_notebooks', '/api/handwriting_vault']:
            notebooks = []
            vault_dir = os.path.join(PROJECT_ROOT, "saved_notebooks")
            if os.path.isdir(vault_dir):
                for name in sorted(os.listdir(vault_dir)):
                    if name.lower().endswith('.pdf'):
                        fpath = os.path.join(vault_dir, name)
                        notebooks.append({
                            "filename": name,
                            "url": "/saved_notebooks/" + urllib.parse.quote(name),
                            "bytes": os.path.getsize(fpath),
                        })
            archives = []
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='handwriting_archive'")
                if cur.fetchone():
                    cur.execute("PRAGMA table_info(handwriting_archive)")
                    cols = [r[1] for r in cur.fetchall()]
                    cur.execute("SELECT * FROM handwriting_archive ORDER BY rowid DESC LIMIT 40")
                    for row in cur.fetchall():
                        archives.append({k: row[k] for k in row.keys()})
                conn.close()
            except Exception as e:
                archives = [{"error": str(e)}]
            body = json.dumps({"success": True, "notebooks": notebooks, "archives": archives}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path == '/api/v1/badges/list':
            try:
                badges = _list_student_badges()
                res_bytes = json.dumps({"success": True, "badges": badges}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # Alias /offline_sims/* -> antigravity_labs/offline_sims/*
        if clean_path.startswith('/offline_sims/'):
            rel = clean_path[len('/offline_sims/'):]
            target = os.path.join(PROJECT_ROOT, 'antigravity_labs', 'offline_sims', rel)
            if os.path.isfile(target):
                self.path = '/antigravity_labs/offline_sims/' + rel
                return super().do_GET()
            self.send_error(404, 'Offline simulation not found')
            return

        # Virtual Labs: PubChem / ChEMBL Search API
        if clean_path == '/api/v1/chemistry/database/search':
            query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            q = query_params.get('q', [''])[0]
            try:
                if LABS_SOLVERS_AVAILABLE:
                    data = science_solvers.search_chemical_database(q)
                    res_bytes = json.dumps(data).encode('utf-8')
                else:
                    res_bytes = json.dumps({"success": False, "error": "Solvers not loaded"}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # Circuits Lab: Curriculum Catalog API
        if clean_path == '/api/circuits/curriculum':
            try:
                curriculum_file = os.path.join(PROJECT_ROOT, "antigravity_labs", "circuits_lab", "data", "curriculum.json")
                if os.path.exists(curriculum_file):
                    with open(curriculum_file, "r", encoding="utf-8") as cf:
                        probs = json.load(cf)
                    res_bytes = json.dumps({"success": True, "problems": probs}).encode('utf-8')
                else:
                    res_bytes = json.dumps({"success": True, "problems": []}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        if clean_path in ['/api/get_feedback', '/get_feedback']:
            try:
                db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vault.db"))
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS admin_feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_name TEXT,
                        contact_email TEXT,
                        category TEXT,
                        message TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cursor.execute("SELECT * FROM admin_feedback ORDER BY id DESC")
                rows = cursor.fetchall()
                feedback_list = [dict(row) for row in rows]
                conn.close()

                res_body = json.dumps({"success": True, "feedback": feedback_list}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_body)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as fe:
                err_body = json.dumps({"success": False, "error": str(fe)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_body)))
                self.end_headers()
                self.wfile.write(err_body)
                return
        if clean_path in ['/get_active_session', '/api/get_active_session']:
            session_data = load_session_info()
            res_bytes = json.dumps(session_data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(res_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(res_bytes)
            return

        if clean_path in ['/get_lesson_summary', '/api/get_lesson_summary']:
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            loc = params.get('locale', ['en_US'])[0]
            payload = {}
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("""
                    SELECT title, subtitle, overview, formulas_json, concepts_json, takeaways_json
                    FROM lesson_summaries WHERE video_id = ? AND locale = ?
                """, (video_id, loc))
                row = cur.fetchone()
                if not row:
                    cur.execute("""
                        SELECT title, subtitle, overview, formulas_json, concepts_json, takeaways_json
                        FROM lesson_summaries WHERE video_id = ? LIMIT 1
                    """, (video_id,))
                    row = cur.fetchone()
                conn.close()
                if row:
                    payload = {
                        "title": row[0],
                        "subtitle": row[1],
                        "overview": row[2],
                        "formulas": json.loads(row[3] or "[]"),
                        "concepts": json.loads(row[4] or "[]"),
                        "takeaways": json.loads(row[5] or "[]"),
                    }
            except Exception as e:
                print(f"[SUMMARY API] {e}")
            res_bytes = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(res_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(res_bytes)
            return

        if clean_path == '/api/get_classes':
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS classroom_sessions (
                        class_code TEXT PRIMARY KEY,
                        class_name TEXT,
                        video_id TEXT,
                        schedule_time TEXT,
                        created_by TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cur.execute("SELECT * FROM classroom_sessions ORDER BY created_at DESC")
                rows = cur.fetchall()
                classes_list = [dict(r) for r in rows]
                conn.close()
                res_body = json.dumps({"success": True, "classes": classes_list}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if clean_path == '/api/get_fleet_students':
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT user_id, background_context FROM user_profiles")
                user_rows = cur.fetchall()
                fleet = []
                for u in user_rows:
                    user_id = u["user_id"]
                    bg = u["background_context"] or "College"
                    is_classroom = ":" in user_id or "STU-" in user_id or "PHYS-" in user_id or "CALC-" in user_id
                    fleet.append({
                        "student_id": user_id,
                        "track": bg,
                        "deployment_type": "Classroom Fleet" if is_classroom else "Device Owner / Renter",
                        "status": "Active"
                    })
                conn.close()
                res_body = json.dumps({"success": True, "fleet": fleet}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_body)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_body)
                return
        if clean_path == '/api/get_deployment_mode':
            try:
                pods_summary = []
                for pid, pdata in pod_sessions.items():
                    pods_summary.append({
                        "pod_id": pid,
                        "members": list(pdata.get("members", [])),
                        "video_id": pdata.get("video_id", ""),
                        "playback_state": pdata.get("playback_state", "paused"),
                        "current_time": pdata.get("current_time", 0.0),
                        "socket_count": len(pdata.get("sockets", set()))
                    })
                res_body = json.dumps({
                    "success": True,
                    "mode": DEPLOYMENT_MODE,
                    "active_pods": pods_summary,
                    "active_mic_speaker": active_mic_speaker
                }).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if clean_path == '/api/get_active_pods':
            try:
                pods_summary = []
                for pid, pdata in pod_sessions.items():
                    pods_summary.append({
                        "pod_id": pid,
                        "members": list(pdata.get("members", [])),
                        "video_id": pdata.get("video_id", ""),
                        "playback_state": pdata.get("playback_state", "paused"),
                        "current_time": pdata.get("current_time", 0.0),
                        "socket_count": len(pdata.get("sockets", set()))
                    })
                res_body = json.dumps({"success": True, "pods": pods_summary}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if clean_path in ['/api/curriculum', '/api/get_curriculum_catalog', '/api/get_full_curriculum_tree']:
            try:
                staging_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "curriculum_staging")
                tree = {}
                
                def clean_media_list(dp):
                    try:
                        all_f = os.listdir(dp)
                    except Exception:
                        return ["01_Lesson.mp4"]
                    v_exts = ('.mp4', '.mkv', '.webm', '.avi', '.mov')
                    v_files = [f for f in all_f if f.lower().endswith(v_exts)]
                    if v_files:
                        seen_b = set()
                        res = []
                        for vf in sorted(v_files):
                            b = os.path.splitext(vf)[0]
                            if b not in seen_b:
                                seen_b.add(b)
                                res.append(vf)
                        return res
                    a_files = [f for f in all_f if f.lower().endswith(('.mp3', '.wav', '.m4a', '.aac'))]
                    if a_files:
                        seen_b = set()
                        res = []
                        for af in sorted(a_files):
                            b = os.path.splitext(af)[0]
                            if b not in seen_b:
                                seen_b.add(b)
                                res.append(af)
                        return res
                    other_f = [f for f in all_f if not f.startswith('.')]
                    return sorted(other_f) if other_f else ["01_Lesson.mp4"]

                if os.path.exists(staging_dir):
                    for level in os.listdir(staging_dir):
                        level_path = os.path.join(staging_dir, level)
                        if os.path.isdir(level_path) and level != "uploads":
                            tree[level] = {}
                            for grade in os.listdir(level_path):
                                grade_path = os.path.join(level_path, grade)
                                if os.path.isdir(grade_path):
                                    tree[level][grade] = {}
                                    for subj in os.listdir(grade_path):
                                        subj_path = os.path.join(grade_path, subj)
                                        if os.path.isdir(subj_path):
                                            tree[level][grade][subj] = {}
                                            sub_items = os.listdir(subj_path)
                                            sub_dirs = [d for d in sub_items if os.path.isdir(os.path.join(subj_path, d))]
                                            if sub_dirs:
                                                for chapter in sub_dirs:
                                                    chap_path = os.path.join(subj_path, chapter)
                                                    tree[level][grade][subj][chapter] = clean_media_list(chap_path)
                                            else:
                                                tree[level][grade][subj]["Main Chapter"] = clean_media_list(subj_path)
                                                
                res_body = json.dumps({"success": True, "tree": tree, "deployment_mode": DEPLOYMENT_MODE}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if DEPLOYMENT_MODE in ["CLASSROOM", "LAB"] and clean_path in ['', '/', '/index.html', '/index', '/student']:
            student_template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates', 'student.html')
            if os.path.exists(student_template_path):
                with open(student_template_path, 'r', encoding='utf-8') as sf:
                    content = sf.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Content-Length', str(len(content.encode('utf-8'))))
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
        
        # Onboarding redirect: if database user profiles table is empty, redirect index page requests to onboarding
        if clean_path in ['', '/', '/index.html', '/index']:
            db_path = VAULT_DB_PATH
            is_empty = True
            active_track = "College"
            raw_track = "College"
            student_name = "Allison"
            active_locale = "en_US"
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT COUNT(*) FROM user_profiles")
                    count = cursor.fetchone()[0]
                    if count > 0:
                        is_empty = False
                        # Fetch the active track from SQLite
                        cursor.execute("SELECT user_id, background_context FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                        user = cursor.fetchone()
                        if user:
                            student_name = user[0]
                            raw_track = user[1]
                            if "|" in raw_track:
                                active_track = raw_track.split("|")[1]
                            else:
                                active_track = raw_track
                            cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (student_name,))
                            loc_row = cursor.fetchone()
                            if loc_row:
                                active_locale = loc_row[0]
                    conn.close()
                except Exception:
                    pass
            if is_empty:
                self.send_response(307)
                self.send_header('Location', '/onboarding.html')
                self.end_headers()
                return

            # Hydrate index.html dynamically on boot
            index_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
            if os.path.exists(index_file_path):
                with open(index_file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Resolve active video ID cleanly from track and SQLite database
                v_id = None
                if os.path.exists(SESSION_JSON_PATH):
                    try:
                        with open(SESSION_JSON_PATH, "r") as sf:
                            sdata = json.load(sf)
                            v_id = sdata.get("active_video_id")
                    except Exception:
                        pass

                if not v_id or v_id in ["vid_economics_01", "vid_physics_01", "vid_chemistry_organic_chemistry"]:
                    if active_track in ["k12/12th_SM/Economics", "k12/TSM/Economics", "calculus", "12th Grade"]:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
                    elif active_track in ["k12/12th_SM/chemistry", "k12/TSM/chemistry", "Chemistry"]:
                        v_id = "vid_chemistry_organic_chemistry_chemistry"
                    elif active_track and active_track.startswith("vid_"):
                        v_id = active_track
                    else:
                        v_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"

                instructor_name = "GANDHO"
                instructor_locale = "en_US"
                if os.path.exists(db_path):
                    try:
                        conn = sqlite3.connect(db_path)
                        cursor = conn.cursor()
                        cursor.execute("""
                            SELECT i.full_name, i.locale 
                            FROM lesson_metadata lm
                            JOIN instructors i ON lm.instructor_id = i.instructor_id
                            WHERE lm.video_id = ?
                        """, (v_id,))
                        row = cursor.fetchone()
                        if row:
                            instructor_name = row[0]
                            instructor_locale = row[1]
                        conn.close()
                    except Exception as e:
                        print(f"[ERROR] Resolving active instructor/locale dynamically failed: {e}")

                # Dynamic relational binding injection
                interests_str = raw_track.split("|")[0] if "|" in raw_track else raw_track
                data_injection = f"<script>window.ACTIVE_DATABASE_TRACK = {json.dumps(active_track)}; window.ACTIVE_DATABASE_INTERESTS = {json.dumps(interests_str)}; window.ACTIVE_DATABASE_USER = {json.dumps(student_name)}; window.ACTIVE_DATABASE_INSTRUCTOR = {json.dumps(instructor_name)}; window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE = {json.dumps(instructor_locale)}; window.ACTIVE_DATABASE_LOCALE = {json.dumps(active_locale)}; window.ACTIVE_DATABASE_VIDEO_ID = {json.dumps(v_id)};</script>"
                html_content = html_content.replace("</head>", f"{data_injection}\n</head>")
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            else:
                self.send_error(404, "index.html template not found")
                return

        # Route for Onboarding page
        if clean_path in ['/onboarding', '/onboarding.html']:
            onboarding_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'onboarding.html')
            if os.path.exists(onboarding_file_path):
                with open(onboarding_file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            else:
                self.send_error(404, "onboarding.html template not found")
                return

        # Route for Parent Progress Report
        if clean_path in ['/report', '/report.html']:
            db_path = VAULT_DB_PATH
            mastery_data = []
            evaluation_data = []
            student_name = "Student"
            student_track = "College"
            
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    
                    # Fetch student info (last user)
                    cursor.execute("SELECT user_id, background_context FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                    user = cursor.fetchone()
                    if user:
                        student_name = user[0]
                        student_track = user[1]
                        if student_track and "|" in student_track:
                            student_track = student_track.split("|")[1]
                    # Fetch mastery ledger
                    cursor.execute("SELECT video_id, chapter_id, mastery_achieved FROM mastery_ledger")
                    for row in cursor.fetchall():
                        mastery_data.append({
                            "video_id": row[0],
                            "chapter_id": row[1],
                            "mastery_achieved": bool(row[2])
                        })
                        
                    # Fetch evaluation ledger
                    cursor.execute("SELECT video_id, chapter_id, quiz_type, raw_score, passed FROM evaluation_ledger")
                    for row in cursor.fetchall():
                        evaluation_data.append({
                            "video_id": row[0],
                            "chapter_id": row[1],
                            "quiz_type": row[2],
                            "raw_score": float(row[3]),
                            "passed": bool(row[4])
                        })
                        
                    conn.close()
                except Exception as e:
                    print(f"[REPORT ROUTE ERROR] SQLite query failed: {e}")
            
            report_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'report.html')
            if os.path.exists(report_file_path):
                with open(report_file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                notebooks = list_saved_notebooks()
                patch = load_session_info()
                hydrated_data = {
                    "student_name": student_name,
                    "student_track": student_track,
                    "mastery": mastery_data,
                    "evaluations": evaluation_data,
                    "notebooks": notebooks,
                    "patch_version": patch.get("patch_version") or "0",
                }
                data_injection = f"<script>window.PARENT_REPORT_DATA = {json.dumps(hydrated_data)};</script>"
                html_content = html_content.replace("</head>", f"{data_injection}\n</head>")
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            else:
                self.send_error(404, "Report template report.html not found")
                return

        # API route to fetch SQLite database statistics
        if clean_path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            db_path = VAULT_DB_PATH
            stats = {
                "users": [],
                "mastery": [],
                "evaluations": []
            }
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("PRAGMA table_info(user_profiles)")
                    cols = [c[1] for c in cursor.fetchall()]
                    if "profile_image" not in cols:
                        cursor.execute("ALTER TABLE user_profiles ADD COLUMN profile_image TEXT")

                    cursor.execute("""
                        SELECT u.user_id, u.background_context, l.locale, u.profile_image 
                        FROM user_profiles u 
                        LEFT JOIN language_localization l ON u.user_id = l.user_id
                        ORDER BY u.ROWID ASC
                    """)
                    for row in cursor.fetchall():
                        stats["users"].append({
                            "user_id": row[0],
                            "background_context": row[1],
                            "locale": row[2] or "en_US",
                            "profile_image": row[3] or ""
                        })
                    stats["progress"] = []
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS student_progress_video (
                            student_id TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            last_position REAL NOT NULL,
                            max_position REAL NOT NULL,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (student_id, video_id)
                        );
                    """)
                    cursor.execute("SELECT student_id, video_id, last_position, max_position FROM student_progress_video")
                    for row in cursor.fetchall():
                        stats["progress"].append({
                            "student_id": row[0],
                            "video_id": row[1],
                            "last_position": float(row[2]),
                            "max_position": float(row[3])
                        })

                    cursor.execute("SELECT video_id, chapter_id, score, mastery_achieved FROM mastery_ledger")
                    for row in cursor.fetchall():
                        stats["mastery"].append({
                            "video_id": row[0],
                            "chapter_id": row[1],
                            "score": float(row[2]) if row[2] is not None else 0.0,
                            "mastery_achieved": bool(row[3])
                        })
                    cursor.execute("SELECT video_id, chapter_id, quiz_type, raw_score, passed FROM evaluation_ledger")
                    for row in cursor.fetchall():
                        stats["evaluations"].append({
                            "video_id": row[0],
                            "chapter_id": row[1],
                            "quiz_type": row[2],
                            "raw_score": float(row[3]),
                            "passed": bool(row[4])
                        })
                    stats["curriculum"] = []
                    try:
                        cursor.execute("SELECT video_id, chapter_id, unlocked FROM curriculum_tree")
                        for row in cursor.fetchall():
                            stats["curriculum"].append({
                                "video_id": row[0],
                                "chapter_id": row[1],
                                "unlocked": bool(row[2]),
                            })
                    except Exception:
                        stats["curriculum"] = []
                    
                    stats["handwriting_archives"] = []
                    # Ensure table exists
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS handwriting_archive (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            subject TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            chapter_id TEXT NOT NULL,
                            image_path TEXT NOT NULL,
                            extracted_text TEXT,
                            score REAL,
                            passed BOOLEAN,
                            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    # Seed if empty to prevent missing archives in case of pre-existing database
                    cursor.execute("SELECT COUNT(*) FROM handwriting_archive")
                    if cursor.fetchone()[0] == 0:
                        mock_archives = [
                            ("Physics", "vid_physics_01", "physics_pendulums", "pendulum_work_pass.png", "Period of a pendulum: T = 2 * pi * sqrt(L / g)", 100.0, 1),
                            ("Physics", "vid_physics_02", "physics_pendulums", "pendulum_work_fail.png", "Period of a pendulum: T = 2 * pi * sqrt(g / L)", 66.6, 0)
                        ]
                        cursor.executemany("""
                            INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
                            VALUES (?, ?, ?, ?, ?, ?, ?);
                        """, mock_archives)
                        conn.commit()
                    cursor.execute("SELECT id, subject, video_id, chapter_id, image_path, extracted_text, score, passed, submitted_at FROM handwriting_archive ORDER BY id DESC")
                    for row in cursor.fetchall():
                        stats["handwriting_archives"].append({
                            "id": row[0],
                            "subject": row[1],
                            "video_id": row[2],
                            "chapter_id": row[3],
                            "image_path": row[4],
                            "extracted_text": row[5],
                            "score": float(row[6]) if row[6] is not None else 0.0,
                            "passed": bool(row[7]),
                            "submitted_at": row[8]
                        })
                    conn.close()
                except Exception as e:
                    stats["error"] = str(e)
            else:
                stats["error"] = "Database file vault.db not found"
                
            self.wfile.write(json.dumps(stats).encode('utf-8'))
            return

        # API route to translate text via local Gemma 4 e4b
        if clean_path == '/api/translate':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            text = query_params.get('text', [''])[0]
            target_locale = query_params.get('locale', ['en_US'])[0]
            
            # Simple pre-seeded translations dictionary for high fidelity simulation
            # translations dict moved to global scope

            
            translated_text = text
            is_matched = False
            if target_locale in translations:
                if text in translations[target_locale]:
                    translated_text = translations[target_locale][text]
                    is_matched = True
                elif text.startswith("Nice to meet you, "):
                    name = text[len("Nice to meet you, "):]
                    if name.endswith('.'):
                        name = name[:-1]
                    prefix_key = "Nice to meet you, "
                    if prefix_key in translations[target_locale]:
                        translated_text = f"{translations[target_locale][prefix_key]}{name}."
                        is_matched = True

            if not is_matched and text:
                # Query LLM to translate dynamically (works for any language combination!)
                translated_text = translate_via_llm(text, target_locale)
            
            print(f"[GEMMA 4 E4B] Local translation to [{target_locale}] completed.")
            print(f"[GEMMA 4 E4B] Source text: \"{text}\"")
            print(f"[GEMMA 4 E4B] Result text: \"{translated_text}\"")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"translated_text": translated_text}).encode('utf-8'))
            return

        # API route to synthesize text via NVIDIA Riva / Magpie-TTS
        if clean_path == '/api/tts':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            text = query_params.get('text', [''])[0]
            locale = query_params.get('locale', ['en_US'])[0]

            # TTS_BACKEND env var: "riva" (default on Jetson) or "mock" (simulation)
            tts_backend = os.environ.get("TTS_BACKEND", "mock").lower()
            # Optional legacy NVIDIA Riva on a non-Ventuno host. Production TTS is Kokoro via LiveKit.
            riva_server = os.environ.get("RIVA_SERVER_ADDRESS", "localhost:50051")

            wav_data = None

            if tts_backend == "riva":
                print(f"[RIVA MAGPIE-TTS] Requesting synthesis [{locale}]: \"{text}\" → {riva_server}")
                try:
                    import grpc
                    import riva.client.proto.riva_tts_pb2 as rtts
                    import riva.client.proto.riva_tts_pb2_grpc as rtts_grpc

                    # Magpie-TTS voice model names shipped with NVIDIA Riva 2.x
                    # Format: <lang-code>_<speaker>_<style>  (adjust to deployed model)
                    MAGPIE_VOICE_MAP = {
                        "en_us": "English-US.Female-1",
                        "en_US": "English-US.Female-1",
                        "fr_fr": "French-France.Female-1",
                        "fr_FR": "French-France.Female-1",
                        "es_es": "Spanish-Spain.Female-1",
                        "es_ES": "Spanish-Spain.Female-1",
                        "zh_cn": "Mandarin-China.Female-1",
                        "zh_CN": "Mandarin-China.Female-1",
                        "pt_pt": "Portuguese-Portugal.Female-1",
                        "pt_PT": "Portuguese-Portugal.Female-1",
                        "ar_ae": "Arabic-UAE.Female-1",
                        "ar_AE": "Arabic-UAE.Female-1",
                    }
                    # IANA language codes used by Riva
                    RIVA_LANG_MAP = {
                        "en_us": "en-US", "en_US": "en-US",
                        "fr_fr": "fr-FR", "fr_FR": "fr-FR",
                        "es_es": "es-ES", "es_ES": "es-ES",
                        "zh_cn": "zh-CN", "zh_CN": "zh-CN",
                        "pt_pt": "pt-PT", "pt_PT": "pt-PT",
                        "ar_ae": "ar-AE", "ar_AE": "ar-AE",
                    }
                    riva_lang  = RIVA_LANG_MAP.get(locale, "en-US")
                    voice_name = MAGPIE_VOICE_MAP.get(locale, "English-US.Female-1")

                    channel  = grpc.insecure_channel(riva_server)
                    riva_tts = rtts_grpc.RivaSpeechSynthesisStub(channel)

                    request = rtts.SynthesizeSpeechRequest()
                    request.text          = text
                    request.language_code = riva_lang
                    request.voice_name    = voice_name
                    request.encoding      = rtts.AudioEncoding.LINEAR_PCM
                    request.sample_rate_hz = 22050  # Magpie-TTS native output rate

                    response = riva_tts.Synthesize(request)
                    pcm_data = response.audio
                    wav_data = pcm_to_wav(pcm_data, sample_rate=22050)
                    print(
                        f"[RIVA MAGPIE-TTS] Synthesis OK — voice: {voice_name} | "
                        f"{len(wav_data)} bytes WAV @ 22050 Hz."
                    )
                except ImportError:
                    print(
                        "[RIVA MAGPIE-TTS ERROR] Python client not installed. "
                        "Install with: pip install nvidia-riva-client"
                    )
                    print("[RIVA MAGPIE-TTS] Will try Kokoro, then fail honestly if none is available.")
                except Exception as e:
                    print(f"[RIVA MAGPIE-TTS ERROR] gRPC synthesis failed: {e}. Trying Kokoro next.")

            if wav_data is None:
                # LOCAL-FIRST fallbacks: Kokoro on :8880, then Google only if explicitly online
                try:
                    kokoro_audio = query_local_kokoro_tts(text)
                    if kokoro_audio:
                        print("[TTS] Kokoro local synthesis OK")
                        self.send_response(200)
                        self.send_header('Content-Type', 'audio/mpeg')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-Length', str(len(kokoro_audio)))
                        self.end_headers()
                        self.wfile.write(kokoro_audio)
                        return
                except Exception as kokoro_err:
                    print(f"[TTS] Kokoro fallback error: {kokoro_err}")

                if os.environ.get("OFFLINE_MODE", "1") != "1":
                    try:
                        import urllib.parse
                        import urllib.request
                        encoded_text = urllib.parse.quote(text)
                        lang_code = locale.split('_')[0]
                        google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q={encoded_text}&tl={lang_code}"
                        print(f"[TTS ONLINE FALLBACK] Google TTS: {google_tts_url}")
                        req = urllib.request.Request(
                            google_tts_url,
                            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                        )
                        with urllib.request.urlopen(req, timeout=20) as response:
                            audio_bytes = response.read()
                        self.send_response(200)
                        self.send_header('Content-Type', 'audio/mpeg')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-Length', str(len(audio_bytes)))
                        self.end_headers()
                        self.wfile.write(audio_bytes)
                        return
                    except Exception as fallback_err:
                        print(f"[TTS ONLINE FALLBACK ERROR] {fallback_err}")
                if os.environ.get("TTS_BACKEND", "").strip().lower() == "silent":
                    print("[TTS] TTS_BACKEND=silent: returning empty WAV (explicit test mode only).")
                    wav_data = make_mock_wav()
                else:
                    err = {
                        "success": False,
                        "error": (
                            "No TTS backend is available. Kokoro is not reachable, Riva is not configured, "
                            "and silent mock WAV is disabled. Start Kokoro on :8880 or set TTS_BACKEND=silent "
                            "only for tests."
                        ),
                        "tts_backend": tts_backend,
                    }
                    err_bytes = json.dumps(err).encode("utf-8")
                    print(f"[TTS] {err['error']}")
                    self.send_response(503)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(err_bytes)))
                    self.end_headers()
                    self.wfile.write(err_bytes)
                    return

            self.send_response(200)
            self.send_header('Content-Type', 'audio/wav')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(wav_data)))
            self.end_headers()
            self.wfile.write(wav_data)
            return

        # API route to fetch all instructors
        if clean_path == '/api/instructors':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            db_path = VAULT_DB_PATH
            instructors = []
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT i.instructor_id, i.full_name, i.phone_number, i.experience_years, i.subjects_list, i.profile_image, i.biography, i.locale, 
                               (SELECT video_id FROM lesson_metadata WHERE instructor_id = i.instructor_id LIMIT 1) AS video_id 
                        FROM instructors i
                    """)
                    for row in cursor.fetchall():
                        instructors.append({
                            "instructor_id": row[0],
                            "full_name": row[1],
                            "phone_number": row[2],
                            "experience_years": row[3],
                            "subjects_list": row[4],
                            "profile_image": row[5],
                            "biography": row[6],
                            "locale": row[7],
                            "video_id": row[8]
                        })
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database instructors lookup failed: {e}")
            
            self.wfile.write(json.dumps({"instructors": instructors}).encode('utf-8'))
            return

        if clean_path == '/api/lessons':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            db_path = VAULT_DB_PATH
            lessons = []
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT lm.video_id, lm.chapter_id, lm.pdf_file_path, ct.title
                        FROM lesson_metadata lm
                        LEFT JOIN curriculum_tree ct ON lm.video_id = ct.video_id AND lm.chapter_id = ct.chapter_id
                    """)
                    for row in cursor.fetchall():
                        pdf_path = row[2]
                        formatted_path = (pdf_path if (pdf_path.startswith('/saved_notebooks/') or pdf_path.startswith('/curriculum_staging/')) else '/curriculum_staging/' + pdf_path.lstrip('/')) if pdf_path else ""
                        lessons.append({
                            "video_id": row[0],
                            "chapter_id": row[1],
                            "pdf_file_path": formatted_path,
                            "title": row[3] or row[1].replace('_', ' ').replace('-', ' ').title()
                        })
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database lesson lookup failed: {e}")
            
            self.wfile.write(json.dumps({"lessons": lessons}).encode('utf-8'))
            return

        # API route to fetch the dynamic directory structure of curriculum_staging
        if clean_path == '/api/curriculum_structure':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            structure = {}
            staging_dir = "curriculum_staging"
            if os.path.exists(staging_dir):
                try:
                    # Scan root levels (k12, college_level, etc.)
                    for level in os.listdir(staging_dir):
                        level_path = os.path.join(staging_dir, level)
                        if os.path.isdir(level_path):
                            structure[level] = {}
                            # Scan grades/fields (12th_SM, mathematics, etc.)
                            for grade in os.listdir(level_path):
                                grade_path = os.path.join(level_path, grade)
                                if os.path.isdir(grade_path):
                                    structure[level][grade] = []
                                    # Scan subjects/classes (Economics, chemistry, etc.)
                                    for subject in os.listdir(grade_path):
                                        subj_path = os.path.join(grade_path, subject)
                                        if os.path.isdir(subj_path):
                                            structure[level][grade].append(subject)
                except Exception as e:
                    print(f"[ERROR] Scanning curriculum structure failed: {e}")
            
            self.wfile.write(json.dumps({"structure": structure}).encode('utf-8'))
            return

        # API route to fetch lesson PDF and Video metadata
        if clean_path == '/api/lesson':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            video_id = query_params.get('video_id', [None])[0]
            if video_id == "vid_economics_01":
                video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
            elif video_id == "vid_chemistry_organic_chemistry":
                video_id = "vid_chemistry_organic_chemistry_chemistry"
            elif not video_id or video_id == "gandal_space_active" or not video_id.startswith("vid_"):
                video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            db_path = VAULT_DB_PATH
            active_track = None
            active_locale = "en_US"
            student_name = "Abahny"
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT user_id, background_context FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                    row = cursor.fetchone()
                    if row:
                        student_name = row[0]
                        active_track = row[1]
                        if active_track and "|" in active_track:
                            active_track = active_track.split("|")[1]
                    cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (student_name,))
                    loc_row = cursor.fetchone()
                    if loc_row:
                        active_locale = loc_row[0]
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Active session track lookup failed: {e}")

            if not video_id:
                if active_track and active_track.startswith("vid_"):
                    video_id = active_track
                elif active_track == "k12/12th_SM/chemistry":
                    video_id = "vid_chemistry_organic_chemistry_chemistry"
                else:
                    video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"


            # Enforce Daily Subject Cap (Max 3 unique subjects rolling 24-hours) with Mastery Override Gate (85%)
            allowed, reason = check_subject_gating(video_id)
            if not allowed:
                self.wfile.write(json.dumps({"blocked": True, "reason": reason}).encode('utf-8'))
                return

            # Forward activation event to orchestrator via UDP port 8002
            try:
                subject = get_subject_by_video_id(video_id)
                udp_payload = {
                    "event": "GPIO_INTERRUPT",
                    "action": "SUBJECT_ACTIVATION",
                    "pin": 24,
                    "subject": subject,
                    "video_id": video_id
                }
                import socket
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                sock.close()
                print(f"[WS -> UDP] Forwarded SUBJECT_ACTIVATION packet for {subject} to orchestrator")
            except Exception as e:
                print(f"[ERROR] Failed to send SUBJECT_ACTIVATION UDP: {e}")

            pdf_path = None
            start_page = 1
            stored_media_path = None
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT pdf_file_path, start_page FROM lesson_metadata WHERE video_id = ?", (video_id,))
                    row = cursor.fetchone()
                    if row:
                        pdf_path = row[0]
                        start_page = int(row[1] or 1)
                    try:
                        cursor.execute("SELECT media_file_path FROM lesson_metadata WHERE video_id = ?", (video_id,))
                        mrow = cursor.fetchone()
                        if mrow and mrow[0]:
                            media_candidate = mrow[0].lstrip("/")
                            abs_media = os.path.join(os.path.dirname(os.path.abspath(__file__)), media_candidate)
                            if os.path.exists(abs_media):
                                stored_media_path = media_candidate.replace("\\", "/")
                    except sqlite3.OperationalError:
                        pass
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database lesson metadata lookup failed: {e}")

            resolved_video_path = stored_media_path
            
            # Dynamic directory path resolver
            if video_id and ("/" in video_id or "\\" in video_id or os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "curriculum_staging", video_id))):
                clean_path = video_id.replace('\\', '/').strip('/')
                subject_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "curriculum_staging", clean_path)
                if os.path.exists(subject_dir):
                    found_mp4 = None
                    found_pdf = None
                    for root, dirs, files in os.walk(subject_dir):
                        mp4s = [f for f in files if f.lower().endswith('.mp4')]
                        pdfs = [f for f in files if f.lower().endswith('.pdf')]
                        if mp4s and not found_mp4:
                            rel_root = os.path.relpath(root, os.path.dirname(os.path.abspath(__file__)))
                            found_mp4 = os.path.join(rel_root, mp4s[0]).replace('\\', '/')
                        if pdfs and not found_pdf:
                            rel_root = os.path.relpath(root, os.path.dirname(os.path.abspath(__file__)))
                            found_pdf = "/" + os.path.relpath(os.path.join(root, pdfs[0]), os.path.dirname(os.path.abspath(__file__))).replace('\\', '/')
                    
                    if found_mp4:
                        resolved_video_path = found_mp4
                        pdf_path = found_pdf
                        start_page = 1
                        print(f"[DYNAMIC RESOLUTION] Successfully mapped path {video_id} to video: {resolved_video_path} and pdf: {pdf_path}")
            
            if pdf_path:
                clean_pdf_path = pdf_path.lstrip('/')
                if clean_pdf_path.startswith('saved_notebooks/'):
                    pdf_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.dirname(clean_pdf_path))
                else:
                    if not clean_pdf_path.startswith('curriculum_staging/'):
                        clean_pdf_path = 'curriculum_staging/' + clean_pdf_path
                    pdf_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.dirname(clean_pdf_path))

                if os.path.exists(pdf_dir):
                    import unicodedata
                    pdf_stem = unicodedata.normalize('NFC', os.path.splitext(os.path.basename(clean_pdf_path))[0])
                    all_dir_files = os.listdir(pdf_dir)
                    mp4_files = [f for f in all_dir_files if f.lower().endswith('.mp4')]
                    media_files = mp4_files if mp4_files else [f for f in all_dir_files if f.lower().endswith('.mp3')]
                    matched_media = None
                    if media_files:
                        for f in media_files:
                            norm_f_stem = unicodedata.normalize('NFC', os.path.splitext(f)[0])
                            if norm_f_stem.lower() == pdf_stem.lower():
                                matched_media = f
                                break
                        if not matched_media and "_" in pdf_stem:
                            prefix = pdf_stem.split("_")[0].lower()
                            for f in media_files:
                                if os.path.splitext(f)[0].lower().startswith(prefix + "_") or os.path.splitext(f)[0].lower().startswith(prefix + " "):
                                    matched_media = f
                                    break
                        if not matched_media:
                            mp4s = [f for f in media_files if f.lower().endswith('.mp4')]
                            matched_media = mp4s[0] if mp4s else media_files[0]

                        resolved_video_path = os.path.join(os.path.dirname(clean_pdf_path), matched_media).replace('\\', '/')
                        if not resolved_video_path.startswith('curriculum_staging/'):
                            resolved_video_path = 'curriculum_staging/' + resolved_video_path

            # Fallback if video path is not found in the PDF directory
            if not resolved_video_path and video_id:
                # Subject-based folder matching under curriculum_staging
                fallbacks = []
                if "physics" in video_id.lower() or "phys" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/k12/12th_SM/Physics",
                        "curriculum_staging/Physics"
                    ]
                elif "calculus" in video_id.lower() or "calc" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/k12/12th_SM/calculus",
                        "curriculum_staging/k12/12th_SM/Calculus",
                        "curriculum_staging/Calculus"
                    ]
                elif "philosophy" in video_id.lower() or "phil" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/Philosophy",
                        "static/videos"
                    ]
                elif "economics" in video_id.lower() or "econ" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/k12/12th_SM/Economics/Extraeconomiques",
                        "curriculum_staging/k12/12th_SM/Economics",
                        "curriculum_staging/Economics"
                    ]

                # Check each fallback folder for any available .mp4 file
                for folder in fallbacks:
                    abs_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), folder)
                    if os.path.exists(abs_folder):
                        mp4_files = [f for f in os.listdir(abs_folder) if f.lower().endswith('.mp4')]
                        if mp4_files:
                            resolved_video_path = f"{folder}/{mp4_files[0]}"
                            break

                # Global recursive fallback if still not resolved
                if not resolved_video_path:
                    for root, dirs, files in os.walk(os.path.join(os.path.dirname(os.path.abspath(__file__)), "curriculum_staging")):
                        mp4s = [f for f in files if f.lower().endswith('.mp4')]
                        if mp4s:
                            rel_dir = os.path.relpath(root, os.path.dirname(os.path.abspath(__file__)))
                            resolved_video_path = os.path.join(rel_dir, mp4s[0]).replace('\\', '/')
                            break

            if not resolved_video_path:
                # If a path fails to resolve, raise an explicit console print exception tracing the exact broken parameters instead of serving a silent fallback video clip.
                err_msg = f"[EXCEPTION] Video path resolution failed! Parameters: video_id={video_id}, active_track={active_track}, pdf_path={pdf_path}"
                print(err_msg)
                raise Exception(err_msg)

            instructor_name = "GANDHO"
            instructor_avatar = LOCAL_AVATAR_FALLBACK
            instructor_role = "Economics Specialist"
            if video_id:
                if "physics" in video_id.lower():
                    instructor_name = "Dr. Harris"
                    instructor_avatar = LOCAL_AVATAR_FALLBACK
                    instructor_role = "Physics Specialist"
                elif "philosophy" in video_id.lower():
                    instructor_name = "Professor Marcus"
                    instructor_avatar = LOCAL_AVATAR_FALLBACK
                    instructor_role = "Philosophy Specialist"

            chapter_title = ""
            instructor_locale = "en_US"
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT i.full_name, i.profile_image, i.subjects_list, i.experience_years, i.locale
                        FROM lesson_metadata lm
                        JOIN instructors i ON lm.instructor_id = i.instructor_id
                        WHERE lm.video_id = ?
                    """, (video_id,))
                    inst_row = cursor.fetchone()
                    if inst_row:
                        instructor_name = inst_row[0]
                        instructor_avatar = local_avatar_url(inst_row[1])
                        try:
                            subj = get_subject_by_video_id(video_id)
                        except Exception:
                            subj = None
                        if not subj:
                            subj = inst_row[2]
                        instructor_role = f"{subj} Specialist ({inst_row[3]} yrs exp)"
                        instructor_locale = inst_row[4]
                    
                    cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (video_id,))
                    t_row = cursor.fetchone()
                    if t_row:
                        chapter_title = t_row[0]
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database lesson instructor/metadata lookup failed: {e}")

            # If the video is natively French and student has not manually chosen a locale, default to French
            if instructor_locale == "fr_FR" and MANUAL_LOCALE_SELECTION is None:
                active_locale = "fr_FR"
                # Update language_localization in SQLite so all other endpoints stay in sync
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)", (student_name, "fr_FR"))
                    conn.commit()
                    conn.close()
                    print(f"[LOCALE DETECT] French video detected. Natively defaulting student locale to fr_FR.")
                except Exception as e:
                    print(f"[ERROR] Failed to auto-default locale to French: {e}")
            elif MANUAL_LOCALE_SELECTION is not None:
                active_locale = MANUAL_LOCALE_SELECTION

            # Check for cached Qwen timestamps & flashcards in database
            timestamps = []
            flashcards = []
            dense_transcripts = []
            timestamps_status = "idle"
            if os.path.exists(db_path) and video_id:
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    # Ensure tables exist
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS video_timestamps (
                            video_id TEXT NOT NULL,
                            timestamp TEXT NOT NULL,
                            title TEXT NOT NULL,
                            description TEXT NOT NULL,
                            PRIMARY KEY (video_id, timestamp)
                        );
                    """)
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS savant_matrix (
                            video_id TEXT PRIMARY KEY,
                            subject TEXT,
                            savant TEXT,
                            era_context TEXT,
                            historical_bio TEXT,
                            interdisciplinary_connections TEXT,
                            real_world_applications TEXT
                        );
                    """)
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS video_flashcards (
                            video_id TEXT NOT NULL,
                            front TEXT NOT NULL,
                            back TEXT NOT NULL,
                            hint TEXT NOT NULL,
                            PRIMARY KEY (video_id, front)
                        );
                    """)
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS video_transcripts (
                            video_id TEXT NOT NULL,
                            timestamp TEXT NOT NULL,
                            text TEXT NOT NULL,
                            translated_text TEXT,
                            PRIMARY KEY (video_id, timestamp)
                        );
                    """)
                    
                    # Fetch timestamps
                    cursor.execute("SELECT timestamp, title, description FROM video_timestamps WHERE video_id = ?", (video_id,))
                    ts_rows = cursor.fetchall()
                    if ts_rows:
                        timestamps = [{"timestamp": r[0], "title": r[1], "description": r[2]} for r in ts_rows]
                        
                    # Fetch flashcards
                    cursor.execute("SELECT front, back, hint FROM video_flashcards WHERE video_id = ?", (video_id,))
                    fc_rows = cursor.fetchall()
                    if fc_rows:
                        flashcards = [{"front": r[0], "back": r[1], "hint": r[2]} for r in fc_rows]
                        
                    # Fetch dense transcripts
                    try:
                        cursor.execute("SELECT timestamp, text, translated_text FROM video_transcripts WHERE video_id = ?", (video_id,))
                        dt_rows = cursor.fetchall()
                        if dt_rows:
                            dense_transcripts = [{"timestamp": r[0], "text": r[1], "translated_text": r[2]} for r in dt_rows]
                    except Exception as dt_err:
                        print(f"[ERROR] Database dense transcripts lookup failed: {dt_err}")
                        
                    conn.close()
                    
                    if timestamps:
                        timestamps_status = "ready"
                    elif dense_transcripts:
                        timestamps_status = "idle"
                except Exception as e:
                    print(f"[ERROR] Database timestamps/flashcards lookup failed: {e}")
            has_transcripts = len(dense_transcripts) > 0
            # Summary tab is the lesson document. Do not block on chapter timestamps.
            # Only backfill transcripts in the background if ingest never wrote them.
            if (not has_transcripts) and video_id and resolved_video_path:
                timestamps_status = "generating"
                
                def run_qwen_timestamping_thread(vid_path, vid_id):
                    import qwen_omni_client
                    print(f"[BG INGESTION] Starting background ingestion for {vid_id}...")
                    try:
                        # Determine active user locale from SQLite
                        th_locale = "en_US"
                        if os.path.exists(db_path):
                            try:
                                conn_th = sqlite3.connect(db_path)
                                cur_th = conn_th.cursor()
                                cur_th.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                                user_row = cur_th.fetchone()
                                if user_row:
                                    th_user = user_row[0]
                                    cur_th.execute("SELECT locale FROM language_localization WHERE user_id = ?", (th_user,))
                                    loc_row = cur_th.fetchone()
                                    if loc_row:
                                        th_locale = loc_row[0]
                                conn_th.close()
                            except Exception as th_err:
                                print(f"[BG INGESTION ERROR] Failed to determine locale: {th_err}")

                        # 1. Generate Timestamps & Flashcards if not cached
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        cursor.execute("SELECT COUNT(*) FROM video_timestamps WHERE video_id = ?", (vid_id,))
                        has_ts = cursor.fetchone()[0] > 0
                        conn.close()

                        if not has_ts:
                            print(f"[BG INGESTION] Generating chapters/flashcards for {vid_id}...")
                            generated_ts = qwen_omni_client.generate_video_timestamps(vid_path, vid_id)
                            generated_fc = qwen_omni_client.generate_video_flashcards(vid_path, vid_id, th_locale)
                            
                            if th_locale == "fr_FR":
                                try:
                                    print("[BG INGESTION] Translating generated timestamps to French...")
                                    generated_ts = translate_timestamps_to_french(generated_ts)
                                except Exception as tr_err:
                                    print(f"[BG INGESTION ERROR] Failed translating generated timestamps: {tr_err}")
                            
                            # Cache in SQLite
                            conn = sqlite3.connect(VAULT_DB_PATH)
                            cursor = conn.cursor()
                            cursor.execute("DELETE FROM video_timestamps WHERE video_id = ?", (vid_id,))
                            for ts in generated_ts:
                                cursor.execute("INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)",
                                               (vid_id, ts["timestamp"], ts["title"], ts["description"]))
                            cursor.execute("DELETE FROM video_flashcards WHERE video_id = ?", (vid_id,))
                            for fc in generated_fc:
                                cursor.execute("INSERT OR REPLACE INTO video_flashcards (video_id, front, back, hint) VALUES (?, ?, ?, ?)",
                                               (vid_id, fc["front"], fc["back"], fc["hint"]))
                            conn.commit()
                            conn.close()
                        
                        # 2. Generate Dense Transcripts if not cached
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        cursor.execute("SELECT COUNT(*) FROM video_transcripts WHERE video_id = ?", (vid_id,))
                        has_trans = cursor.fetchone()[0] > 0
                        conn.close()

                        if not has_trans:
                            print(f"[BG INGESTION] Generating dense transcripts for {vid_id}...")
                            generate_and_cache_dense_transcripts(vid_path, vid_id, th_locale)

                        # Fetch final cached results for broadcast
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        cursor.execute("SELECT timestamp, title, description FROM video_timestamps WHERE video_id = ?", (vid_id,))
                        final_ts = [{"timestamp": r[0], "title": r[1], "description": r[2]} for r in cursor.fetchall()]
                        
                        cursor.execute("SELECT front, back, hint FROM video_flashcards WHERE video_id = ?", (vid_id,))
                        final_fc = [{"front": r[0], "back": r[1], "hint": r[2]} for r in cursor.fetchall()]
                        
                        cursor.execute("SELECT timestamp, text, translated_text FROM video_transcripts WHERE video_id = ?", (vid_id,))
                        final_dt = [{"timestamp": r[0], "text": r[1], "translated_text": r[2]} for r in cursor.fetchall()]
                        conn.close()

                        broad_ts = final_ts
                        broad_fc = final_fc
                        broad_dt = final_dt
                        
                        if th_locale == "fr_FR":
                            print("[BG INGESTION] Formatting/Translating final broadcast payloads to French...")
                            broad_ts = translate_timestamps_to_french(final_ts)
                            broad_fc = translate_flashcards_to_french(final_fc)
                            broad_dt = []
                            for dt in final_dt:
                                tr_t = dt["translated_text"]
                                if not tr_t:
                                    tr_t = translate_via_llm(dt["text"], "fr_FR")
                                broad_dt.append({
                                    "timestamp": dt["timestamp"],
                                    "text": dt["text"],
                                    "translated_text": tr_t
                                })

                        ws_payload = {
                            "action": "UPDATE_TIMESTAMPS",
                            "video_id": vid_id,
                            "timestamps": broad_ts,
                            "flashcards": broad_fc,
                            "dense_transcripts": broad_dt
                        }
                        
                        async def send_broadcast():
                            try:
                                async with websockets.connect(f"ws://localhost:{WS_PORT}") as ws:
                                    await ws.send(json.dumps(ws_payload))
                                    print(f"[BG INGESTION] WS broadcast complete for {vid_id}.")
                            except Exception as ws_err:
                                print(f"[BG INGESTION ERROR] WebSocket broadcast failed: {ws_err}")
                        
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(send_broadcast())
                        loop.close()
                        
                    except Exception as err:
                        print(f"[BG INGESTION ERROR] Thread failed for {vid_id}: {err}")
                
                threading.Thread(
                    target=run_qwen_timestamping_thread,
                    args=(resolved_video_path, video_id),
                    daemon=True
                ).start()

            if active_locale != instructor_locale:
                try:
                    print(f"[TRANSLATE] Active locale ({active_locale}) is different from instructor locale ({instructor_locale}). Translating metadata...")
                    timestamps = translate_timestamps(timestamps, active_locale)
                    flashcards = translate_flashcards(flashcards, active_locale)
                    if chapter_title:
                        chapter_title = translate_single_text(chapter_title, active_locale)
                except Exception as tr_err:
                    print(f"[TRANSLATE ERROR] Failed translating metadata: {tr_err}")

            # Save active video_id and active_locale to active_session.json for the LiveKit agent process
            try:
                session_info = merge_session_info({
                    "active_video_id": video_id,
                    "active_locale": active_locale
                })
                print(f"[SESSION] Saved session info: {session_info} to active_session.json", flush=True)
            except Exception as e:
                print(f"[ERROR] Failed to save active session info: {e}", flush=True)

            # Query last position and max position for this subject/video from student_progress
            last_position = 0.0
            max_position = 0.0
            if os.path.exists(db_path) and video_id:
                try:
                    conn_prog = sqlite3.connect(db_path)
                    cursor_prog = conn_prog.cursor()
                    cursor_prog.execute("""
                        CREATE TABLE IF NOT EXISTS student_progress_video (
                            student_id TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            last_position REAL NOT NULL,
                            max_position REAL NOT NULL,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (student_id, video_id)
                        );
                    """)
                    cursor_prog.execute("""
                        CREATE TABLE IF NOT EXISTS student_progress (
                            student_id TEXT NOT NULL,
                            subject TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            last_position REAL NOT NULL,
                            max_position REAL NOT NULL,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (student_id, subject)
                        );
                    """)
                    cursor_prog.execute("""
                        SELECT last_position, max_position
                        FROM student_progress_video
                        WHERE student_id = ? AND video_id = ?
                    """, (student_name, video_id))
                    prog_row = cursor_prog.fetchone()
                    if not prog_row:
                        subj = get_subject_by_video_id(video_id)
                        cursor_prog.execute("""
                            SELECT last_position, max_position 
                            FROM student_progress 
                            WHERE student_id = ? AND subject = ?
                        """, (student_name, subj))
                        prog_row = cursor_prog.fetchone()
                    if prog_row:
                        last_position = float(prog_row[0])
                        max_position = float(prog_row[1])
                    conn_prog.close()
                    print(f"[PROGRESS] Resolved database position {last_position}s and max watched {max_position}s for student {student_name}", flush=True)
                except Exception as prog_err:
                    print(f"[PROGRESS ERROR] Failed to fetch student progress from SQLite: {prog_err}", flush=True)

            if resolved_video_path:
                resolved_video_path = resolved_video_path.replace("\\", "/")
                if not resolved_video_path.startswith("/"):
                    resolved_video_path = "/" + resolved_video_path

            result = {
                "video_id": video_id,
                "video_file_path": resolved_video_path,
                "pdf_file_path": (pdf_path if (pdf_path.startswith('/saved_notebooks/') or pdf_path.startswith('/curriculum_staging/')) else '/curriculum_staging/' + pdf_path.lstrip('/')) if pdf_path else "",
                "start_page": start_page,
                "instructor_name": instructor_name,
                "instructor_avatar": instructor_avatar,
                "instructor_role": instructor_role,
                "instructor_locale": instructor_locale,
                "active_locale": active_locale,
                "chapter_title": chapter_title,
                "timestamps": timestamps,
                "timestamps_status": timestamps_status,
                "flashcards": flashcards,
                "dense_transcripts": dense_transcripts,
                "last_position": last_position,
                "max_position": max_position
            }
            self.wfile.write(json.dumps(result).encode('utf-8'))
            return

        # Serve saved notebooks dynamically from 'saved_notebooks' directory
        if clean_path.startswith('/saved_notebooks/'):
            # Build absolute path to local file inside workspace folder
            local_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), clean_path.lstrip('/'))
            if os.path.exists(local_file) and os.path.isfile(local_file):
                self.send_response(200)
                self.send_header('Content-Type', 'application/pdf')
                self.send_header('Content-Disposition', 'inline')
                self.end_headers()
                with open(local_file, 'rb') as f:
                    self.wfile.write(f.read())
                return
            
        # Route for LiveKit Client Connection Token
                # Route to fetch dynamic Quiz MCQs from vault.db for any ingested video
        if clean_path.startswith('/get_quiz_questions'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            
            mcq_list = { "main": [], "alternative": [] }
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("""
                    SELECT question_id, question, option_a, option_b, option_c, option_d, correct_option, is_alternative
                    FROM video_quiz_mcqs
                    WHERE video_id = ?
                    ORDER BY is_alternative ASC, question_id ASC
                """, (video_id,))
                rows = cur.fetchall()
                conn.close()
                
                main_qs = []
                alt_qs = []
                for r in rows:
                    item = {
                        "id": r[0],
                        "question": r[1],
                        "options": { "A": r[2], "B": r[3], "C": r[4], "D": r[5] },
                        "correct": r[6]
                    }
                    if r[7] == 1:
                        alt_qs.append(item)
                    else:
                        main_qs.append(item)
                        
                mcq_list = { "main": main_qs, "alternative": alt_qs }
            except Exception as err:
                print(f"[QUIZ FETCH DB ERROR] {err}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(mcq_list).encode('utf-8'))
            return

        # Route to get Next Lesson in Curriculum sequence dynamically from vault.db
        if clean_path.startswith('/get_next_lesson'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            
            next_lesson_info = {}
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("SELECT rowid, video_id, chapter_id, title FROM curriculum_tree ORDER BY rowid ASC")
                all_rows = cur.fetchall()
                conn.close()
                
                subject_prefix = ""
                if "_" in video_id:
                    parts = video_id.split("_")
                    if len(parts) >= 2:
                        subject_prefix = parts[0] + "_" + parts[1]
                        
                cur_idx = -1
                for idx, r in enumerate(all_rows):
                    if r[1] == video_id:
                        cur_idx = idx
                        break
                        
                if cur_idx != -1:
                    same_subject_next = None
                    for idx in range(cur_idx + 1, len(all_rows)):
                        if subject_prefix and all_rows[idx][1].startswith(subject_prefix):
                            same_subject_next = all_rows[idx]
                            break
                            
                    if same_subject_next:
                        next_lesson_info = {
                            "video_id": same_subject_next[1],
                            "chapter_id": same_subject_next[2],
                            "title": same_subject_next[3],
                            "same_subject": True
                        }
                    elif cur_idx + 1 < len(all_rows):
                        next_row = all_rows[cur_idx + 1]
                        next_lesson_info = {
                            "video_id": next_row[1],
                            "chapter_id": next_row[2],
                            "title": next_row[3],
                            "same_subject": False
                        }
            except Exception as err:
                print(f"[NEXT LESSON DB ERROR] {err}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(next_lesson_info).encode('utf-8'))
            return

        if clean_path.startswith('/token'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            identity = params.get('identity', ['student_01'])[0]
            name = params.get('name', [identity])[0]
            mode = params.get('mode', [DEPLOYMENT_MODE])[0]
            vid_param = params.get('video_id', [None])[0]
            requested_room = params.get('room', [''])[0].strip()
            room = requested_room or mint_socratic_room(identity)

            session_updates = {
                "active_student_name": name,
                "active_student_id": identity,
                "active_mode": mode,
                "active_livekit_room": room,
            }
            if vid_param:
                session_updates["active_video_id"] = vid_param
            online_param = params.get('online', [''])[0].lower()
            if online_param in ('1', 'true', 'yes', '0', 'false', 'no'):
                session_updates["student_online"] = online_param in ('1', 'true', 'yes')
            try:
                session_data = merge_session_info(session_updates)
            except Exception as e:
                print(f"[SESSION SAVE WARN] {e}")
                session_data = load_session_info()

            metadata_dict = {
                "student_name": name,
                "identity": identity,
                "mode": mode,
                "video_id": vid_param or session_data.get("active_video_id"),
                "active_view_state": session_data.get("active_view_state", "dashboard"),
                "active_view_context": session_data.get("active_view_context", ""),
                "active_pdf_path": session_data.get("active_pdf_path", ""),
                "active_video_time": session_data.get("active_video_time", 0),
                "engine": "gemini-flash-live",
            }

            api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
            api_secret = os.environ.get("LIVEKIT_API_SECRET", "secretsecretsecretsecretsecretsecretsecret")
            force_offline = os.environ.get("FORCE_OFFLINE", "").strip().lower() in ("1", "true", "yes", "on")
            offline_env = os.environ.get("OFFLINE_MODE")
            online_testing = (
                os.environ.get("ONLINE_MODE") == "1"
                or offline_env == "0"
                or (
                    (not force_offline)
                    and bool(os.environ.get("GOOGLE_API_KEY", "").strip())
                    and (offline_env or "").strip().lower() not in ("1", "true", "yes", "on")
                )
            )
            offline_default = (not online_testing) and (
                force_offline or (os.environ.get("OFFLINE_MODE", "1") == "1")
            )
            livekit_url = prefer_ipv4_livekit_url(
                os.environ.get("LIVEKIT_URL", "ws://127.0.0.1:7880").strip() or "ws://127.0.0.1:7880"
            )
            if online_testing:
                cloud = prefer_ipv4_livekit_url(os.environ.get("LIVEKIT_CLOUD_URL", "").strip())
                livekit_url = cloud or livekit_url
            fallbacks = livekit_connect_urls(livekit_url)
            if livekit_url in fallbacks:
                fallbacks = [u for u in fallbacks if u != livekit_url]

            agent_name = ""
            token = generate_livekit_token(
                api_key, api_secret, room, identity, name=name, metadata=metadata_dict, include_agent=False
            )
            # JWT roomConfig.agents: [{}] asks LiveKit Cloud for the default unnamed worker.
            # Also POST CreateDispatch so an already-open room still gets Gandho.
            dispatched, dispatch_raw = dispatch_livekit_agent(
                room, metadata=metadata_dict, livekit_url=livekit_url, agent_name=""
            )
            dispatch_detail = (
                "default unnamed-worker dispatch"
                if dispatched
                else ("dispatch failed: " + str(dispatch_raw)[:180])
            )
            worker = worker_heartbeat_status()
            if not worker.get("running"):
                dispatch_detail += (
                    " | worker heartbeat missing — run python3 livekit_stack/agent/run_agent.py --online start"
                )
            gemini_model = gemini_live_model_for_client()
            print(
                f"[TOKEN] room={room} url={livekit_url} online={session_data.get('student_online')} "
                f"agent={agent_name or '(unnamed)'} dispatch={dispatch_detail} model={gemini_model} "
                f"worker_running={bool(worker.get('running'))} ffmpeg={find_ffmpeg() or 'missing'}",
                flush=True,
            )

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "token": token,
                "url": livekit_url,
                "livekitUrl": livekit_url,
                "room": room,
                "fallbacks": fallbacks,
                "engine": "gemini-flash-live",
                "model": gemini_model,
                "agent_name": agent_name,
                "agent_dispatched": dispatched,
                "dispatch_detail": dispatch_detail[:240] if isinstance(dispatch_detail, str) else "",
                "offlineMode": (not online_testing) and offline_default,
                "onlineMode": online_testing,
                "worker_running": bool(worker.get("running")),
                "ffmpeg": bool(find_ffmpeg()),
            }).encode('utf-8'))
            return

        # Route for Spatius Token and configuration
        if clean_path.startswith('/spatius-token'):
            load_env()
            spatius_api_key = os.environ.get("SPATIUS_API_KEY", "").strip("'\" \t")
            spatius_app_id = os.environ.get("SPATIUS_APP_ID", "").strip("'\" \t")
            spatius_avatar_id = os.environ.get("SPATIUS_AVATAR_ID", "").strip("'\" \t")
            spatius_region = os.environ.get("SPATIUS_REGION", "us-west").strip("'\" \t") or "us-west"
            configured = bool(spatius_app_id and spatius_avatar_id)
            print(
                "[SPATIUS] /spatius-token configured=%s apiKey=%s region=%s"
                % (str(configured).lower(), "yes" if spatius_api_key else "no", spatius_region),
                flush=True,
            )

            if not configured:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "configured": False,
                    "mode": "direct",
                    "sessionToken": "",
                    "appId": "",
                    "avatarId": "",
                    "region": spatius_region,
                    "error": "Set SPATIUS_APP_ID and SPATIUS_AVATAR_ID in .env, then restart display_client.py.",
                }).encode('utf-8'))
                return

            session_token = ""
            if spatius_api_key:
                import urllib.request
                import urllib.error
                import time
                url = f"https://console.{spatius_region}.spatius.ai/v1/console/session-tokens"
                headers = {
                    "X-Api-Key": spatius_api_key,
                    "X-API-Key": spatius_api_key,
                    "X-App-ID": spatius_app_id,
                    "Content-Type": "application/json"
                }
                expire_time = int(time.time()) + 3600
                req_data = json.dumps({
                    "appId": spatius_app_id,
                    "expireAt": expire_time
                }).encode('utf-8')
                req = urllib.request.Request(url, data=req_data, headers=headers, method='POST')
                try:
                    with urllib.request.urlopen(req, timeout=8) as response:
                        token_data = json.loads(response.read().decode('utf-8'))
                        session_token = token_data.get("sessionToken", "") or token_data.get("token", "")
                    print(
                        "[SPATIUS] session token mint %s"
                        % ("ok" if session_token else "empty"),
                        flush=True,
                    )
                except Exception as e:
                    print(f"[SPATIUS] Session token mint failed (idle 3D still loads): {e}", flush=True)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "configured": True,
                "mode": "direct",
                "sessionToken": session_token,
                "appId": spatius_app_id,
                "avatarId": spatius_avatar_id,
                "region": spatius_region,
                "hasApiKey": bool(spatius_api_key),
                "hasSessionToken": bool(session_token),
            }).encode('utf-8'))
            return

        # Route for Admin Fleet Dashboard
        if clean_path in ['/admin', '/admin/', '/admin.html']:
            admin_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'admin.html')
            if os.path.exists(admin_file_path):
                with open(admin_file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            else:
                self.send_error(404, "admin.html template not found")
                return

        # Route for custom uploaded books list
        if clean_path == '/api/custom_books':
            books_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'custom_books.json')
            custom_books = []
            if os.path.exists(books_file):
                try:
                    with open(books_file, 'r', encoding='utf-8') as bf:
                        custom_books = json.load(bf)
                except Exception:
                    pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(custom_books).encode('utf-8'))
            return

        # Route for serving the dark-theme audiobook player
        if clean_path == '/audio_viewer':
            html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Audio Book Viewer</title>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            background-color: #0c0c0e;
            color: #ffffff;
            font-family: 'Geist', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .player-container {
            background: #121215;
            border: 1px solid #1c1c1f;
            border-radius: 12px;
            padding: 32px;
            width: 80%;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .audio-icon {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: rgba(168, 85, 247, 0.1);
            border: 2px solid #a855f7;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a855f7;
            margin-bottom: 8px;
        }
        .title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #ffffff;
        }
        audio {
            width: 100%;
            margin-top: 12px;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="audio-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px;">
                <path d="M9 18V5l12-2v13M9 9l12-2M9 15c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Z"/>
            </svg>
        </div>
        <div class="title" id="audioTitle">Audio Book</div>
        <audio id="audioPlayer" controls></audio>
    </div>
    <script>
        const params = new URLSearchParams(window.location.search);
        const src = params.get('src');
        const title = params.get('title');
        if (src) document.getElementById('audioPlayer').src = src;
        if (title) document.getElementById('audioTitle').innerText = title;
    </script>
</body>
</html>"""
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
            return

        # Fallback to serving static files from filesystem with range-streaming support
        if clean_path.startswith('/curriculum_staging/') or clean_path.startswith(('/k12/', '/college_level/', '/independent_learner/', '/professional_certificates/')):
            import urllib.parse
            unquoted_path = urllib.parse.unquote(clean_path).replace('/curriculum_staging/', '', 1).lstrip('/')
            staging_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'curriculum_staging', unquoted_path)
            if os.path.exists(staging_file) and os.path.isfile(staging_file):
                import mimetypes
                mime_type, _ = mimetypes.guess_type(staging_file)
                if not mime_type:
                    if staging_file.lower().endswith('.mp4'): mime_type = 'video/mp4'
                    elif staging_file.lower().endswith('.mp3'): mime_type = 'audio/mpeg'
                    elif staging_file.lower().endswith('.pdf'): mime_type = 'application/pdf'
                    else: mime_type = 'application/octet-stream'
                
                file_size = os.path.getsize(staging_file)
                range_header = self.headers.get('Range')
                if range_header:
                    import re
                    match = re.match(r'bytes=(\d+)-(\d*)', range_header)
                    if match:
                        start = int(match.group(1))
                        end = int(match.group(2)) if match.group(2) else file_size - 1
                        if start >= file_size:
                            self.send_error(416, "Requested Range Not Satisfiable")
                            return
                        end = min(end, file_size - 1)
                        length = end - start + 1
                        self.send_response(206)
                        self.send_header('Content-Type', mime_type)
                        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                        self.send_header('Content-Length', str(length))
                        self.send_header('Accept-Ranges', 'bytes')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        with open(staging_file, 'rb') as f:
                            f.seek(start)
                            bytes_remaining = length
                            chunk_size = 65536
                            while bytes_remaining > 0:
                                to_read = min(chunk_size, bytes_remaining)
                                chunk = f.read(to_read)
                                if not chunk:
                                    break
                                try:
                                    self.wfile.write(chunk)
                                    bytes_remaining -= len(chunk)
                                except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                                    break
                        return
                
                self.send_response(200)
                self.send_header('Content-Type', mime_type)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(staging_file, 'rb') as f:
                    chunk_size = 65536
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        try:
                            self.wfile.write(chunk)
                        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                            break
                return
                
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        import urllib.request
        import urllib.parse
        global DEPLOYMENT_MODE
        if _serve_classroom_api(self, "POST"):
            return
        if _serve_code_api(self, "POST"):
            return
        clean_path = self.path.split('?')[0]

        if clean_path == '/api/gandal_space/ask':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                prompt = data.get("prompt", "") or data.get("query", "")
                context = data.get("context", "")
                history = data.get("history", [])
                import importlib
                import gandal_space.agent_engine as ae
                importlib.reload(ae)
                result = ae.default_engine.process_query(prompt, context=context, history=history)
            except Exception as e:
                result = {"success": False, "error": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/eval_audio':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                import importlib
                import gandal_space.agent_engine as ae
                importlib.reload(ae)
                result = ae.default_engine.evaluate_pronunciation(
                    target_letter=data.get("target_letter", "A"),
                    expected_phoneme=data.get("expected_phoneme", "/eɪ/"),
                    student_transcript=data.get("student_transcript", ""),
                    audio_base64=data.get("audio_base64", "")
                )
            except Exception as e:
                result = {"type": "AudioFeedback", "status": "retry", "score": 60, "feedback_text": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/quiz':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8') or "{}")
                import importlib
                import gandal_space.agent_engine as ae
                importlib.reload(ae)
                result = ae.default_engine.generate_practice_quiz(
                    topic=data.get("topic") or data.get("title") or "",
                    context=data.get("context") or "",
                    band=data.get("band") or "",
                    topic_id=data.get("topic_id") or data.get("topicId") or "",
                )
            except Exception as e:
                result = {"success": False, "error": str(e), "questions": []}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/chat':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                from gandal_space.agent_engine import default_engine
                result = default_engine.chat_with_gandho(
                    message=data.get("message", ""),
                    context=data.get("context", ""),
                    history=data.get("history", [])
                )
            except Exception as e:
                result = {"success": False, "reply": str(e), "error": str(e), "provider": "Error"}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/track/intent':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8') or "{}")
                import gandal_space.k12_tracks as tracks
                student_id = _space_student_id(data.get("student_id"))
                result = tracks.handle_intent(student_id, data.get("message") or data.get("prompt") or "")
                result["student_id"] = student_id
            except Exception as e:
                result = {"success": False, "error": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/track/start':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8') or "{}")
                import gandal_space.k12_tracks as tracks
                student_id = _space_student_id(data.get("student_id"))
                result = tracks.start_track(
                    student_id,
                    data.get("subject") or "mathematics",
                    from_scratch=bool(data.get("from_scratch")),
                    topic_id=data.get("topic_id"),
                )
                result["student_id"] = student_id
            except Exception as e:
                result = {"success": False, "error": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/track/quiz':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8') or "{}")
                import gandal_space.k12_tracks as tracks
                student_id = _space_student_id(data.get("student_id"))
                result = tracks.apply_quiz(
                    student_id,
                    data.get("topic_id") or "",
                    bool(data.get("correct")),
                    question=data.get("question") or "",
                )
                result["student_id"] = student_id
            except Exception as e:
                result = {"success": False, "error": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/gandal_space/track/exit':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            post_data = self.rfile.read(content_length) if content_length else b"{}"
            try:
                data = json.loads(post_data.decode('utf-8') or "{}")
                import gandal_space.k12_tracks as tracks
                student_id = _space_student_id(data.get("student_id"))
                result = tracks.exit_track(student_id)
                result["student_id"] = student_id
            except Exception as e:
                result = {"success": False, "error": str(e)}
            body = json.dumps(result).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
            return

        if clean_path == '/api/omni_graph/voice_to_math':
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            if content_length <= 0 or content_length > 8 * 1024 * 1024:
                err_body = json.dumps({"success": False, "error": "Audio clip is missing or too large."}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(err_body)
                return
            audio_bytes = self.rfile.read(content_length)
            mime_type = self.headers.get("Content-Type") or "audio/webm"
            locale = self.headers.get("X-Graph-Voice-Locale") or "en-US"
            try:
                result = transcribe_spoken_math_formula(audio_bytes, mime_type, locale)
                status = 200 if result.get("success") else 400
                body = json.dumps(result).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
            except Exception as voice_err:
                print(f"[GRAPH VOICE] transcription failed: {voice_err}", flush=True)
                err_body = json.dumps({"success": False, "error": str(voice_err)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(err_body)
            return

        if clean_path == '/api/set_deployment_mode':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                target_mode = (data.get("mode") or "SINGLE").upper()
                if target_mode not in ["SINGLE", "CLASSROOM", "LAB"]:
                    target_mode = "SINGLE"
                old_mode = DEPLOYMENT_MODE
                DEPLOYMENT_MODE = target_mode
                print(f"\n[DEPLOYMENT CONTROLLER] Mode switched dynamically from {old_mode} to {DEPLOYMENT_MODE}", flush=True)
                try:
                    merge_session_info({"active_mode": DEPLOYMENT_MODE})
                except Exception as sess_err:
                    print(f"[SESSION] Failed to persist active_mode: {sess_err}", flush=True)

                # Broadcast mode change to all connected WebSocket displays
                sync_broadcast_ws({
                    "action": "DEPLOYMENT_MODE_CHANGED",
                    "mode": DEPLOYMENT_MODE,
                    "previous_mode": old_mode,
                    "message": f"Deployment mode updated to {DEPLOYMENT_MODE}"
                })

                res_body = json.dumps({"success": True, "mode": DEPLOYMENT_MODE, "previous_mode": old_mode}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if clean_path in ['/api/deploy_patch', '/api/onboarding_submit']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
            except Exception:
                data = {}
            if clean_path == '/api/deploy_patch':
                append_network_log("Deploy patch: refresh curriculum + reload clients")
                session_data = load_session_info()
                version = int(session_data.get("patch_version") or 0) + 1
                staging = os.path.join(PROJECT_ROOT, "curriculum_staging")
                file_count = 0
                if os.path.isdir(staging):
                    for root, dirs, files in os.walk(staging):
                        file_count += len(files)
                try:
                    merge_session_info({
                        "patch_version": version,
                        "patch_applied_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "curriculum_files": file_count,
                    })
                except Exception as e:
                    print(f"[PATCH] session save failed: {e}")
                sync_broadcast_ws({
                    "action": "DEPLOY_PATCH",
                    "version": version,
                    "curriculum_files": file_count,
                    "message": f"Patch v{version} applied. {file_count} curriculum files indexed. Reloading.",
                })
                body = json.dumps({
                    "success": True,
                    "clients": len(connected_clients),
                    "version": version,
                    "curriculum_files": file_count,
                }).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
                return
            # onboarding HTTP fallback (same writes as WS ONBOARDING_SUBMIT)
            try:
                name = (data.get("name") or "Student").strip() or "Student"
                track_id = data.get("track", "College")
                locale = data.get("locale", "en_US")
                conn = sqlite3.connect(VAULT_DB_PATH)
                cursor = conn.cursor()
                cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES (?, ?)",
                               (name, track_id))
                cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                               (name, locale))
                conn.commit()
                conn.close()
                sync_broadcast_ws({"action": "ONBOARDING_COMPLETE", "name": name, "track": track_id})
                body = json.dumps({"success": True, "name": name}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        if clean_path in ['/api/verify_proctor_pin', '/api/set_proctor_pin']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
            except Exception:
                data = {}
            expected = get_proctor_pin_hash()
            if clean_path == '/api/verify_proctor_pin':
                pin = str(data.get("pin") or "")
                ok = hash_proctor_pin(pin) == expected
                body = json.dumps({"success": ok}).encode('utf-8')
                self.send_response(200 if ok else 401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
                return
            current_pin = str(data.get("current_pin") or "")
            new_pin = str(data.get("new_pin") or "").strip()
            if hash_proctor_pin(current_pin) != expected:
                body = json.dumps({"success": False, "error": "Current PIN is incorrect"}).encode('utf-8')
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
                return
            if len(new_pin) < 4:
                body = json.dumps({"success": False, "error": "New PIN must be at least 4 characters"}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body)
                return
            try:
                merge_session_info({
                    "proctor_pin_hash": hash_proctor_pin(new_pin),
                    "proctor_pin_is_default": False,
                })
            except Exception as e:
                body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(body)
                return
            append_network_log("Proctor PIN updated")
            body = json.dumps({"success": True}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return

        if clean_path == '/api/create_class':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                class_code = data.get("class_code") or f"CLASS-{int(time.time())%10000}"
                class_name = data.get("class_name", "General Physics")
                video_id = data.get("video_id", "vid_physics_01")
                schedule_time = data.get("schedule_time", "Mon/Wed 9:00 AM")
                created_by = data.get("created_by", "Teacher Admin")
                
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS classroom_sessions (
                        class_code TEXT PRIMARY KEY,
                        class_name TEXT,
                        video_id TEXT,
                        schedule_time TEXT,
                        created_by TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cur.execute("""
                    INSERT OR REPLACE INTO classroom_sessions (class_code, class_name, video_id, schedule_time, created_by)
                    VALUES (?, ?, ?, ?, ?)
                """, (class_code, class_name, video_id, schedule_time, created_by))
                conn.commit()
                conn.close()
                
                res_body = json.dumps({"success": True, "class_code": class_code, "class_name": class_name}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_body)
                return
            except Exception as e:
                err_body = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(err_body)
                return

        # Virtual Labs: RDKit 2D Molecule Render API
        if clean_path == '/api/v1/chemistry/molecule/render':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                smiles = data.get("smiles", "CCO")
                if LABS_SOLVERS_AVAILABLE:
                    res = science_solvers.render_molecule_rdkit(smiles)
                else:
                    res = {"success": False, "error": "RDKit solver not loaded"}
                res_bytes = json.dumps(res).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # Circuits Lab: Socratic walkthrough / debugging Q&A
        if clean_path == '/api/circuits/ask':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                ask_data = json.loads(post_data) if post_data else {}
                question = ask_data.get("question", "")
                problem_title = ask_data.get("problemTitle", "Atelier Circuits")
                step_info = f"Étape {ask_data.get('currentStep', 1)} sur {ask_data.get('totalSteps', 1)}"
                step_desc = ask_data.get("stepDescription") or ""
                spoken = ask_data.get("spokenInstruction") or ""
                expected_pins = ask_data.get("expectedPins") or []
                expected_comp = ask_data.get("expectedComponent") or ""
                mode = ask_data.get("mode") or "VIRTUAL"
                pins_txt = ", ".join(str(p) for p in expected_pins) if expected_pins else "non précisés"

                context_hint = spoken or step_desc
                answer = (
                    f"Pour {problem_title} ({step_info}, mode {mode}) : "
                    + (f"{context_hint} " if context_hint else "")
                    + f"Ciblez les trous {pins_txt}"
                    + (f" avec le composant {expected_comp}. " if expected_comp else ". ")
                    + "Vérifiez VCC/GND et la polarité avant d’alimenter le rail."
                )

                # LOCAL-FIRST: Gemma on :8080, then curriculum template, Gemini only as online fallback
                socratic_prompt = (
                    "Tu es un professeur d'électronique qui guide un élève sur un breadboard physique. "
                    f"Défi actif : {problem_title} ({step_info}, mode {mode}). "
                    f"Consigne de l'étape : {spoken or step_desc or 'non fournie'}. "
                    f"Composant attendu : {expected_comp or 'non précisé'}. "
                    f"Trous cibles : {pins_txt}. "
                    f"L'élève demande : « {question} ». "
                    "Réponds en français, en 2–3 phrases socratiques et encourageantes, "
                    "en t'appuyant sur la consigne et les trous cibles, "
                    "sans donner la solution complète."
                )
                local_answer = query_local_llm(
                    socratic_prompt,
                    system_prompt="Tu es Gandho, tuteur socratique local sur Ventuno Q. Réponds seulement en français."
                )
                if local_answer:
                    answer = local_answer.strip()
                elif os.environ.get("GOOGLE_API_KEY") and os.environ.get("OFFLINE_MODE", "1") != "1":
                    try:
                        from google import genai
                        g_client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
                        g_res = g_client.models.generate_content(
                            model="gemini-2.5-flash",
                            contents=socratic_prompt
                        )
                        if g_res and g_res.text:
                            answer = g_res.text.strip()
                    except Exception:
                        pass

                res_bytes = json.dumps({"success": True, "answer": answer}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # Virtual Labs: SymPy & SciPy Calculus / Waves API
        if clean_path == '/api/v1/physics/calculus/solve':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                m_type = data.get("topic") or data.get("type") or "waves"
                params = data.get("params", {})
                if LABS_SOLVERS_AVAILABLE:
                    res = science_solvers.solve_physics_symbolic(m_type, params)
                else:
                    res = {"success": False, "error": "Physics solver not loaded"}
                res_bytes = json.dumps(res).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        if clean_path == '/api/v1/lab/command':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                cmd_data = json.loads(post_data) if post_data else {}
                try:
                    merge_session_info({"latest_lab_command": cmd_data})
                except Exception:
                    pass
                sync_broadcast_ws({"action": "LAB_CONTROL", "command": cmd_data})
                res_bytes = json.dumps({"success": True, "command": cmd_data}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        if clean_path == '/api/v1/badges/award':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                b_data = json.loads(post_data) if post_data else {}
                b_id = b_data.get("badge_id")
                title = b_data.get("title", "")
                xp = int(b_data.get("xp", 0) or 0)
                _award_student_badge(b_id, title, xp)
                res_bytes = json.dumps({"success": True, "badge_id": b_id}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # Virtual Labs: ChemPy Mixture & Stoichiometry API
        if clean_path == '/api/v1/chemistry/mix':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                solutions = data.get("solutions", [])
                indicator = data.get("indicator", "phenolphthalein")
                temp_c = data.get("temp_c", 25.0)
                res = chem_calculate_mixture(solutions, indicator, temp_c)
                res_bytes = json.dumps(res).encode('utf-8')
                status = 200 if res.get("success", True) else 503
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        # OmniGraph STEM Engine: Math Vision OCR API (Tier 1: Offline Gemma 4 E4B, Tier 2: Cloud Gemini)
        if clean_path == '/api/v1/math/vision_ocr':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                img_b64 = data.get("image_base64", "")
                if not img_b64:
                    res_bytes = json.dumps({"success": False, "error": "No image data provided"}).encode('utf-8')
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(res_bytes)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(res_bytes)
                    return

                extracted = None
                source = None
                local_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:8080/v1")
                try:
                    data_url = img_b64 if img_b64.startswith("data:") else f"data:image/png;base64,{img_b64}"
                    prompt = (
                        "You are an expert mathematical OCR and vision parser for an interactive STEM graphing engine.\n"
                        "Examine this image containing a mathematical problem or equation.\n"
                        "Extract ALL mathematical equations, functions, or inequalities that need to be plotted.\n"
                        "CRITICAL INSTRUCTIONS:\n"
                        "- If there are multiple equations or inequalities (e.g. 'y <= x + 1' and 'y >= 2x + 1'), extract ALL separated by a comma: 'y <= x + 1, y >= 2x + 1'.\n"
                        "- Do not omit any equation or inequality.\n"
                        "- Standard syntax: '^' for power (e.g. 'x^2'), '<=', '>=', 'sin(x)', 'cos(x)', 'sqrt(x)'.\n"
                        "- Return ONLY the clean formula string, nothing else. No markdown, no explanations."
                    )
                    payload = {
                        "model": os.environ.get("LOCAL_MODEL_NAME", "gemma-4-e4b"),
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {"type": "image_url", "image_url": {"url": data_url}}
                                ]
                            }
                        ],
                        "temperature": 0.0,
                        "max_tokens": 150
                    }
                    req = urllib.request.Request(
                        f"{local_url}/chat/completions",
                        data=json.dumps(payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        res_obj = json.loads(resp.read().decode("utf-8"))
                        txt = res_obj["choices"][0]["message"]["content"].strip()
                        txt = txt.replace("```math", "").replace("```", "").strip()
                        if txt and len(txt) >= 2:
                            extracted = txt
                            source = "gemma-4-e4b (offline)"
                except Exception:
                    pass

                if not extracted:
                    google_key = os.environ.get("GOOGLE_API_KEY")
                    if not google_key or google_key == "your_google_api_key_here":
                        env_file = os.path.join(PROJECT_ROOT, ".env")
                        if os.path.exists(env_file):
                            try:
                                with open(env_file, "r", encoding="utf-8") as ef:
                                    for line in ef:
                                        if line.strip().startswith("GOOGLE_API_KEY="):
                                            google_key = line.strip().split("=", 1)[1].strip().strip('"\'')
                                            break
                            except Exception:
                                pass
                    if google_key and google_key != "your_google_api_key_here":
                        try:
                            clean_b64 = img_b64
                            mime = "image/png"
                            if "," in clean_b64:
                                hdr, clean_b64 = clean_b64.split(",", 1)
                                if "jpeg" in hdr or "jpg" in hdr:
                                    mime = "image/jpeg"
                                elif "webp" in hdr:
                                    mime = "image/webp"

                            prompt = (
                                "You are an expert mathematical OCR and vision parser for an interactive STEM graphing engine.\n"
                                "Examine this image containing a mathematical problem or equation.\n"
                                "Extract ALL mathematical equations, functions, or inequalities that need to be plotted.\n"
                                "CRITICAL INSTRUCTIONS:\n"
                                "- If there are multiple equations or inequalities (e.g. 'y <= x + 1' and 'y >= 2x + 1'), extract ALL separated by a comma: 'y <= x + 1, y >= 2x + 1'.\n"
                                "- Do not omit any equation or inequality.\n"
                                "- Standard syntax: '^' for power (e.g. 'x^2'), '<=', '>=', 'sin(x)', 'cos(x)', 'sqrt(x)'.\n"
                                "- Return ONLY the clean formula string, nothing else. No markdown, no explanations."
                            )
                            g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={google_key}"
                            g_data = {
                                "contents": [{
                                    "parts": [
                                        {"text": prompt},
                                        {"inline_data": {"mime_type": mime, "data": clean_b64}}
                                    ]
                                }],
                                "generationConfig": {"temperature": 0.0, "maxOutputTokens": 1000}
                            }
                            req = urllib.request.Request(
                                g_url,
                                data=json.dumps(g_data).encode("utf-8"),
                                headers={"Content-Type": "application/json"}
                            )
                            with urllib.request.urlopen(req, timeout=12) as g_resp:
                                g_result = json.loads(g_resp.read().decode("utf-8"))
                                txt = g_result["candidates"][0]["content"]["parts"][0]["text"].strip()
                                txt = txt.replace("```math", "").replace("```", "").strip()
                                if txt and len(txt) >= 2:
                                    extracted = txt
                                    source = "gemini-vision (cloud)"
                        except Exception as g_err:
                            print(f"[VISION OCR GEMINI ERROR] {g_err}", flush=True)

                if extracted:
                    res_bytes = json.dumps({"success": True, "equation": extracted, "source": source}).encode('utf-8')
                    self.send_response(200)
                else:
                    res_bytes = json.dumps({"success": False, "error": "Could not recognize math formula from image"}).encode('utf-8')
                    self.send_response(422)

                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
                return
            except Exception as e:
                err_bytes = json.dumps({"success": False, "error": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_bytes)
                return

        if clean_path == '/save_active_session':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
            try:
                data = json.loads(post_data) if post_data else {}
                v_id = data.get("active_video_id")
                p_path = data.get("active_pdf_path")
                if v_id:
                    save_session_info(v_id, p_path)
                    print(f"[SESSION HTTP POST] Saved active_session.json video_id={v_id}", flush=True)
                res_bytes = json.dumps({"status": "success", "active_video_id": v_id}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(res_bytes)
            except Exception as e:
                err_bytes = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.end_headers()
                self.wfile.write(err_bytes)
            return
        
        # Route for updating active view state (dashboard, split_workspace, evaluation, screen_share)
        if clean_path == '/api/active_state':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                state = data.get('active_view_state', 'dashboard')
                context = data.get('active_view_context', '')
                updates = {
                    "active_view_state": state,
                    "active_view_context": context,
                }
                act_vid = data.get("active_video_id")
                if act_vid and isinstance(act_vid, str) and act_vid.startswith("vid_") and act_vid != "gandal_space_active":
                    updates["active_video_id"] = act_vid
                if data.get("active_video_title") and act_vid != "gandal_space_active":
                    updates["active_video_title"] = data["active_video_title"]
                if data.get("active_video_time") is not None and act_vid != "gandal_space_active":
                    updates["active_video_time"] = data["active_video_time"]
                merge_session_info(updates)
                print(f"[SESSION] Updated active view state: '{state}' with context: '{context[:50]}...'", flush=True)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

        # Route for updating active book session metadata
        if clean_path == '/api/active_book':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                pdf_path = data.get('pdf_path', '')
                pdf_name = data.get('pdf_name', '')
                merge_session_info({
                    "active_pdf_path": pdf_path,
                    "active_pdf_name": pdf_name,
                })
                print(f"[SESSION] Updated active book pdf_path='{pdf_path}', pdf_name='{pdf_name}'", flush=True)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

        # Route for saving student video progress
        if clean_path == '/api/save_progress':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                student_id = data.get('student_id', 'student_01')
                video_id = data.get('video_id')
                current_time = float(data.get('current_time', 0.0))
                max_time = float(data.get('max_time', 0.0))
                
                db_path = VAULT_DB_PATH
                success = False
                if video_id:
                    # If no explicit student_id was provided, try to infer the last active user.
                    if student_id == "student_01" and os.path.exists(db_path):
                        try:
                            conn = sqlite3.connect(db_path)
                            cursor = conn.cursor()
                            cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                            row = cursor.fetchone()
                            if row and row[0]:
                                student_id = row[0]
                            conn.close()
                        except Exception:
                            pass

                    subject = get_subject_by_video_id(video_id)
                    
                    # 1. Update SQLite progress database with video-specific progress
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS student_progress_video (
                            student_id TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            last_position REAL NOT NULL,
                            max_position REAL NOT NULL,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (student_id, video_id)
                        );
                    """)
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS student_progress (
                            student_id TEXT NOT NULL,
                            subject TEXT NOT NULL,
                            video_id TEXT NOT NULL,
                            last_position REAL NOT NULL,
                            max_position REAL NOT NULL,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (student_id, subject)
                        );
                    """)
                    cursor.execute("SELECT max_position FROM student_progress_video WHERE student_id = ? AND video_id = ?", (student_id, video_id))
                    existing_row = cursor.fetchone()
                    final_max_time = max_time
                    if existing_row:
                        final_max_time = max(float(existing_row[0]), max_time)
                    # Ignore 0.0s progress updates if a valid position is already saved
                    cursor.execute("SELECT last_position FROM student_progress_video WHERE student_id = ? AND video_id = ?", (student_id, video_id))
                    last_pos_row = cursor.fetchone()
                    save_pos = current_time
                    if last_pos_row and current_time < 0.5 and float(last_pos_row[0]) > 0.5:
                        save_pos = float(last_pos_row[0])

                    cursor.execute("""
                        INSERT INTO student_progress_video (student_id, video_id, last_position, max_position)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(student_id, video_id) DO UPDATE SET
                            last_position = ?,
                            max_position = ?,
                            last_updated = CURRENT_TIMESTAMP;
                    """, (student_id, video_id, save_pos, final_max_time, save_pos, final_max_time))
                    
                    # 2. Also maintain subject-level progress for backward compatibility and subject-level gating
                    cursor.execute("SELECT max_position FROM student_progress WHERE student_id = ? AND subject = ?", (student_id, subject))
                    subject_row = cursor.fetchone()
                    subject_max_time = max_time
                    if subject_row:
                        subject_max_time = max(float(subject_row[0]), max_time)
                    cursor.execute("""
                        INSERT INTO student_progress (student_id, subject, video_id, last_position, max_position)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(student_id, subject) DO UPDATE SET
                            video_id = excluded.video_id,
                            last_position = excluded.last_position,
                            max_position = ?,
                            last_updated = CURRENT_TIMESTAMP;
                    """, (student_id, subject, video_id, current_time, subject_max_time, subject_max_time))
                    conn.commit()
                    conn.close()
                    
                    # 2. Sync progress to OKF SessionState
                    import sys
                    agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "livekit_stack", "agent")
                    if agent_dir not in sys.path:
                        sys.path.append(agent_dir)
                    try:
                        import student_memory
                        import datetime
                        
                        # Load video/chapter metadata
                        video_title = "Active Lesson"
                        chapter_id = "unknown"
                        conn = sqlite3.connect(db_path)
                        cursor = conn.cursor()
                        cursor.execute("SELECT pdf_file_path, chapter_id FROM lesson_metadata WHERE video_id = ?", (video_id,))
                        l_row = cursor.fetchone()
                        if l_row and l_row[0]:
                            video_title = os.path.basename(l_row[0]).replace(".pdf", "")
                            if l_row[1]: chapter_id = l_row[1]
                        else:
                            cursor.execute("SELECT title, chapter_id FROM curriculum_tree WHERE video_id = ?", (video_id,))
                            meta_row = cursor.fetchone()
                            if meta_row:
                                video_title, chapter_id = meta_row
                            else:
                                video_title = video_id.replace("vid_", "").replace("_", " ").title()
                        conn.close()
                        
                        def format_time_secs(secs):
                            m = int(secs // 60)
                            s = int(secs % 60)
                            return f"{m:02d}:{s:02d}"
                            
                        state_meta, _ = student_memory.load_or_create_session_state(student_id)
                        state_meta["status"] = "paused"
                        state_meta["last_session_time"] = datetime.datetime.utcnow().isoformat() + "Z"
                        state_meta["subject"] = subject
                        
                        state_body = (
                            "# Last Session Bookmark\n\n"
                            "## Where They Left Off\n"
                            f"* **Module**: {chapter_id} ({video_title})\n"
                            f"* **Last Activity**: Watched video up to {format_time_secs(current_time)} (max watched: {format_time_secs(final_max_time)})\n"
                            f"* **Next Best Action**: Resume watching from {format_time_secs(current_time)}\n"
                        )
                        student_memory.save_okf_file(student_id, "session_state.md", state_meta, state_body)
                        success = True
                    except Exception as okf_e:
                        print(f"[SESSION OKF ERROR] Failed to write SessionState OKF: {okf_e}", flush=True)
                        success = True # Return success true since DB updated
                        
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": success}).encode('utf-8'))
                return
            except Exception as e:
                print(f"[SAVE PROGRESS ERROR] failed: {e}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

        # Route for saving student profile avatar image
        if clean_path == '/api/save_profile_avatar':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                student_id = data.get('student_id', 'Alseny')
                avatar_data = data.get('avatar_data', '')
                
                db_path = VAULT_DB_PATH
                if os.path.exists(db_path):
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("PRAGMA table_info(user_profiles)")
                    cols = [c[1] for c in cursor.fetchall()]
                    if "profile_image" not in cols:
                        cursor.execute("ALTER TABLE user_profiles ADD COLUMN profile_image TEXT")
                    
                    cursor.execute("UPDATE user_profiles SET profile_image = ? WHERE user_id = ?", (avatar_data, student_id))
                    if cursor.rowcount == 0:
                        cursor.execute("INSERT INTO user_profiles (user_id, profile_image) VALUES (?, ?)", (student_id, avatar_data))
                    conn.commit()
                    conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'avatar': avatar_data}).encode('utf-8'))
                return
            except Exception as e:
                print(f"[SAVE AVATAR ERROR] failed: {e}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                return

        # Route for uploading and processing a book (PDF / audio book)
        if clean_path == '/api/upload_book':
            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                import re
                import uuid
                import pypdf
                import requests
                import lancedb
                from sentence_transformers import SentenceTransformer
                
                # Check for multipart boundary
                if "boundary=" not in content_type:
                    raise Exception("Invalid Content-Type, expected multipart/form-data")
                    
                boundary = content_type.split("boundary=")[1].strip().encode('utf-8')
                parts = post_data.split(b'--' + boundary)
                files = {}
                fields = {}
                for part in parts:
                    if not part or part == b'--' or part == b'--\r\n' or part.startswith(b'\r\n--') or part == b'\r\n':
                        continue
                    if part.startswith(b'\r\n'):
                        part = part[2:]
                    idx = part.find(b'\r\n\r\n')
                    if idx == -1:
                        continue
                    headers = part[:idx].decode('utf-8', errors='ignore')
                    body = part[idx+4:]
                    if body.endswith(b'\r\n'):
                        body = body[:-2]
                    
                    name_match = re.search(r'name="([^"]+)"', headers)
                    filename_match = re.search(r'filename="([^"]+)"', headers)
                    
                    if name_match:
                        name = name_match.group(1)
                        if filename_match:
                            filename = filename_match.group(1)
                            files[name] = {"filename": filename, "content": body}
                        else:
                            fields[name] = body.decode('utf-8', errors='ignore')
                
                if 'file' not in files:
                    raise Exception("No file found in the upload.")
                    
                file_info = files['file']
                filename = file_info['filename']
                file_content = file_info['content']
                subject = fields.get('subject', 'Uploaded')
                
                # Setup upload directories
                staging_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'curriculum_staging')
                upload_dir = os.path.join(staging_dir, 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Clean filename
                clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
                dest_path = os.path.join(upload_dir, clean_filename)
                
                with open(dest_path, 'wb') as f:
                    f.write(file_content)
                print(f"[UPLOAD] Saved book file to {dest_path}", flush=True)
                
                paragraphs = []
                file_type = "pdf" if clean_filename.lower().endswith('.pdf') else "audio"
                
                if file_type == "pdf":
                    # Parse PDF pages
                    import io
                    pdf_file = io.BytesIO(file_content)
                    reader = pypdf.PdfReader(pdf_file)
                    for page_idx, page in enumerate(reader.pages):
                        text = page.extract_text()
                        if not text:
                            continue
                        raw_paras = text.split("\n\n")
                        for rp in raw_paras:
                            cleaned = rp.strip()
                            if len(cleaned) > 20:
                                paragraphs.append({
                                    "text": cleaned,
                                    "marker": f"Page {page_idx + 1}"
                                })
                else: # audio file
                    api_key = os.environ.get("GOOGLE_API_KEY")
                    if api_key:
                        mime_type = "audio/mp3" if clean_filename.lower().endswith('.mp3') else "audio/wav"
                        audio_b64 = base64.b64encode(file_content).decode('utf-8')
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
                        headers = {"Content-Type": "application/json"}
                        payload = {
                            "contents": [{
                                "parts": [
                                    {"text": "Please provide a complete transcript of this audio file, preserving paragraphs and formatting. Do not add any conversational text or introduction. Only output the transcript of the audio."},
                                    {
                                        "inlineData": {
                                            "mimeType": mime_type,
                                            "data": audio_b64
                                        }
                                    }
                                ]
                            }]
                        }
                        
                        resp = requests.post(url, headers=headers, json=payload, timeout=60)
                        if resp.status_code == 200:
                            res_data = resp.json()
                            try:
                                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                                raw_paras = text.split("\n\n")
                                for p_idx, rp in enumerate(raw_paras):
                                    cleaned = rp.strip()
                                    if len(cleaned) > 10:
                                        paragraphs.append({
                                            "text": cleaned,
                                            "marker": f"Audio block {p_idx + 1}"
                                        })
                            except Exception as pe:
                                print(f"[UPLOAD] Failed parsing Gemini response: {pe}", flush=True)
                                paragraphs.append({
                                    "text": f"Failed parsing transcription: {pe}",
                                    "marker": "Error"
                                })
                        else:
                            print(f"[UPLOAD] Gemini API transcription failed code {resp.status_code}: {resp.text}", flush=True)
                            paragraphs.append({
                                "text": f"Transcribe API error {resp.status_code}: {resp.text}",
                                "marker": "Error"
                            })
                    else:
                        print("[UPLOAD] No GOOGLE_API_KEY, using mock audio transcript.", flush=True)
                        paragraphs.append({
                            "text": f"This is an audio file: {filename}. Please add a GOOGLE_API_KEY to the .env file to enable dynamic AI audio transcription and study.",
                            "marker": "Information"
                        })
                
                # Add to LanceDB
                if paragraphs:
                    db = lancedb.connect(".lancedb")
                    tbl = db.open_table("curriculum_rag")
                    
                    print(f"[UPLOAD] Loading SentenceTransformer for {len(paragraphs)} paragraphs...", flush=True)
                    model = SentenceTransformer('all-MiniLM-L6-v2')
                    raw_texts = [p["text"] for p in paragraphs]
                    embeddings = model.encode(raw_texts)
                    
                    data_to_insert = []
                    for p_idx, p in enumerate(paragraphs):
                        vector_list = embeddings[p_idx].tolist()
                        content_id = f"custom_{uuid.uuid4().hex[:12]}_{p_idx}"
                        data_to_insert.append({
                            "content_id": content_id,
                            "subject": subject,
                            "timestamp_marker": p["marker"],
                            "raw_transcript_text": p["text"],
                            "vector": vector_list
                        })
                    tbl.add(data_to_insert)
                    print(f"[UPLOAD] Successfully added {len(data_to_insert)} entries to LanceDB.", flush=True)
                
                # Save metadata to custom_books.json
                books_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'custom_books.json')
                custom_books = []
                if os.path.exists(books_file):
                    try:
                        with open(books_file, 'r', encoding='utf-8') as bf:
                            custom_books = json.load(bf)
                    except Exception:
                        pass
                
                book_id = f"book-{uuid.uuid4().hex[:8]}"
                book_path = f"/curriculum_staging/uploads/{clean_filename}"
                new_book = {
                    "id": book_id,
                    "name": filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' '),
                    "path": book_path,
                    "subject": subject,
                    "type": file_type
                }
                custom_books.append(new_book)
                
                with open(books_file, 'w', encoding='utf-8') as bf:
                    json.dump(custom_books, bf, indent=2)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "book": new_book}).encode('utf-8'))
                return
            except Exception as e:
                print(f"[UPLOAD ERROR] {e}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

        # Route for student help feedback & admin communication
        if clean_path == '/api/send_feedback':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                student_name = data.get('name', 'Alseny')
                contact_email = data.get('email', 'contact@gandal.school')
                category = data.get('category', 'General Suggestion')
                message = data.get('message', '')

                db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vault.db"))
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS admin_feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_name TEXT,
                        contact_email TEXT,
                        category TEXT,
                        message TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cursor.execute("""
                    INSERT INTO admin_feedback (student_name, contact_email, category, message)
                    VALUES (?, ?, ?, ?)
                """, (student_name, contact_email, category, message))
                conn.commit()
                conn.close()

                print(f"[ADMIN FEEDBACK] Saved message from {student_name} ({category}): '{message[:60]}...'", flush=True)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Feedback submitted successfully"}).encode('utf-8'))
                return
            except Exception as fe:
                print(f"[ADMIN FEEDBACK ERROR] {fe}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(fe)}).encode('utf-8'))
                return

        # Route for retrieving and saving user settings preferences
        if clean_path == '/api/user_settings':
            if self.command == 'GET':
                try:
                    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vault.db"))
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS user_settings (
                            user_id TEXT PRIMARY KEY,
                            tutor_voice TEXT,
                            locale TEXT,
                            subtitles_enabled INTEGER,
                            speech_speed REAL
                        )
                    """)
                    cursor.execute("SELECT tutor_voice, locale, subtitles_enabled, speech_speed FROM user_settings WHERE user_id = 'Alseny'")
                    row = cursor.fetchone()
                    conn.close()

                    settings = {
                        "tutor_voice": row[0] if row else "Aoede",
                        "locale": row[1] if row else "fr_FR",
                        "subtitles_enabled": bool(row[2]) if row else True,
                        "speech_speed": row[3] if row else 1.0
                    }
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "settings": settings}).encode('utf-8'))
                    return
                except Exception as se:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": str(se)}).encode('utf-8'))
                    return
            elif self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    voice = data.get('tutor_voice', 'Aoede')
                    loc = data.get('locale', 'fr_FR')
                    subs = 1 if data.get('subtitles_enabled', True) else 0
                    speed = float(data.get('speech_speed', 1.0))

                    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vault.db"))
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS user_settings (
                            user_id TEXT PRIMARY KEY,
                            tutor_voice TEXT,
                            locale TEXT,
                            subtitles_enabled INTEGER,
                            speech_speed REAL
                        )
                    """)
                    cursor.execute("""
                        INSERT INTO user_settings (user_id, tutor_voice, locale, subtitles_enabled, speech_speed)
                        VALUES ('Alseny', ?, ?, ?, ?)
                        ON CONFLICT(user_id) DO UPDATE SET
                            tutor_voice = excluded.tutor_voice,
                            locale = excluded.locale,
                            subtitles_enabled = excluded.subtitles_enabled,
                            speech_speed = excluded.speech_speed
                    """, (voice, loc, subs, speed))
                    conn.commit()
                    conn.close()

                    # Also sync locale to active_session.json if changed
                    if os.path.exists(SESSION_JSON_PATH):
                        try:
                            with open(SESSION_JSON_PATH, "r+", encoding="utf-8") as sf:
                                sdata = json.load(sf)
                                sdata["active_locale"] = loc
                                sf.seek(0)
                                json.dump(sdata, sf, indent=2)
                                sf.truncate()
                        except Exception:
                            pass

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "message": "Settings saved"}).encode('utf-8'))
                    return
                except Exception as se:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": str(se)}).encode('utf-8'))
                    return

        # Route for local OpenAI-compatible Speech synthesis (TTS)
        if clean_path == '/v1/audio/speech':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                input_text = data.get('input', '')
                print(f"[TTS SERVER] Synthesis request for text: '{input_text[:50]}...'", flush=True)
                
                # Check active locale to see if we should use Google TTS + FFmpeg fallback for French
                active_locale = "en_US"
                if os.path.exists(SESSION_JSON_PATH):
                    try:
                        with open(SESSION_JSON_PATH, "r") as sf:
                            active_locale = json.load(sf).get("active_locale", "en_US")
                    except Exception:
                        pass
                
                import uuid
                temp_filename = f"temp_speech_{uuid.uuid4().hex}.wav"
                temp_wav = os.path.abspath(os.path.join(os.path.dirname(__file__), temp_filename))
                
                # LOCAL-FIRST: try Kokoro for all locales (incl. French); Google only if online allowed
                use_google_tts = False
                kokoro_bytes = query_local_kokoro_tts(input_text)
                if kokoro_bytes:
                    print("[TTS SERVER] Kokoro local synthesis OK", flush=True)
                    self.send_response(200)
                    self.send_header('Content-Type', 'audio/mpeg')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(kokoro_bytes)))
                    self.end_headers()
                    self.wfile.write(kokoro_bytes)
                    return

                use_google_tts = (
                    os.environ.get("OFFLINE_MODE", "1") != "1"
                    and (active_locale == "fr_FR" or active_locale.startswith("fr"))
                )
                
                if use_google_tts:
                    # High-fidelity native French Google TTS + FFmpeg translation
                    print(f"[TTS SERVER] Active locale is French ({active_locale}). Fetching Google TTS with FFmpeg conversion...", flush=True)
                    try:
                        import urllib.parse
                        import urllib.request
                        import subprocess
                        import tempfile
                        
                        encoded_text = urllib.parse.quote(input_text)
                        google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q={encoded_text[:200]}&tl=fr"
                        req = urllib.request.Request(
                            google_tts_url, 
                            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                        )
                        with urllib.request.urlopen(req, timeout=10) as response:
                            mp3_data = response.read()
                            
                        temp_mp3_fd, temp_mp3_path = tempfile.mkstemp(suffix=".mp3")
                        try:
                            with os.fdopen(temp_mp3_fd, 'wb') as tmp:
                                tmp.write(mp3_data)
                            cmd = ["ffmpeg", "-y", "-i", temp_mp3_path, "-ar", "24000", "-ac", "1", temp_wav]
                            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                        finally:
                            try:
                                os.remove(temp_mp3_path)
                            except Exception:
                                pass
                    except Exception as g_err:
                        print(f"[TTS SERVER ERROR] Google TTS fallback failed: {g_err}. Reverting to SAPI5.", flush=True)
                        use_google_tts = False
                
                if not use_google_tts:
                    if sys.platform != "win32":
                        print("[TTS SERVER] SAPI5 is Windows-only. Start Kokoro on :8880 for /v1/audio/speech on Linux.", flush=True)
                        self.send_error(503, "Speech synthesis unavailable on Linux without Kokoro")
                        return
                    # Import native Windows COM library
                    import win32com.client
                    import pythoncom
                    
                    # Initialize COM library for the current background thread
                    pythoncom.CoInitialize()
                    try:
                        # Initialize SAPI5 voice and file stream
                        synth = win32com.client.Dispatch("SAPI.SpVoice")
                        stream = win32com.client.Dispatch("SAPI.SpFileStream")
                        
                        # Set format to SAFT24kHz16BitMono (Value: 26) to match LiveKit player expectation
                        stream.Format.Type = 26
                        # 3 = SSFMCreateForWrite
                        stream.Open(temp_wav, 3, False)
                        
                        # Synthesize text directly to WAV file
                        synth.AudioOutputStream = stream
                        synth.Speak(input_text)
                        stream.Close()
                    finally:
                        # Always uninitialize COM for the thread
                        pythoncom.CoUninitialize()
                
                if os.path.exists(temp_wav):
                    with open(temp_wav, 'rb') as f:
                        wav_data = f.read()
                    try:
                        os.remove(temp_wav)
                    except Exception:
                        pass
                    
                    is_pcm = data.get('response_format') == 'pcm'
                    print(f"[TTS SERVER] Synthesized {len(wav_data)} bytes. PCM format: {is_pcm}", flush=True)
                    
                    self.send_response(200)
                    if is_pcm:
                        self.send_header('Content-Type', 'audio/pcm')
                        # WAV header is 44 bytes, strip it to get raw PCM
                        audio_data = wav_data[44:]
                    else:
                        self.send_header('Content-Type', 'audio/wav')
                        audio_data = wav_data
                        
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(audio_data)
                    return
                else:
                    print("[TTS SERVER ERROR] temp_wav file not created!", flush=True)
                    self.send_error(500, "Speech synthesis failed")
                    return
            except Exception as e:
                print(f"[TTS SERVER ERROR] Exception: {e}", flush=True)
                self.send_error(500, f"Error: {e}")
                return

        if clean_path in ['/api/instructors', '/api/add_instructor']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                full_name = data.get("full_name")
                phone_number = data.get("phone_number", "")
                experience_years = int(data.get("experience_years", 0))
                subjects_list = data.get("subjects_list", "")
                profile_image = data.get("profile_image", "")
                biography = data.get("biography", "")
                video_id = data.get("video_id")
                locale = data.get("locale", "en_US")
                
                instructor_id = data.get("instructor_id")
                if not instructor_id:
                    instructor_id = full_name.lower().replace(" ", "_")
                
                conn = sqlite3.connect(VAULT_DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO instructors (instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image, biography, locale)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image, biography, locale))
                
                # Disassociate this instructor from all videos first to avoid multiple mappings
                cursor.execute("""
                    UPDATE lesson_metadata
                    SET instructor_id = NULL
                    WHERE instructor_id = ?;
                """, (instructor_id,))
                
                if video_id:
                    # Check if video row exists in lesson_metadata
                    cursor.execute("SELECT 1 FROM lesson_metadata WHERE video_id = ?", (video_id,))
                    exists = cursor.fetchone()
                    if exists:
                        cursor.execute("""
                            UPDATE lesson_metadata
                            SET instructor_id = ?
                            WHERE video_id = ?;
                        """, (instructor_id, video_id))
                    else:
                        cursor.execute("""
                            INSERT INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id)
                            VALUES (?, 'unknown_chapter', 'placeholder.pdf', 1, ?);
                        """, (video_id, instructor_id))
                    
                conn.commit()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "instructor_id": instructor_id}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

    def do_DELETE(self):
        clean_path = self.path.split('?')[0]
        if clean_path == '/api/instructors':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            instructor_id = query_params.get('instructor_id', [None])[0]
            
            if instructor_id:
                try:
                    conn = sqlite3.connect(VAULT_DB_PATH)
                    cursor = conn.cursor()
                    
                    # Disassociate from lesson_metadata to avoid foreign key errors
                    cursor.execute("UPDATE lesson_metadata SET instructor_id = NULL WHERE instructor_id = ?", (instructor_id,))
                    
                    # Delete the instructor
                    cursor.execute("DELETE FROM instructors WHERE instructor_id = ?", (instructor_id,))
                    conn.commit()
                    conn.close()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                    return
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                    return
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Missing instructor_id"}).encode('utf-8'))
                return

class ThreadingTCPServerQuietErrors(socketserver.ThreadingTCPServer):
    def handle_error(self, request, client_address):
        import sys
        exctype, value, tb = sys.exc_info()
        if exctype in (ConnectionResetError, ConnectionAbortedError):
            # Suppress noisy client disconnect tracebacks
            pass
        else:
            super().handle_error(request, client_address)

def start_http_server():
    handler = QuietHTTPRequestHandler
    ThreadingTCPServerQuietErrors.allow_reuse_address = True
    
    # Pre-warm Gandal Space AI Engine in background so first user query has 0s cold start
    def _prewarm_gandal_space():
        try:
            from gandal_space.agent_engine import default_engine
            default_engine._init_gemini()
        except Exception:
            pass
    threading.Thread(target=_prewarm_gandal_space, daemon=True).start()

    # Direct to workspace directory (where display_client.py and index.html are located)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    port = HTTP_PORT
    try:
        httpd = ThreadingTCPServerQuietErrors(("", port), handler)
    except Exception as e:
        port = 8080
        httpd = ThreadingTCPServerQuietErrors(("", port), handler)
        
    print(f"[HTTP] Classroom Fleet Cockpit live at http://127.0.0.1:{port}/ (or http://<device-ip>:{port}/)", flush=True)
    print(f"[SESSION] Canonical session file: {SESSION_JSON_PATH} (exists={os.path.exists(SESSION_JSON_PATH)})", flush=True)
    if not os.environ.get("GOOGLE_API_KEY", "").strip():
        print("[BOOT] GOOGLE_API_KEY is unset — Gemini Live and cloud Gandal Space are unavailable.", flush=True)
    with httpd:
        httpd.serve_forever()

# ---------------------------------------------------------
# 2. WebSocket Server logic
# ---------------------------------------------------------
async def broadcast(message):
    if not connected_clients:
        return
    
    print(f"[WS] Broadcasting payload to {len(connected_clients)} connected client(s)...")
    # Send message to all registered websockets (such as browsers)
    await asyncio.gather(
        *[client.send(message) for client in connected_clients],
        return_exceptions=True
    )

async def run_esim_simulation(project_title, sender):
    print(f"\n[eSIM] New project created: '{project_title}' by {sender}")
    await asyncio.sleep(0.5)
    print("[eSIM] Extracting LanceDB student interest profiles...")
    await asyncio.sleep(0.8)
    print("[CELLULAR] Pushing anonymized vector keys to signaling registry...")
    await asyncio.sleep(0.8)
    print("[P2P] Peer Match Found! Establishing secure WireGuard tunnel with Device_002...")
    await asyncio.sleep(0.5)
    
    # Broadcast status change payload
    status_payload = {
        "action": "MESH_STATUS_UPDATE",
        "status": "Mesh Connection Secure: Device_002 is online"
    }
    await broadcast(json.dumps(status_payload))

async def ws_handler(websocket):
    global active_mic_speaker, MANUAL_LOCALE_SELECTION
    # Register connection
    connected_clients.add(websocket)
    import urllib.parse
    ws_path = ""
    try:
        if hasattr(websocket, "path") and websocket.path:
            ws_path = str(websocket.path)
        elif hasattr(websocket, "request") and websocket.request:
            ws_path = str(getattr(websocket.request, "path", ""))
    except Exception:
        ws_path = ""
    query_params = urllib.parse.parse_qs(urllib.parse.urlparse(ws_path).query)
    student_id = query_params.get("student_id", [None])[0]
    pod_id = query_params.get("pod_id", [None])[0]
    if student_id:
        connected_students_map[websocket] = student_id
    if pod_id:
        connected_pod_map[websocket] = pod_id
        if pod_id not in pod_sessions:
            pod_sessions[pod_id] = {
                "members": [],
                "video_id": "",
                "playback_state": "paused",
                "current_time": 0.0,
                "sockets": set()
            }
        pod_sessions[pod_id]["sockets"].add(websocket)
        if student_id and student_id not in pod_sessions[pod_id]["members"]:
            pod_sessions[pod_id]["members"].append(student_id)
        print(f"[POD AUTO-JOIN] Connected {websocket.remote_address} (student: {student_id}) into pod {pod_id}. Total sockets: {len(pod_sessions[pod_id]['sockets'])}")
    print(f"[WS] Connection opened from {websocket.remote_address} (student: {student_id}, pod: {pod_id}). Total active: {len(connected_clients)}")
    append_network_log(f"WS open {student_id or websocket.remote_address} pod={pod_id or '-'}")
    
    # Send current mic lock status to newly connected client if mic is held
    if active_mic_speaker:
        await websocket.send(json.dumps({"status": "LOCKED", "speaker_id": active_mic_speaker}))

    try:
        async for message in websocket:
            # Parse data packet
            print(f"[WS] Received packet from client {websocket.remote_address}")
            
            try:
                data = json.loads(message)
                act = data.get("action")
                
                if act == "BROADCAST_PROJECT":
                    asyncio.create_task(run_esim_simulation(data.get("project_title"), data.get("sender")))
                elif act == "UPDATE_LOCALE":
                    student_name = data.get("name")
                    locale = data.get("locale", "en_US")
                    MANUAL_LOCALE_SELECTION = locale
                    print(f"[WS] Updating locale preference for {student_name} to {locale}")
                    conn = sqlite3.connect(VAULT_DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                                   (student_name, locale))
                    conn.commit()
                    conn.close()
                elif act == "ONBOARDING_SUBMIT":
                    track_id = data.get("track", "College")
                    locale = data.get("locale", "en_US")
                    print(f"[ONBOARDING] Submitting configs: {data.get('name')} | Track: {track_id} | Locale: {locale}")
                    conn = sqlite3.connect(VAULT_DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES (?, ?)", 
                                   (data.get("name"), track_id))
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                                   (data.get("name"), locale))
                    clean_tracks = []
                    if "|" in track_id:
                        interests, active = track_id.split("|", 1)
                        clean_tracks.extend([t.strip() for t in interests.split(",")])
                        clean_tracks.append(active.strip())
                    else:
                        clean_tracks.extend([t.strip() for t in track_id.split(",")])
                    
                    is_calculus = any(t in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"] for t in clean_tracks)
                    if is_calculus:
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, score, mastery_achieved) VALUES (?, ?, ?, ?)",
                                       ("calculus", "calculus", 100.0, 1))
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, score, mastery_achieved) VALUES (?, ?, ?, ?)",
                                       ("vid_economics_01", "economics_extra_growth", 100.0, 1))
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, score, mastery_achieved) VALUES (?, ?, ?, ?)",
                                       ("vid_calculus_01", "calculus_derivatives", 100.0, 1))
                    conn.commit()
                    conn.close()
                    
                    complete_payload = {
                        "action": "ONBOARDING_COMPLETE",
                        "name": data.get("name"),
                        "track": track_id
                    }
                    await broadcast(json.dumps(complete_payload))
                elif act == "SUBMIT_HANDWRITING_IMAGE":
                    print("[WS] Received SUBMIT_HANDWRITING_IMAGE Base64 frame.")
                    try:
                        import base64
                        img_data = data.get("image_data")
                        if "," in img_data:
                            img_data = img_data.split(",", 1)[1]
                        img_bytes = base64.b64decode(img_data)
                        
                        target_dir = "curriculum_staging"
                        if not os.path.exists(target_dir):
                            os.makedirs(target_dir)
                            
                        captured_file = os.path.join(target_dir, "captured_work.png")
                        with open(captured_file, "wb") as f:
                            f.write(img_bytes)
                        print(f"[WS] Base64 image saved successfully to disk: {captured_file}")
                        
                        udp_payload = {
                            "event": "GPIO_INTERRUPT",
                            "pin": 24,
                            "action": "SUBMIT_HANDWRITING",
                            "image_path": captured_file,
                            "video_id": data.get("video_id", "vid_physics_01"),
                            "chapter_id": data.get("chapter_id", "physics_pendulums"),
                            "quiz_type": data.get("quiz_type", "video_level"),
                            "timestamp": data.get("timestamp")
                        }
                        import socket
                        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                        try:
                            sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                            print(f"[WS -> UDP] Forwarded SUBMIT_HANDWRITING packet with {captured_file} to orchestrator port 8002")
                        except Exception as e:
                            print(f"[WS -> UDP ERROR] Failed to forward: {e}")
                        finally:
                            sock.close()
                    except Exception as e:
                        print(f"[WS ERROR] Failed to save/decode base64 image: {e}")
                elif act == "SUBMIT_HANDWRITING":
                    print(f"[WS] Received SUBMIT_HANDWRITING for path: {data.get('image_path')}")
                    udp_payload = {
                        "event": "GPIO_INTERRUPT",
                        "pin": 24,
                        "action": "SUBMIT_HANDWRITING",
                        "image_path": data.get("image_path", "student_pendulum_work.png"),
                        "video_id": data.get("video_id", "vid_physics_01"),
                        "chapter_id": data.get("chapter_id", "physics_pendulums"),
                        "quiz_type": data.get("quiz_type", "video_level"),
                        "timestamp": data.get("timestamp")
                    }
                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    try:
                        sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                        print("[WS -> UDP] Forwarded SUBMIT_HANDWRITING packet to orchestrator port 8002")
                    except Exception as e:
                        print(f"[WS -> UDP ERROR] Failed to forward: {e}")
                    finally:
                        sock.close()
                elif act == "SUBMIT_QUIZ":
                    track_key = data.get("track", "College")
                    is_alt = data.get("is_alternative", False)
                    student_answers = data.get("answers", {})
                    video_id = data.get("video_id", "vid_physics_01")
                    chapter_id = data.get("chapter_id", "physics_pendulums")
                    is_practice = data.get("is_practice", False)
                    enforce_sentry = data.get("enforce_sentry", False)
                    sentry_frame = data.get("sentry_frame")
                    
                    sentry_verified = True
                    if enforce_sentry:
                        if not sentry_frame or len(sentry_frame) < 100:
                            sentry_verified = False
                            print("[SENTRY ENFORCEMENT] Strict verification failed: No desk camera handwriting frame provided.")
                    
                    correct_count = 0
                    total_count = 0

                    try:
                        conn_q = sqlite3.connect(VAULT_DB_PATH)
                        cur_q = conn_q.cursor()
                        cur_q.execute("""
                            SELECT question_id, correct_option, is_alternative
                            FROM video_quiz_mcqs
                            WHERE video_id = ?
                            ORDER BY is_alternative ASC, question_id ASC
                        """, (video_id,))
                        db_rows = cur_q.fetchall()
                        conn_q.close()

                        if db_rows:
                            main_items = [(r[0], r[1]) for r in db_rows if not r[2]]
                            alt_items = [(r[0], r[1]) for r in db_rows if r[2]]
                            target_db_questions = split_quiz_sets(main_items, alt_items, is_practice, is_alt)
                            total_count = len(target_db_questions)
                            for q_id, correct_ans in target_db_questions:
                                student_ans = lookup_student_answer(student_answers, q_id)
                                if answers_match(student_ans, correct_ans):
                                    correct_count += 1
                    except Exception as q_err:
                        print(f"[QUIZ DB GRADING ERROR] {q_err}")

                    if total_count == 0:
                        bank = QUIZ_QUESTIONS.get(track_key) or {}
                        main_items = [(q.get("id"), q.get("correct")) for q in bank.get("main", [])]
                        alt_items = [(q.get("id"), q.get("correct")) for q in bank.get("alternative", [])]
                        target_questions = split_quiz_sets(main_items, alt_items, is_practice, is_alt)
                        total_count = len(target_questions)
                        for q_id, correct_ans in target_questions:
                            student_ans = lookup_student_answer(student_answers, q_id)
                            if answers_match(student_ans, correct_ans):
                                correct_count += 1
                    
                    score = (correct_count / total_count * 100.0) if total_count > 0 else 0.0
                    mastery_achieved = 1 if (score >= 85.0 and sentry_verified) else 0
                    
                    print(f"[QUIZ SUBMIT] Score: {score:.1f}% ({correct_count}/{total_count}) | Mastery: {mastery_achieved} | Sentry Verified: {sentry_verified}")
                    
                    try:
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS handwriting_archive (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                subject TEXT NOT NULL,
                                video_id TEXT NOT NULL,
                                chapter_id TEXT NOT NULL,
                                image_path TEXT NOT NULL,
                                extracted_text TEXT,
                                score REAL,
                                passed BOOLEAN,
                                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                        """)
                        subject = get_subject_by_video_id(video_id) or "Unknown"
                        quiz_label = "main" if not is_alt else "alt"
                        extracted = json.dumps({
                            "source": "SUBMIT_QUIZ",
                            "quiz_type": quiz_label,
                            "sentry_verified": bool(sentry_verified),
                            "user_id": connected_students_map.get(websocket, "STU-001"),
                        }, ensure_ascii=False)
                        cursor.execute("""
                            INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            subject,
                            video_id,
                            chapter_id,
                            f"quiz_submit/{quiz_label}",
                            extracted,
                            score,
                            1 if mastery_achieved else 0,
                        ))
                        conn.commit()
                        conn.close()
                    except Exception as hw_err:
                        print(f"[HANDWRITING ARCHIVE ERROR] {hw_err}")

                    next_video = None
                    next_chapter = None
                    
                    if not is_practice:
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS mastery_ledger (
                                video_id TEXT NOT NULL,
                                chapter_id TEXT NOT NULL,
                                score REAL,
                                mastery_achieved BOOLEAN NOT NULL CHECK (mastery_achieved IN (0, 1)),
                                PRIMARY KEY (video_id, chapter_id)
                            );
                        """)
                        
                        cursor.execute("""
                            INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, score, mastery_achieved)
                            VALUES (?, ?, ?, ?)
                        """, (video_id, chapter_id, score, mastery_achieved))
                        
                        if mastery_achieved:
                            next_video, next_chapter = find_next_curriculum_lesson(cursor, video_id)
                            if next_video:
                                cursor.execute("UPDATE curriculum_tree SET unlocked = 1 WHERE video_id = ? AND chapter_id = ?",
                                               (next_video, next_chapter))
                                print(f"[QUIZ] Unlocked next lesson: {next_video} ({next_chapter})")
                        
                        conn.commit()
                        conn.close()
                    
                    quiz_result_payload = {
                        "action": "QUIZ_RESULT",
                        "score": score,
                        "passed": bool(mastery_achieved),
                        "mastery_achieved": bool(mastery_achieved),
                        "video_id": video_id,
                        "chapter_id": chapter_id,
                        "is_alternative": is_alt,
                        "is_practice": is_practice,
                        "enforce_sentry": enforce_sentry,
                        "sentry_verified": sentry_verified,
                        "next_video": next_video,
                        "next_chapter": next_chapter
                    }
                    await broadcast(json.dumps(quiz_result_payload))
                elif act == "GANDAL_SPACE_ASK":
                    prompt = data.get("prompt", "")
                    try:
                        from gandal_space.agent_engine import default_engine
                        res = default_engine.process_query(prompt)
                    except Exception as err:
                        res = {"success": False, "error": str(err)}
                    await websocket.send(json.dumps({
                        "action": "GANDAL_SPACE_RESPONSE",
                        "result": res
                    }))

                elif act == "GANDAL_SPACE_AUDIO":
                    try:
                        from gandal_space.agent_engine import default_engine
                        eval_res = default_engine.evaluate_pronunciation(
                            target_letter=data.get("target_letter", "A"),
                            expected_phoneme=data.get("expected_phoneme", "/eɪ/"),
                            student_transcript=data.get("student_transcript", ""),
                            audio_base64=data.get("audio_base64", "")
                        )
                    except Exception as err:
                        eval_res = {"type": "AudioFeedback", "status": "retry", "score": 60, "feedback_text": str(err)}
                    await websocket.send(json.dumps({
                        "action": "GANDAL_SPACE_AUDIO_RESPONSE",
                        "result": eval_res
                    }))

                elif act == "RAISE_HAND":
                    print(f"[WS] Received RAISE_HAND from client")
                    print(f"[WS] Hand-raise query detected. Broadcasting PAUSE_VIDEO to client.")
                    pause_payload = {
                        "action": "PAUSE_VIDEO",
                        "reason": "hand_raise_voice_input"
                    }
                    await broadcast(json.dumps(pause_payload))
                    question_text = (data.get("question") or data.get("query") or "").strip()
                    if not question_text:
                        question_text = (
                            "The student just raised their hand on the microphone. "
                            "Greet them as Gandho and begin Socratic tutoring for the current lesson."
                        )
                    udp_payload = {
                        "event": "GPIO_INTERRUPT",
                        "pin": 22,
                        "action": "RAISE_HAND",
                        "query": question_text,
                        "video_id": data.get("video_id"),
                        "timestamp_marker": data.get("timestamp") or data.get("timestamp_marker"),
                        "mode": data.get("mode") or DEPLOYMENT_MODE,
                        "is_quiz": data.get("is_quiz", False),
                        "quiz_question": data.get("quiz_question", ""),
                        "locale": data.get("locale", "en_US")
                    }
                    forward_gpio_udp(udp_payload)
                    append_network_log(f"RAISE_HAND {data.get('student_id') or ''} {question_text[:80]}")
                elif (act and act.startswith("POD_")) or act in ["START_STREAM", "STOP_STREAM", "LESSON_COMPLETE", "SUBMIT_LAB_QUIZ"] or (data.get("pod_id") or connected_pod_map.get(websocket)):
                    pod_id = data.get("pod_id") or connected_pod_map.get(websocket)
                    
                    if act == "POD_CREATE":
                        import random, string
                        new_pod_id = f"POD-{''.join(random.choices(string.digits, k=4))}"
                        members_raw = data.get("student_ids") or [data.get("student_id") or "Student"]
                        if isinstance(members_raw, str):
                            members = [m.strip() for m in members_raw.split(",") if m.strip()]
                        else:
                            members = members_raw
                        
                        pod_sessions[new_pod_id] = {
                            "members": members,
                            "video_id": data.get("video_id", ""),
                            "playback_state": "paused",
                            "current_time": 0.0,
                            "sockets": {websocket}
                        }
                        connected_pod_map[websocket] = new_pod_id
                        print(f"[LAB WS] Created {new_pod_id} for members: {members}")
                        res = json.dumps({"action": "POD_CREATED", "pod_id": new_pod_id, "members": members})
                        await websocket.send(res)
                        
                    elif act == "POD_JOIN":
                        target_pod = data.get("pod_id") or connected_pod_map.get(websocket)
                        members_raw = data.get("student_ids") or [data.get("student_id") or "Student"]
                        if isinstance(members_raw, str):
                            new_members = [m.strip() for m in members_raw.split(",") if m.strip()]
                        else:
                            new_members = members_raw
                            
                        if target_pod not in pod_sessions:
                            pod_sessions[target_pod] = {
                                "members": [],
                                "video_id": data.get("video_id", ""),
                                "playback_state": "paused",
                                "current_time": 0.0,
                                "sockets": set()
                            }
                        
                        pod_sessions[target_pod]["sockets"].add(websocket)
                        connected_pod_map[websocket] = target_pod
                        for nm in new_members:
                            if nm not in pod_sessions[target_pod]["members"]:
                                pod_sessions[target_pod]["members"].append(nm)
                        
                        print(f"[LAB WS] Joined {target_pod}. Members: {pod_sessions[target_pod]['members']}, Total Sockets: {len(pod_sessions[target_pod]['sockets'])}")
                        join_res = json.dumps({
                            "action": "POD_JOINED",
                            "pod_id": target_pod,
                            "members": pod_sessions[target_pod]["members"],
                            "video_id": pod_sessions[target_pod]["video_id"],
                            "playback_state": pod_sessions[target_pod]["playback_state"],
                            "current_time": pod_sessions[target_pod]["current_time"]
                        })
                        await broadcast_to_pod(target_pod, join_res)

                    elif act in ["POD_MEDIA_CONTROL", "POD_TIME_SYNC"]:
                        p_id = data.get("pod_id") or connected_pod_map.get(websocket)
                        cmd = data.get("command")
                        cur_time = data.get("current_time", 0.0)
                        
                        if DEPLOYMENT_MODE == "CLASSROOM":
                            sync_msg = json.dumps({
                                "action": "POD_MEDIA_CONTROL",
                                "command": cmd,
                                "current_time": cur_time,
                                "sender": data.get("sender", "Teacher"),
                                "deployment_mode": "CLASSROOM"
                            })
                            for ws in list(connected_clients):
                                if ws != websocket:
                                    try:
                                        await ws.send(sync_msg)
                                    except Exception:
                                        pass
                        else:
                            if p_id in pod_sessions:
                                if cmd in ["play", "pause"]:
                                    pod_sessions[p_id]["playback_state"] = cmd
                                pod_sessions[p_id]["current_time"] = cur_time
                                sync_msg = json.dumps({
                                    "action": "POD_MEDIA_CONTROL",
                                    "command": cmd,
                                    "current_time": cur_time,
                                    "sender": data.get("sender", "Peer"),
                                    "deployment_mode": "LAB"
                                })
                                await broadcast_to_pod(p_id, sync_msg, exclude_ws=websocket)

                    elif act == "START_STREAM":
                        p_id = data.get("pod_id") or connected_pod_map.get(websocket)
                        speaker_id = data.get("student_id") or connected_students_map.get(websocket, "Student")
                        lock_pkt = json.dumps({
                            "status": "LOCKED",
                            "speaker_id": speaker_id,
                            "action": "PAUSE_VIDEO",
                            "reason": "student_speaking"
                        })
                        if DEPLOYMENT_MODE == "CLASSROOM" or not p_id or p_id == "CLASSROOM_ALL":
                            for ws in list(connected_clients):
                                try:
                                    await ws.send(lock_pkt)
                                except Exception:
                                    pass
                        else:
                            if p_id in pod_sessions:
                                await broadcast_to_pod(p_id, lock_pkt)
                            else:
                                for ws in list(connected_clients):
                                    try:
                                        await ws.send(lock_pkt)
                                    except Exception:
                                        pass

                    elif act == "STOP_STREAM":
                        p_id = data.get("pod_id") or connected_pod_map.get(websocket)
                        unlock_pkt = json.dumps({
                            "status": "UNLOCKED",
                            "action": "RESUME_VIDEO"
                        })
                        if DEPLOYMENT_MODE == "CLASSROOM" or not p_id or p_id == "CLASSROOM_ALL":
                            for ws in list(connected_clients):
                                try:
                                    await ws.send(unlock_pkt)
                                except Exception:
                                    pass
                        else:
                            if p_id in pod_sessions:
                                await broadcast_to_pod(p_id, unlock_pkt)
                            else:
                                for ws in list(connected_clients):
                                    try:
                                        await ws.send(unlock_pkt)
                                    except Exception:
                                        pass

                    elif act == "LESSON_COMPLETE":
                        p_id = data.get("pod_id") or connected_pod_map.get(websocket)
                        if p_id in pod_sessions:
                            await broadcast_to_pod(p_id, json.dumps({
                                "action": "LESSON_COMPLETE",
                                "video_id": data.get("video_id"),
                                "sender": data.get("student_id")
                            }), exclude_ws=websocket)

                    elif act == "SUBMIT_LAB_QUIZ":
                        p_id = data.get("pod_id") or connected_pod_map.get(websocket)
                        s_id = data.get("student_id") or connected_students_map.get(websocket, "Student")
                        v_id = data.get("video_id", "vid_physics_01")
                        c_id = data.get("chapter_id", "General")
                        score = data.get("score", 0)
                        passed = (score >= 85)
                        
                        conn = sqlite3.connect(VAULT_DB_PATH)
                        cursor = conn.cursor()
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, score, mastery_achieved) VALUES (?, ?, ?, ?)",
                                       (v_id, f"student_{s_id}", score, 1 if passed else 0))
                        conn.commit()
                        conn.close()
                        
                        if p_id:
                            if p_id not in pod_sessions:
                                pod_sessions[p_id] = {"members": [s_id], "scores": {}, "sockets": {websocket}}
                            if "scores" not in pod_sessions[p_id]:
                                pod_sessions[p_id]["scores"] = {}
                            pod_sessions[p_id]["scores"][s_id] = score
                            
                            members = pod_sessions[p_id].get("members", [s_id])
                            scores = pod_sessions[p_id]["scores"]
                            
                            # Check if every single member in the pod has achieved >= 85%
                            all_passed = len(members) > 0 and all(scores.get(m, 0) >= 85 for m in members)
                            pending_members = [m for m in members if scores.get(m, 0) < 85]
                            
                            print(f"[POD EVALUATION] Student {s_id} scored {score}% in Pod {p_id}. All Passed: {all_passed}. Pending: {pending_members}")
                            
                            quiz_res = json.dumps({
                                "action": "QUIZ_RESULT",
                                "student_id": s_id,
                                "score": score,
                                "passed": passed,
                                "pod_all_passed": all_passed,
                                "pending_members": pending_members,
                                "members_status": {m: {"score": scores.get(m, 0), "passed": scores.get(m, 0) >= 85} for m in members}
                            })
                            
                            await broadcast_to_pod(p_id, quiz_res)
                        else:
                            quiz_res = json.dumps({
                                "action": "QUIZ_RESULT",
                                "student_id": s_id,
                                "score": score,
                                "passed": passed,
                                "pod_all_passed": passed,
                                "pending_members": [] if passed else [s_id]
                            })
                            await websocket.send(quiz_res)

                    else:
                        if pod_id and pod_id in pod_sessions:
                            await broadcast_to_pod(pod_id, message, exclude_ws=websocket)
                        else:
                            await websocket.send(message)
                else:
                    # SINGLE and CLASSROOM mode (BROADCAST ROOM-WIDE)
                    await broadcast(message)
                    if act == "START_STREAM":
                        speaker_id = data.get("student_id") or connected_students_map.get(websocket, "Student")
                        active_mic_speaker = speaker_id
                        print(f"[CLASSROOM WS] Mic stream START by speaker: {speaker_id}")
                        await broadcast(json.dumps({"status": "LOCKED", "speaker_id": speaker_id}))
                        await broadcast(json.dumps({"action": "PAUSE_VIDEO", "reason": "student_speaking", "speaker_id": speaker_id}))
                    elif act == "STOP_STREAM":
                        speaker_id = data.get("student_id") or connected_students_map.get(websocket, "Student")
                        active_mic_speaker = None
                        print(f"[CLASSROOM WS] Mic stream STOP by speaker: {speaker_id}")
                        await broadcast(json.dumps({"status": "UNLOCKED"}))
                        await broadcast(json.dumps({"action": "RESUME_VIDEO"}))
                    elif act == "RAISE_HAND":
                        print(f"[WS] Hand-raise query detected. Broadcasting PAUSE_VIDEO to client.")
                        pause_payload = {
                            "action": "PAUSE_VIDEO",
                            "reason": "hand_raise_voice_input"
                        }
                        await broadcast(json.dumps(pause_payload))
                        
                        question_text = data.get("question")
                        if question_text:
                            udp_payload = {
                                "event": "GPIO_INTERRUPT",
                                "pin": 22,
                                "action": "RAISE_HAND",
                                "query": question_text,
                                "video_id": data.get("video_id"),
                                "timestamp_marker": data.get("timestamp") or data.get("timestamp_marker"),
                                "mode": data.get("mode"),
                                "is_quiz": data.get("is_quiz", False),
                                "quiz_question": data.get("quiz_question", ""),
                                "locale": data.get("locale", "en_US")
                            }
                            import socket
                            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                            try:
                                sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                                print(f"[WS -> UDP] Forwarded RAISE_HAND question '{question_text}' to orchestrator port 8002")
                            except Exception as e:
                                print(f"[WS -> UDP ERROR] Failed to forward: {e}")
                            finally:
                                sock.close()

                    # UDP Orchestrator handles intelligent RAG response & broadcasting to avoid double replies
                    pass
            except Exception as e:
                print(f"[WS PACKET ERROR] {e}")
                
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Unregister connection
        connected_clients.remove(websocket)
        st_id = connected_students_map.pop(websocket, None)
        if active_mic_speaker and active_mic_speaker == st_id:
            active_mic_speaker = None
            print(f"[CLASSROOM WS] Active speaker {st_id} disconnected. Unlocking classroom mic.")
            await broadcast(json.dumps({"status": "UNLOCKED"}))
            await broadcast(json.dumps({"action": "RESUME_VIDEO"}))
        print(f"[WS] Connection closed with {websocket.remote_address} (student: {st_id}). Total active: {len(connected_clients)}")

async def start_ws_server():
    global MAIN_ASYNCIO_LOOP
    MAIN_ASYNCIO_LOOP = asyncio.get_running_loop()
    # Bind to 0.0.0.0 to allow incoming local client connections
    async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
        print(f"[WS] WebSocket server listening on ws://localhost:{WS_PORT}", flush=True)
        await asyncio.Future()  # run forever

# ---------------------------------------------------------
# 3. Main Launch Event
# ---------------------------------------------------------
if __name__ == "__main__":
    print("=== STARTING INTERFACE DISPLAY CLIENT SERVER ===", flush=True)
    if _port_in_use(WS_PORT) or _port_in_use(HTTP_PORT):
        print(
            "[HTTP] display_client.py is already running.\n"
            "  Open http://127.0.0.1:8000  (or http://127.0.0.1:8080)\n"
            "  Do not start a second copy — that is the 'address already in use' crash.\n"
            "To restart:\n"
            "  pkill -f 'python3 display_client.py'\n"
            "  pkill -f 'python display_client.py'\n"
            "  python3 display_client.py",
            flush=True,
        )
        sys.exit(0)
    # Start HTTP server in a daemon thread (closes automatically when main script exits)
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Run the WebSocket server in the main asyncio loop
    try:
        asyncio.run(start_ws_server())
    except OSError as err:
        print(
            f"[WS] Could not bind port {WS_PORT}: {err}\n"
            "Another display_client.py still owns 8001. Kill it, then start once:\n"
            "  pkill -f display_client.py\n"
            "  python3 display_client.py",
            flush=True,
        )
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Terminating display client servers. Exiting...", flush=True)
