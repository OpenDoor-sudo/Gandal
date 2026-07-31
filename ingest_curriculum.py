import os
import sqlite3
import json
import re
import lancedb
from sentence_transformers import SentenceTransformer

# Define mock paragraph database mapping PDF asset paths to transcripts
MOCK_CURRICULUM_DATA = {
    "Physics/physics_oscillators.pdf": {
        "video_id": "vid_physics_03",
        "chapter_id": "physics_oscillators",
        "title": "Simple Harmonic Oscillators",
        "subject": "Physics",
        "paragraphs": [
            "Simple harmonic motion is a special type of periodic motion where the restoring force on the moving object is directly proportional to the magnitude of the object's displacement and acts towards the object's equilibrium position.",
            "For a mass-spring system, the period of oscillation T is given by 2 * pi * sqrt(m / k), showing that it depends solely on the inertial mass and the stiffness of the spring, completely independent of amplitude.",
            "A damped harmonic oscillator experiences a dissipative force proportional to its velocity. This friction decays the mechanical energy of the pendulum, leading to exponentially decaying wave amplitudes."
        ]
    },
    "Philosophy/stoic_propositions.pdf": {
        "video_id": "vid_philosophy_03",
        "chapter_id": "philosophy_propositions",
        "title": "Stoic Propositional Logic",
        "subject": "Ancient Philosophy",
        "paragraphs": [
            "Stoic propositional logic is centered on compound statements constructed using logical connectives such as negation, conjunction, disjunction, and conditional implication.",
            "Chrysippus formulated five indemonstrable inference rules, including Modus Ponens and Modus Tollens, which serve as foundational axioms for Stoic propositional analysis.",
            "Stoic epistemology asserts that logic is a key virtue protecting the mind against cognitive impressions that lack representation integrity."
        ]
    },
    "k12/12th_SM/Physics/pendulum_handbook.pdf": {
        "video_id": "vid_physics_04",
        "chapter_id": "physics_oscillators_advanced",
        "title": "Advanced Pendulum Harmonics",
        "subject": "Physics",
        "paragraphs": [
            "Advanced pendulum harmonics analyze nonlinear restoring forces that arise at large displacement angles, deviating from simple harmonic behavior.",
            "To model large displacements, we employ Jacobi elliptic functions and series expansions of the angular period formula.",
            "Calculating instant velocities and restoring forces at any given point along the pendulum arc introduces fundamental calculus and derivatives."
        ]
    },
    "k12/12th_SM/calculus/calculus_derivatives.pdf": {
        "video_id": "vid_calculus_01",
        "chapter_id": "calculus_derivatives",
        "title": "Économie Globale & Croissance",
        "subject": "Economics",
        "paragraphs": [
            "Aujourd'hui, nous abordons l'analyse de la croissance économique globale, en examinant comment les nations mesurent le développement et la richesse.",
            "L'ONU et ses diverses organisations onusiennes agissent comme des porteurs de croissance en coordonnant les politiques de développement international.",
            "Toutefois, définir un moteur ou porteur de croissance durable exige de repenser nos indicateurs au-delà du simple PIB, en intégrant les facteurs sociaux.",
            "La croissance économique est l'augmentation de la production de biens et services, mais elle doit être régulée by les organisations onusiennes pour être inclusive.",
            "Les porteurs de croissance durables incluent l'éducation, l'innovation technologique et les initiatives de développement de l'ONU.",
            "Pour analyser la croissance économique et l'activité des organisations onusiennes (ONU), nous étudions l'évolution du PIB et de l'IDH au fil du temps."
        ]
    },
    "k12/12th_SM/Calculus/calculus_derivatives.pdf": {
        "video_id": "vid_calculus_01",
        "chapter_id": "calculus_derivatives",
        "title": "Économie Globale & Croissance",
        "subject": "Economics",
        "paragraphs": [
            "Aujourd'hui, nous abordons l'analyse de la croissance économique globale, en examinant comment les nations mesurent le développement et la richesse.",
            "L'ONU et ses diverses organisations onusiennes agissent comme des porteurs de croissance en coordonnant les politiques de développement international.",
            "Toutefois, définir un moteur ou porteur de croissance durable exige de repenser nos indicateurs au-delà du simple PIB, en intégrant les facteurs sociaux.",
            "La croissance économique est l'augmentation de la production de biens et services, mais elle doit être régulée by les organisations onusiennes pour être inclusive.",
            "Les porteurs de croissance durables incluent l'éducation, l'innovation technologique et les initiatives de développement de l'ONU.",
            "Pour analyser la croissance économique et l'activité des organisations onusiennes (ONU), nous étudions l'évolution du PIB et de l'IDH au fil du temps."
        ]
    },
    "k12/12th_SM/Economics/Extraeconomiques/onupdf.pdf": {
        "video_id": "vid_economics_01",
        "chapter_id": "economics_extra_growth",
        "title": "Caractéristiques Extra-économiques",
        "subject": "Economics",
        "paragraphs": [
            "L'analyse de la croissance économique exige d'étudier non seulement les facteurs financiers, mais également les caractéristiques extra-économiques.",
            "Les institutions politiques, la stabilité sociale et les normes culturelles agissent comme des piliers invisibles de la prospérité à long terme.",
            "L'éducation et le capital humain transforment la structure sociale et favorisent des moteurs de développement durables.",
            "Les indicateurs traditionnels de richesse comme le PIB ne parviennent pas à mesurer l'efficacité de ces structures institutionnelles.",
            "Une régulation inclusive, inspirée par les cadres internationaux comme l'ONU, renforce la résilience globale d'une économie moderne."
        ]
    }
}

