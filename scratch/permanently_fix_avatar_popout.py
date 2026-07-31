import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_pip_block = """      async function toggleAvatarPopout() {
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
          }

          // Fallback: Standard HTML5 Video Picture-in-Picture
          try {
            const canvasEl = document.getElementById("spatiusAvatarCanvas");
            const imgEl = document.getElementById("socraticAvatarImg");
            let streamCanvas = canvasEl;

            if (imgEl && imgEl.style.display !== "none") {
              // Create temporary canvas to capture fallback static image
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = 240;
              tempCanvas.height = 280;
              const ctx = tempCanvas.getContext("2d");
              streamCanvas = tempCanvas;

              fallbackDrawInterval = setInterval(() => {
                if (imgEl.complete && imgEl.naturalWidth > 0) {
                  ctx.drawImage(
                    imgEl,
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height,
                  );
                } else {
                  ctx.fillStyle = "#08080a";
                  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
              }, 100);
            }

            const stream = streamCanvas.captureStream(15);
            let pipVideo = document.getElementById("fallbackPipVideo");
            if (!pipVideo) {
              pipVideo = document.createElement("video");
              pipVideo.id = "fallbackPipVideo";
              pipVideo.muted = true;
              pipVideo.playsInline = true;
              pipVideo.style.display = "none";
              document.body.appendChild(pipVideo);
            }

            pipVideo.srcObject = stream;
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();

            pipVideo.addEventListener("leavepictureinpicture", () => {
              exitPictureInPicture();
            });

            showToastNotification(
              "Picture-in-Picture Active",
              "Tutor stream is now floating on top.",
            );
          } catch (e) {
            console.error("Video PiP Fallback failed:", e);
            showToastNotification(
              "PiP Error",
              "Your browser does not support always-on-top floating windows.",
            );
          }
        } else {
          exitPictureInPicture();
        }
      }

      function exitPictureInPicture() {
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
          }

          const pipVideo = document.getElementById("fallbackPipVideo");
          if (pipVideo) {
            try {
              if (document.pictureInPictureElement === pipVideo) {
                document.exitPictureInPicture();
              }
            } catch (e) {}
            pipVideo.remove();
          }

          // If screensharing was active when the floating window was closed, stop screensharing
          if (isScreenSharingActive) {
            stopScreenShareProgrammatically();
          }
        } catch (e) {
          console.error("Error exiting PiP:", e);
        }
      }"""

