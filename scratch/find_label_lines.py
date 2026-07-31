with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "Function f(x):" in line or "Coordinates:" in line or "Calculus Graphing Engine" in line or "Socratic Blackboard Canvas" in line:
        print(f"Line {idx+1}: {line.strip()}")
