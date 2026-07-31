import re

def check_file(filepath, pattern):
    print(f"--- Checking {filepath} for '{pattern}' ---")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        if not matches:
            print("No matches found.")
            return
        
        for m in matches[:10]:
            start = max(0, m.start() - 200)
            end = min(len(content), m.end() + 200)
            print(f"Match context (offset {m.start()}-{m.end()}):\n{content[start:end]}\n" + "="*40)
    except Exception as e:
        print(f"Error checking {filepath}: {e}")

check_file("index.html", "whiteboardSplitPane")
check_file("index.html", "character-name")
check_file("index.html", "currentQueryMode")
check_file("display_client.py", "RAISE_HAND")