def scan_staging_and_ingest():
    sqlite_db_path = "vault.db"
    lancedb_dir = ".lancedb"
    staging_dir = "curriculum_staging"
    s3_mock_dir = "simulated_s3_bucket"
    
    print("=== DUAL-SYNC INGESTION ENGINE: CONNECTING TO DATABASES ===")
    
    # Ensure S3 mock directory exists
    os.makedirs(s3_mock_dir, exist_ok=True)
    
    # 1. SQLite Connection & Schema Setup
    conn = sqlite3.connect(sqlite_db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS curriculum_tree (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            title TEXT NOT NULL,
            unlocked BOOLEAN NOT NULL CHECK (unlocked IN (0, 1)) DEFAULT 0,
            PRIMARY KEY (video_id, chapter_id)
        );
    """)
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
        CREATE TABLE IF NOT EXISTS video_flashcards (
            video_id TEXT NOT NULL,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            hint TEXT NOT NULL,
            PRIMARY KEY (video_id, front)
        );
    """)
    conn.commit()
    print("[SQLite] Connected and curriculum database tables verified.")
    
    # 2. LanceDB Connection
    db = lancedb.connect(lancedb_dir)
    table_name = "curriculum_rag"
    
    try:
        tbl = db.open_table(table_name)
        print(f"[LanceDB] Connected and opened table: {table_name}")
    except Exception as e:
        print(f"[ERROR] LanceDB table '{table_name}' does not exist! Please run init_vault.py first. Details: {e}")
        conn.close()
        return

    # 3. Load Embedding Model
    print("[MODEL] Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Prune stale database entries for PDFs that no longer exist on disk
    print("[SQLite] Pruning stale database entries...")
    try:
        cursor.execute("SELECT video_id, chapter_id, pdf_file_path FROM lesson_metadata")
        metadata_rows = cursor.fetchall()
        for v_id, ch_id, pdf_path in metadata_rows:
            if pdf_path:
                clean_path = pdf_path.lstrip('/')
                if clean_path.startswith("saved_notebooks/"):
                    local_check = clean_path
                else:
                    if not clean_path.startswith("curriculum_staging/"):
                        local_check = os.path.join(staging_dir, clean_path)
                    else:
                        local_check = clean_path
                
                if not os.path.exists(local_check):
                    print(f"  [PRUNE] PDF no longer exists on disk: {local_check}. Pruning {v_id} / {ch_id}...")
                    cursor.execute("DELETE FROM lesson_metadata WHERE video_id = ? AND chapter_id = ?", (v_id, ch_id))
                    cursor.execute("DELETE FROM curriculum_tree WHERE video_id = ? AND chapter_id = ?", (v_id, ch_id))
                    cursor.execute("DELETE FROM lesson_simulations WHERE video_id = ? AND chapter_id = ?", (v_id, ch_id))
                    cursor.execute("DELETE FROM video_timestamps WHERE video_id = ?", (v_id,))
                    cursor.execute("DELETE FROM video_flashcards WHERE video_id = ?", (v_id,))
                    cursor.execute("DELETE FROM video_transcripts WHERE video_id = ?", (v_id,))
        conn.commit()
    except Exception as prune_err:
        print(f"  [WARNING] Pruning failed: {prune_err}")

    # 4. Scan staging directory
    print(f"[STAGE] Scanning directory matrix '{staging_dir}/'...")
    if not os.path.exists(staging_dir):
        print(f"[ERROR] Staging directory '{staging_dir}' not found.")
        conn.close()
        return
        
    ingested_count = 0
    
    for root, dirs, files in os.walk(staging_dir):
        files.sort()
        for file in files:
            if file.endswith(".pdf"):
                # Calculate relative path from staging_dir
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, staging_dir).replace("\\", "/")
                
                print(f"\n[INGEST] Found PDF asset: {rel_path}")
                
                # Check if we have mock metadata mapping for this asset
                if rel_path in MOCK_CURRICULUM_DATA:
                    config = MOCK_CURRICULUM_DATA[rel_path]
                    video_id = config["video_id"]
                    chapter_id = config["chapter_id"]
                    title = config["title"]
                    subject = config["subject"]
                    paragraphs = config["paragraphs"]
                else:
                    # Dynamic Generation for untracked assets
                    parts = rel_path.split('/')
                    first_dir = parts[0].lower()
                    if first_dir == 'k12':
                        if len(parts) >= 5:
                            subject = parts[2]
                            chapter_folder = parts[3]
                        elif len(parts) == 4:
                            subject = parts[2]
                            chapter_folder = None
                        else:
                            subject = parts[1] if len(parts) > 2 else 'General'
                            chapter_folder = None
                    else:
                        if len(parts) >= 4:
                            subject = parts[1]
                            chapter_folder = parts[2]
                        elif len(parts) == 3:
                            subject = parts[1]
                            chapter_folder = None
                        else:
                            subject = 'General'
                            chapter_folder = None
                            
                    subject = subject.replace('_', ' ').replace('-', ' ').title()
                    file_base = os.path.splitext(parts[-1])[0]
                    
                    clean_file_base = re.sub(r'[^a-zA-Z0-9_]', '_', file_base.lower())
                    clean_subj = re.sub(r'[^a-zA-Z0-9_]', '_', subject.lower())

                    if chapter_folder:
                        chapter_clean = chapter_folder.replace('_', ' ').replace('-', ' ').title()
                        clean_chap = re.sub(r'[^a-zA-Z0-9_]', '_', chapter_folder.lower())
                        if file_base.lower() in ['intro', 'introduction', 'lesson', 'chapter', 'index']:
                            title = chapter_clean
                            video_id = f"vid_{clean_subj}_{clean_chap}"
                            chapter_id = f"ch_{clean_subj}_{clean_chap}"
                        else:
                            raw_title = file_base.replace('_', ' ').replace('-', ' ').title()
                            title = re.sub(r'^\d+[\s_\.-]+', '', raw_title)
                            video_id = f"vid_{clean_subj}_{clean_chap}_{clean_file_base}"
                            chapter_id = f"ch_{clean_subj}_{clean_chap}_{clean_file_base}"
                    else:
                        raw_title = file_base.replace('_', ' ').replace('-', ' ').title()
                        title = re.sub(r'^\d+[\s_\.-]+', '', raw_title)
                        clean_chap = re.sub(r'[^a-zA-Z0-9_]', '_', file_base.lower())
                        video_id = f"vid_{clean_subj}_{clean_file_base}"
                        chapter_id = f"ch_{clean_subj}_{clean_file_base}"
                    
                    # Extract paragraphs from real PDF using pypdf
                    paragraphs = []
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(full_path)
                        text_content = ""
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_content += page_text + "\n"
                        paragraphs = [p.strip() for p in text_content.split('\n\n') if p.strip()]
                    except Exception as e:
                        print(f"  [WARNING] Failed to extract text from PDF: {e}")
                    
                    if not paragraphs or len(paragraphs) < 2:
                        paragraphs = [
                            f"This is an automated course material for {title} under the subject of {subject}.",
                            f"The syllabus covers core guidelines and references to ensure structured learning in {subject}.",
                            f"Detailed assignments and academic discussions are enabled for this curriculum track."
                        ]
                
                print(f"  -> Video ID: {video_id} | Chapter ID: {chapter_id} | Title: {title}")
                
                # Check if this lesson has already been fully processed and registered in lesson_metadata
                cursor.execute("SELECT COUNT(*) FROM lesson_metadata WHERE video_id = ? AND chapter_id = ?", (video_id, chapter_id))
                already_exists = cursor.fetchone()[0] > 0
                if already_exists:
                    print(f"  -> Lesson {video_id} / {chapter_id} is already processed. Skipping ingestion and caching.")
                    continue
                
                # A. Local LanceDB Injection
                print(f"  -> Embedding {len(paragraphs)} paragraphs...")
                embeddings = model.encode(paragraphs)
                
                data_to_insert = []
                landmarks = []
                for idx, para in enumerate(paragraphs):
                    # Generate mock timestamps (00:00, 02:15, 04:30, etc.)
                    minutes = (idx * 2)
                    seconds = (idx * 15) % 60
                    time_marker = f"{minutes:02d}:{seconds:02d}"
                    
                    content_id = f"{video_id}_{idx}"
                    vector_list = embeddings[idx].tolist()
                    
                    data_to_insert.append({
                        "content_id": content_id,
                        "subject": subject,
                        "timestamp_marker": time_marker,
                        "raw_transcript_text": para,
                        "vector": vector_list
                    })
                    landmarks.append(time_marker)
                    
                print(f"  -> Uploading {len(data_to_insert)} vector objects to local LanceDB...")
                tbl.add(data_to_insert)
                
                # B. Simulated Remote Cloud S3 Ingest Mirror
                s3_subject_dir = os.path.join(s3_mock_dir, subject)
                os.makedirs(s3_subject_dir, exist_ok=True)
                s3_file_path = os.path.join(s3_subject_dir, f"{chapter_id}.json")
                
                s3_payload = {
                    "video_id": video_id,
                    "chapter_id": chapter_id,
                    "title": title,
                    "subject": subject,
                    "landmarks": landmarks,
                    "chunks": [
                        {
                            "content_id": item["content_id"],
                            "raw_transcript_text": item["raw_transcript_text"],
                            "vector": item["vector"]
                        } for item in data_to_insert
                    ]
                }
                
                print(f"  -> Writing cloud mirror copy to S3 storage path: {s3_file_path}")
                with open(s3_file_path, "w", encoding="utf-8") as s3_f:
                    json.dump(s3_payload, s3_f, indent=2)
                
                locale = "fr_FR" if "french" in title.lower() or "economiques" in title.lower() or "extraeconomiques" in rel_path.lower() else "en_US"
                
                # C. Relational Gating inside SQLite curriculum_tree
                print("  -> Creating locked lesson tracking row in SQLite curriculum_tree...")
                cursor.execute("""
                    INSERT OR REPLACE INTO curriculum_tree (video_id, chapter_id, title, unlocked)
                    VALUES (?, ?, ?, 0);
                """, (video_id, chapter_id, title))
                
                # Determine instructor_id based on subject & locale
                instructor_id = "prof_evans"
                if locale == "fr_FR":
                    instructor_id = "prof_evans_fr"
                elif "physics" in subject.lower():
                    instructor_id = "dr_harris"
                elif "philosophy" in subject.lower():
                    instructor_id = "prof_marcus"
                
                # Insert into lesson_metadata so the PDF can be loaded by display client
                print("  -> Registering PDF path in SQLite lesson_metadata...")
                cursor.execute("""
                    INSERT OR REPLACE INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id)
                    VALUES (?, ?, ?, 1, ?);
                """, (video_id, chapter_id, "/" + rel_path, instructor_id))
                
                # E. Dynamic Simulation Layout Generation
                cursor.execute("SELECT COUNT(*) FROM lesson_simulations WHERE video_id = ? AND chapter_id = ?", (video_id, chapter_id))
                has_sims = cursor.fetchone()[0] > 0
                if not has_sims:
                    print(f"  -> Generating dynamic simulations for {video_id} using Qwen 3.5 Omni...")
                    try:
                        import qwen_omni_client
                        layouts = qwen_omni_client.generate_lesson_simulations(subject, title, paragraphs, video_id, chapter_id)
                        
                        # Clear out legacy simulations
                        cursor.execute("DELETE FROM lesson_simulations WHERE video_id = ? AND chapter_id = ?", (video_id, chapter_id))
                        
                        # Insert the 3 layouts (linked to f"{video_id}_0", f"{video_id}_1", f"{video_id}_2" etc.)
                        for l_idx, layout in enumerate(layouts):
                            content_id = f"{video_id}_{l_idx}"
                            component_name = layout.get("component_name", f"Simulation {l_idx + 1}")
                            widget = layout.get("widget", "FormulaDashboard")
                            layout_json = json.dumps(layout)
                            
                            cursor.execute("""
                                INSERT OR REPLACE INTO lesson_simulations (video_id, chapter_id, content_id, component_name, widget, layout_json)
                                VALUES (?, ?, ?, ?, ?, ?);
                            """, (video_id, chapter_id, content_id, component_name, widget, layout_json))
                        print(f"    -> SQLite: Registered {len(layouts)} dynamic simulations successfully.")
                    except Exception as e:
                        print(f"    [ERROR] Dynamic simulation generation failed: {e}")
                else:
                    print(f"  -> Dynamic simulations for {video_id} already exist in SQLite. Skipping.")

                
                # D. Ahead-of-Time Qwen 3.5 Omni Pre-Processing (Timestamps & Flashcards)
                pdf_dir = os.path.dirname(full_path)
                pdf_stem = os.path.splitext(file)[0]

                def normalize_filename(s):
                    import unicodedata
                    s = os.path.splitext(s)[0].lower()
                    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('utf-8')
                    s = re.sub(r'[^a-z0-9\s]', ' ', s)
                    words = s.split()
                    unique_words = []
                    for w in words:
                        if not unique_words or unique_words[-1] != w:
                            unique_words.append(w)
                    return " ".join(unique_words)

                # Tier 1: Check for explicit mapping.json in folder
                mapping_file = os.path.join(pdf_dir, "mapping.json")
                explicit_video = None
                if os.path.exists(mapping_file):
                    try:
                        with open(mapping_file, "r", encoding="utf-8") as mf:
                            m_data = json.load(mf)
                            for item in m_data.get("mappings", []):
                                if item.get("pdf") == file or os.path.splitext(item.get("pdf", ""))[0] == pdf_stem:
                                    explicit_video = item.get("video")
                                    break
                    except Exception as me:
                        print(f"  [WARNING] Failed to parse mapping.json: {me}")

                candidate_videos = [f for f in os.listdir(pdf_dir) if f.lower().endswith(('.mp4', '.mp3'))]
                matched_video_file = None

                if explicit_video and os.path.exists(os.path.join(pdf_dir, explicit_video)):
                    matched_video_file = explicit_video
                else:
                    # Tier 2: Exact stem match
                    for vf in candidate_videos:
                        if os.path.splitext(vf)[0].lower() == pdf_stem.lower():
                            matched_video_file = vf
                            break
                    # Tier 3: Normalized string match
                    if not matched_video_file:
                        pdf_norm = normalize_filename(file)
                        for vf in candidate_videos:
                            if normalize_filename(vf) == pdf_norm:
                                matched_video_file = vf
                                break
                    # Tier 4: Substring overlap match
                    if not matched_video_file:
                        pdf_words = set(normalize_filename(file).split())
                        best_overlap = 0
                        for vf in candidate_videos:
                            v_words = set(normalize_filename(vf).split())
                            overlap = len(pdf_words.intersection(v_words))
                            if overlap > best_overlap and overlap >= 1:
                                best_overlap = overlap
                                matched_video_file = vf

                if matched_video_file:
                    video_path = os.path.join(pdf_dir, matched_video_file).replace("\\", "/")
                    print(f"  -> Successfully paired PDF '{file}' with video '{matched_video_file}'!")
                    
                    # Check if timestamps exist
                    cursor.execute("SELECT COUNT(*) FROM video_timestamps WHERE video_id = ?", (video_id,))
                    has_ts = cursor.fetchone()[0] > 0
                    
                    # Check if flashcards exist
                    cursor.execute("SELECT COUNT(*) FROM video_flashcards WHERE video_id = ?", (video_id,))
                    has_fc = cursor.fetchone()[0] > 0
                    
                    # Check if dense transcripts exist
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS video_transcripts (
                            video_id TEXT NOT NULL,
                            timestamp TEXT NOT NULL,
                            text TEXT NOT NULL,
                            translated_text TEXT,
                            PRIMARY KEY (video_id, timestamp)
                        );
                    """)
                    cursor.execute("SELECT COUNT(*) FROM video_transcripts WHERE video_id = ?", (video_id,))
                    has_dt = cursor.fetchone()[0] > 0
                    
                    import qwen_omni_client
                    
                    if not has_ts:
                        print(f"  -> Pre-generating timestamps for {video_id} using Qwen 3.5 Omni...")
                        try:
                            ts_list = qwen_omni_client.generate_video_timestamps(video_path, video_id)
                            for ts in ts_list:
                                cursor.execute("""
                                    INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description)
                                    VALUES (?, ?, ?, ?);
                                """, (video_id, ts["timestamp"], ts["title"], ts["description"]))
                            print(f"    -> Caching completed. {len(ts_list)} chapters generated.")
                        except Exception as e:
                            print(f"    [ERROR] Timestamp generation failed: {e}")
                            
                    if not has_fc:
                        print(f"  -> Pre-generating Socratic study flashcards for {video_id} using Qwen 3.5 Omni...")
                        try:
                            fc_list = qwen_omni_client.generate_video_flashcards(video_path, video_id, locale)
                            for fc in fc_list:
                                cursor.execute("""
                                    INSERT OR REPLACE INTO video_flashcards (video_id, front, back, hint)
                                    VALUES (?, ?, ?, ?);
                                """, (video_id, fc["front"], fc["back"], fc["hint"]))
                            print(f"    -> Caching completed. {len(fc_list)} study cards generated.")
                        except Exception as e:
                            print(f"    [ERROR] Flashcard generation failed: {e}")
                            
                    if not has_dt:
                        print(f"  -> Pre-generating dense transcripts for {video_id} using Gemini...")
                        try:
                            # Commit and close connection to release database locks
                            conn.commit()
                            conn.close()
                            
                            from display_client import generate_and_cache_dense_transcripts
                            generate_and_cache_dense_transcripts(video_path, video_id, locale)
                            print(f"    -> Caching completed for dense transcripts.")
                            
                            # Re-establish database connection for subsequent processing
                            conn = sqlite3.connect(sqlite_db_path)
                            cursor = conn.cursor()
                        except Exception as e:
                            print(f"    [ERROR] Dense transcript generation failed: {e}")
                            # Re-establish connection in case of failure to maintain loop integrity
                            conn = sqlite3.connect(sqlite_db_path)
                            cursor = conn.cursor()
                            
                conn.commit()
                ingested_count += 1
                    
    conn.close()
    print(f"\n=== DUAL-SYNC INGESTION COMPLETE: Ingested {ingested_count} curriculum lessons successfully! ===")

if __name__ == "__main__":
    scan_staging_and_ingest()
