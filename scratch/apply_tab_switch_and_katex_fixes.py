import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Wrap concepts and takeaways map in renderKaTeXText(c) and renderKaTeXText(t)
old_concepts_map = "${summaryData.concepts.map(c => `<li style=\"margin-bottom: 6px;\">${c}</li>`).join(\"\")}"
new_concepts_map = "${summaryData.concepts.map(c => `<li style=\"margin-bottom: 6px;\">${renderKaTeXText(c)}</li>`).join(\"\")}"

old_takeaways_map = "${summaryData.takeaways.map(t => `<li style=\"margin-bottom: 6px;\">${t}</li>`).join(\"\")}"
new_takeaways_map = "${summaryData.takeaways.map(t => `<li style=\"margin-bottom: 6px;\">${renderKaTeXText(t)}</li>`).join(\"\")}"

txt = txt.replace(old_concepts_map, new_concepts_map)
txt = txt.replace(old_takeaways_map, new_takeaways_map)

# 2. Fix loadProfileProgress so it NEVER overwrites an active selected track (e.g. Chemistry)
old_profile_track_set = """              selectedGoalTrack = parts[1];
            } else {
              rawInterests = bgContext;
              selectedGoalTrack = bgContext;
            }"""

new_profile_track_set = """              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = parts[1];
              }
            } else {
              rawInterests = bgContext;
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = bgContext;
              }
            }"""

txt = txt.replace(old_profile_track_set, new_profile_track_set)

# 3. Ensure renderKaTeXText strips LaTeX brackets properly if present
katex_func_clean = """      function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        return text.replace(/\\\\\\\\\\\\[(.*?)\\\\\\\\\\\\\]|\\\\\\\\\\\\((.*?)\\\\\\\\\\\\)|\\\\\\\\[(.*?)\\\\\\\\]|\\\\\\\\((.*?)\\\\\\\\)/g, function(match, p1, p2, p3, p4) {
          try {
            var math = (p1 || p2 || p3 || p4 || "").trim();
            if (!math) return match;
            return window.katex.renderToString(math, { displayMode: false, throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      }"""

start_k = txt.find("function renderKaTeXText")
end_k = txt.find("function renderVideoSummary", start_k)
if start_k != -1 and end_k != -1:
    txt = txt[:start_k] + katex_func_clean + "\n\n      " + txt[end_k:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied KaTeX rendering to concepts/takeaways and prevented tab-switching track resets!")
