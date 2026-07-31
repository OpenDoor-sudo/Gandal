with open("display_client.py", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's search for websocket server logic
idx = content.find("class WebSocket")
if idx == -1:
    idx = content.find("websockets")
if idx != -1:
    print(content[idx-100:idx+2500])
