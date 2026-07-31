import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update toggleAvatarPopout & showFloatingScreenShareAvatar & exitPictureInPicture in index.html
old_pip_functions = """      async function toggleAvatarPopout() {
        if (pipWindow) {
          exitPictureInPicture();
        } else {
          showFloatingScreenShareAvatar(true);
        }
      }

      let pipWindow = null;
      let fallbackDrawInterval = null;
      let isExitingPip = false;

      async function showFloatingScreenShareAvatar(show) {
        const avatarBox = document.getElementById("avatarImgBox");
        if (!avatarBox) return;

        if (show && pipWindow) {
          try {
            pipWindow.close();
          } catch (e) {}
          pipWindow = null;
        }

        const widget = document.getElementById("floatingScreenShareWidget");
        const targetContainer = document.getElementById(
          "floatingAvatarImgContainer",
        );

        window.wasWorkspaceActiveBeforePip = window.isWorkspaceActive;
        if (show) {
          // Show the floating DOM widget
          if (widget) widget.style.display = "flex";
          if (targetContainer) {
            targetContainer.appendChild(avatarBox);
          }

          // Try Document Picture-in-Picture first (always-on-top DOM window)
          if ("documentPictureInPicture" in window) {
            try {
              pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 246,
                height: 286,
              });

              // Copy stylesheets to the PiP window to preserve styling
              [...document.styleSheets].forEach((styleSheet) => {
                try {
                  const cssRules = [...styleSheet.cssRules]
                    .map((rule) => rule.cssText)
                    .join("");
                  const style = document.createElement("style");
                  style.textContent = cssRules;
                  pipWindow.document.head.appendChild(style);
                } catch (e) {
                  const link = document.createElement("link");
                  link.rel = "stylesheet";
                  link.type = styleSheet.type;
                  link.media = styleSheet.media.mediaText;
                  link.href = styleSheet.href;
                  pipWindow.document.head.appendChild(link);
                }
              });

              // Style PiP document body
              pipWindow.document.body.style.background = "#0c0c0e";
              pipWindow.document.body.style.margin = "0";
              pipWindow.document.body.style.display = "flex";
              pipWindow.document.body.style.alignItems = "center";
              pipWindow.document.body.style.justifyContent = "center";
              pipWindow.document.body.style.overflow = "hidden";

              // Append avatar container into the PiP body
              pipWindow.document.body.appendChild(avatarBox);

              // Hide the background DOM widget container on the main page while native PiP is open
              if (widget) widget.style.display = "none";

              // Update popout button label
              const btn = document.getElementById("popoutAvatarBtn");
              if (btn) btn.innerHTML = "🗗 Dock Back";

              // Restart the Spatius avatar to recreate WebGL context in the new window
              if (window.spatiusAvatarManager) {
                window.spatiusAvatarManager.stopAvatar().then(() => {
                  window.spatiusAvatarManager.startAvatar();
                });
              }

              // Listen for close event before the document unloads to reparent correctly
              pipWindow.addEventListener("pagehide", () => {
                exitPictureInPicture();
              });
              pipWindow.addEventListener("beforeunload", () => {
                exitPictureInPicture();
              });

              showToastNotification(
                "Picture-in-Picture Active",
                "Tutor avatar is now floating on top of your screen.",
              );
              return;
            } catch (err) {
              console.error(
                "Document PiP request failed, falling back to Video PiP:",
                err,
              );
            }
          }"""

new_pip_functions = """      async function toggleAvatarPopout() {
        if (pipWindow) {
          exitPictureInPicture();
        } else {
          showFloatingScreenShareAvatar(true);
        }
      }

      let pipWindow = null;
      let fallbackDrawInterval = null;
      let isExitingPip = false;

      async function showFloatingScreenShareAvatar(show) {
        let avatarBox = document.getElementById("avatarImgBox");
        if (!avatarBox) return;

        if (show && pipWindow) {
          try {
            pipWindow.close();
          } catch (e) {}
          pipWindow = null;
        }

        const widget = document.getElementById("floatingScreenShareWidget");
        const targetContainer = document.getElementById(
          "floatingAvatarImgContainer",
        );

        window.wasWorkspaceActiveBeforePip = window.isWorkspaceActive;
        if (show) {
          // Show the floating DOM widget fallback
          if (widget) widget.style.display = "flex";
          if (targetContainer) {
            targetContainer.appendChild(avatarBox);
          }

          // Try Document Picture-in-Picture first (always-on-top DOM window)
          if ("documentPictureInPicture" in window) {
            try {
              pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 246,
                height: 286,
              });

              // Copy stylesheets to the PiP window to preserve styling
              [...document.styleSheets].forEach((styleSheet) => {
                try {
                  const cssRules = [...styleSheet.cssRules]
                    .map((rule) => rule.cssText)
                    .join("");
                  const style = document.createElement("style");
                  style.textContent = cssRules;
                  pipWindow.document.head.appendChild(style);
                } catch (e) {
                  const link = document.createElement("link");
                  link.rel = "stylesheet";
                  link.type = styleSheet.type;
                  link.media = styleSheet.media.mediaText;
                  link.href = styleSheet.href;
                  pipWindow.document.head.appendChild(link);
                }
              });

              // Style PiP document body
              pipWindow.document.body.style.background = "#0c0c0e";
              pipWindow.document.body.style.margin = "0";
              pipWindow.document.body.style.display = "flex";
              pipWindow.document.body.style.alignItems = "center";
              pipWindow.document.body.style.justifyContent = "center";
              pipWindow.document.body.style.overflow = "hidden";

              // Append avatar container into the PiP body
              pipWindow.document.body.appendChild(avatarBox);

              // Hide the background DOM widget container on the main page while native PiP is open
              if (widget) widget.style.display = "none";

              // Update popout button label
              const btn = pipWindow.document.getElementById("popoutAvatarBtn") || document.getElementById("popoutAvatarBtn");
              if (btn) btn.innerHTML = "🗗 Dock Back";

              // Restart the Spatius avatar to recreate WebGL context in the new window
              if (window.spatiusAvatarManager) {
                window.spatiusAvatarManager.stopAvatar().then(() => {
                  window.spatiusAvatarManager.startAvatar();
                });
              }

              // Listen for close event before the document unloads to reparent correctly
              pipWindow.addEventListener("pagehide", () => {
                exitPictureInPicture();
              });
              pipWindow.addEventListener("beforeunload", () => {
                exitPictureInPicture();
              });

              showToastNotification(
                "Picture-in-Picture Active",
                "Tutor avatar is now floating on top of your screen.",
              );
              return;
            } catch (err) {
              console.error(
                "Document PiP request failed, falling back to Video PiP:",
                err,
              );
            }
          }"""

