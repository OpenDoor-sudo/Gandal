import os
import sqlite3
import unicodedata

video_id = 'vid_economics_extraeconomiques_02_les_probl_mes_sanitaires'
conn = sqlite3.connect("vault.db")
cur = conn.cursor()
cur.execute("SELECT pdf_file_path FROM lesson_metadata WHERE video_id = ?", (video_id,))
row = cur.fetchone()
pdf_path = row[0] if row else ""
print("pdf_path from DB:", repr(pdf_path))

# Check lines 2402-2437 in display_client.py:
resolved_video_path = None
if pdf_path:
    clean_pdf_path = pdf_path.lstrip('/')
    if not clean_pdf_path.startswith('curriculum_staging/'):
        clean_pdf_path = 'curriculum_staging/' + clean_pdf_path
    pdf_dir = os.path.join(os.path.abspath('.'), os.path.dirname(clean_pdf_path))
    print("pdf_dir:", pdf_dir, "exists?", os.path.exists(pdf_dir))
    if os.path.exists(pdf_dir):
        pdf_stem = unicodedata.normalize('NFC', os.path.splitext(os.path.basename(clean_pdf_path))[0])
        all_dir_files = os.listdir(pdf_dir)
        print("all_dir_files count:", len(all_dir_files))
        mp4_files = [f for f in all_dir_files if f.lower().endswith('.mp4')]
        print("mp4_files:", [repr(f) for f in mp4_files])
        matched_media = None
        for f in mp4_files:
            norm_f_stem = unicodedata.normalize('NFC', os.path.splitext(f)[0])
            print(f"Comparing norm_f_stem: {repr(norm_f_stem)} with pdf_stem: {repr(pdf_stem)}")
            if norm_f_stem.lower() == pdf_stem.lower():
                matched_media = f
                print("MATCH FOUND!")
                break
        if not matched_media and "_" in pdf_stem:
            prefix = pdf_stem.split("_")[0].lower()
            for f in mp4_files:
                if os.path.splitext(f)[0].lower().startswith(prefix + "_"):
                    matched_media = f
                    print("PREFIX MATCH FOUND!")
                    break
        if matched_media:
            resolved_video_path = os.path.join(os.path.dirname(clean_pdf_path), matched_media).replace('\\', '/')
            if not resolved_video_path.startswith('curriculum_staging/'):
                resolved_video_path = 'curriculum_staging/' + resolved_video_path

print("Final resolved_video_path:", repr(resolved_video_path))
