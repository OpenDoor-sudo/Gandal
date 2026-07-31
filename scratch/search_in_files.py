import re

def search_pattern(pattern, filepath):
    print(f"Searching for pattern: {pattern} in {filepath}")
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            if re.search(pattern, line):
                print(f"{idx}: {line.strip()}")

if __name__ == "__main__":
    search_pattern("video_file_path", "display_client.py")
