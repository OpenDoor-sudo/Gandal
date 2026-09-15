/**
 * Organic Chemistry & Molecular Designer - Powered by RDKit
 * Interactive 2D chemical structure generator, SMILES parser, and descriptor analyzer.
 */

import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js";

export class RdkitViewer {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentSmiles = "CC(=O)Oc1ccccc1C(=O)O"; // Aspirin
    this.presets = [
      { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O", desc: "Common pain reliever & anti-inflammatory" },
      { name: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C", desc: "Central nervous system stimulant" },
      { name: "Ethanol", smiles: "CCO", desc: "Primary drinking alcohol & antiseptic" },
      { name: "Glucose", smiles: "C(C(C(C(C(C=O)O)O)O)O)O", desc: "Essential monosaccharide energy source" },
      { name: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O", desc: "Nonsteroidal anti-inflammatory drug" },
      { name: "Benzene", smiles: "c1ccccc1", desc: "Aromatic conjugated ring system" },
      { name: "Dopamine", smiles: "c1cc(c(cc1CCN)O)O", desc: "Neurotransmitter regulating reward and movement" }
    ];

    this.render();
    this.bindEvents();
    this.loadMolecule(this.currentSmiles);
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Interactive Molecular Structure Display -->
        <div class="lab-split-left" style="padding: 24px 24px 140px 24px; box-sizing: border-box; overflow-y: auto;">
          <div style="max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- SVG Structure Viewer Card -->
            <div style="background: #14141a; border: 2px solid var(--lab-border); border-radius: 18px; padding: 20px; text-align: center; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="mission-badge" style="margin: 0; background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.4); color: #06b6d4;">
                  ⚗️ RDKit 2D Vector Structure
                </span>
                <span id="molFormulaBadge" style="font-family: monospace; font-size: 1.05rem; font-weight: bold; color: #a855f7;">
                  C9H8O4
                </span>
              </div>

              <!-- SVG Canvas Box -->
              <div id="rdkitSvgBox" style="min-height: 320px; display: flex; align-items: center; justify-content: center; background: #0c0c10; border-radius: 12px; border: 1px solid #27272a; padding: 10px;">
                <div style="color: #a1a1aa; font-size: 0.9rem;">Rendering molecular bonds via RDKit...</div>
              </div>
            </div>

            <!-- Physicochemical Descriptors Grid -->
            <div style="background: #14141a; border: 1px solid var(--lab-border); border-radius: 16px; padding: 20px;">
              <h4 style="margin: 0 0 14px 0; font-size: 0.85rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">
                📊 Molecular Properties & Descriptors
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">MOLECULAR WEIGHT</span>
                  <div id="descMW" style="font-size: 1.3rem; font-weight: bold; color: #06b6d4; font-family: monospace;">- g/mol</div>
                </div>
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">LOGP (LIPOPHILICITY)</span>
                  <div id="descLogP" style="font-size: 1.3rem; font-weight: bold; color: #38bdf8; font-family: monospace;">-</div>
                </div>
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">POLAR SURFACE (TPSA)</span>
                  <div id="descTPSA" style="font-size: 1.3rem; font-weight: bold; color: #a855f7; font-family: monospace;">- Å²</div>
                </div>
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">H-BOND DONORS / ACCEPTORS</span>
                  <div id="descHBonds" style="font-size: 1.3rem; font-weight: bold; color: #10b981; font-family: monospace;">- / -</div>
                </div>
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">ROTATABLE BONDS</span>
                  <div id="descRotBonds" style="font-size: 1.3rem; font-weight: bold; color: #facc15; font-family: monospace;">-</div>
                </div>
                <div class="sidebar-section" style="margin:0; padding: 12px;">
                  <span style="font-size: 0.72rem; color: #a1a1aa;">TOTAL ATOMS</span>
                  <div id="descAtoms" style="font-size: 1.3rem; font-weight: bold; color: #f43f5e; font-family: monospace;">-</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- RIGHT: Molecules Preset Shelf & SMILES Input -->
        <div class="lab-split-right">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" style="margin: 0;">Grades 10–12 • Organic Chemistry</span>
            <div id="rdkitGandhoMicSlot"></div>
          </div>

          <!-- SMILES Direct Input -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa;">
              ⌨️ Custom SMILES Formula
            </h4>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="smilesInput" value="CC(=O)Oc1ccccc1C(=O)O" style="flex: 1; background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; padding: 10px; color: #ffffff; font-family: monospace; font-size: 0.85rem;" placeholder="e.g. CCO or c1ccccc1">
              <button type="button" id="btnRenderSmiles" class="lab-action-btn btn-primary-chem" style="padding: 10px 14px;">
                Render
              </button>
            </div>
            <div id="smilesError" style="color: #ef4444; font-size: 0.78rem; margin-top: 6px; display: none;"></div>
          </div>

          <!-- Common Molecules Shelf -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa;">
              💊 Essential Curriculum Molecules
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${this.presets.map(p => `
                <div class="reagent-pill-btn preset-mol-btn" data-smiles="${p.smiles}" style="padding: 10px 12px; border-radius: 10px;">
                  <div>
                    <strong style="color: #ffffff; font-size: 0.88rem;">${p.name}</strong>
                    <div style="font-size: 0.74rem; color: #a1a1aa;">${p.desc}</div>
                  </div>
                  <span style="font-size: 0.8rem; color: #06b6d4;">➔</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Scientific Note -->
          <div style="margin-top: auto; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 14px;">
            <strong style="color: #06b6d4; font-size: 0.82rem;">💡 About RDKit:</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: #d4d4d8; line-height: 1.45;">
              RDKit is the world-leading open-source cheminformatics toolkit. It calculates exact electron density, aromatic kekulization, and topological surface area in real-time.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const input = this.container.querySelector("#smilesInput");
    const btn = this.container.querySelector("#btnRenderSmiles");

    btn.addEventListener("click", () => {
      if (input.value.trim()) this.loadMolecule(input.value.trim());
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) this.loadMolecule(input.value.trim());
    });

    this.container.querySelectorAll(".preset-mol-btn").forEach(card => {
      card.addEventListener("click", () => {
        const smiles = card.dataset.smiles;
        input.value = smiles;
        this.loadMolecule(smiles);
      });
    });

    // Gandho mic
    const micSlot = this.container.querySelector("#rdkitGandhoMicSlot");
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "organic_chemistry",
        smiles: this.currentSmiles
      }));
    }
  }

  paintSvg(svgMarkup, data) {
    const svgBox = this.container.querySelector("#rdkitSvgBox");
    if (!svgBox || !svgMarkup) return;
    svgBox.innerHTML = svgMarkup;
    const svgEl = svgBox.querySelector("svg");
    if (svgEl) {
      svgEl.style.width = "100%";
      svgEl.style.maxHeight = "340px";
      svgEl.querySelectorAll("path").forEach((p) => {
        if (p.getAttribute("stroke") === "#000000") p.setAttribute("stroke", "#ffffff");
      });
    }
    if (!data) return;
    const setText = (id, value) => {
      const el = this.container.querySelector(id);
      if (el) el.innerText = value;
    };
    if (data.formula) setText("#molFormulaBadge", data.formula);
    if (data.molecular_weight !== undefined) setText("#descMW", `${data.molecular_weight} g/mol`);
    if (data.logp !== undefined) setText("#descLogP", String(data.logp));
    if (data.tpsa !== undefined) setText("#descTPSA", `${data.tpsa} Å²`);
    if (data.h_donors !== undefined) setText("#descHBonds", `${data.h_donors} / ${data.h_acceptors}`);
    if (data.rotatable_bonds !== undefined) setText("#descRotBonds", String(data.rotatable_bonds));
    if (data.num_atoms !== undefined) {
      setText("#descAtoms", `${data.num_atoms} (${data.num_heavy_atoms || 0} heavy)`);
    }
  }

  paintSvgFallback(smiles, data) {
    const formula = (data && data.formula) || smiles;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" width="100%" height="320">
      <rect width="420" height="320" fill="#0c0c10" rx="12"/>
      <text x="210" y="150" text-anchor="middle" fill="#ffffff" font-size="28" font-family="monospace">${formula}</text>
      <text x="210" y="190" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="monospace">${smiles}</text>
    </svg>`;
    this.paintSvg(svg, data || { formula });
  }

  async loadMolecule(smiles) {
    this.currentSmiles = smiles;
    const errBox = this.container.querySelector("#smilesError");
    errBox.style.display = "none";

    try {
      const resp = await fetch("/api/v1/chemistry/molecule/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles })
      });

      const data = await resp.json();
      if (!data.success) {
        errBox.innerText = data.error || "Failed to parse SMILES.";
        errBox.style.display = "block";
        if (data.svg) {
          this.paintSvg(data.svg, data);
        } else {
          this.paintSvgFallback(smiles, data);
        }
        return;
      }

      this.paintSvg(data.svg, data);

      // Push telemetry to Gandho Socratic Tutor
      window.currentSocraticLabContext = {
        experiment_id: "chem_rdkit",
        title: "Organic Chemistry RDKit Molecular Designer",
        smiles: smiles,
        formula: data.formula,
        molecular_weight: `${data.molecular_weight} g/mol`,
        logP: data.logp,
        tpsa: `${data.tpsa} Å²`,
        h_donors_acceptors: `${data.h_donors} donors / ${data.h_acceptors} acceptors`,
        status: `Viewing 2D vector bond structure for formula ${data.formula} (${smiles})`
      };
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }

    } catch (e) {
      errBox.innerText = `Network/Backend error: ${e.message}`;
      errBox.style.display = "block";
      this.paintSvgFallback(smiles, { formula: smiles });
    }
  }
}
