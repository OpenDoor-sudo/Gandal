with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
idx = content.find("typeTextSync")
while idx != -1:
    print(f"=== typeTextSync match at offset {idx} ===")
    print(content[idx:idx+1500])
    idx = content.find("typeTextSync", idx+1)
