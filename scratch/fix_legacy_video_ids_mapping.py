import os

# 1. Update index.html targetVideoId resolution
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

txt = txt.replace('targetVideoId = "vid_economics_01";', 'targetVideoId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";')
txt = txt.replace('activeVideoId = "vid_economics_01";', 'activeVideoId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";')

txt = txt.replace('targetVideoId = "vid_chemistry_organic_chemistry";', 'targetVideoId = "vid_chemistry_organic_chemistry_chemistry";')
txt = txt.replace('activeVideoId = "vid_chemistry_organic_chemistry";', 'activeVideoId = "vid_chemistry_organic_chemistry_chemistry";')

# Initial global declaration fallback
txt = txt.replace('let activeVideoId = window.ACTIVE_DATABASE_VIDEO_ID || "vid_physics_01";', 'let activeVideoId = window.ACTIVE_DATABASE_VIDEO_ID || "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";')

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated video ID resolution mapping in index.html!")

# 2. Update display_client.py to alias legacy IDs to real DB IDs in /api/lesson
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_alias = """            video_id = query_params.get('video_id', [None])[0]"""

new_alias = """            video_id = query_params.get('video_id', [None])[0]
            if video_id == "vid_economics_01":
                video_id = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
            elif video_id == "vid_chemistry_organic_chemistry":
                video_id = "vid_chemistry_organic_chemistry_chemistry\""""

py_txt = py_txt.replace(old_alias, new_alias)

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Successfully updated display_client.py legacy ID aliases!")
