/**
 * ai_orchestrator.js - Modular Hybrid AI Voice & Logic Router
 * Fast local-first step navigation (<10ms) backed by Cloud Gemini for deep debugging.
 */

import { speakFrench, stopSpeaking, createFrSpeechRecognition } from "../../shared/stem_voice_helper.js";

export class AIOrchestrator {
  constructor(workflowController, options = {}) {
    this.controller = workflowController;
    this.options = options;
    this.recognition = null;
    this.isListening = false;
    this.onListeningChange = options.onListeningChange || null;
    this.onSpokenFeedback = options.onSpokenFeedback || null;

    this._setupSpeechRecognition();
  }

  _setupSpeechRecognition() {
    this.recognition = createFrSpeechRecognition({
      onStart: () => {
        this.isListening = true;
        if (this.onListeningChange) this.onListeningChange(true);
      },
      onEnd: () => {
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      },
      onError: (event) => {
        console.warn("[AI ORCHESTRATOR] Speech error:", event?.error);
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      },
      onResult: async (transcript) => {
        console.log("[AI ORCHESTRATOR] Voice command received:", transcript);
        await this.processUserIntent(transcript);
      }
    });

    if (!this.recognition) {
      console.warn("[AI ORCHESTRATOR] SpeechRecognition API not supported in this browser. Voice fallback active.");
    }
  }

  toggleListening() {
    // Inside the main platform every Gandho button controls the same LiveKit
    // call. Do not start a second Web Speech microphone (unsupported in
    // Firefox and able to compete with LiveKit in Chromium).
    if (typeof window.toggleMicRaiseHand === "function") {
      const circuitState = this.controller.getCurrentState();
      window.currentSocraticLabContext = {
        experiment_id: "circuits_lab",
        title: circuitState.problemTitle || "Atelier Circuits",
        problem_id: circuitState.problemId,
        mode: circuitState.mode,
        current_step: circuitState.step,
        total_steps: circuitState.totalSteps,
        instruction: circuitState.spokenInstruction || circuitState.stepDescription,
        expected_component: circuitState.expectedComponent,
        expected_pins: circuitState.expectedPins,
        satisfied: circuitState.satisfied,
        complete: circuitState.isComplete,
      };
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }
      const alreadyOn = Boolean(
        window.isConversationSessionActive || window._lkVoiceConnected
      );
      if (!alreadyOn) window.toggleMicRaiseHand(null, true);
      this.isListening = true;
      if (this.onListeningChange) this.onListeningChange(true);
      return;
    }

