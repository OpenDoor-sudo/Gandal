import os

# 1. Update display_client.py to respond to RAISE_HAND text input over WebSocket
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

socratic_chat_func = """def generate_socratic_chat_response(question, video_id):
    q_lower = (question or "").lower()
    v_lower = (video_id or "").lower()
    if "sanitaire" in v_lower or "sanitaire" in q_lower or "santé" in q_lower or "maladie" in q_lower or "ebola" in q_lower:
        return "Excellente question. Concernant les problèmes sanitaires, la prévalence des maladies endémiques (comme le paludisme, le choléra et le VIH) impacte directement l'espérance de vie et la productivité du travail. Quels facteurs d'infrastructure de santé ou d'eau potable pensez-vous être prioritaires ?"
    elif "alimentaire" in v_lower or "alimentaire" in q_lower or "faim" in q_lower or "nutrition" in q_lower or "fao" in q_lower:
        return "C'est un point essentiel. Les problèmes alimentaires et la sous-alimentation limitent le développement humain. Des organisations internationales comme la FAO, le FIDA et le PAM agissent pour soutenir l'agriculture locale et la sécurité alimentaire."
    elif "demographique" in v_lower or "population" in q_lower or "malthus" in q_lower or "natalité" in q_lower:
        return "Très bonne observation. Selon la théorie malthusienne, lorsque la population s'accroît à un rythme géométrique alors que la nourriture n'augmente qu'à un rythme arithmétique, la pauvreté s'aggrave si l'économie ne s'adapte pas."
    elif "chem" in v_lower or "chimie" in q_lower or "alkylammonium" in q_lower or "amine" in q_lower:
        return "En chimie organique, les cations d'alkylammonium (R-NH3+) se comportent comme des acides faibles en cédant un proton H+ à l'eau, formant l'amine R-NH2 et des ions hydronium H3O+ à l'équilibre."
    else:
        return f"C'est une excellente question sur '{question}'. En analysant cette leçon, quel élément clé selon vous explique ce phénomène ?"
"""

if "def generate_socratic_chat_response" not in py_txt:
    insert_pos = py_txt.find("def translate_flashcards")
    if insert_pos != -1:
        py_txt = py_txt[:insert_pos] + socratic_chat_func + "\n\n" + py_txt[insert_pos:]

old_raise_hand_block = """                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    try:
                        sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                        print("[WS -> UDP] Forwarded RAISE_HAND packet to orchestrator port 8002")
                    except Exception as e:
                        print(f"[WS -> UDP ERROR] Failed to forward: {e}")
                    finally:
                        sock.close()"""

new_raise_hand_block = """                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    try:
                        sock.sendto(json.dumps(udp_payload).encode('utf-8'), ("127.0.0.1", 8002))
                        print("[WS -> UDP] Forwarded RAISE_HAND packet to orchestrator port 8002")
                    except Exception as e:
                        print(f"[WS -> UDP ERROR] Failed to forward: {e}")
                    finally:
                        sock.close()

                    # Direct WebSocket Chat Response for Text Mode
                    q_text = data.get("question", "")
                    v_id = data.get("video_id", "vid_economics_01")
                    chat_ans = generate_socratic_chat_response(q_text, v_id)
                    reply_payload = {
                        "action": "CHAT_RESPONSE",
                        "role": "assistant",
                        "text": chat_ans,
                        "sender": "GANDHO (Français)"
                    }
                    await broadcast(json.dumps(reply_payload))"""

if old_raise_hand_block in py_txt:
    py_txt = py_txt.replace(old_raise_hand_block, new_raise_hand_block)

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py for Socratic text chat responses!")

# 2. Update index.html to handle CHAT_RESPONSE and save chat history per video_id
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Update WebSocket message handler in index.html to receive CHAT_RESPONSE
old_ws_handle = """          if (data.action === "PAUSE_VIDEO") {"""
new_ws_handle = """          if (data.action === "CHAT_RESPONSE") {
            appendChatMessage("TUTOR", data.text);
          }
          if (data.action === "PAUSE_VIDEO") {"""

if old_ws_handle in txt:
    txt = txt.replace(old_ws_handle, new_ws_handle)

# Update appendChatMessage to save per activeVideoId
old_append_chat = """        const savedChat = localStorage.getItem(
          "chatHistory_" + selectedGoalTrack,
        );"""

new_append_chat = """        const currentVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID || "vid_economics_01";
        localStorage.setItem("chatHistory_" + currentVid, box.innerHTML);"""

txt = txt.replace("""localStorage.setItem(
          "chatHistory_" + selectedGoalTrack,
          box.innerHTML,
        );""", new_append_chat)

txt = txt.replace("""localStorage.setItem(
          "chatHistory_" + currentTrack,
          box.innerHTML,
        );""", new_append_chat)

# Update loadTextbookPDF in index.html to restore chat per activeVideoId
old_chat_restore = """                const savedChat = localStorage.getItem(
                  "chatHistory_" + resolvedTrack,
                );"""

new_chat_restore = """                const savedChat = localStorage.getItem(
                  "chatHistory_" + data.video_id,
                );"""

if old_chat_restore in txt:
    txt = txt.replace(old_chat_restore, new_chat_restore)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated index.html for per-video chat history persistence!")
