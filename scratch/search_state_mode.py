import re

with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "state_mode" in line or "stateMode" in line or "A" in line and "B" in line and "C" in line and "split" in line:
        if any(keyword in line for keyword in ["state", "Mode", "Layout", "whiteboard", "canvas", "split"]):
            print(f"Line {i+1}: {line.strip()}")
