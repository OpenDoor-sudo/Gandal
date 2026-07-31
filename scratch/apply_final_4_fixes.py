import os, re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update renderKaTeXText helper in index.html for inline math in Summary
katex_helper = """      function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        return text.replace(/\\\\\\\((.*?)\\\\\\\)|\\\\\\\[(.*?)\\\\\\]|\\\\\\\((.*?)\\\\\\\)/g, (match, m1, m2, m3) => {
          try {
            const math = m1 || m2 || m3 || match;
            return window.katex.renderToString(math, { displayMode: false, throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      }"""

if "function renderKaTeXText" in txt:
    start_k = txt.find("function renderKaTeXText")
    end_k = txt.find("function renderVideoSummary", start_k)
    if start_k != -1 and end_k != -1:
        txt = txt[:start_k] + katex_helper + "\n\n" + txt[end_k:]
else:
    start_v = txt.find("function renderVideoSummary")
    if start_v != -1:
        txt = txt[:start_v] + katex_helper + "\n\n      " + txt[start_v:]

# 2. Update renderKnowledgeCoreGrid: Remove duplicate header, sort active card to top, single badge
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

        // Sort so the currently active playing video is ALWAYS at the top!
        selectedList.sort((a, b) => {
          const aCurrent = isCardCurrent(a);
          const bCurrent = isCardCurrent(b);
          if (aCurrent && !bCurrent) return -1;
          if (!aCurrent && bCurrent) return 1;
          return 0;
        });

        const cardsContainer = document.createElement("div");
        cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px; margin-top: 10px;";

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

# 3. Update getQuizTrackKey to check activeVideoId FIRST for chemistry
new_quiz_key_func = """      function getQuizTrackKey() {
        const vid = (activeVideoId || "").toLowerCase();
        const track = (selectedGoalTrack || "").toLowerCase();

        if (vid.includes("chem") || vid.includes("chemistry") || track.includes("chemistry")) {
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

# 4. Explicitly invoke renderVideoSummary, renderQuizQuestions, and renderKnowledgeCoreGrid at the end of loadTextbookPDF
old_pdf_end = """            if (data.flashcards && data.flashcards.length > 0) {
              let category = selectedGoalTrack;
              FLASHCARDS_DECKS[category] = data.flashcards;
              renderFlashcardsDeck(category);
            }
          }"""

new_pdf_end = """            if (data.flashcards && data.flashcards.length > 0) {
              let category = selectedGoalTrack;
              FLASHCARDS_DECKS[category] = data.flashcards;
              renderFlashcardsDeck(category);
            }
            renderVideoSummary(data.video_id);
            renderQuizQuestions();
            renderKnowledgeCoreGrid();
          }"""

txt = txt.replace(old_pdf_end, new_pdf_end)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied all final user fixes to index.html!")
