with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
idx = content.find(":root")
if idx != -1:
    print("=== CSS theme variables ===")
    print(content[idx:idx+800])
else:
    print(":root not found in stylesheet.")
