/**
 * circuits_lab.js — Gandal Circuits Atelier
 * Dual-mode 3D breadboard walkthrough with drag-to-place + voice guide.
 */

import { Breadboard3DEngine } from "./breadboard_3d.js";
import { WorkflowController } from "./workflow_controller.js";
import { PartsBinManager } from "./parts_bin.js";
import { AIOrchestrator } from "./ai_orchestrator.js";
import { CurriculumService } from "./curriculum_service.js";
import { speakFrench, stopSpeaking, localizeTitle } from "../../shared/stem_voice_helper.js";
import {
  saveCircuitsProgress,
  getCircuitsProgress,
  getLastCircuitsProblemId,
  markCircuitsProblemComplete
} from "../../shared/lab_progress_store.js";

export class CircuitsLabApp {
  constructor(rootContainer) {
    this.root = rootContainer;
    this.curriculumService = new CurriculumService();
    this.breadboardEngine = null;
    this.workflowController = null;
    this.partsBinManager = null;
    this.aiOrchestrator = null;
    this.activeProblem = null;
    this._dragPartMeta = null;
    this._renderShell();
  }

  async init() {
    const canvasContainer = this.root.querySelector("#circuitsThreeJsCanvasContainer");
    this.breadboardEngine = new Breadboard3DEngine(canvasContainer);
    await this.breadboardEngine.init();

    const partsContainer = this.root.querySelector("#circuitsPartsBinList");
    this.partsBinManager = new PartsBinManager(partsContainer);

    this.workflowController = new WorkflowController(this.breadboardEngine, {
      onStepChange: (data) => this._onStepChange(data),
      onModeChange: (mode, text) => this._onModeChange(mode, text)
    });

    this.aiOrchestrator = new AIOrchestrator(this.workflowController, {
      onListeningChange: (v) => this._onListeningChange(v),
      onSpokenFeedback: (t) => this._updateSpokenText(t)
    });

    await this.curriculumService.loadCurriculum();
    this._renderCurriculumTree();

    const levels = this.curriculumService.getLevels();
    const lastId = getLastCircuitsProblemId();
    const resumeId =
      (lastId && this.curriculumService.getProblem(lastId)?.id) ||
      (levels[0]?.problems?.[0]?.id);
    if (resumeId) this.loadProject(resumeId);

    this._bindEvents();
    window.circuitsLabInstance = this;
    console.log("[CIRCUITS LAB] Atelier monté et prêt.");
  }

