import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "PAUSE_VIDEO" in line or "PLAY_VIDEO" in line or "no_face_present" in line or "sentry" in line.lower() or "websocket" in line.lower():
        if "style" not in line.lower() and "svg" not in line.lower():
            print(f"Line {i+1}: {line.strip()}")
            start = max(0, i - 4)
            end = min(len(lines), i + 5)
            print("  Context:")
            for j in range(start, end):
                print(f"    {j+1}: {lines[j]}", end="")
            print("-" * 40)
