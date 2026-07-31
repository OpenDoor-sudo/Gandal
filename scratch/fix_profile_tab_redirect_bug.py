import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_redirect_block = """                window.timelineLocked = true;
                // Automatically route user to evaluation tab so they aren't locked out in another tab
                const evalTabBtn = document.getElementById("evaluationTabBtn");
                if (evalTabBtn) {
                  switchSidebarTab("evaluation", evalTabBtn);
                }"""

new_redirect_block = """                window.timelineLocked = true;"""

if old_redirect_block in txt:
    txt = txt.replace(old_redirect_block, new_redirect_block)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully removed auto-redirect from loadProfileProgress in index.html!")
else:
    print("WARNING: Could not find old_redirect_block in index.html")
