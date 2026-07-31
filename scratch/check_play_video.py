with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "lectureVideoPlayer.play" in line or "video.play" in line or "playControlBtn" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print context
        start = max(0, i - 3)
        end = min(len(lines), i + 4)
        for j in range(start, end):
            print(f"  {j+1}: {lines[j]}", end="")
        print("-" * 40)
