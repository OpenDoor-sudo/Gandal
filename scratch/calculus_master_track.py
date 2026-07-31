import os
import shutil
import re

def main():
    # 1. Copy the real calculus video to the new unique filename
    src_video = os.path.join("curriculum_staging", "12th_Grade", "Calculus", "lesson_01_derivatives.mp4")
    dest_video = os.path.join("static", "videos", "calculus_master_track.mp4")
    os.makedirs(os.path.dirname(dest_video), exist_ok=True)
    
    print(f"Copying {src_video} to {dest_video}...")
    shutil.copy(src_video, dest_video)
    print(f"Verified new file size: {os.path.getsize(dest_video)} bytes")
    
    # 2. Update index.html
    filepath = "index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace video tag src
    content = re.sub(
        r'<video\s+id="lectureVideoPlayer"\s+src="[^"]*"',
        '<video id="lectureVideoPlayer" src="static/videos/calculus_master_track.mp4"',
        content
    )
    
    # Replace source tag src
    # Since tutorWebcamMock source is empty, we only target the main source under lectureVideoPlayer
    old_source_block = '<source src="https://googleapis.com" type="video/mp4">'
    new_source_block = '<source src="static/videos/calculus_master_track.mp4" type="video/mp4">'
    content = content.replace(old_source_block, new_source_block)
    
    # Also clean up any other reference to flower.mp4 or sample.mp4
    content = content.replace("flower.mp4", "calculus_master_track.mp4")
    content = content.replace("sample.mp4", "calculus_master_track.mp4")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("index.html updated successfully with new unique filename.")

if __name__ == '__main__':
    main()
