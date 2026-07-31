with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function speakSocraticHint" in line:
        print(f"Found speakSocraticHint at line {i+1}:")
        start = max(0, i - 2)
        end = min(len(lines), i + 40)
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        break
