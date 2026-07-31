with open("orchestrator.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'locale' in line.lower():
        print(f"Line {i+1}: {repr(line.strip())}")
