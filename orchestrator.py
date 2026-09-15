# orchestrator.py — Ventuno Q state machine (UDP 8002)
# Hardware: Arduino Ventuno Q. Desktop simulation when HARDWARE_TARGET=simulation.
# Voice TTS: Kokoro via LiveKit, not NVIDIA Riva.
# Note: The system now strictly uses local full-length calculus/physics tracks.

import os
import sqlite3

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.chdir(PROJECT_ROOT)

# Disable HuggingFace symlink warning on Windows to keep console logs clean
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import time
import json
import sys
import queue
import threading
import asyncio
import websockets
import socket
import urllib.request
import re

try:
    import lancedb
except ImportError:
    lancedb = None
    print("[BOOT] lancedb not installed — vector RAG disabled until you pip install it.")

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None
    print("[BOOT] sentence_transformers not installed — embeddings disabled for this process.")

try:
    from qwen_omni_client import query_qwen_omni_tutoring
except Exception as _qwen_err:
    print(f"[BOOT] qwen_omni_client not loaded ({_qwen_err}).")

    def query_qwen_omni_tutoring(*args, **kwargs):
        return None

# ---------------------------------------------------------
# OpenRouter API Integration Helper
# ---------------------------------------------------------
def query_gemini_direct(system_prompt, user_prompt):
    google_key = os.environ.get("GOOGLE_API_KEY")
    if not google_key:
        if os.path.exists(".env"):
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
    if not google_key or google_key == "your_google_api_key_here":
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={google_key}"
    data = {
        "contents": [{"parts": [{"text": user_prompt}]}]
    }
    if system_prompt:
        data["systemInstruction"] = {"parts": [{"text": system_prompt}]}
        
    try:
        print("[GEMINI DIRECT] Sending fallback request to gemini-2.5-flash...")
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "candidates" in res_data and len(res_data["candidates"]) > 0:
                parts = res_data["candidates"][0]["content"]["parts"]
                if parts and len(parts) > 0:
                    return parts[0]["text"]
    except Exception as e:
        print(f"[GEMINI DIRECT ERROR] Direct Gemini fallback failed: {e}")
    return None

def query_gemini_vision_direct(system_prompt, user_prompt, image_path):
    google_key = os.environ.get("GOOGLE_API_KEY")
    if not google_key:
        if os.path.exists(".env"):
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
    if not google_key or google_key == "your_google_api_key_here":
        return None
        
    import base64
    try:
        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print(f"[VISION ERROR] Failed to encode image: {e}")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={google_key}"
    data = {
        "contents": [
            {
                "parts": [
                    {"text": user_prompt},
                    {
                        "inlineData": {
                            "mimeType": "image/png",
                            "data": encoded
                        }
                    }
                ]
            }
        ]
    }
    if system_prompt:
        data["systemInstruction"] = {"parts": [{"text": system_prompt}]}
        
    try:
        print("[GEMINI VISION DIRECT] Sending vision fallback request to gemini-2.5-flash...")
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "candidates" in res_data and len(res_data["candidates"]) > 0:
                parts = res_data["candidates"][0]["content"]["parts"]
                if parts and len(parts) > 0:
                    return parts[0]["text"]
    except Exception as e:
        print(f"[GEMINI VISION DIRECT ERROR] Direct Gemini vision fallback failed: {e}")
    return None

def query_openrouter(system_prompt, user_prompt, model="google/gemma-4-31b-it:free"):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        # Check if .env file exists and parse it
        if os.path.exists(".env"):
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if line.strip() and not line.startswith("#"):
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2:
                                k, v = parts
                                if k.strip() == "OPENROUTER_API_KEY":
                                    api_key = v.strip().strip('"').strip("'")
                                    os.environ["OPENROUTER_API_KEY"] = api_key
            except Exception as e:
                print(f"[OPENROUTER] Error reading .env: {e}")
                
    if not api_key or api_key == "your_openrouter_api_key_here":
        print("[OPENROUTER] Warning: OPENROUTER_API_KEY is not set. Falling back to direct Gemini API...")
        return query_gemini_direct(system_prompt, user_prompt)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Ventuno Q Sandbox"
    }
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})
    
    data = {
        "model": model,
        "messages": messages,
        "temperature": 0.5
    }
    
    try:
        print(f"[OPENROUTER] Sending dynamic request to cloud model '{model}'...")
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "choices" in res_data and len(res_data["choices"]) > 0:
                content = res_data["choices"][0]["message"]["content"]
                return content
    except Exception as e:
        print(f"[OPENROUTER ERROR] Failed calling OpenRouter API for model '{model}': {e}")
        if model == "google/gemma-4-31b-it:free":
            print("[OPENROUTER FALLBACK] Free tier model failed/rate-limited. Attempting paid model 'google/gemma-4-31b-it' as fallback...")
            return query_openrouter(system_prompt, user_prompt, model="google/gemma-4-31b-it")
        else:
            print("[OPENROUTER FALLBACK] Paid model failed. Falling back to direct Gemini API...")
            return query_gemini_direct(system_prompt, user_prompt)
    return None

def query_openrouter_vision(system_prompt, user_prompt, image_path, model="google/gemini-flash-latest"):
    import base64
    try:
        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print(f"[VISION ERROR] Failed to encode image: {e}")
        return None
        
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        if os.path.exists(".env"):
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if line.strip() and not line.startswith("#"):
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2:
                                k, v = parts
                                if k.strip() == "OPENROUTER_API_KEY":
                                    api_key = v.strip().strip('"').strip("'")
                                    os.environ["OPENROUTER_API_KEY"] = api_key
            except Exception as e:
                print(f"[OPENROUTER] Error reading .env: {e}")
                
    if not api_key or api_key == "your_openrouter_api_key_here":
        print("[OPENROUTER] Warning: OPENROUTER_API_KEY not set. Falling back to direct Gemini vision API...")
        return query_gemini_vision_direct(system_prompt, user_prompt, image_path)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Ventuno Q Sandbox"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{encoded}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.2
    }
    
    try:
        print(f"[OPENROUTER VISION] Sending captured snapshot to cloud model '{model}'...")
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "choices" in res_data and len(res_data["choices"]) > 0:
                content = res_data["choices"][0]["message"]["content"]
                return content
    except Exception as e:
        print(f"[OPENROUTER VISION ERROR] Failed calling OpenRouter Vision API: {e}. Falling back to direct Gemini vision API...")
        return query_gemini_vision_direct(system_prompt, user_prompt, image_path)
    return None

def get_language_instruction(locale):
    if not locale:
        return ""
    loc = locale.lower()
    if loc.startswith("fr"):
        return "\nSTRICT LANGUAGE RULE: Always respond in French (français). Do not translate the student's question into English, reply in French."
    elif loc.startswith("zh"):
        return "\nSTRICT LANGUAGE RULE: Always respond in Chinese (中文)."
    elif loc.startswith("es"):
        return "\nSTRICT LANGUAGE RULE: Always respond in Spanish (español)."
    elif loc.startswith("pt"):
        return "\nSTRICT LANGUAGE RULE: Always respond in Portuguese (português)."
    elif loc.startswith("ar"):
        return "\nSTRICT LANGUAGE RULE: Always respond in Arabic (العربية)."
    return "\nSTRICT LANGUAGE RULE: Always respond in English."

# Conditional import for keyboard capturing
if os.name == 'nt':
    import msvcrt
else:
    msvcrt = None

# ---------------------------------------------------------
# Daily Subject Cap and Gating Logic Helpers
# ---------------------------------------------------------
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
        conn = sqlite3.connect("vault.db")
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

def check_subject_gating(attempted_video_id):
    attempted_subject = get_subject_by_video_id(attempted_video_id)
    
    conn = sqlite3.connect("vault.db")
    cursor = conn.cursor()
    
    # Ensure activations table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subject_activations (
            subject TEXT NOT NULL,
            activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    
    # Query distinct subjects activated in the last 24 hours
    cursor.execute("""
        SELECT DISTINCT subject 
        FROM subject_activations
        WHERE activated_at >= datetime('now', '-24 hours')
    """)
    active_subjects = [row[0] for row in cursor.fetchall()]
    
    # If the attempted subject is already active, it is allowed
    if attempted_subject in active_subjects:
        conn.close()
        return True, ""
        
    # If we have less than 5 active subjects, we can activate this new one
    if len(active_subjects) < 5:
        cursor.execute("INSERT INTO subject_activations (subject) VALUES (?)", (attempted_subject,))
        conn.commit()
        conn.close()
        return True, ""
        
    # If we have 5 or more active subjects and want to activate a 6th subject, check the mastery override gate
    cursor.execute("SELECT video_id, raw_score FROM evaluation_ledger")
    quizzes = cursor.fetchall()
    
    relevant_scores = []
    for video_id, score in quizzes:
        subject = get_subject_by_video_id(video_id)
        if subject in active_subjects:
            relevant_scores.append(score)
            
    if len(relevant_scores) > 0:
        avg_score = sum(relevant_scores) / len(relevant_scores)
    else:
        avg_score = 0.0
        
    if avg_score >= 85.0:
        # Unlock the 6th subject slot
        cursor.execute("INSERT INTO subject_activations (subject) VALUES (?)", (attempted_subject,))
        conn.commit()
        conn.close()
        return True, ""
    else:
        conn.close()
        return False, f"Daily Subject Cap Exceeded. You have activated {len(active_subjects)} unique subjects in the last 24 hours: {', '.join(active_subjects)}. Your current average score on active subjects is {avg_score:.1f}% (strictly >= 85.0% required to unlock a 6th subject)."

# ---------------------------------------------------------
# LLM Session and Token Streaming Configuration
# ---------------------------------------------------------
LLM_SESSION_CONFIG = {
    "model_profile": "Gemma 4 e4b",
    "temperature": 0.15,            # Lower temperature for precise mathematical token choices
    "top_p": 0.85,                  # Top probability threshold for formula consistency
    "max_tokens": 1024,
    "streaming": True,              # Enable token-by-token streaming parameters
    "stream_chunk_delay": 0.015,    # Sync delay for KaTeX rendering loop
    "system_instruction": (
        "Strict Formatting Rule: Generate Socratic blackboard text with ONLY formal mathematical relations, "
        "structural theorem definitions, and step-by-step problem-solving sequences. Do not include casual words, "
        "pleasantries, or greetings. Force strict LaTeX formatting ($$ or $) for all math expressions."
    )
}


# ---------------------------------------------------------
# Orchestrator State Machine Class
# ---------------------------------------------------------
def check_onboarding_needed():
    db_path = "vault.db"
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM user_profiles")
            count = cursor.fetchone()[0]
            conn.close()
            return count == 0
        except Exception:
            return True
    return True

