import sqlite3, os, unicodedata, re

db_path = 'vault.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Inspect lesson_metadata
    cursor.execute("SELECT video_id, chapter_id, pdf_file_path FROM lesson_metadata")
    rows = cursor.fetchall()
    print("--- BEFORE FIX ---")
    for r in rows:
        print(r)
        
    # Scan actual files on disk under curriculum_staging
    real_files = {}
    staging_dir = os.path.abspath("curriculum_staging")
    for root, dirs, files in os.walk(staging_dir):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = "/" + os.path.relpath(full_p, os.path.dirname(staging_dir)).replace("\\", "/")
            real_files[f] = rel_p
            
    print("\n--- ACTUAL FILES ON DISK ---")
    for fname, fpath in real_files.items():
        print(f"File: '{fname}' -> Path: '{fpath}'")

    # Fix lesson_metadata entries
    cursor.execute("SELECT video_id, pdf_file_path FROM lesson_metadata")
    all_lessons = cursor.fetchall()
    for vid, pdf_p in all_lessons:
        if 'extraeconomiques' in vid:
            if '01' in vid:
                correct_pdf = "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/01_Les problèmes démographiques.pdf"
            elif '02' in vid:
                correct_pdf = "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/02_Les problèmes sanitaires.pdf"
            elif '03' in vid:
                correct_pdf = "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/03_problèmes alimentaires.pdf"
            else:
                continue
            cursor.execute("UPDATE lesson_metadata SET pdf_file_path = ? WHERE video_id = ?", (correct_pdf, vid))
            print(f"Updated {vid} -> {correct_pdf}")
            
    conn.commit()
    
    cursor.execute("SELECT video_id, chapter_id, pdf_file_path FROM lesson_metadata")
    print("\n--- AFTER FIX ---")
    for r in cursor.fetchall():
        print(r)
        
    conn.close()
