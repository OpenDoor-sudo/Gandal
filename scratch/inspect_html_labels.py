with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
patterns = [
    r"Calculus Graphing Engine",
    r"Tangent Point \(x₀\):",
    r"Function f\(x\):",
    r"Coordinates:",
    r"Socratic Blackboard Canvas",
    r"\[✖ Close Workspace\]",
    r"Capacitive Raise Hand Sensor",
    r"Listening State: Idle"
]

for p in patterns:
    matches = list(re.finditer(p, html))
    for m in matches:
        print(f"Match for: {p}")
        start = max(0, m.start() - 100)
        end = min(len(html), m.end() + 100)
        print(html[start:end])
        print("-" * 50)
