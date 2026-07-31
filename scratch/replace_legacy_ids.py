import re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Replace legacy video IDs in index.html
txt = txt.replace('"vid_economics_01"', '"vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"')
txt = txt.replace("'vid_economics_01'", "'vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques'")

txt = txt.replace('"vid_chemistry_organic_chemistry"', '"vid_chemistry_organic_chemistry_chemistry"')
txt = txt.replace("'vid_chemistry_organic_chemistry'", "'vid_chemistry_organic_chemistry_chemistry'")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully replaced all legacy video IDs in index.html!")
