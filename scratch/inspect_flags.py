with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\onboarding.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
flags = re.findall(r'<div[^>]*class="[^"]*flag[^"]*"[^>]*>.*?</div>|selectOnboardingLanguage\([^)]*\)', html, re.DOTALL)
for flag in flags[:15]:
    print(flag)
