import re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Replace renderVideoSummary implementation in index.html
old_func_start = 'function renderVideoSummary(videoId) {'
old_func_end = '// Build Microsoft Word-Style Formatted HTML'

pattern = r'function renderVideoSummary\(videoId\) \{.*?(?=\s*// Build Microsoft Word-Style Formatted HTML)'

new_render_func = """function renderVideoSummary(videoId) {
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
              { label: isFrench ? "Accroissement Naturel" : "Natural Population Growth", eq: "\\[\\text{Taux d'Accroissement} = \\text{Taux de Natalité} - \\text{Taux de Mortalité}\\]" },
              { label: isFrench ? "Modèle Malthusien (Subsistance vs Population)" : "Malthusian Model (Subsistence vs Population)", eq: "\\[\\text{Population (Géométrique)} \\gg \\text{Subsistances (Arithmétique)} \\implies \\text{Pauvreté}\\]" }
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
              { label: isFrench ? "Équilibre d'Acide Faible en Solution" : "Weak Acid Equilibrium in Solution", eq: "\\[\\text{R-NH}_3^+ + \\text{H}_2\\text{O} \\rightleftharpoons \\text{R-NH}_2 + \\text{H}_3\\text{O}^+\\]" },
              { label: isFrench ? "Constante d'Acidité (Ka)" : "Acid Dissociation Constant (Ka)", eq: "\\[K_a = \\frac{[\\text{R-NH}_2] [\\text{H}_3\\text{O}^+]}{[\\text{R-NH}_3^+]}\\]" }
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
              { label: isFrench ? "Définition de la Dérivée" : "Definition of the Derivative", eq: "\\[\\frac{df}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}\\]" },
              { label: isFrench ? "Équation de la Tangente" : "Equation of the Tangent Line", eq: "\\[y - f(x_0) = f'(x_0)(x - x_0)\\]" }
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
        } else if (activeVideo === "vid_physics_01" || activeVideo.includes("physics")) {
          summaryData = {
            title: isFrench ? "Physique : Oscillateurs Harmoniques & Dynamique" : "Physics: Harmonic Oscillators & Dynamics",
            subtitle: isFrench ? "Module Physique • Mécanique Classique & Ondes" : "Physics Module • Classical Mechanics & Waves",
            overview: isFrench
              ? "Cette session couvre les <u>systèmes d'oscillations harmoniques simples</u>, l'énergie mécanique conservée, et la modélisation mathématique du mouvement périodique."
              : "This session covers <u>simple harmonic oscillator systems</u>, conserved mechanical energy, and periodic motion modeling.",
            formulas: [
              { label: isFrench ? "Équation Différentielle de l'Oscillateur" : "Harmonic Oscillator Differential Equation", eq: "\\[\\frac{d^2 x}{dt^2} + \\omega^2 x = 0\\]" },
              { label: isFrench ? "Fréquence Angulaire Propre" : "Natural Angular Frequency", eq: "\\[\\omega = \\sqrt{\\frac{k}{m}}\\]" }
            ],
            concepts: isFrench ? [
              "<u>Amplitude \\(A\\)</u> : Déplacement maximal de la masse à partir de sa position d'équilibre.",
              "<u>Période \\(T\\)</u> : Temps requis pour accomplir une oscillation complète : \\(T = \\frac{2\\pi}{\\omega}\\)."
            ] : [
              "<u>Amplitude \\(A\\)</u> : Maximum displacement of mass from equilibrium position.",
              "<u>Period \\(T\\)</u> : Time taken for one complete cycle: \\(T = \\frac{2\\pi}{\\omega}\\)."
            ],
            takeaways: isFrench ? [
              "L'énergie totale reste constante en l'absence de frottement.",
              "Le transfert d'énergie oscille entre énergie cinétique et potentielle."
            ] : [
              "Total energy remains constant in conservative systems.",
              "Energy shifts between kinetic and potential forms."
            ]
          };
        } else if (activeVideo === "vid_philosophy_01" || activeVideo.includes("philosophy")) {
          summaryData = {
            title: isFrench ? "Philosophie : Éthique Stoïcienne & Dialogue Socratique" : "Philosophy: Stoic Ethics & Socratic Dialogue",
            subtitle: isFrench ? "Module Philosophie • Éthique & Logique" : "Philosophy Module • Ethics & Logic",
            overview: isFrench
              ? "Analyse rigoureuse de la <u>dichotomie du contrôle stoïcienne</u>, de la méthode de réfutation socratique et des fondements de la vertu."
              : "Rigorous study of the <u>Stoic dichotomy of control</u>, Socratic elenchus method, and foundational virtue ethics.",
            formulas: [
              { label: isFrench ? "Axiome du Contrôle Stoïcien" : "Stoic Axiom of Control", eq: "\\[D(x) = \\begin{cases} 1 & \\text{si } x \\in \\text{Actions Interne} \\\\ 0 & \\text{si } x \\in \\text{Événements Externe} \\end{cases}\\]" }
            ],
            concepts: isFrench ? [
              "<u>Dichotomie du Contrôle</u> : Distinguer ce qui dépend de notre volonté de ce qui n'en dépend pas.",
              "<u>Élenchos Socratique</u> : Méthode d'interrogation visant à révéler les incohérences logiques."
            ] : [
              "<u>Dichotomy of Control</u> : Differentiation between internal choices and external variables.",
              "<u>Socratic Elenchus</u> : Systematic cross-examination to uncover logical inconsistencies."
            ],
            takeaways: isFrench ? [
              "Focaliser son énergie sur les jugements et intentions internes.",
              "Tester la solidité de chaque affirmation par le questionnement socratique."
            ] : [
              "Focus mental energy exclusively on internal judgments.",
              "Test the validity of every premise."
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
              { label: isFrench ? "Taux d'Accroissement" : "Growth Rate", eq: "\\[\\text{Accroissement} = \\text{Natalité} - \\text{Mortalité}\\]" }
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
        }"""

txt = re.sub(pattern, new_render_func, txt, flags=re.DOTALL)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated renderVideoSummary in index.html with authentic Economics & Chemistry content!")
