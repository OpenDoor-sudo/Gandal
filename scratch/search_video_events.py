with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find all occurrences of event listeners on video elements
matches = list(re.finditer(r"\.addEventListener\s*\(", content))
for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 200)
    # Check if this pertains to video, play, or pause
    context = content[start:end]
    if any(k in context.lower() for k in ["video", "play", "pause"]):
        print(f"Match context at offset {m.start()}:\n{context}\n" + "-"*40)