  _renderShell() {
    this.root.innerHTML = `
      <div class="circuits-lab-container">
        <aside class="circuits-left-panel" id="circuitsLeftPanel">
          <div class="circuits-panel-header">
            <div class="circuits-panel-title">
              <span>Parcours Circuits</span>
              <span class="circuits-panel-badge" id="circuitsConnectivityBadge" title="Guide local + aide IA si clé API">Guide local · IA optionnelle</span>
            </div>
            <button class="panel-toggle-btn" id="btnToggleLeftPanel" title="Réduire">◀</button>
          </div>
          <div class="circuits-curriculum-accordion" id="curriculumAccordion"></div>
          <div class="circuits-problem-details" id="problemDetailsCard">
            <div id="problemStatementContent" class="problem-markdown-body">
              <p style="color: var(--cx-muted);">Choisissez un défi pour charger le schéma et la nomenclature.</p>
            </div>
          </div>
        </aside>

        <main class="circuits-center-workspace">
          <div class="circuits-top-controls">
            <div class="circuits-controls-group">
              <button class="panel-toggle-btn" id="btnExpandLeftPanel" style="display:none;" title="Ouvrir le parcours">▶ Parcours</button>
              <button class="mode-toggle-btn" id="btnModeToggle">
                <span class="mode-indicator-dot"></span>
                <span id="modeToggleLabel">Mode : Aperçu virtuel</span>
              </button>
              <button class="btn-circuit-action btn-circuit-reset" id="btnRestartCircuit">↺ Monter en réel</button>
            </div>
            <div class="circuits-controls-group">
              <button class="btn-circuit-action" id="btnRecenterCamera">Recentrer</button>
              <button class="panel-toggle-btn" id="btnExpandRightPanel" style="display:none;" title="Ouvrir les pièces">Pièces ◀</button>
            </div>
          </div>

          <div class="circuits-canvas-stage">
            <div id="circuitsThreeJsCanvasContainer"></div>
            <div class="circuits-step-progress" aria-hidden="true">
              <div class="circuits-step-progress-bar" id="circuitsStepProgressBar"></div>
            </div>
          </div>

          <div class="circuits-bottom-hud">
            <div class="circuits-spoken-pill" id="circuitsSpokenPill">
              <div class="spoken-agent-avatar">G</div>
              <div id="spokenMessageText" style="flex:1;">Glissez la LED depuis la nomenclature vers les trous en cuivre.</div>
            </div>
            <div class="circuits-step-navigator">
              <button class="step-nav-btn" id="btnStepPrev">◀ Préc.</button>
              <button class="step-nav-btn" id="btnStepRepeat">↻ Répéter</button>
              <span class="step-counter-text" id="stepCounterDisplay">Étape 0 / 0</span>
              <button class="step-nav-btn btn-primary-step" id="btnStepNext">Suivant ▶</button>
            </div>
          </div>

          <div class="circuits-completion-toast" id="circuitsCompletionToast" hidden>
            <div class="circuits-completion-card">
              <div class="circuits-completion-mark" aria-hidden="true"></div>
              <h3 id="circuitsCompletionTitle">Défi terminé !</h3>
              <p id="circuitsCompletionMsg">Bravo — vous avez fini ce montage.</p>
              <div class="circuits-completion-actions">
                <button type="button" class="btn-circuit-action" id="btnCompletionReplay">↻ Revoir</button>
                <button type="button" class="btn-circuit-action btn-primary-step" id="btnCompletionNextLab">Défi suivant ▶</button>
              </div>
            </div>
          </div>

          <button class="circuits-mic-btn" id="btnCircuitsMic" title="Assistant vocal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </main>

        <aside class="circuits-right-panel" id="circuitsRightPanel">
          <div class="circuits-panel-header">
            <div class="circuits-panel-title">
              <span>Nomenclature</span>
              <span class="circuits-panel-badge" id="partsBinCountBadge">0</span>
            </div>
            <button class="panel-toggle-btn" id="btnToggleRightPanel" title="Réduire">▶</button>
          </div>
          <div class="parts-bin-list" id="circuitsPartsBinList"></div>
        </aside>
      </div>
    `;
  }

  _renderCurriculumTree() {
    const container = this.root.querySelector("#curriculumAccordion");
    const levels = this.curriculumService.getLevels();
    if (!container || !levels.length) return;

    container.innerHTML = levels.map((lvl, index) => {
      const open = index === 0 ? "open" : "";
      const problems = lvl.problems.map((p) => {
        const done = !!(getCircuitsProgress(p.id)?.completed);
        const title = localizeTitle(p);
        return `
        <div class="curriculum-problem-item ${done ? "is-complete" : ""}" data-id="${p.id}" id="problemItem_${p.id}">
          <div class="problem-item-title">
            <span class="problem-item-bolt"></span>${title}
            ${done ? '<span class="problem-complete-check" title="Terminé">✓</span>' : ""}
          </div>
          <div class="problem-item-sub">${p.topic_fr || p.topic || ""} · <span class="diff">${p.difficulty_fr || p.difficulty || ""}</span></div>
        </div>
      `;
      }).join("");

      return `
        <div class="curriculum-level-group ${open}" id="levelGroup_${lvl.level}">
          <div class="curriculum-level-header" data-level="${lvl.level}">
            <span>${lvl.title}</span>
            <span class="curriculum-level-arrow">▶</span>
          </div>
          <div class="curriculum-problems-list">${problems}</div>
        </div>
      `;
    }).join("");
  }

