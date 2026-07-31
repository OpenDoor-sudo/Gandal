with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

import re

# Let's search for keywords related to tab clicking, tab container, default tabs, etc.
tab_matches = [m.start() for m in re.finditer(r"tab", content, re.IGNORECASE)]
print(f"Found {len(tab_matches)} occurrences of 'tab'.")

# Let's search for functions related to tabs
funcs = re.findall(r"function\s+[a-zA-Z0-9_]*Tab[a-zA-Z0-9_]*", content)
print("Tab functions found:", funcs)

# Let's find functions like switchTab or selectTab
switch_matches = re.findall(r"function\s+\w*(?:switch|select|show|active)\w*Tab\w*", content, re.IGNORECASE)
print("Switch tab functions:", switch_matches)
