/**
 * Chemistry Bench Simulation - Two-Split Layout
 * Left: Full Interactive Bench (Glassware, Reagents, Pouring, pH Meter)
 * Right: Step-by-Step Instructions, Objective, Gandho Voice, and Auto-Grading
 */

import { ChemApiClient } from "./chem_api.js";
import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js";

export class ChemistryBench {
  constructor(containerElement, initialMission = "titration") {
    this.container = containerElement;
    this.api = new ChemApiClient();
    this.beakerReagents = [];
    this.currentIndicator = "phenolphthalein";
    this.dispenseVolume = 10;
    this.selectedReagent = "HCl";
    this.currentMissionKey = initialMission;
    this.currentResult = { ph: 7.0, total_volume_ml: 0 };

    this.missions = {
      titration: {
        title: "Acid-Base Neutralization Challenge",
        grade: "Grades 9–12",
        goal: "Neutralize 25 mL of 1.0 M Hydrochloric Acid (HCl) using 1.0 M Sodium Hydroxide (NaOH). Stop when the solution reaches exact stoichiometric equivalence (pH 7.00 ± 0.3) without turning permanent magenta pink!",
        steps: [
          "Observe beaker starting with 25 mL of 1.0 M HCl (pH 0.00).",
          "Ensure Phenolphthalein indicator is active.",
          "Calculate required NaOH: M₁V₁ = M₂V₂ → exactly 25 mL needed.",
          "Dispense NaOH, click 'Stir Solution', and check equivalence."
        ],
        targetLabel: "Target pH",
        targetVal: "7.00 ± 0.3",
        initialReagents: [{ name: "Hydrochloric Acid", formula: "HCl", volume_ml: 25, molarity: 1.0 }],
        checkGrading: (res, reagents) => {
          const ph = res.ph;
          if (ph >= 6.7 && ph <= 7.3) {
            return { pass: true, score: 100, title: "🎉 100% - Master Chemist!", msg: `Perfect neutralization! You reached pH ${ph.toFixed(2)}. All H⁺ ions were precisely neutralized by OH⁻ ions to form water and salt.` };
          } else if (ph < 6.7) {
            return { pass: false, score: 50, title: "⚠️ Still Acidic", msg: `Current pH is ${ph.toFixed(2)}. You haven't added enough base yet. Remember M₁V₁ = M₂V₂! Add more NaOH.` };
          } else {
            return { pass: false, score: 60, title: "⚠️ Overshot Equivalence!", msg: `Current pH is ${ph.toFixed(2)} (Basic Magenta). You added too much NaOH. Rinse beaker and try measuring carefully!` };
          }
        }
      },
      dilution: {
        title: "Precision Solution Dilution (M₁V₁ = M₂V₂)",
        grade: "Grades 8–11",
        goal: "You have 20 mL of 0.2 M Copper(II) Sulfate (CuSO₄). Add distilled water (H₂O) to dilute the solution concentration to exactly 0.05 M.",
        steps: [
          "Starting with 20 mL of 0.2 M CuSO₄ (Total solute = 0.004 moles).",
          "Use the dilution equation: (0.2 M)(20 mL) = (0.05 M)(V₂).",
          "V₂ = 80 mL total, so you must add exactly 60 mL of Distilled Water.",
          "Dispense water and click 'Check My Work & Grade'."
        ],
        targetLabel: "Target [CuSO₄]",
        targetVal: "0.05 M",
        initialReagents: [{ name: "Copper(II) Sulfate", formula: "CuSO4", volume_ml: 20, molarity: 0.2 }],
        checkGrading: (res, reagents) => {
          const conc = res.species_concentrations && res.species_concentrations["CuSO4"] !== undefined 
            ? res.species_concentrations["CuSO4"] 
            : (0.004 / (res.total_volume_ml / 1000));
          if (Math.abs(conc - 0.05) < 0.005) {
            return { pass: true, score: 100, title: "🎉 100% - Perfect Dilution!", msg: `Excellent precision! The concentration is ${conc.toFixed(3)} M. The blue shade lightened proportionally to solute concentration.` };
          } else if (conc > 0.05) {
            return { pass: false, score: 55, title: "⚠️ Too Concentrated", msg: `Current concentration is ${conc.toFixed(3)} M. Add more Distilled Water (H₂O) to reach 0.05 M.` };
          } else {
            return { pass: false, score: 60, title: "⚠️ Over-diluted", msg: `Current concentration is ${conc.toFixed(3)} M. You added too much water! Rinse and try again.` };
          }
        }
      },
      indicators: {
        title: "The Universal Indicator Spectrum",
        grade: "Grades 6–9",
        goal: "Explore how indicator colors map to the pH spectrum. Switch to Universal Indicator, create an acidic solution, a neutral solution, and a basic solution to observe the rainbow transition!",
        steps: [
          "Select 'Universal Indicator' on the right.",
          "Add HCl to see the deep red acid color (pH 0–3).",
          "Add NaOH until green (neutral, pH 7).",
          "Add excess NaOH to see purple / violet (base, pH 11–14)."
        ],
        targetLabel: "Target Exploration",
        targetVal: "Full Spectrum",
        initialReagents: [{ name: "Hydrochloric Acid", formula: "HCl", volume_ml: 15, molarity: 1.0 }],
        checkGrading: (res) => {
          return { pass: true, score: 100, title: "🌟 Spectrum Observed!", msg: `Great exploration! Current pH is ${res.ph.toFixed(2)} with color: ${res.indicator_state}.` };
        }
      }
    };

    this.reagentsCatalog = [
      { id: "HCl", name: "Hydrochloric Acid (1.0 M)", formula: "HCl", molarity: 1.0, color: "#38bdf8" },
      { id: "NaOH", name: "Sodium Hydroxide (1.0 M)", formula: "NaOH", molarity: 1.0, color: "#f43f5e" },
      { id: "H2SO4", name: "Sulfuric Acid (0.5 M)", formula: "H2SO4", molarity: 0.5, color: "#0284c7" },
      { id: "CuSO4", name: "Copper(II) Sulfate (0.2 M)", formula: "CuSO4", molarity: 0.2, color: "#06b6d4" },
      { id: "H2O", name: "Distilled Water (Pure)", formula: "H2O", molarity: 0.0, color: "#94a3b8" },
    ];

    this.render();
    this.bindEvents();
    this.initGandhoVoice();
    this.loadMission(this.currentMissionKey);
  }

