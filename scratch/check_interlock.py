import re

with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's search for resumeVideoPlaybackAfterSpeech
idx = content.find("function resumeVideoPlaybackAfterSpeech")
if idx != -1:
    print("=== resumeVideoPlaybackAfterSpeech ===")
    print(content[idx:idx+800])

# Let's search for speakSocraticHint
idx2 = content.find("function speakSocraticHint")
if idx2 != -1:
    print("=== speakSocraticHint ===")
    print(content[idx2:idx2+1200])

# Let's search for blackboard or typewriter logic
idx3 = content.find("function typeWhiteboardText")
if idx3 == -1:
    idx3 = content.find("typeTextToWhiteboard")
if idx3 == -1:
    idx3 = content.find("typeText")
if idx3 == -1:
    idx3 = content.find("typewriter")
if idx3 != -1:
    print("=== Typewriter/Writing logic ===")
    print(content[idx3:idx3+1000])

# Let's search for video event listener
idx4 = content.find("lectureVideoPlayer.addEventListener")
if idx4 != -1:
    print("=== Video Event Listeners ===")
    print(content[idx4:idx4+800])
