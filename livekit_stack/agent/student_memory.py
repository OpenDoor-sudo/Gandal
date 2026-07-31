# student_memory.py - OKF Student Memory Graph manager
import os
import re
import json
import sqlite3
import datetime

# Absolute base directory for student profiles, relative to repository root.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE_PROFILE_DIR = os.path.join(PROJECT_ROOT, "student_profiles")
VAULT_DB_PATH = os.path.join(PROJECT_ROOT, "vault.db")

def get_student_dir(student_id):
    """Resolve absolute directory path for a student's profiles."""
    clean_id = "".join([c for c in student_id if c.isalnum() or c in ("-", "_")]).strip()
    if not clean_id:
        clean_id = "default_student"
    path = os.path.join(BASE_PROFILE_DIR, clean_id)
    if not os.path.exists(path):
        os.makedirs(path)
    return path

def parse_okf(content):
    """Parse OKF file content into (metadata_dict, body_text)."""
    if not content.strip().startswith("---"):
        return {}, content.strip()
    
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content.strip()
        
    yaml_text = parts[1]
    body = parts[2].strip()
    
    metadata = {}
    for line in yaml_text.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip()
        v = v.strip()
        # Parse simple tags or lists
        if v.startswith("[") and v.endswith("]"):
            v = [item.strip().strip('"').strip("'") for item in v[1:-1].split(",") if item.strip()]
        else:
            v = v.strip('"').strip("'")
        metadata[k] = v
        
    return metadata, body

def serialize_okf(metadata, body):
    """Serialize metadata and body into OKF format."""
    yaml_lines = ["---"]
    for k, v in metadata.items():
        if isinstance(v, list):
            tags_str = ", ".join(f"'{x}'" for x in v)
            yaml_lines.append(f"{k}: [{tags_str}]")
        else:
            yaml_lines.append(f"{k}: '{v}'")
    yaml_lines.append("---")
    yaml_lines.append("")
    yaml_lines.append(body.strip())
    return "\n".join(yaml_lines)

def load_or_create_subject_profile(student_id, subject):
    """Load an existing SubjectProfile OKF file, or return a default one."""
    s_dir = get_student_dir(student_id)
    f_path = os.path.join(s_dir, f"subject_{subject}.md")
    
    if os.path.exists(f_path):
        try:
            with open(f_path, "r", encoding="utf-8") as f:
                content = f.read()
            return parse_okf(content)
        except Exception as e:
            print(f"[MEMORY] Error reading subject profile {f_path}: {e}")
            
    # Default initial profile
    metadata = {
        "type": "SubjectProfile",
        "student_id": student_id,
        "subject": subject,
        "learning_style": "Visual & Step-by-Step",
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
        "tags": [subject.lower(), "student-memory"]
    }
    body = (
        f"# Student Profile: {subject}\n\n"
        "## Where They Excel\n"
        "* Getting started with basic definitions and introductory examples.\n\n"
        "## Where They Struggle\n"
        "* Initial application of new formulas or multi-step logic.\n"
    )
    return metadata, body

def load_or_create_session_state(student_id):
    """Load the current SessionState OKF file, or return a default one."""
    s_dir = get_student_dir(student_id)
    f_path = os.path.join(s_dir, "session_state.md")
    
    if os.path.exists(f_path):
        try:
            with open(f_path, "r", encoding="utf-8") as f:
                content = f.read()
            return parse_okf(content)
        except Exception as e:
            print(f"[MEMORY] Error reading session state {f_path}: {e}")
            
    metadata = {
        "type": "SessionState",
        "student_id": student_id,
        "status": "active",
        "last_session_time": datetime.datetime.utcnow().isoformat() + "Z"
    }
    body = (
        "# Last Session Bookmark\n\n"
        "## Where They Left Off\n"
        "* **Module**: None\n"
        "* **Last Activity**: Just joined the application.\n"
        "* **Next Best Action**: Explore the curriculum tree to select a topic.\n"
    )
    return metadata, body

