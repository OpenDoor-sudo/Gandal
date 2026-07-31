with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'updateClassroomLocale' in line:
        print(f"Line {i+1}: {repr(line.strip())}")
