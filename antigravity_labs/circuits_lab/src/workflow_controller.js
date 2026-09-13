/**
 * workflow_controller.js - Dual-Mode Walkthrough State Machine
 * Manages "Virtual Preview Mode" vs "Physical Build Mode" and step progressions.
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
  }

  loadProblem(problemPayload) {
    this.activeProblem = problemPayload;
    this.currentStepIndex = 0;
    this.placedHistory = [];

    const connections = this.activeProblem.initial_schematic?.target_connections || [];
    this.totalSteps = connections.length;

    // Reset 3D canvas
    this.canvas.clearAllWiresAndComponents();

    // Trigger initial notification
    const initialText = `Starting challenge: "${problemPayload.title}". ${
      this.currentMode === "VIRTUAL"
        ? "Watch the virtual preview as the AI demonstrates each connection."
        : "Physical Build Mode active. Follow the illuminated pin beacons on the board."
    }`;

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: 0,
        totalSteps: this.totalSteps,
        spokenText: initialText,
        description: problemPayload.summary,
        stepData: null,
        mode: this.currentMode
      });
    }

    // Run first step automatically
    if (this.totalSteps > 0) {
      this.goToStep(1);
    }
  }

  toggleMode() {
    const nextMode = this.currentMode === "VIRTUAL" ? "PHYSICAL" : "VIRTUAL";
    this.setMode(nextMode);
  }

  setMode(mode) {
    this.currentMode = mode;
    this.canvas.clearAllWiresAndComponents();
    this.currentStepIndex = 0;
    this.placedHistory = [];

    const alertText =
      mode === "PHYSICAL"
        ? "Switched to Physical Build Mode. The 3D canvas will illuminate target coordinates as a visual guide while you wire your real breadboard."
        : "Switched to Virtual Preview Mode. The AI will draw 3D wires and place virtual components automatically.";

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

    const text =
      this.currentMode === "PHYSICAL"
        ? "Workspace reset! Grab your hardware components from the parts bin. Starting from step 1."
        : "Virtual workspace reset. Ready for step-by-step preview.";

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

  nextStep() {
    if (this.currentStepIndex >= this.totalSteps) {
      const finishText =
        this.currentMode === "PHYSICAL"
          ? "Congratulations! You have completed the physical wiring. Power on your 5V rail to test the circuit."
          : "Virtual preview complete! Click 'Reset & Build Physically' to build this circuit on your desk breadboard.";
      if (this.ui.onStepChange) {
        this.ui.onStepChange({
          stepIndex: this.totalSteps,
          totalSteps: this.totalSteps,
          spokenText: finishText,
          description: finishText,
          stepData: null,
          mode: this.currentMode,
          isComplete: true
        });
      }
      return;
    }

    this.goToStep(this.currentStepIndex + 1);
  }

  prevStep() {
    if (this.currentStepIndex <= 1) return;
    this.goToStep(this.currentStepIndex - 1);
  }

  repeatStep() {
    if (this.currentStepIndex < 1) return;
    this.goToStep(this.currentStepIndex);
  }

  goToStep(targetStepIndex) {
    if (!this.activeProblem) return;
    const connections = this.activeProblem.initial_schematic?.target_connections || [];
    if (targetStepIndex < 1 || targetStepIndex > connections.length) return;

    this.currentStepIndex = targetStepIndex;
    const stepData = connections[this.currentStepIndex - 1];

    if (this.currentMode === "VIRTUAL") {
      // Rebuild virtual wires up to this step
      this.canvas.clearAllWiresAndComponents();
      for (let i = 0; i < this.currentStepIndex; i++) {
        const step = connections[i];
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
      // Highlight current step terminals
      this.canvas.highlightPins([stepData.from, stepData.to], 0xc2c1ff);
    } else {
      // PHYSICAL BUILD MODE:
      // Clear 3D virtual wires so the board stays clean like a real board!
      this.canvas.clearAllWiresAndComponents();
      // Only illuminate and flash the target pin beacons
      this.canvas.highlightPins([stepData.from, stepData.to], 0x10b981);
    }

    const spoken = stepData.spoken_instruction || stepData.description;

    if (this.ui.onStepChange) {
      this.ui.onStepChange({
        stepIndex: this.currentStepIndex,
        totalSteps: this.totalSteps,
        spokenText: spoken,
        description: stepData.description,
        stepData: stepData,
        mode: this.currentMode,
        isComplete: false
      });
    }
  }

  getCurrentState() {
    return {
      problemId: this.activeProblem?.id,
      problemTitle: this.activeProblem?.title,
      mode: this.currentMode,
      step: this.currentStepIndex,
      totalSteps: this.totalSteps
    };
  }
}
