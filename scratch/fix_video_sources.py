def main():
    filepath = "index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Locate the lectureVideoPlayer block and replace its source tag
    # We can replace the exact lines:
    old_block = """                    <!-- Native video element -->
                    <video id="lectureVideoPlayer" src="static/videos/flower.mp4" playsinline ontimeupdate="onVideoProgressUpdate()">
                        <source src="curriculum_staging/12th_Grade/Calculus/lesson_01_derivatives.mp4" type="video/mp4">
                    </video>"""

    new_block = """                    <!-- Native video element -->
                    <video id="lectureVideoPlayer" src="static/videos/flower.mp4" playsinline ontimeupdate="onVideoProgressUpdate()">
                        <source src="static/videos/flower.mp4" type="video/mp4">
                    </video>"""

    # Restore webcam source
    old_webcam = """                    <div class="pip-camera-box">
                        <video id="tutorWebcamMock" autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;">
                            <source src="static/videos/flower.mp4" type="video/mp4">
                        </video>"""

    new_webcam = """                    <div class="pip-camera-box">
                        <video id="tutorWebcamMock" autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;">
                            <source src="" type="video/mp4">
                        </video>"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        print("Updated lecture video player source block.")
    else:
        # Fallback regex or search
        print("Warning: old_block not found exactly.")

    if old_webcam in content:
        content = content.replace(old_webcam, new_webcam)
        print("Restored webcam source to empty.")
    else:
        print("Warning: old_webcam not found exactly.")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    main()
