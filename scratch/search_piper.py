import os
import re

directory = r"c:\Users\lalyb\Desktop\ventuno_ai_testbed"
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".py", ".html", ".js")) and "conflict" not in file:
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                matches = list(re.finditer(r"piper", content, re.IGNORECASE))
                if matches:
                    print(f"File: {file} - Count: {len(matches)}")
                    # print line numbers of matches
                    lines = content.splitlines()
                    for idx, line in enumerate(lines):
                        if "piper" in line.lower():
                            print(f"  Line {idx+1}: {line.strip()}")
            except Exception as e:
                pass
