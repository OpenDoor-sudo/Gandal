import sqlite3

conn = sqlite3.connect("vault.db")
cursor = conn.cursor()

# Get column names for curriculum_tree and lesson_metadata
for table in ["curriculum_tree", "lesson_metadata"]:
    cursor.execute(f"PRAGMA table_info({table})")
    print(f"Table {table} Columns: {[r[1] for r in cursor.fetchall()]}")

print("\n--- Rows in curriculum_tree ---")
cursor.execute("SELECT * FROM curriculum_tree")
for r in cursor.fetchall()[:20]:
    print(r)

print("\n--- Rows in lesson_metadata ---")
cursor.execute("SELECT * FROM lesson_metadata")
for r in cursor.fetchall()[:20]:
    print(r)

conn.close()
