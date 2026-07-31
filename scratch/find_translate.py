with open(r"c:\Users\lalyb\Desktop\ventuno_ai_testbed\display_client.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "api/translate" in line or "def translate" in line or "@app.route" in line or "class Translate" in line or "async def " in line:
        # print around the match
        start = max(0, i-5)
        end = min(len(lines), i+35)
        print(f"--- Line {i+1} ---")
        for idx in range(start, end):
            print(f"{idx+1}: {lines[idx].strip()}")
        print("------------------")
