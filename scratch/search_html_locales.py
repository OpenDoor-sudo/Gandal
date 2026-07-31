import glob
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for filepath in glob.glob("*.html"):
    print(f"File: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # search for 'pt_PT' or 'ar_AE' in the file
    matches = list(re.finditer(r'(pt_PT|ar_AE)', content))
    if matches:
        print(f"  Found {len(matches)} occurrences of pt_PT or ar_AE:")
        for match in matches[:5]:
            start = max(0, match.start() - 30)
            end = min(len(content), match.end() + 30)
            snippet = content[start:end].replace('\n', ' ').strip()
            # print with clean characters or safe replacement
            print(f"    ...{repr(snippet)}...")
    else:
        print("  None found.")
