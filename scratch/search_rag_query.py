with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function triggerRAGQuery" in line:
        print(f"Found triggerRAGQuery at line {i+1}:")
        start = max(0, i - 5)
        end = min(len(lines), i + 40)
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        break
