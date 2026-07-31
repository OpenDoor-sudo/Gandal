import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for canvases or graph containers in the chat tab
# The chat tab is likely named "chat" or "chat-pane" or has id containing "chat"
print("Searching for canvas/graph in index.html:")
for match in re.finditer(r'(?:canvas|graph|chat)', content, re.IGNORECASE):
    start = max(0, match.start() - 50)
    end = min(len(content), match.end() + 50)
    snippet = content[start:end].replace('\n', ' ').strip()
    if 'height' in snippet or 'width' in snippet or 'style' in snippet or 'id=' in snippet:
         print(f"Match: ...{snippet}...")
