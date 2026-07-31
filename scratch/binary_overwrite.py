import os
import shutil
import re

def main():
    # Define source video path
    src_video = os.path.join("curriculum_staging", "12th_Grade", "Calculus", "lesson_01_derivatives.mp4")
    
    # Define destination path
    dest_dir = os.path.join("static", "videos")
    os.makedirs(dest_dir, exist_ok=True)
    
    dest_flower = os.path.join(dest_dir, "flower.mp4")
    dest_sample = os.path.join(dest_dir, "sample.mp4")
    
    # 1 & 2. Execute binary copy/overwrite
    print(f"Copying {src_video} to {dest_flower}...")
    shutil.copy(src_video, dest_flower)
    print(f"Copying {src_video} to {dest_sample}...")
    shutil.copy(src_video, dest_sample)
    
    # Verify file existence and size
    print(f"Verified: {dest_flower} exists, size: {os.path.getsize(dest_flower)} bytes")
    
    # 3. Hardcode HTML Destination inside index.html
    index_path = "index.html"
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    # Replace video player src attribute
    # Find the video player tag
    video_tag_pattern = r'<video\s+id="lectureVideoPlayer"\s+[^>]*>'
    match = re.search(video_tag_pattern, html)
    if match:
        tag = match.group(0)
        # Rigidly set src="static/videos/flower.mp4"
        new_tag = re.sub(r'src="[^"]*"', 'src="static/videos/flower.mp4"', tag)
        html = html.replace(tag, new_tag)
        print(f"Updated video tag from {tag} to {new_tag}")
        
    # Replace source child element
    source_pattern = r'<source\s+src="[^"]*"\s+type="video/mp4"\s*>'
    match_source = re.search(source_pattern, html)
    if match_source:
        source_tag = match_source.group(0)
        new_source_tag = '<source src="static/videos/flower.mp4" type="video/mp4">'
        html = html.replace(source_tag, new_source_tag)
        print(f"Updated source tag from {source_tag} to {new_source_tag}")
        
    # Write back to index.html
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
        
    print("index.html updated successfully.")

if __name__ == "__main__":
    main()
