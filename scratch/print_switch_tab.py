with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function switchSidebarTab" in line:
        print(f"Found switchSidebarTab at line {i+1}:")
        start = max(0, i - 10)
        end = min(len(lines), i + 80)
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        break
