import sqlite3

conn = sqlite3.connect('vault.db')
cursor = conn.cursor()

vid = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"

# Update timestamps to authentic Demographic lesson chapters
cursor.execute("DELETE FROM video_timestamps WHERE video_id = ?", (vid,))
timestamps = [
    (vid, "00:00", "Introduction aux Problèmes Démographiques", "Aperçu de la croissance de la population mondiale et des enjeux sociodémographiques."),
    (vid, "02:30", "Causes de l'Explosion Démographique", "Analyse de la baisse de la mortalité infantile, du poids des traditions et des mariages précoces."),
    (vid, "06:15", "Conséquences Économiques et Sociales", "Impact sur le chômage, l'analphabétisme, le sous-développement et la dépendance financière."),
    (vid, "10:00", "Théorie Malthusienne et Perspectives", "Lien entre surpopulation et pauvreté selon la perspective malthusienne.")
]
cursor.executemany("INSERT INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)", timestamps)

# Update lesson_metadata chapter title
cursor.execute("UPDATE lesson_metadata SET chapter_id = 'ch_demographiques', start_page = 1 WHERE video_id = ?", (vid,))

conn.commit()
print("Successfully updated video_timestamps and lesson_metadata for Lesson 1 in vault.db!")
conn.close()
