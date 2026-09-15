/**
 * Gandho Voice Assistant Helper for STEM Virtual Labs
 * Seamlessly interfaces with host LiveKit agent in index.html (toggleMicRaiseHand)
 * and provides speech synthesis & Socratic feedback in standalone mode.
 */

import { speakFrench, stopSpeaking } from "../../shared/stem_voice_helper.js";

export class GandhoLabVoiceAssistant {
  constructor(container, getLabContextFn) {
    this.container = container;
    this.getLabContext = getLabContextFn || (() => ({}));
    this.isActive = false;
    this.render();
  }

  render() {
    this.btn = document.createElement("button");
    this.btn.type = "button";
    this.btn.className = "lab-gandho-mic-btn";
    this.btn.title = "Ask Gandho for Lab Help (Socratic Voice Tutor)";
    this.btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
      <span>Ask Gandho</span>
    `;

    this.btn.addEventListener("click", (e) => this.toggleVoice(e));
    this.container.appendChild(this.btn);
  }

  toggleVoice(e) {
    const context = this.getLabContext();

    // 1. If running inside the Gandal AI platform (index.html), hook directly to LiveKit voice agent!
    if (typeof window.toggleMicRaiseHand === "function") {
      window.currentSocraticLabContext = context;
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }
      const alreadyOn = !!(window.isConversationSessionActive || window._lkVoiceConnected);
      if (!alreadyOn) {
        window.toggleMicRaiseHand(e, true);
      }
      this.btn.classList.add("active");
      this.isActive = true;
      return;
    }

    // 2. Standalone Mode: Show Socratic Tutor dialogue & speak aloud via SpeechSynthesis
    this.isActive = !this.isActive;
    this.btn.classList.toggle("active", this.isActive);

    if (this.isActive) {
      this.showSocraticPopup(context);
    } else {
      this.closeSocraticPopup();
    }
  }

  showSocraticPopup(ctx) {
    this.closeSocraticPopup();

    const advice = this.generateSocraticHint(ctx);

    this.modal = document.createElement("div");
    this.modal.className = "gandho-voice-modal";
    this.modal.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.4rem;">🧙‍♂️</span>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #c084fc;">Gandho Lab Tutor</div>
            <div style="font-size: 0.72rem; color: #a1a1aa;">Socratic Scientific Advisor</div>
          </div>
        </div>
        <button type="button" id="btnCloseGandho" style="background:none; border:none; color:#a1a1aa; cursor:pointer; font-size:1.1rem;">✕</button>
      </div>

      <div style="font-size: 0.85rem; line-height: 1.5; color: #f4f4f5; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px; border-left: 3px solid #a855f7; margin-bottom: 14px;">
        "${advice}"
      </div>

      <div style="display: flex; gap: 8px;">
        <button type="button" id="btnSpeakAloud" class="lab-action-btn btn-secondary" style="flex: 1; font-size: 0.78rem;">
          🔊 Speak Aloud
        </button>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.modal.querySelector("#btnCloseGandho").addEventListener("click", () => this.closeSocraticPopup());
    this.modal.querySelector("#btnSpeakAloud").addEventListener("click", () => this.speak(advice));

    // Automatically speak in standalone mode
    this.speak(advice);
  }

  closeSocraticPopup() {
    if (this.modal && this.modal.parentElement) {
      this.modal.parentElement.removeChild(this.modal);
      this.modal = null;
    }
    this.isActive = false;
    this.btn.classList.remove("active");
  }

  speak(text) {
    speakFrench(text, { rate: 1.0, pitch: 1.05 });
  }

  stopSpeak() {
    stopSpeaking();
  }

  generateSocraticHint(ctx) {
    const domain = ctx.domain || "general";
    if (domain === "chemistry") {
      const ph = ctx.ph !== undefined ? ctx.ph : 7.0;
      const vol = ctx.totalVolume || 0;
      const mission = ctx.mission || "Titration";

      if (vol === 0) {
        return "Greetings, young scientist! Your beaker is currently empty. Start by dispensing 20 to 25 mL of hydrochloric acid from the reagent shelf.";
      }
      if (ph < 3.0) {
        return `I notice your solution is strongly acidic at pH ${ph.toFixed(1)}. Remember: to neutralize acid, what kind of reagent must you add? Try adding small amounts of sodium hydroxide (NaOH) and observe the pH needle!`;
      }
      if (ph >= 6.5 && ph <= 7.5) {
        return `Remarkable work! Your solution is near the stoichiometric neutral equivalence point (pH ${ph.toFixed(2)}). All hydrogen ions (H⁺) have balanced with hydroxide ions (OH⁻)!`;
      }
      if (ph > 10.0) {
        return `Aha! The phenolphthalein indicator turned bright magenta because your solution has overshot into a strong base (pH ${ph.toFixed(1)}). What could you add to bring the pH back down toward neutral?`;
      }
      return `Your solution volume is ${vol} mL with a pH of ${ph.toFixed(2)}. Remember the dilution relationship M₁V₁ = M₂V₂ as you adjust your concentrations!`;
    }

    if (domain === "physics") {
      const bodiesCount = ctx.bodiesCount || 0;
      const maxSpeed = ctx.maxSpeed || 0;
      const grav = ctx.gravity || 9.8;

      if (bodiesCount === 0) {
        return "Welcome to the Mechanics Sandbox! Tap one of the spawn buttons above to create a ball or heavy box, then drag and fling it with your finger or mouse.";
      }
      if (ctx.preset === "free_fall") {
        return "Recall Galileo's experiment at the Tower of Pisa: In a vacuum under the same gravitational acceleration, does a 10 kg bowling ball accelerate faster than a light ball? Watch their cyan velocity vectors as they drop!";
      }
      if (ctx.preset === "momentum") {
        return "Notice the arrows extending from each ball. That vector represents momentum: mass times velocity (p = mv). When they collide, watch how momentum transfers between them!";
      }
      return `You have ${bodiesCount} active bodies in motion! Try tweaking the gravity or restitution sliders to see how bouncing elasticity changes.`;
    }

    return "Hello! I am Gandho, your Socratic Lab Assistant. Ask me anything about your experiment, or click 'Check My Work' when you are ready for grading!";
  }
}
