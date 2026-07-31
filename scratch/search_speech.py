with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r"recognition\.", content)]
for idx, pos in enumerate(matches):
    print(f"Match {idx+1}: position {pos}")
    # print context around the match
    start = max(0, pos - 150)
    end = min(len(content), pos + 150)
    print(content[start:end])
    print("="*40)
