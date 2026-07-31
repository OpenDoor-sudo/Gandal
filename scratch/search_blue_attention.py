with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find any styling or markup matching "blue", "attention", "warning" or "sentry"
print("=== Searching for style/class mentions of blue or attention ===")
lines = content.split('\n')
for i, line in enumerate(lines):
    if any(k in line.lower() for k in ["blue", "attention", "sentry", "warning", "alert"]):
        if "svg" not in line.lower() and "style" not in line.lower():
            print(f"Line {i+1}: {line.strip()}")
