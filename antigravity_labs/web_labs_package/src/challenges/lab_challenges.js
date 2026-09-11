/**
 * lab_challenges.js - Interactive STEM Curriculum Challenges & Gamification Engine
 * Evaluates student lab objectives, awards badges, and plays procedural celebration cues.
 */
import { labAudio } from "../audio/lab_audio.js";

export const LAB_CHALLENGES = [
  {
    id: "moon_drop",
    topic: "phys_free_fall",
    title: "Galileo on the Moon",
    desc: "Set gravity to Moon (1.6 m/s²) and drop both balls together.",
    icon: "🌙",
    rewardXP: 100,
    check: (state) => {
      return state.gravity === 1.6 && state.hasDropped && state.ballsLandedTogether;
    }
  },
  {
    id: "jupiter_slam",
    topic: "phys_free_fall",
    title: "Jupiter Gravity Master",
    desc: "Set gravity to Jupiter (24.8 m/s²) and produce > 1500 J kinetic energy.",
    icon: "⚡",
    rewardXP: 150,
    check: (state) => {
      return state.gravity === 24.8 && state.peakKinetic > 1500;
    }
  },
  {
    id: "standing_resonance",
    topic: "phys_math",
    title: "Resonant Harmonics",
    desc: "In Standing Waves, set frequency to 6.0 Hz with amplitude >= 30 px.",
    icon: "🌊",
    rewardXP: 100,
    check: (state) => {
      return state.mode === "waves" && state.frequency === 6.0 && state.amplitude >= 30;
    }
  },
  {
    id: "sniper_range",
    topic: "phys_math",
    title: "Artillery Marksman",
    desc: "In Projectile Kinematics, achieve a total flight range >= 120 m.",
    icon: "🎯",
    rewardXP: 125,
    check: (state) => {
      return state.mode === "kinematics" && state.range >= 120;
    }
  },
  {
    id: "iss_orbit",
    topic: "phys_math",
    title: "ISS Orbital Navigator",
    desc: "In Orbital Mechanics, set altitude to 400 km and verify speed > 7600 m/s.",
    icon: "🛰️",
    rewardXP: 150,
    check: (state) => {
      return state.mode === "orbital" && state.altitude === 400 && state.speed > 7600;
    }
  }
];

class ChallengeManager {
  constructor() {
    this.completed = new Set();
    this.loadCompleted();
  }

  loadCompleted() {
    try {
      const saved = localStorage.getItem("ventuno_lab_badges");
      if (saved) {
        JSON.parse(saved).forEach(id => this.completed.add(id));
      }
    } catch (e) {}
  }

  saveCompleted() {
    try {
      localStorage.setItem("ventuno_lab_badges", JSON.stringify(Array.from(this.completed)));
    } catch (e) {}
  }

  getChallengesForTopic(topicId) {
    return LAB_CHALLENGES.filter(c => c.topic === topicId).map(c => ({
      ...c,
      isDone: this.completed.has(c.id)
    }));
  }

  checkState(topicId, state) {
    const list = LAB_CHALLENGES.filter(c => c.topic === topicId && !this.completed.has(c.id));
    for (const c of list) {
      if (c.check(state)) {
        this.unlockBadge(c);
      }
    }
  }

  unlockBadge(challenge) {
    if (this.completed.has(challenge.id)) return;
    this.completed.add(challenge.id);
    this.saveCompleted();

    // Play celebration chime
    labAudio.playSuccessChime();

    // Show celebratory banner
    this.renderBadgeToast(challenge);

    // Sync to SQLite database asynchronously
    fetch("/api/v1/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badge_id: challenge.id,
        title: challenge.title,
        xp: challenge.rewardXP
      })
    }).catch(() => {});
  }

  renderBadgeToast(challenge) {
    const toast = document.createElement("div");
    toast.className = "lab-badge-unlock-banner";
    toast.style.cssText = `
      position: fixed;
      top: 70px;
      right: 24px;
      background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
      border: 2px solid #a855f7;
      border-radius: 12px;
      padding: 14px 20px;
      color: #ffffff;
      box-shadow: 0 10px 30px rgba(168, 85, 247, 0.35);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 14px;
      animation: badgeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
      <div style="font-size: 32px; filter: drop-shadow(0 0 8px #a855f7);">${challenge.icon}</div>
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #c084fc; font-weight: 700;">Challenge Complete! +${challenge.rewardXP} XP</div>
        <div style="font-size: 14px; font-weight: 600; color: #fafafa;">${challenge.title}</div>
        <div style="font-size: 12px; color: #a1a1aa;">${challenge.desc}</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 500);
    }, 4500);
  }

  renderSidebarPanel(topicId, containerEl) {
    if (!containerEl) return;
    const items = this.getChallengesForTopic(topicId);
    if (!items.length) return;

    let html = `
      <div class="lab-challenges-card" style="margin-top: 14px; background: rgba(24, 24, 27, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a855f7; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <span>🏆</span> Lab Missions & Badges
          </div>
          <span style="font-size: 11px; color: #71717a;">${items.filter(i => i.isDone).length}/${items.length}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    items.forEach(c => {
      const isDone = c.isDone;
      html += `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; background: ${isDone ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isDone ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.05)'};">
          <div style="font-size: 20px; opacity: ${isDone ? '1' : '0.4'};">${c.icon}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12px; font-weight: 600; color: ${isDone ? '#e9d5ff' : '#d4d4d8'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${c.title}</div>
            <div style="font-size: 11px; color: #71717a;">${c.desc}</div>
          </div>
          ${isDone ? '<span style="color: #4ade80; font-size: 14px;">✓</span>' : '<span style="color: #a855f7; font-size: 11px; font-weight: 700;">+' + c.rewardXP + 'XP</span>'}
        </div>
      `;
    });

    html += `</div></div>`;
    containerEl.innerHTML = html;
  }
}

export const challengeManager = new ChallengeManager();
