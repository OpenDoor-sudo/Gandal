import sys
import re

# Reconfigure stdout to use utf-8
sys.stdout.reconfigure(encoding='utf-8')

def extract_css_and_html():
    with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Find styles
    style_pattern = r"<style>.*?</style>"
    styles = re.findall(style_pattern, content, re.DOTALL)
    print("=== STYLES RELATED TO SPLIT PANE OR CHARACTER ===")
    for style in styles:
        # search for terms
        lines = style.split("\n")
        matching_lines = []
        for i, line in enumerate(lines):
            if any(term in line for term in ["whiteboard-split-pane", "whiteboardSplitPane", "character-name", "character-role", "carouselName", "carouselRole", "profileCardName", "profileCardRole"]):
                # print context of 5 lines before and after
                start = max(0, i - 5)
                end = min(len(lines), i + 6)
                matching_lines.append(f"Lines {start+1}-{end}:\n" + "\n".join(lines[start:end]) + "\n" + "-"*20)
        if matching_lines:
            print(f"In a style tag (len={len(style)}):")
            for ml in matching_lines[:5]:
                print(ml)
    
    print("\n=== MARKUP FOR WHITEBOARD SPLIT PANE ===")
    # Find whiteboardSplitPane div and print its contents
    pane_idx = content.find('id="whiteboardSplitPane"')
    if pane_idx != -1:
        print(content[pane_idx-100:pane_idx+1500])
    else:
        print("whiteboardSplitPane element not found by exact id string.")

extract_css_and_html()
