import glob
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for filepath in glob.glob("*.html"):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "912345678" in content or "Phone Number" in content:
        print(f"File: {filepath}")
        # Search for instances
        for match in re.finditer(r'(?:912345678|Phone Number)', content):
            start = max(0, match.start() - 60)
            end = min(len(content), match.end() + 60)
            snippet = content[start:end].replace('\n', ' ').strip()
            print(f"  ...{repr(snippet)}...")
