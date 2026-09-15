/**
 * workflow_controller.js - Dual-Mode Walkthrough State Machine
 * Virtual preview vs physical build, with drag-to-place steps.
 */

export class WorkflowController {
  constructor(breadboardEngine, uiCallbacks = {}) {
    this.canvas = breadboardEngine;
    this.ui = uiCallbacks;

    this.currentMode = "VIRTUAL"; // "VIRTUAL" or "PHYSICAL"
    this.activeProblem = null;
    this.currentStepIndex = 0;
    this.totalSteps = 0;
    this.placedHistory = [];
    this.currentStepSatisfied = false;
  }

  loadProblem(problemPayload) {
    this.activeProblem = problemPayload;
    this.currentStepIndex = 0;
    this.placedHistory = [];
    this.currentStepSatisfied = false;

    const connections = this.activeProblem.initial_schematic?.target_connections || [];
    this.totalSteps = connections.length;

    this.canvas.clearAllWiresAndComponents();

    const problemTitle = problemPayload.title_fr || problemPayload.title || "Défi";
    const initialText = `Défi : « ${problemTitle} ». ${
      this.currentMode === "VIRTUAL"
        ? "Glissez le bon composant depuis la nomenclature vers les trous en cuivre, ou utilisez Suivant."
        : "Mode montage physique. Glissez chaque pièce vers les balises vertes sur le breadboard."
    }`;

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: 0,
        totalSteps: this.totalSteps,
        spokenText: initialText,
        description: problemPayload.summary_fr || problemPayload.summary,
        stepData: null,
        mode: this.currentMode,
        shouldSpeak: true
      });
    }

    if (this.totalSteps > 0) {
      this.goToStep(1);
    }
  }

  toggleMode() {
    this.setMode(this.currentMode === "VIRTUAL" ? "PHYSICAL" : "VIRTUAL");
  }

  setMode(mode) {
    this.currentMode = mode;
    this.canvas.clearAllWiresAndComponents();
    this.currentStepIndex = 0;
    this.placedHistory = [];
    this.currentStepSatisfied = false;

    const alertText =
      mode === "PHYSICAL"
        ? "Mode montage physique. Glissez les pièces de la nomenclature sur les balises vertes."
        : "Mode aperçu virtuel. Glissez un composant ou appuyez sur Suivant pour placer automatiquement.";

    if (this.ui.onModeChange) {
      this.ui.onModeChange(this.currentMode, alertText);
    }

    if (this.totalSteps > 0) {
      this.goToStep(1);
    }
  }

  restartProject() {
    this.canvas.clearAllWiresAndComponents();
    this.currentStepIndex = 0;
    this.placedHistory = [];
    this.currentStepSatisfied = false;

    const text =
      this.currentMode === "PHYSICAL"
        ? "Atelier réinitialisé. Reprenez la LED dans la nomenclature et glissez-la sur le board."
        : "Aperçu réinitialisé. Glissez la LED ou appuyez sur Suivant.";

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: 0,
        totalSteps: this.totalSteps,
        spokenText: text,
        description: text,
        stepData: null,
        mode: this.currentMode
      });
    }

    if (this.totalSteps > 0) {
      this.goToStep(1);
    }
  }

  getCurrentStepData() {
    if (!this.activeProblem || this.currentStepIndex < 1) return null;
    const connections = this.activeProblem.initial_schematic?.target_connections || [];
    return connections[this.currentStepIndex - 1] || null;
  }

  getExpectedPartKinds(stepData = null) {
    const step = stepData || this.getCurrentStepData();
    if (!step) return [];
    const blob = `${step.component_id || ""} ${step.action || ""} ${step.description || ""} ${step.color || ""}`.toLowerCase();
    const kinds = [];
    if (blob.includes("led")) kinds.push("led");
    if (blob.includes("resistor") || blob.includes("résistance") || blob.includes("resistance")) kinds.push("resistor");
    if (blob.includes("wire") || blob.includes("jumper") || step.action === "DRAW_WIRE") kinds.push("wire");
    if (blob.includes("capacitor") || blob.includes("capa")) kinds.push("capacitor");
    if (blob.includes("transistor") || blob.includes("npn") || blob.includes("bjt")) kinds.push("transistor");
    if (blob.includes("ic") || blob.includes("dip") || blob.includes("555") || blob.includes("74")) kinds.push("ic");
    if (!kinds.length && step.action === "PLACE_COMPONENT") kinds.push("component");
    return kinds;
  }

  partMatchesCurrentStep(partMeta = {}) {
    const kinds = this.getExpectedPartKinds();
    if (!kinds.length) return true;
    const blob = `${partMeta.type || ""} ${partMeta.name || ""} ${partMeta.image_id || ""}`.toLowerCase();
    return kinds.some((kind) => {
      if (kind === "led") return blob.includes("led");
      if (kind === "resistor") return blob.includes("resistor") || blob.includes("résistance") || blob.includes("ohm");
      if (kind === "wire") return blob.includes("wire") || blob.includes("jumper") || blob.includes("fil");
      if (kind === "capacitor") return blob.includes("cap");
      if (kind === "transistor") return blob.includes("transistor") || blob.includes("npn") || blob.includes("bjt");
      if (kind === "ic") return blob.includes("ic") || blob.includes("dip") || blob.includes("555") || blob.includes("74");
      return true;
    });
  }

  _rebuildCompletedSteps() {
    const connections = this.activeProblem?.initial_schematic?.target_connections || [];
    this.canvas.clearAllWiresAndComponents();
    const completed = Math.max(0, this.currentStepIndex - (this.currentStepSatisfied ? 0 : 1));
    for (let i = 0; i < completed; i++) {
      this._applyStepVisual(connections[i]);
    }
  }

  _applyStepVisual(step) {
    if (!step) return;
    if (step.action === "PLACE_COMPONENT") {
      this.canvas.placeComponent({
        id: step.component_id,
        type: step.component_id || "IC",
        from: step.from,
        to: step.to,
        color: step.color
      });
    } else if (step.action === "DRAW_WIRE") {
      this.canvas.animateNewWire({
        from: step.from,
        to: step.to,
        color: step.color
      });
    }
  }

  _highlightCurrentStep(stepData) {
    if (!stepData) return;
    const color = this.currentMode === "PHYSICAL" ? 0x10b981 : 0xd4a574;
    this.canvas.highlightPins([stepData.from, stepData.to], color);
  }

  nextStep() {
    if (this.currentStepIndex >= this.totalSteps && this.currentStepSatisfied) {
      const finishText =
        this.currentMode === "PHYSICAL"
          ? "Bravo ! Câblage physique terminé. Alimentez le rail 5 V pour tester le circuit."
          : "Aperçu virtuel terminé. Cliquez sur « Monter en réel » pour construire sur votre breadboard.";
      if (this.ui.onStepChange) {
        this.ui.onStepChange({
          stepIndex: this.totalSteps,
          totalSteps: this.totalSteps,
          spokenText: finishText,
          description: finishText,
          stepData: null,
          mode: this.currentMode,
          isComplete: true,
          shouldSpeak: true
        });
      }
      return;
    }

    // If current step not yet placed, auto-place then stay / advance
    if (this.currentStepIndex >= 1 && !this.currentStepSatisfied) {
      this.satisfyCurrentStep({ auto: true });
      return;
    }

    if (this.currentStepIndex >= this.totalSteps) return;
    this.goToStep(this.currentStepIndex + 1);
  }

  prevStep() {
    if (this.currentStepIndex <= 1) return;
    this.currentStepSatisfied = false;
    this.goToStep(this.currentStepIndex - 1);
  }

  repeatStep() {
    if (this.currentStepIndex < 1) return;
    this.currentStepSatisfied = false;
    this.goToStep(this.currentStepIndex);
  }

  goToStep(targetStepIndex) {
    if (!this.activeProblem) return;
    const connections = this.activeProblem.initial_schematic?.target_connections || [];
    if (targetStepIndex < 1 || targetStepIndex > connections.length) return;

    this.currentStepIndex = targetStepIndex;
    this.currentStepSatisfied = false;
    const stepData = connections[this.currentStepIndex - 1];

    this._rebuildCompletedSteps();
    this._highlightCurrentStep(stepData);

    const spoken =
      stepData.spoken_instruction_fr ||
      stepData.spoken_instruction ||
      stepData.description_fr ||
      stepData.description ||
      "";
    const dragHint =
      this.currentMode === "PHYSICAL"
        ? " Glissez la pièce depuis la nomenclature vers les balises vertes."
        : " Glissez la pièce ou appuyez sur Suivant.";

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: this.currentStepIndex,
        totalSteps: this.totalSteps,
        spokenText: `${spoken}${dragHint}`,
        description: stepData.description_fr || stepData.description,
        stepData: stepData,
        mode: this.currentMode,
        isComplete: false,
        shouldSpeak: true
      });
    }
  }

  satisfyCurrentStep({ auto = false } = {}) {
    const stepData = this.getCurrentStepData();
    if (!stepData || this.currentStepSatisfied) return false;

    this._applyStepVisual(stepData);
    this.currentStepSatisfied = true;
    this.canvas.clearHighlights();

    const done = this.currentStepIndex >= this.totalSteps;
    const spokenText = auto
      ? `Étape ${this.currentStepIndex} placée. Appuyez sur Suivant pour continuer.`
      : done
        ? `Parfait — dernière étape réussie (${this.currentStepIndex}/${this.totalSteps}) !`
        : `Parfait — composant en place (étape ${this.currentStepIndex}/${this.totalSteps}).`;

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: this.currentStepIndex,
        totalSteps: this.totalSteps,
        spokenText,
        description: stepData.description_fr || stepData.description,
        stepData: stepData,
        mode: this.currentMode,
        isComplete: done,
        shouldSpeak: true
      });
    }

    // Auto-advance shortly after a successful manual drop
    if (!auto && this.currentStepIndex < this.totalSteps) {
      setTimeout(() => {
        if (this.currentStepSatisfied && this.currentStepIndex < this.totalSteps) {
          this.goToStep(this.currentStepIndex + 1);
        }
      }, 650);
    } else if (!auto && done) {
      this.nextStep();
    }

    return true;
  }

  /**
   * Attempt to place a dragged nomenclature part onto the board.
   * PHYSICAL mode: must land near highlighted target holes.
   * VIRTUAL mode: prefers highlights, with a slightly wider target.
   */
  tryPlaceDraggedPart(partMeta, clientX, clientY) {
    const stepData = this.getCurrentStepData();
    if (!stepData) {
      return { ok: false, reason: "Aucun défi actif." };
    }
    if (this.currentStepSatisfied) {
      return { ok: false, reason: "Étape déjà placée — passez à la suivante." };
    }
    if (!this.partMatchesCurrentStep(partMeta)) {
      return {
        ok: false,
        reason: "Ce n'est pas le bon composant pour cette étape. Prenez celui indiqué dans la consigne."
      };
    }

    const targets = [stepData.from, stepData.to].filter(Boolean);
    const pick = this.canvas.pickNearestPin
      ? this.canvas.pickNearestPin(clientX, clientY, targets)
      : null;

    const maxDist = this.currentMode === "PHYSICAL" ? 0.95 : 1.35;
    if (!pick || (pick.distance != null && pick.distance > maxDist)) {
      return {
        ok: false,
        reason:
          this.currentMode === "PHYSICAL"
            ? "Visez les trous en surbrillance verte — rapprochez la pièce de la balise."
            : "Déposez la pièce sur les trous en cuivre surlignés."
      };
    }

    this.satisfyCurrentStep({ auto: false });
    return { ok: true, reason: "Composant enfiché sur le breadboard." };
  }

  getCurrentState() {
    const step = this.getCurrentStepData();
    return {
      problemId: this.activeProblem?.id,
      problemTitle: this.activeProblem?.title_fr || this.activeProblem?.title,
      mode: this.currentMode,
      step: this.currentStepIndex,
      totalSteps: this.totalSteps,
      satisfied: this.currentStepSatisfied,
      isComplete: this.currentStepIndex >= this.totalSteps && this.currentStepSatisfied,
      stepDescription: step?.description_fr || step?.description || "",
      spokenInstruction: step?.spoken_instruction_fr || step?.spoken_instruction || "",
      expectedPins: step ? [step.from, step.to].filter(Boolean) : [],
      expectedComponent: step?.component_id || ""
    };
  }
}