  initGandhoVoice() {
    const micSlot = this.container.querySelector("#gandhoChemMicSlot");
    if (micSlot) {
      this.gandhoAssistant = new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "chemistry",
        mission: this.currentMissionKey,
        ph: this.currentResult.ph,
        totalVolume: this.currentResult.total_volume_ml,
        reagents: this.beakerReagents
      }));
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Full Bench Space (Glassware, Reagents, Controls) -->
        <div class="lab-split-left" style="overflow-y: auto !important; overflow-x: hidden; padding: 24px 24px 160px 24px; box-sizing: border-box;">
          <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; width: 100%; min-height: min-content;">
            <!-- Reagents & Dispenser Column -->
            <div style="width: 270px; min-width: 250px; display: flex; flex-direction: column; gap: 16px;">
              <div class="sidebar-section">
                <h4>🧪 Reagents Shelf</h4>
                <div id="reagentsShelf">
                  ${this.reagentsCatalog.map(r => `
                    <div class="reagent-pill-btn ${r.id === this.selectedReagent ? 'active' : ''}" data-reagent="${r.id}" draggable="true">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background:${r.color};"></span>
                        <span>${r.formula}</span>
                      </div>
                      <span style="font-size:0.75rem; color:#a1a1aa;">${r.molarity ? r.molarity + ' M' : 'Pure'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Dispenser Controls -->
              <div class="sidebar-section">
                <h4>💧 Dispense Control</h4>
                <div class="control-slider-group">
                  <label>
                    <span>Dispense Volume:</span>
                    <span id="dispenseVolLabel" style="color: #06b6d4; font-weight: 700;">10 mL</span>
                  </label>
                  <input type="range" id="dispenseSlider" min="1" max="50" step="1" value="10">
                </div>

                <button type="button" id="btnPourReagent" class="lab-action-btn btn-primary-chem" style="width: 100%;">
                  ➕ Dispense into Beaker
                </button>
              </div>

              <!-- Digital pH Analyzer -->
              <div class="sidebar-section">
                <h4>⚡ Digital pH Analyzer</h4>
                <div class="digital-ph-meter">
                  <div style="font-size: 0.72rem; color: #a1a1aa; text-transform: uppercase;">Aqueous Solution pH</div>
                  <div id="phValDisplay" class="ph-value-display" style="color: #ef4444;">0.00</div>
                  <div id="phStatusText" style="font-size: 0.78rem; font-weight: 600; color: #a1a1aa;">Acidic Solution</div>
                  <div class="ph-scale-bar">
                    <div id="phNeedle" class="ph-indicator-needle" style="left: 0%;"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Central Bench Glassware Area -->
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
              <!-- Main Reaction Beaker -->
              <div class="glassware-card target-beaker" id="mainBeakerCard">
                <div style="font-weight: 700; font-size: 0.95rem; display: flex; justify-content: space-between; width: 100%;">
                  <span>🔬 Reaction Vessel</span>
                  <span id="beakerVolLabel" style="color: #06b6d4;">25 mL</span>
                </div>

                <div class="glass-vessel" id="vesselContainer">
                  <div class="grad-lines">
                    <div class="grad-tick major"></div>
                    <div class="grad-tick"></div>
                    <div class="grad-tick major"></div>
                    <div class="grad-tick"></div>
                    <div class="grad-tick major"></div>
                  </div>
                  <div id="liquidFill" class="liquid-layer" style="height: 25%; background-color: #f8fafc;">
                    <div class="liquid-meniscus"></div>
                  </div>
                </div>

                <div class="glassware-meta">
                  <div id="reagentFormulaList" style="font-size: 0.82rem; font-weight: 600; color: #d4d4d8;">HCl (25 mL)</div>
                </div>

                <!-- Action Buttons below beaker -->
                <div style="display: flex; gap: 8px; margin-top: 14px; width: 100%;">
                  <button type="button" id="btnStir" class="lab-action-btn btn-secondary" style="flex: 1;">
                    🔄 Stir Solution
                  </button>
                  <button type="button" id="btnClearBeaker" class="lab-action-btn btn-secondary" style="color: #f43f5e;" title="Rinse & Reset">
                    🗑️ Reset
                  </button>
                </div>
              </div>

              <!-- Live Chemical Telemetry Log -->
              <div style="width: 100%; max-width: 440px; background: rgba(16, 16, 22, 0.85); border: 1px solid var(--lab-border); border-radius: 14px; padding: 16px;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.8rem; color: #a1a1aa; text-transform: uppercase;">
                  📊 Chemical Telemetry
                </h4>
                <div style="font-size: 0.82rem; line-height: 1.5; color: #e4e4e7;">
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #06b6d4;">Reaction Equation:</strong>
                    <div id="hudReactionEquation" style="font-style: italic;">Ready.</div>
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #06b6d4;">Stoichiometry:</strong>
                    <span id="hudStoichiometry">Active acid.</span>
                  </div>
                  <div>
                    <strong style="color: #06b6d4;">Species:</strong>
                    <span id="hudSpecies" style="font-family: monospace; color: #a1a1aa;">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Step-by-Step Instructions & Mission Drawer -->
        <div class="lab-split-right">
          <!-- Top Row with Gandho Voice -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" id="chemMissionBadge" style="margin: 0;">Grades 9–12 • Interactive Practice</span>
            <div id="gandhoChemMicSlot"></div>
          </div>

          <!-- Mission Selector Tabs -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="preset-pill active" data-mission="titration" style="font-size: 0.75rem;">1. Neutralization</button>
            <button type="button" class="preset-pill" data-mission="dilution" style="font-size: 0.75rem;">2. M₁V₁ = M₂V₂</button>
            <button type="button" class="preset-pill" data-mission="indicators" style="font-size: 0.75rem;">3. pH Spectrum</button>
          </div>

          <!-- Objective Card -->
          <div style="background: rgba(20, 20, 28, 0.7); border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h3 class="mission-title" id="chemMissionTitle" style="font-size: 1.1rem; margin-bottom: 8px;">Acid-Base Neutralization</h3>
            <p class="mission-goal" id="chemMissionGoal" style="margin: 0; font-size: 0.84rem; color: #d4d4d8; line-height: 1.5;">Goal description...</p>
          </div>

          <!-- Step-by-Step Procedure Checklist -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
              📋 Step-by-Step Instructions
            </h4>
            <ul class="mission-checklist" id="chemMissionSteps" style="margin: 0; line-height: 1.5;"></ul>
          </div>

          <!-- Live Mission Tracker Box -->
          <div class="mission-tracker-box">
            <div><span style="color:#a1a1aa;" id="chemTargetLabel">Target:</span> <strong style="color:#06b6d4;" id="chemTargetVal">7.00 ± 0.3</strong></div>
            <div><span style="color:#a1a1aa;">Current:</span> <strong style="color:#f43f5e;" id="chemCurrentVal">pH 0.00</strong></div>
            <div id="chemMissionStatus" style="font-weight:bold; color:#facc15;">🟡 IN PROGRESS</div>
          </div>

          <!-- Indicator Selection -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
              🌈 pH Indicator Mode
            </h4>
            <div style="display: flex; gap: 8px; flex-direction: column;">
              <label style="font-size: 0.82rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="indicatorOpt" value="phenolphthalein" checked>
                <span>Phenolphthalein (Pink at pH ≥ 8.2)</span>
              </label>
              <label style="font-size: 0.82rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="indicatorOpt" value="universal">
                <span>Universal Indicator (Rainbow Spectrum)</span>
              </label>
              <label style="font-size: 0.82rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="indicatorOpt" value="none">
                <span>None (Pure Solution Color)</span>
              </label>
            </div>
          </div>

          <!-- Check & Grade Lab Button -->
          <div style="margin-top: auto; padding-top: 10px;">
            <button type="button" class="btn-check-grade" id="btnChemCheckGrade" style="padding: 14px; font-size: 0.95rem;">
              ✅ Check & Grade Lab Work
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Reagent selection
    const shelfItems = this.container.querySelectorAll(".reagent-pill-btn");
    shelfItems.forEach(item => {
      item.addEventListener("click", () => {
        shelfItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        this.selectedReagent = item.dataset.reagent;
      });

      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.reagent);
      });
    });

    // Dispense slider
    const slider = this.container.querySelector("#dispenseSlider");
    const volLabel = this.container.querySelector("#dispenseVolLabel");
    slider.addEventListener("input", (e) => {
      this.dispenseVolume = parseInt(e.target.value, 10);
      volLabel.innerText = `${this.dispenseVolume} mL`;
    });

    // Pour Reagent button
    this.container.querySelector("#btnPourReagent").addEventListener("click", () => {
      this.addReagent(this.selectedReagent, this.dispenseVolume);
    });

    // Indicator radio
    this.container.querySelectorAll('input[name="indicatorOpt"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
        this.currentIndicator = e.target.value;
        this.updateSimulation();
      });
    });

    // Clear / Reset Beaker
    this.container.querySelector("#btnClearBeaker").addEventListener("click", () => {
      this.loadMission(this.currentMissionKey);
    });

    // Stir Solution
    this.container.querySelector("#btnStir").addEventListener("click", () => {
      const liquid = this.container.querySelector("#liquidFill");
      liquid.style.transform = "scaleY(1.05)";
      setTimeout(() => { liquid.style.transform = "scaleY(1)"; }, 300);
      this.updateSimulation();
    });

    // Drag and drop onto beaker
    const dropZone = this.container.querySelector("#mainBeakerCard");
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.style.borderColor = "#06b6d4"; });
    dropZone.addEventListener("dragleave", () => { dropZone.style.borderColor = "rgba(6, 182, 212, 0.5)"; });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "rgba(6, 182, 212, 0.5)";
      const reagentId = e.dataTransfer.getData("text/plain");
      if (reagentId) this.addReagent(reagentId, this.dispenseVolume);
    });

    // Mission Tabs
    const missionPills = this.container.querySelectorAll(".preset-pill");
    missionPills.forEach(pill => {
      pill.addEventListener("click", () => {
        missionPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.loadMission(pill.dataset.mission);
      });
    });

    // Check & Grade Button
    this.container.querySelector("#btnChemCheckGrade").addEventListener("click", () => {
      this.gradeCurrentMission();
    });
  }

  loadMission(missionKey) {
    this.currentMissionKey = missionKey;
    const m = this.missions[missionKey] || this.missions.titration;

    this.beakerReagents = JSON.parse(JSON.stringify(m.initialReagents));
    this.currentIndicator = missionKey === "indicators" ? "universal" : "phenolphthalein";

    const radio = this.container.querySelector(`input[name="indicatorOpt"][value="${this.currentIndicator}"]`);
    if (radio) radio.checked = true;

    this.container.querySelector("#chemMissionBadge").innerText = `${m.grade} • Interactive Practice`;
    this.container.querySelector("#chemMissionTitle").innerText = m.title;
    this.container.querySelector("#chemMissionGoal").innerText = m.goal;
    this.container.querySelector("#chemTargetLabel").innerText = `${m.targetLabel}:`;
    this.container.querySelector("#chemTargetVal").innerText = m.targetVal;

    const stepsList = this.container.querySelector("#chemMissionSteps");
    stepsList.innerHTML = m.steps.map(s => `<li style="margin-bottom:8px;"><span style="color:#06b6d4; font-weight:bold;">▸</span> <span>${s}</span></li>`).join('');

    this.updateSimulation();
  }

  addReagent(reagentId, volumeMl) {
    const item = this.reagentsCatalog.find(r => r.id === reagentId);
    if (!item) return;

    this.beakerReagents.push({
      name: item.name,
      formula: item.formula,
      volume_ml: volumeMl,
      molarity: item.molarity
    });

    this.updateSimulation();
  }

  async updateSimulation() {
    const result = await this.api.mixReagents(this.beakerReagents, this.currentIndicator);
    this.currentResult = result;

    const liquidFill = this.container.querySelector("#liquidFill");
    const volLabel = this.container.querySelector("#beakerVolLabel");
    const formulaList = this.container.querySelector("#reagentFormulaList");

    const pct = Math.min(100, (result.total_volume_ml / 120) * 100);
    liquidFill.style.height = `${pct}%`;
    liquidFill.style.backgroundColor = result.color_hex;

    volLabel.innerText = `${result.total_volume_ml} mL`;

    const formulas = this.beakerReagents.map(r => r.formula);
    formulaList.innerText = formulas.length ? formulas.join(" + ") : "Empty (Ready)";

    const phValDisplay = this.container.querySelector("#phValDisplay");
    const phStatusText = this.container.querySelector("#phStatusText");
    const phNeedle = this.container.querySelector("#phNeedle");

    phValDisplay.innerText = result.ph.toFixed(2);
    phStatusText.innerText = result.neutralization_status;

    const needlePct = Math.max(0, Math.min(100, (result.ph / 14) * 100));
    phNeedle.style.left = `${needlePct}%`;

    if (result.ph < 6.5) phValDisplay.style.color = "#ef4444";
    else if (result.ph > 7.5) phValDisplay.style.color = "#a855f7";
    else phValDisplay.style.color = "#22c55e";

    const currentValText = this.container.querySelector("#chemCurrentVal");
    const statusLabel = this.container.querySelector("#chemMissionStatus");

    if (this.currentMissionKey === "titration") {
      currentValText.innerText = `pH ${result.ph.toFixed(2)}`;
      if (result.ph >= 6.7 && result.ph <= 7.3) {
        statusLabel.innerText = "🟢 TARGET REACHED!";
        statusLabel.style.color = "#10b981";
      } else {
        statusLabel.innerText = "🟡 IN PROGRESS";
        statusLabel.style.color = "#facc15";
      }
    } else if (this.currentMissionKey === "dilution") {
      const conc = result.species_concentrations && result.species_concentrations["CuSO4"] !== undefined 
        ? result.species_concentrations["CuSO4"] : (0.004 / (result.total_volume_ml / 1000));
      currentValText.innerText = `${conc.toFixed(3)} M`;
      if (Math.abs(conc - 0.05) < 0.005) {
        statusLabel.innerText = "🟢 TARGET REACHED!";
        statusLabel.style.color = "#10b981";
      } else {
        statusLabel.innerText = "🟡 IN PROGRESS";
        statusLabel.style.color = "#facc15";
      }
    }

    // HUD
    this.container.querySelector("#hudReactionEquation").innerText = result.reaction_summary;
    this.container.querySelector("#hudStoichiometry").innerText = `${result.neutralization_status} | Indicator: ${result.indicator_state}`;

    const hudSpecies = this.container.querySelector("#hudSpecies");
    if (result.species_concentrations && Object.keys(result.species_concentrations).length) {
      hudSpecies.innerHTML = Object.entries(result.species_concentrations)
        .map(([k, v]) => `<div>[${k}]: ${v} M</div>`)
        .join("");
    } else {
      hudSpecies.innerText = `Total Vol: ${result.total_volume_ml} mL`;
    }

    // Push live chemistry telemetry to Gandho Socratic Tutor
    window.currentSocraticLabContext = {
      experiment_id: "chem_" + this.currentMissionKey,
      title: "Chemistry Lab: " + (this.currentMissionKey === "titration" ? "Acid-Base Titration" : (this.currentMissionKey === "dilution" ? "Solution Dilution" : "pH Indicators")),
      total_volume_ml: result.total_volume_ml,
      current_ph: result.ph.toFixed(2),
      status: result.neutralization_status,
      color: result.color_hex,
      indicator: this.currentIndicator,
      reagents_in_beaker: this.beakerReagents.map(r => `${r.volume_ml}mL of ${r.name} (${r.formula})`),
      target: this.currentMissionKey === "titration" ? "pH 7.00 stoichiometric equivalence" : "0.050 M dilution"
    };
    if (typeof window.updateActiveViewState === "function") {
      window.updateActiveViewState();
    }
  }

  gradeCurrentMission() {
    const m = this.missions[this.currentMissionKey] || this.missions.titration;
    const grade = m.checkGrading(this.currentResult, this.beakerReagents);

    const modal = document.createElement("div");
    modal.className = "grade-feedback-modal";
    modal.innerHTML = `
      <div class="grade-card ${grade.pass ? '' : 'fail'}">
        <div style="font-size: 3rem; margin-bottom: 12px;">${grade.pass ? '🏆' : '🔬'}</div>
        <h2 style="margin: 0 0 8px 0; color: ${grade.pass ? '#10b981' : '#ef4444'};">${grade.title}</h2>
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 14px; color: #ffffff;">Grade: ${grade.score}%</div>
        <p style="color: #d4d4d8; font-size: 0.92rem; line-height: 1.5; margin: 0 0 24px 0;">
          ${grade.msg}
        </p>
        <button type="button" class="lab-action-btn ${grade.pass ? 'btn-primary-chem' : 'btn-secondary'}" id="btnCloseChemGrade" style="width: 100%;">
          ${grade.pass ? 'Continue Practicing ➔' : 'Try Again'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#btnCloseChemGrade").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }
}
