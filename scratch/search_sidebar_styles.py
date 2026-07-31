with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("--- Scanning for interaction-sidebar / profile-expanded ---")
for i, line in enumerate(lines):
    if "interaction-sidebar" in line or "profile-expanded" in line:
        print(f"Line {i+1}: {line.strip()}")
