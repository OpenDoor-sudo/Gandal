with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
idx = content.find("tutorWebcamMock")
if idx != -1:
    print("=== tutorWebcamMock Context ===")
    print(content[idx-200:idx+800])

idx2 = content.find("tutorWebcam")
if idx2 != -1:
    print("=== tutorWebcam Context ===")
    print(content[idx2-200:idx2+800])
