import os
import re

def main():
    filepath = "index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace the lecture video player src with the public streaming URL
    content = content.replace('src="static/videos/flower.mp4"', 'src="https://googleapis.com"')
    
    # 2. Replace any source tags pointing to static/videos/flower.mp4
    content = content.replace('src="static/videos/flower.mp4"', 'src="https://googleapis.com"')
    
    # Save the updated index.html
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print("index.html successfully updated to use public video streaming URL https://googleapis.com.")

if __name__ == '__main__':
    main()
