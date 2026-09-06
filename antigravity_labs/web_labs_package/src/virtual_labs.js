/**
 * Virtual Labs Orchestrator - Main Entry Point & Curriculum Hub Router
 * Provides complete Curriculum Topic Matrix:
 * - Physics Mechanics, Kinematics & SymPy Wave Calculus
 * - Chemistry Bench, RDKit Organic Molecule Designer & PubChem Database
 * - 100% Offline Simulation Viewer & Gandho Socratic Voice Assistant
 */

import { ChemistryBench } from "./chemistry/chem_bench.js";
import { PhysicsView } from "./physics/physics_view.js";
import { RdkitViewer } from "./chemistry/rdkit_viewer.js";
import { MathPhysicsLab } from "./physics/math_physics.js";
import { PubchemInspector } from "./chemistry/pubchem_inspector.js";
import { GandhoLabVoiceAssistant } from "./gandho_voice_helper.js";

export class VirtualLabsApp {
  constructor(rootContainer) {
    this.root = rootContainer;
    this.currentView = "hub";
    this.activeSubModule = null;
    this.activeFilter = "all";

    this.topicsCatalog = [
      // --- Physics Topics ---
      {
        id: "phys_free_fall",
        subject: "physics",
        type: "native",
        title: "Gravity & Free Fall (Galileo's Law)",
        grade: "Grades 6–10",
        desc: "Does a 10kg heavy ball fall faster than a 0.5kg light ball? Test free-fall acceleration in a vacuum and analyze cyan velocity telemetry vectors.",
        icon: "🪂",
        tags: ["Newtonian Mechanics", "Galileo", "Practice Mission"],
        missionKey: "free_fall"
      },
      {
        id: "phys_momentum",
        subject: "physics",
        type: "native",
        title: "Elastic Collisions & Momentum Transfer",
        grade: "Grades 9–12",
        desc: "Observe how linear momentum (p = mv) and kinetic energy are conserved during head-on collisions. Fling objects and inspect velocity swaps.",
        icon: "💥",
        tags: ["Momentum (p=mv)", "Collisions", "Practice Mission"],
        missionKey: "momentum"
      },
      {
        id: "phys_math",
        subject: "physics",
        type: "math_physics",
        title: "Mathematical Physics & Wave Mechanics (SymPy & SciPy)",
        grade: "Grades 10–12",
        desc: "Symbolic calculus derivatives (s'(t)=v, v'(t)=a), standing wave harmonic nodes/antinodes, and orbital mechanics via SymPy & SciPy.",
        icon: "📐",
        tags: ["SymPy API", "SciPy", "Wave Mechanics", "Calculus"]
      },
      {
        id: "phys_planetary",
        subject: "physics",
        type: "native",
        title: "Planetary Gravity & Acceleration",
        grade: "Grades 6–9",
        desc: "Calibrate gravitational forces on the Moon (1.6 m/s²), Earth (9.8 m/s²), and Jupiter (24.8 m/s²). Fling objects to feel weight vs mass.",
        icon: "🪐",
        tags: ["Planetary Physics", "Gravity Modifiers", "Practice Mission"],
        missionKey: "planetary"
      },
      {
        id: "phys_projectile",
        subject: "physics",
        type: "offline_sim",
        simPath: "/offline_sims/projectile_motion.html",
        title: "Projectile Motion & Kinematic Trajectory",
        grade: "Grades 9–12",
        desc: "Aim and fire the cannon! Adjust launch angle, velocity, and air drag to calculate horizontal range and peak trajectory height.",
        icon: "🚀",
        tags: ["100% Offline Sim", "Kinematics", "Angle & Velocity"]
      },
      {
        id: "phys_circuits",
        subject: "physics",
        type: "offline_sim",
        simPath: "/offline_sims/circuit_kit.html",
        title: "DC Circuit Construction & Ohm's Law",
        grade: "Grades 6–12",
        desc: "Build active DC circuits with batteries, resistors, and lightbulbs. Test Ohm's Law (V = IR) and observe real-time electron flow animation.",
        icon: "⚡",
        tags: ["100% Offline Sim", "Ohm's Law (V=IR)", "Electricity"]
      },

      // --- Chemistry Topics ---
      {
        id: "chem_titration",
        subject: "chemistry",
        type: "native",
        title: "Acid-Base Titration & Neutralization",
        grade: "Grades 9–12",
        desc: "Titrate 1.0 M HCl with 1.0 M NaOH. Use Phenolphthalein to identify stoichiometric equivalence at exact pH 7.00 without overshooting.",
        icon: "⚗️",
        tags: ["ChemPy Microservice", "Equivalence (pH 7)", "Practice Mission"],
        missionKey: "titration"
      },
      {
        id: "chem_rdkit",
        subject: "chemistry",
        type: "rdkit",
        title: "Organic Chemistry & Molecular Designer (RDKit)",
        grade: "Grades 10–12",
        desc: "Parse custom SMILES strings or select curriculum molecules (Aspirin, Caffeine, Glucose, Ethanol). Renders 2D vector bond SVGs & descriptors.",
        icon: "🧬",
        tags: ["RDKit Open Source", "Organic Chem", "SMILES", "2D Vector"]
      },
      {
        id: "chem_pubchem",
        subject: "chemistry",
        type: "pubchem",
        title: "PubChem Chemical Database & Safety Inspector",
        grade: "Grades 8–12",
        desc: "Search millions of verified compounds. Inspect IUPAC nomenclature, GHS safety/hazard classifications, and offline curriculum cache.",
        icon: "🔍",
        tags: ["PubChem API", "ChEMBL", "Chemical Database", "GHS Safety"]
      },
      {
        id: "chem_dilution",
        subject: "chemistry",
        type: "native",
        title: "Solution Concentration & Dilution (M₁V₁ = M₂V₂)",
        grade: "Grades 8–11",
        desc: "Practice precision dilutions on Copper(II) Sulfate. Calculate the volume of distilled water required to reach target molarity.",
        icon: "💧",
        tags: ["Dilution Law", "Molarity (M)", "Practice Mission"],
        missionKey: "dilution"
      },
      {
        id: "chem_indicators",
        subject: "chemistry",
        type: "native",
        title: "The pH Scale & Color Indicators",
        grade: "Grades 6–9",
        desc: "Explore how pH indicators change color across the acid-base spectrum. Test universal indicator from red (pH 1) to purple (pH 14).",
        icon: "🌈",
        tags: ["pH Scale (0–14)", "Indicators", "Practice Mission"],
        missionKey: "indicators"
      },
      {
        id: "chem_balancing",
        subject: "chemistry",
        type: "offline_sim",
        simPath: "/offline_sims/balancing_equations.html",
        title: "Balancing Chemical Equations",
        grade: "Grades 7–12",
        desc: "Master the Law of Conservation of Mass! Adjust stoichiometric coefficients to synthesize water (H₂ + O₂ ➔ H₂O) and balance atom tallies.",
        icon: "⚖️",
        tags: ["100% Offline Sim", "Stoichiometry", "Conservation of Mass"]
      },
      {
        id: "chem_gas_laws",
        subject: "chemistry",
        type: "offline_sim",
        simPath: "/offline_sims/gas_properties.html",
        title: "Gas Properties & Ideal Gas Law (PV = nRT)",
        grade: "Grades 9–12",
        desc: "Pump molecules into an enclosed gas chamber. Heat or cool the gas, move the piston to adjust volume, and watch the pressure gauge react.",
        icon: "💨",
        tags: ["100% Offline Sim", "Ideal Gas Law", "PV = nRT"]
      }
    ];

    this.renderHub();
  }

