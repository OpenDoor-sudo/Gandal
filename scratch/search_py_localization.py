import glob
import re

for filepath in glob.glob("*.py"):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    matches = list(re.finditer(r'language_localization', content))
    if matches:
        print(f"File: {filepath}")
        for match in matches:
            start = max(0, match.start() - 50)
            end = min(len(content), match.end() + 50)
            snippet = content[start:end].replace('\n', ' ').strip()
            print(f"  ...{snippet}...")
