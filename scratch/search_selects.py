import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find all <select> tags and print their content
select_blocks = re.findall(r'<select[^>]*>.*?</select>', content, re.DOTALL)
for i, block in enumerate(select_blocks):
    print(f"Select block {i}:")
    print(repr(block))
