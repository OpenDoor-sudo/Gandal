with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "Slope (m):" in line or "labelPopoverExp" in line:
        print(f"Line {idx+1}: {line.strip()}")
