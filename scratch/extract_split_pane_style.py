import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's search for .whiteboard-split-pane in stylesheet
# Let's find matches and print the full block
import re
pattern = r"\.whiteboard-split-pane\s*\{[^}]*\}"
for m in re.finditer(pattern, content):
    print(m.group(0))

pattern2 = r"\.whiteboard-split-pane\.active\s*\{[^}]*\}"
for m in re.finditer(pattern2, content):
    print(m.group(0))
