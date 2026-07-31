import sqlite3
import os

def main():
    db_path = 'vault.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    tables_to_truncate = [
        "user_profiles",
        "language_localization",
        "mastery_ledger",
        "evaluation_ledger",
        "subject_activations"
    ]
    
    try:
        # Check if tables exist first
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {t[0] for t in cur.fetchall()}
        
        for table in tables_to_truncate:
            if table in existing_tables:
                cur.execute(f"DELETE FROM {table}")
                print(f"Successfully truncated table: {table}")
            else:
                print(f"Table {table} does not exist in the database, skipping.")
        
        # Clear and re-seed handwriting_archive
        cur.execute("DELETE FROM handwriting_archive")
        mock_archives = [
            ('Physics', 'vid_physics_01', 'physics_pendulums', 'pendulum_work_pass.png', 'Period of a pendulum: T = 2 * pi * sqrt(L / g)', 100.0, 1),
            ('Physics', 'vid_physics_02', 'physics_pendulums', 'pendulum_work_fail.png', 'Period of a pendulum: T = 2 * pi * sqrt(g / L)', 66.6, 0)
        ]
        cur.executemany('''
            INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        ''', mock_archives)
        
        conn.commit()
        print("Database reset completed successfully. Ready for clean onboarding.")
    except Exception as e:
        print(f"Error during database reset: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
