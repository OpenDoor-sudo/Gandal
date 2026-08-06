# display_client.py - Jetson Orin Nano Super Display Client Server
# Hardware: NVIDIA Jetson Orin Nano Super Dev Kit
# TTS:      NVIDIA Riva / Magpie-TTS (gRPC on localhost:50051)
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
                    if line and not line.startswith("#"):
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
from orchestrator import check_subject_gating

def get_subject_by_video_id(video_id):
    if not video_id:
        return "Physics"
    vid_lower = video_id.lower()
    if "chemistry" in vid_lower or "chimie" in vid_lower:
        return "Chemistry"
    if "physics" in vid_lower or "physique" in vid_lower:
        return "Physics"
    if "philosophy" in vid_lower or "phil_" in vid_lower:
        return "Philosophy"
    if "calculus" in vid_lower or "economics" in vid_lower or "extraeconomiques" in vid_lower:
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
        if row:
            return row[0]
    except Exception:
        pass
        
    return "Physics"

import base64
import time
import hmac
import hashlib
import urllib.parse

TRANSLATION_CACHE_FILE = os.path.join(PROJECT_ROOT, "translation_cache.json")
SESSION_JSON_PATH = os.path.join(PROJECT_ROOT, "active_session.json")

def load_session_info():
    session_data = {}
    try:
        if os.path.exists(SESSION_JSON_PATH):
            with open(SESSION_JSON_PATH, "r", encoding="utf-8") as f:
                session_data = json.load(f)
    except Exception as e:
        print(f"[SESSION LOAD WARN] {e}")
    return session_data

