import os, re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update toggleTextbook() to pause when opening, unpause when closing, and NOT reset video.src
old_toggle_tb = """      function toggleTextbook() {
        const panel = document.getElementById("pdfViewerPanel");
        if (!panel) return;
        panel.classList.toggle("active");

        if (panel.classList.contains("active")) {
          const currentVideoId =
            window.ACTIVE_DATABASE_VIDEO_ID || activeVideoId;
          if (currentVideoId) {
            loadTextbookPDF(currentVideoId);
          }
        }
      }"""

new_toggle_tb = """      function toggleTextbook() {
        const panel = document.getElementById("pdfViewerPanel");
        if (!panel) return;
        const isOpen = panel.classList.toggle("active");
        const video = document.getElementById("lectureVideoPlayer");

        if (isOpen) {
          // Pause main lecture video while reading textbook drawer
          if (video && !video.paused) {
            video.pause();
          }
        } else {
          // Resume / unpause video when closing textbook drawer
          if (video && video.paused) {
            video.play().catch((e) => console.log("[PLAY_DEBUG] Unpause on drawer close blocked:", e));
          }
        }
      }"""

txt = txt.replace(old_toggle_tb, new_toggle_tb)

# 2. Update Return to Video button / close split workspace to unpause video
old_return_video = """        // Transition back to main dashboard
        if (workspacePane && dashboardPane) {
          workspacePane.classList.remove("active");
          dashboardPane.classList.add("active");
          window.isWorkspaceActive = false;
        }"""

new_return_video = """        // Transition back to main dashboard
        if (workspacePane && dashboardPane) {
          workspacePane.classList.remove("active");
          dashboardPane.classList.add("active");
          window.isWorkspaceActive = false;
        }
        const mainVideo = document.getElementById("lectureVideoPlayer");
        if (mainVideo && mainVideo.paused) {
          mainVideo.play().catch((e) => console.log("[PLAY_DEBUG] Unpause on return from workspace blocked:", e));
        }"""

if old_return_video in txt:
    txt = txt.replace(old_return_video, new_return_video)

# 3. Deduplicate custom books in addCustomBookToUI so Gracian / Chemistry are never repeated
old_custom_book = """        if (bookList) {
          // Check if already exists
          if (document.getElementById(book.id)) return;"""

new_custom_book = """        if (bookList) {
          // Check if already exists by element ID or matching file name
          if (document.getElementById(book.id)) return;
          const existingNames = Array.from(document.querySelectorAll(".book-name")).map(el => el.innerText.trim().toLowerCase());
          const cleanBookName = (book.name || "").trim().toLowerCase();
          if (existingNames.includes(cleanBookName) || existingNames.includes(cleanBookName.replace(".pdf", ""))) return;"""

txt = txt.replace(old_custom_book, new_custom_book)

# Also deduplicate userLessons in loadLibrary
old_user_lessons = """          // All available curriculum & imported lessons
          const userLessons = lessons.filter((l) => l && l.pdf_file_path);"""

new_user_lessons = """          // All available curriculum & imported lessons (deduplicated by PDF path)
          const seenPdfPaths = new Set();
          const userLessons = lessons.filter((l) => {
            if (!l || !l.pdf_file_path) return false;
            const normPath = l.pdf_file_path.toLowerCase().trim();
            if (seenPdfPaths.has(normPath)) return false;
            seenPdfPaths.add(normPath);
            return true;
          });"""

txt = txt.replace(old_user_lessons, new_user_lessons)

# 4. Clean up Chemistry concepts & takeaways in renderVideoSummary for clean formatting
old_chem_concepts = """            concepts: isFrench ? [
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

new_chem_concepts = """            concepts: isFrench ? [
              "<u>Cation Alkylammonium [R-NH<sub>3</sub><sup>+</sup>]</u> : Acide faible conjugué d'une amine, capable de céder un proton à l'eau.",
              "<u>Réaction Réversible</u> : Réaction incomplète caractérisée par la présence simultanée des réactifs et des produits à l'équilibre.",
              "<u>Concentrations Équivalentes</u> : À l'équilibre, la concentration des produits formés <b>[R-NH<sub>2</sub>]</b> et <b>[H<sub>3</sub>O<sup>+</sup>]</b> est rigoureusement identique."
            ] : [
              "<u>Alkylammonium Cation [R-NH<sub>3</sub><sup>+</sup>]</u> : Weak conjugate acid of an amine capable of donating a proton to water.",
              "<u>Reversible Reaction</u> : Incomplete reaction characterized by simultaneous presence of reactants and products at equilibrium.",
              "<u>Equal Product Concentrations</u> : At equilibrium, concentrations of generated <b>[R-NH<sub>2</sub>]</b> and <b>[H<sub>3</sub>O<sup>+</sup>]</b> are identical."
            ],
            takeaways: isFrench ? [
              "Identifier le couple acide/base <b>R-NH<sub>3</sub><sup>+</sup> / R-NH<sub>2</sub></b> dans l'équation de réaction.",
              "Calculer le pH et le degré de dissociation de l'acide faible à partir de sa constante <i>K<sub>a</sub></i>.",
              "Vérifier la conservation de la masse et des charges lors de la formation des ions hydronium (H<sub>3</sub>O<sup>+</sup>)."
            ] : [
              "Identify the conjugate acid/base pair <b>R-NH<sub>3</sub><sup>+</sup> / R-NH<sub>2</sub></b> in the reaction equation.",
              "Calculate pH and dissociation fraction of the weak acid using constant <i>K<sub>a</sub></i>.",
              "Verify mass and charge balance during hydronium ion formation (H<sub>3</sub>O<sup>+</sup>)."
            ]"""

txt = txt.replace(old_chem_concepts, new_chem_concepts)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied book pause/unpause, deduplication, and KaTeX chemical formatting fixes!")
