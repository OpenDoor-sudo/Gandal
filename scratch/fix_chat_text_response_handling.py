import os

# 1. Update display_client.py RAISE_HAND chat response payload
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_py_reply = """                    reply_payload = {
                        "action": "CHAT_RESPONSE",
                        "role": "assistant",
                        "text": chat_ans,
                        "sender": "GANDHO (Français)"
                    }
                    await broadcast(json.dumps(reply_payload))"""

new_py_reply = """                    reply_payload = {
                        "action": "CHAT_RESPONSE",
                        "role": "assistant",
                        "text": chat_ans,
                        "sender": "GANDHO (Français)",
                        "a2ui_payload": {
                            "action": "CHAT_RESPONSE",
                            "role": "assistant",
                            "text": chat_ans,
                            "sender": "GANDHO (Français)"
                        }
                    }
                    await broadcast(json.dumps(reply_payload))"""

if old_py_reply in py_txt:
    py_txt = py_txt.replace(old_py_reply, new_py_reply)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully updated display_client.py CHAT_RESPONSE payload!")

# 2. Update index.html wsConnection.onmessage handler to process CHAT_RESPONSE
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_ws_msg_start = """        wsConnection.onmessage = function (evt) {
          console.log("Received data: " + evt.data);
          try {
            const payload = JSON.parse(evt.data);"""

new_ws_msg_start = """        wsConnection.onmessage = function (evt) {
          console.log("Received data: " + evt.data);
          try {
            const payload = JSON.parse(evt.data);
            if (!payload) return;

            if (payload.action === "CHAT_RESPONSE" || (payload.a2ui_payload && payload.a2ui_payload.action === "CHAT_RESPONSE")) {
              const text = payload.text || (payload.a2ui_payload && payload.a2ui_payload.text);
              if (text) {
                appendChatMessage("TUTOR", text);
                showToastNotification("Tutor Response", "GANDHO replied in Chat!");
              }
              return;
            }"""

if old_ws_msg_start in txt:
    txt = txt.replace(old_ws_msg_start, new_ws_msg_start)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully updated index.html wsConnection.onmessage handler for text chat responses!")
