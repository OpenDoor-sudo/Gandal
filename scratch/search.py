import os
import re

directory = r"c:\Users\lalyb\Desktop\ventuno_ai_testbed"
keywords = ["socratic", "blackboard", "hint", "explain", "audio", "video", "restart", "play", "pause", "resume", "chosenLocale"]

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".py", ".html", ".js")) and "conflict" not in file:
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                for kw in keywords:
                    matches = list(re.finditer(re.escape(kw), content, re.IGNORECASE))
                    if matches:
                        print(f"File: {file} - Key: {kw} - Count: {len(matches)}")
            except Exception as e:
                print(f"Error reading {file}: {e}")
