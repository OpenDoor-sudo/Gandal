with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "recognition.onresult =" in line:
        print(f"Line {i+1}: {line.strip()}")
        start = max(0, i - 2)
        end = min(len(lines), i + 20)
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        break
