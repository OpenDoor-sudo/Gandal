import os

# 1. Update display_client.py QUIZ_QUESTIONS dataset to match index.html perfectly
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_py_quiz = """QUIZ_QUESTIONS = {
    "Economics": {
        "main": [
            { "id": 1, "correct": "C" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "C" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "B" },
            { "id": 2, "correct": "C" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "B" }
        ]
    },
    "calculus": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ]
    },
    "College": {
        "main": [
            { "id": 1, "correct": "B" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "A" },
            { "id": 5, "correct": "B" }
        ]
    },
    "Chemistry": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "B" }
        ],
        "alternative": [
            { "id": 1, "correct": "C" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "B" }
        ]
    }
}"""

new_py_quiz = """QUIZ_QUESTIONS = {
    "Demographics": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "A" },
            { "id": 5, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" }
        ]
    },
    "Chemistry": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "A" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" }
        ]
    },
    "Economics": {
        "main": [
            { "id": 1, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "B" }
        ]
    },
    "calculus": {
        "main": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "B" },
            { "id": 3, "correct": "A" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ]
    },
    "College": {
        "main": [
            { "id": 1, "correct": "B" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "B" },
            { "id": 5, "correct": "C" }
        ],
        "alternative": [
            { "id": 1, "correct": "A" },
            { "id": 2, "correct": "A" },
            { "id": 3, "correct": "B" },
            { "id": 4, "correct": "A" },
            { "id": 5, "correct": "B" }
        ]
    }
}"""

if old_py_quiz in py_txt:
    py_txt = py_txt.replace(old_py_quiz, new_py_quiz)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully synchronized display_client.py QUIZ_QUESTIONS!")

# 2. Update index.html to add Redo Quiz button & Teacher Answer Key Modal
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_fail_branch = """        } else {
          window.timelineLocked = true;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Evaluation Failed",
            `Score: ${score.toFixed(1)}%. Score falls below 85.0% mastery threshold. Timeline navigation locked.`,
          );

          isAlternativeQuizActive = true;
          selectedAnswers = {};
          renderQuizQuestions();
          loadProfileProgress();
        }"""

new_fail_branch = """        } else {
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

if old_fail_branch in txt:
    txt = txt.replace(old_fail_branch, new_fail_branch)

# Add redoCurrentQuiz and openTeacherQuizKeyInspector functions
teacher_modal_script = """      function redoCurrentQuiz() {
        selectedAnswers = {};
        isAlternativeQuizActive = false;
        renderQuizQuestions();
        showToastNotification("Quiz Reset", "You can now attempt the quiz again!");
      }

      function openTeacherQuizKeyInspector() {
        const trackKey = getQuizTrackKey();
        const questions = QUIZ_QUESTIONS[trackKey] ? QUIZ_QUESTIONS[trackKey].main : [];
        let html = `<div style="padding: 20px; background: #0c0c0e; color: white; border-radius: 12px; max-width: 600px; margin: 40px auto; border: 1px solid #a855f7;">
          <h3 style="color: #a855f7; margin-top: 0;">🔑 Teacher Answer Key: ${trackKey}</h3>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px; max-height: 400px; overflow-y: auto;">`;

        questions.forEach((q, idx) => {
          html += `<div style="background: #141418; padding: 12px; border-radius: 8px; border: 1px solid #27272a;">
            <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.85rem;">Q${q.id}: ${q.question}</div>
            <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 6px;">`;
          for (let opt in q.options) {
            const isAns = opt === q.correct;
            html += `<span style="display: block; ${isAns ? 'color: #10b981; font-weight: 700;' : ''}">${opt}: ${q.options[opt]} ${isAns ? '✔ (CORRECT)' : ''}</span>`;
          }
          html += `</div></div>`;
        });

        html += `</div>
          <button onclick="document.getElementById('teacherKeyModal').remove()" style="margin-top: 16px; background: #a855f7; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;">Close Inspector</button>
        </div>`;

        let modal = document.getElementById('teacherKeyModal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'teacherKeyModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justifyContent: center;';
        modal.innerHTML = html;
        document.body.appendChild(modal);
      }"""

if "function openTeacherQuizKeyInspector" not in txt:
    start_result = txt.find("function handleQuizResult")
    if start_result != -1:
        txt = txt[:start_result] + teacher_modal_script + "\n\n      " + txt[start_result:]

# Add Teacher Answer Key button to evaluation panel header
old_eval_header = """            <div class="evaluation-card-header">
              <h3 class="label-evaluation-card-title">"""

new_eval_header = """            <div class="evaluation-card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 class="label-evaluation-card-title">"""

if old_eval_header in txt:
    txt = txt.replace(old_eval_header, new_eval_header)

old_eval_title_close = """<h3 class="label-evaluation-card-title">Évaluation interactive</h3>"""
new_eval_title_close = """<h3 class="label-evaluation-card-title">Évaluation interactive</h3>
              <button onclick="openTeacherQuizKeyInspector()" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); color: #c084fc; padding: 4px 12px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">🔑 Teacher Answer Key</button>"""

if old_eval_title_close in txt:
    txt = txt.replace(old_eval_title_close, new_eval_title_close)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied quiz answer key sync, redo prompt, and Teacher Inspector modal to index.html!")
