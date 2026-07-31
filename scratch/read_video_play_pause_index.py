with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find all occurrences of pauseVideoTimeline and playVideoTimeline
for name in ["pauseVideoTimeline", "playVideoTimeline", "isVideoPausedBySentry"]:
    print(f"=== Occurrences of {name} ===")
    matches = list(re.finditer(name, content))
    for m in matches:
        start = max(0, m.start() - 150)
        end = min(len(content), m.end() + 150)
        print(f"Match context at offset {m.start()}:\n{content[start:end]}\n" + "-"*40)
