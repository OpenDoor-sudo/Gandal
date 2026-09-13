/**
 * circuits_lab.js - Master Orchestrator for 3D Electronics Breadboard Lab
 * Exports mountCircuitsLab(containerElement)
 */

import { Breadboard3DEngine } from "./breadboard_3d.js";
import { WorkflowController } from "./workflow_controller.js";
import { PartsBinManager } from "./parts_bin.js";
import { AIOrchestrator } from "./ai_orchestrator.js";
import { CurriculumService } from "./curriculum_service.js";

export class CircuitsLabApp {
  constructor(rootContainer) {
    this.root = rootContainer;

    this.curriculumService = new CurriculumService();
    this.breadboardEngine = null;
    this.workflowController = null;
    this.partsBinManager = null;
    this.aiOrchestrator = null;

    this.activeProblem = null;
    this._renderShell();
  }

  async init() {
    // 1. Initialize 3D Engine
    const canvasContainer = this.root.querySelector("#circuitsThreeJsCanvasContainer");
    this.breadboardEngine = new Breadboard3DEngine(canvasContainer);
    await this.breadboardEngine.init();

    // 2. Initialize Parts Bin
    const partsContainer = this.root.querySelector("#circuitsPartsBinList");
    this.partsBinManager = new PartsBinManager(partsContainer);

    // 3. Initialize Workflow Controller
    this.workflowController = new WorkflowController(this.breadboardEngine, {
      onStepChange: this._handleStepChange.bind(this),
      onModeChange: this._handleModeChange.bind(this)
    });

    // 4. Initialize AI Orchestrator
    this.aiOrchestrator = new AIOrchestrator(this.workflowController, {
      onListeningChange: this._handleListeningChange.bind(this),
      onSpokenFeedback: this._updateSpokenText.bind(this)
    });

    // 5. Load Curriculum Catalog
    await this.curriculumService.loadCurriculum();
    this._renderCurriculumTree();

    // 6. Load First Problem
    const levels = this.curriculumService.getLevels();
    if (levels.length > 0 && levels[0].problems.length > 0) {
      this.loadProject(levels[0].problems[0].id);
    }

    this._bindEvents();
    window.circuitsLabInstance = this;
    console.log("[CIRCUITS LAB] Mounted and operational.");
  }

  _renderShell() {
    this.root.innerHTML = `
      <div class="circuits-lab-container">
        <!-- LEFT PANEL: CURRICULUM TREE & PROBLEM STATEMENT -->
        <aside class="circuits-left-panel" id="circuitsLeftPanel">
          <div class="circuits-panel-header">
            <div class="circuits-panel-title">
              <span>📁 Curriculum Explorer</span>
              <span class="circuits-panel-badge">Offline RAG</span>
            </div>
            <button class="panel-toggle-btn" id="btnToggleLeftPanel" title="Collapse Panel">◀</button>
          </div>

          <!-- Collapsible Topic Accordion -->
          <div class="circuits-curriculum-accordion" id="curriculumAccordion">
            <!-- Rendered dynamically -->
          </div>

          <!-- Active Problem Statement Card -->
          <div class="circuits-problem-details" id="problemDetailsCard">
            <div id="problemStatementContent" class="problem-markdown-body">
              <p style="color: #71717a;">Select a challenge to load specifications.</p>
            </div>
          </div>
        </aside>

        <!-- CENTER WORKSPACE: 3D THREE.JS WEBGL CANVAS -->
        <main class="circuits-center-workspace">
          <!-- Top Floating Controls -->
          <div class="circuits-top-controls">
            <div class="circuits-controls-group">
              <button class="panel-toggle-btn" id="btnExpandLeftPanel" style="display: none;" title="Expand Curriculum">▶ Tree</button>
              <button class="mode-toggle-btn" id="btnModeToggle">
                <span class="mode-indicator-dot"></span>
                <span id="modeToggleLabel">Mode: Virtual Preview</span>
              </button>
              <button class="btn-circuit-action btn-circuit-reset" id="btnRestartCircuit">
                ↺ Reset & Build Physically
              </button>
            </div>

            <div class="circuits-controls-group">
              <button class="btn-circuit-action" id="btnRecenterCamera" title="Recenter View">
                🎯 Reset View
              </button>
              <button class="panel-toggle-btn" id="btnExpandRightPanel" style="display: none;" title="Expand Parts">Parts ◀</button>
            </div>
          </div>

          <!-- Three.js Canvas Container -->
          <div id="circuitsThreeJsCanvasContainer"></div>

          <!-- Bottom Floating Step Navigator & Voice HUD -->
          <div class="circuits-bottom-hud">
            <div class="circuits-spoken-pill" id="circuitsSpokenPill">
              <div class="spoken-agent-avatar">AI</div>
              <div id="spokenMessageText" style="flex: 1;">Ready to guide you through the circuit.</div>
            </div>

            <div class="circuits-step-navigator">
              <button class="step-nav-btn" id="btnStepPrev">◀ Prev</button>
              <button class="step-nav-btn" id="btnStepRepeat">🔁 Repeat</button>
              <span class="step-counter-text" id="stepCounterDisplay">Step 0 / 0</span>
              <button class="step-nav-btn btn-primary-step" id="btnStepNext">Next Step ▶</button>
            </div>
          </div>

          <!-- Floating Voice Mic Button -->
          <button class="circuits-mic-btn" id="btnCircuitsMic" title="Voice Assistant (Click & Speak)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </main>

        <!-- RIGHT PANEL: PARTS BIN (BILL OF MATERIALS) -->
        <aside class="circuits-right-panel" id="circuitsRightPanel">
          <div class="circuits-panel-header">
            <div class="circuits-panel-title">
              <span>🧰 Required Parts</span>
              <span class="circuits-panel-badge" id="partsBinCountBadge">0 Items</span>
            </div>
            <button class="panel-toggle-btn" id="btnToggleRightPanel" title="Collapse Panel">▶</button>
          </div>

          <div class="parts-bin-list" id="circuitsPartsBinList">
            <!-- Rendered dynamically -->
          </div>
        </aside>
      </div>
    `;
  }