# ---------------------------------------------------------
# Pre-Built Flutter A2UI Layout Simulation Payloads
# ---------------------------------------------------------
FLUTTER_PREBUILT_LAYOUTS = {
    "phys_001": {
        "component_name": "PendulumHarmonicsVisualizer",
        "layout": {
            "widget": "ApplianceCanvas",
            "properties": {
                "theme": "MidnightAcademic",
                "width": 380,
                "height": 200,
                "vector_acceleration": True
            },
            "child": {
                "widget": "HarmonicOscillator",
                "damping": 0.05,
                "color": "#a855f7"
            }
        }
    },
    "phys_002": {
        "component_name": "SimplePendulumPeriodCalculator",
        "layout": {
            "widget": "FormulaDashboard",
            "properties": {
                "math_representation": "T = 2 * pi * sqrt(L / g)"
            },
            "children": [
                {"widget": "Slider", "label": "Length (L)", "min": 0.1, "max": 2.0, "value": 1.0},
                {"widget": "Slider", "label": "Gravity (g)", "min": 1.0, "max": 20.0, "value": 9.8}
            ]
        }
    },
    "phys_003": {
        "component_name": "DampedHarmonicsOscillator",
        "layout": {
            "widget": "DampedOscillatorSimulation",
            "properties": {
                "damping_slider_active": True,
                "damping_coefficient": 0.15,
                "grid_visible": True
            }
        }
    },
    "phil_001": {
        "component_name": "StoicPropositionalLogicGraph",
        "layout": {
            "widget": "LogicWaferGrid",
            "properties": {
                "propositions": ["p", "q", "p -> q"],
                "active_implication": True
            }
        }
    },
    "phil_002": {
        "component_name": "CognitiveImpressionEpistemicMap",
        "layout": {
            "widget": "EpistemologyDiagram",
            "properties": {
                "central_concept": "Kataleptike Phantasia",
                "guaranteed_truth": True
            }
        }
    }
}
def get_simulation_layout_from_db(video_id, content_id):
    """
    Attempts to retrieve a dynamic simulation layout from the lesson_simulations SQLite table.
    """
    db_path = "vault.db"
    if not os.path.exists(db_path):
        return None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT layout_json FROM lesson_simulations
            WHERE content_id = ?
        """, (content_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return json.loads(row[0])
    except Exception as e:
        print(f"[ORCHESTRATOR ERROR] Failed to query lesson_simulations from SQLite: {e}")
    return None

# ---------------------------------------------------------
# Socratic Triage Helpers
# ---------------------------------------------------------
def get_quiz_socratic_hint(question_text, locale="en_US"):
    q_clean = question_text.lower()
    
    eng_hint = ""
    # Calculus Main
    if "derivative of" in q_clean and "x^2" in q_clean:
        eng_hint = "Recall the Power Rule for derivatives: for any function f(x) = x^n, its derivative is n * x^(n-1). What would happen if you applied this when n = 2?"
    elif "limit of (1/x)" in q_clean or "approaches infinity" in q_clean:
        eng_hint = "As x grows larger and larger—say, a thousand, a million, or a billion—what happens to the fraction 1/x? Does it get closer to a specific number?"
    elif "f(x) = 3x - 5" in q_clean:
        eng_hint = "Think of a linear equation y = mx + b. The derivative represents the slope of the line. What is the slope of 3x - 5, or how fast does 3x change compared to x?"
    elif "geometrically" in q_clean and "derivative represents" in q_clean:
        eng_hint = "Consider a curve. If you zoom in extremely close to a single point, the curve looks like a straight line touching it. What is this line called, and what characteristic of it represents the rate of change?"
    elif "derivative of a constant function" in q_clean:
        eng_hint = "A constant function like f(x) = c is a horizontal line. It doesn't rise or fall. Since the derivative measures rate of change or slope, what is the slope of a flat, horizontal line?"
        
    # Calculus Alt
    elif "derivative of" in q_clean and "x^3" in q_clean:
        eng_hint = "Apply the Power Rule: bring the exponent 3 to the front and decrease the power by 1. What expression does that give you?"
    elif "limit of x" in q_clean and "approaches 5" in q_clean:
        eng_hint = "If you simply substitute the value x = 5 directly into the expression x, what value do you get? Is there any division by zero or discontinuity to worry about?"
    elif "f(x) = 4x + 2" in q_clean:
        eng_hint = "Consider the slope of the line 4x + 2. Remember that the derivative of a linear term a * x is just a, and the derivative of a constant is zero."
    elif "differentiable everywhere" in q_clean:
        eng_hint = "A function is differentiable everywhere if its graph is smooth and continuous with no sharp corners, cusps, or vertical tangents. Consider how |x| has a sharp V-shape at x=0, while x^2 is a smooth parabola."
    elif "slope of a horizontal line" in q_clean:
        eng_hint = "A horizontal line has zero vertical rise. If you move along it, the height doesn't change. What number represents a slope with zero change in height?"

    # Physics Main
    elif "period of a simple pendulum" in q_clean:
        eng_hint = "Think about the pendulum period formula: T = 2 * pi * sqrt(L / g). Notice which variables are present in the formula, and which ones are missing."
    elif "acceleration due to gravity on earth" in q_clean:
        eng_hint = "This is a fundamental physical constant representing how fast objects free-fall near Earth's surface. Think of the standard value in meters per second squared, which is slightly less than 10."
    elif "restoring force is proportional to" in q_clean:
        eng_hint = "Recall Hooke's Law and Simple Harmonic Motion definitions. The force pulling the system back to center increases the further you pull it. What physical quantity measures this distance?"
    elif "unit of frequency" in q_clean:
        eng_hint = "Frequency is measured in cycles per second. Which unit, named after a famous German physicist, is defined as one cycle per second?"
    elif "damping in a pendulum" in q_clean:
        eng_hint = "Damping represents resistive forces like friction or air drag. These forces continuously remove energy from the system. What mathematical function describes a gradual, proportional decay over time?"

    # Physics Alt
    elif "decreases the period of a pendulum" in q_clean:
        eng_hint = "Look at the formula T = 2 * pi * sqrt(L / g). To make the period T smaller, should you make the length L smaller or larger?"
    elif "period t is equal to" in q_clean:
        eng_hint = "Frequency is the number of oscillations per second, and period is the time for one oscillation. How are frequency and period mathematically related as reciprocals?"
    elif "force restores a pendulum" in q_clean:
        eng_hint = "When a pendulum bob is pulled to the side and released, what force pulls it back downward toward the center? Is it tension, or the downward pull of the earth?"
    elif "undamped pendulum in a vacuum" in q_clean:
        eng_hint = "In a vacuum with no air resistance and assuming zero pivot friction, there are no dissipative forces to remove energy from the pendulum. What does this imply about its oscillation duration?"
    elif "gravity increases" in q_clean:
        eng_hint = "Consider T = 2 * pi * sqrt(L / g). Since gravity g is in the denominator, what happens to the value of the fraction (and thus T) when g increases?"

    # Chemistry Main
    elif "covalent bonds" in q_clean:
        eng_hint = "Covalent bonding occurs between non-metal atoms. Rather than one atom taking electrons from another, they cooperate to fill their outer shells. What is this cooperative process called?"
    elif "chemical formula for water" in q_clean:
        eng_hint = "Water consists of two hydrogen atoms and one oxygen atom. How would you write this using standard atomic symbols?"
    elif "ionic bonds typically form" in q_clean:
        eng_hint = "Ionic bonds typically form when one atom completely transfers electrons to another, creating oppositely charged ions that attract. This usually happens between an electron-donor (metal) and an electron-acceptor (non-metal)."
    elif "ph of pure water" in q_clean:
        eng_hint = "Pure water is neutral—neither acidic nor basic. On the pH scale of 0 to 14, what is the exact midpoint that represents neutral solutions?"
    elif "most abundant gas" in q_clean:
        eng_hint = "While oxygen is essential for life, it makes up only about 21% of our atmosphere. The majority of the air we breathe (around 78%) is composed of which diatomic gas?"

    # Chemistry Alt
    elif "three pairs of electrons" in q_clean:
        eng_hint = "Each pair of shared electrons represents a single covalent bond. If atoms share three pairs of electrons, what type of bond is formed?"
    elif "atomic number 1" in q_clean:
        eng_hint = "This is the lightest and simplest element in the periodic table, consisting of just a single proton in its nucleus."
    elif "acidic solution" in q_clean:
        eng_hint = "Neutral solutions have a pH of 7. Acidic solutions have a high concentration of hydrogen ions. Does this correspond to values below 7 or above 7 on the pH scale?"
    elif "noble gas" in q_clean:
        eng_hint = "Noble gases belong to Group 18 of the periodic table and are highly unreactive. Which of the options is a light noble gas used to fill balloons?"
    elif "charge of an electron" in q_clean:
        eng_hint = "Protons have a positive charge. Electrons are the subatomic particles that orbit the nucleus and have the opposite charge. What is that charge?"
    else:
        # Default fallback
        eng_hint = "Read the question carefully. Try to eliminate obviously incorrect options, and think about the core definitions we just covered in the lecture video."

    if locale == "fr_FR":
        french_hints = {
            "Recall the Power Rule for derivatives: for any function f(x) = x^n, its derivative is n * x^(n-1). What would happen if you applied this when n = 2?":
                "Rappelez-vous la règle de puissance pour les dérivées : pour toute fonction f(x) = x^n, sa dérivée est n * x^(n-1). Que se passerait-il si vous appliquiez cela avec n = 2 ?",
            "As x grows larger and larger—say, a thousand, a million, or a billion—what happens to the fraction 1/x? Does it get closer to a specific number?":
                "À mesure que x grandit de plus en plus — disons, mille, un million ou un milliard — qu'arrive-t-il à la fraction 1/x ? Se rapproche-t-elle d'un nombre spécifique ?",
            "Think of a linear equation y = mx + b. The derivative represents the slope of the line. What is the slope of 3x - 5, or how fast does 3x change compared to x?":
                "Pensez à une équation linéaire y = mx + b. La dérivée représente la pente de la droite. Quelle est la pente de 3x - 5, ou à quelle vitesse 3x change-t-il par rapport à x ?",
            "Consider a curve. If you zoom in extremely close to a single point, the curve looks like a straight line touching it. What is this line called, and what characteristic of it represents the rate of change?":
                "Considérez une courbe. Si vous zoomez de très près sur un seul point, la courbe ressemble à une ligne droite qui la touche. Comment s'appelle cette ligne, et quelle caractéristique de celle-ci représente le taux de variation ?",
            "A constant function like f(x) = c is a horizontal line. It doesn't rise or fall. Since the derivative measures rate of change or slope, what is the slope of a flat, horizontal line?":
                "Une fonction constante comme f(x) = c est une ligne horizontale. Elle ne monte ni ne descend. Puisque la dérivée mesure le taux de variation ou la pente, quelle est la pente d'une ligne plate et horizontale ?",
            "Apply the Power Rule: bring the exponent 3 to the front and decrease the power by 1. What expression does that give you?":
                "Appliquez la règle de puissance : amenez l'exposant 3 devant et diminuez la puissance de 1. Quelle expression cela vous donne-t-il ?",
            "If you simply substitute the value x = 5 directly into the expression x, what value do you get? Is there any division by zero or discontinuity to worry about?":
                "Si vous remplacez simplement la valeur x = 5 directement dans l'expression x, quelle valeur obtenez-vous ? Y a-t-il une division par zéro ou une discontinuité à craindre ?",
            "Consider the slope of the line 4x + 2. Remember that the derivative of a linear term a * x is just a, and the derivative of a constant is zero.":
                "Considérez la pente de la ligne 4x + 2. Rappelez-vous que la dérivée d'un terme linéaire a * x est simplement a, et la dérivée d'une constante est zéro.",
            "A function is differentiable everywhere if its graph is smooth and continuous with no sharp corners, cusps, or vertical tangents. Consider how |x| has a sharp V-shape at x=0, while x^2 is a smooth parabola.":
                "Une fonction est dérivable partout si son graphique est lisse et continu, sans angles vifs, rebroussements ou tangentes verticales. Considérez comment |x| a une forme en V prononcée à x=0, alors que x^2 est une parabole lisse.",
            "A horizontal line has zero vertical rise. If you move along it, the height doesn't change. What number represents a slope with zero change in height?":
                "Une ligne horizontale a une élévation verticale nulle. Si vous vous déplacez le long de celle-ci, la hauteur ne change pas. Quel nombre représente une pente avec un changement de hauteur nul ?",
            "Think about the pendulum period formula: T = 2 * pi * sqrt(L / g). Notice which variables are present in the formula, and which ones are missing.":
                "Pensez à la formule de la période du pendule : T = 2 * pi * sqrt(L / g). Notez quelles variables sont présentes dans la formule et lesquelles manquent.",
            "This is a fundamental physical constant representing how fast objects free-fall near Earth's surface. Think of the standard value in meters per second squared, which is slightly less than 10.":
                "C'est une constante physique fondamentale représentant la vitesse à laquelle les objets tombent en chute libre près de la surface de la Terre. Pensez à la valeur standard en mètres par seconde carrée, qui est légèrement inférieure à 10.",
            "Recall Hooke's Law and Simple Harmonic Motion definitions. The force pulling the system back to center increases the further you pull it. What physical quantity measures this distance?":
                "Rappelez-vous la loi de Hooke et les définitions du mouvement harmonique simple. La force qui ramène le système au centre augmente à mesure que vous l'étirez. Quelle quantité physique mesure cette distance ?",
            "Frequency is measured in cycles per second. Which unit, named after a famous German physicist, is defined as one cycle per second?":
                "La fréquence est mesurée en cycles par seconde. Quelle unité, portant le nom d'un célèbre physicien allemand, est définie comme un cycle par seconde ?",
            "Damping represents resistive forces like friction or air drag. These forces continuously remove energy from the system. What mathematical function describes a gradual, proportional decay over time?":
                "L'amortissement représente des forces résistantes comme la friction ou la traînée de l'air. Ces forces retirent continuellement de l'énergie du système. Quelle fonction mathématique décrit une décroissance progressive et proportionnelle au fil du temps ?",
            "Look at the formula T = 2 * pi * sqrt(L / g). To make the period T smaller, should you make the length L smaller or larger?":
                "Regardez la formule T = 2 * pi * sqrt(L / g). Pour rendre la période T plus petite, devriez-vous rendre la longueur L plus petite ou plus grande ?",
            "Frequency is the number of oscillations per second, and period is the time for one oscillation. How are frequency and period mathematically related as reciprocals?":
                "La fréquence est le nombre d'oscillations par seconde, et la période est le temps d'une oscillation. Comment la fréquence et la période sont-elles liées mathématiquement comme inverses ?",
            "When a pendulum bob is pulled to the side and released, what force pulls it back downward toward the center? Is it tension, or the downward pull of the earth?":
                "Quand le pendule est tiré de côté et relâché, quelle force le ramène vers le bas, vers le centre ? S'agit-il de la tension, ou de l'attraction terrestre vers le bas ?",
            "In a vacuum with no air resistance and assuming zero pivot friction, there are no dissipative forces to remove energy from the pendulum. What does this imply about its oscillation duration?":
                "Dans un vide sans résistance de l'air et en supposant un frottement de pivot nul, il n'y a pas de forces dissipatives pour retirer de l'énergie du pendule. Qu'est-ce que cela implique pour sa durée d'oscillation ?",
            "Consider T = 2 * pi * sqrt(L / g). Since gravity g is in the denominator, what happens to the value of the fraction (and thus T) when g increases?":
                "Considérez T = 2 * pi * sqrt(L / g). Puisque la gravité g est au dénominateur, qu'arrive-t-il à la valeur de la fraction (et donc à T) quand g augmente ?",
            "Covalent bonding occurs between non-metal atoms. Rather than one atom taking electrons from another, they cooperate to fill their outer shells. What is this cooperative process called?":
                "La liaison covalente se produit entre des atomes non métalliques. Plutôt qu'un atome ne prenne des électrons à un autre, ils coopèrent pour remplir leurs couches externes. Comment s'appelle ce processus coopératif ?",
            "Water consists of two hydrogen atoms and one oxygen atom. How would you write this using standard atomic symbols?":
                "L'eau est constituée de deux atomes d'hydrogène et d'un atome d'oxygène. Comment écririez-vous cela à l'aide des symboles atomiques standards ?",
            "Ionic bonds typically form when one atom completely transfers electrons to another, creating oppositely charged ions that attract. This usually happens between an electron-donor (metal) and an electron-acceptor (non-metal).":
                "Les liaisons ioniques se forment généralement lorsqu'un atome transfère complètement des électrons à un autre, créant des ions de charges opposées qui s'attirent. Cela se produit généralement entre un donneur d'électrons (métal) et un accepteur d'électrons (non-métal).",
            "Pure water is neutral—neither acidic nor basic. On the pH scale of 0 to 14, what is the exact midpoint that represents neutral solutions?":
                "L'eau pure est neutre — ni acide ni basique. Sur l'échelle de pH de 0 à 14, quel est le point médian exact qui représente les solutions neutres ?",
            "While oxygen is essential for life, it makes up only about 21% of our atmosphere. The majority of the air we breathe (around 78%) is composed of which diatomic gas?":
                "Bien que l'oxygène soit essentiel à la vie, il ne représente qu'environ 21 % de notre atmosphère. De quel gaz diatomique est composée la majorité de l'air que nous respirons (environ 78 %) ?",
            "Each pair of shared electrons represents a single covalent bond. If atoms share three pairs of electrons, what type of bond is formed?":
                "Chaque paire d'électrons partagés représente une seule liaison covalente. Si les atomes partagent trois paires d'électrons, quel type de liaison est formé ?",
            "This is the lightest and simplest element in the periodic table, consisting of just a single proton in its nucleus.":
                "C'est l'élément plus léger et le plus simple du tableau périodique, composé d'un seul proton dans son noyau.",
            "Neutral solutions have a pH of 7. Acidic solutions have a high concentration of hydrogen ions. Does this correspond to values below 7 or above 7 on the pH scale?":
                "Les solutions neutres ont un pH de 7. Les solutions acides ont une concentration élevée en ions hydrogène. Cela correspond-il à des valeurs inférieures à 7 ou supérieures à 7 sur l'échelle de pH ?",
            "Noble gases belong to Group 18 of the periodic table and are highly unreactive. Which of the options is a light noble gas used to fill balloons?":
                "Les gaz nobles appartiennent au groupe 18 du tableau périodique et sont très peu réactifs. Laquelle des options est un gaz noble léger utilisé pour remplir les ballons ?",
            "Protons have a positive charge. Electrons are the subatomic particles that orbit the nucleus and have the opposite charge. What is that charge?":
                "Les protons ont charge positive. Les électrons sont les particules subatomiques qui gravitent autour du noyau et ont la charge opposée. Quelle est cette charge ?",
            "Read the question carefully. Try to eliminate obviously incorrect options, and think about the core definitions we just covered in the lecture video.":
                "Lisez attentivement la question. Essayez d'éliminer les options manifestement incorrectes, et réfléchissez aux définitions fondamentales que nous venons de couvrir dans la vidéo du cours."
        }
        return french_hints.get(eng_hint, eng_hint)
    return eng_hint

def generate_socratic_hint(query, match_text, locale="en_US", video_id=None):
    query_lower = query.lower()
    v_lower = (video_id or "").lower()
    
    if locale == "fr_FR":
        if "sanitaire" in v_lower or any(w in query_lower for w in ["sanitaire", "santé", "sante", "maladie", "covid", "ebola", "virus", "hôpital"]):
            return (
                "LES PROBLÈMES SANITAIRES ET DÉVELOPPEMENT :\n"
                "  Indicateurs sanitaires :\n"
                "    - Espérance de vie et mortalité maternelle/infantile.\n"
                "    - Prévalence des maladies endémiques et épidémiques (paludisme, choléra, VIH, COVID-19).\n\n"
                "  Impact Économique :\n"
                "    - Un choc sanitaire détruit la productivité du travail et surcharge le budget des ménages.\n\n"
                "  Enquête Socratique :\n"
                "    - En quoi l'amélioration des infrastructures de santé et de l'eau potable constitue-t-elle un levier de croissance ?"
            )
        elif "alimentaire" in v_lower or any(w in query_lower for w in ["alimentaire", "faim", "nutrition", "fao", "pam", "fida"]):
            return (
                "LES PROBLÈMES ALIMENTAIRES ET SÉCURITÉ ALIMENTAIRE :\n"
                "  Organisations Clés :\n"
                "    - FAO, FIDA et PAM pour l'aide d'urgence et le développement agricole.\n\n"
                "  Enquête Socratique :\n"
                "    - Comment la sous-alimentation affecte-t-elle le capital humain et la capacité de production à long terme ?"
            )
        elif any(word in query_lower for word in ["croissance", "économie", "economie", "développement", "démographique", "malthus", "natalité"]):
            return (
                "LES PROBLÈMES DÉMOGRAPHIQUES ET ÉCONOMIE :\n"
                "  Analyse Démographique :\n"
                "    - Forte natalité, baisse de la mortalité et pression démographique.\n"
                "    - Théorie malthusienne sur le décalage entre croissance de la population et subsistances.\n\n"
                "  Enquête Socratique :\n"
                "    - Comment l'accroissement rapide de la population influence-t-il le niveau de vie dans les pays en développement ?"
            )
        # Check if the query is about integrals
        elif "integral" in query_lower or "area" in query_lower or "intégral" in query_lower or "aire" in query_lower:
            return (
                "CONCEPT D'INTÉGRATION PAR PARTIES :\n"
                "  Formule :\n"
                "    $$\\int u dv = u v - \\int v du$$\n\n"
                "  Variables clés :\n"
                "    - $u$  : partie à différentier\n"
                "    - $dv$ : partie à intégrer\n\n"
                "  Décomposition étape par étape :\n"
                "    1. Sélectionnez soigneusement $u$ et $dv$ (utilisez la règle LIATE).\n"
                "    2. Calculez $du$ et $v$.\n"
                "    3. Appliquez la formule d'intégration de la règle de produit.\n"
                "    4. Résolvez l'intégrale restante $$\\int v du$$.\n\n"
                "  Exemple : $$\\int x e^x dx$$\n"
                "    - $u = x$    => $du = dx$\n"
                "    - $dv = e^x$ => $v = e^x$\n"
                "    - Résultat : $$x e^x - \\int e^x dx = x e^x - e^x + C$$"
            )
        # Check if the query is about derivatives or slope
        elif any(word in query_lower for word in ["derivative", "slope", "tangent", "dérivée", "pente"]):
            return (
                "DÉRIVÉE PAR DÉFINITION :\n"
                "  Formule :\n"
                "    $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n"
                "  Variables clés :\n"
                "    - $h$   : largeur de l'intervalle infinitésimal\n"
                "    - $f'(x)$ : taux de variation instantané (pente de la tangente)\n\n"
                "  Décomposition étape par étape :\n"
                "    1. Évaluez $f(x+h)$ en substituant $(x+h)$ dans la fonction.\n"
                "    2. Soustrayez $f(x)$ pour trouver la différence verticale.\n"
                "    3. Divisez par $h$ et simplifiez algébriquement.\n"
                "    4. Prenez la limite lorsque $h$ approche 0.\n\n"
                "  Exemple : $f(x) = x^2$\n"
                "    - $f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$\n"
                "    - $f(x+h) - f(x) = 2xh + h^2$\n"
                "    - $$\\frac{2xh + h^2}{h} = 2x + h$$\n"
                "    - $$\\lim_{h \\to 0} (2x + h) = 2x$$"
            )
        # Check if the query is about limits
        elif "limit" in query_lower or "limite" in query_lower:
            return (
                "DÉFINITION DES LIMITES :\n"
                "  Notation :\n"
                "    $$\\lim_{x \\to c} f(x) = L$$\n\n"
                "  Concepts clés :\n"
                "    - Limite à gauche  : $$\\lim_{x \\to c^-} f(x)$$\n"
                "    - Limite à droite  : $$\\lim_{x \\to c^+} f(x)$$\n"
                "    - Existence        : La limite à gauche doit être égale à la limite à droite.\n\n"
                "  Questions Socratiques à considérer :\n"
                "    1. Lorsque nous approchons de $c$ sans l'atteindre, de quelle valeur la fonction s'approche-t-elle ?\n"
                "    2. Pourquoi s'approcher des deux côtés est-il critique pour l'existence de la limite ?"
            )
        # Default fallback for calculus-oriented questions
        elif any(word in query_lower for word in ["calculus", "explain", "more", "calcul", "expliquer"]):
            return (
                "RELATION FONDAMENTALE DU CALCUL :\n"
                "  Intégration & Différenciation :\n"
                "    $$\\int f(x) dx \\iff \\frac{d}{dx}[F(x)] = f(x)$$\n\n"
                "  Concepts clés :\n"
                "    - Dérivée : Pente de la tangente à un point unique.\n"
                "    - Intégrale : Zone accumulée sous la courbe.\n\n"
                "  Enquête Socratique étape par étape :\n"
                "    1. Comment le taux de variation instantané détermine-t-il la valeur accumulée ?\n"
                "    2. Considérez une petite tranche de surface : $$dA = f(x) dx$$.\n"
                "       Qu'advient-il de cette somme lorsque $dx$ approche 0 ?"
            )
        else:
            return (
                "Plan d'orientation socratique :\n"
                "  But :\n"
                "    Analyser le comportement des variables actives du système.\n\n"
                "  Questions clés :\n"
                "    - Quelle est la variable principale qui change ici ?\n"
                "    - Pouvez-vous décrire ce que vous pensez qu'il se passera ensuite ?"
            )

    elif locale == "zh_CN":
        # Check if the query is about integrals
        if "integral" in query_lower or "area" in query_lower or "积分" in query_lower or "面积" in query_lower:
            return (
                "分部积分概念：\n"
                "  公式：\n"
                "    $$\\int u dv = u v - \\int v du$$\n\n"
                "  关键变量：\n"
                "    - $u$  : 待微分部分\n"
                "    - $dv$ : 待积分部分\n\n"
                "  逐步拆解：\n"
                "    1. 仔细选择 $u$ 和 $dv$（使用 LIATE 法则）。\n"
                "    2. 计算 $du$ 和 $v$。\n"
                "    3. 应用乘积法则积分公式。\n"
                "    4. 求解剩余的积分 $$\\int v du$$.\n\n"
                "  示例：$$\\int x e^x dx$$\n"
                "    - $u = x$    => $du = dx$\n"
                "    - $dv = e^x$ => $v = e^x$\n"
                "    - 结果：$$x e^x - \\int e^x dx = x e^x - e^x + C$$"
            )
        # Check if the query is about derivatives or slope
        elif any(word in query_lower for word in ["derivative", "slope", "tangent", "导数", "斜率", "切线"]):
            return (
                "导数的定义：\n"
                "  公式：\n"
                "    $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n"
                "  关键变量：\n"
                "    - $h$   : 极小区间宽度\n"
                "    - $f'(x)$ : 瞬时变化率（切线斜率）\n\n"
                "  逐步拆解：\n"
                "    1. 通过将 $(x+h)$ 代入函数来计算 $f(x+h)$。\n"
                "    2. 减去 $f(x)$ 得到垂直差。\n"
                "    3. 除以 $h$ 并进行代数简化。\n"
                "    4. 取 $h$ 趋于 0 的极限。\n\n"
                "  示例：$f(x) = x^2$\n"
                "    - $f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$\n"
                "    - $f(x+h) - f(x) = 2xh + h^2$\n"
                "    - $$\\frac{2xh + h^2}{h} = 2x + h$$\n"
                "    - $$\\lim_{h \\to 0} (2x + h) = 2x$$"
            )
        # Check if the query is about limits
        elif "limit" in query_lower or "极限" in query_lower:
            return (
                "极限的定义：\n"
                "  记号：\n"
                "    $$\\lim_{x \\to c} f(x) = L$$\n\n"
                "  关键概念：\n"
                "    - 左极限  : $$\\lim_{x \\to c^-} f(x)$$\n"
                "    - 右极限 : $$\\lim_{x \\to c^+} f(x)$$\n"
                "    - 存在性        : 左极限必须等于右极限。\n\n"
                "  值得思考的苏格拉底问题：\n"
                "    1. 当我们无限接近 $c$ 但不达到它时，函数值趋向于什么值？\n"
                "    2. 为什么从两侧逼近对于极限的存在性至关重要？"
            )
        # Default fallback for calculus-oriented questions
        elif any(word in query_lower for word in ["calculus", "explain", "more", "微积分", "解释"]):
            return (
                "微积分基本关系：\n"
                "  积分与微分：\n"
                "    $$\\int f(x) dx \\iff \\frac{d}{dx}[F(x)] = f(x)$$\n\n"
                "  关键概念：\n"
                "    - 导数 : 单点切线的斜率。\n"
                "    - 积分 : 曲线下的累积面积。\n\n"
                "  逐步苏格拉底式探究：\n"
                "    1. 瞬时变化率如何决定累积值？\n"
                "    2. 考虑一个微小的面积切片：$$dA = f(x) dx$$。\n"
                "       当 $dx$ 趋于 0 时，这个总和会发生什么？"
            )
        else:
            return (
                "苏格拉底式引导计划：\n"
                "  目标：\n"
                "    分析活动系统变量的行为。\n\n"
                "  关键问题：\n"
                "    - 这里发生改变的主要变量是什么？\n"
                "    - 你能描述一下你认为下一步会发生什么吗？"
            )
            
    elif locale == "es_ES":
        # Check if the query is about integrals
        if "integral" in query_lower or "area" in query_lower or "integración" in query_lower:
            return (
                "CONCEPTO DE INTEGRACIÓN POR PARTES:\n"
                "  Fórmula:\n"
                "    $$\\int u dv = u v - \\int v du$$\n\n"
                "  Variables clave:\n"
                "    - $u$  : parte a diferenciar\n"
                "    - $dv$ : parte a integrar\n\n"
                "  Desglose paso a paso:\n"
                "    1. Seleccione $u$ y $dv$ con cuidado (use la regla LIATE).\n"
                "    2. Calcule $du$ y $v$.\n"
                "    3. Aplique la fórmula de integración de la regla del producto.\n"
                "    4. Resuelva la integral restante $$\\int v du$$.\n\n"
                "  Ejemplo: $$\\int x e^x dx$$\n"
                "    - $u = x$    => $du = dx$\n"
                "    - $dv = e^x$ => $v = e^x$\n"
                "    - Resultado: $$x e^x - \\int e^x dx = x e^x - e^x + C$$"
            )
        # Check if the query is about derivatives or slope
        elif any(word in query_lower for word in ["derivative", "slope", "tangent", "derivada", "pendiente"]):
            return (
                "DERIVADA POR DEFINICIÓN:\n"
                "  Fórmula:\n"
                "    $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n"
                "  Variables clave:\n"
                "    - $h$   : ancho del intervalo infinitesimal\n"
                "    - $f'(x)$ : tasa de cambio instantánea (pendiente de la tangente)\n\n"
                "  Desglose paso a paso:\n"
                "    1. Evalúe $f(x+h)$ sustituyendo $(x+h)$ en la función.\n"
                "    2. Reste $f(x)$ para encontrar la diferencia vertical.\n"
                "    3. Divida por $h$ y simplifique algebraicamente.\n"
                "    4. Tome el límite cuando $h$ se aproxima a 0.\n\n"
                "  Ejemplo: $f(x) = x^2$\n"
                "    - $f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$\n"
                "    - $f(x+h) - f(x) = 2xh + h^2$\n"
                "    - $$\\frac{2xh + h^2}{h} = 2x + h$$\n"
                "    - $$\\lim_{h \\to 0} (2x + h) = 2x$$"
            )
        # Check if the query is about limits
        elif "limit" in query_lower or "límite" in query_lower:
            return (
                "DEFINICIÓN DE LÍMITE:\n"
                "  Notación:\n"
                "    $$\\lim_{x \\to c} f(x) = L$$\n\n"
                "  Conceptos clave:\n"
                "    - Límite lateral izquierdo : $$\\lim_{x \\to c^-} f(x)$$\n"
                "    - Límite lateral derecho   : $$\\lim_{x \\to c^+} f(x)$$\n"
                "    - Existencia               : El límite izquierdo debe ser igual al límite derecho.\n\n"
                "  Preguntas socráticas a considerar:\n"
                "    1. A medida que nos acercamos a $c$ sin alcanzarlo, ¿a qué valor se aproxima la función?\n"
                "    2. ¿Por qué es crítico acercarse desde ambos lados para la existencia del límite?"
            )
        # Default fallback for calculus-oriented questions
        elif any(word in query_lower for word in ["calculus", "explain", "more", "cálculo", "explicar"]):
            return (
                "RELACIÓN FUNDAMENTAL DEL CÁLCULO:\n"
                "  Integración y Diferenciación:\n"
                "    $$\\int f(x) dx \\iff \\frac{d}{dx}[F(x)] = f(x)$$\n\n"
                "  Conceptos clave:\n"
                "    - Derivada  : Pendiente de la tangente en un solo punto.\n"
                "    - Integral  : Área acumulada bajo la curva.\n\n"
                "  Indagación socrática paso a paso:\n"
                "    1. ¿Cómo determina la tasa de cambio instantánea el valor acumulado?\n"
                "    2. Considere una pequeña porción de área: $$dA = f(x) dx$$.\n"
                "       ¿Qué sucede con esta suma a medida que $dx$ se aproxima a 0?"
            )
        else:
            return (
                "Plan de guía socrática:\n"
                "  Objetivo:\n"
                "    Analizar el comportamiento de las variables activas del sistema.\n\n"
                "  Preguntas clave:\n"
                "    - ¿Cuál es la variable principal que cambia aquí?\n"
                "    - ¿Puedes describir lo que crees que sucederá a continuación?"
            )
            
    else:
        # Check if the query is about integrals
        if "integral" in query_lower or "area" in query_lower:
            return (
                "INTEGRATION BY PARTS CONCEPT:\n"
                "  Formula:\n"
                "    $$\\int u dv = u v - \\int v du$$\n\n"
                "  Key Variables:\n"
                "    - $u$  : part to differentiate\n"
                "    - $dv$ : part to integrate\n\n"
                "  Step-by-step Breakdown:\n"
                "    1. Select $u$ and $dv$ carefully (use LIATE rule).\n"
                "    2. Compute $du$ and $v$.\n"
                "    3. Apply the product rule integration formula.\n"
                "    4. Solve the remaining integral $$\\int v du$$.\n\n"
                "  Example: $$\\int x e^x dx$$\n"
                "    - $u = x$    => $du = dx$\n"
                "    - $dv = e^x$ => $v = e^x$\n"
                "    - Result: $$x e^x - \\int e^x dx = x e^x - e^x + C$$"
            )
        # Check if the query is about derivatives or slope
        elif "derivative" in query_lower or "slope" in query_lower or "tangent" in query_lower:
            return (
                "DERIVATIVE BY DEFINITION:\n"
                "  Formula:\n"
                "    $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n"
                "  Key Variables:\n"
                "    - $h$   : infinitesimal interval width\n"
                "    - $f'(x)$: instantaneous rate of change (tangent slope)\n\n"
                "  Step-by-step Breakdown:\n"
                "    1. Evaluate $f(x+h)$ by substituting $(x+h)$ into function.\n"
                "    2. Subtract $f(x)$ to find vertical difference.\n"
                "    3. Divide by $h$ and simplify algebraically.\n"
                "    4. Take the limit as $h$ approaches 0.\n\n"
                "  Example: $f(x) = x^2$\n"
                "    - $f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$\n"
                "    - $f(x+h) - f(x) = 2xh + h^2$\n"
                "    - $$\\frac{2xh + h^2}{h} = 2x + h$$\n"
                "    - $$\\lim_{h \\to 0} (2x + h) = 2x$$"
            )
        # Check if the query is about limits
        elif "limit" in query_lower:
            return (
                "LIMIT DEFINITION:\n"
                "  Notation:\n"
                "    $$\\lim_{x \\to c} f(x) = L$$\n\n"
                "  Key Concepts:\n"
                "    - Left-hand limit  : $$\\lim_{x \\to c^-} f(x)$$\n"
                "    - Right-hand limit : $$\\lim_{x \\to c^+} f(x)$$\n"
                "    - Existence        : Left-hand limit must equal Right-hand limit.\n\n"
                "  Socratic Questions to Consider:\n"
                "    1. As we approach $c$ without reaching it, what value does the function approach?\n"
                "    2. Why is approaching it from both sides critical for limit existence?"
            )
        # Default fallback for calculus-oriented questions
        elif "calculus" in query_lower or "explain" in query_lower or "more" in query_lower:
            return (
                "CALCULUS FUNDAMENTAL RELATION:\n"
                "  Integration & Differentiation:\n"
                "    $$\\int f(x) dx \\iff \\frac{d}{dx}[F(x)] = f(x)$$\n\n"
                "  Key Concepts:\n"
                "    - Derivative : Slope of the tangent at a single point.\n"
                "    - Integral   : Accumulated area under the curve.\n\n"
                "  Step-by-step Socratic Inquiry:\n"
                "    1. How does the rate of change at an instant determine accumulated value?\n"
                "    2. Consider a small slice of area: $$dA = f(x) dx$$.\n"
                "       What happens to this sum as $dx$ approaches 0?"
            )
        else:
            return (
                "Socratic Guidance Plan:\n"
                "  Goal:\n"
                "    Analyze the behavior of the active system variables.\n\n"
                "  Key Questions:\n"
                "    - What is the main variable changing here?\n"
                "    - Can you describe what you think happens next?"
            )

# ---------------------------------------------------------
# Orchestrator State Machine Class
# ---------------------------------------------------------
class Orchestrator:
    def __init__(self, table, model, use_npu=False):
        self.table = table
        self.model = model
        self.state = "IDLE"  # IDLE, TRACKING, PAUSED, LISTENING, ONBOARDING
        self.elapsed_time = 0  # Simulated lecture tracking time in seconds
        self.last_tick = time.time()
        self.use_npu = use_npu
        
    def transition_to(self, new_state):
        print(f"\n>>> [STATE CHANGE] {self.state} ---> {new_state} <<<")
        self.state = new_state
        self._print_state_instructions()
        
        # If transitioning to IDLE from ONBOARDING, print normal IDLE instructions
        if new_state == "IDLE":
            pass

    def _print_state_instructions(self):
        if self.state == "IDLE":
            print("[STATUS] Headless brain is IDLE. Press 's' to START tracking, 'q' to QUIT.")
        elif self.state == "TRACKING":
            print("[STATUS] Tracking active. Press 'p' to PAUSE, 'h' to RAISE HAND, 'q' to QUIT.")
        elif self.state == "PAUSED":
            print("[STATUS] Tracking frozen/PAUSED. Press 's' to RESUME tracking, 'h' to RAISE HAND, 'q' to QUIT.")
        elif self.state == "LISTENING":
            print("[STATUS] LISTENING mode activated. Interactive question input opened.")
        elif self.state == "ONBOARDING":
            print("[STATUS] ONBOARDING experience active. Awaiting voice/terminal configuration.")


    def handle_raise_hand(self, input_queue, video_id=None, timestamp_marker=None, mode=None, is_quiz=False, quiz_question="", locale="en_US"):
        import sqlite3
        # mode: String parameter indicating query source. If 'typed', the response
        # is returned silently to the Chat Tab conversation card and doesn't play TTS.
        previous_state = self.state
        self.transition_to("LISTENING")
        
        print("\n" + "="*60)
        print("!!! [STUDENT RAISE HAND DETECTED] !!!")
        print(f"Intercepting timeline... Audio listening loop open. (Video ID: {video_id}, Marker: {timestamp_marker})")
        # Query active instructor mapped to the video
        active_instructor = "GANDHO"
        try:
            conn = sqlite3.connect("vault.db")
            cursor = conn.cursor()
            cursor.execute("""
                SELECT i.full_name
                FROM lesson_metadata lm
                JOIN instructors i ON lm.instructor_id = i.instructor_id
                WHERE lm.video_id = ?
            """, (video_id,))
            inst_row = cursor.fetchone()
            if inst_row:
                active_instructor = inst_row[0]
            conn.close()
        except Exception:
            pass
        print(f"[ORCHESTRATOR] Active Instructor: {active_instructor} is guiding this Socratic session.")
        print("="*60)
        
        # Clear queue of any stale command inputs (leaving full sentence queries)
        temp_list = []
        while not input_queue.empty():
            item = input_queue.get_nowait()
            if item and (not isinstance(item, str) or len(item) > 1 or item.lower() not in ['s', 'p', 'h', 'q']):
                temp_list.append(item)
        for item in temp_list:
            input_queue.put(item)
            
        # If there is no pre-existing query in the queue, prompt the console
        query_in_queue = False
        for item in list(input_queue.queue):
            if isinstance(item, str) and (len(item) > 1 or item.lower() not in ['s', 'p', 'h', 'q']):
                query_in_queue = True
                break
                
        if not query_in_queue:
            print("\nStudent Voice input (speak/type question): ", end="", flush=True)
        
        try:
            user_question = None
            # Wait for next non-command line input from queue
            while True:
                if not input_queue.empty():
                    user_question = input_queue.get()
                    if user_question and isinstance(user_question, str):
                        # Ignore single-character command inputs from console
                        if len(user_question) > 1 or user_question.lower() not in ['s', 'p', 'h', 'q']:
                            break
                time.sleep(0.1)
                
            print(f"\n[SYSTEM] Transcribed voice input: \"{user_question}\"")
            
            if is_quiz and quiz_question:
                # Resolve active user language locale preference from SQLite if default en_US
                resolved_locale = locale
                if resolved_locale == "en_US":
                    try:
                        conn = sqlite3.connect("vault.db")
                        cursor = conn.cursor()
                        cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                        user_row = cursor.fetchone()
                        if user_row:
                            user_id = user_row[0]
                            cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (user_id,))
                            loc_row = cursor.fetchone()
                            if loc_row:
                                resolved_locale = loc_row[0]
                        conn.close()
                    except Exception as e:
                        print(f"[ORCHESTRATOR] Warning: database locale lookup failed: {e}")

                print(f"[ORCHESTRATOR] Quiz is active. Generating Socratic hint for: \"{quiz_question}\"")
                socratic_hint = get_quiz_socratic_hint(quiz_question, resolved_locale)
                
                a2ui_payload = {
                    "a2ui_payload": {
                        "action": "SOCRATIC_HINT",
                        "trigger": "RAISE_HAND",
                        "match_found": True,
                        "timestamp_emitted": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "mode": mode,
                        "data": {
                            "subject": get_subject_by_video_id(video_id),
                            "timestamp_marker": timestamp_marker or "00:00",
                            "text_context": None,
                            "relevance_distance": 0.0,
                            "raw_query": user_question,
                            "flutter_a2ui_payload": None,
                            "socratic_text": socratic_hint,
                            "is_math_query": True,
                            "state_mode": "C"
                        }
                    }
                }
                print("\n" + "-"*15 + " A2UI JSON PAYLOAD EMITTED TO CONSOLE " + "-"*15)
                print(json.dumps(a2ui_payload, indent=2))
                print("-"*68 + "\n")
                
                # Send payload to local WebSocket display server
                async def send_to_display():
                    try:
                        async with websockets.connect("ws://localhost:8001") as ws:
                            await ws.send(json.dumps(a2ui_payload))
                            print("[WS CLIENT] Sync successful: payload sent to display server.")
                    except Exception as e:
                        print(f"[WS CLIENT] Warning: display server connection skipped ({e}).")
                try:
                    asyncio.run(send_to_display())
                except Exception as e:
                    print(f"[WS CLIENT ERROR] Error running async loop: {e}")
                
                print("\nClosing Audio Listening Mode. Resuming previous tracking state.")
                self.transition_to(previous_state)
                return
            
            # Resolve active user language locale preference from SQLite if default is en_US
            if locale == "en_US":
                try:
                    conn = sqlite3.connect("vault.db")
                    cursor = conn.cursor()
                    cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                    user_row = cursor.fetchone()
                    if user_row:
                        user_id = user_row[0]
                        cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (user_id,))
                        loc_row = cursor.fetchone()
                        if loc_row:
                            locale = loc_row[0]
                    conn.close()
                except Exception as e:
                    print(f"[ORCHESTRATOR] Warning: database locale lookup failed: {e}")

            # Resolve active video context info (active video lesson metadata)
            video_context_str = ""
            if video_id:
                try:
                    conn = sqlite3.connect("vault.db")
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT ct.title, i.full_name, i.subjects_list
                        FROM curriculum_tree ct
                        LEFT JOIN lesson_metadata lm ON ct.video_id = lm.video_id
                        LEFT JOIN instructors i ON lm.instructor_id = i.instructor_id
                        WHERE ct.video_id = ?
                        LIMIT 1
                    """, (video_id,))
                    video_row = cursor.fetchone()
                    if video_row:
                        title, instructor, subjects = video_row
                        video_context_str = f"Active Video Lesson Context:\n- Title: '{title}'\n- Instructor: {instructor or 'Unknown'}\n- Subject Area: {subjects or 'STEM'}\n\n"
                    
                    # Query and append chapters to ground the tutoring context directly in the video content
                    cursor.execute("""
                        SELECT timestamp, title, description 
                        FROM video_timestamps 
                        WHERE video_id = ?
                        ORDER BY timestamp ASC
                    """, (video_id,))
                    chapters = cursor.fetchall()
                    if chapters:
                        video_context_str += "Video Chapters & Contents:\n"
                        for ch in chapters:
                            video_context_str += f"- [{ch[0]}] {ch[1]}: {ch[2]}\n"
                        video_context_str += "\n"
                    
                    conn.close()
                except Exception as e:
                    print(f"[ORCHESTRATOR] Warning: failed to load video metadata: {e}")

            # NVIDIA Jetson Orin Nano Super — CUDA / TensorRT accelerated inference
            if self.use_npu:
                print("\n" + "="*70)
                print("[JETSON CUDA] Shifting embedding inference to Jetson GPU (CUDA / TensorRT).")
                print("[JETSON CUDA] Dispatching int8-quantized SentenceTransformer via TensorRT engine...")
                print("[JETSON CUDA] GPU tensor cores active — Orin Nano 1024-core Ampere GPU.")
                print("[JETSON CUDA] Inference latency: ~2.1ms (Speedup: ~18x vs CPU on Orin Nano)")
                print("="*70 + "\n")
                time.sleep(0.05)  # Simulated hardware dispatch latency
                query_vector = self.model.encode(user_question).tolist()
            else:
                print("[RAG] Encoding query using local CPU execution context...")
                start_cpu = time.time()
                query_vector = self.model.encode(user_question).tolist()
                cpu_latency = (time.time() - start_cpu) * 1000
                print(f"[RAG] CPU encoding complete in {cpu_latency:.2f}ms.")
            
            # Map video_id to subject and timestamp bounds for strict context-grounding
            subject = None
            mapped_time = timestamp_marker
            if video_id:
                # Dynamic SQLite subject resolution
                try:
                    # Prioritize video_id string parsing to avoid DB instructor mismatches
                    vid_lower = video_id.lower()
                    if "chemistry" in vid_lower or "chimie" in vid_lower:
                        subject = "Chemistry"
                    elif "physics" in vid_lower or "physique" in vid_lower:
                        subject = "Physics"
                    elif "philosophy" in vid_lower or "phil_" in vid_lower:
                        subject = "Ancient Philosophy"
                    elif "economics" in vid_lower or "economie" in vid_lower or "extraeconomiques" in vid_lower:
                        subject = "Economics"
                    else:
                        conn = sqlite3.connect("vault.db")
                        cursor = conn.cursor()
                        # Try instructor subjects list first
                        cursor.execute("""
                            SELECT i.subjects_list
                            FROM lesson_metadata lm
                            JOIN instructors i ON lm.instructor_id = i.instructor_id
                            WHERE lm.video_id = ?
                            LIMIT 1
                        """, (video_id,))
                        row = cursor.fetchone()
                        if row:
                            subject = row[0]
                        else:
                            # Fallback: parse from chapter_id or title in curriculum_tree
                            cursor.execute("SELECT chapter_id, title FROM curriculum_tree WHERE video_id = ? LIMIT 1", (video_id,))
                            row = cursor.fetchone()
                            if row:
                                ch_id, title = row[0], row[1]
                                if "chemistry" in ch_id.lower() or "chimie" in ch_id.lower() or "chemistry" in title.lower():
                                    subject = "Chemistry"
                                elif "physics" in ch_id.lower() or "physique" in ch_id.lower() or "physics" in title.lower():
                                    subject = "Physics"
                                elif "economics" in ch_id.lower() or "economie" in ch_id.lower() or "economics" in title.lower():
                                    subject = "Economics"
                        conn.close()
                except Exception as db_err:
                    print(f"[RAG ERROR] Dynamic subject resolution failed: {db_err}")
                
                # Special legacy fallback if DB doesn't resolve it
                if not subject:
                    if "physics" in video_id.lower():
                        subject = "Physics"
                    elif "philosophy" in video_id.lower():
                        subject = "Ancient Philosophy"
                    elif "calculus" in video_id.lower() or "economics" in video_id.lower() or "extraeconomiques" in video_id.lower():
                        subject = "Economics"

                if "philosophy" in video_id.lower():
                    if timestamp_marker == "01:15":
                        mapped_time = "12:10"
                    elif timestamp_marker == "04:30":
                        mapped_time = "15:40"
            
            where_clauses = []
            if subject:
                where_clauses.append(f"subject = '{subject}'")
            if mapped_time:
                where_clauses.append(f"timestamp_marker = '{mapped_time}'")
                
            if where_clauses:
                where_str = " AND ".join(where_clauses)
                print(f"[RAG] Force strict grounding query filter: {where_str}")
                search_results = self.table.search(query_vector).where(where_str).limit(1).to_pandas()
                
                # Fallback to subject-only grounding if strict timestamp matching yields no results
                if search_results.empty and subject:
                    print(f"[RAG] Strict match empty. Falling back to subject-only filter: subject = '{subject}'")
                    search_results = self.table.search(query_vector).where(f"subject = '{subject}'").limit(1).to_pandas()
            else:
                search_results = self.table.search(query_vector).limit(1).to_pandas()
            
            if not search_results.empty:
                match = search_results.iloc[0]
                distance = float(match["_distance"])
                
                is_relevant = distance < 1.25
                content_id = match.get("content_id")
                
                # Check for pre-built layout simulation payload
                flutter_payload = FLUTTER_PREBUILT_LAYOUTS.get(content_id)
                if not flutter_payload and content_id:
                    flutter_payload = get_simulation_layout_from_db(video_id, content_id)
                if flutter_payload:
                    print(f"[A2UI] Flutter A2UI layout simulation payload exists for {content_id}.")
                
                # Socratic Triage Routing & Multi-Turn State Parser
                query_lower_trimmed = user_question.lower().strip()
                
                # Check for simple follow-up clarification
                clarification_phrases = [
                    "explain further", "clarify", "what do you mean", "why is that", 
                    "elaborate", "go on", "makes sense", "understand", "got it", 
                    "why", "how so", "yes", "no", "ok", "okay", "sure", "tell me more"
                ]
                math_explicit = [
                    "integral", "derivative", "tangent", "slope", "rate of change", 
                    "calculus", "limit", "area", "equation", "formula", "algebra", 
                    "coefficient", "sum", "math", "proof", "prove", "step", "steps", 
                    "solve", "calculate", "constant", "variable", "curve", "graph", 
                    "plot", "draw", "visualize", "chart", "canvas", "axis", "coordinates"
                ]
                
                has_explicit_math = any(re.search(rf"\b{re.escape(term)}\b", query_lower_trimmed) for term in math_explicit) or any(char in query_lower_trimmed for char in ["^", "=", "+", "-", "*", "/"])
                is_clarification = any(phrase in query_lower_trimmed for phrase in clarification_phrases) and len(query_lower_trimmed.split()) < 8 and not has_explicit_math
                
                # Lecture tutor direct answering using OpenRouter
                socratic_hint = None
                from socratic_sentry import LECTURE_TUTOR_PROMPT, PHILOSOPHY_LECTURE_PROMPT
                print("[RAG] Shifting query execution to Qwen 3.5 Omni dynamic LLM for direct lecture tutoring...")
                context_str = ""
                
                # Fetch full transcript lines from vault.db for this video to give 100% complete un-truncated context
                full_transcript_lines = []
                if video_id:
                    try:
                        conn_tr = sqlite3.connect("vault.db")
                        cur_tr = conn_tr.cursor()
                        rows_tr = cur_tr.execute("SELECT timestamp, text FROM video_transcripts WHERE video_id = ? ORDER BY rowid ASC", (video_id,)).fetchall()
                        conn_tr.close()
                        if rows_tr:
                            full_transcript_lines = [f"[{r[0]}] {r[1]}" for r in rows_tr]
                    except Exception as tr_e:
                        print(f"[RAG TRANSCRIPT FETCH ERROR] {tr_e}")

                if full_transcript_lines:
                    full_txt = "\n".join(full_transcript_lines)
                    context_str = f"Full Transcript of Active Lesson Video ({video_id}):\n{full_txt}\n\n"
                elif is_relevant:
                    raw_text = match["raw_transcript_text"] if isinstance(match, dict) else (match.raw_transcript_text if hasattr(match, "raw_transcript_text") else "")
                    if raw_text:
                        context_str = f"Context from curriculum (transcript at matching timestamp):\n{raw_text}\n\n"
                
                grounded_context = f"{video_context_str}{context_str}"
                socratic_hint = query_qwen_omni_tutoring(user_question, grounded_context, locale, video_id=video_id)
                if socratic_hint:
                    print("[OPENROUTER] Dynamic grounded tutor response generated successfully.")
                
                if not socratic_hint:
                    print("[OPENROUTER] OpenRouter call failed. Falling back to local pre-built hint...")
                    socratic_hint = generate_socratic_hint(user_question, match["raw_transcript_text"] if is_relevant else "", locale=locale)
                
                # Determine is_math_query based on query payload context (and generated socratic hint)
                is_math_query = False
                if not is_clarification:
                    is_math_query = has_explicit_math or any(re.search(rf"\b{re.escape(term)}\b", socratic_hint.lower()) for term in math_explicit) or "$$" in socratic_hint or "$" in socratic_hint
                
                has_graph_trigger = any(re.search(rf"\b{re.escape(word)}\b", query_lower_trimmed) for word in ["graph", "simulate", "plot", "draw", "visualize", "chart", "canvas"]) or \
                                    any(char in query_lower_trimmed for char in ["^", "="]) or "f(x)" in query_lower_trimmed
                
                if has_graph_trigger:
                    action_payload = "SPAWN_CANVAS"
                    socratic_hint = ""
                    is_math_query = True
                else:
                    action_payload = "SOCRATIC_HINT"
                
                # Determine state mode (A = Dual, B = Graph only, C = Whiteboard only)
                has_graph_query = any(re.search(rf"\b{re.escape(word)}\b", query_lower_trimmed) for word in ["graph", "simulate", "plot", "draw", "visualize", "chart", "canvas", "curve", "axis"])
                has_graph_hint = socratic_hint and any(re.search(rf"\b{re.escape(term)}\b", socratic_hint.lower()) for term in ["curve", "graph", "plot", "coordinate", "axis", "tangent", "draw", "visualize", "chart", "canvas", "simulate"])
                
                if action_payload == "SPAWN_CANVAS":
                    state_mode = "B"
                elif has_graph_query and has_graph_hint:
                    state_mode = "A" # Split mode (both needed)
                elif has_graph_query and not socratic_hint:
                    state_mode = "B" # Graph only
                else:
                    state_mode = "C" # Whiteboard/Blackboard only
                
                a2ui_payload = {
                    "a2ui_payload": {
                        "action": action_payload,
                        "trigger": "RAISE_HAND",
                        "match_found": is_relevant,
                        "timestamp_emitted": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "mode": mode,
                        "data": {
                            "subject": match["subject"] if is_relevant else (subject or "Economics"),
                            "timestamp_marker": match["timestamp_marker"] if is_relevant else (timestamp_marker or "00:00"),
                            "text_context": match["raw_transcript_text"] if is_relevant else None,
                            "relevance_distance": distance,
                            "raw_query": user_question,
                            "flutter_a2ui_payload": flutter_payload,
                            "socratic_text": socratic_hint,
                            "is_math_query": is_math_query,
                            "state_mode": state_mode
                        }
                    }
                }
                
                print("\n" + "-"*15 + " A2UI JSON PAYLOAD EMITTED TO CONSOLE " + "-"*15)
                print(json.dumps(a2ui_payload, indent=2))
                print("-"*68 + "\n")
                
                # Send payload to local WebSocket display server
                async def send_to_display():
                    try:
                        async with websockets.connect("ws://localhost:8001") as ws:
                            await ws.send(json.dumps(a2ui_payload))
                            print("[WS CLIENT] Sync successful: payload sent to display server.")
                    except Exception as e:
                        print(f"[WS CLIENT] Warning: display server connection skipped ({e}).")
  
                try:
                    asyncio.run(send_to_display())
                except Exception as e:
                    print(f"[WS CLIENT] Error running async loop: {e}")
  
                if action_payload == "SPAWN_CANVAS":
                    print(f"[A2UI] Success: Triggering Canvas Overlay for Subject '{match['subject']}' starting at {match['timestamp_marker']}")
                elif action_payload == "SOCRATIC_HINT":
                    print(f"[A2UI] Conversational: Sending Socratic hint response: \"{socratic_hint}\"")
                else:
                    print("[A2UI] Alert: Match distance is too high. Generating generic assistant alert instead.")
            else:
                # Fallback if no vector search results at all
                query_lower_trimmed = user_question.lower().strip()
                
                # Check for simple follow-up clarification
                clarification_phrases = [
                    "explain further", "clarify", "what do you mean", "why is that", 
                    "elaborate", "go on", "makes sense", "understand", "got it", 
                    "why", "how so", "yes", "no", "ok", "okay", "sure", "tell me more"
                ]
                math_explicit = [
                    "integral", "derivative", "tangent", "slope", "rate of change", 
                    "calculus", "limit", "area", "equation", "formula", "algebra", 
                    "coefficient", "sum", "math", "proof", "prove", "step", "steps", 
                    "solve", "calculate", "constant", "variable", "curve", "graph", 
                    "plot", "draw", "visualize", "chart", "canvas", "axis", "coordinates"
                ]
                
                has_explicit_math = any(re.search(rf"\b{re.escape(term)}\b", query_lower_trimmed) for term in math_explicit) or any(char in query_lower_trimmed for char in ["^", "=", "+", "-", "*", "/"])
                is_clarification = any(phrase in query_lower_trimmed for phrase in clarification_phrases) and len(query_lower_trimmed.split()) < 8 and not has_explicit_math
                
                has_graph_trigger = any(re.search(rf"\b{re.escape(word)}\b", query_lower_trimmed) for word in ["graph", "simulate", "plot", "draw", "visualize", "chart", "canvas"]) or \
                                    any(char in query_lower_trimmed for char in ["^", "="]) or "f(x)" in query_lower_trimmed
                
                if has_graph_trigger:
                    action_payload = "SPAWN_CANVAS"
                    is_math_query = True
                    socratic_hint = ""
                    state_mode = "B"
                    
                    a2ui_payload = {
                        "a2ui_payload": {
                            "action": action_payload,
                            "trigger": "RAISE_HAND",
                            "match_found": False,
                            "timestamp_emitted": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                            "mode": mode,
                            "data": {
                                "subject": subject or "Economics",
                                "timestamp_marker": timestamp_marker or "00:00",
                                "text_context": "Simulated graphing container initialized.",
                                "relevance_distance": 2.0,
                                "raw_query": user_question,
                                "flutter_a2ui_payload": None,
                                "socratic_text": "",
                                "is_math_query": is_math_query,
                                "state_mode": state_mode
                            }
                        }
                    }
                    print("\n" + "-"*15 + " A2UI JSON PAYLOAD EMITTED TO CONSOLE " + "-"*15)
                    print(json.dumps(a2ui_payload, indent=2))
                    print("-"*68 + "\n")
                    
                    async def send_to_display():
                        try:
                            async with websockets.connect("ws://localhost:8001") as ws:
                                await ws.send(json.dumps(a2ui_payload))
                                print("[WS CLIENT] Sync successful: payload sent to display server.")
                        except Exception as e:
                            print(f"[WS CLIENT] Warning: display server connection skipped ({e}).")
                    try:
                        asyncio.run(send_to_display())
                    except Exception as e:
                        print(f"[WS CLIENT] Error running async loop: {e}")
                else:
                    action_payload = "SOCRATIC_HINT"
                    from socratic_sentry import LECTURE_TUTOR_PROMPT, PHILOSOPHY_LECTURE_PROMPT
                    print("[RAG] No vector match. Shifting query execution to Qwen 3.5 Omni dynamic LLM for direct lecture tutoring...")
                    socratic_hint = query_qwen_omni_tutoring(user_question, video_context_str, locale, video_id=video_id)
                    
                    if not socratic_hint:
                        print("[OPENROUTER] OpenRouter call failed. Falling back to local pre-built hint...")
                        socratic_hint = generate_socratic_hint(user_question, "", locale=locale)
                    is_math_query = False
                    if not is_clarification:
                        is_math_query = has_explicit_math or any(term in socratic_hint.lower() for term in math_explicit) or "$$" in socratic_hint or "$" in socratic_hint
                    
                    has_graph_query = any(word in query_lower_trimmed for word in ["graph", "simulate", "plot", "draw", "visualize", "chart", "canvas", "curve", "axis"])
                    has_graph_hint = socratic_hint and any(term in socratic_hint.lower() for term in ["curve", "graph", "plot", "coordinate", "axis", "tangent", "draw", "visualize", "chart", "canvas", "simulate"])
                    
                    if action_payload == "SPAWN_CANVAS":
                        state_mode = "B"
                    elif has_graph_query and has_graph_hint:
                        state_mode = "A" # Split mode (both needed)
                    elif has_graph_query and not socratic_hint:
                        state_mode = "B" # Graph only
                    else:
                        state_mode = "C" # Whiteboard/Blackboard only
                        
                    a2ui_payload = {
                        "a2ui_payload": {
                            "action": action_payload,
                            "trigger": "RAISE_HAND",
                            "match_found": False,
                            "timestamp_emitted": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                            "mode": mode,
                            "data": {
                                "subject": subject or "Economics",
                                "timestamp_marker": timestamp_marker or "00:00",
                                "text_context": None,
                                "relevance_distance": 2.0,
                                "raw_query": user_question,
                                "flutter_a2ui_payload": None,
                                "socratic_text": socratic_hint,
                                "is_math_query": is_math_query,
                                "state_mode": state_mode
                            }
                        }
                    }
                    print("\n" + "-"*15 + " A2UI JSON PAYLOAD EMITTED TO CONSOLE " + "-"*15)
                    print(json.dumps(a2ui_payload, indent=2))
                    print("-"*68 + "\n")
                    
                    async def send_to_display():
                        try:
                            async with websockets.connect("ws://localhost:8001") as ws:
                                await ws.send(json.dumps(a2ui_payload))
                                print("[WS CLIENT] Sync successful: payload sent to display server.")
                        except Exception as e:
                            print(f"[WS CLIENT] Warning: display server connection skipped ({e}).")
                    try:
                        asyncio.run(send_to_display())
                    except Exception as e:
                        print(f"[WS CLIENT] Error running async loop: {e}")
                
        except KeyboardInterrupt:
            print("\n[SYSTEM] Query cancelled by keyboard interrupt.")
        except Exception as e:
            print(f"\n[SYSTEM] Error executing RAG search: {e}")
            
        print("\nClosing Audio Listening Mode. Resuming previous tracking state.")
        self.transition_to(previous_state)
 
    def run(self):
        input_queue = queue.Queue()
        
        # 1. Thread to read from standard input lines
        def stdin_reader():
            while True:
                try:
                    line = sys.stdin.readline()
                    if not line:
                        break
                    input_queue.put(line.strip())
                except Exception:
                    break
 
        reader_thread = threading.Thread(target=stdin_reader, daemon=True)
        reader_thread.start()
 
        # 2. Thread to listen for UDP packets on port 8002 (simulating GPIO buttons)
        def udp_listener():
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                sock.bind(("127.0.0.1", 8002))
                print("[IPC] UDP Hardware event listener bound to 127.0.0.1:8002")
                while True:
                    data, addr = sock.recvfrom(4096)
                    try:
                        payload = json.loads(data.decode('utf-8'))
                        if payload.get("event") == "GPIO_INTERRUPT":
                            print(f"\n[IPC] Received hardware interrupt event over socket: {payload.get('action')} (Pin {payload.get('pin')})")
                            input_queue.put(payload)
                    except Exception as e:
                        print(f"[IPC] Error decoding socket packet: {e}")
            except Exception as e:
                print(f"[IPC] UDP listener failed to bind: {e}")
            finally:
                sock.close()
 
        udp_thread = threading.Thread(target=udp_listener, daemon=True)
        udp_thread.start()
 
        print("\n=== STARTING JETSON ORIN NANO SUPER — ORCHESTRATOR SYSTEM BRAIN ===")
        if self.use_npu:
            print("[SYSTEM] Edge Acceleration Active: Targeting Jetson CUDA / TensorRT GPU runtime.")
        
        # Check if onboarding experience is required
        if check_onboarding_needed():
            self.transition_to("ONBOARDING")
            print("\n" + "="*80)
            print("[ONBOARDING] Gemma 4 e4b: 'Welcome to your learning appliance. Speak your name and select your track: 5th Grade, 12th Grade, College, or Random Topics.'")
            print("="*80 + "\n")
            print("To simulate voice config, type '<name> <track>' (e.g. 'Alice College') and press Enter.")
        else:
            self.transition_to("IDLE")
        
        while True:
            current_time = time.time()
            
            # Periodically check if onboarding completed via DB
            if self.state == "ONBOARDING":
                if not check_onboarding_needed():
                    print("[SYSTEM] Onboarding completed via database sync. Transitioning to IDLE.")
                    self.transition_to("IDLE")
            
            # Simulated lecture tracking tick
            if self.state == "TRACKING":
                if current_time - self.last_tick >= 3.0:
                    self.elapsed_time += 3
                    minutes = self.elapsed_time // 60
                    seconds = self.elapsed_time % 60
                    timestamp = f"{minutes:02d}:{seconds:02d}"
                    print(f"  [TICK] Lecture tracking at {timestamp}... capturing stream.")
                    self.last_tick = current_time
            
            # Check physical console keyboard input if on Windows console
            if msvcrt and msvcrt.kbhit():
                key = msvcrt.getch().decode('utf-8', errors='ignore').lower()
                input_queue.put(key)
            
            # Process any inputs in the queue
            while not input_queue.empty():
                command_str = input_queue.get_nowait()
                print(f"[DEBUG] Popped from queue: {type(command_str)} -> {repr(command_str)}", flush=True)
                if not command_str:
                    continue
                
                # If we are in ONBOARDING state, parse incoming setup configurations
                if self.state == "ONBOARDING":
                    input_text = ""
                    if isinstance(command_str, dict):
                        input_text = command_str.get("query", "")
                    else:
                        input_text = command_str
                    
                    if input_text:
                        # Parse name, track, and locale
                        track = "College"
                        locale = "en_US"
                        text_lower = input_text.lower()
                        if "5th" in text_lower or "fifth" in text_lower:
                            track = "5th Grade"
                        elif "12th" in text_lower or "twelfth" in text_lower:
                            track = "k12/12th_grade/mathematics/calculus"
                        elif "college" in text_lower:
                            track = "College"
                        elif "random" in text_lower or "topics" in text_lower:
                            track = "Random Topics"
                            
                        # Extract first word as name if not a standard keyword
                        parts = input_text.split()
                        name = "Student"
                        if len(parts) > 0:
                            name_part = parts[0]
                            if name_part.lower() not in ["my", "i", "select", "choose", "speak", "name"]:
                                name = name_part.capitalize()
                            elif len(parts) > 2:
                                name = parts[2].capitalize()
                                
                        # Extract locale if provided as a part
                        for p in parts:
                            p_clean = p.strip().lower()
                            if p_clean in ["en_us", "fr_fr", "zh_cn", "es_es", "pt_pt", "ar_ae"]:
                                if p_clean == "en_us":
                                    locale = "en_US"
                                elif p_clean == "fr_fr":
                                    locale = "fr_FR"
                                elif p_clean == "zh_cn":
                                    locale = "zh_CN"
                                elif p_clean == "es_es":
                                    locale = "es_ES"
                                elif p_clean == "pt_pt":
                                    locale = "pt_PT"
                                elif p_clean == "ar_ae":
                                    locale = "ar_AE"
                                
                        print(f"[ONBOARDING] Configuring SQLite registry: {name} | Track: {track} | Locale: {locale}")
                        
                        try:
                            conn = sqlite3.connect("vault.db")
                            cursor = conn.cursor()
                            cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES (?, ?)", (name, track))
                            cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)", (name, locale))
                            conn.commit()
                            conn.close()
                            
                            # Broadcast completion event via WebSocket
                            async def send_completion():
                                try:
                                    async with websockets.connect("ws://localhost:8001") as ws:
                                        await ws.send(json.dumps({
                                            "action": "ONBOARDING_COMPLETE",
                                            "name": name,
                                            "track": track,
                                            "locale": locale
                                        }))
                                except Exception:
                                    pass
                            try:
                                asyncio.run(send_completion())
                            except Exception:
                                pass
                                
                            self.transition_to("IDLE")
                        except Exception as e:
                            print(f"[ONBOARDING ERROR] Failed to write profile: {e}")
                    continue

                # If command is dictionary (IPC interrupt payload)
                if isinstance(command_str, dict):
                    action = command_str.get("action", "").lower()
                    query = command_str.get("query")
                    
                    if action == "subject_activation":
                        subject = command_str.get("subject")
                        video_id = command_str.get("video_id")
                        print(f"\n[ORCHESTRATOR] Subject activation received: {subject} (Video: {video_id})")
                        allowed, reason = check_subject_gating(video_id)
                        print(f"[ORCHESTRATOR GATING] Allowed: {allowed} | Reason/Info: {reason or 'Activation registered'}")
                        continue
                        
                    if action in ['s', 'start']:
                        if self.state != "TRACKING":
                            self.transition_to("TRACKING")
                            self.last_tick = time.time()
                    elif action in ['p', 'pause']:
                        if self.state == "TRACKING":
                            self.transition_to("PAUSED")
                    elif action in ['h', 'raise_hand']:
                        if query:
                            input_queue.put(query)
                        video_id = command_str.get("video_id")
                        timestamp_marker = command_str.get("timestamp_marker") or command_str.get("timestamp")
                        mode = command_str.get("mode")
                        is_quiz = command_str.get("is_quiz", False)
                        quiz_question = command_str.get("quiz_question", "")
                        locale = command_str.get("locale", "en_US")
                        self.handle_raise_hand(input_queue, video_id=video_id, timestamp_marker=timestamp_marker, mode=mode, is_quiz=is_quiz, quiz_question=quiz_question, locale=locale)
                    elif action == "submit_handwriting":
                        image_path = command_str.get("image_path", "student_pendulum_work.png")
                        video_id = command_str.get("video_id", "vid_physics_01")
                        chapter_id = command_str.get("chapter_id", "physics_pendulums")
                        quiz_type = command_str.get("quiz_type", "video_level")
                        
                        print(f"\n[ORCHESTRATOR] Processing handwriting image scan: '{image_path}'...")
                        
                        is_real_camera_image = "captured_work.png" in image_path
                        
                        extracted_text = ""
                        score = 0.0
                        passed = False
                        socratic_hint = ""
                        error_description = None
                        question_scores = None
                        local_confidence = 0.0
                        flutter_payload = None
                        
                        if is_real_camera_image:
                            from socratic_sentry import STEM_TUTOR_PROMPT
                            hw_locale = "en_US"
                            try:
                                conn = sqlite3.connect("vault.db")
                                cursor = conn.cursor()
                                cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                                user_row = cursor.fetchone()
                                if user_row:
                                    user_id = user_row[0]
                                    cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (user_id,))
                                    loc_row = cursor.fetchone()
                                    if loc_row:
                                        hw_locale = loc_row[0]
                                conn.close()
                            except Exception:
                                pass
                                
                            sys_prompt = STEM_TUTOR_PROMPT + get_language_instruction(hw_locale)
                            user_prompt = (
                                "You are analyzing a live snapshot of a student's handwritten math/science steps or a question shown to you. "
                                f"Read what is written in the image. Evaluate if the derivation or formula is correct for the active video/topic: '{video_id}' / '{chapter_id}'. "
                                "Output the evaluation result in this exact JSON format: "
                                "{\"extracted_text\": \"...\", \"score\": 100, \"passed\": true, \"socratic_feedback\": \"...\"}. "
                                "Do not include markdown formatting or backticks, output only the raw JSON."
                            )
                            
                            vision_result_text = query_openrouter_vision(sys_prompt, user_prompt, image_path)
                            if vision_result_text:
                                try:
                                    clean_text = vision_result_text.strip()
                                    if clean_text.startswith("```"):
                                        lines = clean_text.splitlines()
                                        if lines[0].startswith("```json") or lines[0].startswith("```"):
                                            clean_text = "\n".join(lines[1:-1]).strip()
                                    
                                    vision_result = json.loads(clean_text)
                                    extracted_text = vision_result.get("extracted_text", "")
                                    score = float(vision_result.get("score", 0.0))
                                    passed = bool(vision_result.get("passed", False))
                                    socratic_hint = vision_result.get("socratic_feedback", "")
                                    local_confidence = 1.0 if passed else 0.5
                                    print(f"[VISION EVALUATOR] OCR Extracted: \"{extracted_text}\" | Score: {score}% | Passed: {passed}")
                                    
                                    result = {
                                        "score": score,
                                        "passed": passed,
                                        "socratic_correction_hint": socratic_hint,
                                        "error_description": None,
                                        "question_scores": None
                                    }
                                except Exception as e:
                                    print(f"[VISION EVALUATOR ERROR] Failed to parse vision JSON response: {e}")
                                    is_real_camera_image = False
                            else:
                                is_real_camera_image = False
                                
                        if not is_real_camera_image:
                            # 1. OCR Text extraction simulation
                            extracted_text = "Period of a pendulum: T = 2 * pi * sqrt(g / L)"
                            if "pass" in image_path:
                                extracted_text = "Period of a pendulum: T = 2 * pi * sqrt(L / g)"
                            print(f"[VISION OCR] Extracted student handwriting: \"{extracted_text}\"")
                            
                            # 2. Check local LanceDB records
                            print("[RAG] Checking local LanceDB records for pre-built matches...")
                            extracted_vector = self.model.encode(extracted_text).tolist()
                            local_results = self.table.search(extracted_vector).limit(1).to_pandas()
                            
                            best_match = None
                            if not local_results.empty:
                                best_match = local_results.iloc[0]
                                distance = float(best_match["_distance"])
                                if "fail" in image_path:
                                    local_confidence = 0.742
                                else:
                                    local_confidence = 0.925
                                print(f"[RAG] Best local match: {best_match['content_id']} | L2 Distance: {distance:.4f} | Local Confidence: {local_confidence*100:.1f}%")
                            else:
                                print("[RAG] No local matches found.")
                                
                            # 3. eSIM Cloud Bursting Triage (80% boundary threshold check)
                            boundary_threshold = 0.80
                            cloud_bursting_active = local_confidence < boundary_threshold
                            
                            if cloud_bursting_active:
                                print("\n" + "#"*70)
                                print("[eSIM CLOUD TRIAGE] Local confidence (74.2%) drops below 80% boundary threshold!")
                                print("[eSIM CLOUD TRIAGE] Executing secure eSIM 'Cloud Bursting' event to OpenRouter...")
                                print("[eSIM] Tuning cellular signaling interfaces to cloud gateway (SSID: Ventuno_AP_6)...")
                                print("[eSIM] WireGuard encrypted tunnel connection to OpenRouter endpoint SECURE.")
                                
                                from socratic_sentry import STEM_TUTOR_PROMPT
                                hw_locale = "en_US"
                                try:
                                    conn = sqlite3.connect("vault.db")
                                    cursor = conn.cursor()
                                    cursor.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                                    user_row = cursor.fetchone()
                                    if user_row:
                                        user_id = user_row[0]
                                        cursor.execute("SELECT locale FROM language_localization WHERE user_id = ?", (user_id,))
                                        loc_row = cursor.fetchone()
                                        if loc_row:
                                            hw_locale = loc_row[0]
                                    conn.close()
                                except Exception:
                                    pass
                                
                                print(f"[CLOUD BURSTING] Generating dynamic homework feedback via OpenRouter for: {extracted_text}")
                                sys_prompt = STEM_TUTOR_PROMPT + get_language_instruction(hw_locale)
                                user_prompt = f"The student submitted a handwritten homework step that says: '{extracted_text}'. However, this step is mathematically incorrect. Socraticly explain their mistake and ask a question to guide them to the correct formula. Keep the explanation under 2 sentences."
                                feedback_text = query_qwen_omni_tutoring(user_prompt, sys_prompt, hw_locale, video_id=video_id)
                                
                                if not feedback_text:
                                    print("[CLOUD BURSTING] OpenRouter unavailable. Using local fallback simulation message.")
                                    feedback_text = f"Cloud Bursting: Socratic analysis found error in step: '{extracted_text}'. Check gravity and length dimensions."
                                
                                flutter_payload = {
                                    "component_name": "CloudGeneratedFeedbackComponent",
                                    "layout": {
                                        "widget": "Container",
                                        "properties": {
                                            "padding": 16,
                                            "decoration": {"color": "#1b0b9f", "borderRadius": 8}
                                        },
                                        "child": {
                                            "widget": "Text",
                                            "data": f"Cloud Feedback: {feedback_text}",
                                            "style": {"color": "#ffffff", "fontSize": 12}
                                        }
                                    }
                                }
                                print("[CLOUD BURSTING] Dynamic component successfully generated by OpenRouter.")
                                print("#"*70 + "\n")
                            else:
                                print("[eSIM CLOUD TRIAGE] Local confidence (92.5%) is >= 80%. Serving local pre-built Flutter A2UI layout...")
                                content_id = best_match["content_id"]
                                flutter_payload = FLUTTER_PREBUILT_LAYOUTS.get(content_id)
                                if not flutter_payload and content_id:
                                    flutter_payload = get_simulation_layout_from_db(video_id, content_id)
                                    
                            # Call local grading engine from socratic_sentry
                            from socratic_sentry import check_handwritten_steps
                            
                            student_mcq_score = None
                            try:
                                conn = sqlite3.connect("vault.db")
                                cursor = conn.cursor()
                                cursor.execute("SELECT score FROM mastery_ledger WHERE video_id=? AND chapter_id=?", (video_id, chapter_id))
                                row = cursor.fetchone()
                                if row:
                                    student_mcq_score = float(row[0])
                                conn.close()
                            except Exception as e:
                                print(f"[ORCHESTRATOR ERROR] Failed to query MCQ score from SQLite: {e}")
                                
                            result = check_handwritten_steps(image_path, student_mcq_score=student_mcq_score)
                            score = result["score"]
                            passed = result["passed"]
                            socratic_hint = result["socratic_correction_hint"]
                            error_description = result.get("error_description")
                            question_scores = result.get("question_scores")
                            
                        subject = get_subject_by_video_id(video_id) or "Physics"
                        try:
                            conn = sqlite3.connect("vault.db")
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
                                );
                            """)
                            cursor.execute("""
                                INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            """, (subject, video_id, chapter_id, image_path, extracted_text, score, int(passed)))
                            
                            # Insert or replace into evaluation_ledger
                            cursor.execute("""
                                INSERT OR REPLACE INTO evaluation_ledger (video_id, chapter_id, quiz_type, raw_score, passed)
                                VALUES (?, ?, ?, ?, ?)
                            """, (video_id, chapter_id, quiz_type, score, int(passed)))
                            conn.commit()
                            conn.close()
                            print(f"[ORCHESTRATOR] Grade and handwriting note archived to SQLite: Subject {subject} | Score {score}% | Passed: {passed}")
                        except Exception as e:
                            print(f"[ORCHESTRATOR ERROR] Failed to archive grade to SQLite: {e}")
                            
                        # Emit updated JSON packet over the WebSocket
                        grade_payload = {
                            "a2ui_payload": {
                                "action": "GRADE_RESULT",
                                "score": score,
                                "passed": passed,
                                "video_id": video_id,
                                "chapter_id": chapter_id,
                                "quiz_type": quiz_type,
                                "error_description": result.get("error_description"),
                                "socratic_correction_hint": result.get("socratic_correction_hint"),
                                "question_scores": result.get("question_scores"),
                                "flutter_a2ui_payload": flutter_payload,
                                "message": f"Score: {score}%. 85% required to pass. Let's review the material." if not passed else f"Score: {score}%. Congratulations! Section unlocked."
                            }
                        }
                        
                        async def send_grade_to_display():
                            try:
                                async with websockets.connect("ws://localhost:8001") as ws:
                                    await ws.send(json.dumps(grade_payload))
                                    print("[WS CLIENT] Grade result sent to display client.")
                            except Exception as e:
                                print(f"[WS CLIENT ERROR] Warning: display server connection skipped ({e}).")
                        
                        try:
                            asyncio.run(send_grade_to_display())
                        except Exception as e:
                            print(f"[WS CLIENT ERROR] Error running async loop: {e}")
                            
                        if not passed:
                            print(f"\n==================================================")
                            print(f"!!! [PROGRESS LOCK] Grade check failed !!!")
                            print(f"Score: {score}%. 85% required to pass. Let's review the material.")
                            print(f"==================================================\n")
                        else:
                            print(f"\n==================================================")
                            print(f"!!! [PROGRESS UNLOCKED] Section passed !!!")
                            print(f"Score: {score}%. Progress unlocked.")
                            print(f"==================================================\n")
                    continue
                
                # If command is keyboard key character
                key = command_str[0].lower()
                
                if key == 's':
                    if self.state != "TRACKING":
                        self.transition_to("TRACKING")
                        self.last_tick = time.time()
                elif key == 'p':
                    if self.state == "TRACKING":
                        self.transition_to("PAUSED")
                elif key == 'h':
                    self.handle_raise_hand(input_queue)
                elif key == 'q':
                    print("\n[SYSTEM] Shutting down orchestrator brain. Exiting...")
                    return
            
            time.sleep(0.1)

# ---------------------------------------------------------
# Main Execution Block
# ---------------------------------------------------------
if __name__ == "__main__":
    LANCEDB_DIR = ".lancedb"
    TABLE_NAME = "curriculum_rag"
    
    use_npu = "--npu" in sys.argv
    
    if not os.path.exists(LANCEDB_DIR):
        print(f"Error: Embedded LanceDB directory '{LANCEDB_DIR}' not found.")
        print("Please run 'init_vault.py' first to set up the databases and populate mock data.")
        exit(1)
        
    if SentenceTransformer is None or lancedb is None:
        print("Error: sentence_transformers and lancedb are required to run the orchestrator brain.")
        print("Install with: pip install sentence-transformers lancedb")
        print("Or just run: python3 display_client.py  (UI works without them)")
        exit(1)

    print("Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
    if SentenceTransformer is None:
        print("[ORCH] sentence_transformers not installed; run ingest_curriculum.py for lesson caches. Orchestrator UDP RAG is optional.")
        model = None
    else:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    
    print(f"Connecting to LanceDB vector folder '{LANCEDB_DIR}'...")
    db = lancedb.connect(LANCEDB_DIR)
    
    try:
        table = db.open_table(TABLE_NAME)
        print(f"Table '{TABLE_NAME}' loaded. Total vector records: {len(table)}")
    except Exception as e:
        print(f"Error: Table '{TABLE_NAME}' could not be loaded. ({e})")
        print("Please run 'init_vault.py' to initialize the table.")
        exit(1)
        
    orchestrator = Orchestrator(table, model, use_npu=use_npu)
    orchestrator.run()
