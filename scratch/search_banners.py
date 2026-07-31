with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find elements that might be warning banners or alert boxes
pattern = r"<div[^>]*class=\"[^\"]*(?:alert|warning|banner|popup|toast)[^\"]*\"[^>]*>.*?</div[^>]*>"
for m in re.finditer(r"<div[^>]*>", content):
    tag = m.group(0)
    if any(k in tag.lower() for k in ["alert", "warning", "banner", "popup", "sentry"]):
        print(f"Tag at offset {m.start()}: {tag}")
