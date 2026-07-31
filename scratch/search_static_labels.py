with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
labels = ["Calculus Graphing Engine", "Tangent Point", "Socratic Blackboard Canvas", "Capacitive Raise Hand Sensor", "Listening State"]
out = []
for label in labels:
    matches = list(re.finditer(re.escape(label), html, re.IGNORECASE))
    for m in matches:
        start = max(0, m.start() - 100)
        end = min(len(html), m.end() + 150)
        out.append(f"LABEL: {label}\n{html[start:end]}")
        out.append("="*60)

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\scratch\static_labels_in_index.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("Found static labels matches.")
