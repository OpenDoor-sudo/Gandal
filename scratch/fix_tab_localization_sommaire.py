import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update UI_LOCALIZATIONS tab_timestamps
txt = txt.replace('tab_timestamps: "Horodatages"', 'tab_timestamps: "Sommaire"')
txt = txt.replace('tab_timestamps: "Timestamps"', 'tab_timestamps: "Sommaire"')
txt = txt.replace('nav_timestamps: "Horodatages"', 'nav_timestamps: "Sommaire"')
txt = txt.replace('nav_timestamps: "Timestamps"', 'nav_timestamps: "Sommaire"')

# 2. Update literal tab button text in HTML
old_btn = """          <button
            class="sidebar-tab-btn"
            onclick="switchSidebarTab('timestamps', this)"
          >
            Timestamps
          </button>"""

new_btn = """          <button
            class="sidebar-tab-btn"
            onclick="switchSidebarTab('timestamps', this)"
            id="tabBtnSommaire"
          >
            Sommaire
          </button>"""

txt = txt.replace(old_btn, new_btn)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated tab_timestamps localization to Sommaire in index.html!")
