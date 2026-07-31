# display_client.py - Ventuno Q Display Client Server
# Note: The 5-second flower video file placeholder is completely removed.
# The dashboard now strictly uses local full-length calculus/physics tracks.
# Coordination Patch: Whiteboard LaTeX rendering, active video interlocks, and z-index layer/speech mask/flex grid enabled.

import os
import asyncio
import http.server
import socketserver
import threading
import websockets
import sqlite3
import json
from orchestrator import check_subject_gating, get_subject_by_video_id

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


HTTP_PORT = 8000
WS_PORT = 8001

# Track connected WebSocket client sockets
connected_clients = set()

# MCQ Quiz questions answers mapping for grading
QUIZ_QUESTIONS = {
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
    },
    "Chemistry": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "B" }
        ],
        "alternative": [
            { "id": 1, "correct": "C" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "B" }
        ]
    }
}

# ---------------------------------------------------------
# 1. HTTP Server for Serving index.html Dashboard
# ---------------------------------------------------------
class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Suppress request logs to keep orchestrator console outputs clean
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        clean_path = self.path.split('?')[0]
        
        # Onboarding redirect: if database user profiles table is empty, redirect index page requests to onboarding
        if clean_path in ['', '/', '/index.html', '/index']:
            db_path = "vault.db"
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
                
                # Resolve instructor name based on track/video mapping
                v_id = None
                if active_track in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"]:
                    v_id = "vid_calculus_01"
                elif active_track == "5th Grade" or active_track == "College":
                    v_id = "vid_physics_01"
                else:
                    v_id = "vid_philosophy_01"

                instructor_name = "Professor Evans"
                if v_id:
                    if "physics" in v_id.lower():
                        instructor_name = "Dr. Harris"
                    elif "philosophy" in v_id.lower():
                        instructor_name = "Professor Marcus"

                # Dynamic relational binding injection
                interests_str = raw_track.split("|")[0] if "|" in raw_track else raw_track
                data_injection = f"<script>window.ACTIVE_DATABASE_TRACK = {json.dumps(active_track)}; window.ACTIVE_DATABASE_INTERESTS = {json.dumps(interests_str)}; window.ACTIVE_DATABASE_USER = {json.dumps(student_name)}; window.ACTIVE_DATABASE_INSTRUCTOR = {json.dumps(instructor_name)}; window.ACTIVE_DATABASE_LOCALE = {json.dumps(active_locale)};</script>"
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
            self.path = '/onboarding.html'
            return super().do_GET()

        # Route for Parent Progress Report
        if clean_path in ['/report', '/report.html']:
            db_path = "vault.db"
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
            
            db_path = "vault.db"
            stats = {
                "users": [],
                "mastery": [],
                "evaluations": []
            }
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT u.user_id, u.background_context, l.locale 
                        FROM user_profiles u 
                        LEFT JOIN language_localization l ON u.user_id = l.user_id
                        ORDER BY u.ROWID ASC
                    """)
                    for row in cursor.fetchall():
                        bg = row[1]
                        if bg and "|" in bg:
                            bg = bg.split("|")[1]
                        stats["users"].append({
                            "user_id": row[0],
                            "background_context": bg,
                            "locale": row[2] or "en_US"
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
            translations = {
                "fr_FR": {
                    "Calculus is the mathematical study of continuous change, encompassing differential calculus and integral calculus.": 
                        "Le calcul est l'étude mathématique du changement continu, englobant le calcul différentiel et le calcul intégral.",
                    "The derivative of a function f(x) represents the instantaneous rate of change of the function value with respect to its variable x.": 
                        "La dérivée d'une fonction f(x) représente le taux de variation instantané de la valeur de la fonction par rapport à sa variable x.",
                    "Geometrically, the derivative at a point x corresponds to the slope m of the tangent line to the function graph f(x) = x^3 - 3x.": 
                        "Géométriquement, la dérivée en un point x correspond à la pente m de la tangente au graphique de la fonction f(x) = x^3 - 3x.",
                    "Chemistry is the study of matter, its properties, how and why substances combine or separate.": 
                        "La chimie est l'étude de la matière, de ses propriétés, de comment et pourquoi les substances se combinent ou se séparent.",
                    "Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.": 
                        "La physique est la science naturelle qui étudie la matière, ses constituants fondamentaux, son mouvement et son comportement à travers l'espace et le temps."
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
                        "La física es la ciencia natural que estudia la materia, sus constituyentes fundamentales, su movimiento y comportamiento a través del espacio y el tiempo."
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
                        "物理学是研究物质、其基本组成部分、其在空间和时间中的运动和行为的自然科学。"
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
                        "A física é a ciência natural que estuda a matéria, seus constituintes fundamentais, seu movimento e comportamento através do espaço e do tempo."
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
                        "الفيزياء هي العلم الطبيعي الذي يدرس المادة ومكوناتها الأساسية وحركتها وسلوكها عبر المكان والزمان."
                }
            }
            
            translated_text = text
            if target_locale in translations and text in translations[target_locale]:
                translated_text = translations[target_locale][text]
            else:
                # Mock translation by suffixing language code if not in dictionary
                if target_locale != 'en_US' and text:
                    translated_text = f"[{target_locale.split('_')[0].upper()} TRANSLATION] {text}"
            
            print(f"[GEMMA 4 E4B] Local translation to [{target_locale}] completed.")
            print(f"[GEMMA 4 E4B] Source text: \"{text}\"")
            print(f"[GEMMA 4 E4B] Result text: \"{translated_text}\"")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"translated_text": translated_text}).encode('utf-8'))
            return

        # API route to synthesize text via Piper accent engine
        if clean_path == '/api/tts':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            text = query_params.get('text', [''])[0]
            locale = query_params.get('locale', ['en_US'])[0]
            
            # Simulated local ONNX mounting and synthesis logs
            print(f"[PIPER TTS] Active Locale: {locale}")
            print(f"[PIPER TTS] Mounting local Piper ONNX voice model from: static/voices/{locale}.onnx")
            print(f"[PIPER TTS] Synthesizing text in [{locale}]: \"{text}\"")
            
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
            
            db_path = "vault.db"
            instructors = []
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image FROM instructors")
                    for row in cursor.fetchall():
                        instructors.append({
                            "instructor_id": row[0],
                            "full_name": row[1],
                            "phone_number": row[2],
                            "experience_years": row[3],
                            "subjects_list": row[4],
                            "profile_image": row[5]
                        })
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database instructors lookup failed: {e}")
            
            self.wfile.write(json.dumps({"instructors": instructors}).encode('utf-8'))
            return

        # API route to fetch lesson PDF and Video metadata
        if clean_path == '/api/lesson':
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            video_id = query_params.get('video_id', [None])[0]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            db_path = "vault.db"
            active_track = None
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT background_context FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
                    row = cursor.fetchone()
                    if row:
                        active_track = row[0]
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Active session track lookup failed: {e}")

            if not video_id:
                if active_track in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"]:
                    video_id = "vid_calculus_01"
                elif active_track == "5th Grade" or active_track == "College":
                    video_id = "vid_physics_01"
                else:
                    video_id = "vid_philosophy_01"

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
            if pdf_path:
                clean_pdf_path = pdf_path.lstrip('/')
                if clean_pdf_path.startswith('saved_notebooks/'):
                    pdf_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.dirname(clean_pdf_path))
                else:
                    if not clean_pdf_path.startswith('curriculum_staging/'):
                        clean_pdf_path = 'curriculum_staging/' + clean_pdf_path
                    pdf_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.dirname(clean_pdf_path))

                if os.path.exists(pdf_dir):
                    mp4_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.mp4')]
                    if mp4_files:
                        resolved_video_path = os.path.join(os.path.dirname(clean_pdf_path), mp4_files[0]).replace('\\', '/')
                        if not resolved_video_path.startswith('curriculum_staging/'):
                            resolved_video_path = 'curriculum_staging/' + resolved_video_path

            # Fallback if video path is not found in the PDF directory
            if not resolved_video_path and video_id:
                # Subject-based folder matching under curriculum_staging
                fallbacks = []
                if "physics" in video_id.lower() or "phys" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/12th_Grade/Physics",
                        "curriculum_staging/Physics"
                    ]
                elif "calculus" in video_id.lower() or "calc" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/12th_Grade/Calculus",
                        "curriculum_staging/Calculus"
                    ]
                elif "philosophy" in video_id.lower() or "phil" in video_id.lower():
                    fallbacks = [
                        "curriculum_staging/Philosophy",
                        "static/videos"
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

            instructor_name = "Professor Evans"
            instructor_avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
            instructor_role = "Calculus Specialist"
            if video_id:
                if "physics" in video_id.lower():
                    instructor_name = "Dr. Harris"
                    instructor_avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                    instructor_role = "Physics Specialist"
                elif "philosophy" in video_id.lower():
                    instructor_name = "Professor Marcus"
                    instructor_avatar = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150"
                    instructor_role = "Philosophy Specialist"

            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT i.full_name, i.profile_image, i.subjects_list, i.experience_years
                        FROM lesson_metadata lm
                        JOIN instructors i ON lm.instructor_id = i.instructor_id
                        WHERE lm.video_id = ?
                    """, (video_id,))
                    inst_row = cursor.fetchone()
                    if inst_row:
                        instructor_name = inst_row[0]
                        instructor_avatar = inst_row[1]
                        instructor_role = f"{inst_row[2]} Specialist ({inst_row[3]} yrs exp)"
                    conn.close()
                except Exception as e:
                    print(f"[ERROR] Database lesson instructor lookup failed: {e}")

            result = {
                "video_id": video_id,
                "video_file_path": resolved_video_path,
                "pdf_file_path": (pdf_path if (pdf_path.startswith('/saved_notebooks/') or pdf_path.startswith('/curriculum_staging/')) else '/curriculum_staging/' + pdf_path.lstrip('/')) if pdf_path else "",
                "start_page": start_page,
                "instructor_name": instructor_name,
                "instructor_avatar": instructor_avatar,
                "instructor_role": instructor_role
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
            else:
                self.send_error(404, "Notebook file not found")
                return
            
        # Route for Admin Fleet Dashboard
        if clean_path in ['/admin', '/admin/']:
            self.path = '/admin.html'
            
        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0]
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
                video_id = data.get("video_id")
                
                instructor_id = full_name.lower().replace(" ", "_")
                
                db_path = "vault.db"
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO instructors (instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image)
                    VALUES (?, ?, ?, ?, ?, ?);
                """, (instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image))
                
                if video_id:
                    cursor.execute("""
                        UPDATE lesson_metadata
                        SET instructor_id = ?
                        WHERE video_id = ?;
                    """, (instructor_id, video_id))
                    
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

def start_http_server():
    handler = QuietHTTPRequestHandler
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    
    # Direct to workspace directory (where display_client.py and index.html are located)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.ThreadingTCPServer(("", HTTP_PORT), handler) as httpd:
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
                    student_name = data.get("name")
                    locale = data.get("locale", "en_US")
                    print(f"[WS] Updating locale preference for {student_name} to {locale}")
                    conn = sqlite3.connect("vault.db")
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                                   (student_name, locale))
                    conn.commit()
                    conn.close()
                elif data.get("action") == "ONBOARDING_SUBMIT":
                    track_id = data.get("track", "College")
                    locale = data.get("locale", "en_US")
                    print(f"[ONBOARDING] Submitting configs: {data.get('name')} | Track: {track_id} | Locale: {locale}")
                    conn = sqlite3.connect("vault.db")
                    cursor = conn.cursor()
                    cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES (?, ?)", 
                                   (data.get("name"), track_id))
                    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES (?, ?)",
                                   (data.get("name"), locale))
                    
                    # Complete database binding for calculus track
                    if track_id in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"]:
                        cursor.execute("INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, mastery_achieved) VALUES (?, ?, ?)",
                                       ("calculus", "calculus", 1))
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
                    
                    correct_count = 0
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
                    mastery_achieved = 1 if (is_practice or score >= 85.0) else 0
                    
                    print(f"[QUIZ] Grading Track={track_key}, Alt={is_alt}, Score={score}%, Mastery={mastery_achieved}, Practice={is_practice}")
                    
                    next_video = None
                    next_chapter = None
                    
                    if not is_practice:
                        conn = sqlite3.connect("vault.db")
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
                        "quiz_question": data.get("quiz_question", "")
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
    
    # Start HTTP server in a daemon thread (closes automatically when main script exits)
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Run the WebSocket server in the main asyncio loop
    try:
        asyncio.run(start_ws_server())
    except KeyboardInterrupt:
        print("\n[SYSTEM] Terminating display client servers. Exiting...")
