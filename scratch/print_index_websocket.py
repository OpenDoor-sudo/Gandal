with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(3245, min(3310, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
