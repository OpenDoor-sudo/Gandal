/**
 * PubChem & ChEMBL Chemical Database Inspector
 * Instant search with 100% offline curriculum caching, GHS hazards, and RDKit vector structure.
 */

import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js";

export class PubchemInspector {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentQuery = "aspirin";
    this.popular = ["Aspirin", "Caffeine", "Glucose", "Ethanol", "Ibuprofen", "Benzene", "Methane", "Water"];

    this.render();
    this.bindEvents();
    this.searchChemical(this.currentQuery);
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Chemical Record Display -->
        <div class="lab-split-left" style="padding: 24px 24px 140px 24px; box-sizing: border-box; overflow-y: auto;">
          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Header Card -->
            <div style="background: #14141a; border: 2px solid var(--lab-border); border-radius: 18px; padding: 24px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <span class="mission-badge" id="badgeSource" style="margin: 0 0 8px 0; background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: #10b981;">
                    ⚡ 100% Offline Local Cache
                  </span>
                  <h2 id="chemNameDisplay" style="margin: 0 0 6px 0; font-size: 1.8rem; color: #ffffff;">Aspirin</h2>
                  <div id="chemIupacDisplay" style="font-family: monospace; font-size: 0.9rem; color: #38bdf8;">2-acetyloxybenzoic acid</div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">PUBCHEM CID</span>
                  <div id="chemCidDisplay" style="font-size: 1.4rem; font-weight: bold; color: #06b6d4; font-family: monospace;">2244</div>
                </div>
              </div>

              <p id="chemDescDisplay" style="color: #d4d4d8; font-size: 0.92rem; line-height: 1.5; margin: 12px 0 0 0; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
                Acetylsalicylic acid, a nonsteroidal anti-inflammatory drug.
              </p>
            </div>

            <!-- Key Scientific Properties Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
              <div class="sidebar-section" style="margin: 0; padding: 16px;">
                <span style="font-size: 0.72rem; color: #a1a1aa;">MOLECULAR FORMULA</span>
                <div id="propFormula" style="font-size: 1.4rem; font-weight: bold; color: #a855f7; font-family: monospace;">C9H8O4</div>
              </div>
              <div class="sidebar-section" style="margin: 0; padding: 16px;">
                <span style="font-size: 0.72rem; color: #a1a1aa;">MOLECULAR WEIGHT</span>
                <div id="propMW" style="font-size: 1.4rem; font-weight: bold; color: #06b6d4; font-family: monospace;">180.16 g/mol</div>
              </div>
              <div class="sidebar-section" style="margin: 0; padding: 16px;">
                <span style="font-size: 0.72rem; color: #a1a1aa;">GHS SAFETY & HAZARD</span>
                <div id="propHazard" style="font-size: 1.05rem; font-weight: bold; color: #f59e0b; margin-top: 4px;">Harmful (GHS07)</div>
              </div>
            </div>

            <!-- 2D Structure Preview Card -->
            <div style="background: #14141a; border: 1px solid var(--lab-border); border-radius: 16px; padding: 20px;">
              <h4 style="margin: 0 0 14px 0; font-size: 0.85rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">
                🧬 RDKit 2D Chemical Structure
              </h4>
              <div id="pubchemSvgBox" style="min-height: 260px; display: flex; align-items: center; justify-content: center; background: #0c0c10; border-radius: 12px; border: 1px solid #27272a; padding: 10px;">
                <div style="color: #a1a1aa;">Rendering vector structure...</div>
              </div>
            </div>

          </div>
        </div>

        <!-- RIGHT: Search Bar & Presets -->
        <div class="lab-split-right">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" style="margin: 0;">Chemical Database</span>
            <div id="pubchemGandhoSlot"></div>
          </div>

          <!-- Search Input -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa;">
              🔍 Search PubChem & ChEMBL
            </h4>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="dbSearchInput" value="Aspirin" style="flex: 1; background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; padding: 10px; color: #ffffff; font-size: 0.88rem;" placeholder="e.g. Caffeine or Glucose">
              <button type="button" id="btnSearchDb" class="lab-action-btn btn-primary-chem" style="padding: 10px 14px;">
                Search
              </button>
            </div>
            <div id="searchStatusMsg" style="font-size: 0.76rem; color: #a1a1aa; margin-top: 6px;">100% offline-ready database.</div>
          </div>

