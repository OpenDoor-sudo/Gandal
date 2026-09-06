/**
 * Mathematical Physics & Wave Mechanics - Powered by SymPy & SciPy
 * Interactive Standing Wave simulation, Kinematic Calculus, and Orbital Mechanics.
 */

import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js";

export class MathPhysicsLab {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentMode = "waves";
    this.animId = null;
    this.time = 0;

    // Wave parameters
    this.freq = 4.0; // Hz
    this.amp = 40.0; // px
    this.speed = 120.0; // px/s

    this.render();
    this.bindEvents();
    this.startWaveLoop();
    this.solveCurrent();
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Interactive Wave / Physics Canvas -->
        <div class="lab-split-left" style="padding: 24px 24px 140px 24px; box-sizing: border-box; overflow-y: auto;">
          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Canvas Simulation Box -->
            <div style="background: #14141a; border: 2px solid var(--lab-border); border-radius: 18px; padding: 20px; text-align: center;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="mission-badge" style="margin: 0; background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.4); color: #818cf8;">
                  ⚛️ SymPy Harmonic Wave Engine
                </span>
                <span id="waveEquationDisplay" style="font-family: monospace; font-size: 0.95rem; font-weight: bold; color: #38bdf8;">
                  y(x, t) = A · sin(kx - ωt)
                </span>
              </div>

              <!-- Animated Wave Canvas -->
              <div style="background: #09090d; border-radius: 12px; border: 1px solid #27272a; height: 280px; position: relative; overflow: hidden;">
                <canvas id="mathPhysCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
              </div>
            </div>

            <!-- Mathematical Derivations Card -->
            <div style="background: #14141a; border: 1px solid var(--lab-border); border-radius: 16px; padding: 20px;">
              <h4 style="margin: 0 0 14px 0; font-size: 0.85rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">
                📐 SymPy Symbolic Calculus & Derivations
              </h4>
              <div id="mathDerivationsBox" style="font-family: monospace; font-size: 0.9rem; line-height: 1.6; color: #e4e4e7; background: #0c0c10; padding: 16px; border-radius: 10px; border: 1px solid #27272a;">
                Computing symbolic equations...
              </div>
            </div>

            <!-- Nodes & Antinodes Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="sidebar-section" style="margin: 0;">
                <h4 style="color: #ef4444;">🔴 Nodes (Zero Displacement, x = n·λ/2)</h4>
                <div id="nodesList" style="font-family: monospace; font-size: 0.88rem; color: #d4d4d8;">-</div>
              </div>
              <div class="sidebar-section" style="margin: 0;">
                <h4 style="color: #10b981;">🟢 Antinodes (Max Amplitude, x = (2n+1)·λ/4)</h4>
                <div id="antinodesList" style="font-family: monospace; font-size: 0.88rem; color: #d4d4d8;">-</div>
              </div>
            </div>

          </div>
        </div>

        <!-- RIGHT: Sliders & Modes -->
        <div class="lab-split-right">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" style="margin: 0;">Grades 10–12 • Physics Calculus</span>
            <div id="mathPhysGandhoSlot"></div>
          </div>

          <!-- Mode Pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="preset-pill active" data-mode="waves" style="font-size: 0.75rem;">1. Standing Waves</button>
            <button type="button" class="preset-pill" data-mode="kinematics" style="font-size: 0.75rem;">2. Projectile Calculus</button>
            <button type="button" class="preset-pill" data-mode="orbital" style="font-size: 0.75rem;">3. Orbital Mechanics</button>
          </div>

          <!-- Sliders Box -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 14px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa;">
              ⚙️ Wave & Calculus Sliders
            </h4>

            <div class="control-slider-group">
              <label>
                <span>Frequency (f):</span>
                <span id="sliderFreqVal" style="color: #818cf8; font-weight: bold;">4.0 Hz</span>
              </label>
              <input type="range" id="waveFreqSlider" min="1" max="12" step="0.5" value="4">
            </div>

            <div class="control-slider-group">
              <label>
                <span>Amplitude (A):</span>
                <span id="sliderAmpVal" style="color: #38bdf8; font-weight: bold;">40 px</span>
              </label>
              <input type="range" id="waveAmpSlider" min="10" max="70" step="2" value="40">
            </div>

            <div class="control-slider-group">
              <label>
                <span>Propagation Speed (v):</span>
                <span id="sliderSpeedVal" style="color: #06b6d4; font-weight: bold;">120 px/s</span>
              </label>
              <input type="range" id="waveSpeedSlider" min="40" max="300" step="10" value="120">
            </div>
          </div>

          <!-- Calculated Telemetry -->
          <div class="mission-tracker-box">
            <div><span style="color:#a1a1aa;">Wavelength (λ = v/f):</span> <strong style="color:#38bdf8;" id="calcWavelength">30.0 px</strong></div>
            <div><span style="color:#a1a1aa;">Period (T = 1/f):</span> <strong style="color:#818cf8;" id="calcPeriod">0.25 s</strong></div>
            <div><span style="color:#a1a1aa;">Angular Freq (ω = 2πf):</span> <strong style="color:#a855f7;" id="calcOmega">25.1 rad/s</strong></div>
          </div>

          <!-- Scientific Note -->
          <div style="margin-top: auto; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 12px; padding: 14px;">
            <strong style="color: #818cf8; font-size: 0.82rem;">💡 About SymPy & SciPy:</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: #d4d4d8; line-height: 1.45;">
              SymPy evaluates exact mathematical derivatives (d/dt) and integrals, while SciPy computes numerical wave mechanics, Fourier harmonics, and differential orbital trajectories.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Mode switcher
    this.container.querySelectorAll(".preset-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.container.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentMode = pill.dataset.mode;
        this.solveCurrent();
      });
    });

    // Sliders
    const fSlider = this.container.querySelector("#waveFreqSlider");
    const aSlider = this.container.querySelector("#waveAmpSlider");
    const vSlider = this.container.querySelector("#waveSpeedSlider");

    fSlider.addEventListener("input", (e) => {
      this.freq = parseFloat(e.target.value);
      this.container.querySelector("#sliderFreqVal").innerText = `${this.freq.toFixed(1)} Hz`;
      this.solveCurrent();
    });

    aSlider.addEventListener("input", (e) => {
      this.amp = parseFloat(e.target.value);
      this.container.querySelector("#sliderAmpVal").innerText = `${this.amp.toFixed(0)} px`;
      this.solveCurrent();
    });

    vSlider.addEventListener("input", (e) => {
      this.speed = parseFloat(e.target.value);
      this.container.querySelector("#sliderSpeedVal").innerText = `${this.speed.toFixed(0)} px/s`;
      this.solveCurrent();
    });

    // Gandho mic
    const micSlot = this.container.querySelector("#mathPhysGandhoSlot");
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "physics_calculus",
        mode: this.currentMode,
        frequency: this.freq,
        wavelength: this.speed / this.freq
      }));
    }
  }

  async solveCurrent() {
    try {
      const resp = await fetch("/api/v1/physics/calculus/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: this.currentMode,
          params: { frequency: this.freq, amplitude: this.amp / 20.0, speed: this.speed }
        })
      });
      const data = await resp.json();
      if (!data.success) return;

      const derivBox = this.container.querySelector("#mathDerivationsBox");
      if (this.currentMode === "waves") {
        derivBox.innerHTML = `
          <div><strong>Wave Function:</strong> ${data.wave_equation_str}</div>
          <div style="margin-top:6px;"><strong>Wave Number (k = 2π/λ):</strong> ${data.wavenumber_k} rad/m</div>
          <div><strong>Angular Frequency (ω = 2πf):</strong> ${data.angular_frequency_omega} rad/s</div>
          <div style="margin-top:6px; color:#10b981;"><strong>Superposition:</strong> y_total = 2A · sin(kx) · cos(ωt)</div>
        `;
        this.container.querySelector("#calcWavelength").innerText = `${(this.speed / this.freq).toFixed(1)} px`;
        this.container.querySelector("#calcPeriod").innerText = `${(1.0 / this.freq).toFixed(3)} s`;
        this.container.querySelector("#calcOmega").innerText = `${data.angular_frequency_omega} rad/s`;

        this.container.querySelector("#nodesList").innerText = data.first_nodes_m.map(n => `${n}m`).join(", ");
        this.container.querySelector("#antinodesList").innerText = data.first_antinodes_m.map(a => `${a}m`).join(", ");
      } else if (this.currentMode === "kinematics") {
        derivBox.innerHTML = `
          <div><strong>Position s(t):</strong> ${data.symbolic_position}</div>
          <div style="color:#38bdf8; margin-top:4px;"><strong>Velocity v(t) = s'(t):</strong> ${data.symbolic_velocity}</div>
          <div style="color:#f43f5e; margin-top:4px;"><strong>Acceleration a(t) = v'(t):</strong> ${data.symbolic_acceleration}</div>
          <div style="margin-top:8px;"><strong>Time of Flight:</strong> ${data.time_of_flight_s} s | <strong>Max Height:</strong> ${data.max_height_m} m | <strong>Range:</strong> ${data.range_m} m</div>
        `;
      } else if (this.currentMode === "orbital") {
        derivBox.innerHTML = `
          <div><strong>Velocity:</strong> ${data.equation_str} = ${data.orbital_velocity_ms} m/s (${data.orbital_velocity_kmh} km/h)</div>
          <div style="color:#a855f7; margin-top:4px;"><strong>Orbital Radius:</strong> ${data.orbital_radius_km} km</div>
        `;
      }

      // Push telemetry to Gandho Socratic Tutor
      window.currentSocraticLabContext = {
        experiment_id: "phys_math",
        title: "Mathematical Physics & Wave Mechanics",
        mode: this.currentMode,
        parameters: this.currentMode === "standing_wave" 
          ? `Frequency: ${this.freq}Hz, Amplitude: ${this.amplitude}px, Speed: ${this.speed}px/s, Nodes: ${data.first_nodes_m ? data.first_nodes_m.slice(0, 3).join(', ') : 'calculated'}`
          : (this.currentMode === "kinematics" ? `Velocity: ${data.symbolic_velocity}, Range: ${data.range_m}m` : `Orbital Speed: ${data.orbital_velocity_ms} m/s, Period: ${data.period_minutes} min`),
        status: `Simulating ${this.currentMode} physics calculus and harmonic equations`
      };
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }
    } catch (e) {
      console.warn("Math solver error:", e);
    }
  }

  startWaveLoop() {
    const canvas = this.container.querySelector("#mathPhysCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderFrame = () => {
      canvas.width = canvas.parentElement.clientWidth || 700;
      canvas.height = canvas.parentElement.clientHeight || 280;

      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Grid & Center Axis
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      const wavelength = this.speed / this.freq;
      const k = (2 * Math.PI) / wavelength;
      const omega = 2 * Math.PI * this.freq;

      this.time += 0.016;

      // Draw Standing Wave envelope (2A sin(kx) cos(wt))
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        // Superposition: forward + reflected wave = standing wave
        const y = cy + 2 * (this.amp / 2) * Math.sin(k * x) * Math.cos(omega * this.time);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mark Nodes (Red dots where displacement is always 0)
      for (let x = 0; x < w; x += wavelength / 2) {
        ctx.beginPath();
        ctx.arc(x, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
      }

      this.animId = requestAnimationFrame(renderFrame);
    };

    this.animId = requestAnimationFrame(renderFrame);
  }

  stopLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
