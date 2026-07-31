import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

rocket_func = """      function triggerRocketCelebration(score) {
        let existing = document.getElementById("rocketCelebrationOverlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "rocketCelebrationOverlay";
        overlay.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(10, 10, 16, 0.88);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          animation: fadeInOverlay 0.5s ease forwards;
        `;

        overlay.innerHTML = `
          <style>
            @keyframes fadeInOverlay {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes launchRocket {
              0% { transform: translateY(120vh) scale(0.6) rotate(0deg); opacity: 0; }
              25% { opacity: 1; }
              65% { transform: translateY(-20vh) scale(1.3) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-140vh) scale(1.6) rotate(0deg); opacity: 0; }
            }
            @keyframes rocketThrust {
              0%, 100% { filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.9)); }
              50% { filter: drop-shadow(0 0 25px rgba(251, 191, 36, 1)) drop-shadow(0 0 60px rgba(249, 115, 22, 1)); }
            }
            @keyframes popBanner {
              0% { transform: scale(0.7); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes floatGlow {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            .rocket-anim-icon {
              position: absolute;
              bottom: 0;
              font-size: 7rem;
              z-index: 2;
              animation: launchRocket 3.2s cubic-bezier(0.25, 1, 0.5, 1) forwards, rocketThrust 0.2s infinite;
            }
            .celebration-card-content {
              position: relative;
              z-index: 10;
              background: linear-gradient(145deg, #181824, #0f0f17);
              border: 2px solid rgba(168, 85, 247, 0.5);
              box-shadow: 0 0 50px rgba(168, 85, 247, 0.3), 0 0 100px rgba(16, 185, 129, 0.2);
              border-radius: 24px;
              padding: 36px 44px;
              text-align: center;
              max-width: 520px;
              width: 90%;
              animation: popBanner 0.7s 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, floatGlow 3s ease-in-out infinite;
            }
          </style>

          <div class="rocket-anim-icon">🚀</div>

          <div class="celebration-card-content">
            <div style="font-size: 3rem; margin-bottom: 8px;">🏆</div>
            <h2 style="color: #10b981; font-size: 1.8rem; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.02em; text-transform: uppercase;">
              Level Mastered!
            </h2>
            <div style="color: #a855f7; font-size: 1.25rem; font-weight: 700; margin-bottom: 14px;">
              Score: ${score.toFixed(1)}% — Outstanding Work!
            </div>
            <p style="color: #d4d4d8; font-size: 0.92rem; line-height: 1.5; margin-bottom: 24px;">
              You've demonstrated true Socratic mastery over this lesson! You are ready to launch into the next stage of your curriculum.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button onclick="advanceToNextCurriculumVideo(); document.getElementById('rocketCelebrationOverlay').remove();" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 18px rgba(16,185,129,0.4); transition: transform 0.2s ease;">
                ▶️ Continue to Next Video
              </button>
              <button onclick="document.getElementById('rocketCelebrationOverlay').remove();" style="background: rgba(255,255,255,0.08); color: #a1a1aa; border: 1px solid rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                Close
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
      }"""

if "function triggerRocketCelebration" not in txt:
    start_handle = txt.find("function handleQuizResult")
    if start_handle != -1:
        txt = txt[:start_handle] + rocket_func + "\n\n      " + txt[start_handle:]

old_mastery_trigger = """        if (mastery) {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Mastery Achieved! (85%+)",
            `Score: ${score.toFixed(1)}%. Lesson completed successfully. Next level unlocked!`,
          );"""

new_mastery_trigger = """        if (mastery) {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Mastery Achieved! (85%+)",
            `Score: ${score.toFixed(1)}%. Lesson completed successfully. Next level unlocked!`,
          );

          // Trigger Rocket Launch Animation Overlay!
          triggerRocketCelebration(score);"""

if old_mastery_trigger in txt:
    txt = txt.replace(old_mastery_trigger, new_mastery_trigger)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully added Rocket Launch Celebration animation to index.html!")