if old_pip_functions in txt:
    txt = txt.replace(old_pip_functions, new_pip_functions)

# Update exitPictureInPicture to adoptNode back into main document cleanly
old_exit_pip = """      function exitPictureInPicture() {
        if (isExitingPip) return;
        isExitingPip = true;
        try {
          if (pipWindow) {
            try {
              pipWindow.close();
            } catch (e) {}
            pipWindow = null;
          }
          if (fallbackDrawInterval) {
            clearInterval(fallbackDrawInterval);
            fallbackDrawInterval = null;
          }

          const avatarBox = document.getElementById("avatarImgBox");
          const originalParent = document.getElementById(
            "socraticWorkspaceAvatarPanel",
          );
          const statusIndicator = document.getElementById(
            "tutorStatusIndicator",
          );
          const floatingContainer = document.getElementById(
            "floatingAvatarImgContainer",
          );
          const widget = document.getElementById("floatingScreenShareWidget");

          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
          if (wsPanel && avatarBox) {
            if (statusIndicator) {
              wsPanel.insertBefore(avatarBox, statusIndicator);
            } else {
              wsPanel.appendChild(avatarBox);
            }
          }
          if (widget) widget.style.display = "none";

          // Always return to split screen workspace if it was active or opened from workspace
          const workspacePane = document.getElementById("socraticWorkspacePane");
          if (workspacePane && (window.wasWorkspaceActiveBeforePip || window.isWorkspaceActive)) {
            const dashboardPane = document.getElementById("dashboardPane");
            if (dashboardPane) dashboardPane.classList.remove("active");
            workspacePane.classList.add("active");
            window.isWorkspaceActive = true;
          }

          // Restart the Spatius avatar to recreate WebGL context after reparenting (AGENTS.md Rule 3)
          if (window.spatiusAvatarManager) {
            window.spatiusAvatarManager.stopAvatar().then(() => {
              window.spatiusAvatarManager.startAvatar();
            });
          }"""

new_exit_pip = """      function exitPictureInPicture() {
        if (isExitingPip) return;
        isExitingPip = true;
        try {
          if (pipWindow) {
            try {
              pipWindow.close();
            } catch (e) {}
            pipWindow = null;
          }
          if (fallbackDrawInterval) {
            clearInterval(fallbackDrawInterval);
            fallbackDrawInterval = null;
          }

          let avatarBox = document.getElementById("avatarImgBox");
          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
          const statusIndicator = document.getElementById("tutorStatusIndicator");
          const widget = document.getElementById("floatingScreenShareWidget");

          // CRITICAL: Re-adopt node into main document if coming from PiP window context
          if (avatarBox && avatarBox.ownerDocument !== document) {
            try {
              avatarBox = document.adoptNode(avatarBox);
            } catch (e) {
              console.warn("[AVATAR ADOPT NODE WARNING]", e);
            }
          }

          if (wsPanel && avatarBox) {
            wsPanel.style.display = "flex";
            avatarBox.style.display = "block";
            if (statusIndicator) {
              wsPanel.insertBefore(avatarBox, statusIndicator);
            } else {
              wsPanel.appendChild(avatarBox);
            }
          }
          if (widget) widget.style.display = "none";

          // Restore Popout button text to 🗗 Popout
          const btn = document.getElementById("popoutAvatarBtn");
          if (btn) btn.innerHTML = "🗗 Popout";

          // Always return to split screen workspace if it was active or opened from workspace
          const workspacePane = document.getElementById("socraticWorkspacePane");
          if (workspacePane && (window.wasWorkspaceActiveBeforePip || window.isWorkspaceActive)) {
            const dashboardPane = document.getElementById("dashboardPane");
            if (dashboardPane) dashboardPane.classList.remove("active");
            workspacePane.classList.add("active");
            window.isWorkspaceActive = true;
          }

          // Restart the Spatius avatar to recreate WebGL context after reparenting (AGENTS.md Rule 3)
          if (window.spatiusAvatarManager) {
            window.spatiusAvatarManager.stopAvatar().then(() => {
              window.spatiusAvatarManager.startAvatar();
            });
          }"""

if old_exit_pip in txt:
    txt = txt.replace(old_exit_pip, new_exit_pip)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied avatar popout & document adoptNode hardening to index.html!")
