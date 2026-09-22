/**
 * Gandal Classroom player.
 * Mounted by the Space tab bar. Does not own tracks, Quiz me, or live voice.
 */
(function () {
  const COPY = {
    en: {
      topic: "Topic",
      placeholder: "Photosynthesis, fractions, the water cycle...",
      language: "Language",
      english: "English",
      french: "French",
      generate: "Generate classroom",
      working: "Generating...",
      teacher: "Teacher",
      guide: "Guide the page",
      stop: "Stop",
      next: "Next cue",
      slides: "Slides",
      viz3d: "3D view",
      simulation: "Simulation",
      game: "Game",
      mindmap: "Mind map",
      code: "Code",
      start: "Start",
      reset: "Reset",
      run: "Run",
      reveal: "Reveal",
      score: "Score",
      round: "Round",
      strong: "strong absorption",
      weak: "weak absorption",
      mid: "partial absorption",
      result: "Result",
      idle: "Type a topic. The classroom builds slides, a 3D view, a simulation, a game, a mind map, and code.",
      empty: "Type a topic in English or French.",
      operated: "Teacher operated the page",
      generated: "Generated with",
      kit: "Scene stage is local. Generation needs a model.",
      output: "Output",
      focus: "Focus",
    },
    fr: {
      topic: "Sujet",
      placeholder: "La photosynthèse, les fractions, le cycle de l'eau...",
      language: "Langue",
      english: "Anglais",
      french: "Français",
      generate: "Générer la classe",
      working: "Génération...",
      teacher: "Enseignant",
      guide: "Guider la page",
      stop: "Arrêter",
      next: "Indice suivant",
      slides: "Diapositives",
      viz3d: "Vue 3D",
      simulation: "Simulation",
      game: "Jeu",
      mindmap: "Carte mentale",
      code: "Code",
      start: "Démarrer",
      reset: "Recommencer",
      run: "Exécuter",
      reveal: "Révéler",
      score: "Score",
      round: "Manche",
      strong: "forte absorption",
      weak: "faible absorption",
      mid: "absorption partielle",
      result: "Résultat",
      idle: "Écrivez un sujet. La classe construit des diapositives, une vue 3D, une simulation, un jeu, une carte mentale et du code.",
      empty: "Écrivez un sujet en anglais ou en français.",
      operated: "L'enseignant a agi sur la page",
      generated: "Généré avec",
      kit: "La scène locale est prête. La génération demande un modèle.",
      output: "Sortie",
      focus: "Focus",
    },
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[m]));
  }

  function absorb(nm) {
    const blue = Math.exp(-Math.pow((nm - 430) / 40, 2));
    const red = Math.exp(-Math.pow((nm - 662) / 45, 2));
    return Math.min(1, blue * 0.95 + red);
  }

  function waveColor(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
    if (nm > 700) f = 0.35 + 0.65 * (750 - nm) / 50;
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n * f * 255)));
    return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
  }

  class ClassroomApp {
    constructor(root) {
      this.root = root;
      this.locale = "en";
      try {
        const saved = localStorage.getItem("gandal-classroom-locale");
        if (saved === "fr" || saved === "en") this.locale = saved;
      } catch (e) { /* ignore */ }
      this.lesson = null;
      this.notice = { kind: "ok", text: "" };
      this.sceneId = "slides";
      this.slideIndex = 0;
      this.spotlight = 0;
      this.controlValue = 450;
      this.simRunning = false;
      this.yaw = 0.4;
      this.spinning = true;
      this.focusId = "";
      this.round = 0;
      this.score = 0;
      this.picked = -1;
      this.revealed = false;
      this.cue = 0;
      this.guiding = false;
      this.opText = "";
      this.say = "";
      this.busy = false;
      this._timer = null;
      this._raf = 0;
      this._photons = [];
    }

    t(key) {
      return (COPY[this.locale] || COPY.en)[key] || COPY.en[key] || key;
    }

    start() {
      this.render();
      this.refreshStatus();
    }

    destroy() {
      this.stopGuide();
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    scene() {
      const scenes = (this.lesson && this.lesson.scenes) || [];
      return scenes.find((s) => s.id === this.sceneId) || scenes[0] || null;
    }

    async refreshStatus() {
      try {
        const resp = await fetch("/api/gandal_classroom/status");
        const data = await resp.json();
        if (!data.local_edge?.available && !data.cloud_fallback?.available && data.error) {
          this.notice = { kind: "warn", text: data.error };
          this.render();
        }
      } catch (e) {
        this.notice = { kind: "warn", text: this.t("idle") };
        this.render();
      }
    }

    async generate() {
      const input = this.root.querySelector("#gcTopic");
      const topic = (input && input.value || "").trim();
      if (!topic) {
        this.notice = { kind: "warn", text: this.t("empty") };
        this.render();
        return;
      }
      this.busy = true;
      this.render();
      try {
        const resp = await fetch("/api/gandal_classroom/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, locale: this.locale }),
        });
        const data = await resp.json();
        if (data.lesson) {
          this.loadLesson(data.lesson);
        }
        if (data.success) {
          this.notice = { kind: "ok", text: `${this.t("generated")} ${data.provider}.` };
        } else {
          this.notice = { kind: "warn", text: data.error || this.t("kit") };
        }
      } catch (e) {
        this.notice = { kind: "warn", text: String(e.message || e) };
      }
      this.busy = false;
      this.render();
    }

    loadLesson(lesson) {
      this.lesson = lesson;
      this.sceneId = "simulation";
      const sim = (lesson.scenes || []).find((s) => s.type === "simulation");
      this.controlValue = sim && sim.control ? Number(sim.control.value) : 40;
      this.slideIndex = 0;
      this.spotlight = 0;
      this.simRunning = false;
      this.round = 0;
      this.score = 0;
      this.picked = -1;
      this.revealed = false;
      this.cue = 0;
      this.focusId = "";
      this.say = (lesson.teacher && lesson.teacher[0] && lesson.teacher[0].say) || "";
      this.opText = "";
      this._photons = [];
    }

    setLocale(locale) {
      this.locale = locale === "fr" ? "fr" : "en";
      try { localStorage.setItem("gandal-classroom-locale", this.locale); } catch (e) { /* ignore */ }
      this.root.setAttribute("lang", this.locale === "fr" ? "fr" : "en");
      this.render();
    }

    selectScene(id) {
      this.sceneId = id;
      this.render();
    }

    stopGuide() {
      this.guiding = false;
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }

    guide() {
      if (!this.lesson || !this.lesson.teacher || !this.lesson.teacher.length) return;
      this.guiding = true;
      this.cue = 0;
      this.playCue();
    }

    nextCue() {
      if (!this.lesson || !this.lesson.teacher) return;
      this.cue = (this.cue + 1) % this.lesson.teacher.length;
      this.playCue();
    }

    playCue() {
      const steps = (this.lesson && this.lesson.teacher) || [];
      const step = steps[this.cue];
      if (!step) return;
      this.sceneId = step.scene;
      this.say = step.say || "";
      this.applyActions(step.actions || []);
      this.render();
      this.speak(this.say);
      if (this.guiding) {
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          if (!this.guiding) return;
          this.cue += 1;
          if (this.cue >= steps.length) {
            this.stopGuide();
            this.render();
            return;
          }
          this.playCue();
        }, 4200);
      }
    }

    speak(text) {
      if (!text || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = this.locale === "fr" ? "fr-FR" : "en-US";
        window.speechSynthesis.speak(utter);
      } catch (e) { /* browser speech is optional */ }
    }

    applyActions(actions) {
      const notes = [];
      actions.forEach((act) => {
        if (!act || !act.op) return;
        if (act.op === "spotlight") this.spotlight = Number(act.index) || 0;
        if (act.op === "goto_slide") {
          this.slideIndex = Number(act.index) || 0;
          this.sceneId = "slides";
        }
        if (act.op === "spin") {
          this.spinning = true;
          this.sceneId = "viz3d";
          notes.push("spin");
        }
        if (act.op === "set_control") {
          this.controlValue = Number(act.value);
          this.sceneId = "simulation";
          notes.push(String(act.value));
        }
        if (act.op === "start") {
          this.simRunning = true;
          this.sceneId = "simulation";
          notes.push("start");
        }
        if (act.op === "reset") {
          this.simRunning = false;
          const sim = (this.lesson.scenes || []).find((s) => s.type === "simulation");
          if (sim && sim.control) this.controlValue = Number(sim.control.value);
          notes.push("reset");
        }
        if (act.op === "focus") {
          this.focusId = act.id || "";
          this.sceneId = "mindmap";
          notes.push(this.focusId);
        }
        if (act.op === "reveal") {
          this.revealed = true;
          this.sceneId = "game";
          notes.push("reveal");
        }
        if (act.op === "run_code") {
          this.sceneId = "code";
          notes.push("run");
          setTimeout(() => this.runCode(), 30);
        }
      });
      this.opText = notes.length ? `${this.t("operated")}: ${notes.join(", ")}` : "";
    }

    render() {
      const topicValue = this.root.querySelector("#gcTopic");
      const kept = topicValue ? topicValue.value : "";
      const lesson = this.lesson;
      const scene = this.scene();
      const rail = ["slides", "viz3d", "simulation", "game", "mindmap", "code"].map((id) => {
        const on = scene && (scene.id === id || scene.type === id);
        return `<button type="button" data-scene="${id}" class="${on ? "is-on" : ""}">${esc(this.t(id))}</button>`;
      }).join("");
      const banner = this.notice.text
        ? `<div class="gc-banner ${this.notice.kind === "warn" ? "warn" : "ok"}">${esc(this.notice.text)}</div>`
        : `<div class="gc-banner ok">${esc(this.t("idle"))}</div>`;
      this.root.innerHTML = `
        <div class="gc-root" lang="${this.locale === "fr" ? "fr" : "en"}">
          <form class="gc-composer" id="gcForm">
            <label for="gcTopic">${esc(this.t("topic"))}</label>
            <input class="gc-topic" id="gcTopic" name="topic" autocomplete="off" placeholder="${esc(this.t("placeholder"))}" value="${esc(kept)}" />
            <label for="gcLocale">${esc(this.t("language"))}</label>
            <select class="gc-locale" id="gcLocale" name="locale">
              <option value="en"${this.locale === "en" ? " selected" : ""}>${esc(this.t("english"))}</option>
              <option value="fr"${this.locale === "fr" ? " selected" : ""}>${esc(this.t("french"))}</option>
            </select>
            <button class="gc-generate" type="submit" ${this.busy ? "disabled" : ""}>${esc(this.busy ? this.t("working") : this.t("generate"))}</button>
          </form>
          ${banner}
          <div class="gc-rail" id="gcRail">${rail}</div>
          <div class="gc-body">
            <section class="gc-stage" id="gcStage">${lesson ? this.stageHtml(scene) : `<p class="gc-caption">${esc(this.t("idle"))}</p>`}</section>
            <aside class="gc-teacher">
              <div class="gc-kicker">${esc(this.t("teacher"))}</div>
              <h2>${esc((lesson && lesson.title) || "Classroom")}</h2>
              <p class="gc-say" id="gcSay">${esc(this.say || this.t("idle"))}</p>
              <p class="gc-op" id="gcOp">${esc(this.opText)}</p>
              <div class="gc-teacher-actions">
                <button type="button" class="gc-btn" id="gcGuide" ${lesson ? "" : "disabled"}>${esc(this.guiding ? this.t("stop") : this.t("guide"))}</button>
                <button type="button" class="gc-btn" id="gcNext" ${lesson ? "" : "disabled"}>${esc(this.t("next"))}</button>
              </div>
            </aside>
          </div>
        </div>`;
      this.bind();
      this.afterRender(scene);
    }

    stageHtml(scene) {
      if (!scene) return "";
      if (scene.type === "slides") return this.slidesHtml(scene);
      if (scene.type === "viz3d") return this.vizHtml(scene);
      if (scene.type === "simulation") return this.simHtml(scene);
      if (scene.type === "game") return this.gameHtml(scene);
      if (scene.type === "mindmap") return this.mapHtml(scene);
      if (scene.type === "code") return this.codeHtml(scene);
      return "";
    }

    slidesHtml(scene) {
      const slides = scene.slides || [];
      const slide = slides[Math.min(this.slideIndex, slides.length - 1)] || { title: "", bullets: [] };
      const bullets = (slide.bullets || []).map((b, i) =>
        `<p class="gc-slide-bullet${i === this.spotlight ? " is-spot" : ""}">${esc(b)}</p>`
      ).join("");
      return `
        <div class="gc-kicker">${esc(scene.title || this.t("slides"))} · ${this.slideIndex + 1}/${slides.length || 1}</div>
        <h2>${esc(slide.title || "")}</h2>
        ${bullets}
        <div class="gc-controls">
          <button type="button" class="gc-btn" data-slide="-1">←</button>
          <button type="button" class="gc-btn" data-slide="1">→</button>
        </div>`;
    }

    vizHtml(scene) {
      return `
        <div class="gc-kicker">${esc(scene.title || this.t("viz3d"))}</div>
        <canvas class="gc-canvas" id="gcCanvas" width="900" height="520"></canvas>
        <p class="gc-caption">${esc(scene.caption || "")}</p>`;
    }

    simHtml(scene) {
      const control = scene.control || { min: 0, max: 100, value: 40, unit: "", label: "" };
      const start = scene.start_label || this.t("start");
      const reset = scene.reset_label || this.t("reset");
      return `
        <div class="gc-kicker">${esc(scene.title || this.t("simulation"))}</div>
        <canvas class="gc-canvas" id="gcCanvas" width="900" height="520"></canvas>
        <p class="gc-caption">${esc(scene.caption || "")}</p>
        <div class="gc-controls">
          <label>${esc(control.label || "")}</label>
          <input id="gcSlider" type="range" min="${Number(control.min)}" max="${Number(control.max)}" value="${Number(this.controlValue)}" />
          <span class="gc-readout" id="gcReadout"></span>
          <button type="button" class="gc-btn" id="gcStart">${esc(this.simRunning ? this.t("stop") : start)}</button>
          <button type="button" class="gc-btn" id="gcReset">${esc(reset)}</button>
        </div>`;
    }

    gameHtml(scene) {
      const rounds = scene.rounds || [];
      const round = rounds[this.round] || { prompt: "", choices: [] };
      const choices = (round.choices || []).map((c, i) => {
        let cls = "gc-choice";
        if (this.picked === i || this.revealed) {
          if (c.correct) cls += " is-right";
          else if (this.picked === i) cls += " is-wrong";
        }
        return `<button type="button" class="${cls}" data-choice="${i}">${esc(c.label)}</button>`;
      }).join("");
      return `
        <div class="gc-kicker">${esc(this.t("game"))} · ${esc(this.t("round"))} ${this.round + 1}/${rounds.length || 1} · ${esc(this.t("score"))} ${this.score}</div>
        <h2>${esc(round.prompt || "")}</h2>
        ${choices}
        <div class="gc-controls">
          <button type="button" class="gc-btn" id="gcReveal">${esc(this.t("reveal"))}</button>
          <button type="button" class="gc-btn" id="gcRoundNext">→</button>
        </div>`;
    }

    mapHtml(scene) {
      const nodes = scene.nodes || [];
      const cx = 320, cy = 200;
      const lines = nodes.map((n, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(nodes.length, 1);
        const x = cx + Math.cos(a) * 210;
        const y = cy + Math.sin(a) * 130;
        const on = this.focusId === n.id;
        return { n, x, y, on };
      });
      const svgLines = lines.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${p.on ? "#e8b86d" : "#475569"}" stroke-width="${p.on ? 3 : 1.5}"></line>`).join("");
      const svgNodes = lines.map((p) => `
        <g data-node="${esc(p.n.id)}" style="cursor:pointer">
          <circle cx="${p.x}" cy="${p.y}" r="${p.on ? 46 : 40}" fill="${p.on ? "#3b2a12" : "#182033"}" stroke="${p.on ? "#e8b86d" : "#7c93e6"}" stroke-width="2"></circle>
          <text x="${p.x}" y="${p.y + 4}" text-anchor="middle">${esc(p.n.label)}</text>
        </g>`).join("");
      const focused = nodes.find((n) => n.id === this.focusId);
      return `
        <div class="gc-kicker">${esc(scene.title || this.t("mindmap"))}</div>
        <svg class="gc-map" viewBox="0 0 640 400">
          ${svgLines}
          <circle cx="${cx}" cy="${cy}" r="54" fill="#241c10" stroke="#e8b86d" stroke-width="2"></circle>
          <text x="${cx}" y="${cy + 4}" text-anchor="middle">${esc(scene.center || "")}</text>
          ${svgNodes}
        </svg>
        <p class="gc-caption">${esc(focused ? focused.detail : (scene.center || ""))}</p>`;
    }

    codeHtml(scene) {
      if (scene.html) {
        return `
          <div class="gc-kicker">${esc(scene.title || this.t("code"))}</div>
          <iframe class="gc-html-frame" id="gcHtml" sandbox="allow-scripts"></iframe>
          <p class="gc-caption">${esc(scene.task || "")}</p>`;
      }
      return `
        <div class="gc-kicker">${esc(scene.title || this.t("code"))}</div>
        <p class="gc-caption">${esc(scene.task || "")}</p>
        <textarea class="gc-code" id="gcCode" spellcheck="false">${esc(scene.starter || "")}</textarea>
        <div class="gc-controls">
          <button type="button" class="gc-btn" id="gcRun">${esc(this.t("run"))}</button>
        </div>
        <div class="gc-kicker">${esc(this.t("output"))}</div>
        <pre class="gc-output" id="gcOutput"></pre>
        <iframe id="gcCodeFrame" sandbox="allow-scripts" hidden></iframe>`;
    }

    bind() {
      const form = this.root.querySelector("#gcForm");
      if (form) {
        form.addEventListener("submit", (ev) => {
          ev.preventDefault();
          this.generate();
        });
      }
      const locale = this.root.querySelector("#gcLocale");
      if (locale) locale.addEventListener("change", () => this.setLocale(locale.value));
      this.root.querySelectorAll("[data-scene]").forEach((btn) => {
        btn.addEventListener("click", () => this.selectScene(btn.getAttribute("data-scene")));
      });
      const guide = this.root.querySelector("#gcGuide");
      if (guide) {
        guide.addEventListener("click", () => {
          if (this.guiding) {
            this.stopGuide();
            this.render();
          } else {
            this.guide();
          }
        });
      }
      const next = this.root.querySelector("#gcNext");
      if (next) next.addEventListener("click", () => { this.stopGuide(); this.nextCue(); });
      this.root.querySelectorAll("[data-slide]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const scene = this.scene();
          const count = (scene && scene.slides && scene.slides.length) || 1;
          this.slideIndex = (this.slideIndex + Number(btn.getAttribute("data-slide")) + count) % count;
          this.spotlight = 0;
          this.render();
        });
      });
      const slider = this.root.querySelector("#gcSlider");
      if (slider) {
        slider.addEventListener("input", () => {
          this.controlValue = Number(slider.value);
          this.paint();
        });
      }
      const start = this.root.querySelector("#gcStart");
      if (start) {
        start.addEventListener("click", () => {
          this.simRunning = !this.simRunning;
          this.render();
        });
      }
      const reset = this.root.querySelector("#gcReset");
      if (reset) {
        reset.addEventListener("click", () => {
          const sim = this.scene();
          this.simRunning = false;
          if (sim && sim.control) this.controlValue = Number(sim.control.value);
          this._photons = [];
          this.render();
        });
      }
      this.root.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => this.pickChoice(Number(btn.getAttribute("data-choice"))));
      });
      const reveal = this.root.querySelector("#gcReveal");
      if (reveal) reveal.addEventListener("click", () => { this.revealed = true; this.render(); });
      const roundNext = this.root.querySelector("#gcRoundNext");
      if (roundNext) {
        roundNext.addEventListener("click", () => {
          const rounds = (this.scene() && this.scene().rounds) || [];
          this.round = (this.round + 1) % Math.max(rounds.length, 1);
          this.picked = -1;
          this.revealed = false;
          this.render();
        });
      }
      this.root.querySelectorAll("[data-node]").forEach((node) => {
        node.addEventListener("click", () => {
          this.focusId = node.getAttribute("data-node");
          this.render();
        });
      });
      const run = this.root.querySelector("#gcRun");
      if (run) run.addEventListener("click", () => this.runCode());
    }

    pickChoice(index) {
      if (this.picked >= 0) return;
      const round = ((this.scene() && this.scene().rounds) || [])[this.round];
      if (!round) return;
      this.picked = index;
      if (round.choices[index] && round.choices[index].correct) this.score += 1;
      this.render();
    }

    afterRender(scene) {
      if (this._raf) cancelAnimationFrame(this._raf);
      if (!scene) return;
      if (scene.type === "viz3d" || scene.type === "simulation") this.paint();
      if (scene.type === "code" && scene.html) {
        const frame = this.root.querySelector("#gcHtml");
        if (frame) frame.srcdoc = scene.html;
      }
      if (scene.type === "code" && !scene.html) this.ensureCodeFrame();
    }

    paint() {
      const canvas = this.root.querySelector("#gcCanvas");
      const scene = this.scene();
      if (!canvas || !scene) return;
      const ctx = canvas.getContext("2d");
      if (scene.type === "viz3d") this.draw3d(ctx, canvas, scene);
      else this.drawSim(ctx, canvas, scene);
      this._raf = requestAnimationFrame(() => this.paint());
    }

    draw3d(ctx, canvas, scene) {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, w, h);
      if (this.spinning) this.yaw += 0.008;
      const objects = scene.objects || [];
      const projected = objects.map((o) => {
        const orbit = Number(o.orbit) || 0;
        const phase = Number(o.phase) || 0;
        const x = Math.cos(this.yaw + phase) * orbit;
        const z = Math.sin(this.yaw + phase) * orbit;
        const scale = 220 / (z + 6.2);
        return {
          o,
          sx: w / 2 + x * scale * 1.3,
          sy: h / 2,
          r: Math.max(8, (Number(o.radius) || 0.4) * scale * 28),
          z,
        };
      }).sort((a, b) => a.z - b.z);
      projected.forEach((p) => {
        const g = ctx.createRadialGradient(p.sx - p.r * 0.3, p.sy - p.r * 0.35, p.r * 0.1, p.sx, p.sy, p.r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.25, p.o.color || "#94a3b8");
        g.addColorStop(1, "#05070d");
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.font = "16px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.o.label || "", p.sx, p.sy + p.r + 18);
      });
    }

    drawSim(ctx, canvas, scene) {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, w, h);
      const value = Number(this.controlValue);
      if (scene.kind === "wavelength") this.drawWavelength(ctx, w, h, value);
      else this.drawIntensity(ctx, w, h, value);
      const readout = this.root.querySelector("#gcReadout");
      if (readout) {
        const unit = (scene.control && scene.control.unit) || "";
        if (scene.kind === "wavelength") {
          const a = absorb(value);
          const word = a > 0.55 ? this.t("strong") : a > 0.22 ? this.t("mid") : this.t("weak");
          readout.textContent = `${Math.round(value)} ${unit} — ${word}`;
        } else {
          readout.textContent = `${Math.round(value)} ${unit}`;
        }
      }
    }

    drawWavelength(ctx, w, h, nm) {
      const barY = h - 70;
      for (let x = 40; x < w - 40; x += 1) {
        const n = 380 + ((x - 40) / (w - 80)) * 370;
        ctx.fillStyle = waveColor(n);
        ctx.fillRect(x, barY, 1, 28);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      for (let x = 40; x < w - 40; x += 2) {
        const n = 380 + ((x - 40) / (w - 80)) * 370;
        const y = barY - 16 - absorb(n) * 160;
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const mx = 40 + ((nm - 380) / 370) * (w - 80);
      ctx.strokeStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(mx, barY - 180);
      ctx.lineTo(mx, barY + 28);
      ctx.stroke();
      const leaf = absorb(nm);
      ctx.fillStyle = `rgba(${Math.round(40 + 80 * (1 - leaf))},${Math.round(140 + 80 * leaf)},70,0.95)`;
      ctx.beginPath();
      ctx.ellipse(w / 2, 120, 70, 42, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = waveColor(nm);
      if (this.simRunning) {
        if (this._photons.length < 14) {
          this._photons.push({ x: 30, y: 80 + Math.random() * 80, s: 1.5 + Math.random() * 2 });
        }
        this._photons.forEach((p) => { p.x += p.s * (0.4 + leaf); });
        this._photons = this._photons.filter((p) => p.x < w / 2);
        this._photons.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    drawIntensity(ctx, w, h, value) {
      const result = Math.round(Math.min(100, value * 0.85 + 8));
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(80, 80, 80, 280);
      ctx.fillRect(220, 80, 80, 280);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(80, 360 - value * 2.6, 80, value * 2.6);
      ctx.fillStyle = "#34d399";
      const rh = result * 2.6;
      ctx.fillRect(220, 360 - rh, 80, rh);
      if (this.simRunning) {
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(Date.now() / 180);
        ctx.fillStyle = "#e8b86d";
        ctx.fillRect(360, 200, 180, 16);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#f8fafc";
      ctx.font = "16px Segoe UI, sans-serif";
      ctx.fillText(String(Math.round(value)), 96, 390);
      ctx.fillText(this.t("result"), 220, 390);
    }

    ensureCodeFrame() {
      const frame = this.root.querySelector("#gcCodeFrame");
      if (!frame || frame.dataset.ready) return;
      frame.dataset.ready = "1";
      frame.srcdoc = `<!DOCTYPE html><html><body><script>
        window.addEventListener("message", function (ev) {
          var logs = [];
          var fake = { log: function () { logs.push(Array.prototype.join.call(arguments, " ")); } };
          try {
            var fn = new Function("console", (ev.data && ev.data.code) || "");
            fn(fake);
            parent.postMessage({ type: "classroom-code", ok: true, logs: logs }, "*");
          } catch (err) {
            parent.postMessage({ type: "classroom-code", ok: false, error: String(err) }, "*");
          }
        });
      </script></body></html>`;
      if (!this._onCode) {
        this._onCode = (ev) => {
          if (!ev.data || ev.data.type !== "classroom-code") return;
          const out = this.root.querySelector("#gcOutput");
          if (!out) return;
          out.textContent = ev.data.ok ? (ev.data.logs || []).join("\n") : ev.data.error;
        };
        window.addEventListener("message", this._onCode);
      }
    }

    runCode() {
      const frame = this.root.querySelector("#gcCodeFrame");
      const code = this.root.querySelector("#gcCode");
      if (!frame || !code) return;
      const send = () => frame.contentWindow && frame.contentWindow.postMessage({ code: code.value }, "*");
      if (frame.dataset.ready === "1") {
        send();
        return;
      }
      this.ensureCodeFrame();
      frame.addEventListener("load", () => send(), { once: true });
    }
  }

  function showFallback(el) {
    const app = new ClassroomApp(el);
    app.start();
    return app;
  }

  window.GandalClassroom = {
    _app: null,
    mount(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      if (this._app && this._app.root === el && el.querySelector("#gcPlayerFrame, #gcTopic")) return this._app;
      if (this._app && this._app.destroy) this._app.destroy();
      el.innerHTML = `
        <div class="gc-player">
          <p class="gc-player-status" id="gcPlayerStatus">Starting the classroom player...</p>
          <iframe id="gcPlayerFrame" title="Classroom" hidden></iframe>
        </div>`;
      const status = el.querySelector("#gcPlayerStatus");
      const frame = el.querySelector("#gcPlayerFrame");
      const arm = (url) => {
        frame.hidden = false;
        frame.src = url;
        if (status) status.hidden = true;
      };
      const poll = async (left) => {
        try {
          const resp = await fetch("/api/gandal_classroom/player");
          const data = await resp.json();
          if (data.ready && data.url) {
            arm(data.url);
            return;
          }
          if (status && data.detail) status.textContent = data.detail;
        } catch (err) {
          if (status) status.textContent = "The classroom player is not reachable.";
        }
        if (left <= 0) {
          if (status) status.textContent = "The classroom player did not start. Showing offline scenes.";
          this._app = showFallback(el);
          return;
        }
        setTimeout(() => poll(left - 1), 2000);
      };
      poll(180);
      this._app = { root: el, destroy() { if (frame) frame.src = "about:blank"; } };
      return this._app;
    },
  };
})();