          <!-- Popular Compounds Chips -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa;">
              ⭐ Quick Lookup Chips
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${this.popular.map(p => `
                <button type="button" class="reagent-pill-btn quick-search-btn" data-query="${p}" style="padding: 6px 12px; font-size: 0.8rem;">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Database Architecture Info -->
          <div style="margin-top: auto; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 14px;">
            <strong style="color: #10b981; font-size: 0.82rem;">🛡️ Offline Resilience Architecture:</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: #d4d4d8; line-height: 1.45;">
              This lab queries a local offline cache on the Ventuno appliance. When online, it connects to NCBI PubChem PUG REST API and ChEMBL and automatically caches records for offline learning.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const input = this.container.querySelector("#dbSearchInput");
    const btn = this.container.querySelector("#btnSearchDb");

    btn.addEventListener("click", () => {
      if (input.value.trim()) this.searchChemical(input.value.trim());
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) this.searchChemical(input.value.trim());
    });

    this.container.querySelectorAll(".quick-search-btn").forEach(chip => {
      chip.addEventListener("click", () => {
        input.value = chip.dataset.query;
        this.searchChemical(chip.dataset.query);
      });
    });

    // Gandho mic
    const micSlot = this.container.querySelector("#pubchemGandhoSlot");
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "pubchem_database",
        compound: this.currentQuery
      }));
    }
  }

  async searchChemical(query) {
    this.currentQuery = query;
    const statusMsg = this.container.querySelector("#searchStatusMsg");
    statusMsg.innerText = `Searching for '${query}'...`;
    statusMsg.style.color = "#06b6d4";

    try {
      const resp = await fetch(`/api/v1/chemistry/database/search?q=${encodeURIComponent(query)}`);
      const res = await resp.json();

      if (!res.success) {
        statusMsg.innerText = res.error;
        statusMsg.style.color = "#ef4444";
        return;
      }

      const data = res.data;
      statusMsg.innerText = `Found in ${res.source === "offline_cache" ? "Offline Cache" : "Live PubChem API"}!`;
      statusMsg.style.color = "#10b981";

      this.container.querySelector("#chemNameDisplay").innerText = data.name;
      this.container.querySelector("#chemIupacDisplay").innerText = data.iupac;
      this.container.querySelector("#chemCidDisplay").innerText = data.cid;
      this.container.querySelector("#chemDescDisplay").innerText = data.description;
      this.container.querySelector("#propFormula").innerText = data.formula;
      this.container.querySelector("#propMW").innerText = `${data.mw} g/mol`;
      this.container.querySelector("#propHazard").innerText = data.hazard;

      const badge = this.container.querySelector("#badgeSource");
      if (res.source === "offline_cache") {
        badge.innerText = "⚡ 100% Offline Local Cache";
        badge.style.color = "#10b981";
      } else {
        badge.innerText = "🌐 Synced from PubChem REST API";
        badge.style.color = "#38bdf8";
      }

      // Render 2D SVG via RDKit if SMILES is present
      if (data.smiles) {
        this.renderSvg(data.smiles);
      }

      // Push telemetry to Gandho Socratic Tutor
      window.currentSocraticLabContext = {
        experiment_id: "chem_pubchem",
        title: "PubChem Chemical Database Inspector",
        compound_name: data.name,
        formula: data.formula,
        molecular_weight: `${data.mw} g/mol`,
        iupac: data.iupac,
        hazard: data.hazard,
        status: `Inspecting verified chemical database record for ${data.name} (${data.formula})`
      };
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }

    } catch (e) {
      statusMsg.innerText = `Search error: ${e.message}`;
      statusMsg.style.color = "#ef4444";
    }
  }

  async renderSvg(smiles) {
    const svgBox = this.container.querySelector("#pubchemSvgBox");
    try {
      const resp = await fetch("/api/v1/chemistry/molecule/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles })
      });
      const data = await resp.json();
      if (data.success && data.svg) {
        svgBox.innerHTML = data.svg;
        const svgEl = svgBox.querySelector("svg");
        if (svgEl) {
          svgEl.style.width = "100%";
          svgEl.style.maxHeight = "280px";
          svgEl.querySelectorAll("path").forEach(p => {
            if (p.getAttribute("stroke") === "#000000") p.setAttribute("stroke", "#ffffff");
          });
        }
      } else {
        svgBox.innerHTML = `<div style="color:#a1a1aa;padding:24px;text-align:center;">Structure preview unavailable for ${smiles}</div>`;
      }
    } catch (err) {
      console.warn("SVG render error:", err);
      svgBox.innerHTML = `<div style="color:#a1a1aa;padding:24px;text-align:center;">Could not render ${smiles}</div>`;
    }
  }
}
