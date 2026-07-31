import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update renderVideoSummary to handle Sanitaires, Alimentaires, Demographiques, Chemistry individually
old_render_summary = """        if (activeVideo.includes("demographique") || activeVideo.includes("economics") || activeVideo.includes("extraeconomiques")) {"""

new_render_summary = """        if (activeVideo.includes("sanitaire")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Sanitaires du Développement" : "Economics: Health & Sanitary Challenges in Development",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Une étude approfondie des <u>problèmes sanitaires</u> et de la santé publique dans les pays du sud. Le cours examine les grandes maladies de masse (paludisme, choléra, Ebola, COVID-19, MST/VIH) et l'impact de la sous-alimentation sur le développement économique et la productivité du travail."
              : "An in-depth study of <u>public health and sanitary challenges</u> in developing nations. Examines endemic diseases (malaria, cholera, Ebola, COVID-19, HIV), malnutrition, and their direct impact on labor productivity and economic growth.",
            formulas: [
              { label: isFrench ? "Indice de Santé Publique" : "Public Health Index", eq: "\\text{Espérance de Vie} = f(\\text{Accès aux Soins}, \\text{Nutrition}, \\text{Eau Potable})" },
              { label: isFrench ? "Impact Économique de la Maladie" : "Economic Impact of Disease", eq: "\\text{Perte de Productivité} = \\text{Taux d'Infection} \\times \\text{Heures de Travail Perdues}" }
            ],
            concepts: isFrench ? [
              "<u>Maladies de Masse</u> : Endémies graves (paludisme, choléra, VIH) entravant la santé des populations et le développement économique.",
              "<u>Sous-Alimentation & Nutrition</u> : Carence calorique globale réduisant la capacité de travail et la résistance immunitaire.",
              "<u>Infrastructures Sanitaires</u> : Manque d'hôpitaux, d'eau potable et de personnel médical qualifié dans les zones rurales."
            ] : [
              "<u>Mass Endemics</u> : Major infectious diseases constraining workforce capacity and economic output.",
              "<u>Malnutrition & Nutrition</u> : Caloric deficiencies diminishing physical productivity and immune resilience.",
              "<u>Sanitary Infrastructure</u> : Deficits in potable water, hospitals, and qualified medical staff in rural sectors."
            ],
            takeaways: isFrench ? [
              "La santé est le pilier fondamental du développement capital humain et de la productivité.",
              "Renforcer l'action de l'OMS et l'accès à l'eau potable pour éradiquer les épidémies.",
              "Investir dans la médecine préventive et l'hygiène publique."
            ] : [
              "Public health is the cornerstone of human capital and workforce productivity.",
              "Strengthen WHO initiatives and clean water access to eliminate mass endemics.",
              "Prioritize preventive healthcare infrastructure and public sanitation."
            ]
          };
        } else if (activeVideo.includes("alimentaire")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Alimentaires & Malnutrition" : "Economics: Food Security & Malnutrition",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Examen des <u>problèmes alimentaires</u> et de la sous-alimentation dans les pays en développement, avec une analyse des interventions de la FAO, du FIDA et du PAM pour garantir la sécurité alimentaire."
              : "Analysis of <u>food security and agricultural deficits</u> in developing nations, highlighting international interventions by FAO, IFAD, and WFP.",
            formulas: [
              { label: isFrench ? "Sécurité Alimentaire" : "Food Security Balance", eq: "\\text{Disponibilité Alimentaire} = \\text{Production Locale} + \\text{Importations} - \\text{Pertes}" }
            ],
            concepts: isFrench ? [
              "<u>Sous-Alimentation</u> : Apport calorique insuffisant pour maintenir une vie saine et active.",
              "<u>Organisations Internationales</u> : Rôle décisif de la FAO, du FIDA et du PAM dans le développement agricole et le secours d'urgence."
            ] : [
              "<u>Undernourishment</u> : Insufficient caloric intake to sustain healthy physical activity.",
              "<u>Global Relief Agencies</u> : Key roles of FAO, IFAD, and WFP in agricultural support and emergency aid."
            ],
            takeaways: isFrench ? [
              "Assurer la souveraineté alimentaire par la modernisation de l'agriculture de subsistance.",
              "Développer les réseaux de distribution d'aide alimentaire d'urgence."
            ] : [
              "Ensure food sovereignty through modernizing smallholder agriculture.",
              "Expand regional food distribution networks and emergency aid systems."
            ]
          };
        } else if (activeVideo.includes("demographique")) {"""

