/**
 * Lab missions: French-first classroom copy, tolerant unlocks, XP ledger.
 */
import { labAudio } from "../audio/lab_audio.js";

function labLocale() {
  const raw = (typeof window !== "undefined" && window.ACTIVE_DATABASE_LOCALE) || "fr_FR";
  return String(raw).startsWith("fr") ? "fr" : "en";
}

function copy(fr, en) {
  return labLocale() === "fr" ? fr : en;
}

export const LAB_CHALLENGES = [
  {
    id: "moon_drop",
    topic: "phys_free_fall",
    titleFr: "Galilée sur la Lune",
    titleEn: "Galileo on the Moon",
    descFr: "Règle la gravité à 1,6 m/s² (Lune) et lâche les deux sphères ensemble.",
    descEn: "Set gravity to 1.6 m/s² (Moon) and drop both spheres together.",
    icon: "🌙",
    rewardXP: 100,
    check: (state) =>
      Math.abs((state.gravity || 0) - 1.6) < 0.15 && state.hasDropped && state.ballsLandedTogether,
  },
  {
    id: "jupiter_slam",
    topic: "phys_free_fall",
    titleFr: "Maître de Jupiter",
    titleEn: "Jupiter Gravity Master",
    descFr: "Passe à 24,8 m/s² (Jupiter) et dépasse 1500 J d’énergie cinétique.",
    descEn: "Set gravity to 24.8 m/s² (Jupiter) and exceed 1500 J of kinetic energy.",
    icon: "⚡",
    rewardXP: 150,
    check: (state) => Math.abs((state.gravity || 0) - 24.8) < 0.4 && state.peakKinetic > 1500,
  },
  {
    id: "elastic_swap",
    topic: "phys_momentum",
    titleFr: "Échange élastique",
    titleEn: "Elastic Swap",
    descFr: "Lance une collision et observe le transfert de quantité de mouvement (deux corps en mouvement).",
    descEn: "Start a collision and watch momentum transfer (two moving bodies).",
    icon: "💥",
    rewardXP: 100,
    check: (state) => Boolean(state.hasDropped && (state.peakKinetic || 0) > 80),
  },
  {
    id: "standing_resonance",
    topic: "phys_math",
    titleFr: "Harmoniques en résonance",
    titleEn: "Resonant Harmonics",
    descFr: "En ondes stationnaires : 6,0 Hz et amplitude ≥ 30 px.",
    descEn: "In Standing Waves, set frequency to 6.0 Hz with amplitude ≥ 30 px.",
    icon: "🌊",
    rewardXP: 100,
    check: (state) =>
      state.mode === "waves" && Math.abs((state.frequency || 0) - 6.0) < 0.05 && state.amplitude >= 30,
  },
  {
    id: "sniper_range",
    topic: "phys_math",
    titleFr: "Tireur d’artillerie",
    titleEn: "Artillery Marksman",
    descFr: "En tir balistique, atteins une portée ≥ 120 m.",
    descEn: "In projectile kinematics, reach a flight range ≥ 120 m.",
    icon: "🎯",
    rewardXP: 125,
    check: (state) => state.mode === "kinematics" && state.range >= 120,
  },
  {
    id: "iss_orbit",
    topic: "phys_math",
    titleFr: "Navigateur ISS",
    titleEn: "ISS Orbital Navigator",
    descFr: "En mécanique orbitale, place l’altitude à 400 km (vitesse > 7600 m/s).",
    descEn: "In Orbital Mechanics, set altitude to 400 km and verify speed > 7600 m/s.",
    icon: "🛰️",
    rewardXP: 150,
    check: (state) =>
      state.mode === "orbital" && Math.abs((state.altitude || 0) - 400) < 1 && state.speed > 7600,
  },
];

function localizeChallenge(c) {
  return {
    ...c,
    title: copy(c.titleFr, c.titleEn),
    desc: copy(c.descFr, c.descEn),
  };
}

class ChallengeManager {
  constructor() {
    this.completed = new Set();
    this.loadCompleted();
  }

  loadCompleted() {
    try {
      const saved = localStorage.getItem("ventuno_lab_badges");
      if (saved) JSON.parse(saved).forEach((id) => this.completed.add(id));
    } catch (e) {}
  }

