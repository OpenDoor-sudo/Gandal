# Project-Specific Rules & Guidelines for Ventuno AI Workspace

These rules configure and maintain the custom implementations for the Socratic Tutor system in this workspace.

## 1. Socratic Voice Agent Configuration
* **Model Preference**: Match the verified `OpenDoor-sudo/VentunoGandal` voice implementation: Gemini 3.1 Flash Live (`gemini-3.1-flash-live-preview`) with `generate_reply(user_input=...)`. The greeting must only be triggered after the student's audio track is subscribed.
* **LiveKit Google Plugin Compatibility**: Because `gemini-3.1-flash-live-preview` disables mutable chat contexts by default, `tutor_agent.py` enables `mutable_chat_context` and `mutable_instructions` on the model instance. Do not require a machine-specific `site-packages` edit.

## 2. Session & State Synchronization
* **Absolute Path Constraint**: Both the Python scripts (e.g., [display_client.py](file:///c:/Users/lalyb/Desktop/ventuno_ai_testbed/display_client.py)) and the tutor agent scripts must sync using the absolute path `SESSION_JSON_PATH = "c:/Users/lalyb/Desktop/ventuno_ai_testbed/active_session.json"` to prevent mismatches in working directories when run from different startup environments.

## 3. Tutor Avatar & WebGL Context Management
* **WebGL Context Preservation**: Moving a `<canvas>` element containing a WebGL context in the DOM tree causes the browser to destroy the WebGL context, resulting in a black/missing 3D avatar.
* **Reparenting Rule**: Whenever `#avatarImgBox` is reparented (e.g., when entering Document Picture-in-Picture or returning to `#socraticWorkspaceAvatarPanel` inside the split workspace panel), the Spatius manager must be cleanly stopped and restarted to rebuild the WebGL context on the canvas:
  ```javascript
  if (window.spatiusAvatarManager) {
      window.spatiusAvatarManager.stopAvatar().then(() => {
          window.spatiusAvatarManager.startAvatar();
      });
  }
  ```
* **Picture-in-Picture Synchronization**: If the user closes the picture-in-picture window manually via browser window control, it must stop screensharing in LiveKit to keep UI state in sync.

## 4. UI Elements and Profile Customizations
* **Interests & Tracks list**: All education levels (including College Level, Independent Learner, and Professional Certificates) must remain unfiltered and visible under the interests list in the profile modal in `index.html`.
* **Screen Share Button Highlight**: Clicking the microphone button must show and highlight (`ready-highlight` class) the `#screenShareBtn` immediately in the connecting state to secure browser user-gesture requirements.
