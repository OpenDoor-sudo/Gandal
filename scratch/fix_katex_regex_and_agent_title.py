import os, re

# 1. Update index.html KaTeX regex in renderKaTeXText and Chemistry concepts/takeaways
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

katex_func_perfect = """      function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        
        // Parse LaTeX delimiters: \\([math]\\), \\[math\\], \\(math\\), or [math]
        return text.replace(/\\\\\\(\\\\?\\[(.*?)\\\\?\\]\\\\\\)|\\\\\\((.*?)\\\\\\)|\\\\?\\[(.*?)\\\\?\\]|\\\\\\((.*?)\\)/g, function(match, p1, p2, p3, p4) {
          var rawMath = (p1 || p2 || p3 || p4 || "").trim();
          if (!rawMath) return match;
          try {
            return window.katex.renderToString(rawMath, { displayMode: false, throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      }"""

start_k = txt.find("function renderKaTeXText")
end_k = txt.find("function renderVideoSummary", start_k)
if start_k != -1 and end_k != -1:
    txt = txt[:start_k] + katex_func_perfect + "\n\n      " + txt[end_k:]

# Replace raw LaTeX in Chemistry concepts & takeaways with clean KaTeX rendered strings
old_chem_block = """            concepts: isFrench ? [
              "<u>Cation Alkylammonium (R-NH3+)</u> : Acide faible conjugué d'une amine, capable de céder un proton à l'eau.",
              "<u>Réaction Réversible</u> : Réaction incomplète caractérisée par la présence simultanée des réactifs et des produits à l'équilibre.",
              "<u>Concentrations Équivalentes</u> : À l'équilibre, la concentration des produits formés \\([\\text{R-NH}_2]\\) et \\([\\text{H}_3\\text{O}^+]\\) est rigoureusement identique."
            ] : [
              "<u>Alkylammonium Cation (R-NH3+)</u> : Weak conjugate acid of an amine capable of donating a proton to water.",
              "<u>Reversible Reaction</u> : Incomplete reaction characterized by simultaneous presence of reactants and products at equilibrium.",
              "<u>Equal Product Concentrations</u> : At equilibrium, concentrations of generated \\([\\text{R-NH}_2]\\) and \\([\\text{H}_3\\text{O}^+]\\) are identical."
            ],
            takeaways: isFrench ? [
              "Identifier le couple acide/base \\(\\text{R-NH}_3^+ / \\text{R-NH}_2\\) dans l'équation de réaction.",
              "Calculer le pH et le degré de dissociation de l'acide faible à partir de sa constante \\(K_a\\).",
              "Vérifier la conservation de la masse et des charges lors de la formation des ions hydronium."
            ] : [
              "Identify the conjugate acid/base pair \\(\\text{R-NH}_3^+ / \\text{R-NH}_2\\) in the reaction equation.",
              "Calculate pH and dissociation fraction of the weak acid using constant \\(K_a\\).",
              "Verify mass and charge balance during hydronium ion formation."
            ]"""

new_chem_block = """            concepts: isFrench ? [
              "<u>Cation Alkylammonium (R-NH<sub>3</sub><sup>+</sup>)</u> : Acide faible conjugué d'une amine, capable de céder un proton à l'eau.",
              "<u>Réaction Réversible</u> : Réaction incomplète caractérisée par la présence simultanée des réactifs et des produits à l'équilibre.",
              "<u>Concentrations Équivalentes</u> : À l'équilibre, la concentration des produits formés <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>[R-NH<sub>2</sub>]</span> et <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>[H<sub>3</sub>O<sup>+</sup>]</span> est rigoureusement identique."
            ] : [
              "<u>Alkylammonium Cation (R-NH<sub>3</sub><sup>+</sup>)</u> : Weak conjugate acid of an amine capable of donating a proton to water.",
              "<u>Reversible Reaction</u> : Incomplete reaction characterized by simultaneous presence of reactants and products at equilibrium.",
              "<u>Equal Product Concentrations</u> : At equilibrium, concentrations of generated <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>[R-NH<sub>2</sub>]</span> and <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>[H<sub>3</sub>O<sup>+</sup>]</span> are identical."
            ],
            takeaways: isFrench ? [
              "Identifier le couple acide/base <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>R-NH<sub>3</sub><sup>+</sup> / R-NH<sub>2</sub></span> dans l'équation de réaction.",
              "Calculer le pH et le degré de dissociation de l'acide faible à partir de sa constante <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>K<sub>a</sub></span>.",
              "Vérifier la conservation de la masse et des charges lors de la formation des ions hydronium <b>(H<sub>3</sub>O<sup>+</sup>)</b>."
            ] : [
              "Identify the conjugate acid/base pair <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>R-NH<sub>3</sub><sup>+</sup> / R-NH<sub>2</sub></span> in the reaction equation.",
              "Calculate pH and dissociation fraction of the weak acid using constant <span style='font-family: KaTeX_Main, serif; font-style: normal; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);'>K<sub>a</sub></span>.",
              "Verify mass and charge balance during hydronium ion formation <b>(H<sub>3</sub>O<sup>+</sup>)</b>."
            ]"""

if old_chem_block in txt:
    txt = txt.replace(old_chem_block, new_chem_block)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated index.html KaTeX formatting!")

# 2. Update display_client.py for video title resolution
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_meta_query = """                        video_title = "Active Lesson"
                        chapter_id = "unknown"
                        conn = sqlite3.connect(db_path)
                        cursor = conn.cursor()
                        cursor.execute("SELECT title, chapter_id FROM curriculum_tree WHERE video_id = ?", (video_id,))
                        meta_row = cursor.fetchone()
                        if meta_row:
                            video_title, chapter_id = meta_row
                        conn.close()"""

new_meta_query = """                        video_title = "Active Lesson"
                        chapter_id = "unknown"
                        conn = sqlite3.connect(db_path)
                        cursor = conn.cursor()
                        cursor.execute("SELECT pdf_file_path, chapter_id FROM lesson_metadata WHERE video_id = ?", (video_id,))
                        l_row = cursor.fetchone()
                        if l_row and l_row[0]:
                            video_title = os.path.basename(l_row[0]).replace(".pdf", "")
                            if l_row[1]: chapter_id = l_row[1]
                        else:
                            cursor.execute("SELECT title, chapter_id FROM curriculum_tree WHERE video_id = ?", (video_id,))
                            meta_row = cursor.fetchone()
                            if meta_row:
                                video_title, chapter_id = meta_row
                            else:
                                video_title = video_id.replace("vid_", "").replace("_", " ").title()
                        conn.close()"""

if old_meta_query in py_txt:
    py_txt = py_txt.replace(old_meta_query, new_meta_query)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully updated display_client.py video_title resolution!")