  _renderCurriculumTree() {
    const container = this.root.querySelector("#curriculumAccordion");
    const levels = this.curriculumService.getLevels();

    if (!container || levels.length === 0) return;

    container.innerHTML = levels
      .map((lvl, index) => {
        const isOpen = index === 0 ? "open" : "";
        const problemsHTML = lvl.problems
          .map(
            (p) => `
          <div class="curriculum-problem-item" data-id="${p.id}" id="problemItem_${p.id}">
            <div class="problem-item-title">
              <span>⚡</span> ${p.title}
            </div>
            <div class="problem-item-sub">${p.topic} • <span style="color: #c2c1ff;">${p.difficulty}</span></div>
          </div>
        `
          )
          .join("");

        return `
          <div class="curriculum-level-group ${isOpen}" id="levelGroup_${lvl.level}">
            <div class="curriculum-level-header" onclick="window.circuitsLabInstance?.toggleLevelAccordion(${lvl.level})">
              <span>${lvl.title}</span>
              <span class="curriculum-level-arrow">▶</span>
            </div>
            <div class="curriculum-problems-list">
              ${problemsHTML}
            </div>
          </div>
        `;
      })
      .join("");
  }

  toggleLevelAccordion(levelNumber) {
    const group = this.root.querySelector(`#levelGroup_${levelNumber}`);
    if (group) group.classList.toggle("open");
  }

  loadProject(problemId) {
    const problem = this.curriculumService.getProblem(problemId);
    if (!problem) return;

    this.activeProblem = problem;

    // 1. Highlight active item in tree
    this.root.querySelectorAll(".curriculum-problem-item").forEach((el) => el.classList.remove("active"));
    const activeItem = this.root.querySelector(`#problemItem_${problemId}`);
    if (activeItem) activeItem.classList.add("active");

    // 2. Render Problem Statement Card
    const card = this.root.querySelector("#problemStatementContent");
    if (card) {
      card.innerHTML = `
        <h2>${problem.title}</h2>
        <p style="color: #a1a1aa; font-size: 11px; margin-bottom: 12px;">Topic: ${problem.topic} | Difficulty: ${problem.difficulty}</p>
        <div>${problem.problem_text.replace(/\\n/g, "<br>")}</div>
      `;
    }

    // 3. Render Parts Bin
    const countBadge = this.root.querySelector("#partsBinCountBadge");
    if (countBadge) countBadge.innerText = `${problem.components.length} Items`;
    this.partsBinManager.render(problem.components);

    // 4. Initialize Workflow Controller
    this.workflowController.loadProblem(problem);
  }

  togglePartCollected(index) {
    if (this.partsBinManager) {
      this.partsBinManager.toggleCollected(index);
    }
  }

