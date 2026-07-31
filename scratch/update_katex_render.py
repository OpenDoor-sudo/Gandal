import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

start_marker = "function renderVideoSummary(videoId) {"
end_marker = "// Render Redesigned Knowledge Core Grid"

start_idx = txt.find(start_marker)
end_idx = txt.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_render_func = r"""function renderVideoSummary(videoId) {
        const container = document.getElementById("summaryDocumentContainer");
        if (!container) return;

        const isFrench = (window.ACTIVE_DATABASE_LOCALE || "fr_FR").startsWith("fr");
        const activeVideo = videoId || window.ACTIVE_DATABASE_VIDEO_ID || activeVideoId || "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";
        const instructor = activeInstructorName || "Prof. GANDHO";

        let summaryData = {};

        if (activeVideo.includes("demographique") || activeVideo.includes("economics") || activeVideo.includes("extraeconomiques")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Démographiques du Développement" : "Economics: Demographic Challenges in Development",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Une analyse complète des <u>problèmes démographiques</u> influençant le développement. Le cours examine l'explosion démographique due à la baisse de la mortalité infantile et au maintien de la natalité, les facteurs socioculturels (analphabétisme, mariages précoces, traditions) et la théorie malthusienne analysant l'écart entre croissance démographique et ressources de subsistance."
              : "A comprehensive analysis of <u>demographic challenges</u> influencing economic development. Examines population explosion resulting from declining mortality alongside sustained birth rates, sociocultural factors, and Malthusian theory on population growth vs. food resources.",
            formulas: [
              { label: isFrench ? "Accroissement Naturel" : "Natural Population Growth", eq: "\\text{Taux d'Accroissement} = \\text{Taux de Natalité} - \\text{Taux de Mortalité}" },
              { label: isFrench ? "Modèle Malthusien (Subsistance vs Population)" : "Malthusian Model (Subsistence vs Population)", eq: "\\text{Population (Géométrique)} \\gg \\text{Subsistances (Arithmétique)} \\implies \\text{Pauvreté}" }
            ],
            concepts: isFrench ? [
              "<u>Explosion Démographique</u> : Accélération rapide de la population dans les pays sous-développés, où la capacité d'absorption de l'économie reste limitée.",
              "<u>Théorie Malthusienne</u> : Postulat soutenant que la surpopulation aggrave la pauvreté lorsque la croissance des ressources alimentaires ne suit pas le rythme démographique.",
              "<u>Facteurs Socio-Culturels</u> : Poids des traditions, mariages précoces, polygamie et analphabétisme comme moteurs de l'augmentation de la fécondité."
            ] : [
              "<u>Population Explosion</u> : Rapid acceleration of population in developing nations where economic absorption capacity remains constrained.",
              "<u>Malthusian Theory</u> : Premise that overpopulation compounds poverty when food production growth fails to match demographic expansion.",
              "<u>Sociocultural Factors</u> : Traditional influences, early marriage, and illiteracy as drivers of sustained high fertility rates."
            ],
            takeaways: isFrench ? [
              "L'explosion démographique dans les pays en développement accentue le chômage, l'analphabétisme et la dépendance financière.",
              "Améliorer l'éducation et la maîtrise de l'eau/agriculture pour adapter l'économie au rythme démographique.",
              "Planifier les politiques de santé et d'enseignement pour garantir l'autosuffisance."
            ] : [
              "Demographic explosion in developing countries exacerbates unemployment, illiteracy, and financial dependency.",
              "Enhance education and agricultural/water management to align economic capacity with population growth.",
              "Structure health and educational policies to achieve sustainable self-sufficiency."
            ]
          };
        } else if (activeVideo === "vid_chemistry_organic_chemistry_chemistry" || activeVideo.includes("chemistry") || activeVideo.includes("chem")) {
          summaryData = {
            title: isFrench ? "Chimie Organique : Cations d'Alkylammonium, Acides & Bases" : "Organic Chemistry: Alkylammonium Cations, Acids & Bases",
            subtitle: isFrench ? "Module Chimie • Équilibres Aqueux & Réactions d'Amines" : "Chemistry Module • Aqueous Equilibria & Amine Reactions",
            overview: isFrench
              ? "Examen approfondi du comportement des <u>cations d'alkylammonium (R-NH3+)</u> en solution aqueuse. Le cours démontre qu'ils se comportent comme des acides faibles en cédant partiellement un proton \\(H^+\\) à l'eau pour former l'amine correspondante (R-NH2) et des ions hydronium (H3O+)."
              : "In-depth examination of <u>alkylammonium cations (R-NH3+)</u> in aqueous solution. Demonstrates their behavior as weak acids donating a proton \\(H^+\\) to water, generating the corresponding amine (R-NH2) and hydronium ions (H3O+).",
            formulas: [
              { label: isFrench ? "Équilibre d'Acide Faible en Solution" : "Weak Acid Equilibrium in Solution", eq: "\\text{R-NH}_3^+ + \\text{H}_2\\text{O} \\rightleftharpoons \\text{R-NH}_2 + \\text{H}_3\\text{O}^+" },
              { label: isFrench ? "Constante d'Acidité (Ka)" : "Acid Dissociation Constant (Ka)", eq: "K_a = \\frac{[\\text{R-NH}_2] [\\text{H}_3\\text{O}^+]}{[\\text{R-NH}_3^+]}" }
            ],
            concepts: isFrench ? [
              "<u>Cation Alkylammonium (R-NH3+)</u> : Acide faible conjugué d'une amine, capable de céder un proton \\(H^+\\) à l'eau.",
              "<u>Réaction Réversible</u> : Réaction incomplète caractérisée par la présence simultanée des réactifs et des produits à l'équilibre.",
              "<u>Concentrations Équivalentes</u> : À l'équilibre, la concentration des produits formés \\([\\text{R-NH}_2]\\) et \\([\\text{H}_3\\text{O}^+]\\) est rigoureusement identique."
            ] : [
              "<u>Alkylammonium Cation (R-NH3+)</u> : Weak conjugate acid of an amine capable of donating a proton \\(H^+\\) to water.",
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
            ]
          };
        } else if (activeVideo === "vid_calculus_01" || activeVideo.includes("calculus") || activeVideo.includes("math")) {
          summaryData = {
            title: isFrench ? "Calcul Périodique & Dérivées : Analyse Graphique" : "Calculus & Derivatives: Graphing & Rate Analysis",
            subtitle: isFrench ? "Module Avancé • Mathématiques & Analyse Vectorielle" : "Advanced Module • Mathematics & Vector Calculus",
            overview: isFrench
              ? "Cette leçon examine la notion de <u>taux de variation instantané</u> et la pente de la ligne tangente en un point déterminé \\(x_0\\). L'analyse s'appuie sur la définition formelle des limites pour modéliser le comportement local des fonctions numériques."
              : "This lecture explores the concept of <u>instantaneous rate of change</u> and the slope of the tangent line at a specific point \\(x_0\\). The analysis utilizes formal limit definitions to model local function behavior.",
            formulas: [
              { label: isFrench ? "Définition de la Dérivée" : "Definition of the Derivative", eq: "\\frac{df}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}" },
              { label: isFrench ? "Équation de la Tangente" : "Equation of the Tangent Line", eq: "y - f(x_0) = f'(x_0)(x - x_0)" }
            ],
            concepts: isFrench ? [
              "<u>Pente Instantanée</u> : Représente la vitesse de variation locale de la fonction \\(f(x)\\) au point \\(x_0\\).",
              "<u>Ligne Tangente</u> : Droite touchant la courbe en un seul point local avec une pente équivalente à \\(f'(x_0)\\)."
            ] : [
              "<u>Instantaneous Slope</u> : Represents local rate of variation of \\(f(x)\\) evaluated at \\(x_0\\).",
              "<u>Tangent Line</u> : Straight line touching curve at a single point with slope equal to \\(f'(x_0)\\)."
            ],
            takeaways: isFrench ? [
              "Vérifier la continuité de la fonction avant d'évaluer la dérivée.",
              "Appliquer les règles de dérivation pour calculer la pente exacte."
            ] : [
              "Verify function continuity before evaluating derivative.",
              "Apply differentiation rules to calculate exact slope values."
            ]
          };
        } else {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Démographiques" : "Economics: Demographic Challenges",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques" : "Economics Module • Extra-Economic Characteristics",
            overview: isFrench
              ? "Analyse des <u>problèmes démographiques</u> dans les pays sous-développés, étude des causes et des conséquences socio-économiques."
              : "Analysis of <u>demographic challenges</u> in developing countries, examining sociocultural drivers and economic impacts.",
            formulas: [
              { label: isFrench ? "Taux d'Accroissement" : "Growth Rate", eq: "\\text{Accroissement} = \\text{Natalité} - \\text{Mortalité}" }
            ],
            concepts: isFrench ? [
              "<u>Explosion Démographique</u> : Accélération forte de la population liée aux avancées médicales et à la tradition."
            ] : [
              "<u>Population Explosion</u> : Rapid acceleration of population linked to healthcare improvements and traditions."
            ],
            takeaways: isFrench ? [
              "Maintenir l'équilibre entre croissance de la population et capacités d'accueil économiques."
            ] : [
              "Maintain balance between population growth and economic carrying capacity."
            ]
          };
        }

        // Build Microsoft Word-Style Formatted HTML
        let html = `
          <div style="border-bottom: 2px solid var(--primary); padding-bottom: 12px; margin-bottom: 16px;">
            <div style="font-family: 'Geist', monospace; font-size: 0.68rem; color: var(--primary); font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">
              📄 ${isFrench ? "DOCUMENT DE RÉSUMÉ EXÉCUTIF DU COURS" : "EXECUTIVE LESSON SUMMARY DOCUMENT"}
            </div>
            <h2 style="margin: 4px 0 6px 0; font-size: 1.1rem; font-weight: 700; color: #ffffff; font-family: 'Outfit', sans-serif;">
              ${summaryData.title}
            </h2>
            <div style="font-size: 0.72rem; color: #a1a1aa; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <span>${summaryData.subtitle}</span>
              <span style="background: rgba(168,85,247,0.15); color: #c084fc; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(168,85,247,0.3); font-family: monospace;">
                Prof. ${instructor}
              </span>
            </div>
          </div>

          <!-- Section 1: Executive Overview -->
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin: 0 0 8px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>📌</span> 1. ${isFrench ? "Aperçu Exécutif & Objectifs" : "Executive Overview & Objectives"}
            </h3>
            <div style="font-size: 0.82rem; color: #d4d4d8; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
              ${summaryData.overview}
            </div>
          </div>

          <!-- Section 2: Formulations & LaTeX Math -->
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin: 0 0 10px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>📐</span> 2. ${isFrench ? "Formules Clés & Équations Mathématiques" : "Key Formulas & STEM Equations"}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${summaryData.formulas.map(f => {
                let formulaHtml = f.eq;
                if (window.katex && typeof window.katex.renderToString === "function") {
                  try {
                    formulaHtml = window.katex.renderToString(f.eq, { displayMode: true, throwOnError: false });
                  } catch (err) {
                    console.warn("KaTeX render error:", err);
                    formulaHtml = `\\[${f.eq}\\]`;
                  }
                } else {
                  formulaHtml = `\\[${f.eq}\\]`;
                }
                return `
                  <div style="background: #121218; border: 1px solid #27272a; border-radius: 8px; padding: 10px 14px;">
                    <div style="font-size: 0.7rem; color: #a1a1aa; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                      • ${f.label}
                    </div>
                    <div class="summary-katex-formula" style="font-size: 0.95rem; color: #f4f4f5; padding: 4px 0; overflow-x: auto;">
                      ${formulaHtml}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Section 3: Critical Concepts & Definitions -->
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin: 0 0 10px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>💡</span> 3. ${isFrench ? "Concepts Clés & Définitions" : "Critical Concepts & Key Terms"}
            </h3>
            <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: #d4d4d8; display: flex; flex-direction: column; gap: 8px;">
              ${summaryData.concepts.map(c => `<li>${c}</li>`).join("")}
            </ul>
          </div>

          <!-- Section 4: Actionable Takeaways -->
          <div>
            <h3 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin: 0 0 10px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>🎯</span> 4. ${isFrench ? "Points Retenus & Applications" : "Actionable Summary & Takeaways"}
            </h3>
            <div style="background: rgba(168, 85, 247, 0.06); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 12px;">
              <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: #e4e4e7; display: flex; flex-direction: column; gap: 6px;">
                ${summaryData.takeaways.map(t => `<li>${t}</li>`).join("")}
              </ul>
            </div>
          </div>
        `;

        container.innerHTML = html;

        // Render inline KaTeX LaTeX expressions inside summary pane if fallback needed
        if (typeof renderMathInElement === "function") {
          try {
            renderMathInElement(container, {
              delimiters: [
                { left: "\\[", right: "\\]", display: true },
                { left: "\\(", right: "\\)", display: false }
              ],
              throwOnError: false
            });
          } catch (e) {
            console.warn("[SUMMARY_KATEX] renderMathInElement warning:", e);
          }
        }
      }

      """
    txt = txt[:start_idx] + new_render_func + txt[end_idx:]
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully updated renderVideoSummary with katex.renderToString!")
else:
    print("Could not find markers!")
