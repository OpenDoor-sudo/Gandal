import os
import sqlite3
import pyarrow as pa
import lancedb
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------
# 1. Configure and Initialize SQLite Database
# ---------------------------------------------------------
SQLITE_DB_PATH = "vault.db"

def init_sqlite():
    print(f"Initializing SQLite database at: {SQLITE_DB_PATH}...")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Create user_profiles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            background_context TEXT NOT NULL
        );
    """)

    # Create video_timestamps table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_timestamps (
            video_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            PRIMARY KEY (video_id, timestamp)
        );
    """)
    
    # Create mastery_ledger table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mastery_ledger (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            score REAL,
            mastery_achieved BOOLEAN NOT NULL CHECK (mastery_achieved IN (0, 1)),
            PRIMARY KEY (video_id, chapter_id)
        );
    """)
    
    # Create evaluation_ledger table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evaluation_ledger (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            quiz_type TEXT NOT NULL CHECK (quiz_type IN ('video_level', 'chapter_level')),
            raw_score REAL NOT NULL,
            passed BOOLEAN NOT NULL CHECK (passed IN (0, 1)),
            PRIMARY KEY (video_id, chapter_id, quiz_type)
        );
    """)

    # Create handwriting_archive table
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

    # Create instructors table
    cursor.execute("DROP TABLE IF EXISTS lesson_metadata;")
    cursor.execute("DROP TABLE IF EXISTS instructors;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instructors (
            instructor_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            experience_years INTEGER NOT NULL,
            subjects_list TEXT NOT NULL,
            profile_image TEXT NOT NULL,
            biography TEXT,
            locale TEXT DEFAULT 'en_US'
        );
    """)

    # Create lesson_metadata table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson_metadata (
            video_id TEXT PRIMARY KEY,
            chapter_id TEXT NOT NULL,
            pdf_file_path TEXT NOT NULL,
            start_page INTEGER NOT NULL,
            instructor_id TEXT,
            FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
        );
    """)

    # Create lesson_simulations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson_simulations (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            content_id TEXT NOT NULL,
            component_name TEXT NOT NULL,
            widget TEXT NOT NULL,
            layout_json TEXT NOT NULL,
            PRIMARY KEY (video_id, chapter_id, content_id)
        );
    """)


    # Create language_localization table
    cursor.execute("DROP TABLE IF EXISTS language_localization;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS language_localization (
            user_id TEXT PRIMARY KEY,
            locale TEXT NOT NULL CHECK (locale IN ('en_US', 'fr_FR', 'zh_CN', 'es_ES', 'pt_PT', 'ar_AE')),
            FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
        );
    """)

    # Create subject_activations table
    cursor.execute("DROP TABLE IF EXISTS subject_activations;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subject_activations (
            subject TEXT NOT NULL,
            activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Create student_progress table
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
    
    # Insert mock instructors
    mock_instructors = [
        ("dr_harris", "Dr. Harris", "+1-555-0199", 15, "Physics", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", "Dr. Harris is an esteemed specialist in Physics with 15 years of experience in quantum mechanics and educational research. Dedicated to helping students grasp complex physical concepts.", "en_US"),
        ("prof_marcus", "Professor Marcus", "+1-555-0188", 20, "Philosophy", "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150", "Professor Marcus is a senior Philosophy Specialist with 20 years of academic teaching experience. He specializes in Ancient Socratic dialogues and Stoic philosophy.", "en_US"),
        ("prof_evans", "GANDHO", "+1-555-0177", 10, "Economics", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", "GANDHO is an Economics Specialist with 10 years of experience teaching global growth indicators and international development at the United Nations.", "en_US"),
        ("prof_evans_fr", "GANDHO (Français)", "+1-555-0178", 10, "Economics", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", "GANDHO est un spécialiste de l'économie, doté de 10 ans d'expérience dans l'enseignement de la macroéconomie.", "fr_FR")
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO instructors (instructor_id, full_name, phone_number, experience_years, subjects_list, profile_image, biography, locale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, mock_instructors)

    # Empty user profiles and localization to ensure clean reset state
    cursor.execute("DELETE FROM user_profiles;")
    cursor.execute("DELETE FROM language_localization;")
    cursor.execute("DELETE FROM handwriting_archive;")
    cursor.execute("DELETE FROM video_timestamps;")
    cursor.execute("DELETE FROM video_flashcards;")
    cursor.execute("DELETE FROM evaluation_ledger;")
    cursor.execute("DELETE FROM mastery_ledger;")
    cursor.execute("DELETE FROM student_progress;")
    cursor.execute("DROP TABLE IF EXISTS curriculum_tree;")
    
    mock_mastery = []
    cursor.executemany("""
        INSERT OR REPLACE INTO mastery_ledger (video_id, chapter_id, mastery_achieved)
        VALUES (?, ?, ?);
    """, mock_mastery)

    mock_archives = []
    cursor.executemany("""
        INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, mock_archives)

    mock_lessons = []
    cursor.executemany("""
        INSERT OR REPLACE INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id)
        VALUES (?, ?, ?, ?, ?);
    """, mock_lessons)
    
    conn.commit()
    conn.close()
    print("SQLite database initialized successfully with instructors.")

# ---------------------------------------------------------
# 2. Configure and Initialize LanceDB Vector Database
# ---------------------------------------------------------
LANCEDB_DIR = ".lancedb"

def init_lancedb():
    print(f"Initializing LanceDB database at folder: {LANCEDB_DIR}...")
    
    # Load lightweight embedding model
    print("Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    dimension = model.get_sentence_embedding_dimension()
    print(f"Model loaded. Embedding dimension: {dimension}")
    
    # Connect to LanceDB (embedded)
    db = lancedb.connect(LANCEDB_DIR)
    
    # Define schema using PyArrow to be robust and clean
    schema = pa.schema([
        pa.field("content_id", pa.string()),
        pa.field("subject", pa.string()),
        pa.field("timestamp_marker", pa.string()),
        pa.field("raw_transcript_text", pa.string()),
        pa.field("vector", pa.list_(pa.float32(), dimension))
    ])
    
    # Create or overwrite the table
    table_name = "curriculum_rag"
    tbl = db.create_table(table_name, schema=schema, mode="overwrite")
    print(f"LanceDB table '{table_name}' created successfully with Arrow schema.")
    
    # Prepare Mock Data
    print("Preparing mock transcript data...")
    mock_transcripts = []
    
    # Generate embeddings
    texts_to_embed = [item["raw_transcript_text"] for item in mock_transcripts]
    print(f"Generating embeddings for {len(texts_to_embed)} text items...")
    embeddings = []
    if texts_to_embed:
        embeddings = model.encode(texts_to_embed)
    
    # Add embeddings to the mock data list
    data_to_insert = []
    for i, item in enumerate(mock_transcripts):
        vector_list = embeddings[i].tolist()
        data_to_insert.append({
            "content_id": item["content_id"],
            "subject": item["subject"],
            "timestamp_marker": item["timestamp_marker"],
            "raw_transcript_text": item["raw_transcript_text"],
            "vector": vector_list
        })
        
    # Insert data
    if data_to_insert:
        print(f"Inserting {len(data_to_insert)} records into LanceDB table '{table_name}'...")
        tbl.add(data_to_insert)
    print("LanceDB initialization complete.")

# ---------------------------------------------------------
# 3. Verification Query Block
# ---------------------------------------------------------
def verify_databases():
    print("\n=== VERIFYING SQLite DATABASE ===")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    print("\n--- User Profiles ---")
    cursor.execute("SELECT * FROM user_profiles;")
    for row in cursor.fetchall():
        print(f"User ID: {row[0]}\nContext: {row[1]}\n")
        
    print("--- Mastery Ledger ---")
    cursor.execute("SELECT * FROM mastery_ledger;")
    for row in cursor.fetchall():
        print(f"Video: {row[0]} | Chapter: {row[1]} | Mastered: {bool(row[2])}")
    conn.close()
    
    print("\n=== VERIFYING LanceDB DATABASE ===")
    db = lancedb.connect(LANCEDB_DIR)
    tbl = db.open_table("curriculum_rag")
    
    print(f"Total records in curriculum_rag: {len(tbl)}")
    # Perform a simple limit search (retrieve all 5 items)
    df = tbl.to_pandas()
    print("\nInserted Records DataFrame Preview:")
    print(df[["content_id", "subject", "timestamp_marker", "raw_transcript_text"]])
    
    print("\nVector dimensions check:")
    if not df.empty:
        first_vector = df.iloc[0]["vector"]
        print(f"Vector length for content_id {df.iloc[0]['content_id']}: {len(first_vector)}")
    else:
        print("Vector database is empty.")

if __name__ == "__main__":
    init_sqlite()
    init_lancedb()
    verify_databases()
