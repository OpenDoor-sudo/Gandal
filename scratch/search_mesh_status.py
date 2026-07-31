with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "meshStatusText" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print context
        start = max(0, i - 2)
        end = min(len(lines), i + 3)
        for j in range(start, end):
            print(f"  {j+1}: {lines[j]}", end="")
        print("-" * 40)
