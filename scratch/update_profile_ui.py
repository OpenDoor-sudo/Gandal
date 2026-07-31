import os, re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update renderKnowledgeCoreGrid to show video title instead of generic subject name
old_grid_start = "function renderKnowledgeCoreGrid() {"
old_grid_end = "// CURRICULUM_STAGING_TREE has been hoisted to the top of the script block."

start_idx = txt.find(old_grid_start)
end_idx = txt.find(old_grid_end, start_idx)

if start_idx != -1 and end_idx != -1:
    new_grid_func = """function renderKnowledgeCoreGrid() {
        const grid = document.getElementById("knowledgeCoreGrid");
        if (!grid) return;

        let selectedInterestsList = [];
        if (window.ACTIVE_DATABASE_INTERESTS) {
          selectedInterestsList = migrateInterests(
            window.ACTIVE_DATABASE_INTERESTS,
          );
        } else {
          selectedInterestsList = ["k12/12th_SM/Economics"];
        }

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const locStrings =
          UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
        const getLocString = (key, fallback) =>
          locStrings[key] !== undefined ? locStrings[key] : fallback;

        // Dynamically construct cards from selected subjects
        const cards = selectedInterestsList.map((subPath) => {
          let label = subPath.split("/").pop().replace(/_/g, " ");
          label = label
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          // Lookup label inside tree structure
          for (const catKey in CURRICULUM_STAGING_TREE) {
            const cat = CURRICULUM_STAGING_TREE[catKey];
            if (cat.groups) {
              let foundLabel = false;
              for (const grpKey in cat.groups) {
                const grp = cat.groups[grpKey];
                if (grp.subjects) {
                  const found = grp.subjects.find((s) => s.id === subPath);
                  if (found) {
                    label = found.label;
                    foundLabel = true;
                    break;
                  }
                }
              }
              if (foundLabel) break;
            }
          }

          const isActive = selectedGoalTrack === subPath;

          // Map subPath to corresponding video_id, display video title, target hours, and PDF file
          const subjectVideoMap = {
            "k12/12th_SM/Economics": {
              video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
              displayTitle: "01_Les problèmes démographiques",
              targetHours: 20,
              pdf: "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/01_Les problèmes démographiques.pdf",
              defaultGrade: "A",
            },
            "k12/TSM/Economics": {
              video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
              displayTitle: "01_Les problèmes démographiques",
              targetHours: 20,
              pdf: "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/01_Les problèmes démographiques.pdf",
              defaultGrade: "A",
            },
            "k12/12th_SM/physics": {
              video_id: "vid_physics_01",
              displayTitle: "Oscillateurs Harmoniques & Dynamique",
              targetHours: 15,
              pdf: "/curriculum_staging/uploads/Gracian.pdf",
              defaultGrade: "B+",
            },
            "k12/12th_SM/chemistry": {
              video_id: "vid_chemistry_organic_chemistry_chemistry",
              displayTitle: "Chimie Organique (chem.mp4)",
              targetHours: 15,
              pdf: "/curriculum_staging/k12/12th_SM/chemistry/organic_chemistry/Chemistry.pdf",
              defaultGrade: "A-",
            },
            "independent_learner/philosophy/stoicism_and_ethics": {
              video_id: "vid_philosophy_01",
              displayTitle: "Éthique Stoïcienne & Dialogue Socratique",
              targetHours: 16,
              pdf: "/curriculum_staging/uploads/Gracian.pdf",
              defaultGrade: "A-",
            },
            "k12/1st_grade/mathematics": {
              video_id: "vid_physics_02",
              displayTitle: "Calculus & Dérivées",
              targetHours: 15,
              pdf: "/curriculum_staging/uploads/Gracian.pdf",
              defaultGrade: "B",
            },
          };

          const trackMeta = subjectVideoMap[subPath] || {
            video_id: subPath,
            displayTitle: label,
            targetHours: 15,
            pdf: `/curriculum_staging/${subPath}`,
            defaultGrade: "N/A",
          };

          let pdf = trackMeta.pdf;
          let grade = trackMeta.defaultGrade;
          let targetHours = trackMeta.targetHours;
          let displayTitle = trackMeta.displayTitle || label;

          // Compute live accumulated watch position from DB/localStorage
          let liveSecs = 0;
          if (window.dbStudentProgress && Array.isArray(window.dbStudentProgress)) {
            const match = window.dbStudentProgress.find(
              (p) => p.video_id === trackMeta.video_id,
            );
            if (match) {
              liveSecs = Math.max(match.max_position || 0, match.last_position || 0);
            }
          }
          if (!liveSecs) {
            liveSecs = parseFloat(
              localStorage.getItem("video_max_time_" + trackMeta.video_id) ||
                localStorage.getItem("video_time_" + trackMeta.video_id) ||
                "0",
            );
          }

          let hours = `${Math.round(liveSecs / 60)}m / ${targetHours}h`;
          if (liveSecs >= 3600) {
            hours = `${(liveSecs / 3600).toFixed(1)}h / ${targetHours}h`;
          }

          let progress = Math.min(100, Math.round((liveSecs / (targetHours * 3600)) * 100));
          if (progress === 0 && liveSecs > 0) progress = 1;

          return {
            id: subPath,
            title: displayTitle,
            grade: grade,
            progress: progress,
            hours: hours,
            pdf: pdf,
            isActive: isActive,
          };
        });

        // Sort cards so the active studying card is on top
        cards.sort((a, b) => b.isActive - a.isActive);

        grid.innerHTML = cards
          .map((card) => {
            const transTitle = card.title;
            if (card.isActive) {
              return `
                        <!-- ${card.title} Course Card -->
                        <div class="course-card currently-studying">
                            <span class="currently-studying-badge">${getLocString("label_currently_studying", "CURRENTLY STUDYING")}</span>
                            <div class="course-header">
                                <span class="course-title">${transTitle}</span>
                                <span class="course-grade">${card.grade}</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${card.progress}%;"></div>
                            </div>
                            <div class="course-footer">
                                <span class="course-hours">${card.hours}</span>
                                <span class="export-pdf-link" onclick="event.stopPropagation(); window.open('${card.pdf}', '_blank')">${getLocString("label_export_pdf", "EXPORT AS PDF")}</span>
                            </div>
                        </div>
                    `;
            } else {
              return `
                        <!-- ${card.title} Course Card -->
                        <div class="course-card" onclick="switchActiveTrack('${card.id}')" style="cursor: pointer;">
                            <div class="course-header">
                                <span class="course-title">${transTitle}</span>
                                <span class="course-grade">${card.grade}</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${card.progress}%;"></div>
                            </div>
                            <div class="course-footer">
                                <span class="course-hours">${card.hours}</span>
                                <button class="switch-lesson-btn" onclick="event.stopPropagation(); switchActiveTrack('${card.id}')">${getLocString("label_switch_lesson", "SWITCH TO LESSON")}</button>
                            </div>
                        </div>
                    `;
            }
          })
          .join("");
      }

      """
    txt = txt[:start_idx] + new_grid_func + txt[end_idx:]

