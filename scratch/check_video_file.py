import os

video_path = os.path.join("curriculum_staging", "k12", "TSM", "Economics", "Extraeconomiques", "02_Les problèmes sanitaires.mp4")
print("File size:", os.path.getsize(video_path), "bytes")

# Read first 1000 bytes to check MP4 box structure
with open(video_path, "rb") as f:
    header = f.read(64)
    print("Header bytes:", header[:16])
