/**
 * VoiceInput - Web Speech Recognition & Natural Math Phrase Converter
 * Converts spoken student math requests into clean, parseable mathematical expressions
 */
export class VoiceInput {
  constructor(options = {}) {
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.isListening = false;
    this.recognition = null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US"; // Supports standard STEM voice input

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange(true);
    };

    this.recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      const isFinal = event.results[event.results.length - 1].isFinal;
      const converted = this.convertSpeechToMath(transcript);
      this.onTranscript(converted, transcript, isFinal);
    };

    this.recognition.onerror = (err) => {
      console.warn("Speech Recognition error:", err);
      this.isListening = false;
      this.onStateChange(false);
      this.onError(err);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange(false);
    };
  }

  toggle() {
    if (!this.recognition) {
      this.onError(new Error("Speech recognition not available in your browser."));
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  }

  /**
   * Translates spoken English math phrases into mathematical syntax
   */
  convertSpeechToMath(rawSpeech) {
    if (!rawSpeech) return "";

    let text = rawSpeech.toLowerCase().trim();

    // Strip conversational prefixes
    text = text.replace(/^(graph|plot|draw|sketch|show|can you graph|can you plot)\s+/i, "");
    text = text.replace(/^(y equals|y =|f of x equals|function of x equals)\s+/i, "");

    // Geometry / Vector phrases
    text = text.replace(/\bpoint\s+(-?\d+)\s+(?:and\s+)?(-?\d+)\b/gi, "($1, $2)");
    text = text.replace(/\bvector\s+(-?\d+)\s+(?:and\s+)?(-?\d+)\b/gi, "[$1, $2]");

    // Powers & Roots
    text = text.replace(/\bsquared\b/gi, "^2");
    text = text.replace(/\bcubed\b/gi, "^3");
    text = text.replace(/\bto the power of\s+(\d+)\b/gi, "^$1");
    text = text.replace(/\bto the (\d+)(?:st|nd|rd|th)\b/gi, "^$1");
    text = text.replace(/\bsquare root of\s+([a-z0-9_()]+)\b/gi, "sqrt($1)");

    // Operators
    text = text.replace(/\bplus\b/gi, "+");
    text = text.replace(/\bminus\b/gi, "-");
    text = text.replace(/\btimes\b/gi, "*");
    text = text.replace(/\bmultiplied by\b/gi, "*");
    text = text.replace(/\bdivided by\b/gi, "/");
    text = text.replace(/\bover\b/gi, "/");

    // Trigonometric & Logarithmic
    text = text.replace(/\bsine of\s+([a-z0-9_()]+)\b/gi, "sin($1)");
    text = text.replace(/\bcosine of\s+([a-z0-9_()]+)\b/gi, "cos($1)");
    text = text.replace(/\btangent of\s+([a-z0-9_()]+)\b/gi, "tan($1)");
    text = text.replace(/\bsin\s+([a-z0-9_]+)\b/gi, "sin($1)");
    text = text.replace(/\bcos\s+([a-z0-9_]+)\b/gi, "cos($1)");
    text = text.replace(/\btan\s+([a-z0-9_]+)\b/gi, "tan($1)");
    text = text.replace(/\bnatural log of\s+([a-z0-9_()]+)\b/gi, "ln($1)");
    text = text.replace(/\blog of\s+([a-z0-9_()]+)\b/gi, "log($1)");

    // Constants & Words to digits
    text = text.replace(/\bpi\b/gi, "pi");
    text = text.replace(/\bzero\b/gi, "0");
    text = text.replace(/\bone\b/gi, "1");
    text = text.replace(/\btwo\b/gi, "2");
    text = text.replace(/\bthree\b/gi, "3");
    text = text.replace(/\bfour\b/gi, "4");
    text = text.replace(/\bfive\b/gi, "5");
    text = text.replace(/\bsix\b/gi, "6");
    text = text.replace(/\bseven\b/gi, "7");
    text = text.replace(/\beight\b/gi, "8");
    text = text.replace(/\bnine\b/gi, "9");
    text = text.replace(/\bten\b/gi, "10");

    // Clean extra whitespace
    return text.replace(/\s+/g, " ").trim();
  }
}
