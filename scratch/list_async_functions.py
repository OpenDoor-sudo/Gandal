import re

with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\orchestrator.py", "r", encoding="utf-8") as f:
    code = f.read()

matches = re.findall(r"async def \w+\([^)]*\)", code)
for m in matches:
    print(m)
