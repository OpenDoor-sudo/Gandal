import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

idx = content.find("function connectWebSocket")
if idx != -1:
    print(content[idx:idx+4500])
else:
    print("connectWebSocket not found.")
