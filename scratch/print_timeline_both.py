with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(5327, min(5352, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
