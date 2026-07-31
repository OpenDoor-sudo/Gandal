with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
matches = list(re.finditer(r"function updatePopoverDetails", html))
if matches:
    start = matches[0].start()
    end = start + 2500
    print(html[start:end])