def save_okf_file(student_id, filename, metadata, body):
    """Save metadata and body to an OKF file."""
    s_dir = get_student_dir(student_id)
    f_path = os.path.join(s_dir, filename)
    content = serialize_okf(metadata, body)
    try:
        with open(f_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[MEMORY] Saved OKF file successfully: {f_path}")
        return True
    except Exception as e:
        print(f"[MEMORY ERROR] Failed to write OKF file {f_path}: {e}")
        return False

def merge_bullets(existing_body, heading, new_bullets):
    """Parse existing bullet points under a markdown heading, merge new bullets, and return updated body."""
    pattern = rf"(## {re.escape(heading)}[^\n]*\n)(.*?)(?=\n## |\Z)"
    match = re.search(pattern, existing_body, re.DOTALL)
    
    # Extract unique clean bullets
    clean_new = []
    for b in new_bullets:
        b_clean = b.strip().lstrip("*-").strip()
        if b_clean:
            clean_new.append(b_clean)
            
    if match:
        header = match.group(1)
        content_block = match.group(2)
        
        # Find existing bullet lines
        existing_bullets = []
        for line in content_block.splitlines():
            line_strip = line.strip().lstrip("*-").strip()
            if line_strip:
                existing_bullets.append(line_strip)
                
        # Merge ensuring uniqueness
        merged = list(existing_bullets)
        for b in clean_new:
            if b not in merged:
                merged.append(b)
                
        # If default filler is present, remove it if we have real items
        if len(merged) > 1:
            merged = [b for b in merged if "Getting started with" not in b and "Initial application of" not in b]
            
        replacement_block = header + "\n".join(f"* {b}" for b in merged) + "\n"
        updated_body = existing_body.replace(match.group(0), replacement_block)
        return updated_body
    else:
        # Heading not found, append to the end
        new_block = f"\n## {heading}\n" + "\n".join(f"* {b}" for b in clean_new) + "\n"
        return existing_body.strip() + "\n" + new_block

async def synthesize_session_memory(student_id, subject, transcript_list, google_api_key):
    """Analyze chat history, summarize session, and update SubjectProfile, SessionState, and write a LessonLog."""
    if not transcript_list:
        print("[MEMORY] Transcript list empty. Skipping synthesis.")
        return
        
    print(f"[MEMORY] Synthesizing memory for {student_id} on subject {subject}...")
    formatted_transcript = ""
    for msg in transcript_list:
        role = msg.get("role", "unknown")
        text = msg.get("text", "")
        formatted_transcript += f"{role.upper()}: {text}\n"
        
    prompt = (
        "You are the Ventuno Q Student Memory Synthesizer.\n"
        "Analyze the following student-tutor chat transcript. Identify:\n"
        "1. Any changes or confirmations of the student's learning style (e.g. Visual, Step-by-Step, Intuitive, Auditory).\n"
        "2. Specific topics/concepts they excel at (got right, understood quickly).\n"
        "3. Specific topics/concepts they struggle with (got wrong, showed confusion, asked multiple questions about).\n"
        "4. A 2-3 bullet point summary of what they did in this lesson.\n"
        "5. The last activity/topic they were on and the recommended next best action.\n\n"
        "Provide your response in EXACTLY the following JSON format. Do not add markdown wrapping or explanation outside of the JSON:\n"
        "{\n"
        '  "learning_style": "...",\n'
        '  "excels": ["...", "..."],\n'
        '  "struggles": ["...", "..."],\n'
        '  "log_title": "...",\n'
        '  "log_bullets": ["...", "..."],\n'
        '  "last_module": "...",\n'
        '  "last_activity": "...",\n'
        '  "next_best_action": "..."\n'
        "}\n\n"
        f"Transcript:\n{formatted_transcript}"
    )
    
    res_text = ""

    # 1. Try Local Offline LLM Server first (if running or no API key provided)
    is_local = False
    try:
        import urllib.request
        with urllib.request.urlopen("http://localhost:8080/v1/models", timeout=0.3) as response:
            if response.status == 200:
                is_local = True
    except Exception:
        pass

    if is_local or not google_api_key:
        print("[MEMORY] Using local offline LLM server for session memory synthesis...")
        try:
            import urllib.request
            url = "http://localhost:8080/v1/chat/completions"
            payload = {
                "model": "qwen3-omni",
                "messages": [
                    {"role": "system", "content": "You are a helpful cognitive scientist assistant analyzing student transcripts."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                res_text = result["choices"][0]["message"]["content"].strip()
        except Exception as local_err:
            print(f"[MEMORY ERROR] Local offline synthesis failed: {local_err}")

    # 2. Fall back to cloud Gemini if local LLM query failed or wasn't run
    if not res_text and google_api_key:
           print("[MEMORY] Querying cloud Gemini 2.0 Flash for session memory synthesis...")
           try:
               try:
                   from google import genai
               except Exception as import_err:
                   print(f"[MEMORY ERROR] Failed to import cloud Gemini client: {import_err}")
                   genai = None
               if genai is not None:
                   client = genai.Client(api_key=google_api_key)
                   response = client.models.generate_content(
                       model='gemini-2.0-flash',
                       contents=prompt
                   )
                   res_text = response.text.strip()
               else:
                   print("[MEMORY ERROR] Gemini client unavailable, skipping cloud query.")
           except Exception as cloud_err:
               print(f"[MEMORY ERROR] Cloud synthesis failed: {cloud_err}")

    if not res_text:
        print("[MEMORY ERROR] No synthesis output could be generated (both offline and online failed).")
        return

    try:
        # Extract JSON block
        if "```json" in res_text:
            res_text = res_text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```", 1)[1].split("```", 1)[0].strip()

        summary = json.loads(res_text)
        print(f"[MEMORY] Synthesizer output parsed: {summary}")
        
        # 1. Update Subject Profile
        sub_meta, sub_body = load_or_create_subject_profile(student_id, subject)
        if summary.get("learning_style"):
            sub_meta["learning_style"] = summary.get("learning_style")
        sub_meta["last_updated"] = datetime.datetime.utcnow().isoformat() + "Z"
        
        if summary.get("excels"):
            sub_body = merge_bullets(sub_body, "Where They Excel", summary["excels"])
        if summary.get("struggles"):
            sub_body = merge_bullets(sub_body, "Where They Struggle", summary["struggles"])
            
        save_okf_file(student_id, f"subject_{subject}.md", sub_meta, sub_body)
        
        # 2. Update Session State
        state_meta, _ = load_or_create_session_state(student_id)
        state_meta["status"] = "paused"
        state_meta["last_session_time"] = datetime.datetime.utcnow().isoformat() + "Z"
        state_meta["subject"] = subject
        
        last_mod = summary.get("last_module", "Active Lesson")
        last_act = summary.get("last_activity", "Finished conversation")
        next_act = summary.get("next_best_action", "Continue review")
        
        state_body = (
            "# Last Session Bookmark\n\n"
            "## Where They Left Off\n"
            f"* **Module**: {last_mod}\n"
            f"* **Last Activity**: {last_act}\n"
            f"* **Next Best Action**: {next_act}\n"
        )
        save_okf_file(student_id, "session_state.md", state_meta, state_body)
        
        # 3. Create Lesson Log
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
        log_meta = {
            "type": "LessonLog",
            "student_id": student_id,
            "subject": subject,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        log_title = summary.get("log_title", f"Session Review {subject}")
        log_bullets_text = "\n".join(f"* {b}" for b in summary.get("log_bullets", ["Reviewed curriculum content."]))
        log_body = f"# Log: {log_title}\n\n{log_bullets_text}\n"
        
        logs_dir = os.path.join(get_student_dir(student_id), "logs")
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
            
        save_okf_file(student_id, f"logs/lesson_log_{timestamp}.md", log_meta, log_body)
        
        # 4. Update SQLite student_progress for this subject
        try:
            conn = sqlite3.connect(VAULT_DB_PATH)
            cursor = conn.cursor()
            
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
            
            # Resolve current video_id
            cursor.execute("SELECT video_id FROM curriculum_tree WHERE chapter_id = ? OR title LIKE ? LIMIT 1",
                           (subject.lower(), f"%{subject}%"))
            row = cursor.fetchone()
            video_id = row[0] if row else "unknown_video"
            
            cursor.execute("""
                INSERT INTO student_progress (student_id, subject, video_id, last_position, max_position)
                VALUES (?, ?, ?, 0.0, 0.0)
                ON CONFLICT(student_id, subject) DO UPDATE SET
                last_updated = CURRENT_TIMESTAMP;
            """, (student_id, subject, video_id))
            conn.commit()
            conn.close()
            print(f"[MEMORY] Synced progress state to SQLite database.")
        except Exception as db_e:
            print(f"[MEMORY ERROR] Failed to sync progress to SQLite: {db_e}")
            
    except Exception as e:
        print(f"[MEMORY ERROR] Error during synthesis execution: {e}")
