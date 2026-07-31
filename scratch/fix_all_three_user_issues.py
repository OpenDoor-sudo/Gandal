import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update switchSidebarTab to trigger renderVideoSummary on timestamps (SOMMAIRE) selection
old_switch_tab = """        } else if (tabName === "evaluation") {"""

new_switch_tab = """        } else if (tabName === "timestamps") {
          renderVideoSummary(activeVideoId);
        } else if (tabName === "evaluation") {"""

txt = txt.replace(old_switch_tab, new_switch_tab)

# 2. Update getQuizTrackKey to map exact video IDs to quiz datasets
old_quiz_key_func = """      function getQuizTrackKey() {
        const track = selectedGoalTrack;
        if (
          activeVideoId === "vid_economics_01" ||
          track.toLowerCase().includes("economics") ||
          track.toLowerCase().includes("extraeconomiques")
        ) {
          return "Economics";
        }
        if (track.toLowerCase().includes("calculus")) {
          return "calculus";
        }
        if (track.toLowerCase().includes("chemistry")) {
          return "Chemistry";
        }
        return "College";
      }"""

new_quiz_key_func = """      function getQuizTrackKey() {
        const vid = activeVideoId || "";
        if (vid.includes("demographique") || vid === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques") {
          return "Demographics";
        }
        if (vid.includes("sanitaire") || vid === "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires") {
          return "Sanitaire";
        }
        if (vid.includes("alimentaire") || vid === "vid_economics_extraeconomiques_03_probl_mes_alimentaires") {
          return "Economics";
        }
        if (vid.includes("chemistry") || vid === "vid_chemistry_organic_chemistry_chemistry") {
          return "Chemistry";
        }
        return "Demographics";
      }"""

txt = txt.replace(old_quiz_key_func, new_quiz_key_func)

# 3. Add Demographics dataset to QUIZ_QUESTIONS in index.html
demographics_dataset = """        Demographics: {
          main: [
            {
              id: 1,
              question: "Selon la leçon, qu'est-ce que l'explosion démographique dans les pays en développement ?",
              options: {
                A: "Une augmentation rapide de la population due à un fort taux de natalité et une baisse de la mortalité.",
                B: "Un déclin progressif et continu de la population active.",
                C: "Une hausse soudaine et inexpliquée du taux de mortalité infantile.",
                D: "Une migration massive des populations urbaines vers les zones rurales."
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Parmi les facteurs suivants, lequel contribue directement à la hausse de la natalité dans ces pays ?",
              options: {
                A: "Le mariage précoce, l'analphabétisme et le poids des traditions.",
                B: "L'accès universel aux méthodes de contraception moderne.",
                C: "L'industrialisation poussée et l'élévation du niveau de vie.",
                D: "La disparition de la polygamie dans les zones rurales."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Quel médecin est cité par le professeur pour avoir introduit la méthode de la césarienne afin de limiter la mortalité maternelle ?",
              options: {
                A: "Docteur César",
                B: "Docteur Malthus",
                C: "Docteur Pasteur",
                D: "Docteur Fleming"
              },
              correct: "A"
            },
            {
              id: 4,
              question: "Selon l'analyse démographique présentée dans le cours, quel est le lien entre pauvreté et fécondité ?",
              options: {
                A: "La pauvreté peut encourager l'augmentation des naissances.",
                B: "La pauvreté annule automatiquement toute naissance.",
                C: "Le niveau de vie n'a aucun impact sur la fécondité.",
                D: "La richesse matérielle entraîne une fécondité illimitée."
              },
              correct: "A"
            },
            {
              id: 5,
              question: "Quelle maladie de masse est citée par le professeur comme ayant été freinée grâce aux progrès de la biologie et de la médecine ?",
              options: {
                A: "La tuberculose",
                B: "Le choléra",
                C: "La grippe espagnole",
                D: "Le tétanos"
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quel est l'un des principaux facteurs médicaux de la baisse de la mortalité maternelle après la Seconde Guerre mondiale ?",
              options: {
                A: "La généralisation des césariennes par le Docteur César",
                B: "L'invention du vaccin contre la grippe",
                C: "La hausse des mariages tardifs",
                D: "La réduction de l'agriculture de subsistance"
              },
              correct: "A"
            }
          ]
        },"""

