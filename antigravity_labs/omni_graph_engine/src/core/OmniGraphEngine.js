import { CoordinateMapper } from "./CoordinateMapper.js";
import { GeneralGraphScene } from "../math/GeneralGraphScene.js";
import { CalculusScene } from "../math/CalculusScene.js";
import { LinearAlgebraScene } from "../math/LinearAlgebraScene.js";
import { KinematicsScene } from "../physics/KinematicsScene.js";
import { VoiceInput } from "../utils/VoiceInput.js";
import { VisionOcr } from "../utils/VisionOcr.js";

/**
 * OmniGraphEngine - Unified Namespace Orchestrator for Interactive STEM Graphing & Simulation
 */
export class OmniGraphEngine {
  constructor(options = {}) {
    this.container = options.container || null;
    this.currentScene = null;
    this.currentSceneId = null;

    this.onTelemetry = options.onTelemetry || (() => {});
    this.onVariablesDetected = options.onVariablesDetected || (() => {});
    this.onCurvesUpdated = options.onCurvesUpdated || (() => {});
    this.onFormulaChanged = options.onFormulaChanged || (() => {});

    // Voice and Vision Utilities
    this.voiceInput = new VoiceInput({
      onTranscript: (_mathFormula, rawText, isFinal, serverFormula) => {
        const spoken = (rawText || _mathFormula || "").trim();
        if (options.onVoiceTranscript) {
          options.onVoiceTranscript(spoken, spoken, isFinal);
        }
        if (isFinal && spoken) {
          let plot = this.voiceInput.convertSpeechToMath(spoken) || spoken;
          const hinted = String(serverFormula || "").trim();
          if (hinted && this.voiceInput.speechSupportsFormula(spoken, hinted)) {
            plot = hinted;
          }
          if (this.voiceInput.isStockGuess(plot) && !this.voiceInput.speechSupportsFormula(spoken, plot)) {
            plot = spoken;
          }
          this.plotFormula(plot, { silentInput: true });
        }
      },
      onStateChange: (listening) => {
        if (options.onVoiceStateChange) options.onVoiceStateChange(listening);
      },
      onStatus: (msg) => {
        if (options.onVoiceStatus) options.onVoiceStatus(msg);
      },
      onError: (err) => {
        if (options.onVoiceError) options.onVoiceError(err);
      }
    });

    this.visionOcr = new VisionOcr({
      onResult: (res) => {
        if (options.onOcrResult) options.onOcrResult(res);
        if (res.rawFormula) {
          this.plotFormula(res.rawFormula);
        }
      },
      onLoading: (isLoading, msg) => {
        if (options.onOcrLoading) options.onOcrLoading(isLoading, msg);
      }
    });

    if (this.container) {
      this.mount(this.container);
    }
  }

  mount(container) {
    this.container = container;
  }

  async loadScene(sceneId, options = {}) {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }

    this.currentSceneId = sceneId;

    switch (sceneId) {
      case "calculus-riemann":
        this.currentScene = new CalculusScene();
        break;

      case "linear-algebra":
        this.currentScene = new LinearAlgebraScene();
        break;

      case "physics-kinematics":
        this.currentScene = new KinematicsScene();
        break;

      case "general-math":
      default:
        this.currentScene = new GeneralGraphScene();
        break;
    }

    const mergedOptions = {
      ...options,
      onVariablesDetected: (vars, params) => {
        this.onVariablesDetected(vars, params);
      },
      onCurvesUpdated: (curves) => {
        this.onCurvesUpdated(curves);
      },
      onMetricsUpdated: (metrics) => {
        this.onTelemetry({ scene: this.currentSceneId, ...metrics });
      },
      onTelemetry: (data) => {
        this.onTelemetry({ scene: this.currentSceneId, ...data });
      }
    };

    this.currentScene.init(this.container, mergedOptions);
    return this.currentScene;
  }

  plotFormula(formulaStr, options = {}) {
    if (!options.silentInput && this.onFormulaChanged) {
      this.onFormulaChanged(formulaStr);
    }
    if (this.currentSceneId !== "general-math") {
      this.loadScene("general-math", { formula: formulaStr });
    } else if (this.currentScene && typeof this.currentScene.plot === "function") {
      this.currentScene.plot(formulaStr);
    }
  }

  removeCurve(index) {
    if (this.currentScene && this.currentScene.activeCurves) {
      const remaining = this.currentScene.activeCurves
        .filter((_, i) => i !== index)
        .map(c => c.rawExpr);
      this.plotFormula(remaining.join(", ") || "0");
      return remaining.join(", ");
    }
    return "";
  }

  setVariable(name, value) {
    if (this.currentScene && typeof this.currentScene.updateVariables === "function") {
      this.currentScene.updateVariables({ [name]: parseFloat(value) });
    }
  }

  toggleVoice() {
    return this.voiceInput.toggle();
  }

  uploadMathImage(file) {
    return this.visionOcr.processImageFile(file);
  }

  resize() {
    if (this.currentScene && this.container) {
      this.currentScene.resize(this.container.clientWidth, this.container.clientHeight);
    }
  }

  zoomIn() {
    if (this.currentScene && typeof this.currentScene.zoomIn === "function") {
      this.currentScene.zoomIn();
    }
  }

  zoomOut() {
    if (this.currentScene && typeof this.currentScene.zoomOut === "function") {
      this.currentScene.zoomOut();
    }
  }

  clearAll() {
    if (this.currentScene && typeof this.currentScene.clearAll === "function") {
      this.currentScene.clearAll();
    } else if (this.currentScene && typeof this.currentScene.resetZoom === "function") {
      this.currentScene.resetZoom();
    }
    if (this.onFormulaChanged) {
      this.onFormulaChanged("");
    }
    this.onVariablesDetected([], {});
    this.onCurvesUpdated([]);
    this.onTelemetry({ scene: this.currentSceneId || "general-math" });
  }

  resetZoom() {
    this.clearAll();
  }

  destroy() {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }
  }
}
