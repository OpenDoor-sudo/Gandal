import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

search_words = ["face_count", "presence", "camera", "attentional", "sentry", "pause", "play", "play_video", "pause_video"]
for i, line in enumerate(lines):
    line_lower = line.lower()
    for word in search_words:
        if word in line_lower:
            # Let's inspect references to camera/sentry logic specifically
            if "mesh" in line_lower or "sentry" in line_lower or "face" in line_lower or "detect" in line_lower:
                print(f"Line {i+1}: {line.strip()}")
                break
