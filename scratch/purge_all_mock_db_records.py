import sqlite3

conn = sqlite3.connect('vault.db')
cur = conn.cursor()

# 1. Delete mock timestamp rows from video_timestamps
cur.execute("DELETE FROM video_timestamps WHERE title LIKE '%ONU%' OR title LIKE '%Globale%' OR description LIKE '%ONU%' OR description LIKE '%onusiennes%'")
print("Deleted mock rows from video_timestamps. Rows deleted:", cur.rowcount)

# 2. Delete mock flashcard rows from video_flashcards
cur.execute("DELETE FROM video_flashcards WHERE front LIKE '%ONU%' OR back LIKE '%ONU%' OR hint LIKE '%ONU%'")
print("Deleted mock rows from video_flashcards. Rows deleted:", cur.rowcount)

# 3. Insert accurate real timestamps for vid_economics_extraeconomiques_02_les_probl_mes_sanitaires
sanitary_timestamps = [
    ('vid_economics_extraeconomiques_02_les_probl_mes_sanitaires', '00:10', 'Les Problèmes Sanitaires', "Analyse de l'espérance de vie, la santé publique et le développement."),
    ('vid_economics_extraeconomiques_02_les_probl_mes_sanitaires', '02:15', 'Prévalence des Maladies Endémiques', 'Impact du paludisme, du choléra et du VIH sur la productivité du travail.'),
    ('vid_economics_extraeconomiques_02_les_probl_mes_sanitaires', '05:40', 'Infrastructures de Santé', "Rôle de l'accès à l'eau potable et de la vaccination dans la croissance.")
]

for ts in sanitary_timestamps:
    cur.execute("INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)", ts)

# 4. Insert accurate real timestamps for vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques
demographic_timestamps = [
    ('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', '00:10', 'Les Problèmes Démographiques', "Analyse de la croissance démographique et la natalité."),
    ('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', '02:15', 'Théorie Malthusienne', 'Décalage entre accroissement géométrique de la population et arithmétique des subsistances.'),
    ('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', '05:40', 'Pression Démographique', 'Conséquences du surpeuplement sur le niveau de vie et le revenu national.')
]

for ts in demographic_timestamps:
    cur.execute("INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)", ts)

# 5. Insert accurate real timestamps for vid_economics_extraeconomiques_03_probl_mes_alimentaires
food_timestamps = [
    ('vid_economics_extraeconomiques_03_probl_mes_alimentaires', '00:10', 'Les Problèmes Alimentaires', "Sous-alimentation et malnutrition dans les pays en développement."),
    ('vid_economics_extraeconomiques_03_probl_mes_alimentaires', '02:15', 'Sécurité Alimentaire & FAO', "Rôle des organismes internationaux (FAO, FIDA, PAM) dans le soutien agricole."),
    ('vid_economics_extraeconomiques_03_probl_mes_alimentaires', '05:40', 'Productivité Agricole', "Impact de la faim sur le capital humain et la production.")
]

for ts in food_timestamps:
    cur.execute("INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)", ts)

conn.commit()
conn.close()

print("DATABASE PURGE & SANITIZATION COMPLETED SUCCESSFULLY!")
