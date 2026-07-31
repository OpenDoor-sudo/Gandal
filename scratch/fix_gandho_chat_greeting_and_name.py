import os

py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

# 1. Update generate_socratic_chat_response signature and logic in display_client.py
old_chat_gen = """def generate_socratic_chat_response(question, video_id):
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
        return f"C'est une excellente question sur '{question}'. En analysant cette leçon, quel élément clé selon vous explique ce phénomène ?" """

new_chat_gen = """def generate_socratic_chat_response(question, video_id, student_name=None, instructor_name=None):
    q_lower = (question or "").lower().strip()
    v_lower = (video_id or "").lower()
    
    # Retrieve student name from DB if not provided
    s_name = student_name
    if not s_name:
        try:
            conn = sqlite3.connect(VAULT_DB_PATH)
            cur = conn.cursor()
            cur.execute("SELECT user_id FROM user_profiles ORDER BY ROWID DESC LIMIT 1")
            r = cur.fetchone()
            conn.close()
            if r and r[0]:
                s_name = r[0]
        except Exception:
            pass
    if not s_name:
        s_name = "Alseny"

    t_name = instructor_name or "GANDHO"

    # Greetings check
    is_greeting = any(w in q_lower for w in ["bonjour", "salut", "hello", "hi", "coucou", "good morning", "good evening", "gandho"])

    if "sanitaire" in v_lower or "sanitaire" in q_lower or "santé" in q_lower or "maladie" in q_lower or "ebola" in q_lower:
        prefix = f"Bonjour {s_name} ! Je suis {t_name}. " if is_greeting else ""
        return f"{prefix}Concernant les problèmes sanitaires, la prévalence des maladies endémiques (comme le paludisme, le choléra et le VIH) impacte directement l'espérance de vie et la productivité du travail. Quels facteurs d'infrastructure de santé ou d'eau potable pensez-vous être prioritaires ?"
    elif "alimentaire" in v_lower or "alimentaire" in q_lower or "faim" in q_lower or "nutrition" in q_lower or "fao" in q_lower:
        prefix = f"Bonjour {s_name} ! Je suis {t_name}. " if is_greeting else ""
        return f"{prefix}Les problèmes alimentaires et la sous-alimentation limitent le développement humain. Des organisations internationales comme la FAO, le FIDA et le PAM agissent pour soutenir l'agriculture locale et la sécurité alimentaire. Comment puis-je vous aider sur ce sujet ?"
    elif "demographique" in v_lower or "population" in q_lower or "malthus" in q_lower or "natalité" in q_lower:
        prefix = f"Bonjour {s_name} ! Je suis {t_name}. " if is_greeting else ""
        return f"{prefix}Selon l'analyse démographique du cours (et la théorie malthusienne), lorsque la population s'accroît rapidement alors que la production alimentaire n'augmente que lentement, la pauvreté s'aggrave si l'économie ne s'adapte pas. Quelle question avez-vous sur cette leçon ?"
    elif "chem" in v_lower or "chimie" in q_lower or "alkylammonium" in q_lower or "amine" in q_lower:
        prefix = f"Bonjour {s_name} ! Je suis {t_name}. " if is_greeting else ""
        return f"{prefix}En chimie organique, les cations d'alkylammonium (R-NH3+) se comportent comme des acides faibles en cédant un proton H+ à l'eau, formant l'amine R-NH2 et des ions hydronium H3O+ à l'équilibre."
    elif is_greeting:
        lesson_title = "les problèmes démographiques"
        if "sanitaire" in v_lower:
            lesson_title = "les problèmes sanitaires"
        elif "alimentaire" in v_lower:
            lesson_title = "les problèmes alimentaires"
        elif "chem" in v_lower:
            lesson_title = "la chimie organique"
        return f"Bonjour {s_name} ! Je suis {t_name}, votre tuteur Socratic. Je suis ravi de vous retrouver pour ce cours sur {lesson_title}. Comment puis-je vous aider aujourd'hui dans votre apprentissage ?"
    else:
        return f"Bonjour {s_name} ! En analysant la leçon active sur les caractéristiques extra-économiques, quel élément clé selon vous explique ce phénomène ?" """

if old_chat_gen in py_txt:
    py_txt = py_txt.replace(old_chat_gen, new_chat_gen)
    print("Successfully updated generate_socratic_chat_response in display_client.py!")
else:
    print("WARNING: Could not find exact old_chat_gen block in display_client.py!")

# 2. Update WebSocket RAISE_HAND caller in display_client.py
old_call = """                    q_text = data.get("question", "")
                    v_id = data.get("video_id", "vid_economics_01")
                    chat_ans = generate_socratic_chat_response(q_text, v_id)"""

new_call = """                    q_text = data.get("question", "")
                    v_id = data.get("video_id", "vid_economics_01")
                    chat_ans = generate_socratic_chat_response(q_text, v_id)"""

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Saved display_client.py!")
