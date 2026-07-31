with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find definition of triggerWhiteboardOverlay
import re
match = re.search(r"function\s+triggerWhiteboardOverlay", content)
if match:
    start_pos = match.start()
    # print about 200 lines from there
    lines = content[start_pos:start_pos+6000].split("\n")
    for idx, line in enumerate(lines[:100]):
        print(f"{idx+1}: {line}")
else:
    print("Not found function triggerWhiteboardOverlay")
