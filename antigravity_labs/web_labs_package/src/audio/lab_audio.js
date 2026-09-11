/**
 * lab_audio.js - Zero-Asset Procedural Web Audio Engine for STEM Virtual Labs
 * 100% offline, procedural sound effects using browser Web Audio API.
 */

class LabAudioEngine {
  constructor() {
    this.ctx = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.isMuted = false;
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Synthesize realistic physical collision thud.
   * Heavy objects produce deep, resonant bass booms; light objects produce higher-pitched taps.
   */
  playImpactThud(mass = 1, velocity = 100) {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch inversely proportional to square root of mass
      const baseFreq = Math.max(40, Math.min(300, 160 / Math.sqrt(Math.max(0.2, mass))));
      // Velocity scales volume (clamped between 0.08 and 0.6)
      const absV = Math.abs(velocity);
      const vol = Math.min(0.6, Math.max(0.08, (absV / 600) * 0.5));
      const duration = Math.min(0.35, Math.max(0.12, 0.15 * Math.sqrt(mass)));

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + duration * 0.3);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      // Ignore audio failure
    }
  }

  /**
   * Harmonic drone for standing wave simulations
   */
  setWaveDrone(frequency = 440, active = true) {
    if (this.isMuted || !active) {
      this.stopWaveDrone();
      return;
    }
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const audibleFreq = Math.max(65, Math.min(880, frequency * 55));

      if (!this.droneOsc) {
        this.droneOsc = this.ctx.createOscillator();
        this.droneGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        this.droneOsc.type = "triangle";
        this.droneOsc.frequency.setValueAtTime(audibleFreq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, now);

        this.droneGain.gain.setValueAtTime(0.001, now);
        this.droneGain.gain.linearRampToValueAtTime(0.04, now + 0.1);

        this.droneOsc.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc.start(now);
      } else {
        this.droneOsc.frequency.exponentialRampToValueAtTime(audibleFreq, now + 0.05);
      }
    } catch (e) {
      // Ignore audio failure
    }
  }

  stopWaveDrone() {
    if (this.droneOsc) {
      try {
        const now = this.ctx?.currentTime || 0;
        if (this.droneGain) {
          this.droneGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        }
        setTimeout(() => {
          try {
            this.droneOsc?.stop();
            this.droneOsc?.disconnect();
            this.droneGain?.disconnect();
          } catch (e) {}
          this.droneOsc = null;
          this.droneGain = null;
        }, 100);
      } catch (e) {
        this.droneOsc = null;
        this.droneGain = null;
      }
    }
  }

  /**
   * Cannon launch whoosh for projectile simulation
   */
  playCannonLaunch() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Celebratory chime when a student completes a lab challenge
   */
  playSuccessChime() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const notes = [587.33, 880.0]; // D5, A5
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.55);
      });
    } catch (e) {}
  }

  /**
   * Short tactile click on buttons
   */
  playClick() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }
}

export const labAudio = new LabAudioEngine();
