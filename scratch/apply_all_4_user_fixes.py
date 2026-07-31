import os, re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update renderVideoSummary to parse inline KaTeX \(...\) and \[...\]
old_katex_render = """              ${summaryData.formulas.map(f => {"""

new_katex_render = """              ${summaryData.formulas.map(f => {
                let renderedEq = f.eq;
                if (window.katex && typeof window.katex.renderToString === "function") {
                  try {
                    renderedEq = window.katex.renderToString(f.eq, { displayMode: true, throwOnError: false });
                  } catch (e) {
                    console.warn("KaTeX render error:", e);
                  }
                }
                return `
                  <div style="margin-bottom: 10px; padding: 8px; background: #09090b; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #a1a1aa; margin-bottom: 4px; font-weight: 600;">${f.label}</div>
                    <div style="color: #ffffff; font-size: 0.95rem; overflow-x: auto;">${renderedEq}</div>
                  </div>
                `;
              }).join("")}"""

# Add renderKaTeXText helper inside renderVideoSummary
katex_helper = """        function renderKaTeXText(text) {
          if (!text) return "";
          if (!window.katex || typeof window.katex.renderToString !== "function") return text;
          return text.replace(/\\\\\[(.*?)\\\\\]|\\\\\((.*?)\\\\\)/g, (match, displayMath, inlineMath) => {
            try {
              const math = displayMath || inlineMath;
              return window.katex.renderToString(math, { displayMode: !!displayMath, throwOnError: false });
            } catch (e) {
              return match;
            }
          });
        }
"""

if "function renderKaTeXText" not in txt:
    start_summary = txt.find("function renderVideoSummary(videoId) {")
    if start_summary != -1:
        txt = txt[:start_summary] + katex_helper + "\n      " + txt[start_summary:]

# Update concepts and takeaways rendering to use renderKaTeXText
old_concepts_map = "${summaryData.concepts.map((c) => `<li>${c}</li>`).join(\"\")}"
new_concepts_map = "${summaryData.concepts.map((c) => `<li>${renderKaTeXText(c)}</li>`).join(\"\")}"
txt = txt.replace(old_concepts_map, new_concepts_map)

old_takeaways_map = "${summaryData.takeaways.map((t) => `<li>${t}</li>`).join(\"\")}"
new_takeaways_map = "${summaryData.takeaways.map((t) => `<li>${renderKaTeXText(t)}</li>`).join(\"\")}"
txt = txt.replace(old_takeaways_map, new_takeaways_map)

# 2. Update renderKnowledgeCoreGrid so the playing video is ALWAYS sorted to the top & ONLY 1 badge is displayed
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

        const isCardCurrent = (trackKey) => {
          const itemData = subjectVideoMap[trackKey];
          if (itemData && itemData.id === activeVideoId) return true;
          if (trackKey === selectedGoalTrack) return true;
          return false;
        };

        // Sort so the currently playing video is ALWAYS first!
        selectedList.sort((a, b) => {
          const aCurrent = isCardCurrent(a);
          const bCurrent = isCardCurrent(b);
          if (aCurrent && !bCurrent) return -1;
          if (!aCurrent && bCurrent) return 1;
          return 0;
        });

        const cardsContainer = document.createElement("div");
        cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px; margin-top: 14px;";

        selectedList.forEach((trackKey, index) => {
          const itemData = subjectVideoMap[trackKey] || {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "Lesson",
            grade: "B+",
            time: "10m / 10h",
          };

          // ONLY the top card (index === 0 and matching current active video) gets the ÉTUDIE ACTUELLEMENT badge!
          const isCurrent = (index === 0 && isCardCurrent(trackKey));

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

# 3. Update getQuizTrackKey for strict chemistry matching
new_quiz_key_func = """      function getQuizTrackKey() {
        const vid = (activeVideoId || "").toLowerCase();
        const track = (selectedGoalTrack || "").toLowerCase();

        if (vid.includes("chem") || track.includes("chem")) {
          return "Chemistry";
        }
        if (vid.includes("sanitaire") || track.includes("sanitaire")) {
          return "Sanitaire";
        }
        if (vid.includes("alimentaire") || track.includes("alimentaire")) {
          return "Economics";
        }
        if (vid.includes("demographique") || vid.includes("economics") || track.includes("economics")) {
          return "Demographics";
        }
        return "Demographics";
      }"""

old_quiz_key = txt.find("function getQuizTrackKey() {")
end_quiz_key = txt.find("function getActiveQuizQuestion() {", old_quiz_key)
if old_quiz_key != -1 and end_quiz_key != -1:
    txt = txt[:old_quiz_key] + new_quiz_key_func + "\n\n      " + txt[end_quiz_key:]

# 4. Update Chemistry MCQs dataset in QUIZ_QUESTIONS
chemistry_mcqs = """        Chemistry: {
          main: [
            {
              id: 1,
              question: "Quelle est la formule générale d'un cation d'alkylammonium en chimie organique ?",
              options: {
                A: "R-NH3+",
                B: "R-COOH",
                C: "R-OH",
                D: "R-NH2"
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Comment réagit une amine primaire en milieu acide aqueux pour former son cation d'alkylammonium ?",
              options: {
                A: "L'amine capte un proton H+ cédé par l'eau pour former l'ion alkylammonium R-NH3+.",
                B: "L'amine perd un électron par oxydation directe.",
                C: "L'amine se transforme spontanément en ester.",
                D: "L'amine précipite sous forme d'un produit neutre."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Dans l'équilibre R-NH3+ + H2O <-> R-NH2 + H3O+, quelle est la relation entre les concentrations des produits ?",
              options: {
                A: "[R-NH2] est rigoureusement égale à [H3O+].",
                B: "[R-NH2] est le double de [H3O+].",
                C: "[H3O+] est toujours nulle à l'équilibre.",
                D: "Les concentrations varient sans aucun rapport."
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quelle est l'expression de la constante d'acidité Ka associée au couple alkylammonium / amine ?",
              options: {
                A: "Ka = ([R-NH2] * [H3O+]) / [R-NH3+]",
                B: "Ka = [R-NH3+] / ([R-NH2] * [H3O+])",
                C: "Ka = [R-NH2] + [H3O+]",
                D: "Ka = [R-NH3+] * [H2O]"
              },
              correct: "A"
            }
          ]
        },"""

# Replace Chemistry entry in QUIZ_QUESTIONS
start_chem = txt.find("Chemistry: {")
if start_chem != -1:
    end_chem = txt.find("},", txt.find("alternative:", start_chem)) + 2
    txt = txt[:start_chem] + chemistry_mcqs + txt[end_chem:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied all 4 user fixes to index.html!")
