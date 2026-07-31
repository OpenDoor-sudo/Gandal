import sqlite3, os, json

db_path = 'vault.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    print("Vault.db Tables:", tables)
    
    # Check lesson_metadata
    cursor.execute("SELECT video_id, chapter_id, pdf_file_path FROM lesson_metadata")
    rows = cursor.fetchall()
    print("\nCurrent lesson_metadata entries:")
    for r in rows:
        print(" -", r)
    conn.close()
