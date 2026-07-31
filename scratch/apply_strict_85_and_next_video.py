import os

# 1. Update display_client.py so score >= 85.0 is strictly required for mastery
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_mastery_calc = "mastery_achieved = 1 if (is_practice or (score >= 85.0 and sentry_verified)) else 0"
new_mastery_calc = "mastery_achieved = 1 if (not is_practice and score >= 85.0 and sentry_verified) else (1 if is_practice else 0)"

if old_mastery_calc in py_txt:
    py_txt = py_txt.replace(old_mastery_calc, new_mastery_calc)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully updated display_client.py strict 85% mastery requirement!")

# 2. Update index.html for strict 85% requirement, redo loop, and next video progression
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Implement advanceToNextCurriculumVideo & redoCurrentQuiz helpers
progression_scripts = """      function redoCurrentQuiz() {
        selectedAnswers = {};
        isAlternativeQuizActive = false;
        renderQuizQuestions();
        showToastNotification("Quiz Reset", "You can now attempt the quiz again!");
      }

      function advanceToNextCurriculumVideo() {
        const subjectVideoSequence = [
          {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            track: "k12/12th_SM/Economics"
          },
          {
            id: "vid_chemistry_organic_chemistry_chemistry",
            track: "k12/12th_SM/chemistry"
          },
          {
            id: "vid_physics_01",
            track: "k12/12th_SM/physics"
          },
          {
            id: "vid_philosophy_01",
            track: "independent_learner/philosophy/stoicism_and_ethics"
          }
        ];

        const curVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID;
        const curIndex = subjectVideoSequence.findIndex(s => s.id === curVid);

        if (curIndex !== -1 && curIndex < subjectVideoSequence.length - 1) {
          const nextItem = subjectVideoSequence[curIndex + 1];
          selectedGoalTrack = nextItem.track;
          window.currentTrack = nextItem.track;
          loadTextbookPDF(nextItem.id);
          showToastNotification("Level Up!", "Congratulations! Loaded the next video in your curriculum.");
        } else {
          showToastNotification("Curriculum Completed", "Awesome job! You have mastered all available lessons in this module.");
        }
      }"""

if "function advanceToNextCurriculumVideo" not in txt:
    start_redo = txt.find("function redoCurrentQuiz")
    if start_redo != -1:
        end_redo = txt.find("function openTeacherQuizKeyInspector", start_redo)
        if end_redo != -1:
            txt = txt[:start_redo] + progression_scripts + "\n\n      " + txt[end_redo:]
    else:
        start_result = txt.find("function handleQuizResult")
        if start_result != -1:
            txt = txt[:start_result] + progression_scripts + "\n\n      " + txt[start_result:]

# Update handleQuizResult logic in index.html
old_handle_quiz = """        if (mastery) {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Mastery Achieved!",
            `Score: ${score.toFixed(1)}%. Lesson completed successfully.`,
          );
          loadProfileProgress();
        } else {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Evaluation Needs Review",
            `Score: ${score.toFixed(1)}%. Review the lesson summary or click 'Redo Quiz' to try again and achieve 85% mastery.`,
          );

          const container = document.getElementById("quizQuestionsListContainer");
          if (container) {
            const retryDiv = document.createElement("div");
            retryDiv.style.cssText = "margin-top: 20px; padding: 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; text-align: center;";
            retryDiv.innerHTML = `
              <div style="font-weight: 700; color: #f87171; margin-bottom: 8px; font-size: 0.95rem;">
                Score: ${score.toFixed(1)}% — Mastery Threshold is 85%
              </div>
              <div style="color: #a1a1aa; font-size: 0.8rem; margin-bottom: 14px;">
                You can re-read the Sommaire tab or try the quiz again to master the material!
              </div>
              <button onclick="redoCurrentQuiz()" style="background: #a855f7; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.82rem;">
                🔁 Redo Quiz
              </button>
            `;
            container.appendChild(retryDiv);
          }
          loadProfileProgress();
        }"""

new_handle_quiz = """        if (mastery) {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Mastery Achieved! (85%+)",
            `Score: ${score.toFixed(1)}%. Lesson completed successfully. Next level unlocked!`,
          );

          const container = document.getElementById("quizQuestionsListContainer");
          if (container) {
            container.innerHTML = `
              <div style="margin-top: 20px; padding: 24px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 16px; text-align: center;">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🎉</div>
                <div style="font-weight: 800; color: #10b981; margin-bottom: 8px; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  Mastery Achieved (${score.toFixed(1)}%)
                </div>
                <div style="color: #d4d4d8; font-size: 0.85rem; margin-bottom: 18px; line-height: 1.5;">
                  Great job! You passed with at least 85% and mastered this lesson. Click below to continue to the next video!
                </div>
                <button onclick="advanceToNextCurriculumVideo()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(16,185,129,0.3); transition: all 0.2s ease;">
                  ▶️ Continue to Next Video
                </button>
              </div>
            `;
          }
          loadProfileProgress();
        } else {
          window.timelineLocked = true;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "85% Mastery Required",
            `Score: ${score.toFixed(1)}%. You need at least 85% to pass. Click 'Redo Quiz' to try again!`,
          );

          const container = document.getElementById("quizQuestionsListContainer");
          if (container) {
            const existingRetry = document.getElementById("quizRetryNotice");
            if (existingRetry) existingRetry.remove();

            const retryDiv = document.createElement("div");
            retryDiv.id = "quizRetryNotice";
            retryDiv.style.cssText = "margin-top: 20px; padding: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 14px; text-align: center;";
            retryDiv.innerHTML = `
              <div style="font-weight: 800; color: #f87171; margin-bottom: 8px; font-size: 1rem;">
                Score: ${score.toFixed(1)}% (Required: 85.0%)
              </div>
              <div style="color: #d4d4d8; font-size: 0.82rem; margin-bottom: 16px; line-height: 1.4;">
                Work hard to master the material! Re-read the <b>SOMMAIRE</b> tab or click below to redo the quiz until you reach 85%.
              </div>
              <button onclick="redoCurrentQuiz()" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(168,85,247,0.3);">
                🔁 Redo Quiz (Try Again)
              </button>
            `;
            container.appendChild(retryDiv);
          }
          loadProfileProgress();
        }"""

if old_handle_quiz in txt:
    txt = txt.replace(old_handle_quiz, new_handle_quiz)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated index.html for strict 85% mastery requirement, Redo Quiz loop, and Next Video progression!")
