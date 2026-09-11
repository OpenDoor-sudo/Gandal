/**
 * Mathematical Physics & Wave Mechanics - Powered by SymPy & SciPy
 * Interactive Standing Wave simulation, Kinematic Calculus, and Orbital Mechanics.
 */

import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js";
import { labAudio } from "../audio/lab_audio.js";
import { challengeManager } from "../challenges/lab_challenges.js";

export class MathPhysicsLab {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentMode = "waves"; // 'waves' | 'kinematics' | 'orbital'
    this.animId = null;
    this.lastTime = performance.now();
    this.time = 0;
    this.isPaused = false;

    // Mode 1: Wave parameters
    this.freq = 4.0; // Hz
    this.amp = 40.0; // px
    this.speed = 120.0; // px/s

    // Mode 2: Kinematics parameters
    this.v0 = 35.0; // m/s
    this.angle = 45.0; // degrees
    this.g = 9.8; // m/s^2
    this.kinTime = 0;

    // Mode 3: Orbital parameters
    this.altitude = 400.0; // km (ISS)
    this.orbitAngle = 0;

    // Cached solver result
    this.solverData = null;

    this.render();
    this.initCanvas();
    this.bindEvents();
    this.updateDerivationsInstant();
    this.startLoop();
    this.solveCurrent();
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Interactive Canvas & Derivations -->
        <div class="lab-split-left" style="padding: 20px 24px 100px 24px; box-sizing: border-box; overflow-y: auto;">
          <div style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
            
