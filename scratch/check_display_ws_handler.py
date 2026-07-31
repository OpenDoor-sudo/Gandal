with open("display_client.py", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's find ws_handler or similar websocket async handler
import re
idx = content.find("async def ")
while idx != -1:
    print(content[idx:idx+800])
    print("-" * 50)
    idx = content.find("async def ", idx+1)
