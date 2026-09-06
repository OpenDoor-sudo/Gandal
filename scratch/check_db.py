import sqlite3

conn = sqlite3.connect("vault.db")
cur = conn.cursor()

for table in ["curriculum_tree", "lesson_metadata"]:
    try:
        cur.execute(f"SELECT * FROM {table} WHERE video_id LIKE '%sanitaire%'")
        cols = [d[0] for d in cur.description]
        for row in cur.fetchall():
            print(table, dict(zip(cols, row)))
    except Exception as e:
        print(f"Error in {table}:", e)
