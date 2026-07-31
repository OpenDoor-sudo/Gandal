with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find all occurrences of classes or selectors containing sentry or alert or warning
matches = re.findall(r"\.[a-zA-Z0-9_-]*(?:sentry|alert|warning|toast)[a-zA-Z0-9_-]*\s*\{[^}]*\}", content, re.IGNORECASE)
for m in matches:
    print(m)
    print("-" * 30)
