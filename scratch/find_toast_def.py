import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

idx = content.find("function showToastNotification")
if idx != -1:
    print(content[idx:idx+1500])
else:
    print("showToastNotification not found")
