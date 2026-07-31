import re
import sys

# Set standard output encoding to utf-8 if possible
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

print("Searching for locales in index.html:")
for match in re.finditer(r'(pt_PT|ar_AE|zh_CN|fr_FR|es_ES|en_US)', content):
    start = max(0, match.start() - 50)
    end = min(len(content), match.end() + 50)
    # Print safe string
    snippet = content[start:end].replace('\n', ' ').strip()
    print(f"Match found: ...{snippet}...")