    if (!this.recognition) {
      const promptText = window.prompt(
        "Micro indisponible. Entrez une question ou une commande (ex. « suivant », « pourquoi cette résistance 1k ? ») :"
      );
      if (promptText) this.processUserIntent(promptText);
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn("[AI ORCHESTRATOR] Mic start warning:", err);
      }
    }
  }

  stopListening() {
    stopSpeaking();
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    if (this.onListeningChange) this.onListeningChange(false);
  }

  async processUserIntent(userInput) {
    if (!userInput || typeof userInput !== "string") return;
    const cleanText = userInput.trim().toLowerCase();

    // 1. Check Local Navigation Commands (<10ms offline execution)
    const localNav = this._matchLocalCommand(cleanText);
    if (localNav) {
      this._executeLocalAction(localNav);
      return;
    }

    // 2. Complex Query Route: Send to Gemini / Backend AI Tutor
    const circuitState = this.controller.getCurrentState();
    const payload = {
      question: userInput,
      problemId: circuitState.problemId,
      problemTitle: circuitState.problemTitle,
      mode: circuitState.mode,
      currentStep: circuitState.step,
      totalSteps: circuitState.totalSteps,
      stepDescription: circuitState.stepDescription,
      spokenInstruction: circuitState.spokenInstruction,
      expectedPins: circuitState.expectedPins,
      expectedComponent: circuitState.expectedComponent,
      satisfied: circuitState.satisfied,
      isComplete: circuitState.isComplete
    };

    this._speakFeedback("Un instant… je vérifie le schéma.");

    try {
      const res = await fetch("/api/circuits/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.answer || "Vérifiez vos connexions d’après le schéma.";
        this._speakFeedback(answer);
      } else {
        this._handleLocalFallbackExplanation(cleanText, circuitState);
      }
    } catch (err) {
      console.warn("[AI ORCHESTRATOR] Backend query notice, using local solver:", err);
      this._handleLocalFallbackExplanation(cleanText, circuitState);
    }
  }

  _matchLocalCommand(text) {
    if (
      text.includes("next") ||
      text.includes("forward") ||
      text.includes("done") ||
      text.includes("continue") ||
      text.includes("suivant") ||
      text.includes("continuez") ||
      text.includes("continuer") ||
      text.includes("étape suivante")
    ) {
      return "NEXT";
    }
    if (
      text.includes("back") ||
      text.includes("previous") ||
      text.includes("last") ||
      text.includes("précédent") ||
      text.includes("precedent") ||
      text.includes("retour")
    ) {
      return "PREV";
    }
    if (
      text.includes("repeat") ||
      text.includes("again") ||
      text.includes("répète") ||
      text.includes("repete") ||
      text.includes("encore")
    ) {
      return "REPEAT";
    }
    if (
      text.includes("physical") ||
      text.includes("desk") ||
      text.includes("real") ||
      text.includes("physique") ||
      text.includes("réel") ||
      text.includes("reel") ||
      text.includes("montage")
    ) {
      return "MODE_PHYSICAL";
    }
    if (text.includes("virtual") || text.includes("preview") || text.includes("virtuel") || text.includes("aperçu") || text.includes("apercu")) {
      return "MODE_VIRTUAL";
    }
    if (
      text.includes("reset") ||
      text.includes("restart") ||
      text.includes("start over") ||
      text.includes("recommencer") ||
      text.includes("remettre")
    ) {
      return "RESET";
    }
    return null;
  }

  _executeLocalAction(action) {
    switch (action) {
      case "NEXT":
        this.controller.nextStep();
        break;
      case "PREV":
        this.controller.prevStep();
        break;
      case "REPEAT":
        this.controller.repeatStep();
        break;
      case "MODE_PHYSICAL":
        this.controller.setMode("PHYSICAL");
        break;
      case "MODE_VIRTUAL":
        this.controller.setMode("VIRTUAL");
        break;
      case "RESET":
        this.controller.restartProject();
        break;
    }
  }

  _handleLocalFallbackExplanation(text, circuitState) {
    let explanation =
      "Vérifiez d’abord l’alignement des rails VCC et masse avant de continuer.";

    if (circuitState?.spokenInstruction) {
      explanation = `Pour cette étape : ${circuitState.spokenInstruction}`;
      if (circuitState.expectedPins?.length) {
        explanation += ` Ciblez les trous ${circuitState.expectedPins.join(" et ")}.`;
      }
    }

    if (text.includes("why") || text.includes("pourquoi") || text.includes("resistor") || text.includes("résistance") || text.includes("resistance")) {
      explanation =
        "Les résistances de limitation protègent les diodes et transistors contre les surintensités et l’emballement thermique.";
    } else if (text.includes("pin") || text.includes("pinout") || text.includes("broche")) {
      explanation =
        "Consultez la nomenclature à droite pour l’orientation exacte des broches des CI et diodes.";
    } else if (text.includes("hot") || text.includes("burn") || text.includes("smoke") || text.includes("chaud") || text.includes("fumée") || text.includes("fumee")) {
      explanation =
        "Coupez immédiatement l’alimentation 5 V ! Cherchez un court-circuit entre VCC et la masse.";
    } else if (text.includes("led") || text.includes("light") || text.includes("diode") || text.includes("lumière") || text.includes("lumiere")) {
      explanation =
        "Les LED sont polarisées : la patte longue est l’anode (positif), le méplat marque la cathode.";
    }

    this._speakFeedback(explanation);
  }

  _speakFeedback(text) {
    if (this.onSpokenFeedback) {
      this.onSpokenFeedback(text);
    }
    speakFrench(text, { rate: 1.05 });
  }
}
