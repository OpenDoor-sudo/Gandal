/* Python playground for the Code tab. Gandho can review intent here. He does not teach a topic. */
(function () {
  const CM_CSS = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.css";
  const CM_THEME = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/theme/material-darker.min.css";
  const CM_JS = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.js";
  const CM_PY = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/mode/python/python.min.js";
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
  const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

  const COPY = {
    en: {
      kicker: "Python only",
      title: "Code",
      blurb: "A Python editor for practice. It is not tied to a lesson.",
      task: "Write solution(x) so it returns the square of x.",
      intentLabel: "What are you trying to do?",
      intentPlaceholder: "I want to create a function that will compute the square root of x and return the answer.",
      questionLabel: "Ask Gandho",
      questionPlaceholder: "Your question appears here when you use the mic.",
      check: "Check with Gandho",
      mic: "Mic",
      micOn: "Listening...",
      micMissing: "This browser has no speech recognition. Type your question instead.",
      micError: "The microphone did not start. Type your question instead.",
      checking: "Gandho is reading your code...",
      gandho: "Gandho",
      right: "What you did right",
      wrong: "What you did wrong",
      how: "How to do it",
      needIntent: "Write what you are trying to do.",
      reviewFailed: "Gandho could not answer. Try the check again.",
      run: "Run",
      hint: "Hint",
      output: "Output",
      tests: "Tests",
      loading: "Loading Python...",
      ready: "Python ready",
      failed: "Python did not load. Check the network and try the Code tab again.",
      running: "Running...",
      notRun: "Not run",
      pass: "Pass",
      fail: "Fail",
      got: "Got",
      error: "Error",
      missing: "solution is missing",
      hints: ["Think about multiplication.", "What is x * x?"],
      solutionLabel: "Solution",
      showSolution: "Show solution",
    },
    fr: {
      kicker: "Python seulement",
      title: "Code",
      blurb: "Un éditeur Python pour s'entraîner. Il n'est lié à aucune leçon.",
      task: "Écris solution(x) pour qu'elle renvoie le carré de x.",
      intentLabel: "Que veux-tu faire ?",
      intentPlaceholder: "Je veux une fonction qui calcule la racine carrée de x et renvoie la réponse.",
      questionLabel: "Demander à Gandho",
      questionPlaceholder: "Ta question apparaît ici quand tu utilises le micro.",
      check: "Vérifier avec Gandho",
      mic: "Micro",
      micOn: "Écoute...",
      micMissing: "Ce navigateur n'a pas de reconnaissance vocale. Écris ta question.",
      micError: "Le micro n'a pas démarré. Écris ta question.",
      checking: "Gandho lit ton code...",
      gandho: "Gandho",
      right: "Ce qui est juste",
      wrong: "Ce qui ne va pas",
      how: "Comment le faire",
      needIntent: "Écris ce que tu essaies de faire.",
      reviewFailed: "Gandho n'a pas pu répondre. Réessaie la vérification.",
      run: "Exécuter",
      hint: "Indice",
      output: "Sortie",
      tests: "Tests",
      loading: "Chargement de Python...",
      ready: "Python est prêt",
      failed: "Python ne s'est pas chargé. Vérifie le réseau et rouvre l'onglet Code.",
      running: "Exécution...",
      notRun: "Pas exécuté",
      pass: "Réussi",
      fail: "Échoué",
      got: "Obtenu",
      error: "Erreur",
      missing: "solution est absente",
      hints: ["Pense à la multiplication.", "Que vaut x * x ?"],
      solutionLabel: "Solution",
      showSolution: "Voir la solution",
    },
  };

  const TESTS = [
    { id: "t1", input: "5", expected: "25", en: "Square the input", fr: "Mettre l'entrée au carré" },
    { id: "t2", input: "-3", expected: "9", en: "Square a negative number", fr: "Mettre un nombre négatif au carré" },
  ];

  const STARTER = "def solution(x):\n    print('running')\n    return x\n";
  const SOLUTION = "def solution(x):\n    print('running')\n    return x * x\n";

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === "1") return Promise.resolve();
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(src)), { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        script.dataset.loaded = "1";
        resolve();
      };
      script.onerror = () => reject(new Error(src));
      document.head.appendChild(script);
    });
  }

  class Playground {
    constructor(root) {
      this.root = root;
      this.locale = "en";
      this.hintIndex = 0;
      this.editor = null;
      this.pyodide = null;
      this.ready = false;
      this.intentText = "";
      this.questionText = "";
      this.reviewData = null;
      this.listening = false;
      this.recognition = null;
      this.render();
      this.boot();
    }

    text() {
      return COPY[this.locale];
    }

    render() {
      const kept = this._draft != null ? this._draft : (this.editor ? this.editor.getValue() : null);
      const intentBox = this.root.querySelector("#intent-input");
      const questionBox = this.root.querySelector("#code-question");
      if (intentBox) this.intentText = intentBox.value;
      if (questionBox) this.questionText = questionBox.value;
      this._draft = null;
      this.editor = null;
      const t = this.text();
      const tests = TESTS.map((item) => `
        <li class="gc-code-test" id="test-${item.id}">
          <span>${item[this.locale]} <code>${item.input} → ${item.expected}</code></span>
          <span class="gc-code-badge" id="badge-${item.id}">${t.notRun}</span>
        </li>`).join("");
      this.root.innerHTML = `
        <div class="gc-code">
          <div class="gc-code-head">
            <div>
              <p class="gc-code-kicker">${t.kicker}</p>
              <h1>${t.title}</h1>
              <p class="gc-code-blurb">${t.blurb}</p>
              <p class="gc-code-task">${t.task}</p>
            </div>
            <div class="gc-code-langs">
              <button type="button" id="gandal-code-en" class="${this.locale === "en" ? "is-on" : ""}">English</button>
              <button type="button" id="gandal-code-fr" class="${this.locale === "fr" ? "is-on" : ""}">Français</button>
            </div>
          </div>
          <div class="gc-code-layout">
            <div class="gc-code-editor-wrap">
              <section class="gc-code-intent" id="gandal-code-intent">
                <label for="intent-input">${t.intentLabel}</label>
                <textarea id="intent-input" placeholder="${t.intentPlaceholder}"></textarea>
                <label for="code-question">${t.questionLabel}</label>
                <textarea id="code-question" placeholder="${t.questionPlaceholder}"></textarea>
                <div class="gc-code-actions">
                  <button type="button" id="intent-check">${t.check}</button>
                  <button type="button" id="code-mic" aria-label="${t.mic}">${t.mic}</button>
                  <span class="gc-code-status" id="code-mic-status"></span>
                </div>
              </section>
              <textarea id="code-input" aria-label="Python editor"></textarea>
              <div class="gc-code-actions">
                <button type="button" id="run-btn" disabled>${t.run}</button>
                <button type="button" id="hint-btn">${t.hint}</button>
                <span class="gc-code-status" id="status">${t.loading}</span>
              </div>
            </div>
            <div>
              <section class="gc-code-panel" id="gandal-code-review" hidden></section>
              <section class="gc-code-panel">
                <h2>${t.output}</h2>
                <pre id="output"></pre>
              </section>
              <section class="gc-code-panel">
                <h2>${t.tests}</h2>
                <ul class="gc-code-tests">${tests}</ul>
              </section>
              <section class="gc-code-panel" id="hint-panel">
                <h2>${t.hint}</h2>
                <div id="hints"></div>
                <pre id="solution" hidden></pre>
              </section>
            </div>
          </div>
        </div>`;
      this.root.querySelector("#gandal-code-en").onclick = () => this.setLocale("en");
      this.root.querySelector("#gandal-code-fr").onclick = () => this.setLocale("fr");
      this.root.querySelector("#run-btn").onclick = () => this.runCode();
      this.root.querySelector("#hint-btn").onclick = () => this.revealHint();
      this.root.querySelector("#intent-check").onclick = () => this.askGandho();
      this.root.querySelector("#code-mic").onclick = () => this.toggleMic();
      this.root.querySelector("#intent-input").value = this.intentText || "";
      this.root.querySelector("#code-question").value = this.questionText || "";
      this.root.querySelector("#code-input").value = kept || STARTER;
      this.attachEditor(kept || STARTER);
      this.paintHints();
      if (this.reviewData) this.paintReview(this.reviewData);
      const run = this.root.querySelector("#run-btn");
      run.disabled = !this.ready;
      this.root.querySelector("#status").textContent = this.ready ? t.ready : t.loading;
    }

    setLocale(locale) {
      if (locale !== "en" && locale !== "fr") locale = "en";
      this._draft = this.editor ? this.editor.getValue() : STARTER;
      this.locale = locale;
      this.render();
    }

    attachEditor(value) {
      const next = value || STARTER;
      if (this.editor) {
        this.editor.setValue(next);
        return;
      }
      const area = this.root.querySelector("#code-input");
      if (!area || !window.CodeMirror) {
        if (area) area.value = next;
        return;
      }
      this.editor = window.CodeMirror.fromTextArea(area, {
        mode: "python",
        theme: "material-darker",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
      });
      this.editor.setValue(next);
    }

    paintReview(data) {
      this.reviewData = data || null;
      const box = this.root.querySelector("#gandal-code-review");
      if (!box) return;
      box.hidden = false;
      box.replaceChildren();
      const t = this.text();
      const title = document.createElement("h2");
      title.textContent = t.gandho;
      box.appendChild(title);
      const hasParts = data && (data.right || data.wrong || data.how || data.answer);
      if (!hasParts) {
        const note = document.createElement("p");
        note.id = "review-message";
        note.textContent = (data && data.message) || t.reviewFailed;
        box.appendChild(note);
        return;
      }
      const add = (id, label, value) => {
        const line = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = label;
        line.appendChild(strong);
        const span = document.createElement("span");
        span.id = id;
        span.textContent = value ? ` ${value}` : "";
        line.appendChild(span);
        box.appendChild(line);
      };
      add("review-right", t.right, data.right || "");
      add("review-wrong", t.wrong, data.wrong || "");
      add("review-how", t.how, data.how || "");
      if (data.answer) {
        const answer = document.createElement("p");
        answer.id = "review-answer";
        answer.textContent = data.answer;
        box.appendChild(answer);
      }
    }

    currentCode() {
      if (this.editor) return this.editor.getValue();
      const area = this.root.querySelector("#code-input");
      return area ? area.value : "";
    }

    async askGandho() {
      const t = this.text();
      const intentEl = this.root.querySelector("#intent-input");
      const questionEl = this.root.querySelector("#code-question");
      const intent = intentEl ? intentEl.value.trim() : "";
      const question = questionEl ? questionEl.value.trim() : "";
      this.intentText = intent;
      this.questionText = question;
      const status = this.root.querySelector("#code-mic-status");
      if (!intent && !question) {
        this.paintReview({ success: false, available: true, message: t.needIntent });
        return;
      }
      if (status) status.textContent = t.checking;
      try {
        const resp = await fetch("/api/gandal_code/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent,
            code: this.currentCode(),
            question,
            locale: this.locale,
          }),
        });
        const data = await resp.json();
        this.paintReview(data);
      } catch (err) {
        this.paintReview({ success: false, available: false, message: t.reviewFailed });
      } finally {
        if (status && status.textContent === t.checking) status.textContent = "";
      }
    }

    toggleMic() {
      const t = this.text();
      const status = this.root.querySelector("#code-mic-status");
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        if (status) status.textContent = t.micMissing;
        return;
      }
      if (this.listening && this.recognition) {
        this.recognition.stop();
        return;
      }
      const rec = new SpeechRec();
      this.recognition = rec;
      rec.lang = this.locale === "fr" ? "fr-FR" : "en-US";
      rec.continuous = false;
      rec.interimResults = true;
      rec.onstart = () => {
        this.listening = true;
        const btn = this.root.querySelector("#code-mic");
        if (btn) btn.classList.add("is-on");
        if (status) status.textContent = t.micOn;
      };
      rec.onresult = (event) => {
        let finalText = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const chunk = event.results[i][0].transcript || "";
          if (event.results[i].isFinal) finalText += chunk;
          else interim += chunk;
        }
        const box = this.root.querySelector("#code-question");
        const shown = (finalText || interim).trim();
        if (box && shown) {
          box.value = shown;
          this.questionText = shown;
        }
        if (finalText.trim()) this.askGandho();
      };
      rec.onerror = () => {
        this.listening = false;
        const btn = this.root.querySelector("#code-mic");
        if (btn) btn.classList.remove("is-on");
        if (status) status.textContent = t.micError;
      };
      rec.onend = () => {
        this.listening = false;
        const btn = this.root.querySelector("#code-mic");
        if (btn) btn.classList.remove("is-on");
      };
      try {
        rec.start();
      } catch (err) {
        this.listening = false;
        if (status) status.textContent = t.micError;
      }
    }

    paintHints() {
      const t = this.text();
      const box = this.root.querySelector("#hints");
      if (!box) return;
      box.innerHTML = "";
      for (let i = 0; i < this.hintIndex && i < t.hints.length; i += 1) {
        const line = document.createElement("p");
        line.className = "gc-code-hint";
        line.id = `hint-${i + 1}`;
        line.textContent = t.hints[i];
        box.appendChild(line);
      }
      const solution = this.root.querySelector("#solution");
      const button = this.root.querySelector("#hint-btn");
      if (this.hintIndex > t.hints.length) {
        solution.hidden = false;
        solution.textContent = `${t.solutionLabel}\n${SOLUTION}`;
        button.disabled = true;
      } else if (this.hintIndex === t.hints.length) {
        button.textContent = t.showSolution;
      } else {
        button.textContent = t.hint;
      }
    }

    revealHint() {
      const t = this.text();
      if (this.hintIndex > t.hints.length) return;
      this.hintIndex += 1;
      this.paintHints();
    }

    async boot() {
      const t = this.text();
      try {
        loadCss(CM_CSS);
        loadCss(CM_THEME);
        await loadScript(CM_JS);
        await loadScript(CM_PY);
        const area = this.root.querySelector("#code-input");
        const current = this.editor ? this.editor.getValue() : (area ? area.value : STARTER);
        this.attachEditor(current || STARTER);
        await loadScript(PYODIDE);
        this.pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
        this.ready = true;
        const run = this.root.querySelector("#run-btn");
        const status = this.root.querySelector("#status");
        if (run) run.disabled = false;
        if (status) status.textContent = this.text().ready;
      } catch (err) {
        const status = this.root.querySelector("#status");
        if (status) status.textContent = t.failed;
        console.warn("[GANDAL CODE]", err);
      }
    }

    async runCode() {
      if (!this.pyodide) return;
      const t = this.text();
      const run = this.root.querySelector("#run-btn");
      const output = this.root.querySelector("#output");
      const status = this.root.querySelector("#status");
      run.disabled = true;
      status.textContent = t.running;
      const code = this.editor ? this.editor.getValue() : this.root.querySelector("#code-input").value;
      try {
        this.pyodide.globals.set("user_code", code);
        this.pyodide.globals.set("cases_json", JSON.stringify(TESTS.map((item) => ({
          id: item.id,
          input: item.input,
          expected: item.expected,
        }))));
        const raw = await this.pyodide.runPythonAsync(`
import sys, io, json
_buf = io.StringIO()
sys.stdout = _buf
_ns = {}
_err = ""
try:
    exec(user_code, _ns)
except Exception as exc:
    _err = str(exc)
_results = []
for _case in json.loads(cases_json):
    if "solution" not in _ns:
        _results.append({"id": _case["id"], "ok": False, "got": "solution is missing"})
        continue
    try:
        _value = eval(compile(_case["input"], "<test>", "eval"), {"__builtins__": {}}, {})
        _got = _ns["solution"](_value)
        _results.append({"id": _case["id"], "ok": str(_got) == str(_case["expected"]), "got": str(_got)})
    except Exception as exc:
        _results.append({"id": _case["id"], "ok": False, "got": str(exc)})
_printed = _buf.getvalue()
json.dumps({"output": _printed, "error": _err, "results": _results})
`);
        const data = JSON.parse(raw);
        output.textContent = data.error ? `${t.error}: ${data.error}` : (data.output || "");
        for (const result of data.results) {
          const badge = this.root.querySelector(`#badge-${result.id}`);
          if (!badge) continue;
          const got = result.got === "solution is missing" ? t.missing : result.got;
          badge.textContent = result.ok ? t.pass : `${t.fail} · ${t.got} ${got}`;
          badge.classList.toggle("is-pass", result.ok);
          badge.classList.toggle("is-fail", !result.ok);
        }
        status.textContent = t.ready;
      } catch (err) {
        output.textContent = `${t.error}: ${err && err.message ? err.message : err}`;
        status.textContent = t.ready;
      } finally {
        run.disabled = false;
      }
    }
  }

  window.GandalCode = {
    _app: null,
    mount(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      if (this._app && this._app.root === el) return this._app;
      this._app = new Playground(el);
      return this._app;
    },
  };
})();
