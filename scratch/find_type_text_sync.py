with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
matches = list(re.finditer(r"function typeTextSync", html))
for m in matches:
    start_line = html.count("\n", 0, m.start()) + 1
    print(f"Match on line: {start_line}")
    start = max(0, m.start() - 100)
    end = min(len(html), m.end() + 1800)
    print(html[start:end])
    print("="*60)
