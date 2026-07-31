with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\display_client.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = list(re.finditer(r"def make_mock_wav", code))
for m in matches:
    start_line = code.count("\n", 0, m.start()) + 1
    print(f"Match on line: {start_line}")
    start = max(0, m.start() - 100)
    end = min(len(code), m.end() + 600)
    print(code[start:end])
    print("="*60)
