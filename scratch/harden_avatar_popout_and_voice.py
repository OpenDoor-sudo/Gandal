import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Inject Popout Button into avatarImgBox
old_avatar_box_inner = '<img\n                  id="socraticAvatarImg"'

new_avatar_box_inner = """<button
                  id="popoutAvatarBtn"
                  onclick="toggleAvatarPopout()"
                  title="Popout Avatar to Floating Window"
                  style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 20;
                    background: rgba(15, 15, 20, 0.85);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(168, 85, 247, 0.5);
                    color: #ffffff;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    transition: all 0.2s ease;
                  "
                >
                  🗗 Popout
                </button>
                <img
                  id="socraticAvatarImg\""""

if old_avatar_box_inner in txt:
    txt = txt.replace(old_avatar_box_inner, new_avatar_box_inner)

# 2. Add toggleAvatarPopout function & harden exitPictureInPicture
popout_funcs = """      let lastAvatarParentId = "socraticWorkspaceAvatarPanel";

      async function toggleAvatarPopout() {
        if (pipWindow) {
          exitPictureInPicture();
        } else {
          showFloatingScreenShareAvatar(true);
        }
      }"""

if "function toggleAvatarPopout" not in txt:
    start_pip = txt.find("let pipWindow = null;")
    if start_pip != -1:
        txt = txt[:start_pip] + popout_funcs + "\n\n      " + txt[start_pip:]

# 3. Harden exitPictureInPicture so closing PiP always returns avatar to socraticWorkspaceAvatarPanel
old_exit_pip = """          if (window.isWorkspaceActive && originalParent && avatarBox && statusIndicator) {
            originalParent.insertBefore(avatarBox, statusIndicator);
            if (widget) widget.style.display = "none";
          } else if (avatarBox && floatingContainer && widget) {
            floatingContainer.appendChild(avatarBox);
            widget.style.display = "flex";
          }"""

new_exit_pip = """          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
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

if old_exit_pip in txt:
    txt = txt.replace(old_exit_pip, new_exit_pip)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully hardened avatar popout & return to split panel workspace!")
