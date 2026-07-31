import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
# Find all occurrences of character card elements
search_terms = ["Dr. Sophia AI", "carouselName", "carouselRole", "profileCardName", "profileCardRole", "character-name", "character-role"]
for term in search_terms:
    print(f"=== Occurrences of '{term}' ===")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if term in line:
            print(f"Line {i+1}: {line.strip()}")
            # print surrounding 2 lines if possible
            start = max(0, i-2)
            end = min(len(lines), i+3)
            print("  Context:")
            for j in range(start, end):
                print(f"    {j+1}: {lines[j]}")
            print("-" * 30)
