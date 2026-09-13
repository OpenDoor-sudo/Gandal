/**
 * ai_orchestrator.js - Modular Hybrid AI Voice & Logic Router
 * Fast local-first step navigation (<10ms) backed by Cloud Gemini for deep debugging.
 */

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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[AI ORCHESTRATOR] SpeechRecognition API not supported in this browser. Voice fallback active.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onListeningChange) this.onListeningChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };

    this.recognition.onerror = (event) => {
      console.warn("[AI ORCHESTRATOR] Speech error:", event.error);
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };

    this.recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("[AI ORCHESTRATOR] Voice command received:", transcript);
      await this.processUserIntent(transcript);
    };
  }

  toggleListening() {
    if (!this.recognition) {
      const promptText = window.prompt("Speech mic not available. Enter a circuit question or voice command (e.g. 'next', 'why is this 1k resistor here?'):");
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
      totalSteps: circuitState.totalSteps
    };

    this._speakFeedback("Thinking... Checking schematic specifications.");

    try {
      const res = await fetch("/api/circuits/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.answer || "Check your connections according to the schematic.";
        this._speakFeedback(answer);
      } else {
        // Fallback local Socratic explanation
        this._handleLocalFallbackExplanation(cleanText, circuitState);
      }
    } catch (err) {
      console.warn("[AI ORCHESTRATOR] Backend query notice, using local solver:", err);
      this._handleLocalFallbackExplanation(cleanText, circuitState);
    }
  }

  _matchLocalCommand(text) {
    if (text.includes("next") || text.includes("forward") || text.includes("done") || text.includes("continue") || text.includes("what's next")) {
      return "NEXT";
    }
    if (text.includes("back") || text.includes("previous") || text.includes("last")) {
      return "PREV";
    }
    if (text.includes("repeat") || text.includes("again") || text.includes("show that again")) {
      return "REPEAT";
    }
    if (text.includes("physical") || text.includes("desk") || text.includes("real")) {
      return "MODE_PHYSICAL";
    }
    if (text.includes("virtual") || text.includes("preview")) {
      return "MODE_VIRTUAL";
    }
    if (text.includes("reset") || text.includes("restart") || text.includes("start over")) {
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
    let explanation = "Verify that power and ground rails are properly aligned before continuing.";

    if (text.includes("why") || text.includes("resistor")) {
      explanation = "Current-limiting resistors protect semiconductor diodes and transistors from thermal runaway and high current surges.";
    } else if (text.includes("pin") || text.includes("pinout")) {
      explanation = "Refer to the Parts Bin on the right panel for the exact pinout orientations of active ICs and diodes.";
    } else if (text.includes("hot") || text.includes("burn") || text.includes("smoke")) {
      explanation = "Disconnect your 5V power supply immediately! Check for short circuits between the VCC and Ground rails.";
    } else if (text.includes("led") || text.includes("light")) {
      explanation = "LEDs are polarized: the longer lead is the anode connecting to positive, and the flat edge is the cathode.";
    }

    this._speakFeedback(explanation);
  }

  _speakFeedback(text) {
    if (this.onSpokenFeedback) {
      this.onSpokenFeedback(text);
    }

    // Web Speech Synthesis (offline in browser)
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}
