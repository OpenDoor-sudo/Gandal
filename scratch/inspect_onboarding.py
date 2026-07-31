with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\onboarding.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "K-12" in line or "College Level" in line or "translate" in line or "chosenLocale" in line:
        print(f"Line {i+1}: {line.strip()}")
