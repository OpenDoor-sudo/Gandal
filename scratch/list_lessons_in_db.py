import sqlite3
import json

conn = sqlite3.connect("vault.db")
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print(f"Tables: {tables}\n")

# Check if video_flashcards or other metadata has video_id
for table in ["video_flashcards", "video_transcripts", "lesson_instructors", "user_profiles"]:
    if table in tables:
        cursor.execute(f"SELECT DISTINCT video_id FROM {table}")
        print(f"Distinct video_ids in {table}: {[r[0] for r in cursor.fetchall()]}")

print("\nDetail of lesson_instructors:")
if "lesson_instructors" in tables:
    cursor.execute("SELECT * FROM lesson_instructors")
    for r in cursor.fetchall():
        print(r)

print("\nDetail of user_profiles:")
if "user_profiles" in tables:
    cursor.execute("SELECT * FROM user_profiles")
    for r in cursor.fetchall():
        print(r)

conn.close()
