with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function handleAgentSpeechFinished" in line:
        print(f"Line {i+1}: {line.strip()}")
        start = max(0, i - 2)
        end = min(len(lines), i + 10)
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        break
