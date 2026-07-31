with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\orchestrator.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
m = re.search(r"def generate_socratic_hint", code)
if m:
    start_line = code.count("\n", 0, m.start()) + 1
    print("Found generate_socratic_hint on line:", start_line)
