import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

func_def = """
      function getFullPathForInterest(subId) {
        if (!subId) return "";
        const pathMap = {
          "k12/12th_SM/Economics": "k12/12th_SM/Economics/Extraeconomics/Les problèmes démographiques",
          "k12/12th_SM/chemistry": "k12/12th_SM/chemistry/organic_chemistry/chem",
          "k12/12th_SM/physics": "k12/12th_SM/physics/mechanics/harmonic_oscillators",
          "independent_learner/philosophy/stoicism_and_ethics": "independent_learner/philosophy/stoicism_and_ethics/meditations"
        };
        return pathMap[subId] || subId;
      }
"""

if "function getFullPathForInterest" not in txt:
    target_pos = txt.find("function migrateInterests")
    if target_pos != -1:
        txt = txt[:target_pos] + func_def + "\n      " + txt[target_pos:]
        open(html_path, 'w', encoding='utf-8').write(txt)
        print("Successfully injected getFullPathForInterest function into index.html!")
    else:
        print("Could not find migrateInterests target line!")
else:
    print("getFullPathForInterest is already defined!")
