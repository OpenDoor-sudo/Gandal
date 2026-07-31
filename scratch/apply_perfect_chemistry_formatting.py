import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Replace Chemistry concepts and takeaways with premium styled inline math badges
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

# 2. Update renderKaTeXText helper to handle any residual LaTeX strings cleanly
katex_func_clean = """      function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        try {
          return text.replace(/\\\\?\\\\\\[(.*?)\\\\?\\\\\\]|\\\\?\\\\((.*?)\\\\?\\\\)/g, function(match, p1, p2) {
            var math = (p1 || p2 || "").trim();
            if (!math) return match;
            try {
              return window.katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch (e) {
              return math;
            }
          });
        } catch (err) {
          return text;
        }
      }"""

start_k = txt.find("function renderKaTeXText")
end_k = txt.find("function renderVideoSummary", start_k)
if start_k != -1 and end_k != -1:
    txt = txt[:start_k] + katex_func_clean + "\n\n      " + txt[end_k:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully formatted Chemistry concepts and takeaways with premium styled KaTeX pills!")
