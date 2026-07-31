with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
matches = list(re.finditer(r"SOCRATIC_HINT|SPAWN_CANVAS", html))
for m in matches:
    start_line = html.count("\n", 0, m.start()) + 1
    print(f"Match '{m.group()}' on line: {start_line}")