            <!-- Canvas Box -->
            <div style="background: #14141a; border: 2px solid var(--lab-border); border-radius: 16px; padding: 18px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <span id="modeHeaderBadge" class="mission-badge" style="margin: 0; background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.4); color: #818cf8;">
                  ⚛️ SymPy Harmonic Wave Engine
                </span>
                <span id="mathEquationDisplay" style="font-family: monospace; font-size: 0.95rem; font-weight: bold; color: #38bdf8;">
                  y(x, t) = 2A · sin(kx) · cos(ωt)
                </span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="btnPauseMath" class="lab-action-btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">
                    ⏸️ Pause
                  </button>
                  <button type="button" id="btnResetMath" class="lab-action-btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; color: #f43f5e;">
                    🔄 Reset
                  </button>
                </div>
              </div>

              <!-- Animated Canvas -->
              <div style="background: #09090d; border-radius: 12px; border: 1px solid #27272a; height: 320px; position: relative; overflow: hidden;">
                <canvas id="mathPhysCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
              </div>
            </div>

            <!-- Mathematical Derivations Card -->
            <div style="background: #14141a; border: 1px solid var(--lab-border); border-radius: 16px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 0.85rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">
                  📐 SymPy Symbolic Calculus & Exact Derivations
                </h4>
                <span style="font-size: 0.75rem; color: #10b981; font-weight: 600;">● Connected to Python SymPy/SciPy</span>
              </div>
              <div id="mathDerivationsBox" style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.88rem; line-height: 1.7; color: #e4e4e7; background: #0c0c10; padding: 16px; border-radius: 10px; border: 1px solid #27272a; min-height: 80px;">
                <!-- Populated immediately by updateDerivationsInstant -->
              </div>
            </div>

            <!-- Dynamic Bottom Metric Cards -->
            <div id="modeDataGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <!-- Dynamically populated per mode -->
            </div>

          </div>
        </div>

        <!-- RIGHT: Sliders & Modes Sidebar -->
        <div class="lab-split-right">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" style="margin: 0;">Grades 10–12 • Physics Calculus</span>
            <div id="mathPhysGandhoSlot"></div>
          </div>

          <!-- Mode Switcher Tabs -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="preset-pill active" data-mode="waves" style="font-size: 0.75rem;">1. Standing Waves</button>
            <button type="button" class="preset-pill" data-mode="kinematics" style="font-size: 0.75rem;">2. Projectile Calculus</button>
            <button type="button" class="preset-pill" data-mode="orbital" style="font-size: 0.75rem;">3. Orbital Mechanics</button>
          </div>

          <!-- Dynamic Controls Box -->
          <div id="modeControlsContainer" style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <!-- Populated per mode -->
          </div>

          <!-- Live Telemetry Card -->
          <div class="mission-tracker-box" id="mathTelemetryBox">
            <!-- Populated per mode -->
          </div>

          <!-- Lab Missions & Badges Panel -->
          <div id="mathChallengesMount"></div>

          <!-- Educational Scientific Explainer -->
          <div style="margin-top: auto; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 12px; padding: 14px;">
            <strong style="color: #818cf8; font-size: 0.82rem;">💡 About SymPy & SciPy Engine:</strong>
            <p id="modeExplainerText" style="margin: 4px 0 0 0; font-size: 0.78rem; color: #d4d4d8; line-height: 1.45;">
              SymPy evaluates exact mathematical derivatives (d/dt) and integrals symbolically, while SciPy handles numerical wave harmonics and Keplerian orbital dynamics.
            </p>
          </div>
        </div>
      </div>
    `;

    this.renderModeControls();
    this.renderModeDataGrid();
    const chMount = this.container.querySelector("#mathChallengesMount");
    if (chMount) {
      challengeManager.renderSidebarPanel("phys_math", chMount);
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.container.querySelectorAll('.preset-pill[data-mode]').forEach(p => {
      p.classList.toggle('active', p.dataset.mode === mode);
    });

    // Update Header Badges
    const badge = this.container.querySelector('#modeHeaderBadge');
    const eqDisp = this.container.querySelector('#mathEquationDisplay');
    if (mode === 'waves') {
      badge.innerHTML = '⚛️ SymPy Harmonic Wave Engine';
      eqDisp.innerText = 'y(x, t) = 2A · sin(kx) · cos(ωt)';
    } else if (mode === 'kinematics') {
      badge.innerHTML = '🎯 Projectile Kinematics & Calculus';
      eqDisp.innerText = "s(t) = v₀sin(θ)t - ½gt²";
    } else if (mode === 'orbital') {
      badge.innerHTML = '🛰️ Keplerian Orbital Mechanics';
      eqDisp.innerText = 'v = √(G·M / r)';
    }

    this.renderModeControls();
    this.renderModeDataGrid();
    challengeManager.renderSidebarPanel("phys_math", this.container.querySelector("#mathChallengesMount"));
    this.updateDerivationsInstant();
    this.solveCurrent();
  }

  renderModeControls() {
    const c = this.container.querySelector('#modeControlsContainer');
    if (!c) return;

    if (this.currentMode === 'waves') {
      c.innerHTML = `
        <h4 style="margin: 0 0 14px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
          ⚙️ Wave Parameters
        </h4>
        <div class="control-slider-group">
          <label><span>Frequency (f):</span><span id="sliderFreqVal" style="color: #818cf8; font-weight: bold;">${this.freq.toFixed(1)} Hz</span></label>
          <input type="range" id="waveFreqSlider" min="1" max="12" step="0.5" value="${this.freq}">
        </div>
        <div class="control-slider-group">
          <label><span>Amplitude (A):</span><span id="sliderAmpVal" style="color: #38bdf8; font-weight: bold;">${this.amp.toFixed(0)} px</span></label>
          <input type="range" id="waveAmpSlider" min="10" max="70" step="2" value="${this.amp}">
        </div>
        <div class="control-slider-group">
          <label><span>Propagation Speed (v):</span><span id="sliderSpeedVal" style="color: #06b6d4; font-weight: bold;">${this.speed.toFixed(0)} px/s</span></label>
          <input type="range" id="waveSpeedSlider" min="40" max="300" step="10" value="${this.speed}">
        </div>
      `;

      c.querySelector('#waveFreqSlider').addEventListener('input', (e) => {
        this.freq = parseFloat(e.target.value);
        c.querySelector('#sliderFreqVal').innerText = `${this.freq.toFixed(1)} Hz`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelector('#waveAmpSlider').addEventListener('input', (e) => {
        this.amp = parseFloat(e.target.value);
        c.querySelector('#sliderAmpVal').innerText = `${this.amp.toFixed(0)} px`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelector('#waveSpeedSlider').addEventListener('input', (e) => {
        this.speed = parseFloat(e.target.value);
        c.querySelector('#sliderSpeedVal').innerText = `${this.speed.toFixed(0)} px/s`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });

    } else if (this.currentMode === 'kinematics') {
      c.innerHTML = `
        <h4 style="margin: 0 0 14px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
          ⚙️ Kinematics & Launch Sliders
        </h4>
        <div class="control-slider-group">
          <label><span>Launch Speed (v₀):</span><span id="sliderV0Val" style="color: #38bdf8; font-weight: bold;">${this.v0.toFixed(0)} m/s</span></label>
          <input type="range" id="kinV0Slider" min="10" max="80" step="1" value="${this.v0}">
        </div>
        <div class="control-slider-group">
          <label><span>Launch Angle (θ):</span><span id="sliderAngleVal" style="color: #818cf8; font-weight: bold;">${this.angle.toFixed(0)}°</span></label>
          <input type="range" id="kinAngleSlider" min="15" max="85" step="1" value="${this.angle}">
        </div>
        <div class="control-slider-group">
          <label><span>Gravity (g):</span><span id="sliderGVal" style="color: #f43f5e; font-weight: bold;">${this.g.toFixed(1)} m/s²</span></label>
          <input type="range" id="kinGSlider" min="1.6" max="25.0" step="0.2" value="${this.g}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px;">
          <button type="button" class="preset-pill" data-g="9.8" style="font-size:0.7rem;">🌍 Earth (9.8)</button>
          <button type="button" class="preset-pill" data-g="1.6" style="font-size:0.7rem;">🌕 Moon (1.6)</button>
          <button type="button" class="preset-pill" data-g="3.7" style="font-size:0.7rem;">🪐 Mars (3.7)</button>
          <button type="button" class="preset-pill" data-g="24.8" style="font-size:0.7rem;">⚡ Jupiter (24.8)</button>
        </div>
      `;

      c.querySelector('#kinV0Slider').addEventListener('input', (e) => {
        this.v0 = parseFloat(e.target.value);
        c.querySelector('#sliderV0Val').innerText = `${this.v0.toFixed(0)} m/s`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelector('#kinAngleSlider').addEventListener('input', (e) => {
        this.angle = parseFloat(e.target.value);
        c.querySelector('#sliderAngleVal').innerText = `${this.angle.toFixed(0)}°`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelector('#kinGSlider').addEventListener('input', (e) => {
        this.g = parseFloat(e.target.value);
        c.querySelector('#sliderGVal').innerText = `${this.g.toFixed(1)} m/s²`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelectorAll('[data-g]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.g = parseFloat(btn.dataset.g);
          c.querySelector('#kinGSlider').value = this.g;
          c.querySelector('#sliderGVal').innerText = `${this.g.toFixed(1)} m/s²`;
          this.updateDerivationsInstant();
          this.solveCurrent();
        });
      });

    } else if (this.currentMode === 'orbital') {
      c.innerHTML = `
        <h4 style="margin: 0 0 14px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
          ⚙️ Orbital Mechanics Sliders
        </h4>
        <div class="control-slider-group">
          <label><span>Orbital Altitude (h):</span><span id="sliderAltVal" style="color: #a855f7; font-weight: bold;">${this.altitude.toFixed(0)} km</span></label>
          <input type="range" id="orbitAltSlider" min="200" max="36000" step="100" value="${this.altitude}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px;">
          <button type="button" class="preset-pill" data-alt="400" style="font-size:0.7rem;">🛰️ ISS (400km)</button>
          <button type="button" class="preset-pill" data-alt="540" style="font-size:0.7rem;">🔭 Hubble (540km)</button>
          <button type="button" class="preset-pill" data-alt="20200" style="font-size:0.7rem;">📡 GPS (20,200km)</button>
          <button type="button" class="preset-pill" data-alt="35786" style="font-size:0.7rem;">🌐 GEO (35,786km)</button>
        </div>
      `;

      c.querySelector('#orbitAltSlider').addEventListener('input', (e) => {
        this.altitude = parseFloat(e.target.value);
        c.querySelector('#sliderAltVal').innerText = `${this.altitude.toFixed(0)} km`;
        this.updateDerivationsInstant();
        this.solveCurrent();
      });
      c.querySelectorAll('[data-alt]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.altitude = parseFloat(btn.dataset.alt);
          c.querySelector('#orbitAltSlider').value = this.altitude;
          c.querySelector('#sliderAltVal').innerText = `${this.altitude.toFixed(0)} km`;
          this.updateDerivationsInstant();
          this.solveCurrent();
        });
      });
    }
  }

  renderModeDataGrid() {
    const grid = this.container.querySelector('#modeDataGrid');
    const telem = this.container.querySelector('#mathTelemetryBox');
    if (!grid || !telem) return;

    if (this.currentMode === 'waves') {
      grid.innerHTML = `
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #ef4444; font-size: 0.8rem;">🔴 Nodes (x = n·λ/2)</h4>
          <div id="nodesList" style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8;">-</div>
        </div>
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #10b981; font-size: 0.8rem;">🟢 Antinodes (x = (2n+1)·λ/4)</h4>
          <div id="antinodesList" style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8;">-</div>
        </div>
      `;
      telem.innerHTML = `
        <div><span style="color:#a1a1aa;">Wavelength (λ = v/f):</span> <strong style="color:#38bdf8;" id="calcWavelength">${(this.speed / this.freq).toFixed(1)} px</strong></div>
        <div><span style="color:#a1a1aa;">Period (T = 1/f):</span> <strong style="color:#818cf8;" id="calcPeriod">${(1.0 / this.freq).toFixed(3)} s</strong></div>
        <div><span style="color:#a1a1aa;">Angular Freq (ω = 2πf):</span> <strong style="color:#a855f7;" id="calcOmega">${(2 * Math.PI * this.freq).toFixed(1)} rad/s</strong></div>
      `;
    } else if (this.currentMode === 'kinematics') {
      grid.innerHTML = `
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #38bdf8; font-size: 0.8rem;">📈 Trajectory Parameters</h4>
          <div id="kinematicsParamsSummary" style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8; line-height: 1.5;">
            Calculating flight path...
          </div>
        </div>
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #a855f7; font-size: 0.8rem;">📐 First & Second Derivatives</h4>
          <div id="kinematicsDerivsSummary" style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8; line-height: 1.5;">
            s'(t) = Velocity<br>s''(t) = Acceleration
          </div>
        </div>
      `;
      telem.innerHTML = `
        <div><span style="color:#a1a1aa;">Flight Time:</span> <strong style="color:#38bdf8;" id="calcFlightTime">-</strong></div>
        <div><span style="color:#a1a1aa;">Max Height (H):</span> <strong style="color:#10b981;" id="calcMaxHeight">-</strong></div>
        <div><span style="color:#a1a1aa;">Range (R):</span> <strong style="color:#f43f5e;" id="calcRange">-</strong></div>
      `;
    } else if (this.currentMode === 'orbital') {
      grid.innerHTML = `
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #38bdf8; font-size: 0.8rem;">🛰️ Satellite Telemetry</h4>
          <div id="orbitalTelemetrySummary" style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8; line-height: 1.5;">
            Calculating Keplerian orbit...
          </div>
        </div>
        <div class="sidebar-section" style="margin: 0;">
          <h4 style="color: #a855f7; font-size: 0.8rem;">🪐 Kepler's 3rd Law</h4>
          <div style="font-family: monospace; font-size: 0.86rem; color: #d4d4d8; line-height: 1.5;">
            T² / r³ = 4π² / (GM)<br>Constant for all Earth orbits
          </div>
        </div>
      `;
      telem.innerHTML = `
        <div><span style="color:#a1a1aa;">Orbital Speed:</span> <strong style="color:#38bdf8;" id="calcOrbitSpeed">-</strong></div>
        <div><span style="color:#a1a1aa;">Period (T):</span> <strong style="color:#a855f7;" id="calcOrbitPeriod">-</strong></div>
        <div><span style="color:#a1a1aa;">Total Radius (r):</span> <strong style="color:#10b981;" id="calcOrbitRadius">-</strong></div>
      `;
    }
  }

  updateDerivationsInstant() {
    const derivBox = this.container.querySelector('#mathDerivationsBox');
    if (!derivBox) return;

    if (this.currentMode === 'waves') {
      const wavelength = this.speed / this.freq;
      const k = (2 * Math.PI) / wavelength;
      const omega = 2 * Math.PI * this.freq;
      const ampM = (this.amp / 20.0).toFixed(1);
      const nodes = [0, 1, 2, 3, 4].map(n => `${(n * (wavelength / 2)).toFixed(1)}px`);
      const antinodes = [0, 1, 2, 3, 4].map(n => `${((2 * n + 1) * (wavelength / 4)).toFixed(1)}px`);

      derivBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color:#a1a1aa;">Wave Function:</span> <strong style="color:#38bdf8;">y(x, t) = ${ampM} · sin(${k.toFixed(2)}x - ${omega.toFixed(2)}t)</strong></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
            <div><span style="color:#a1a1aa;">Wavenumber (k = 2π/λ):</span> <strong>${k.toFixed(3)} rad/m</strong></div>
            <div><span style="color:#a1a1aa;">Angular Freq (ω = 2πf):</span> <strong>${omega.toFixed(3)} rad/s</strong></div>
          </div>
          <div style="color:#10b981; margin-top: 4px;">
            <strong>Superposition Principle:</strong> y_total = y_forward + y_reflected = 2A · sin(kx) · cos(ωt)
          </div>
        </div>
      `;

      const nodesEl = this.container.querySelector('#nodesList');
      const antinodesEl = this.container.querySelector('#antinodesList');
      if (nodesEl) nodesEl.innerText = nodes.join(', ');
      if (antinodesEl) antinodesEl.innerText = antinodes.join(', ');

      const wEl = this.container.querySelector('#calcWavelength');
      const pEl = this.container.querySelector('#calcPeriod');
      const oEl = this.container.querySelector('#calcOmega');
      if (wEl) wEl.innerText = `${wavelength.toFixed(1)} px`;
      if (pEl) pEl.innerText = `${(1.0 / this.freq).toFixed(3)} s`;
      if (oEl) oEl.innerText = `${omega.toFixed(1)} rad/s`;

    } else if (this.currentMode === 'kinematics') {
      const angleRad = (this.angle * Math.PI) / 180;
      const v0x = this.v0 * Math.cos(angleRad);
      const v0y = this.v0 * Math.sin(angleRad);
      const timeOfFlight = (2 * v0y) / this.g;
      const maxHeight = (v0y * v0y) / (2 * this.g);
      const range = v0x * timeOfFlight;

      derivBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color:#a1a1aa;">Position Vector s(t):</span> <strong style="color:#38bdf8;">s_y(t) = -½·g·t² + v₀·sin(θ)·t</strong></div>
          <div><span style="color:#a1a1aa;">Velocity v(t) = s'(t):</span> <strong style="color:#10b981;">v_y(t) = -g·t + v₀·sin(θ)</strong></div>
          <div><span style="color:#a1a1aa;">Acceleration a(t) = v'(t):</span> <strong style="color:#f43f5e;">a_y(t) = -g = -${this.g.toFixed(1)} m/s²</strong></div>
          <div style="margin-top: 4px; color:#d4d4d8; font-size:0.82rem;">
            Initial Components: v₀x = ${v0x.toFixed(1)} m/s, v₀y = ${v0y.toFixed(1)} m/s | Flight Time = ${timeOfFlight.toFixed(2)} s
          </div>
        </div>
      `;

      const ftEl = this.container.querySelector('#calcFlightTime');
      const mhEl = this.container.querySelector('#calcMaxHeight');
      const rEl = this.container.querySelector('#calcRange');
      if (ftEl) ftEl.innerText = `${timeOfFlight.toFixed(2)} s`;
      if (mhEl) mhEl.innerText = `${maxHeight.toFixed(1)} m`;
      if (rEl) rEl.innerText = `${range.toFixed(1)} m`;

      const pSummary = this.container.querySelector('#kinematicsParamsSummary');
      if (pSummary) {
        pSummary.innerHTML = `
          v₀ = ${this.v0} m/s, θ = ${this.angle}°<br>
          v₀x = ${v0x.toFixed(1)} m/s, v₀y = ${v0y.toFixed(1)} m/s<br>
          Gravity g = ${this.g} m/s²
        `;
      }

    } else if (this.currentMode === 'orbital') {
      const R_earth = 6371.0;
      const r_total_km = R_earth + this.altitude;
      const r_total_m = r_total_km * 1000.0;
      const G_val = 6.67430e-11;
      const M_earth = 5.972e24;
      const v_orbit = Math.sqrt((G_val * M_earth) / r_total_m);
      const T_seconds = 2 * Math.PI * Math.sqrt((r_total_m ** 3) / (G_val * M_earth));
      const T_minutes = T_seconds / 60.0;

      derivBox.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color:#a1a1aa;">Orbital Velocity Law:</span> <strong style="color:#38bdf8;">v = √(G·M / r) = ${v_orbit.toFixed(1)} m/s (${(v_orbit * 3.6).toFixed(0)} km/h)</strong></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
            <div><span style="color:#a1a1aa;">Orbital Radius (r):</span> <strong style="color:#10b981;">${r_total_km.toFixed(0)} km</strong></div>
            <div><span style="color:#a1a1aa;">Orbital Period (T):</span> <strong style="color:#a855f7;">${T_minutes.toFixed(1)} min (${(T_minutes/60).toFixed(2)} h)</strong></div>
          </div>
          <div style="color:#ec4899; margin-top: 4px;">
            Centripetal Balance: G·M·m / r² = m·v² / r ➔ v = √(GM/r)
          </div>
        </div>
      `;

      const spEl = this.container.querySelector('#calcOrbitSpeed');
      const perEl = this.container.querySelector('#calcOrbitPeriod');
      const radEl = this.container.querySelector('#calcOrbitRadius');
      if (spEl) spEl.innerText = `${(v_orbit * 3.6).toFixed(0)} km/h (${v_orbit.toFixed(1)} m/s)`;
      if (perEl) perEl.innerText = `${T_minutes.toFixed(1)} min (${(T_minutes/60).toFixed(2)} hrs)`;
      if (radEl) radEl.innerText = `${r_total_km.toFixed(0)} km`;

      const oSummary = this.container.querySelector('#orbitalTelemetrySummary');
      if (oSummary) {
        oSummary.innerHTML = `
          Altitude h = ${this.altitude} km<br>
          Orbit Radius = ${r_total_km.toFixed(0)} km<br>
          Velocity = ${v_orbit.toFixed(1)} m/s
        `;
      }
    }
  }

  initCanvas() {
    this.canvas = this.container.querySelector('#mathPhysCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const parent = this.canvas.parentElement;
    const width = parent.clientWidth > 50 ? parent.clientWidth : 760;
    const height = parent.clientHeight > 50 ? parent.clientHeight : 320;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  bindEvents() {
    this.container.querySelectorAll('.preset-pill[data-mode]').forEach(pill => {
      pill.addEventListener('click', () => {
        this.setMode(pill.dataset.mode);
      });
    });

    const pauseBtn = this.container.querySelector('#btnPauseMath');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        pauseBtn.innerText = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
      });
    }

    const resetBtn = this.container.querySelector('#btnResetMath');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.time = 0;
        this.kinTime = 0;
        this.orbitAngle = 0;
      });
    }

    // Voice tutor integration
    const micSlot = this.container.querySelector('#mathPhysGandhoSlot');
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: 'physics_calculus',
        mode: this.currentMode,
        frequency: this.freq,
        amplitude: this.amp,
        launchVelocity: this.v0,
        launchAngle: this.angle,
        altitude_km: this.altitude,
        solver: this.solverData
      }));
    }
  }

  async solveCurrent() {
    try {
      let payload = { topic: this.currentMode, params: {} };
      if (this.currentMode === 'waves') {
        payload.params = { frequency: this.freq, amplitude: this.amp / 20.0, speed: this.speed };
      } else if (this.currentMode === 'kinematics') {
        payload.params = { v0: this.v0, angle: this.angle, angle_deg: this.angle, g: this.g };
      } else if (this.currentMode === 'orbital') {
        payload.params = { altitude_km: this.altitude };
      }

      const resp = await fetch('/api/v1/physics/calculus/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!data.success) {
        console.warn('Math solver error:', data.error);
        return;
      }

      this.solverData = data;
      const derivBox = this.container.querySelector('#mathDerivationsBox');

      if (this.currentMode === 'waves') {
        derivBox.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color:#a1a1aa;">Wave Function:</span> <strong style="color:#38bdf8;">${data.wave_equation_str}</strong></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
              <div><span style="color:#a1a1aa;">Wavenumber (k = 2π/λ):</span> <strong>${data.wavenumber_k} rad/m</strong></div>
              <div><span style="color:#a1a1aa;">Angular Freq (ω = 2πf):</span> <strong>${data.angular_frequency_omega} rad/s</strong></div>
            </div>
            <div style="color:#10b981; margin-top: 4px;">
              <strong>Superposition Principle:</strong> y_total = y_forward + y_reflected = 2A · sin(kx) · cos(ωt)
            </div>
          </div>
        `;
        const nodesEl = this.container.querySelector('#nodesList');
        const antinodesEl = this.container.querySelector('#antinodesList');
        if (nodesEl && data.first_nodes_m) nodesEl.innerText = data.first_nodes_m.map(n => `${n} m`).join(', ');
        if (antinodesEl && data.first_antinodes_m) antinodesEl.innerText = data.first_antinodes_m.map(a => `${a} m`).join(', ');

        const wEl = this.container.querySelector('#calcWavelength');
        const pEl = this.container.querySelector('#calcPeriod');
        const oEl = this.container.querySelector('#calcOmega');
        if (wEl) wEl.innerText = `${(this.speed / this.freq).toFixed(1)} px (${data.wavelength_m} m)`;
        if (pEl) pEl.innerText = `${(1.0 / this.freq).toFixed(3)} s`;
        if (oEl) oEl.innerText = `${data.angular_frequency_omega} rad/s`;

      } else if (this.currentMode === 'kinematics') {
        derivBox.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color:#a1a1aa;">Position Vector s(t):</span> <strong style="color:#38bdf8;">${data.symbolic_position}</strong></div>
            <div><span style="color:#a1a1aa;">Velocity v(t) = s'(t):</span> <strong style="color:#10b981;">${data.symbolic_velocity}</strong></div>
            <div><span style="color:#a1a1aa;">Acceleration a(t) = v'(t):</span> <strong style="color:#f43f5e;">${data.symbolic_acceleration}</strong></div>
            <div style="margin-top: 4px; color:#d4d4d8; font-size:0.82rem;">
              Initial Components: v₀x = ${data.initial_vx} m/s, v₀y = ${data.initial_vy} m/s | Flight Time = ${data.time_of_flight_s} s
            </div>
          </div>
        `;

        const ftEl = this.container.querySelector('#calcFlightTime');
        const mhEl = this.container.querySelector('#calcMaxHeight');
        const rEl = this.container.querySelector('#calcRange');
        if (ftEl) ftEl.innerText = `${data.time_of_flight_s} s`;
        if (mhEl) mhEl.innerText = `${data.max_height_m} m`;
        if (rEl) rEl.innerText = `${data.range_m} m`;

        const pSummary = this.container.querySelector('#kinematicsParamsSummary');
        if (pSummary) {
          pSummary.innerHTML = `
            v₀ = ${this.v0} m/s, θ = ${this.angle}°<br>
            v₀x = ${data.initial_vx} m/s, v₀y = ${data.initial_vy} m/s<br>
            Gravity g = ${this.g} m/s²
          `;
        }

      } else if (this.currentMode === 'orbital') {
        derivBox.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color:#a1a1aa;">Orbital Velocity Law:</span> <strong style="color:#38bdf8;">${data.equation_str} = ${data.orbital_velocity_ms} m/s (${data.orbital_velocity_kmh} km/h)</strong></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
              <div><span style="color:#a1a1aa;">Orbital Radius (r):</span> <strong style="color:#10b981;">${data.orbital_radius_km} km</strong></div>
              <div><span style="color:#a1a1aa;">Orbital Period (T):</span> <strong style="color:#a855f7;">${data.period_minutes} min (${(data.period_minutes/60).toFixed(2)} h)</strong></div>
            </div>
            <div style="color:#ec4899; margin-top: 4px;">
              Centripetal Balance: G·M·m / r² = m·v² / r ➔ v = √(GM/r)
            </div>
          </div>
        `;

        const spEl = this.container.querySelector('#calcOrbitSpeed');
        const perEl = this.container.querySelector('#calcOrbitPeriod');
        const radEl = this.container.querySelector('#calcOrbitRadius');
        if (spEl) spEl.innerText = `${data.orbital_velocity_kmh} km/h (${data.orbital_velocity_ms} m/s)`;
        if (perEl) perEl.innerText = `${data.period_minutes} min (${(data.period_minutes/60).toFixed(2)} hrs)`;
        if (radEl) radEl.innerText = `${data.orbital_radius_km} km`;

        const oSummary = this.container.querySelector('#orbitalTelemetrySummary');
        if (oSummary) {
          oSummary.innerHTML = `
            Altitude h = ${data.altitude_km} km<br>
            Orbit Radius = ${data.orbital_radius_km} km<br>
            Velocity = ${data.orbital_velocity_ms} m/s
          `;
        }
      }

      // Sync with Socratic Tutor
      window.currentSocraticLabContext = {
        experiment_id: 'phys_math',
        title: 'Mathematical Physics & Wave Mechanics',
        mode: this.currentMode,
        solver: data,
        status: `Active ${this.currentMode} calculus & physics simulation`
      };
      if (typeof window.updateActiveViewState === 'function') {
        window.updateActiveViewState();
      }

    } catch (e) {
      console.warn('Math physics solve error:', e);
    }
  }

  startLoop() {
    this.lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.isPaused) {
        this.time += dt;
        this.kinTime += dt;
      }

      this.resizeCanvas();
      this.draw();

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentMode === 'waves') {
      this.drawWaves(ctx, w, h);
    } else if (this.currentMode === 'kinematics') {
      this.drawKinematics(ctx, w, h);
    } else if (this.currentMode === 'orbital') {
      this.drawOrbital(ctx, w, h);
    }
  }

  drawWaves(ctx, w, h) {
    const cy = h / 2;

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Equilibrium Axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    const wavelength = this.speed / this.freq;
    const k = (2 * Math.PI) / wavelength;
    const omega = 2 * Math.PI * this.freq;

    // 1. Incident Wave y1 (Translucent Cyan Dashed)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = cy + (this.amp * 0.5) * Math.sin(k * x - omega * this.time);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Reflected Wave y2 (Translucent Magenta Dashed)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = cy + (this.amp * 0.5) * Math.sin(k * x + omega * this.time);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Superposition Standing Wave: 2A sin(kx) cos(wt) (Glowing Bold White/Cyan)
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = cy + this.amp * Math.sin(k * x) * Math.cos(omega * this.time);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Mark Nodes (Red dots at x = n * lambda / 2)
    const halfLambda = wavelength / 2;
    if (halfLambda > 8) {
      for (let x = 0; x <= w; x += halfLambda) {
        ctx.beginPath();
        ctx.arc(x, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('N', x, cy - 10);
      }

      // 5. Mark Antinodes (Green diamonds at x = (2n+1) * lambda / 4)
      const qLambda = wavelength / 4;
      for (let x = qLambda; x <= w; x += halfLambda) {
        const envelope = this.amp * Math.abs(Math.sin(k * x));
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(x, cy - envelope - 6);
        ctx.lineTo(x + 4, cy - envelope);
        ctx.lineTo(x, cy - envelope + 6);
        ctx.lineTo(x - 4, cy - envelope);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('A', x, cy - envelope - 9);
      }
    }
  }

  drawKinematics(ctx, w, h) {
    const angleRad = (this.angle * Math.PI) / 180;
    const v0x = this.v0 * Math.cos(angleRad);
    const v0y = this.v0 * Math.sin(angleRad);
    const timeOfFlight = (2 * v0y) / this.g;
    const maxHeight = (v0y * v0y) / (2 * this.g);
    const range = v0x * timeOfFlight;

    // Ground line position
    const groundY = h - 45;
    const originX = 55;

    // Scaling factors to fit canvas beautifully
    const availW = w - 120;
    const availH = h - 90;
    const scaleX = availW / Math.max(range, 20);
    const scaleY = availH / Math.max(maxHeight * 1.3, 10);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = originX; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }
    for (let y = groundY; y > 0; y -= 40) { ctx.beginPath(); ctx.moveTo(originX, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Ground Platform
    ctx.fillStyle = 'rgba(18, 18, 24, 0.9)';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Ground hash lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x + 10, h); ctx.stroke();
    }

    // Launch Cannon / Pad
    ctx.save();
    ctx.translate(originX, groundY);
    ctx.rotate(-angleRad);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(-6, -10, 32, 10);
    ctx.restore();

    // 1. Draw Full Parabolic Trajectory (Dashed Indigo)
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let xm = 0; xm <= range; xm += range / 60) {
      const ym = Math.tan(angleRad) * xm - (this.g * xm * xm) / (2 * v0x * v0x);
      const px = originX + xm * scaleX;
      const py = groundY - ym * scaleY;
      if (xm === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Mark Max Height Point
    const apexX = originX + (range / 2) * scaleX;
    const apexY = groundY - maxHeight * scaleY;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(apexX, groundY);
    ctx.lineTo(apexX, apexY);
    ctx.lineTo(originX, apexY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(apexX, apexY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '10px monospace';
    ctx.fillText(`H_max: ${maxHeight.toFixed(1)}m`, apexX + 8, apexY - 4);

    // 3. Mark Range Point
    const rangePx = originX + range * scaleX;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(rangePx, groundY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(`Range: ${range.toFixed(1)}m`, rangePx - 30, groundY + 20);

    // 4. Animated Projectile Ball
    const cycleTime = timeOfFlight + 0.8;
    const curT = this.kinTime % cycleTime;
    let projX = originX;
    let projY = groundY;
    let vx = v0x;
    let vy = v0y;

    if (curT <= timeOfFlight) {
      const curXm = v0x * curT;
      const curYm = v0y * curT - 0.5 * this.g * curT * curT;
      projX = originX + curXm * scaleX;
      projY = groundY - curYm * scaleY;
      vx = v0x;
      vy = v0y - this.g * curT;
    } else {
      projX = rangePx;
      projY = groundY;
      vx = 0;
      vy = 0;
    }

    // Glowing sphere
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(projX, projY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Draw Tangent Velocity Vector Arrow
    if (curT <= timeOfFlight) {
      const speed = Math.sqrt(vx * vx + vy * vy);
      const vScale = 1.2;
      const arrowLen = Math.min(speed * vScale, 60);
      const angleV = Math.atan2(-vy * scaleY, vx * scaleX);

      const tipX = projX + Math.cos(angleV) * arrowLen;
      const tipY = projY + Math.sin(angleV) * arrowLen;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(projX, projY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Velocity label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`v(t): ${speed.toFixed(1)} m/s`, tipX + 6, tipY);

      // Downward Gravity Vector Arrow
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(projX, projY);
      ctx.lineTo(projX, projY + 28);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(projX - 3, projY + 25);
      ctx.lineTo(projX + 3, projY + 25);
      ctx.lineTo(projX, projY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillText(`g: ${this.g.toFixed(1)} m/s²`, projX + 6, projY + 28);
    }
  }

  drawOrbital(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    // Earth rendering
    const rEarthPx = Math.min(w, h) * 0.16;
    const maxAltitudeKm = 36000.0;
    const orbitRadiusPx = rEarthPx + 20 + (this.altitude / maxAltitudeKm) * (Math.min(w, h) * 0.28);

    // Subtle Stars Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const seed = [ [cx - 180, cy - 80], [cx + 190, cy - 110], [cx - 140, cy + 90], [cx + 170, cy + 80], [cx - 240, cy], [cx + 260, cy - 30] ];
    seed.forEach(s => {
      ctx.beginPath(); ctx.arc(s[0], s[1], 1.2, 0, Math.PI * 2); ctx.fill();
    });

    // Orbit Path (Dashed Glowing Cyan Circle)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, orbitRadiusPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Earth Sphere with Atmosphere Glow
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 24;
    const earthGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, rEarthPx);
    earthGrad.addColorStop(0, '#38bdf8');
    earthGrad.addColorStop(0.5, '#0284c7');
    earthGrad.addColorStop(0.8, '#0f766e');
    earthGrad.addColorStop(1, '#0c4a6e');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rEarthPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Earth Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rEarthPx, rEarthPx * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - rEarthPx);
    ctx.lineTo(cx, cy + rEarthPx);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🌍 Earth (M = 5.97×10²⁴ kg)', cx, cy + 4);

    // Animate Satellite in Orbit
    const G_val = 6.6743e-11;
    const M_val = 5.972e24;
    const r_total_m = (6371.0 + this.altitude) * 1000.0;
    const realSpeed = Math.sqrt((G_val * M_val) / r_total_m);
    // Keplerian angular speed visual scalar
    const visualOmega = (7800.0 / realSpeed) * (2000.0 / Math.max(orbitRadiusPx, 40)) * 0.015;

    if (!this.isPaused) {
      this.orbitAngle += visualOmega;
    }

    const satX = cx + orbitRadiusPx * Math.cos(this.orbitAngle);
    const satY = cy + orbitRadiusPx * Math.sin(this.orbitAngle);

    // Radius line from Earth center to Satellite
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(satX, satY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Satellite Body (Solar panels + Core)
    ctx.save();
    ctx.translate(satX, satY);
    ctx.rotate(this.orbitAngle + Math.PI / 2);

    // Solar Wings
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-16, -3, 9, 6);
    ctx.fillRect(7, -3, 9, 6);

    // Core Box
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    // Tangential Velocity Vector Arrow (Cyan)
    const tangAngle = this.orbitAngle + Math.PI / 2;
    const vArrowLen = 38;
    const tipVX = satX + Math.cos(tangAngle) * vArrowLen;
    const tipVY = satY + Math.sin(tangAngle) * vArrowLen;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(tipVX, tipVY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(tipVX, tipVY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = '10px monospace';
    ctx.fillText(`v_orbit: ${(realSpeed/1000).toFixed(2)} km/s`, tipVX + 6, tipVY);

    // Centripetal Gravitational Pull Vector Arrow (Magenta)
    const gArrowLen = 28;
    const tipGX = satX - Math.cos(this.orbitAngle) * gArrowLen;
    const tipGY = satY - Math.sin(this.orbitAngle) * gArrowLen;

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(tipGX, tipGY);
    ctx.stroke();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath(); ctx.arc(tipGX, tipGY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('F_grav', tipGX - 15, tipGY - 6);
  }

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  executeVoiceCommand(cmd) {
    if (!cmd) return;
    const action = (cmd.action || "").toLowerCase();
    const val = typeof cmd.value === "number" ? cmd.value : parseFloat(cmd.value || 0);
    const mode = (cmd.mode || "").toLowerCase();
    console.log("[MATH PHYSICS VOICE CMD]", cmd);

    if (action.includes("mode") || mode) {
      let targetMode = mode;
      if (!targetMode) {
        if (action.includes("wave") || action.includes("onde")) targetMode = "waves";
        else if (action.includes("kinematic") || action.includes("projectile") || action.includes("tir")) targetMode = "kinematics";
        else if (action.includes("orbit") || action.includes("satellite")) targetMode = "orbital";
      }
      if (targetMode && ["waves", "kinematics", "orbital"].includes(targetMode)) {
        this.setMode(targetMode);
        this.showVoiceToast(`🎙️ Gandho: Switched to ${targetMode.toUpperCase()} mode!`);
      }
    } else if (action.includes("frequency") || action.includes("fréquence") || action.includes("frequence")) {
      if (val > 0) {
        this.freq = Math.min(12, Math.max(1, val));
        const s = this.container.querySelector('#waveFreqSlider');
        if (s) s.value = this.freq;
        const lbl = this.container.querySelector('#sliderFreqVal');
        if (lbl) lbl.innerText = `${this.freq.toFixed(1)} Hz`;
        this.updateDerivationsInstant();
        this.solveCurrent();
        this.showVoiceToast(`🎙️ Gandho: Wave frequency set to ${this.freq} Hz!`);
      }
    } else if (action.includes("altitude") || action.includes("alt")) {
      if (val > 0 || cmd.preset) {
        let alt = val;
        if (cmd.preset === "iss" || action.includes("iss")) alt = 400;
        else if (cmd.preset === "hubble" || action.includes("hubble")) alt = 540;
        else if (cmd.preset === "gps" || action.includes("gps")) alt = 20200;
        else if (cmd.preset === "geo" || action.includes("geo")) alt = 35786;
        this.altitude = alt;
        const s = this.container.querySelector('#orbitAltSlider');
        if (s) s.value = this.altitude;
        const lbl = this.container.querySelector('#sliderAltVal');
        if (lbl) lbl.innerText = `${this.altitude} km`;
        this.updateDerivationsInstant();
        this.solveCurrent();
        this.showVoiceToast(`🎙️ Gandho: Orbit altitude set to ${this.altitude} km!`);
      }
    } else if (action.includes("reset") || action.includes("réinitialiser") || action.includes("reinit")) {
      this.time = 0;
      this.kinTime = 0;
      this.orbitAngle = 0;
      this.updateDerivationsInstant();
      this.showVoiceToast("🎙️ Gandho: Simulation reset.");
    } else if (action.includes("pause") || action.includes("stop")) {
      this.isPaused = !this.isPaused;
      this.showVoiceToast(`🎙️ Gandho: Simulation ${this.isPaused ? "paused" : "resumed"}.`);
    }
  }

  showVoiceToast(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 20px;
      background: linear-gradient(135deg, #9333ea, #a855f7);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 20px;
      box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4);
      z-index: 100;
      pointer-events: none;
      animation: fadeIn 0.3s ease;
    `;
    toast.innerText = msg;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }
}
