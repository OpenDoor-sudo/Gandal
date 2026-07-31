with open("orchestrator.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'language_localization' in line:
        print(f"Line {i+1}: {repr(line.strip())}")
