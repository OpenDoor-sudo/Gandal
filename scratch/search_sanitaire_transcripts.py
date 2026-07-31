import sqlite3

conn = sqlite3.connect('vault.db')
cur = conn.cursor()

rows = cur.execute("SELECT timestamp, text FROM video_transcripts WHERE video_id = 'vid_economics_extraeconomiques_02_les_probl_mes_sanitaires'").fetchall()
print(f"Total rows for video 02 in DB: {len(rows)}")

matches = [r for r in rows if any(w in r[1].lower() for w in ['covid', 'ebola', 'tuberculose', 'vih', 'sida', 'paludisme'])]
print("\nMatching lines in DB:")
for m in matches:
    print(f"  [{m[0]}] {m[1]}")

conn.close()