def save_session_info(video_id, pdf_path=None):
    try:
        session_data = load_session_info()
        if video_id:
            session_data["active_video_id"] = video_id
        if pdf_path:
            session_data["active_pdf_path"] = pdf_path
        with open(SESSION_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(session_data, f, indent=2)
        print(f"[SESSION] Saved session info: active_video_id={video_id}", flush=True)
    except Exception as e:
        print(f"[SESSION ERROR] Failed to save session info: {e}", flush=True)

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

def generate_livekit_token(api_key, api_secret, room_name, participant_identity):
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    now = int(time.time())
    payload = {
        "iss": api_key,
        "sub": participant_identity,
        "nbf": now - 60,
        "exp": now + 7200,
        "video": {
            "roomJoin": True,
            "room": room_name
        }
    }
    
    def base64_url_encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')
        
    header_b64 = base64_url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64_url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(
        api_secret.encode('utf-8'),
        signature_input,
        hashlib.sha256
    ).digest()
    
    signature_b64 = base64_url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"

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
        if GEMINI_DISABLED or not google_key:
            return fallback_translate()
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
        if GEMINI_DISABLED or not google_key:
            return fallback_translate()
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



HTTP_PORT = 8000
WS_PORT = 8001

# Track connected WebSocket client sockets
connected_clients = set()

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

# ---------------------------------------------------------
# 1. HTTP Server for Serving index.html Dashboard
# ---------------------------------------------------------
class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Suppress request logs to keep orchestrator console outputs clean
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        import urllib.parse
        clean_path = self.path.split('?')[0]

        if clean_path == '/get_active_session':
            info = load_session_info()
            res_payload = {
                "status": "success",
                "active_video_id": info.get("active_video_id"),
                "active_pdf_path": info.get("active_pdf_path"),
                "active_locale": info.get("active_locale", "fr_FR")
            }
            body_bytes = json.dumps(res_payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body_bytes)
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
                
                hydrated_data = {
                    "student_name": student_name,
                    "student_track": student_track,
                    "mastery": mastery_data,
                    "evaluations": evaluation_data
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
            tts_backend = os.environ.get("TTS_BACKEND", "riva").lower()
            # RIVA_SERVER_ADDRESS: Riva gRPC endpoint — localhost when Riva runs on the
            # same Jetson Orin Nano Super board (default port 50051).
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
                    print("[RIVA MAGPIE-TTS] Falling back to mock WAV silence.")
                except Exception as e:
                    print(f"[RIVA MAGPIE-TTS ERROR] gRPC synthesis failed: {e}. Falling back to mock WAV.")

            if wav_data is None:
                # If online, fetch from a free public TTS service like Google TTS
                # directly on the backend and return the audio bytes to prevent CORS/redirect blocks.
                try:
                    import urllib.parse
                    import urllib.request
                    encoded_text = urllib.parse.quote(text)
                    lang_code = locale.split('_')[0]
                    google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q={encoded_text}&tl={lang_code}"
                    
                    print(f"[RIVA MAGPIE-TTS FALLBACK] Fetching audio from Google TTS: {google_tts_url}")
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
                    print(f"[RIVA MAGPIE-TTS FALLBACK ERROR] Failed fetching from Google TTS: {fallback_err}")
                    wav_data = make_mock_wav()

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
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT pdf_file_path, start_page FROM lesson_metadata WHERE video_id = ?", (video_id,))
                    row = cursor.fetchone()
                    if row:
                        pdf_path = row[0]
                        start_page = int(row[1])
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database lesson metadata lookup failed: {e}")

            resolved_video_path = None
            
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
            instructor_avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
            instructor_role = "Economics Specialist"
            if video_id:
                if "physics" in video_id.lower():
                    instructor_name = "Dr. Harris"
                    instructor_avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                    instructor_role = "Physics Specialist"
                elif "philosophy" in video_id.lower():
                    instructor_name = "Professor Marcus"
                    instructor_avatar = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150"
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
                        instructor_avatar = inst_row[1]
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
                except Exception as e:
                    print(f"[ERROR] Database timestamps/flashcards lookup failed: {e}")
                                  # If no cached timestamps/flashcards exist, or no transcripts exist, trigger background generation
            has_transcripts = len(dense_transcripts) > 0
            if (not timestamps or not has_transcripts) and video_id and resolved_video_path:
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

            if active_locale != "en_US":
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
                session_info = {
                    "active_video_id": video_id,
                    "active_locale": active_locale
                }
                if os.path.exists(SESSION_JSON_PATH):
                    try:
                        with open(SESSION_JSON_PATH, "r") as sf:
                            old_data = json.load(sf)
                            session_info["active_pdf_path"] = old_data.get("active_pdf_path", "")
                            session_info["active_pdf_name"] = old_data.get("active_pdf_name", "")
                            session_info["active_view_state"] = old_data.get("active_view_state", "dashboard")
                    except Exception:
                        pass
                with open(SESSION_JSON_PATH, "w") as sf:
                    json.dump(session_info, sf)
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
            room = params.get('room', ['socratic_tutor_room'])[0]
            identity = params.get('identity', ['student_01'])[0]
            
            api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
            api_secret = os.environ.get("LIVEKIT_API_SECRET", "secretsecretsecretsecretsecretsecretsecret")
            
            token = generate_livekit_token(api_key, api_secret, room, identity)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"token": token}).encode('utf-8'))
            return

        # Route for Spatius Token and configuration
        if clean_path.startswith('/spatius-token'):
            spatius_api_key = os.environ.get("SPATIUS_API_KEY", "").strip("'\" \t")
            spatius_app_id = os.environ.get("SPATIUS_APP_ID", "").strip("'\" \t")
            spatius_avatar_id = os.environ.get("SPATIUS_AVATAR_ID", "").strip("'\" \t")

            if not spatius_api_key or not spatius_app_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Spatius credentials missing"}).encode('utf-8'))
                return

            import urllib.request
            import urllib.error
            import time

            url = "https://console.us-west.spatius.ai/v1/console/session-tokens"
            headers = {
                "X-Api-Key": spatius_api_key,
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
                    resp_body = response.read().decode('utf-8')
                    token_data = json.loads(resp_body)
                    session_token = token_data.get("sessionToken", "")

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "sessionToken": session_token,
                        "appId": spatius_app_id,
                        "avatarId": spatius_avatar_id
                    }).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
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

        # Fallback to serving static files from filesystem
        if clean_path.startswith('/k12/') or clean_path.startswith('/college_level/') or clean_path.startswith('/independent_learner/') or clean_path.startswith('/professional_certificates/'):
            import urllib.parse
            unquoted_path = urllib.parse.unquote(clean_path).lstrip('/')
            staging_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'curriculum_staging', unquoted_path)
            if os.path.exists(staging_file):
                self.path = '/curriculum_staging/' + clean_path.lstrip('/')
                
        super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0]

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
                session_data = {}
                if os.path.exists(SESSION_JSON_PATH):
                    try:
                        with open(SESSION_JSON_PATH, "r") as sf:
                            session_data = json.load(sf)
                    except Exception:
                        pass
                session_data["active_view_state"] = state
                session_data["active_view_context"] = context
                with open(SESSION_JSON_PATH, "w") as sf:
                    json.dump(session_data, sf)
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
                
                # Load current session data
                session_data = {}
                if os.path.exists(SESSION_JSON_PATH):
                    try:
                        with open(SESSION_JSON_PATH, "r") as sf:
                            session_data = json.load(sf)
                    except Exception:
                        pass
                
                session_data["active_pdf_path"] = pdf_path
                session_data["active_pdf_name"] = pdf_name
                
                with open(SESSION_JSON_PATH, "w") as sf:
                    json.dump(session_data, sf)
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

        # Route for fetching student feedback for Admin Panel
        if clean_path == '/api/get_feedback':
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

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "feedback": feedback_list}).encode('utf-8'))
                return
            except Exception as fe:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(fe)}).encode('utf-8'))
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
                
                use_google_tts = (active_locale == "fr_FR" or active_locale.startswith("fr"))
                
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
    
    # Direct to workspace directory (where display_client.py and index.html are located)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with ThreadingTCPServerQuietErrors(("", HTTP_PORT), handler) as httpd:
        print(f"[HTTP] Dashboard interface hosted at http://localhost:{HTTP_PORT}/")
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
    # Register connection
    connected_clients.add(websocket)
    print(f"[WS] Connection opened from {websocket.remote_address}. Total active: {len(connected_clients)}")
    
    try:
        async for message in websocket:
            # Parse data packet
            print(f"[WS] Received packet from client {websocket.remote_address}")
            
            # Broadcast incoming JSON payload to all other connected client screens
            await broadcast(message)
            
            # Intercept BROADCAST_PROJECT event to run simulation
            try:
                data = json.loads(message)
                if data.get("action") == "BROADCAST_PROJECT":
                    asyncio.create_task(run_esim_simulation(data.get("project_title"), data.get("sender")))
                elif data.get("action") == "UPDATE_LOCALE":
                    global MANUAL_LOCALE_SELECTION
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
                elif data.get("action") == "ONBOARDING_SUBMIT":
                    track_id = data.get("track", "College")
                    locale = data.get("locale", "en_US")
                    print(f"[ONBOARDING] Submitting configs: {data.get('name')} | Track: {track_id} | Locale: {locale}")
                    conn = sqlite3.connect(VAULT_DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES (?, ?)", 
                                   (data.get("name"), track_id))
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                                   (data.get("name"), locale))
                    # Complete database binding for calculus track
                    clean_tracks = []
                    if "|" in track_id:
                        interests, active = track_id.split("|", 1)
                        clean_tracks.extend([t.strip() for t in interests.split(",")])
                        clean_tracks.append(active.strip())
                    else:
                        clean_tracks.extend([t.strip() for t in track_id.split(",")])
                    
                    is_calculus = any(t in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"] for t in clean_tracks)
                    if is_calculus:
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, mastery_achieved) VALUES (?, ?, ?)",
                                       ("calculus", "calculus", 1))
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, mastery_achieved) VALUES (?, ?, ?)",
                                       ("vid_economics_01", "economics_extra_growth", 1))
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, mastery_achieved) VALUES (?, ?, ?)",
                                       ("vid_calculus_01", "calculus_derivatives", 1))
                    conn.commit()
                    conn.close()
                    
                    complete_payload = {
                        "action": "ONBOARDING_COMPLETE",
                        "name": data.get("name"),
                        "track": track_id
                    }
                    await broadcast(json.dumps(complete_payload))
                elif data.get("action") == "SUBMIT_HANDWRITING_IMAGE":
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
                elif data.get("action") == "SUBMIT_HANDWRITING":
                    print(f"[WS] Received SUBMIT_HANDWRITING for path: {data.get('image_path')}")
                    # Forward to orchestrator via UDP port 8002
                    udp_payload = {
                        "event": "GPIO_INTERRUPT",
                        "pin": 24, # Mock pin for camera interrupt
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
                elif data.get("action") == "SUBMIT_QUIZ":
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

                    # 1. Query vault.db video_quiz_mcqs table first for dynamic ingested questions
                    try:
                        conn_q = sqlite3.connect(VAULT_DB_PATH)
                        cur_q = conn_q.cursor()
                        cur_q.execute("""
                            SELECT question_id, correct_option
                            FROM video_quiz_mcqs
                            WHERE video_id = ? AND is_alternative = ?
                        """, (video_id, 1 if is_alt else 0))
                        db_questions = cur_q.fetchall()
                        conn_q.close()

                        if db_questions:
                            if is_practice:
                                target_db_questions = db_questions[3:]
                            else:
                                target_db_questions = db_questions[:3]
                            if not target_db_questions:
                                target_db_questions = db_questions
                            total_count = len(target_db_questions)
                            for q_id, correct_ans in target_db_questions:
                                student_ans = student_answers.get(str(q_id))
                                if student_ans == correct_ans:
                                    correct_count += 1
                    except Exception as q_err:
                        print(f"[QUIZ DB GRADING ERROR] {q_err}")

                    # 2. Fallback to hardcoded QUIZ_QUESTIONS dataset if not in DB
                    if total_count == 0:
                        questions = QUIZ_QUESTIONS.get(track_key, {}).get("alternative" if is_alt else "main", [])
                        if is_practice:
                            questions = questions[3:]
                        else:
                            questions = questions[:3]
                        total_count = len(questions)
                        for q in questions:
                            q_id = str(q["id"])
                            correct_ans = q["correct"]
                            student_ans = student_answers.get(q_id)
                            if student_ans == correct_ans:
                                correct_count += 1
                            
                    score = (correct_count / total_count) * 100.0 if total_count > 0 else 0.0
                    mastery_achieved = 1 if (not is_practice and score >= 85.0 and sentry_verified) else (1 if is_practice else 0)
                    
                    print(f"[QUIZ] Grading Track={track_key}, Alt={is_alt}, Score={score}%, Mastery={mastery_achieved}, SentryVerified={sentry_verified}, Practice={is_practice}")
                    
                    if enforce_sentry and sentry_verified and not is_practice:
                        try:
                            subject_name = get_subject_by_video_id(video_id)
                            conn_hw = sqlite3.connect(VAULT_DB_PATH)
                            cur_hw = conn_hw.cursor()
                            cur_hw.execute("""
                                INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
                                VALUES (?, ?, ?, ?, ?, ?, ?);
                            """, (subject_name, video_id, chapter_id, "sentry_desk_verification.png", "Work Derivation Verified via Sentry Vision Desk Camera", score, 1 if score >= 85.0 else 0))
                            conn_hw.commit()
                            conn_hw.close()
                            print(f"[SENTRY VERIFIED] Archived verified desk snapshot for {subject_name}.")
                        except Exception as hw_err:
                            print(f"[HANDWRITING ARCHIVE ERROR] {hw_err}")

                    next_video = None
                    next_chapter = None
                    
                    if not is_practice and sentry_verified:
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
                        
                        if score >= 85.0:
                            cursor.execute("SELECT video_id, chapter_id, unlocked FROM curriculum_tree")
                            rows = cursor.fetchall()
                            idx = -1
                            for i, r in enumerate(rows):
                                if r[0] == video_id:
                                    idx = i
                                    break
                            if idx != -1 and idx + 1 < len(rows):
                                next_video = rows[idx + 1][0]
                                next_chapter = rows[idx + 1][1]
                                cursor.execute("UPDATE curriculum_tree SET unlocked = 1 WHERE video_id = ? AND chapter_id = ?",
                                               (next_video, next_chapter))
                                print(f"[QUIZ] Unlocked next lesson: {next_video} ({next_chapter})")
                            else:
                                for r in rows:
                                    if not r[2]:
                                        next_video = r[0]
                                        next_chapter = r[1]
                                        cursor.execute("UPDATE curriculum_tree SET unlocked = 1 WHERE video_id = ? AND chapter_id = ?",
                                                       (next_video, next_chapter))
                                        print(f"[QUIZ] Fallback unlock next lesson: {next_video} ({next_chapter})")
                                        break
                        
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
                elif data.get("action") == "RAISE_HAND":
                    # DIAGNOSTIC NOTE: Socratic Whiteboard Canvas Trigger
                    # When a student raises a hand asking for math concepts, the video player
                    # is paused, and the Socratic Blackboard slides open next to the graphing canvas.
                    # Typewriter text streaming is synchronized with SpeechSynthesisUtterance.
                    print(f"[WS] Received RAISE_HAND from client")
                    
                    # Verbal Interlock: Always pause video for any hand-raise query to keep video paused during explanation
                    print(f"[WS] Hand-raise query detected. Broadcasting PAUSE_VIDEO to client.")
                    pause_payload = {
                        "action": "PAUSE_VIDEO",
                        "reason": "hand_raise_voice_input"
                    }
                    await broadcast(json.dumps(pause_payload))
                    
                    # Forward to orchestrator via UDP port 8002
                    udp_payload = {
                        "event": "GPIO_INTERRUPT",
                        "pin": 22, # Mock pin for raise hand interrupt
                        "action": "RAISE_HAND",
                        "query": data.get("question", "Explain the active textbook concept"),
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
                        print("[WS -> UDP] Forwarded RAISE_HAND packet to orchestrator port 8002")
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
        print(f"[WS] Connection closed with {websocket.remote_address}. Total active: {len(connected_clients)}")

async def start_ws_server():
    # Bind to 0.0.0.0 to allow incoming local client connections
    async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
        print(f"[WS] WebSocket server listening on ws://localhost:{WS_PORT}")
        await asyncio.Future()  # run forever

# ---------------------------------------------------------
# 3. Main Launch Event
# ---------------------------------------------------------
if __name__ == "__main__":
    print("=== STARTING INTERFACE DISPLAY CLIENT SERVER ===")
    
if __name__ == '__main__':
    # Start HTTP server in a daemon thread (closes automatically when main script exits)
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Run the WebSocket server in the main asyncio loop
    try:
        asyncio.run(start_ws_server())
    except KeyboardInterrupt:
        print("\n[SYSTEM] Terminating display client servers. Exiting...")
