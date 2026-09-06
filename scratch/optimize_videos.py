import os
import subprocess

staging = os.path.abspath("curriculum_staging")
mp4_files = []
for root, dirs, files in os.walk(staging):
    for f in files:
        if f.lower().endswith(".mp4") and not f.startswith("fast_"):
            mp4_files.append(os.path.join(root, f))

print(f"Found {len(mp4_files)} MP4 files to optimize with faststart:")
for path in mp4_files:
    print("Optimizing:", path)
    temp_path = path + ".faststart.mp4"
    cmd = ["ffmpeg", "-y", "-i", path, "-c", "copy", "-movflags", "+faststart", temp_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        os.replace(temp_path, path)
        print("  -> Optimized successfully with faststart!")
    else:
        print("  -> Failed:", res.stderr)
        if os.path.exists(temp_path):
            os.remove(temp_path)