  toggleLevelAccordion(levelNumber) {
    const group = this.root.querySelector(`#levelGroup_${levelNumber}`);
    if (group) group.classList.toggle("open");
  }

  loadProject(problemId) {
    const problem = this.curriculumService.getProblem(problemId);
    if (!problem) return;
    this.activeProblem = problem;

    this.root.querySelectorAll(".curriculum-problem-item").forEach((el) => el.classList.remove("active"));
    const active = this.root.querySelector(`#problemItem_${problemId}`);
    if (active) active.classList.add("active");

    const card = this.root.querySelector("#problemStatementContent");
    if (card) {
      card.innerHTML = `
        <h2>${this._escapeHtml(localizeTitle(problem))}</h2>
        <p class="problem-meta-row">${this._escapeHtml(problem.topic_fr || problem.topic || "")} · ${this._escapeHtml(problem.difficulty_fr || problem.difficulty || "")}</p>
        <div class="problem-latex-body">${this._formatProblemMarkdown(problem.problem_text || "")}</div>
      `;
      this._typesetLatex(card);
    }

    const badge = this.root.querySelector("#partsBinCountBadge");
    if (badge) badge.innerText = String((problem.components || []).length);
    this.partsBinManager.render(problem.components || []);
    this.workflowController.loadProblem(problem);
    this._hideCompletionToast();
    saveCircuitsProgress({
      problemId: problem.id,
      stepIndex: 0,
      totalSteps: (problem.initial_schematic?.target_connections || []).length,
      mode: this.workflowController.currentMode
    });
  }

