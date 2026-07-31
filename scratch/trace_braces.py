txt = open('index.html', 'r', encoding='utf-8').read()
lines = txt.split('\n')
start = -1
for i, l in enumerate(lines):
    if 'async function loadTextbookPDF' in l:
        start = i
        print(f"Found at line {i+1}")
        break

if start != -1:
    depth = 0
    for i in range(start, min(start + 250, len(lines))):
        l = lines[i]
        delta = l.count('{') - l.count('}')
        depth += delta
        print(f"{i+1} [depth={depth}]: {l}")
        if depth == 0 and i > start:
            print(">>> FUNCTION ENDED AT LINE", i+1)
            break
