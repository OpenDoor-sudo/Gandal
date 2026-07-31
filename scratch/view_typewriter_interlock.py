with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Let's search for "typeTextSync" and print 100 lines around it
for i, line in enumerate(lines):
    if "typeTextSync" in line:
        print(f"=== typeTextSync found at line {i+1} ===")
        start = max(0, i - 10)
        end = min(len(lines), i + 90)
        for j in range(start, end):
            print(f"{j+1}: {lines[j]}", end="")
        print("\n" + "="*50)
