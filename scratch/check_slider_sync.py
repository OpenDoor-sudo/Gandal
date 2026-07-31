import re

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's search for updateTangentPoint function in javascript
idx = content.find("function updateTangentPoint")
if idx != -1:
    print("=== updateTangentPoint ===")
    print(content[idx:idx+1200])

idx2 = content.find("setupSimulationTwoWayBindings")
if idx2 != -1:
    print("=== setupSimulationTwoWayBindings ===")
    print(content[idx2:idx2+1200])
