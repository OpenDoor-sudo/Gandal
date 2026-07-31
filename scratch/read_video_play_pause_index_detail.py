with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(5300, min(5380, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
