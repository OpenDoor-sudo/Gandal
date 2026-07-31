with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\onboarding.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
step_views = re.findall(r'<div[^>]*id="stepView\d"[^>]*>.*?</div>\s*</div>', html, re.DOTALL)
for sv in step_views:
    print(sv[:300] + "...\n")
