import sqlite3

conn = sqlite3.connect('vault.db')
cursor = conn.cursor()

# Delete stale progress and mastery for old legacy video IDs
legacy_ids = ['vid_economics_01', 'vid_physics_01', 'vid_chemistry_organic_chemistry', 'vid_philosophy_01']
for lid in legacy_ids:
    cursor.execute("DELETE FROM student_progress_video WHERE video_id = ?", (lid,))
    cursor.execute("DELETE FROM mastery_ledger WHERE video_id = ?", (lid,))
    cursor.execute("DELETE FROM evaluation_ledger WHERE video_id = ?", (lid,))
    cursor.execute("DELETE FROM video_transcripts WHERE video_id = ?", (lid,))
    cursor.execute("DELETE FROM curriculum_tree WHERE video_id = ?", (lid,))

# Ensure Economics Lesson 1 is unlocked in curriculum_tree
cursor.execute("UPDATE curriculum_tree SET unlocked = 1 WHERE video_id LIKE '%extraeconomiques_01%'")

conn.commit()
conn.close()
print("Successfully cleaned stale legacy entries from vault.db!")
