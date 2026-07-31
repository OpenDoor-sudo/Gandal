with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(5320, min(5338, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
