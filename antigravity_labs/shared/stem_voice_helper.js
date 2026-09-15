/**
 * Shared FR voice helper for Circuits Atelier + Virtual Labs.
 * TTS (speechSynthesis) + optional SpeechRecognition wrapper.
 */

let preferredFrVoice = null;

function resolveFrVoice() {
  if (preferredFrVoice) return preferredFrVoice;
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  preferredFrVoice =
    voices.find((v) => /^fr(-|_)/i.test(v.lang) && /google|thomas|julie|denise|hortense/i.test(v.name)) ||
    voices.find((v) => /^fr(-|_)/i.test(v.lang)) ||
    null;
  return preferredFrVoice;
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    preferredFrVoice = null;
    resolveFrVoice();
  });
}

/**
 * Speak text aloud in French. Cancels any in-flight utterance first.
 * @param {string} text
 * @param {{ rate?: number, pitch?: number, lang?: string }} [opts]
 */
export function speakFrench(text, opts = {}) {
  if (!text || !("speechSynthesis" in window)) return;
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = opts.lang || "fr-FR";
  utterance.rate = opts.rate != null ? opts.rate : 1.02;
  utterance.pitch = opts.pitch != null ? opts.pitch : 1.0;
  const voice = resolveFrVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/**
 * Prefer French curriculum fields when present.
 */
export function localizeStepText(step = {}) {
  return (
    step.spoken_instruction_fr ||
    step.description_fr ||
    step.spoken_instruction ||
    step.description ||
    ""
  );
}

export function localizeTitle(item = {}) {
  return item.title_fr || item.title || item.name_fr || item.name || "";
}

/**
 * Thin SpeechRecognition factory (fr-FR). Returns null if unsupported.
 */
export function createFrSpeechRecognition({ onResult, onStart, onEnd, onError } = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "fr-FR";

  recognition.onstart = () => onStart && onStart();
  recognition.onend = () => onEnd && onEnd();
  recognition.onerror = (event) => onError && onError(event);
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (transcript && onResult) onResult(transcript);
  };
  return recognition;
}
