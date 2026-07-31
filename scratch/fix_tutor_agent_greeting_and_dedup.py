import os

# 1. Update tutor_agent.py to include student name in LLM prompt instructions
agent_path = 'livekit_stack/agent/tutor_agent.py'
agent_txt = open(agent_path, 'r', encoding='utf-8').read()

old_fr_greeting = """                    greeting_instruction = (
                        f"Bonjour ! Présentez-vous en tant que GANDHO, le tuteur socratique. Souhaitez la bienvenue à l'étudiant "
                        f"pour la leçon vidéo active '{video_title}', et demandez quelles questions ils ont."
                    )"""

new_fr_greeting = """                    greeting_instruction = (
                        f"Bonjour ! Présentez-vous en tant que GANDHO, le tuteur socratique. Saluez impérativement l'étudiant par son prénom ('{student_name}') "
                        f"pour la leçon vidéo active '{video_title}', et demandez comment vous pouvez l'aider aujourd'hui."
                    )"""

if old_fr_greeting in agent_txt:
    agent_txt = agent_txt.replace(old_fr_greeting, new_fr_greeting)
    print("Successfully updated tutor_agent.py greeting instruction to include student_name!")

open(agent_path, 'w', encoding='utf-8').write(agent_txt)

# 2. Update display_client.py WebSocket RAISE_HAND logic to eliminate duplicate fallback responses
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_ws_reply = """                    # Direct WebSocket Chat Response for Text Mode
                    q_text = data.get("question", "")
                    v_id = data.get("video_id", "vid_economics_01")
                    chat_ans = generate_socratic_chat_response(q_text, v_id)
                    reply_payload = {
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

new_ws_reply = """                    # Direct WebSocket Chat Response for Text Mode
                    q_text = data.get("question", "")
                    v_id = data.get("video_id", "vid_economics_01")
                    mode = data.get("mode")
                    # Send direct response only for text input mode to avoid duplication with live UDP agent voice audio
                    if mode in ["chat_typed", "text_typed", "chat"]:
                        chat_ans = generate_socratic_chat_response(q_text, v_id)
                        reply_payload = {
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

if old_ws_reply in py_txt:
    py_txt = py_txt.replace(old_ws_reply, new_ws_reply)
    print("Successfully deduplicated chat responses in display_client.py!")

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Files updated cleanly!")
