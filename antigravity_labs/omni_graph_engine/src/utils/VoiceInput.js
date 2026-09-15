/**
 * VoiceInput — record the microphone and transcribe that clip.
 *
 * Chrome Web Speech inside the STEM Graphs iframe guesses (often leaving
 * the default "3x + 5"). We never use it. Click mic to start, click again
 * to stop; the recording is sent to /api/omni_graph/voice_to_math.
 */
export class VoiceInput {
  constructor(options = {}) {
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onStatus = options.onStatus || (() => {});

    this.isListening = false;
    this._holdListen = false;
    this._spoken = "";
    this._micStream = null;
    this._recorder = null;
    this._chunks = [];
    this._recordTimer = null;
    this._startedAt = 0;
  }

  resolveLang() {
    try {
      const parentLoc = window.parent && window.parent !== window && window.parent.ACTIVE_DATABASE_LOCALE;
      if (parentLoc) {
        return String(parentLoc).toLowerCase().startsWith("fr") ? "fr-FR" : String(parentLoc).replace("_", "-");
      }
    } catch (err) {}
    if (typeof navigator === "undefined") return "fr-FR";
    const nav = (navigator.language || "fr-FR").replace("_", "-");
    if (nav.toLowerCase().startsWith("fr")) return "fr-FR";
    return nav || "en-US";
  }

  async toggle() {
    if (this.isListening || this._holdListen) {
      this.stop();
      return;
    }
    await this.start();
  }

