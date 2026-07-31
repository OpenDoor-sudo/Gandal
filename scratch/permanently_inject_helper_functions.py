import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

helpers_block = """
      function migrateInterests(interests) {
        if (!interests) return [];
        if (Array.isArray(interests)) return interests;
        if (typeof interests === "string") {
          return interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      }

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

if "function migrateInterests" not in txt:
    target_pos = txt.find("function renderKnowledgeCoreGrid()")
    if target_pos != -1:
        txt = txt[:target_pos] + helpers_block + "\n\n      " + txt[target_pos:]
        open(html_path, 'w', encoding='utf-8').write(txt)
        print("Successfully injected migrateInterests and getFullPathForInterest into index.html!")
    else:
        print("Target line function renderKnowledgeCoreGrid() not found!")
else:
    print("migrateInterests already exists!")
