# preprocess_curriculum.py - Batch Ingestion & Video Preprocessing Pipeline
import os
import sys
import time
import json
import sqlite3
import lancedb
import pandas as pd
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types

# Load API keys and environment variables from .env
def load_env():
    if os.path.exists(".env"):
        try:
            with open(".env", "r", encoding="utf-8") as f:
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

# Validate Google API Key
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("[ERROR] GOOGLE_API_KEY is not set in the .env file. Please add it to run preprocessing.")
    sys.exit(1)

# Initialize databases
sqlite_db_path = "vault.db"
lancedb_dir = ".lancedb"

print("==========================================================")
# Initialize Google GenAI client (uses GOOGLE_API_KEY from environment)
try:
    client = genai.Client(api_key=GOOGLE_API_KEY)
    print("[GEMINI] Client initialized successfully.")
except Exception as e:
    print(f"[GEMINI ERROR] Failed to initialize client: {e}")
    sys.exit(1)

# Initialize SentenceTransformer embedding model (matching curriculum_rag)
print("[EMBEDDINGS] Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
try:
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("[EMBEDDINGS] Model loaded successfully.")
except Exception as e:
    print(f"[EMBEDDINGS ERROR] Failed to load embedding model: {e}")
    sys.exit(1)

# Open local embedded LanceDB connection
print(f"[LANCEDB] Connecting to LanceDB folder at: {lancedb_dir}")
db = lancedb.connect(lancedb_dir)
lancedb_table_name = "curriculum_video_blocks"

# Define LanceDB schema and create/open table
def open_or_create_lancedb_table():
    try:
        # Check if table already exists
        return db.open_table(lancedb_table_name)
    except Exception:
        print(f"[LANCEDB] Table '{lancedb_table_name}' does not exist. Creating new table.")
        # Create table with a dummy initial record to establish columns/schema
        dummy_data = [{
            "video_id": "dummy",
            "timestamp": "00:00:00",
            "title": "dummy",
            "transcript_summary": "dummy",
            "keywords": "dummy",
            "vector_payload": "dummy",
            "vector": [0.0] * 384  # MiniLM-L6-v2 yields 384-dimensional vectors
        }]
        return db.create_table(lancedb_table_name, data=dummy_data, mode="overwrite")

lancedb_table = open_or_create_lancedb_table()

def check_video_already_processed(video_id):
    """Checks if there are already processed blocks for this video in LanceDB"""
    try:
        # Search LanceDB where video_id matches
        results = lancedb_table.search().where(f"video_id = '{video_id}'").limit(1).to_list()
        # Filter out dummy entries
        valid_results = [r for r in results if r["video_id"] != "dummy"]
        return len(valid_results) > 0
    except Exception as e:
        print(f"[LANCEDB WARNING] Search verification check failed: {e}")
        return False

def resolve_video_files():
    """Queries SQLite to map video_ids to physical video files in staging"""
    conn = sqlite3.connect(sqlite_db_path)
    cursor = conn.cursor()
    
    # We query lesson_metadata to get the associated PDF folder and look for the .mp4 file
    cursor.execute("SELECT video_id, chapter_id, pdf_file_path FROM lesson_metadata")
    rows = cursor.fetchall()
    
    mapped_videos = []
    
    for video_id, chapter_id, pdf_file_path in rows:
        clean_pdf_path = pdf_file_path.lstrip('/')
        if not clean_pdf_path.startswith('curriculum_staging/'):
            clean_pdf_path = 'curriculum_staging/' + clean_pdf_path
        
        pdf_dir = os.path.dirname(clean_pdf_path)
        abs_pdf_dir = os.path.abspath(pdf_dir)
        
        # Check if the folder exists and has any .mp4 files
        video_path = None
        if os.path.exists(abs_pdf_dir):
            mp4_files = [f for f in os.listdir(abs_pdf_dir) if f.lower().endswith('.mp4')]
            if mp4_files:
                video_path = os.path.join(pdf_dir, mp4_files[0]).replace('\\', '/')
        
        # Fallback to direct staging subfolder checking (e.g. curriculum_staging/12th_Grade/Physics)
        if not video_path:
            subject_subdirs = ["12th_Grade/Physics", "12th_Grade/Calculus", "12th_Grade/Economics", "Philosophy", "Physics", "Economics"]
            for subdir in subject_subdirs:
                test_dir = os.path.abspath(os.path.join("curriculum_staging", subdir))
                if os.path.exists(test_dir):
                    mp4_files = [f for f in os.listdir(test_dir) if f.lower().endswith('.mp4')]
                    if mp4_files:
                        # Simple name overlap mapping heuristic
                        if video_id.split("_")[-1] in subdir.lower() or chapter_id.split("_")[0] in subdir.lower():
                            video_path = os.path.join("curriculum_staging", subdir, mp4_files[0]).replace('\\', '/')
                            break
        
        if video_path and os.path.exists(video_path):
            mapped_videos.append({
                "video_id": video_id,
                "chapter_id": chapter_id,
                "video_path": video_path
            })
            print(f"[RESOLVED] Video ID '{video_id}' maps to: {video_path}")
        else:
            print(f"[RESOLVED WARNING] No video file found for Video ID '{video_id}'")
            
    conn.close()
    return mapped_videos

def preprocess_video_file(video_entry):
    video_id = video_entry["video_id"]
    chapter_id = video_entry["chapter_id"]
    video_path = video_entry["video_path"]
    
    print(f"\n==========================================================")
    print(f"PROCESSING VIDEO: {video_path} (ID: {video_id})")
    print(f"==========================================================")
    
    # 1. Upload the video to Google GenAI File Service
    print(f"[GEMINI] Uploading file '{video_path}' to Google File Storage...")
    try:
        uploaded_file = client.files.upload(file=video_path)
        print(f"[GEMINI] Uploaded. File resource ID: {uploaded_file.name}")
    except Exception as e:
        print(f"[GEMINI ERROR] File upload failed: {e}")
        return False

    # 2. Wait for the video processing state to turn ACTIVE
    print("[GEMINI] Waiting for Google's servers to process the video tracks...")
    status_checks = 0
    while True:
        time.sleep(10)
        status_checks += 1
        try:
            file_ref = client.files.get(name=uploaded_file.name)
            state = file_ref.state.name
            print(f"  -> State: {state} (Check #{status_checks})")
            if state == "ACTIVE":
                print("[GEMINI] Video processing complete and ACTIVE.")
                break
            elif state == "FAILED":
                print(f"[GEMINI ERROR] Video indexing failed: {file_ref.error.message}")
                return False
        except Exception as e:
            print(f"[GEMINI WARNING] Error fetching file status: {e}")
            if status_checks > 30:  # Timeout after 5 minutes
                print("[GEMINI ERROR] Timeout waiting for video processing.")
                return False

    # 3. Request a structured timeline and conceptual breakdown from Gemini
    prompt = (
        "Analyze this educational video curriculum. Break it down into discrete conceptual segments.\n"
        "For every segment, provide a structured timestamp (format HH:MM:SS), a clear topical title,\n"
        "a deep technical transcript/summary, a list of keyword tags, and an optional simulation_layout.\n"
        "The simulation_layout must be provided if the segment discusses mathematical formulas, graphs, or physical systems.\n"
        "It should contain component_name, widget (one of: 'FormulaDashboard', 'ApplianceCanvas', 'DampedOscillatorSimulation', 'LogicWaferGrid', 'EpistemologyDiagram'), and a properties object with:\n"
        "math_representation, plot_expression, and a list of sliders. Each slider has: label, min, max, value, key."
    )
    
    print("[GEMINI] Querying Gemini model for structured curriculum extraction...")
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.ARRAY,
                    items=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "timestamp": types.Schema(type=types.Type.STRING, description="Format HH:MM:SS"),
                            "title": types.Schema(type=types.Type.STRING),
                            "transcript_summary": types.Schema(type=types.Type.STRING, description="Detailed explanation of concepts discussed"),
                            "keywords": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                            "simulation_layout": types.Schema(
                                type=types.Type.OBJECT,
                                description="Optional simulation layout if math, graph, or physics concept is discussed.",
                                properties={
                                    "component_name": types.Schema(type=types.Type.STRING),
                                    "widget": types.Schema(type=types.Type.STRING, description="FormulaDashboard, ApplianceCanvas, DampedOscillatorSimulation, LogicWaferGrid, or EpistemologyDiagram"),
                                    "properties": types.Schema(
                                        type=types.Type.OBJECT,
                                        properties={
                                            "math_representation": types.Schema(type=types.Type.STRING),
                                            "plot_expression": types.Schema(type=types.Type.STRING),
                                            "sliders": types.Schema(
                                                type=types.Type.ARRAY,
                                                items=types.Schema(
                                                    type=types.Type.OBJECT,
                                                    properties={
                                                        "label": types.Schema(type=types.Type.STRING),
                                                        "min": types.Schema(type=types.Type.DOUBLE),
                                                        "max": types.Schema(type=types.Type.DOUBLE),
                                                        "value": types.Schema(type=types.Type.DOUBLE),
                                                        "key": types.Schema(type=types.Type.STRING)
                                                    },
                                                    required=["label", "min", "max", "value", "key"]
                                                )
                                            )
                                        }
                                    )
                                }
                            )
                        },
                        required=["timestamp", "title", "transcript_summary"]
                    )
                )
            )
        )
        raw_json_data = json.loads(response.text)
        print(f"[GEMINI SUCCESS] Received {len(raw_json_data)} conceptual segments.")
    except Exception as e:
        print(f"[GEMINI ERROR] Structured generation failed: {e}")
        # Clean up the file reference before returning
        try:
            client.files.delete(name=uploaded_file.name)
        except Exception:
            pass
        return False

    # Clean up file from Google Storage immediately to optimize resource usage
    try:
        print("[GEMINI] Deleting file from Google File Storage...")
        client.files.delete(name=uploaded_file.name)
        print("[GEMINI] File deleted successfully.")
    except Exception as e:
        print(f"[GEMINI WARNING] Could not delete cloud file: {e}")

    # 4. Generate embeddings and store into LanceDB
    print(f"[LANCEDB] Indexing and embedding {len(raw_json_data)} segments...")
    data_records = []
    for item in raw_json_data:
        timestamp = item.get("timestamp", "00:00:00")
        title = item.get("title", "Untitled Concept")
        summary = item.get("transcript_summary", "")
        keywords_list = item.get("keywords", [])
        keywords_str = ", ".join(keywords_list)
        
        # Combine title, summary and keywords to construct the payload for vector embeddings
        payload = f"{title} - {summary} [Tags: {keywords_str}]"
        
        # Generate 384-dimensional vector embedding
        vector = embedding_model.encode(payload).tolist()
        
        data_records.append({
            "video_id": video_id,
            "timestamp": timestamp,
            "title": title,
            "transcript_summary": summary,
            "keywords": keywords_str,
            "vector_payload": payload,
            "vector": vector
        })

    # Add records to LanceDB
    try:
        lancedb_table.add(data_records)
        print(f"[LANCEDB SUCCESS] Inserted {len(data_records)} segments into LanceDB table: {lancedb_table_name}")
    except Exception as e:
        print(f"[LANCEDB ERROR] Ingestion into LanceDB failed: {e}")
        return False

    # 5. Populate SQLite video_timestamps and mark lesson as unlocked
    print("[SQLITE] Registering curriculum metadata in SQLite database...")
    try:
        conn = sqlite3.connect(sqlite_db_path)
        cursor = conn.cursor()
        
        # First clear out any legacy or mock timestamps for this video
        cursor.execute("DELETE FROM video_timestamps WHERE video_id = ?", (video_id,))
        cursor.execute("DELETE FROM lesson_simulations WHERE video_id = ?", (video_id,))
        
        # Insert the newly generated timestamps
        for idx, record in enumerate(data_records):
            # description maps to transcript_summary
            cursor.execute("""
                INSERT INTO video_timestamps (video_id, timestamp, title, description)
                VALUES (?, ?, ?, ?);
            """, (video_id, record["timestamp"], record["title"], record["transcript_summary"]))
            
            # Save dynamic simulation layout if present
            raw_item = raw_json_data[idx]
            sim_layout = raw_item.get("simulation_layout")
            if sim_layout:
                content_id = f"{video_id}_{idx}"
                component_name = sim_layout.get("component_name", "Simulation")
                widget = sim_layout.get("widget", "FormulaDashboard")
                layout_json = json.dumps(sim_layout)
                cursor.execute("""
                    INSERT OR REPLACE INTO lesson_simulations (video_id, chapter_id, content_id, component_name, widget, layout_json)
                    VALUES (?, ?, ?, ?, ?, ?);
                """, (video_id, chapter_id, content_id, component_name, widget, layout_json))
                print(f"  -> SQLite: Registered dynamic simulation {content_id} ({component_name})")
                
        # Populate savant_matrix for historical bios and cross-chapter connections
        try:
            from savant_curriculum_matrix import SAVANT_AND_CHAPTER_CONNECTIONS
            data = SAVANT_AND_CHAPTER_CONNECTIONS.get(video_id)
            if not data:
                subj_lower = subject.lower()
                if "math" in subj_lower or "calculus" in subj_lower:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["math_calculus_default"]
                elif "econ" in subj_lower:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"]
                elif "physic" in subj_lower:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_physics_01"]
                elif "chem" in subj_lower:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_chemistry_organic_chemistry_chemistry"]
                elif "phil" in subj_lower:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_philosophy_01"]
                else:
                    data = SAVANT_AND_CHAPTER_CONNECTIONS["math_calculus_default"]

            cursor.execute("""
                INSERT OR REPLACE INTO savant_matrix 
                (video_id, subject, savant, era_context, historical_bio, interdisciplinary_connections, real_world_applications)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (video_id, subject, data["savant"], data.get("era_context", ""), data["historical_bio"], data["interdisciplinary_connections"], data["real_world_applications"]))
            print(f"  -> SQLite: Registered savant bio & interdisciplinary connections for '{video_id}'")
        except Exception as sav_err:
            print(f"  [WARN] Failed to populate savant_matrix for '{video_id}': {sav_err}")

        # Mark lesson as unlocked in curriculum_tree
        cursor.execute("""
            UPDATE curriculum_tree
            SET unlocked = 1
            WHERE video_id = ?
        """, (video_id,))
        
        conn.commit()
        conn.close()
        print(f"[SQLITE SUCCESS] Timestamps, savant matrix, and unlocks successfully written for video '{video_id}'.")
    except Exception as e:
        print(f"[SQLITE ERROR] Database updates failed: {e}")
        return False

    return True

def run_pipeline():
    print("\n=== STARTING MULTIMODAL PREPROCESSING PIPELINE ===")
    
    # Resolve all files
    videos_to_process = resolve_video_files()
    if not videos_to_process:
        print("[PIPELINE] No curriculum videos found. Exiting.")
        return
        
    success_count = 0
    skipped_count = 0
    
    for entry in videos_to_process:
        video_id = entry["video_id"]
        
        # Check if already processed
        if check_video_already_processed(video_id):
            print(f"[SKIP] Video ID '{video_id}' is already indexed in LanceDB. Skipping.")
            skipped_count += 1
            # Ensure it is unlocked in SQLite just in case
            try:
                conn = sqlite3.connect(sqlite_db_path)
                cursor = conn.cursor()
                cursor.execute("UPDATE curriculum_tree SET unlocked = 1 WHERE video_id = ?", (video_id,))
                conn.commit()
                conn.close()
            except Exception:
                pass
            continue
            
        # Run preprocessing
        success = preprocess_video_file(entry)
        if success:
            success_count += 1
        else:
            print(f"[ERROR] Failed processing video '{video_id}'")
            
    print("\n==========================================================")
    print(f"MULTIMODAL PREPROCESSING RUN COMPLETE.")
    print(f"  Processed successfully: {success_count}")
    print(f"  Skipped (already indexed): {skipped_count}")
    print("==========================================================")

if __name__ == "__main__":
    run_pipeline()
