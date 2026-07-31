import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update Tab button 4 text from Timestamps to Sommaire
old_tab_btn = """          <button
            class="sidebar-tab-btn"
            onclick="switchSidebarTab('timestamps', this)"
          >
            Timestamps
          </button>"""

new_tab_btn = """          <button
            class="sidebar-tab-btn"
            onclick="switchSidebarTab('timestamps', this)"
          >
            Sommaire
          </button>"""

txt = txt.replace(old_tab_btn, new_tab_btn)

# 2. Update UI_LOCALIZATIONS nav_timestamps mapping
old_loc_en = '"nav_timestamps": "Timestamps"'
new_loc_en = '"nav_timestamps": "Summary"'
txt = txt.replace(old_loc_en, new_loc_en)

old_loc_fr = '"nav_timestamps": "Horodatages"'
new_loc_fr = '"nav_timestamps": "Sommaire"'
txt = txt.replace(old_loc_fr, new_loc_fr)

# 3. Replace timestamps-pane HTML to contain summaryDocumentContainer
old_pane_html = """          <!-- TAB 4: TIMESTAMPS -->
          <div
            class="sidebar-tab-pane"
            id="timestamps-pane"
            style="
              display: none;
              background-color: #000000;
              padding: 12px;
              height: 100%;
              box-sizing: border-box;
              overflow-y: auto;
            "
          >
            <div
              class="terminal-timeline-header"
              style="
                font-family: &quot;Geist&quot;, monospace;
                font-size: 0.7rem;
                color: #666666;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-bottom: 1px solid #1a1a1a;
                padding-bottom: 8px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <span>Index Landmark</span>
              <span>Time</span>
            </div>
            <div
              style="display: flex; flex-direction: column; gap: 0"
              id="timestampChaptersList"
            >
              <!-- Timestamps dynamically injected based on track -->
            </div>
          </div>"""

new_pane_html = """          <!-- TAB 4: SOMMAIRE / EXECUTIVE SUMMARY -->
          <div
            class="sidebar-tab-pane"
            id="timestamps-pane"
            style="
              display: none;
              background-color: #0d0d0f;
              padding: 16px;
              height: 100%;
              box-sizing: border-box;
              overflow-y: auto;
            "
          >
            <div id="summaryDocumentContainer">
              <!-- Executive Summary dynamically injected via renderVideoSummary() -->
            </div>
          </div>"""

txt = txt.replace(old_pane_html, new_pane_html)

# 4. Insert renderVideoSummary implementation
render_summary_impl = r"""
      function renderVideoSummary(videoId) {
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
              ? "Examen approfondi du comportement des <u>cations d'alkylammonium (R-NH3+)</u> en solution aqueuse. Le cours démontre qu'ils se comportent comme des acides faibles en cédant partiellement un proton à l'eau pour former l'amine correspondante (R-NH2) et des ions hydronium (H3O+)."
              : "In-depth examination of <u>alkylammonium cations (R-NH3+)</u> in aqueous solution. Demonstrates their behavior as weak acids donating a proton to water, generating the corresponding amine (R-NH2) and hydronium ions (H3O+).",
            formulas: [
              { label: isFrench ? "Équilibre d'Acide Faible en Solution" : "Weak Acid Equilibrium in Solution", eq: "\\text{R-NH}_3^+ + \\text{H}_2\\text{O} \\rightleftharpoons \\text{R-NH}_2 + \\text{H}_3\\text{O}^+" },
              { label: isFrench ? "Constante d'Acidité (Ka)" : "Acid Dissociation Constant (Ka)", eq: "K_a = \\frac{[\\text{R-NH}_2] [\\text{H}_3\\text{O}^+]}{[\\text{R-NH}_3^+]}" }
            ],
            concepts: isFrench ? [
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

        let formulasHtml = "";
        if (summaryData.formulas && summaryData.formulas.length > 0) {
          formulasHtml = `
            <div style="margin-top: 14px; margin-bottom: 14px; padding: 12px; background: #141418; border-radius: 8px; border: 1px solid #24242a;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #a855f7; font-weight: 700; margin-bottom: 10px;">
                📐 ${isFrench ? "Formules & Modèles Clés" : "Key Formulas & Models"}
              </div>
              ${summaryData.formulas.map(f => {
                let renderedEq = f.eq;
                if (window.katex && typeof window.katex.renderToString === "function") {
                  try {
                    renderedEq = window.katex.renderToString(f.eq, { displayMode: true, throwOnError: false });
                  } catch (e) {
                    console.warn("KaTeX render error:", e);
                  }
                }
                return `
                  <div style="margin-bottom: 10px; padding: 8px; background: #09090b; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #a1a1aa; margin-bottom: 4px; font-weight: 600;">${f.label}</div>
                    <div style="color: #ffffff; font-size: 0.95rem; overflow-x: auto;">${renderedEq}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
        }

        let conceptsHtml = "";
        if (summaryData.concepts && summaryData.concepts.length > 0) {
          conceptsHtml = `
            <div style="margin-bottom: 14px;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #3b82f6; font-weight: 700; margin-bottom: 8px;">
                💡 ${isFrench ? "Notions Fondamentales" : "Key Concepts"}
              </div>
              <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 0.82rem; line-height: 1.5;">
                ${summaryData.concepts.map(c => `<li style="margin-bottom: 6px;">${c}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        let takeawaysHtml = "";
        if (summaryData.takeaways && summaryData.takeaways.length > 0) {
          takeawaysHtml = `
            <div style="margin-bottom: 10px;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #22c55e; font-weight: 700; margin-bottom: 8px;">
                ✅ ${isFrench ? "Points à Retenir" : "Key Takeaways"}
              </div>
              <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 0.82rem; line-height: 1.5;">
                ${summaryData.takeaways.map(t => `<li style="margin-bottom: 6px;">${t}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        container.innerHTML = `
          <div style="font-family: 'Hanken Grotesk', sans-serif; color: #e4e4e7;">
            <div style="border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 12px;">
              <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff; line-height: 1.3;">${summaryData.title}</div>
              <div style="font-size: 0.75rem; color: #a1a1aa; margin-top: 4px;">${summaryData.subtitle} • ${instructor}</div>
            </div>
            
            <div style="font-size: 0.83rem; line-height: 1.55; color: #d4d4d8; margin-bottom: 14px; background: #121215; padding: 10px; border-radius: 6px; border-left: 3px solid #a855f7;">
              ${summaryData.overview}
            </div>

            ${formulasHtml}
            ${conceptsHtml}
            ${takeawaysHtml}
          </div>
        `;
      }
"""

# Insert renderVideoSummary right before function switchSidebarTab
marker = "function switchSidebarTab("
idx = txt.find(marker)
if idx != -1:
    txt = txt[:idx] + render_summary_impl + "\n\n      " + txt[idx:]
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully replaced Timestamps pane with authentic Sommaire / Summary panel in index.html!")
else:
    print("Could not find switchSidebarTab marker!")