  _bindEvents() {
    // Mode Switch Button
    const btnMode = this.root.querySelector("#btnModeToggle");
    if (btnMode) {
      btnMode.addEventListener("click", () => {
        this.workflowController.toggleMode();
      });
    }

    // Reset & Build Physically Button
    const btnReset = this.root.querySelector("#btnRestartCircuit");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        this.workflowController.setMode("PHYSICAL");
        this.workflowController.restartProject();
      });
    }

    // Step Navigators
    const btnNext = this.root.querySelector("#btnStepNext");
    if (btnNext) {
      btnNext.addEventListener("click", () => this.workflowController.nextStep());
    }

    const btnPrev = this.root.querySelector("#btnStepPrev");
    if (btnPrev) {
      btnPrev.addEventListener("click", () => this.workflowController.prevStep());
    }

    const btnRepeat = this.root.querySelector("#btnStepRepeat");
    if (btnRepeat) {
      btnRepeat.addEventListener("click", () => this.workflowController.repeatStep());
    }

    // Recenter Camera Button
    const btnRecenter = this.root.querySelector("#btnRecenterCamera");
    if (btnRecenter && this.breadboardEngine && this.breadboardEngine.camera && this.breadboardEngine.controls) {
      btnRecenter.addEventListener("click", () => {
        this.breadboardEngine.camera.position.set(0, 7.5, 6.0);
        this.breadboardEngine.controls.target.set(0, 0, 0);
        this.breadboardEngine.controls.update();
      });
    }

    // Voice Mic Button
    const btnMic = this.root.querySelector("#btnCircuitsMic");
    if (btnMic) {
      btnMic.addEventListener("click", () => {
        if (this.aiOrchestrator) this.aiOrchestrator.toggleListening();
      });
    }

    // Panel Collapse & Expand toggles
    const leftPanel = this.root.querySelector("#circuitsLeftPanel");
    const rightPanel = this.root.querySelector("#circuitsRightPanel");
    const btnToggleLeft = this.root.querySelector("#btnToggleLeftPanel");
    const btnExpandLeft = this.root.querySelector("#btnExpandLeftPanel");
    const btnToggleRight = this.root.querySelector("#btnToggleRightPanel");
    const btnExpandRight = this.root.querySelector("#btnExpandRightPanel");

    if (btnToggleLeft && leftPanel && btnExpandLeft) {
      btnToggleLeft.addEventListener("click", () => {
        leftPanel.classList.add("collapsed");
        btnExpandLeft.style.display = "flex";
      });
      btnExpandLeft.addEventListener("click", () => {
        leftPanel.classList.remove("collapsed");
        btnExpandLeft.style.display = "none";
      });
    }

    if (btnToggleRight && rightPanel && btnExpandRight) {
      btnToggleRight.addEventListener("click", () => {
        rightPanel.classList.add("collapsed");
        btnExpandRight.style.display = "flex";
      });
      btnExpandRight.addEventListener("click", () => {
        rightPanel.classList.remove("collapsed");
        btnExpandRight.style.display = "none";
      });
    }

    // Problem items click listener
    this.root.addEventListener("click", (e) => {
      const item = e.target.closest(".curriculum-problem-item");
      if (item && item.dataset.id) {
        this.loadProject(item.dataset.id);
      }
    });
  }

  _handleStepChange(data) {
    const counterDisplay = this.root.querySelector("#stepCounterDisplay");
    if (counterDisplay) {
      counterDisplay.innerText = `Step ${data.stepIndex} / ${data.totalSteps}`;
    }

    const btnPrev = this.root.querySelector("#btnStepPrev");
    if (btnPrev) btnPrev.disabled = data.stepIndex <= 1;

    this._updateSpokenText(data.spokenText);
  }

  _handleModeChange(mode, alertText) {
    const btnMode = this.root.querySelector("#btnModeToggle");
    const label = this.root.querySelector("#modeToggleLabel");

    if (mode === "PHYSICAL") {
      btnMode.classList.add("mode-physical");
      if (label) label.innerText = "Mode: Physical Build";
    } else {
      btnMode.classList.remove("mode-physical");
      if (label) label.innerText = "Mode: Virtual Preview";
    }

    this._updateSpokenText(alertText);
  }

  _handleListeningChange(isListening) {
    const btnMic = this.root.querySelector("#btnCircuitsMic");
    if (btnMic) {
      if (isListening) btnMic.classList.add("listening");
      else btnMic.classList.remove("listening");
    }
  }

  _updateSpokenText(text) {
    const pillText = this.root.querySelector("#spokenMessageText");
    if (pillText) {
      pillText.innerText = text;
    }
  }

  destroy() {
    if (this.breadboardEngine) {
      this.breadboardEngine.destroy();
    }
  }
}

export function mountCircuitsLab(containerElement) {
  const app = new CircuitsLabApp(containerElement);
  app.init();
  return app;
}
