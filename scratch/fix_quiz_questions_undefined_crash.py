import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_quiz_access = """        const trackKey = getQuizTrackKey();
        let questionsSet = isAlternativeQuizActive
          ? QUIZ_QUESTIONS[trackKey].alternative
          : QUIZ_QUESTIONS[trackKey].main;"""

new_quiz_access = """        const trackKey = getQuizTrackKey() || "k12/12th_SM/Economics";
        const trackQuizData = QUIZ_QUESTIONS[trackKey] || QUIZ_QUESTIONS["k12/12th_SM/Economics"] || { main: [], alternative: [] };
        let questionsSet = isAlternativeQuizActive
          ? (trackQuizData.alternative || trackQuizData.main || [])
          : (trackQuizData.main || trackQuizData.alternative || []);
        if (!questionsSet) questionsSet = [];"""

if old_quiz_access in txt:
    txt = txt.replace(old_quiz_access, new_quiz_access)
    print("Successfully hardened QUIZ_QUESTIONS lookup in renderQuizQuestions!")
else:
    print("WARNING: Could not find exact old_quiz_access block in index.html!")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Updated index.html!")
