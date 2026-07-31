with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "switchSidebarTab" in line and "function" not in line:
        print(f"Line {i+1}: {line.strip()}")
