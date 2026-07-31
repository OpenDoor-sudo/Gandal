import os, re

# 1. Update index.html
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Fix 1: Remove restrictive filtering in loadLibrary so all curriculum PDFs appear in Book Drawer
old_user_lessons_filter = """          // Filter lessons matching user's active interests
          const userLessons = lessons.filter((l) => {
            const track = getTrackFromPath(l.pdf_file_path);
            return selectedInterestsList.some((subPath) => {
              const pathLower = subPath.toLowerCase();
              if (pathLower === track.toLowerCase()) return true;
              if (
                l.pdf_file_path
                  .toLowerCase()
                  .replace(/\\\\/g, "/")
                  .includes(pathLower)
              )
                return true;
              return false;
            });
          });"""

new_user_lessons_filter = """          // All available curriculum & imported lessons
          const userLessons = lessons.filter((l) => l && l.pdf_file_path);"""

txt = txt.replace(old_user_lessons_filter, new_user_lessons_filter)

# Fix 2: Profile Cards Titles (Economics: 01_Les problèmes démographiques, Chemistry: chem)
old_grid_func = """function renderKnowledgeCoreGrid() {
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
        };"""

if "function renderKnowledgeCoreGrid" in txt:
    # Update existing renderKnowledgeCoreGrid
    start_grid = txt.find("function renderKnowledgeCoreGrid() {")
    end_grid = txt.find("function renderProfileInterests() {", start_grid)
    if start_grid != -1 and end_grid != -1:
        new_grid_code = """function renderKnowledgeCoreGrid() {
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

        selectedList.forEach((trackKey) => {
          const itemData = subjectVideoMap[trackKey] || {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "Lesson",
            grade: "B+",
            time: "10m / 10h",
          };

          const isCurrent = (trackKey === selectedGoalTrack) || (itemData.id === activeVideoId);
          const card = document.createElement("div");
          card.className = `knowledge-card ${isCurrent ? "active-studying" : ""}`;
          card.style.cursor = "pointer";

          card.innerHTML = `
            ${isCurrent ? `<div class="studying-badge">${isFr ? "ÉTUDIE ACTUELLEMENT" : "CURRENTLY STUDYING"}</div>` : ""}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:700; color:#ffffff; font-size:0.92rem;">${itemData.title}</span>
              <span style="background:rgba(168,85,247,0.2); color:#c084fc; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;">${itemData.grade}</span>
            </div>
            <div style="height:4px; background:#27272a; border-radius:2px; overflow:hidden; margin-bottom:12px;">
              <div style="width:25%; height:100%; background:#a855f7;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#a1a1aa;">
              <span>${itemData.time}</span>
              <span style="color:#c084fc; font-weight:600;">${isCurrent ? (isFr ? "EXPORTER EN PDF" : "EXPORT TO PDF") : (isFr ? "PASSAGE À LA LEÇON" : "SWITCH TO LESSON")}</span>
            </div>
          `;

          card.onclick = () => {
            selectedGoalTrack = trackKey;
            window.currentTrack = trackKey;
            loadTextbookPDF(itemData.id);
            renderKnowledgeCoreGrid();
          };

          grid.appendChild(card);
        });
      }

      """
        txt = txt[:start_grid] + new_grid_code + txt[end_grid:]

# Fix 3: Video Subject Overlay & Instructor Role dynamic update in loadTextbookPDF
old_video_sub = """            const subEl = document.getElementById("videoSubject");
            if (subEl) {
              if (activeTitle) {
                subEl.innerText = activeTitle.toUpperCase();
              } else {
                if (videoId === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques") {
                  subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
                } else if (videoId === "vid_calculus_01") {
                  subEl.innerText = "CHAPITRE 1: CALCULUS & DERIVATIVES";
                } else if (videoId === "vid_physics_01") {
                  subEl.innerText = "CHAPITRE 1: HARMONIC OSCILLATORS";
                } else if (videoId === "vid_philosophy_01") {
                  subEl.innerText = "CHAPITRE 1: STOIC PHILOSOPHY";
                } else {
                  subEl.innerText = "CHAPTER 1: LESSON INTRO";
                }
              }
            }"""

new_video_sub = """            const subEl = document.getElementById("videoSubject");
            const roleEl = document.getElementById("profileCardRole");
            if (videoId === "vid_chemistry_organic_chemistry_chemistry" || (data.video_file_path && data.video_file_path.includes("chem"))) {
              if (subEl) subEl.innerText = "CHEMISTRY: ALKYLAMMONIUM CATIONS, ACIDS & BASES";
              if (roleEl) roleEl.innerText = "Chemistry Specialist";
            } else if (videoId === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" || (data.video_file_path && data.video_file_path.includes("demographique"))) {
              if (subEl) subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
              if (roleEl) roleEl.innerText = "Economics Specialist";
            } else if (subEl) {
              subEl.innerText = (activeTitle || "CHAPTER 1: LESSON INTRO").toUpperCase();
            }"""

txt = txt.replace(old_video_sub, new_video_sub)

# Fix 4: Tab Header 4 Label (SOMMAIRE / SUMMARY)
txt = txt.replace('>Timestamps</button>', '>Sommaire</button>')
txt = txt.replace('>Horodatages</button>', '>Sommaire</button>')
txt = txt.replace('"nav_timestamps": "Horodatages"', '"nav_timestamps": "Sommaire"')
txt = txt.replace('"nav_timestamps": "Timestamps"', '"nav_timestamps": "Summary"')

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied index.html UI & Library PDF fixes!")

# 2. Update display_client.py default video_id in /api/lesson to Economics
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_py_default = """            if not video_id:
                if active_track and active_track.startswith("vid_"):
                    video_id = active_track
                elif active_track in ["calculus", "12th Grade", "k12/12th_grade/mathematics/calculus"]:
                    video_id = "vid_economics_01"
                elif active_track == "5th Grade" or active_track == "College":
                    video_id = "vid_physics_01"
                else:
                    video_id = "vid_philosophy_01\""""

new_py_default = """            if not video_id:
                if active_track and active_track.startswith("vid_"):
                    video_id = active_track
                elif active_track == "k12/12th_SM/chemistry":
                    video_id = "vid_chemistry_organic_chemistry_chemistry"
                else:
                    video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques\""""

py_txt = py_txt.replace(old_py_default, new_py_default)
open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py default lesson endpoint!")