txt = txt.replace("const QUIZ_QUESTIONS = {", "const QUIZ_QUESTIONS = {\n" + demographics_dataset)

# 4. Redesign renderKnowledgeCoreGrid for spacious, elegant, non-clustered layout
new_render_grid = """function renderKnowledgeCoreGrid() {
        const grid = document.getElementById("knowledgeCoreGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const subjectVideoMap = {
          "k12/12th_SM/Economics": {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "01_Les problèmes démographiques",
            grade: "A",
            time: "15m / 20h",
          },
          "k12/12th_SM/chemistry": {
            id: "vid_chemistry_organic_chemistry_chemistry",
            title: "chem",
            grade: "A-",
            time: "15m / 15h",
          },
        };

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "fr_FR";
        const isFr = activeLoc.startsWith("fr");

        const selectedList = window.ACTIVE_DATABASE_INTERESTS
          ? window.ACTIVE_DATABASE_INTERESTS.split(",").map((s) => s.trim())
          : [selectedGoalTrack];

        // Header element above grid
        const sectionHeader = document.createElement("div");
        sectionHeader.style.cssText = "margin-top: 24px; margin-bottom: 14px; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; font-weight: 700; display: flex; justify-content: space-between; align-items: center;";
        sectionHeader.innerHTML = `<span>${isFr ? "Grille d'apprentissage de base" : "Core Learning Grid"}</span><span style="font-size:0.7rem; color:#71717a; font-weight:500;">${isFr ? "CLIQUEZ SUR UNE CARTE POUR SYNCHRONISER LE PDF" : "CLICK CARD TO SYNC PDF"}</span>`;
        grid.appendChild(sectionHeader);

        const cardsContainer = document.createElement("div");
        cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px;";

        selectedList.forEach((trackKey) => {
          const itemData = subjectVideoMap[trackKey] || {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "Lesson",
            grade: "B+",
            time: "10m / 10h",
          };

          const isCurrent = (trackKey === selectedGoalTrack) || (itemData.id === activeVideoId);
          const card = document.createElement("div");
          card.style.cssText = `position: relative; background: #141418; border: 1px solid ${isCurrent ? '#a855f7' : '#27272a'}; border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.2s ease; ${isCurrent ? 'box-shadow: 0 0 16px rgba(168,85,247,0.15);' : ''}`;

          card.innerHTML = `
            ${isCurrent ? `<div style="display:inline-block; background: #a855f7; color: #ffffff; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 6px; margin-bottom: 12px; text-transform: uppercase;">${isFr ? "ÉTUDIE ACTUELLEMENT" : "CURRENTLY STUDYING"}</div>` : ""}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-weight:700; color:#ffffff; font-size:0.95rem;">${itemData.title}</span>
              <span style="background:rgba(168,85,247,0.2); color:#c084fc; padding:3px 10px; border-radius:6px; font-weight:700; font-size:0.75rem;">${itemData.grade}</span>
            </div>
            <div style="height:5px; background:#27272a; border-radius:3px; overflow:hidden; margin-bottom:14px;">
              <div style="width:25%; height:100%; background:#a855f7;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#a1a1aa;">
              <span>${itemData.time}</span>
              <span style="color:#c084fc; font-weight:700;">${isCurrent ? (isFr ? "EXPORTER EN PDF" : "EXPORT TO PDF") : (isFr ? "PASSAGE À LA LEÇON" : "SWITCH TO LESSON")}</span>
            </div>
          `;

          card.onclick = () => {
            selectedGoalTrack = trackKey;
            window.currentTrack = trackKey;
            loadTextbookPDF(itemData.id);
            renderKnowledgeCoreGrid();
          };

          cardsContainer.appendChild(card);
        });

        grid.appendChild(cardsContainer);
      }"""

start_pos = txt.find("function renderKnowledgeCoreGrid() {")
end_pos = txt.find("function renderProfileInterests() {", start_pos)
if start_pos != -1 and end_pos != -1:
    txt = txt[:start_pos] + new_render_grid + "\n\n      " + txt[end_pos:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied fixes for Sommaire tab rendering, PROFIL spacing, and ÉVALUATION quiz data!")
