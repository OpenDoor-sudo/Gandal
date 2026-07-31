with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
matches = list(re.finditer(r"UI_LOCALIZATIONS|translateClassroomUI", html))
for m in matches:
    start = max(0, m.start() - 200)
    end = min(len(html), m.end() + 1000)
    print(html[start:end])
    print("="*60)
