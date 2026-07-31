import re

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

patterns = [
    r"Calculus Graphing Engine",
    r"Tangent Point",
    r"Function f\(x\):",
    r"Coordinates:",
    r"Socratic Blackboard Canvas",
    r"Close Workspace",
    r"Capacitive Raise Hand Sensor",
    r"Listening State: Idle"
]

out = []
for p in patterns:
    matches = list(re.finditer(p, html))
    for m in matches:
        start = max(0, m.start() - 120)
        end = min(len(html), m.end() + 120)
        out.append(f"Pattern: {p}\n{html[start:end]}")
        out.append("-" * 50)

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\scratch\inspect_html_labels_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("Done writing safe output.")
