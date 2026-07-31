import sqlite3

conn = sqlite3.connect('vault.db')
cursor = conn.cursor()

tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
for t in tables:
    tname = t[0]
    cols = [c[1] for c in cursor.execute(f"PRAGMA table_info({tname})").fetchall()]
    if 'video_id' in cols:
        print(f"=== TABLE: {tname} ===")
        rows = cursor.execute(f"SELECT * FROM {tname} WHERE video_id LIKE '%econ%'").fetchall()
        for r in rows:
            print("  ", r)

conn.close()