if old_render_summary in txt:
    txt = txt.replace(old_render_summary, new_render_summary)
    print("Successfully updated renderVideoSummary with individual subject data!")

# 2. Update toggleQuizView to hide workspace quiz overlay panels A & B when show is false
old_toggle_quiz = """      function toggleQuizView(show) {
        isQuizActive = show;
        const overlay = document.getElementById("quizOverlayContainer");
        if (overlay) {
          overlay.style.display = show ? "flex" : "none";
        }
      }"""

new_toggle_quiz = """      function toggleQuizView(show) {
        isQuizActive = show;
        const overlay = document.getElementById("quizOverlayContainer");
        if (overlay) {
          overlay.style.display = show ? "flex" : "none";
        }
        const workspaceSplit = document.getElementById("socraticWorkspacePane");
        if (workspaceSplit) {
          const sentryPanel = document.getElementById("sentryDeskPanel");
          if (sentryPanel) sentryPanel.style.display = show ? "flex" : "none";
        }
      }"""

if old_toggle_quiz in txt:
    txt = txt.replace(old_toggle_quiz, new_toggle_quiz)

# 3. Update loadTextbookPDF to execute full tab & progress sync on every video load
old_pdf_load_end = """              if (data.student_name) {
                window.ACTIVE_DATABASE_USER = data.student_name;
                activeStudentName = data.student_name;
                document
                  .querySelectorAll(".user-header-label")
                  .forEach((el) => {
                    el.innerText = activeStudentName;
                  });
              }"""

new_pdf_load_end = """              if (data.student_name) {
                window.ACTIVE_DATABASE_USER = data.student_name;
                activeStudentName = data.student_name;
                document
                  .querySelectorAll(".user-header-label")
                  .forEach((el) => {
                    el.innerText = activeStudentName;
                  });
              }

              // ONE-SHOT MASTER TAB & DATA SYNC ON VIDEO LOAD
              renderVideoSummary(data.video_id);
              toggleQuizView(false);
              selectedAnswers = {};
              isAlternativeQuizActive = false;
              renderQuizQuestions();
              loadProfileProgress();"""

if old_pdf_load_end in txt:
    txt = txt.replace(old_pdf_load_end, new_pdf_load_end)
    print("Successfully updated loadTextbookPDF with one-shot master sync!")

# 4. Update updateCourseCardsUI in index.html so active video card is moved to the TOP and receives ÉTUDIE ACTUELLEMENT
old_cards_ui = """            const isCurrentActive =
              activeVideoId === c.video_id ||
              (c.video_id === "vid_economics_01" && activeVideoId.includes("demographique"));"""

new_cards_ui = """            const isCurrentActive = (activeVideoId === c.video_id) || (activeVideoId && c.video_id && activeVideoId.replace('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', 'vid_economics_01') === c.video_id);"""

if old_cards_ui in txt:
    txt = txt.replace(old_cards_ui, new_cards_ui)
    print("Successfully updated course cards UI active matching!")

# Ensure cards are sorted so active video card is always at the top!
old_cards_sort = """          cardsData.forEach((c) => {"""
new_cards_sort = """          // Sort cards so active video card is at the top
          cardsData.sort((a, b) => {
            const aActive = (activeVideoId === a.video_id) || (activeVideoId && a.video_id && activeVideoId.replace('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', 'vid_economics_01') === a.video_id);
            const bActive = (activeVideoId === b.video_id) || (activeVideoId && b.video_id && activeVideoId.replace('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques', 'vid_economics_01') === b.video_id);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return 0;
          });

          cardsData.forEach((c) => {"""

if old_cards_sort in txt:
    txt = txt.replace(old_cards_sort, new_cards_sort)
    print("Successfully added sorting so active video card is always on top!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied master tab sync fixes to index.html!")
