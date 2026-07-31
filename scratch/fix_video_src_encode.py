import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

txt = txt.replace('webcamVideo.src = data.video_file_path;', 'webcamVideo.src = encodeURI(data.video_file_path);')
txt = txt.replace('video.src = data.video_file_path;', 'video.src = encodeURI(data.video_file_path);')

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated video.src and webcamVideo.src with encodeURI in index.html!")