  _escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _formatProblemMarkdown(raw) {
    const pockets = [];
    const renderMath = (expr, displayMode) => {
      const latex = String(expr || "").trim();
      if (!latex) return "";
      if (window.katex && typeof window.katex.renderToString === "function") {
        try {
          return window.katex.renderToString(latex, {
            displayMode: !!displayMode,
            throwOnError: false,
            strict: "ignore"
          });
        } catch (err) {
          console.warn("[Circuits] KaTeX render failed:", err);
        }
      }
      const tag = displayMode ? "div" : "span";
      return `<${tag} class="tex-fallback">${this._escapeHtml(displayMode ? `$$${latex}$$` : `$${latex}$`)}</${tag}>`;
    };

    let text = String(raw || "").replace(/\r\n/g, "\n");
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
      const key = `@@MATHDISP${pockets.length}@@`;
      pockets.push({ key, html: renderMath(expr, true) });
      return key;
    });
    text = text.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
      const key = `@@MATHINLINE${pockets.length}@@`;
      pockets.push({ key, html: renderMath(expr, false) });
      return key;
    });

    let html = this._escapeHtml(text);
    html = html.replace(/^###\s+(.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^##\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^#\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
    html = html.replace(/^(?!<[hul]|@@MATH)(.+)$/gm, (line) => {
      if (!line.trim()) return "";
      return `<p>${line}</p>`;
    });
    html = html.replace(/\n{2,}/g, "");
    html = html.replace(/\n/g, "<br>");

    pockets.forEach(({ key, html: math }) => {
      html = html.split(key).join(math);
    });
    return html;
  }

  _typesetLatex(element) {
    // Math is rendered eagerly in _formatProblemMarkdown via katex.renderToString.
    // Keep a light second pass for any leftover delimiters.
    const render = () => {
      if (!element || !window.katex || typeof window.katex.renderToString !== "function") return;
      const walker = (node) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const value = node.nodeValue || "";
          if (!value.includes("$")) return;
          const parts = [];
          let last = 0;
          const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
          let m;
          while ((m = re.exec(value))) {
            if (m.index > last) parts.push(this._escapeHtml(value.slice(last, m.index)));
            const display = m[1] != null;
            const expr = display ? m[1] : m[2];
            try {
              parts.push(window.katex.renderToString(expr, { displayMode: display, throwOnError: false, strict: "ignore" }));
            } catch (_) {
              parts.push(this._escapeHtml(m[0]));
            }
            last = m.index + m[0].length;
          }
          if (!parts.length) return;
          if (last < value.length) parts.push(this._escapeHtml(value.slice(last)));
          const span = document.createElement("span");
          span.innerHTML = parts.join("");
          node.parentNode.replaceChild(span, node);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("katex")) {
          Array.from(node.childNodes).forEach(walker);
        }
      };
      walker(element);
    };
    requestAnimationFrame(render);
  }

  _bindEvents() {
    this.root.querySelector("#btnModeToggle")?.addEventListener("click", () => {
      this.workflowController.toggleMode();
    });

    this.root.querySelector("#btnRestartCircuit")?.addEventListener("click", () => {
      this.workflowController.setMode("PHYSICAL");
      this.workflowController.restartProject();
    });

    this.root.querySelector("#btnStepNext")?.addEventListener("click", () => this.workflowController.nextStep());
    this.root.querySelector("#btnStepPrev")?.addEventListener("click", () => this.workflowController.prevStep());
    this.root.querySelector("#btnStepRepeat")?.addEventListener("click", () => this.workflowController.repeatStep());

    this.root.querySelector("#btnRecenterCamera")?.addEventListener("click", () => {
      this.breadboardEngine?.resetCamera?.();
    });

    this.root.querySelector("#btnCircuitsMic")?.addEventListener("click", () => {
      this.aiOrchestrator?.toggleListening?.();
    });

    const left = this.root.querySelector("#circuitsLeftPanel");
    const right = this.root.querySelector("#circuitsRightPanel");
    const btnToggleLeft = this.root.querySelector("#btnToggleLeftPanel");
    const btnExpandLeft = this.root.querySelector("#btnExpandLeftPanel");
    const btnToggleRight = this.root.querySelector("#btnToggleRightPanel");
    const btnExpandRight = this.root.querySelector("#btnExpandRightPanel");

    btnToggleLeft?.addEventListener("click", () => {
      left?.classList.add("collapsed");
      if (btnExpandLeft) btnExpandLeft.style.display = "flex";
    });
    btnExpandLeft?.addEventListener("click", () => {
      left?.classList.remove("collapsed");
      btnExpandLeft.style.display = "none";
    });
    btnToggleRight?.addEventListener("click", () => {
      right?.classList.add("collapsed");
      if (btnExpandRight) btnExpandRight.style.display = "flex";
    });
    btnExpandRight?.addEventListener("click", () => {
      right?.classList.remove("collapsed");
      btnExpandRight.style.display = "none";
    });

    this.root.addEventListener("click", (e) => {
      const levelHeader = e.target.closest(".curriculum-level-header");
      if (levelHeader?.dataset.level) {
        this.toggleLevelAccordion(Number(levelHeader.dataset.level));
        return;
      }
      const problem = e.target.closest(".curriculum-problem-item");
      if (problem?.dataset.id) {
        this.loadProject(problem.dataset.id);
        return;
      }
      const part = e.target.closest(".part-card");
      if (part && part.dataset.index != null) {
        this.partsBinManager.selectPart(Number(part.dataset.index));
        this._updateSpokenText("Pièce sélectionnée — glissez-la sur les trous en surbrillance.");
      }
    });

    this.root.querySelector("#btnCompletionReplay")?.addEventListener("click", () => {
      this._hideCompletionToast();
      this.workflowController?.restartProject?.();
    });
    this.root.querySelector("#btnCompletionNextLab")?.addEventListener("click", () => {
      this._hideCompletionToast();
      this._openNextIncompleteProblem();
    });

    this._bindDragAndDrop();
  }

  _bindDragAndDrop() {
    const canvas = this.root.querySelector("#circuitsThreeJsCanvasContainer");
    if (!canvas) return;

    this.root.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".part-card");
      if (!card) return;
      const idx = Number(card.dataset.index);
      const meta = this.partsBinManager.getPartMeta(idx);
      this._dragPartMeta = meta;
      this.partsBinManager.selectPart(idx);
      if (this.breadboardEngine?.controls) this.breadboardEngine.controls.enabled = false;
      try {
        e.dataTransfer.setData("application/x-circuits-part", card.dataset.partPayload || "");
        e.dataTransfer.setData("text/plain", meta?.name || "part");
        e.dataTransfer.effectAllowed = "copy";
      } catch (_) {}
      card.classList.add("dragging");
    });

    this.root.addEventListener("dragend", (e) => {
      e.target.closest(".part-card")?.classList.remove("dragging");
      canvas.classList.remove("drop-target-active");
      this._dragPartMeta = null;
      if (this.breadboardEngine?.controls) this.breadboardEngine.controls.enabled = true;
    });

    canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      canvas.classList.add("drop-target-active");
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    });

    canvas.addEventListener("dragleave", (e) => {
      if (!canvas.contains(e.relatedTarget)) canvas.classList.remove("drop-target-active");
    });

    const tryDrop = (meta, x, y) => {
      if (!meta) {
        this._updateSpokenText("Sélectionnez d'abord une pièce dans la nomenclature.");
        return;
      }
      const result = this.workflowController.tryPlaceDraggedPart(meta, x, y);
      if (result.ok) {
        if (meta.index != null) this.partsBinManager.markCollected(meta.index);
        this.partsBinManager.clearSelection();
      }
      this._updateSpokenText(result.reason || (result.ok ? "Composant placé." : "Placement refusé."));
    };

    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      canvas.classList.remove("drop-target-active");
      let meta = this._dragPartMeta;
      if (!meta && e.dataTransfer) {
        try {
          const raw = e.dataTransfer.getData("application/x-circuits-part");
          if (raw) meta = JSON.parse(decodeURIComponent(raw));
        } catch (_) {}
      }
      if (!meta && this.partsBinManager.selectedIndex != null) {
        meta = this.partsBinManager.getPartMeta(this.partsBinManager.selectedIndex);
      }
      tryDrop(meta, e.clientX, e.clientY);
      this._dragPartMeta = null;
    });

    canvas.addEventListener("click", (e) => {
      if (this.partsBinManager.selectedIndex == null) return;
      const meta = this.partsBinManager.getPartMeta(this.partsBinManager.selectedIndex);
      tryDrop(meta, e.clientX, e.clientY);
    });
  }

  _onStepChange(data) {
    const counter = this.root.querySelector("#stepCounterDisplay");
    if (counter) counter.innerText = `Étape ${data.stepIndex} / ${data.totalSteps}`;

    const bar = this.root.querySelector("#circuitsStepProgressBar");
    if (bar && data.totalSteps > 0) {
      const pct = data.isComplete
        ? 100
        : Math.min(100, Math.round((data.stepIndex / data.totalSteps) * 100));
      bar.style.width = `${pct}%`;
    }

    const prev = this.root.querySelector("#btnStepPrev");
    if (prev) prev.disabled = data.stepIndex <= 1;

    const next = this.root.querySelector("#btnStepNext");
    if (next) {
      next.disabled = !!data.isComplete;
      next.innerText = data.isComplete ? "Terminé ✓" : "Suivant ▶";
    }

    this._updateSpokenText(data.spokenText, { speak: data.shouldSpeak !== false });

    if (this.activeProblem?.id) {
      saveCircuitsProgress({
        problemId: this.activeProblem.id,
        stepIndex: data.stepIndex || 0,
        totalSteps: data.totalSteps || 0,
        completed: !!data.isComplete,
        mode: data.mode || this.workflowController?.currentMode
      });
    }

    this._publishTutorContext();

    if (data.isComplete) {
      this._onChallengeComplete();
    } else {
      this._hideCompletionToast();
    }
  }

  _onModeChange(mode, alertText) {
    const btn = this.root.querySelector("#btnModeToggle");
    const label = this.root.querySelector("#modeToggleLabel");
    if (mode === "PHYSICAL") {
      btn?.classList.add("mode-physical");
      if (label) label.innerText = "Mode : Montage physique";
    } else {
      btn?.classList.remove("mode-physical");
      if (label) label.innerText = "Mode : Aperçu virtuel";
    }
    this._updateSpokenText(alertText);
    this._publishTutorContext();
  }

  _publishTutorContext() {
    const state = this.workflowController?.getCurrentState?.() || {};
    window.currentSocraticLabContext = {
      experiment_id: "circuits_lab",
      title: state.problemTitle || this.activeProblem?.title || "Atelier Circuits",
      problem_id: state.problemId || this.activeProblem?.id || "",
      mode: state.mode || this.workflowController?.currentMode || "VIRTUAL",
      current_step: state.step || 0,
      total_steps: state.totalSteps || 0,
      instruction: state.spokenInstruction || state.stepDescription || "",
      expected_component: state.expectedComponent || "",
      expected_pins: state.expectedPins || [],
      satisfied: Boolean(state.satisfied),
      complete: Boolean(state.isComplete),
    };
    if (typeof window.updateActiveViewState === "function") {
      window.updateActiveViewState();
    }
  }

  _onListeningChange(isListening) {
    const btn = this.root.querySelector("#btnCircuitsMic");
    if (!btn) return;
    btn.classList.toggle("listening", !!isListening);
  }

  _updateSpokenText(text, { speak = true } = {}) {
    const el = this.root.querySelector("#spokenMessageText");
    if (el && text) el.innerText = text;
    if (speak && text) speakFrench(text);
  }

  _onChallengeComplete() {
    const problem = this.activeProblem;
    if (!problem) return;
    markCircuitsProblemComplete(problem.id);
    this._renderCurriculumTree();

    const toast = this.root.querySelector("#circuitsCompletionToast");
    const title = this.root.querySelector("#circuitsCompletionTitle");
    const msg = this.root.querySelector("#circuitsCompletionMsg");
    if (title) title.innerText = "Défi terminé !";
    if (msg) {
      msg.innerText = `Bravo — « ${localizeTitle(problem)} » est complété. Passez au défi suivant ou révisez les étapes.`;
    }
    if (toast) toast.hidden = false;

    speakFrench(
      `Félicitations. Vous avez terminé ${localizeTitle(problem)}. Vous pouvez passer au défi suivant.`
    );

    if (typeof window.refreshLauncherProgressDots === "function") {
      window.refreshLauncherProgressDots();
    }
  }

  _hideCompletionToast() {
    const toast = this.root.querySelector("#circuitsCompletionToast");
    if (toast) toast.hidden = true;
  }

  _openNextIncompleteProblem() {
    const levels = this.curriculumService.getLevels();
    const flat = levels.flatMap((l) => l.problems || []);
    const idx = flat.findIndex((p) => p.id === this.activeProblem?.id);
    const next =
      flat.slice(idx + 1).find((p) => !getCircuitsProgress(p.id)?.completed) ||
      flat.find((p) => !getCircuitsProgress(p.id)?.completed && p.id !== this.activeProblem?.id);
    if (next) this.loadProject(next.id);
    else this._updateSpokenText("Tous les défis Circuits sont terminés. Excellent travail !");
  }

  destroy() {
    stopSpeaking();
    this.aiOrchestrator?.stopListening?.();
    this.breadboardEngine?.destroy?.();
    if (window.circuitsLabInstance === this) window.circuitsLabInstance = null;
  }
}

export function mountCircuitsLab(containerElement) {
  const app = new CircuitsLabApp(containerElement);
  app.init();
  return app;
}
