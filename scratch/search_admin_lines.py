with open("admin.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'teacherPhone' in line or 'teacherCountry' in line or 'Country' in line or 'code' in line:
        if any(keyword in line for keyword in ['Phone', 'Country', 'select', 'dropdown', 'list', 'show', 'hide']):
            print(f"Line {i+1}: {repr(line.strip())}")