  saveCompleted() {
    try {
      localStorage.setItem("ventuno_lab_badges", JSON.stringify(Array.from(this.completed)));
    } catch (e) {}
  }

  totalXP() {
    return LAB_CHALLENGES.filter((c) => this.completed.has(c.id)).reduce((sum, c) => sum + c.rewardXP, 0);
  }

  maxXP() {
    return LAB_CHALLENGES.reduce((sum, c) => sum + c.rewardXP, 0);
  }

  getChallengesForTopic(topicId) {
    return LAB_CHALLENGES.filter((c) => c.topic === topicId).map((c) => ({
      ...localizeChallenge(c),
      isDone: this.completed.has(c.id),
    }));
  }

  checkState(topicId, state) {
    let unlocked = false;
    const list = LAB_CHALLENGES.filter((c) => c.topic === topicId && !this.completed.has(c.id));
    for (const c of list) {
      if (c.check(state)) {
        this.unlockBadge(c);
        unlocked = true;
      }
    }
    return unlocked;
  }

  unlockBadge(challenge) {
    if (this.completed.has(challenge.id)) return;
    this.completed.add(challenge.id);
    this.saveCompleted();
    labAudio.playSuccessChime();
    const localized = localizeChallenge(challenge);
    this.renderBadgeToast(localized);
    fetch("/api/v1/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badge_id: challenge.id,
        title: localized.title,
        xp: challenge.rewardXP,
      }),
    }).catch(() => {});
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("gandho-badge-unlock", {
          detail: { challenge: localized, xp: this.totalXP(), maxXp: this.maxXP() },
        }),
      );
    }
  }

  renderBadgeToast(challenge) {
    document.querySelectorAll(".lab-badge-unlock-banner").forEach((el) => el.remove());
    const toast = document.createElement("div");
    toast.className = "lab-badge-unlock-banner";
    toast.innerHTML = `
      <div class="lab-badge-unlock-icon">${challenge.icon}</div>
      <div>
        <div class="lab-badge-unlock-kicker">${copy("Défi réussi", "Challenge complete")} · +${challenge.rewardXP} XP</div>
        <div class="lab-badge-unlock-title">${challenge.title}</div>
        <div class="lab-badge-unlock-desc">${challenge.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("is-leaving");
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  renderSidebarPanel(topicId, containerEl) {
    if (!containerEl) return;
    const items = this.getChallengesForTopic(topicId);
    if (!items.length) {
      containerEl.innerHTML = "";
      return;
    }
    const done = items.filter((i) => i.isDone).length;
    containerEl.innerHTML = `
      <div class="lab-challenges-card">
        <div class="lab-challenges-head">
          <div class="lab-challenges-kicker">🏆 ${copy("Missions du labo", "Lab missions")}</div>
          <span class="lab-challenges-count">${done}/${items.length}</span>
        </div>
        <div class="lab-xp-meter" aria-hidden="true">
          <span style="width:${this.maxXP() ? Math.round((this.totalXP() / this.maxXP()) * 100) : 0}%"></span>
        </div>
        <div class="lab-challenges-list">
          ${items
            .map(
              (c) => `
            <div class="lab-challenge-row ${c.isDone ? "is-done" : ""}">
              <div class="lab-challenge-icon">${c.icon}</div>
              <div class="lab-challenge-copy">
                <div class="lab-challenge-title">${c.title}</div>
                <div class="lab-challenge-desc">${c.desc}</div>
              </div>
              ${c.isDone ? '<span class="lab-challenge-mark">✓</span>' : `<span class="lab-challenge-xp">+${c.rewardXP}</span>`}
            </div>`,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderAtelierRibbon(mountEl) {
    if (!mountEl) return;
    const xp = this.totalXP();
    const max = this.maxXP();
    const pct = max ? Math.round((xp / max) * 100) : 0;
    mountEl.innerHTML = `
      <div class="lab-atelier-ribbon">
        <div>
          <div class="lab-atelier-kicker">${copy("Atelier STEM", "STEM studio")}</div>
          <div class="lab-atelier-title">${copy("Missions & badges", "Missions & badges")}</div>
        </div>
        <div class="lab-atelier-xp">
          <strong>${xp}</strong><span> / ${max} XP</span>
          <div class="lab-xp-meter"><span style="width:${pct}%"></span></div>
        </div>
      </div>
    `;
  }
}

export const challengeManager = new ChallengeManager();
