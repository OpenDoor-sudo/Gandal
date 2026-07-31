import sqlite3

conn = sqlite3.connect('vault.db')
cursor = conn.cursor()

vid = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"

print("--- TIMESTAMPS ---")
rows = cursor.execute("SELECT timestamp, title, description FROM video_timestamps WHERE video_id = ?", (vid,)).fetchall()
for r in rows:
    print(r)

print("\n--- FLASHCARDS ---")
fc_rows = cursor.execute("SELECT front, back, hint FROM video_flashcards WHERE video_id = ?", (vid,)).fetchall()
for r in fc_rows:
    print(r)

conn.close()
