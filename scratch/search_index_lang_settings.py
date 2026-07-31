import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Find any references to languages or locales or dropdowns or settings
print("Checking for language dropdowns/options:")
for match in re.finditer(r'(?:Language|Locale|Translate)', content, re.IGNORECASE):
    start = max(0, match.start() - 40)
    end = min(len(content), match.end() + 40)
    snippet = content[start:end].replace('\n', ' ').strip()
    print(f"Match: ...{snippet}...")
