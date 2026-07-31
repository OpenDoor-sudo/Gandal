with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\orchestrator.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = list(re.finditer(r"SOCRATIC_HINT|SPAWN_CANVAS|explain|hint|whiteboard|blackboard", code, re.IGNORECASE))
out = []
for m in matches:
    start = max(0, m.start() - 150)
    end = min(len(code), m.end() + 250)
    out.append(code[start:end])
    out.append("="*60)

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\scratch\orchestrator_dialogue_search.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("Found", len(matches), "matches in orchestrator.py")
