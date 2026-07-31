with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\orchestrator.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = list(re.finditer(r"async def ws_|async def handler|def on_message|async def on_message|websocket\.recv|websockets\.serve|async for message in", code))
for m in matches:
    start_line = code.count("\n", 0, m.start()) + 1
    print(f"Match '{m.group()}' on line: {start_line}")
