import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("onboarding.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'fr_FR' in line or 'pt_PT' in line or 'ar_AE' in line:
        print(f"Line {i+1}: {repr(line.strip())}")