  renderHub() {
    this.currentView = "hub";
    if (this.activeSubModule && this.activeSubModule.stopLoop) {
      this.activeSubModule.stopLoop();
    }
    this.activeSubModule = null;

    window.currentSocraticLabContext = {
      experiment_id: "hub",
      title: "STEM Virtual Lab Catalog",
      status: "Student is browsing the STEM Virtual Lab catalog"
    };
    if (typeof window.updateActiveViewState === "function") {
      window.updateActiveViewState();
    }

    const filtered = this.activeFilter === "all" 
      ? this.topicsCatalog 
      : this.topicsCatalog.filter(t => t.subject === this.activeFilter);

    this.root.innerHTML = `
      <div class="virtual-labs-wrapper">
        <!-- Top Navigation Bar -->
        <div class="labs-top-bar">
          <div class="title-group">
            <h2>🧪 STEM Virtual Lab Center</h2>
            <span class="lab-badge">K-12 Interactive Lab Studio</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <div id="hubGandhoMicSlot"></div>
            <div style="font-size: 0.85rem; color: #a1a1aa;">
              100% Offline Local Appliance
            </div>
          </div>
        </div>

        <!-- Hub Body -->
        <div class="stem-hub-container">
          <div class="stem-hub-hero">
            <h1>STEM Curriculum & Virtual Lab Lessons</h1>
            <p>
              Select an experiment module below to begin interactive practice. Equipped with real-time solvers (ChemPy, RDKit, SymPy/SciPy, PubChem/ChEMBL) and Socratic voice tutoring.
            </p>
          </div>

          <!-- Filter Pills -->
          <div class="topic-filter-tabs">
            <button type="button" class="topic-filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              🌟 All Topics (${this.topicsCatalog.length})
            </button>
            <button type="button" class="topic-filter-btn ${this.activeFilter === 'physics' ? 'active' : ''}" data-filter="physics">
              ⚛️ Physics Mechanics & Calculus
            </button>
            <button type="button" class="topic-filter-btn ${this.activeFilter === 'chemistry' ? 'active' : ''}" data-filter="chemistry">
              ⚗️ Chemistry, RDKit & PubChem
            </button>
          </div>

          <!-- Topics Grid -->
          <div class="topics-matrix-grid">
            ${filtered.map(t => `
              <div class="topic-matrix-card" data-topic-id="${t.id}">
                <div class="topic-meta-row">
                  <span class="topic-subject-badge ${t.subject === 'chemistry' ? 'badge-chem' : 'badge-phys'}">
                    ${t.subject === 'chemistry' ? '⚗️ Chemistry' : '⚛️ Physics'}
                  </span>
                  <span style="font-size: 0.75rem; color: #a1a1aa; font-weight: 600;">${t.grade}</span>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <span style="font-size: 1.8rem;">${t.icon}</span>
                  <div>
                    <h3 class="topic-title">${t.title}</h3>
                    <p class="topic-desc">${t.desc}</p>
                  </div>
                </div>

                <div class="topic-footer">
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${t.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                  </div>
                  <span style="font-size: 1.1rem; color: #a855f7; font-weight: bold;">➔</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Gandho mic button in Hub
    const micSlot = this.root.querySelector("#hubGandhoMicSlot");
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "general",
        message: "Student is browsing the STEM Virtual Lab catalog."
      }));
    }

    // Filter events
    this.root.querySelectorAll(".topic-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeFilter = btn.dataset.filter;
        this.renderHub();
      });
    });

    // Card click events
    this.root.querySelectorAll(".topic-matrix-card").forEach(card => {
      card.addEventListener("click", () => {
        const topic = this.topicsCatalog.find(t => t.id === card.dataset.topicId);
        if (topic) this.launchTopic(topic);
      });
    });
  }

  launchTopic(topic) {
    window.currentSocraticLabContext = {
      experiment_id: topic.id,
      title: topic.title,
      subject: topic.subject,
      grade: topic.grade,
      description: topic.desc,
      status: `Student is working on ${topic.title}`
    };
    if (typeof window.updateActiveViewState === "function") {
      window.updateActiveViewState();
    }

    if (topic.type === "rdkit") {
      this.launchRdkit();
    } else if (topic.type === "math_physics") {
      this.launchMathPhysics();
    } else if (topic.type === "pubchem") {
      this.launchPubchem();
    } else if (topic.type === "offline_sim") {
      this.launchOfflineSim(topic);
    } else if (topic.subject === "chemistry") {
      this.launchChemistry(topic.missionKey);
    } else if (topic.subject === "physics") {
      this.launchPhysics(topic.missionKey);
    }
  }

  launchRdkit() {
    this.currentView = "rdkit";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>🧬 Organic Chemistry & Molecular Designer</h2>
            <span class="lab-badge">RDKit Open-Source Engine</span>
          </div>
        </div>
        <div id="subViewContainer" style="flex: 1; display: flex; overflow: hidden;"></div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());
    const subContainer = this.root.querySelector("#subViewContainer");
    this.activeSubModule = new RdkitViewer(subContainer);
  }

  launchMathPhysics() {
    this.currentView = "math_physics";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>📐 Mathematical Physics & Wave Mechanics</h2>
            <span class="lab-badge">SymPy & SciPy Symbolic Engine</span>
          </div>
        </div>
        <div id="subViewContainer" style="flex: 1; display: flex; overflow: hidden;"></div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());
    const subContainer = this.root.querySelector("#subViewContainer");
    this.activeSubModule = new MathPhysicsLab(subContainer);
  }

  launchPubchem() {
    this.currentView = "pubchem";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>🔍 PubChem Chemical Database & Safety Inspector</h2>
            <span class="lab-badge">NCBI PubChem & ChEMBL</span>
          </div>
        </div>
        <div id="subViewContainer" style="flex: 1; display: flex; overflow: hidden;"></div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());
    const subContainer = this.root.querySelector("#subViewContainer");
    this.activeSubModule = new PubchemInspector(subContainer);
  }

  launchChemistry(missionKey = "titration") {
    this.currentView = "chemistry";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>⚗️ Chemistry Bench Simulation</h2>
            <span class="lab-badge">Guided Practice & Telemetry</span>
          </div>
        </div>
        <div id="subViewContainer" style="flex: 1; display: flex; overflow: hidden;"></div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());
    const subContainer = this.root.querySelector("#subViewContainer");
    this.activeSubModule = new ChemistryBench(subContainer, missionKey);
  }

  launchPhysics(missionKey = "free_fall") {
    this.currentView = "physics";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>⚛️ Physics Mechanics Canvas</h2>
            <span class="lab-badge">2D Rigid-Body & Vectors</span>
          </div>
        </div>
        <div id="subViewContainer" style="flex: 1; display: flex; overflow: hidden;"></div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());
    const subContainer = this.root.querySelector("#subViewContainer");
    this.activeSubModule = new PhysicsView(subContainer, missionKey);
  }

  launchOfflineSim(topic) {
    this.currentView = "offline_sim";
    this.root.innerHTML = `
      <div class="virtual-labs-wrapper" style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="labs-top-bar" style="flex-shrink: 0;">
          <div class="title-group">
            <button type="button" id="btnBackToHub" class="lab-btn-back">
              ← Back to Lab Center
            </button>
            <h2>${topic.icon} ${topic.title}</h2>
            <span class="lab-badge">100% Offline Simulation</span>
          </div>
          <div id="offlineSimGandhoSlot"></div>
        </div>
        <div class="offline-sim-container" style="flex: 1; width: 100%; height: calc(100vh - 65px); display: flex; overflow: hidden;">
          <iframe class="offline-sim-iframe" src="${topic.simPath}" style="width: 100%; height: 100%; flex: 1; border: none; display: block;"></iframe>
        </div>
      </div>
    `;

    this.root.querySelector("#btnBackToHub").addEventListener("click", () => this.renderHub());

    const micSlot = this.root.querySelector("#offlineSimGandhoSlot");
    if (micSlot) {
      new GandhoLabVoiceAssistant(micSlot, () => ({
        domain: "offline_sim",
        simTitle: topic.title
      }));
    }
  }
}

export function mountVirtualLabs(containerElement) {
  return new VirtualLabsApp(containerElement);
}
