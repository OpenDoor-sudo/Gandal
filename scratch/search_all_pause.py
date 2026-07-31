import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

targets = ["PAUSE_VIDEO", "PLAY_VIDEO"]
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith(('.html', '.py', '.js', '.css')):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    for i, line in enumerate(file):
                        for target in targets:
                            if target in line:
                                print(f"File: {filepath}, Line: {i+1}, Target: {target}, Content: {line.strip()}")
            except Exception as e:
                pass