  notifyParentListening(listening) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "GANDHO_GRAPH_VOICE", listening: Boolean(listening) }, "*");
      }
    } catch (err) {}
  }

  async start() {
    this._holdListen = true;
    this._spoken = "";
    this.notifyParentListening(true);
    await this.startMediaRecorder();
  }

  stop() {
    this._holdListen = false;
    if (this._recorder && this._recorder.state === "recording") {
      const elapsed = Date.now() - (this._startedAt || 0);
      const wait = Math.max(0, 700 - elapsed);
      window.setTimeout(() => {
        try {
          if (this._recorder && this._recorder.state === "recording") {
            this._recorder.stop();
          }
        } catch (e) {}
      }, wait);
      return;
    }
    this._cleanupRecorder(false);
  }

  async startMediaRecorder() {
    if (this._recorder) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError(new Error("This browser cannot access the microphone."));
      this._holdListen = false;
      this.notifyParentListening(false);
      return;
    }
    if (!window.MediaRecorder) {
      this.onError(new Error("Voice input is not supported in this browser. Use Chrome or Edge."));
      this._holdListen = false;
      this.notifyParentListening(false);
      return;
    }

    try {
      this._micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (err) {
      const name = err && err.name;
      this._holdListen = false;
      this.notifyParentListening(false);
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        this.onError(new Error("Microphone permission was blocked. Allow the mic for this site, then click the graph voice button again."));
      } else if (name === "NotFoundError") {
        this.onError(new Error("No microphone was found."));
      } else {
        this.onError(err);
      }
      return;
    }

    this._chunks = [];
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
    this._recorder = mime ? new MediaRecorder(this._micStream, { mimeType: mime }) : new MediaRecorder(this._micStream);

    this._recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this._chunks.push(event.data);
      }
    };

    this._recorder.onstop = async () => {
      const blob = new Blob(this._chunks, { type: (this._recorder && this._recorder.mimeType) || "audio/webm" });
      this._cleanupRecorder(true);
      if (!blob.size) {
        this.notifyParentListening(false);
        this.onError(new Error("Nothing was recorded. Click the voice button, speak, then click again to stop."));
        return;
      }
      await this.sendRecording(blob);
    };

    this._recorder.start(200);
    this._startedAt = Date.now();
    this.isListening = true;
    this.onStateChange(true);
    this.onStatus("Listening — speak your formula, then click the mic to stop.");
    this._recordTimer = setTimeout(() => {
      if (this._recorder && this._recorder.state === "recording") {
        this._recorder.stop();
      }
    }, 15000);
  }

  _cleanupRecorder(keepParentNotified = false) {
    if (this._recordTimer) {
      clearTimeout(this._recordTimer);
      this._recordTimer = null;
    }
    if (this._micStream) {
      this._micStream.getTracks().forEach((track) => track.stop());
      this._micStream = null;
    }
    this._recorder = null;
    this._chunks = [];
    this.isListening = false;
    this._holdListen = false;
    this.onStateChange(false);
    if (!keepParentNotified) {
      this.notifyParentListening(false);
    }
  }

  apiUrl() {
    try {
      const origin = (window.location && window.location.origin) || "";
      if (origin && origin !== "null") {
        return `${origin}/api/omni_graph/voice_to_math`;
      }
    } catch (err) {}
    return "/api/omni_graph/voice_to_math";
  }

  async sendRecording(blob) {
    this.onStatus("Transcribing what you said…");
    try {
      const resp = await fetch(this.apiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "audio/webm",
          "X-Graph-Voice-Locale": this.resolveLang(),
        },
        body: blob,
      });
      const data = await resp.json().catch(() => ({}));
      const spoken = String(data.raw || data.transcript || data.formula || "").trim();
      if (!resp.ok || !data.success || !spoken) {
        this.onError(new Error(data.error || "Could not hear what you said. Click the mic, speak, then click again."));
        this.notifyParentListening(false);
        return;
      }
      this._spoken = spoken;
      this.onTranscript(spoken, spoken, true, data.formula || "");
    } catch (err) {
      this.onError(err);
    } finally {
      this.notifyParentListening(false);
    }
  }

  /**
   * Translates spoken English/French math phrases into mathematical syntax
   */
  convertSpeechToMath(rawSpeech) {
    if (!rawSpeech) return "";

    const original = String(rawSpeech).trim();
    if (/[=^+\-*/()]/.test(original) || /\b(sin|cos|tan|log|ln|sqrt)\s*\(/i.test(original)) {
      return original.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, " ").trim();
    }

    let text = original.toLowerCase().trim();

    text = text.replace(/^(graph|plot|draw|sketch|show|can you graph|can you plot|trace|dessine|affiche|trace moi|trace-moi)\s+/i, "");
    text = text.replace(/^(y equals|y =|f of x equals|function of x equals|y égale|y egal|y égale|f de x égale)\s+/i, "");

    text = text.replace(/\bpoint\s+(-?\d+)\s+(?:and\s+|et\s+)?(-?\d+)\b/gi, "($1, $2)");
    text = text.replace(/\bvector\s+(-?\d+)\s+(?:and\s+|et\s+)?(-?\d+)\b/gi, "[$1, $2]");

    text = text.replace(/\bsquared\b/gi, "^2");
    text = text.replace(/\bau carré\b/gi, "^2");
    text = text.replace(/\bcarré\b/gi, "^2");
    text = text.replace(/\bcubed\b/gi, "^3");
    text = text.replace(/\bau cube\b/gi, "^3");
    text = text.replace(/\bto the power of\s+(\d+)\b/gi, "^$1");
    text = text.replace(/\bto the (\d+)(?:st|nd|rd|th)\b/gi, "^$1");
    text = text.replace(/\bsquare root of\s+([a-z0-9_()]+)\b/gi, "sqrt($1)");
    text = text.replace(/\bracine (?:carrée )?de\s+([a-z0-9_()]+)\b/gi, "sqrt($1)");

    text = text.replace(/\bplus\b/gi, "+");
    text = text.replace(/\bminus\b/gi, "-");
    text = text.replace(/\bmoins\b/gi, "-");
    text = text.replace(/\btimes\b/gi, "*");
    text = text.replace(/\bfois\b/gi, "*");
    text = text.replace(/\bmultiplied by\b/gi, "*");
    text = text.replace(/\bdivided by\b/gi, "/");
    text = text.replace(/\bdivisé par\b/gi, "/");
    text = text.replace(/\bover\b/gi, "/");

    text = text.replace(/\bsine of\s+([a-z0-9_()]+)\b/gi, "sin($1)");
    text = text.replace(/\bsinus de\s+([a-z0-9_()]+)\b/gi, "sin($1)");
    text = text.replace(/\bcosine of\s+([a-z0-9_()]+)\b/gi, "cos($1)");
    text = text.replace(/\bcosinus de\s+([a-z0-9_()]+)\b/gi, "cos($1)");
    text = text.replace(/\btangent of\s+([a-z0-9_()]+)\b/gi, "tan($1)");
    text = text.replace(/\bsin\s+([a-z0-9_]+)\b/gi, "sin($1)");
    text = text.replace(/\bcos\s+([a-z0-9_]+)\b/gi, "cos($1)");
    text = text.replace(/\btan\s+([a-z0-9_]+)\b/gi, "tan($1)");
    text = text.replace(/\bnatural log of\s+([a-z0-9_()]+)\b/gi, "ln($1)");
    text = text.replace(/\blog of\s+([a-z0-9_()]+)\b/gi, "log($1)");

    text = text.replace(/\b(iks|ex)\b/gi, "x");
    text = text.replace(/\bpi\b/gi, "pi");
    const digits = [
      ["zero", "0"], ["zéro", "0"],
      ["one", "1"], ["une", "1"],
      ["two", "2"], ["deux", "2"],
      ["three", "3"], ["trois", "3"],
      ["four", "4"], ["quatre", "4"],
      ["five", "5"], ["cinq", "5"],
      ["six", "6"],
      ["seven", "7"], ["sept", "7"],
      ["eight", "8"], ["huit", "8"],
      ["nine", "9"], ["neuf", "9"],
      ["ten", "10"], ["dix", "10"],
    ];
    for (const [word, digit] of digits) {
      text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), digit);
    }
    text = text.replace(/\bun\b/gi, "1");

    text = text.replace(/(\d)\s+x\b/gi, "$1x");
    text = text.replace(/\s*([+\-*/=,])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
    text = text.replace(/\s*\^\s*/g, "^");
    text = text.replace(/(\d)\s+x\b/gi, "$1x");

    return text.replace(/\s+/g, " ").trim();
  }

  foldMathText(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9+]+/g, "");
  }

  isStockGuess(formula) {
    const n = this.foldMathText(formula);
    return n === "3x+5" || n === "x2-4" || n === "x2+y2=25";
  }

  speechSupportsFormula(spoken, formula) {
    if (!formula) return false;
    const t = this.foldMathText(spoken);
    const f = this.foldMathText(formula);
    if (!t || !f) return false;
    if (t.includes(f) || f.includes(t)) return true;
    const digits = f.match(/\d+/g) || [];
    const hasOps = /[+\-*/^=]/.test(formula) || /x/i.test(formula);
    if (!hasOps) return t.includes(f);
    const wordMap = {
      "0": ["0", "zero", "zero"],
      "1": ["1", "one", "un", "une"],
      "2": ["2", "two", "deux"],
      "3": ["3", "three", "trois"],
      "4": ["4", "four", "quatre"],
      "5": ["5", "five", "cinq"],
      "6": ["6", "six"],
      "7": ["7", "seven", "sept"],
      "8": ["8", "eight", "huit"],
      "9": ["9", "nine", "neuf"],
    };
    for (const d of digits) {
      const keys = wordMap[d] || [d];
      if (!keys.some((k) => t.includes(k))) return false;
    }
    if (/x/i.test(formula) && !/x|iks|ex/.test(t) && !t.includes("x")) {
      return false;
    }
    return digits.length > 0 || /sin|cos|tan|log|sqrt/.test(t);
  }
}
