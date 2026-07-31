with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
matches = list(re.finditer(r"Experience:|Contact:|Specialist|Tutor Details", html, re.IGNORECASE))
out = []
for m in matches:
    start = max(0, m.start() - 150)
    end = min(len(html), m.end() + 250)
    out.append(html[start:end])
    out.append("="*60)

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\scratch\tutor_details_in_index.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("Found", len(matches), "matches.")