new_pip_block = """      let pipWindow = null;
      let fallbackDrawInterval = null;
      let isExitingPip = false;

      async function toggleAvatarPopout() {
        if (pipWindow || document.pictureInPictureElement) {
          exitPictureInPicture();
        } else {
          showFloatingScreenShareAvatar(true);
        }
      }

      async function showFloatingScreenShareAvatar(show) {
        isExitingPip = false;
        let avatarBox = document.getElementById("avatarImgBox");
        if (!avatarBox) return;

        if (show && pipWindow) {
          try {
            pipWindow.close();
          } catch (e) {}
          pipWindow = null;
        }

        const widget = document.getElementById("floatingScreenShareWidget");
        const targetContainer = document.getElementById("floatingAvatarImgContainer");

        window.wasWorkspaceActiveBeforePip = window.isWorkspaceActive;
        if (show) {
          if (widget) widget.style.display = "flex";
          if (targetContainer) {
            targetContainer.appendChild(avatarBox);
          }

          // Document Picture-in-Picture (Chrome / Edge always-on-top window)
          if ("documentPictureInPicture" in window) {
            try {
              pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 246,
                height: 286,
              });

              [...document.styleSheets].forEach((styleSheet) => {
                try {
                  const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
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

              pipWindow.document.body.style.background = "#0c0c0e";
              pipWindow.document.body.style.margin = "0";
              pipWindow.document.body.style.display = "flex";
              pipWindow.document.body.style.alignItems = "center";
              pipWindow.document.body.style.justifyContent = "center";
              pipWindow.document.body.style.overflow = "hidden";

              pipWindow.document.body.appendChild(avatarBox);

              if (widget) widget.style.display = "none";

              const btn = pipWindow.document.getElementById("popoutAvatarBtn") || document.getElementById("popoutAvatarBtn");
              if (btn) btn.innerHTML = "🗗 Dock Back";

              if (window.spatiusAvatarManager) {
                window.spatiusAvatarManager.stopAvatar().then(() => {
                  window.spatiusAvatarManager.startAvatar();
                });
              }

              pipWindow.addEventListener("pagehide", () => {
                exitPictureInPicture();
              });

              showToastNotification(
                "Picture-in-Picture Active",
                "Tutor avatar is now floating on top of your screen.",
              );
              return;
            } catch (err) {
              console.error("Document PiP request failed, falling back to Video PiP:", err);
            }
          }

          // Fallback Video PiP
          try {
            const canvasEl = document.getElementById("spatiusAvatarCanvas");
            const imgEl = document.getElementById("socraticAvatarImg");
            let streamCanvas = canvasEl;

            if (imgEl && imgEl.style.display !== "none") {
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = 240;
              tempCanvas.height = 280;
              const ctx = tempCanvas.getContext("2d");
              streamCanvas = tempCanvas;

              fallbackDrawInterval = setInterval(() => {
                if (imgEl.complete && imgEl.naturalWidth > 0) {
                  ctx.drawImage(imgEl, 0, 0, tempCanvas.width, tempCanvas.height);
                } else {
                  ctx.fillStyle = "#08080a";
                  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
              }, 100);
            }

            const stream = streamCanvas.captureStream(15);
            let pipVideo = document.getElementById("fallbackPipVideo");
            if (!pipVideo) {
              pipVideo = document.createElement("video");
              pipVideo.id = "fallbackPipVideo";
              pipVideo.muted = true;
              pipVideo.playsInline = true;
              pipVideo.style.display = "none";
              document.body.appendChild(pipVideo);
            }

            pipVideo.srcObject = stream;
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();

            pipVideo.addEventListener("leavepictureinpicture", () => {
              exitPictureInPicture();
            });

            showToastNotification("Picture-in-Picture Active", "Tutor stream is now floating on top.");
          } catch (e) {
            console.error("Video PiP Fallback failed:", e);
          }
        } else {
          exitPictureInPicture();
        }
      }

      function exitPictureInPicture() {
        if (isExitingPip) return;
        isExitingPip = true;
        try {
          let avatarBox = document.getElementById("avatarImgBox") || (pipWindow && pipWindow.document.getElementById("avatarImgBox"));
          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
          const statusIndicator = document.getElementById("tutorStatusIndicator");
          const widget = document.getElementById("floatingScreenShareWidget");

          // 1. REPARENT AVATAR BACK TO MAIN WORKSPACE BEFORE CLOSING PIP WINDOW
          if (wsPanel && avatarBox) {
            if (avatarBox.ownerDocument !== document) {
              try {
                avatarBox = document.adoptNode(avatarBox);
              } catch (e) {
                console.warn("[AVATAR ADOPT NODE WARN]", e);
              }
            }
            wsPanel.style.display = "flex";
            avatarBox.style.display = "block";
            if (statusIndicator) {
              wsPanel.insertBefore(avatarBox, statusIndicator);
            } else {
              wsPanel.appendChild(avatarBox);
            }
          }

          // 2. NOW SAFELY CLOSE PIP WINDOW
          if (pipWindow) {
            const win = pipWindow;
            pipWindow = null;
            try {
              win.close();
            } catch (e) {}
          }

          if (fallbackDrawInterval) {
            clearInterval(fallbackDrawInterval);
            fallbackDrawInterval = null;
          }

          if (widget) widget.style.display = "none";

          const btn = document.getElementById("popoutAvatarBtn");
          if (btn) btn.innerHTML = "🗗 Popout";

          // 3. SHOW SPLIT WORKSPACE PANE
          const workspacePane = document.getElementById("socraticWorkspacePane");
          if (workspacePane && (window.wasWorkspaceActiveBeforePip || window.isWorkspaceActive)) {
            const dashboardPane = document.getElementById("dashboardPane");
            if (dashboardPane) dashboardPane.classList.remove("active");
            workspacePane.classList.add("active");
            window.isWorkspaceActive = true;
          }

          // 4. REBUILD WEBGL CONTEXT (AGENTS.md Rule 3)
          if (window.spatiusAvatarManager) {
            window.spatiusAvatarManager.stopAvatar().then(() => {
              window.spatiusAvatarManager.startAvatar();
            });
          }

          const pipVideo = document.getElementById("fallbackPipVideo");
          if (pipVideo) {
            try {
              if (document.pictureInPictureElement === pipVideo) {
                document.exitPictureInPicture();
              }
            } catch (e) {}
            pipVideo.remove();
          }

          if (isScreenSharingActive) {
            stopScreenShareProgrammatically();
          }
        } catch (e) {
          console.error("Error exiting PiP:", e);
        } finally {
          setTimeout(() => {
            isExitingPip = false;
          }, 150);
        }
      }"""

if old_pip_block in txt:
    txt = txt.replace(old_pip_block, new_pip_block)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully permanently fixed avatar popout logic in index.html!")
