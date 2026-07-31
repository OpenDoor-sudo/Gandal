import os, sqlite3, json

print("=== CHECKING VIDEO FILES & METADATA ===")

# 1. Search for all .mp4 files on disk
mp4_files = []
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.mp4') or f.endswith('.webm'):
            mp4_files.append(os.path.join(root, f).replace('\\', '/'))

print("\n--- MP4 FILES FOUND ON DISK ---")
for f in mp4_files:
    print(f, "Exists:", os.path.exists(f), "Size:", os.path.getsize(f) if os.path.exists(f) else 0)

# 2. Check vault.db video_file_path entries
print("\n--- DATABASE LESSON METADATA RECORDS ---")
if os.path.exists('vault.db'):
    conn = sqlite3.connect('vault.db')
    cursor = conn.cursor()
    cursor.execute("SELECT video_id, title, video_file_path FROM lesson_metadata;")
    rows = cursor.fetchall()
    for r in rows:
        vid_id, title, vpath = r
        vpath_clean = vpath.replace('\\', '/') if vpath else ''
        file_exists = os.path.exists(vpath_clean) if vpath_clean else False
        print(f"ID: {vid_id}\n  Title: {title}\n  Path: '{vpath}'\n  File Exists on Disk: {file_exists}\n")
    conn.close()
