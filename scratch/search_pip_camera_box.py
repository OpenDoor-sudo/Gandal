with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
idx = content.find(".pip-camera-box")
if idx != -1:
    print("=== pip-camera-box CSS ===")
    print(content[idx:idx+800])
else:
    print("pip-camera-box class not found in stylesheet.")
