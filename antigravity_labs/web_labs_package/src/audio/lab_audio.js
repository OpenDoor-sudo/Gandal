/**
 * lab_audio.js - Zero-Asset Procedural Web Audio Engine for STEM Virtual Labs
 * 100% offline, procedural sound effects using browser Web Audio API.
 */

class LabAudioEngine {
  constructor() {
    this.ctx = null;
    this.droneOsc = null;
    this.droneOscB = null;
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
   * Dual-oscillator impact: heavy masses → 40–70 Hz thud; light → 150–250 Hz click.
   */
  playImpactThud(mass = 1, velocity = 100) {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = Math.max(40, Math.min(250, 160 / Math.sqrt(Math.max(0.2, mass))));
      const absV = Math.abs(velocity);
      const vol = Math.min(0.6, Math.max(0.08, (absV / 600) * 0.5));
      const duration = Math.min(0.35, Math.max(0.12, 0.15 * Math.sqrt(mass)));

      const makeOsc = (type, freqMul, gainMul) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(baseFreq * 1.5 * freqMul, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * freqMul, now + duration * 0.3);
        gain.gain.setValueAtTime(vol * gainMul, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      };
      makeOsc("sine", 1, 1);
      makeOsc("triangle", 0.5, 0.35);
    } catch (e) {
      // Ignore audio failure
    }
  }

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
        this.droneOscB = this.ctx.createOscillator();
        this.droneGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        this.droneOsc.type = "sine";
        this.droneOscB.type = "sine";
        this.droneOsc.frequency.setValueAtTime(audibleFreq, now);
        this.droneOscB.frequency.setValueAtTime(audibleFreq * 1.003, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, now);

        this.droneGain.gain.setValueAtTime(0.001, now);
        this.droneGain.gain.exponentialRampToValueAtTime(0.04, now + 0.05);

        this.droneOsc.connect(filter);
        this.droneOscB.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc.start(now);
        this.droneOscB.start(now);
      } else {
        this.droneOsc.frequency.exponentialRampToValueAtTime(audibleFreq, now + 0.05);
        if (this.droneOscB) {
          this.droneOscB.frequency.exponentialRampToValueAtTime(audibleFreq * 1.003, now + 0.05);
        }
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
            this.droneOscB?.stop();
            this.droneOsc?.disconnect();
            this.droneOscB?.disconnect();
            this.droneGain?.disconnect();
          } catch (e) {}
          this.droneOsc = null;
          this.droneOscB = null;
          this.droneGain = null;
        }, 100);
      } catch (e) {
        this.droneOsc = null;
        this.droneOscB = null;
        this.droneGain = null;
      }
    }
  }

  playCannonLaunch() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      const noiseLen = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
      const src = this.ctx.createBufferSource();
      const bp = this.ctx.createBiquadFilter();
      const ng = this.ctx.createGain();
      src.buffer = buffer;
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(400, now);
      ng.gain.setValueAtTime(0.22, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      src.connect(bp);
      bp.connect(ng);
      ng.connect(this.ctx.destination);
      src.start(now);
    } catch (e) {}
  }

  playSuccessChime() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.22, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.5);
      });
    } catch (e) {}
  }

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
