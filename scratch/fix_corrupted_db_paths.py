import sqlite3, os

print("=== FIXING CORRUPTED PATHS IN VAULT.DB ===")

db_path = 'vault.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Update lesson_metadata table
    cursor.execute("UPDATE lesson_metadata SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/01_Les problèmes démographiques.pdf' WHERE video_id = 'vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques';")
    cursor.execute("UPDATE lesson_metadata SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/02_Les problèmes sanitaires.pdf' WHERE video_id = 'vid_economics_extraeconomiques_02_les_probl_mes_sanitaires';")
    cursor.execute("UPDATE lesson_metadata SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/03_problèmes alimentaires.pdf' WHERE video_id = 'vid_economics_extraeconomiques_03_probl_mes_alimentaires';")
    cursor.execute("UPDATE lesson_metadata SET pdf_file_path = '/curriculum_staging/k12/TSM/chemistry/organic_chemistry/Chemistry.pdf' WHERE video_id = 'vid_chemistry_organic_chemistry_chemistry';")
    
    # 2. Update curriculum_tree table if exists
    try:
        cursor.execute("UPDATE curriculum_tree SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/01_Les problèmes démographiques.pdf' WHERE video_id = 'vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques';")
        cursor.execute("UPDATE curriculum_tree SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/02_Les problèmes sanitaires.pdf' WHERE video_id = 'vid_economics_extraeconomiques_02_les_probl_mes_sanitaires';")
        cursor.execute("UPDATE curriculum_tree SET pdf_file_path = '/curriculum_staging/k12/TSM/Economics/Extraeconomiques/03_problèmes alimentaires.pdf' WHERE video_id = 'vid_economics_extraeconomiques_03_probl_mes_alimentaires';")
        cursor.execute("UPDATE curriculum_tree SET pdf_file_path = '/curriculum_staging/k12/TSM/chemistry/organic_chemistry/Chemistry.pdf' WHERE video_id = 'vid_chemistry_organic_chemistry_chemistry';")
    except Exception as e:
        print("curriculum_tree update note:", e)

    conn.commit()

    # Verify rows
    cursor.execute("SELECT video_id, pdf_file_path FROM lesson_metadata;")
    print("\n--- UPDATED LESSON METADATA ROWS ---")
    for r in cursor.fetchall():
        print(r)
        
    conn.close()

print("Successfully cleaned up corrupted database paths in vault.db!")
