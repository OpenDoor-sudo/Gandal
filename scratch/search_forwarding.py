with open("display_client.py", "r", encoding="utf-8") as f:
    client_content = f.read()

import re
print("--- Scanning display_client.py for UDP / socket / RAISE_HAND ---")
for i, line in enumerate(client_content.split("\n")):
    if any(keyword in line for keyword in ["8002", "UDP", "RAISE_HAND", "GPIO_INTERRUPT", "udp_sock"]):
        print(f"Line {i+1}: {line.strip()}")

with open("index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

print("\n--- Scanning index.html for RAISE_HAND / GPIO_INTERRUPT ---")
for i, line in enumerate(html_content.split("\n")):
    if "RAISE_HAND" in line or "GPIO_INTERRUPT" in line:
        print(f"Line {i+1}: {line.strip()}")
