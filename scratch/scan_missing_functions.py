import re

txt = open('index.html', encoding='utf-8').read()
script = re.findall(r'<script>(.*?)</script>', txt, re.DOTALL)[0]

# Find function definitions
func_defs = set(re.findall(r'function\s+([a-zA-Z0-9_$]+)\s*\(', script))
var_funcs = set(re.findall(r'(?:const|let|var|window\.)([a-zA-Z0-9_$]+)\s*=\s*function', script))
all_defined = func_defs.union(var_funcs)

# Find function calls
called = set(re.findall(r'\b([a-zA-Z0-9_$]+)\s*\(', script))

# Filter builtins and common DOM methods
builtins = {
    'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'instanceof',
    'fetch', 'console', 'log', 'error', 'warn', 'info', 'parseInt', 'parseFloat',
    'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'document', 'window', 'addEventListener', 'removeEventListener', 'getElementById',
    'getElementsByClassName', 'querySelector', 'querySelectorAll', 'createElement',
    'appendChild', 'removeChild', 'replaceChild', 'slice', 'splice', 'push', 'pop',
    'map', 'forEach', 'filter', 'reduce', 'some', 'every', 'find', 'includes', 'indexOf',
    'join', 'split', 'replace', 'replaceAll', 'toLowerCase', 'toUpperCase', 'trim',
    'startsWith', 'endsWith', 'substring', 'substr', 'normalize', 'lstrip', 'splitlines',
    'JSON', 'parse', 'stringify', 'Math', 'floor', 'ceil', 'round', 'min', 'max', 'random',
    'abs', 'sqrt', 'pow', 'Date', 'now', 'Object', 'keys', 'values', 'entries', 'assign',
    'Array', 'isArray', 'from', 'URL', 'URLSearchParams', 'alert', 'confirm', 'prompt',
    'localStorage', 'getItem', 'setItem', 'removeItem', 'clear', 'Boolean', 'String', 'Number',
    'RegExp', 'exec', 'test', 'Set', 'add', 'has', 'delete', 'Map', 'get', 'set',
    'Promise', 'all', 'resolve', 'reject', 'then', 'catch', 'finally', 'eval'
}

undefined_calls = [c for c in called if c not in all_defined and c not in builtins and not c.startswith('__')]

print("=== FUNCTION CALL SCAN RESULT ===")
print("Total defined functions:", len(all_defined))
print("Potentially undefined function calls:", undefined_calls)
