import os

# 1. Update orchestrator.py to provide grounded, lesson-specific socratic hints without static UN/global economy fallback
orch_path = 'orchestrator.py'
orch_txt = open(orch_path, 'r', encoding='utf-8').read()

old_orch_hint = """def generate_socratic_hint(query, match_text, locale="en_US"):
    query_lower = query.lower()
    
    if locale == "fr_FR":
        # Check if the query is about economics, growth, UN, or development
        if any(word in query_lower for word in ["croissance", "économie", "economie", "onu", "onusienne", "porteur", "développement", "unies", "fao", "faim", "organisation"]):
            return (
                "CONCEPTS DE CROISSANCE ÉCONOMIQUE :\n"
                "  Indicateurs clés :\n"
                "    - PIB (Produit Intérieur Brut) : Mesure quantitative de la production.\n"
                "    - IDH (Indice de Développement Humain) : Mesure qualitative incluant l'éducation et la santé.\n\n"
                "  Acteurs Majeurs :\n"
                "    - L'ONU et ses organisations onusiennes : Régulation, coordination et développement durable.\n\n"
                "  Enquête Socratique à considérer :\n"
                "    - Comment un simple indicateur de production comme le PIB peut-il négliger le rôle social des institutions ?\n"
                "    - Pourquoi qualifie-t-on certaines initiatives de l'ONU de véritables 'porteurs de croissance' durables ?"
            )"""

new_orch_hint = """def generate_socratic_hint(query, match_text, locale="en_US", video_id=None):
    query_lower = query.lower()
    v_lower = (video_id or "").lower()
    
    if locale == "fr_FR":
        if "sanitaire" in v_lower or any(w in query_lower for w in ["sanitaire", "santé", "sante", "maladie", "covid", "ebola", "virus", "hôpital"]):
            return (
                "LES PROBLÈMES SANITAIRES ET DÉVELOPPEMENT :\n"
                "  Indicateurs sanitaires :\n"
                "    - Espérance de vie et mortalité maternelle/infantile.\n"
                "    - Prévalence des maladies endémiques et épidémiques (paludisme, choléra, VIH, COVID-19).\n\n"
                "  Impact Économique :\n"
                "    - Un choc sanitaire détruit la productivité du travail et surcharge le budget des ménages.\n\n"
                "  Enquête Socratique :\n"
                "    - En quoi l'amélioration des infrastructures de santé et de l'eau potable constitue-t-elle un levier de croissance ?"
            )
        elif "alimentaire" in v_lower or any(w in query_lower for w in ["alimentaire", "faim", "nutrition", "fao", "pam", "fida"]):
            return (
                "LES PROBLÈMES ALIMENTAIRES ET SÉCURITÉ ALIMENTAIRE :\n"
                "  Organisations Clés :\n"
                "    - FAO, FIDA et PAM pour l'aide d'urgence et le développement agricole.\n\n"
                "  Enquête Socratique :\n"
                "    - Comment la sous-alimentation affecte-t-elle le capital humain et la capacité de production à long terme ?"
            )
        elif any(word in query_lower for word in ["croissance", "économie", "economie", "développement", "démographique", "malthus", "natalité"]):
            return (
                "LES PROBLÈMES DÉMOGRAPHIQUES ET ÉCONOMIE :\n"
                "  Analyse Démographique :\n"
                "    - Forte natalité, baisse de la mortalité et pression démographique.\n"
                "    - Théorie malthusienne sur le décalage entre croissance de la population et subsistances.\n\n"
                "  Enquête Socratique :\n"
                "    - Comment l'accroissement rapide de la population influence-t-il le niveau de vie dans les pays en développement ?"
            )"""

if old_orch_hint in orch_txt:
    orch_txt = orch_txt.replace(old_orch_hint, new_orch_hint)
    print("Successfully updated generate_socratic_hint in orchestrator.py!")
else:
    print("WARNING: Could not find exact old_orch_hint in orchestrator.py!")

open(orch_path, 'w', encoding='utf-8').write(orch_txt)

# 2. Update display_client.py to suppress duplicate instant fallback messages when UDP orchestrator handles the query
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_dc_chat = """                    # Direct WebSocket Chat Response for Text Mode
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

new_dc_chat = """                    # UDP Orchestrator handles intelligent RAG response & broadcasting to avoid double replies
                    pass"""

if old_dc_chat in py_txt:
    py_txt = py_txt.replace(old_dc_chat, new_dc_chat)
    print("Successfully removed duplicate fallback broadcast in display_client.py!")

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Applied all fixes to orchestrator.py and display_client.py!")
