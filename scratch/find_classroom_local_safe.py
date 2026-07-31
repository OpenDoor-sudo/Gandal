import re
import sys

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

matches = list(re.finditer(r"UI_LOCALIZATIONS|translateClassroomUI", html))
out_lines = []
for m in matches:
    start = max(0, m.start() - 200)
    end = min(len(html), m.end() + 1200)
    out_lines.append(html[start:end])
    out_lines.append("="*60)

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\scratch\classroom_local_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
