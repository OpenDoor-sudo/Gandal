import re

def main():
    filepath = "index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Ensure the video badge container renders 'CHAPTER 1: CALCULUS & DERIVATIVES' instead of 'LLM ARCHITECTURE 101'
    content = content.replace("LLM ARCHITECTURE 101", "CHAPTER 1: CALCULUS & DERIVATIVES")
    # Also handle the videoSubject tag if it's there
    content = re.sub(
        r'<div class="live-chapter-badge" id="videoSubject">.*?</div>',
        '<div class="live-chapter-badge" id="videoSubject">CHAPTER 1: CALCULUS & DERIVATIVES</div>',
        content
    )

    # 2. Ensure the main <video> element tag block rigidly reads: src="curriculum_staging/12th_Grade/Calculus/lesson_01_derivatives.mp4"
    # Locate the video player tag
    video_regex = r'<video\s+id="lectureVideoPlayer"\s+[^>]*>'
    match = re.search(video_regex, content)
    if match:
        tag = match.group(0)
        # Replace/update the src parameter rigidly
        new_tag = re.sub(r'src="[^"]*"', 'src="curriculum_staging/12th_Grade/Calculus/lesson_01_derivatives.mp4"', tag)
        if 'src=' not in new_tag:
            # If src wasn't present, add it
            new_tag = new_tag.replace('<video id="lectureVideoPlayer"', '<video id="lectureVideoPlayer" src="curriculum_staging/12th_Grade/Calculus/lesson_01_derivatives.mp4"')
        content = content.replace(tag, new_tag)

    # 3. Clean up any occurrences of flower.mp4 or sample.mp4 or 5-second durations from player context
    content = content.replace("flower.mp4", "")
    content = content.replace("sample.mp4", "")
    
    # 4. Save to disk
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("index.html rewritten successfully.")

if __name__ == "__main__":
    main()
