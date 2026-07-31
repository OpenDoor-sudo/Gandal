with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
idx = content.find('id="lockScreenOverlay"')
if idx != -1:
    print("=== lockScreenOverlay Markup ===")
    print(content[idx-100:idx+1200])
else:
    print("lockScreenOverlay not found.")
