import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update switchTab in index.html to close Quiz View (Panels A & B) when opening any non-evaluation tab
old_switch_tab = """        const panes = [
          "tutor",
          "chat",
          "flashcards",
          "timestamps",
          "profile",
          "evaluation",
        ];"""

new_switch_tab = """        // Automatically close evaluation split panel (Panels A & B) when switching to non-evaluation tabs
        if (tabName !== "evaluation") {
          if (typeof toggleQuizView === "function") {
            toggleQuizView(false);
          }
        }

        const panes = [
          "tutor",
          "chat",
          "flashcards",
          "timestamps",
          "profile",
          "evaluation",
        ];"""

if old_switch_tab in txt:
    txt = txt.replace(old_switch_tab, new_switch_tab)
    print("Successfully updated switchTab to auto-close evaluation panels on tab switch!")

# 2. Add Sanitaire section to QUIZ_QUESTIONS in index.html
old_quiz_dict = """            const QUIZ_QUESTIONS = {
        Demographics: {"""

new_quiz_dict = """            const QUIZ_QUESTIONS = {
        Sanitaire: {
          main: [
            {
              id: 1,
              question: "Quelles sont les principales maladies de masse qui pèsent sur la santé publique dans les pays du sud ?",
              options: {
                A: "Le paludisme, le choléra, la fièvre jaune et le VIH/SIDA.",
                B: "Les maladies cardiovasculaires avancées uniquement.",
                C: "La grippe aviaire et la myopie infantile.",
                D: "L'asthme allergique et les migraines chroniques."
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Quel est l'impact majeur du manque d'infrastructures sanitaires sur le développement économique ?",
              options: {
                A: "La baisse de la productivité du travail et l'alourdissement des dépenses de santé pour les ménages.",
                B: "L'augmentation spontanée du pouvoir d'achat des agriculteurs.",
                C: "L'arrêt complet de la croissance démographique rurale.",
                D: "La réduction du taux de chômage des jeunes diplômés."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Quelle mesure est indispensable pour améliorer la situation sanitaire dans les zones rurales en développement ?",
              options: {
                A: "L'accès à l'eau potable, la vaccination et le recrutement de personnel médical qualifié.",
                B: "La suppression complète de l'aide internationale.",
                C: "L'interdiction de toute construction de centres de santé régionaux.",
                D: "La privatisation exclusive des hôpitaux publics."
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quel facteur favorise la propagation des maladies endémiques dans les zones défavorisées ?",
              options: {
                A: "Le manque d'eau potable et l'insuffisance de l'assainissement.",
                B: "L'excès de personnel médical qualifié.",
                C: "La surabondance de médicaments gratuits.",
                D: "La modernisation rapide des hôpitaux."
              },
              correct: "A"
            }
          ]
        },
        Demographics: {"""

if old_quiz_dict in txt:
    txt = txt.replace(old_quiz_dict, new_quiz_dict)
    print("Successfully added Sanitaire practice questions to QUIZ_QUESTIONS!")

# 3. Dynamic subjectVideoMap in renderKnowledgeCoreGrid for Grille d'apprentissage de base
old_econ_card = """          "k12/12th_SM/Economics": {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "01_Les problèmes démographiques",
            grade: "A",
            time: "15m / 20h",
          },"""

new_econ_card = """          "k12/12th_SM/Economics": (() => {
            const vId = (typeof activeVideoId !== "undefined" ? activeVideoId : "").toLowerCase();
            if (vId.includes("sanitaire")) {
              return {
                id: "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires",
                title: "02_Les problèmes sanitaires",
                grade: "A",
                time: "12m / 20h"
              };
            } else if (vId.includes("alimentaire")) {
              return {
                id: "vid_economics_extraeconomiques_03_probl_mes_alimentaires",
                title: "03_Problèmes alimentaires",
                grade: "A",
                time: "10m / 20h"
              };
            }
            return {
              id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
              title: "01_Les problèmes démographiques",
              grade: "A",
              time: "15m / 20h"
            };
          })(),"""

if old_econ_card in txt:
    txt = txt.replace(old_econ_card, new_econ_card)
    print("Successfully made Grille d'apprentissage de base card dynamic!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Updated index.html with all fixes!")
