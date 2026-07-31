import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update toggleScreenShare options to enable Entire Screen / Desktop sharing
old_ss_call = "const pub = await lkRoom.localParticipant.setScreenShareEnabled(true);"
new_ss_call = """const pub = await lkRoom.localParticipant.setScreenShareEnabled(true, {
              audio: false,
              selfBrowserSurface: "include",
              surfaceSwitching: "include",
              displaySurface: "monitor"
            });"""

txt = txt.replace(old_ss_call, new_ss_call)

# Update screen share toast message
old_ss_toast = '"Your screen is visible. TIP: For best results, share a specific \'Window\' or \'Tab\' instead of \'Entire Screen\' to avoid infinite loops."'
new_ss_toast = '"Screen sharing active! You can share your Entire Screen / Desktop so GANDHO can see all your desktop books and files."'

txt = txt.replace(old_ss_toast, new_ss_toast)

# 2. Update showFloatingScreenShareAvatar to allow popout from anywhere and save workspace state
old_show_floating = """        if (show && !window.isWorkspaceActive) {"""
new_show_floating = """        window.wasWorkspaceActiveBeforePip = window.isWorkspaceActive;
        if (show) {"""

txt = txt.replace(old_show_floating, new_show_floating)

# Update event listeners in PiP window
old_pip_listener = """              pipWindow.addEventListener("beforeunload", () => {
                exitPictureInPicture();
              });"""

new_pip_listener = """              pipWindow.addEventListener("pagehide", () => {
                exitPictureInPicture();
              });
              pipWindow.addEventListener("beforeunload", () => {
                exitPictureInPicture();
              });"""

txt = txt.replace(old_pip_listener, new_pip_listener)

# 3. Update exitPictureInPicture to always return to socraticWorkspaceAvatarPanel and re-open workspace
old_exit_pip_body = """          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
          if (wsPanel && avatarBox && statusIndicator) {
            wsPanel.insertBefore(avatarBox, statusIndicator);
            if (widget) widget.style.display = "none";
          } else if (avatarBox && floatingContainer && widget) {
            floatingContainer.appendChild(avatarBox);
            widget.style.display = "flex";
          }

          // Ensure split screen workspace remains active if user opened from workspace
          const workspacePane = document.getElementById("socraticWorkspacePane");
          if (workspacePane && (window.isWorkspaceActive || lastAvatarParentId === "socraticWorkspaceAvatarPanel")) {
            const dashboardPane = document.getElementById("dashboardPane");
            if (dashboardPane) dashboardPane.classList.remove("active");
            workspacePane.classList.add("active");
            window.isWorkspaceActive = true;
          }"""

new_exit_pip_body = """          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
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
          }"""

txt = txt.replace(old_exit_pip_body, new_exit_pip_body)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully applied Popout button & Entire Screen sharing fixes to index.html!")
