import os

def main():
    targets = ['localstorage']
    found = False
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('__')]
        for f in files:
            if f.endswith(('.html', '.py', '.js', '.css')):
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                        for i, line in enumerate(file):
                            for target in targets:
                                if target in line.lower():
                                    print(f"File: {filepath}, Line: {i+1}, Content: {line.strip()[:100]}")
                                    found = True
                except Exception as e:
                    pass
    if not found:
        print("No occurrences of 'localStorage' found.")

if __name__ == '__main__':
    main()
