import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "profile" or "locale" or "language" options in index.html
print("Searching for language/locale/profile in index.html:")
# Let's find any list of languages, e.g. dropdowns, buttons, list items, etc.
# Find any options or options arrays
for match in re.finditer(r'(?:lang|locale|translate|profile)', content, re.IGNORECASE):
    start = max(0, match.start() - 60)
    end = min(len(content), match.end() + 60)
    snippet = content[start:end].replace('\n', ' ').strip()
    if 'option' in snippet or 'select' in snippet or 'card' in snippet or 'profile' in snippet:
         print(f"Match: ...{snippet}...")
