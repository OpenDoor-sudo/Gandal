import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

migrate_func = """
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
"""

if "function migrateInterests" not in txt:
    target_pos = txt.find("function renderProfileInterests")
    if target_pos != -1:
        txt = txt[:target_pos] + migrate_func + "\n      " + txt[target_pos:]
        open(html_path, 'w', encoding='utf-8').write(txt)
        print("Successfully injected migrateInterests function into index.html!")
    else:
        print("Could not find renderProfileInterests target line!")
else:
    print("migrateInterests function is already defined!")