# 2. Update renderProfileInterests to show full path under subject titles
interest_sub_id_pattern = r'<span style="font-size: 0\.65rem; color: var\(--outline\); font-family: \'Space Mono\', monospace;">\$\{sub\.id\}</span>'
new_sub_id_code = r'''<span style="font-size: 0.65rem; color: var(--outline); font-family: 'Space Mono', monospace;">${getFullPathForInterest(sub.id)}</span>'''

txt = re.sub(interest_sub_id_pattern, new_sub_id_code, txt)

# Add getFullPathForInterest helper function if not present
if "function getFullPathForInterest(" not in txt:
    helper_code = """
      function getFullPathForInterest(subId) {
        const fullPathMap = {
          "k12/12th_SM/Economics": "k12/12th_SM/Economics/Extraeconomics/Les problèmes démographiques",
          "k12/TSM/Economics": "k12/12th_SM/Economics/Extraeconomics/Les problèmes démographiques",
          "k12/12th_SM/chemistry": "k12/12th_SM/chemistry/organic_chemistry/chem",
          "k12/12th_SM/english_literature": "k12/12th_SM/english_literature/poetry/intro",
          "k12/12th_SM/physics": "k12/12th_SM/physics/mechanics/physics_01",
          "k12/12th_SM/world_history": "k12/12th_SM/world_history/modern/chapter_01",
          "k12/1st_grade/mathematics": "k12/1st_grade/mathematics/algebra/calculus_01",
          "k12/1st_grade/english_language_arts": "k12/1st_grade/english_language_arts/phonics/unit_01",
          "k12/1st_grade/introductory_science": "k12/1st_grade/introductory_science/nature/unit_01",
          "independent_learner/philosophy/stoicism_and_ethics": "independent_learner/philosophy/stoicism_and_ethics/stoicism_01"
        };
        return fullPathMap[subId] || subId;
      }
"""
    # Insert helper before renderProfileInterests
    insert_before = "function renderProfileInterests() {"
    pos = txt.find(insert_before)
    if pos != -1:
        txt = txt[:pos] + helper_code + "\n" + txt[pos:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated Profile cards and interest paths in index.html!")
