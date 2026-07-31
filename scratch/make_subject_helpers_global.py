import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

helpers_def = """
      function getSubjectFromPath(path) {
        if (!path) return "General";
        const cleanParts = path.split("/").filter((pt) => pt);
        if (cleanParts.length === 0) return "General";
        const firstDir = cleanParts[0].toLowerCase();
        let subject = "General";
        if (
          firstDir === "curriculum_staging" ||
          firstDir === "saved_notebooks"
        ) {
          const subParts = cleanParts.slice(1);
          if (subParts.length > 0) {
            const subFirst = subParts[0].toLowerCase();
            if (subFirst === "k12") {
              subject = subParts[2] || subParts[1] || "General";
            } else {
              subject = subParts[1] || subParts[0] || "General";
            }
          }
        } else {
          if (firstDir === "k12") {
            subject = cleanParts[2] || cleanParts[1] || "General";
          } else {
            subject = cleanParts[1] || cleanParts[0] || "General";
          }
        }
        return subject
          .replace(/_|-/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      function getIconForSubject(subj) {
        if (!subj) return "📚";
        const s = subj.toLowerCase();
        if (s.includes("math") || s.includes("calc")) return "📐";
        if (s.includes("phys")) return "⚛️";
        if (s.includes("econ") || s.includes("finance")) return "📊";
        if (s.includes("phil") || s.includes("logic")) return "🏛️";
        if (s.includes("chem")) return "🧪";
        if (s.includes("relig")) return "🛐";
        if (s.includes("net") || s.includes("hard") || s.includes("system"))
          return "💻";
        return "📚";
      }
"""

if "function getSubjectFromPath" not in txt:
    target_pos = txt.find("function getFullPathForInterest")
    if target_pos != -1:
        txt = txt[:target_pos] + helpers_def + "\n      " + txt[target_pos:]
        open(html_path, 'w', encoding='utf-8').write(txt)
        print("Successfully made getSubjectFromPath and getIconForSubject global in index.html!")
    else:
        print("Could not find getFullPathForInterest insertion target!")
else:
    print("getSubjectFromPath is already defined globally!")
