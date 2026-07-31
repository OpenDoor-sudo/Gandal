import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Fix container ID in submitQuizAnswers so retryDiv appends in Panel A
old_container_call = """          const container = document.getElementById("quizQuestionsListContainer");
          if (container) {
            const existingRetry = document.getElementById("quizRetryNotice");"""

new_container_call = """          const container = document.getElementById("quizQuestionsContainer") || document.getElementById("quizQuestionsListContainer");
          if (container) {
            const existingRetry = document.getElementById("quizRetryNotice");"""

if old_container_call in txt:
    txt = txt.replace(old_container_call, new_container_call)
    print("Successfully fixed container ID in submitQuizAnswers!")

# 2. Add Redo button into ÉVALUATION right panel tab in loadProfileProgress
old_eval_locked_ui = """                quizStatusText.innerHTML = `<span style="color: #ef4444;">${statusStr}</span>`;
                quizAttemptDetails.innerText = getLocString(
                  "quiz_detail_locked",
                  "Score falls below 85% requirement. Alternative question set active.",
                );"""

new_eval_locked_ui = """                quizStatusText.innerHTML = `<span style="color: #ef4444;">${statusStr}</span>`;
                quizAttemptDetails.innerHTML = `
                  <div>${getLocString("quiz_detail_locked", "Score falls below 85% requirement. Alternative question set active.")}</div>
                  <button onclick="redoCurrentQuiz()" style="margin-top: 14px; width: 100%; background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(168,85,247,0.35);">
                    🔁 RE-ESSAYER L'ÉVALUATION (REDO QUIZ)
                  </button>
                `;"""

if old_eval_locked_ui in txt:
    txt = txt.replace(old_eval_locked_ui, new_eval_locked_ui)
    print("Successfully added Redo button to ÉVALUATION right panel tab!")

# 3. Enhance redoCurrentQuiz implementation
old_redo_func = """                  function redoCurrentQuiz() {
        selectedAnswers = {};
        isAlternativeQuizActive = false;
        renderQuizQuestions();
        showToastNotification("Quiz Reset", "You can now attempt the quiz again!");
      }"""

new_redo_func = """      function redoCurrentQuiz() {
        selectedAnswers = {};
        isAlternativeQuizActive = false;
        window.isPracticeQuizActive = false;
        renderQuizQuestions();
        if (typeof toggleQuizView === "function") {
          toggleQuizView(true);
        }
        showToastNotification("Évaluation réinitialisée", "Vous pouvez maintenant refaire l'évaluation !");
      }"""

if old_redo_func in txt:
    txt = txt.replace(old_redo_func, new_redo_func)
    print("Successfully enhanced redoCurrentQuiz function!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Applied all Redo button fixes to index.html!")
