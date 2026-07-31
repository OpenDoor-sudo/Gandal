import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

katex_func_clean = """      function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        return text.replace(/\\\\\\\\[(.*?)\\\\\\\\]|\\\\\\\\((.*?)\\\\\\\\)/g, function(match, m1, m2) {
          try {
            var math = m1 || m2 || match;
            return window.katex.renderToString(math, { displayMode: false, throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      }"""

# Clean replace renderKaTeXText
start_k = txt.find("function renderKaTeXText")
end_k = txt.find("function renderVideoSummary", start_k)
if start_k != -1 and end_k != -1:
    txt = txt[:start_k] + katex_func_clean + "\n\n      " + txt[end_k:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully cleaned renderKaTeXText regex in index.html!")
