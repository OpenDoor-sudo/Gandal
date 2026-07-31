import sqlite3

def inspect_db():
    conn = sqlite3.connect("vault.db")
    cursor = conn.cursor()
    
    print("\n--- LESSON METADATA ---")
    cursor.execute("""
        SELECT lm.video_id, ct.title, lm.instructor_id 
        FROM lesson_metadata lm
        LEFT JOIN curriculum_tree ct ON lm.video_id = ct.video_id
    """)
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- CURRICULUM TREE ---")
    cursor.execute("SELECT video_id, title, chapter_id FROM curriculum_tree")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- INSTRUCTORS ---")
    cursor.execute("SELECT instructor_id, full_name, locale FROM instructors")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    inspect_db()
