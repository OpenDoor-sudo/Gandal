'use client';

import { useEffect, useState } from 'react';
import { saveStageData } from '@/lib/utils/stage-storage';
import { db } from '@/lib/utils/database';
import { useSettingsStore } from '@/lib/store/settings';

const PROXY = 'http://127.0.0.1:8099/v1/chat/completions';

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}

function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function lessonTitle(topic: string, locale: 'en' | 'fr'): string {
  const stripped = topic
    .trim()
    .replace(/^(please\s+)?(teach me|teach us|explain|explique-moi|apprends-moi)\s+/i, '')
    .trim();
  const base = stripped || (locale === 'fr' ? 'Leçon' : 'Lesson');
  return base.slice(0, 80);
}

function isDerivatives(topic: string): boolean {
  const text = topic.toLowerCase();
  return text.includes('deriv') || text.includes('dériv') || text.includes('tangent') || text.includes('slope');
}

function widgetListener(): string {
  return `
    window.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data.type === 'SET_WIDGET_STATE' && data.state) {
        if (typeof window.__gandalSetState === 'function') window.__gandalSetState(data.state);
      }
      if (data.type === 'HIGHLIGHT_ELEMENT' && data.target) {
        const el = document.querySelector(data.target);
        if (!el) return;
        el.style.outline = '3px solid #e8b86d';
        el.style.outlineOffset = '4px';
      }
    });
  `;
}

function derivativeLab(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Derivative laboratory</title>
<style>
  body { margin: 0; font-family: Segoe UI, sans-serif; background: #07111f; color: #f8fafc; }
  main { padding: 16px; }
  canvas { width: 100%; height: 280px; background: #030712; border-radius: 12px; display: block; }
  input { width: min(420px, 80%); }
  #readout { font-size: 18px; }
</style></head><body><main>
  <h1 id="curve">Derivative of x squared</h1>
  <p id="readout">x = 1, slope = 2</p>
  <canvas id="plot" width="900" height="320"></canvas>
  <p><label>x <input id="x-slider" type="range" min="-3" max="3" step="0.1" value="1"></label></p>
</main>
<script>
  const slider = document.getElementById('x-slider');
  const canvas = document.getElementById('plot');
  const ctx = canvas.getContext('2d');
  function draw() {
    const x0 = Number(slider.value);
    const slope = 2 * x0;
    document.getElementById('readout').textContent = 'x = ' + x0.toFixed(1) + ', slope = ' + slope.toFixed(1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(40, 160); ctx.lineTo(860, 160); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(450, 20); ctx.lineTo(450, 300); ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let px = 40; px <= 860; px++) {
      const x = (px - 450) / 80;
      const y = 160 - x * x * 18;
      if (px === 40) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();
    const px = 450 + x0 * 80;
    const py = 160 - x0 * x0 * 18;
    const span = 80;
    const dy = -18 * slope * (span / 80);
    ctx.strokeStyle = '#e8b86d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px - span, py - dy);
    ctx.lineTo(px + span, py + dy);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1;
  }
  slider.oninput = draw;
  window.__gandalSetState = (state) => {
    if (state.x == null) return;
    slider.value = String(state.x);
    draw();
  };
  ${widgetListener()}
  draw();
</script></body></html>`;
}

function genericLab(title: string): string {
  const safe = esc(title);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${safe}</title>
<style>
  body { margin: 0; font-family: Segoe UI, sans-serif; background: #07111f; color: #f8fafc; }
  main { padding: 20px; }
  #focus { font-size: 28px; margin: 24px 0; }
  input { width: min(420px, 80%); }
</style></head><body><main>
  <h1 id="title">${safe}</h1>
  <p id="focus">Step 1. Name the idea.</p>
  <p><label>Step <input id="step" type="range" min="1" max="3" value="1"></label></p>
</main>
<script>
  const steps = ['Step 1. Name the idea.', 'Step 2. Change one part.', 'Step 3. Say what you see.'];
  const slider = document.getElementById('step');
  function draw() {
    document.getElementById('focus').textContent = steps[Number(slider.value) - 1];
  }
  slider.oninput = draw;
  window.__gandalSetState = (state) => {
    if (state.step == null) return;
    slider.value = String(state.step);
    draw();
  };
  ${widgetListener()}
  draw();
</script></body></html>`;
}

function orbitLab(title: string): string {
  const safe = esc(title);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>3D view</title>
<style>body{margin:0;background:#07111f;color:#fff;font-family:Segoe UI,sans-serif} h1{padding:16px 16px 0} canvas{width:100%;height:300px;background:#030712}</style>
</head><body>
  <h1 id="view">${safe}</h1>
  <canvas id="space" width="800" height="340"></canvas>
<script>
  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d');
  let angle = 0;
  function frame() {
    angle += 0.02;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(400, 170, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(400 + Math.cos(angle) * 140, 170 + Math.sin(angle) * 48, 14, 0, Math.PI * 2);
    ctx.fill();
    requestAnimationFrame(frame);
  }
  window.__gandalSetState = () => {};
  ${widgetListener()}
  frame();
</script></body></html>`;
}

function mindMap(title: string, locale: 'en' | 'fr'): string {
  const safe = esc(title.slice(0, 22));
  const a = locale === 'fr' ? 'Idée' : 'Idea';
  const b = locale === 'fr' ? 'Exemple' : 'Example';
  const c = locale === 'fr' ? 'Essai' : 'Try it';
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;background:#0f172a">
<svg id="map" viewBox="0 0 640 360" width="100%" height="360">
  <circle cx="320" cy="180" r="62" fill="#1c1408" stroke="#e8b86d" stroke-width="3"/>
  <text id="center" x="320" y="184" text-anchor="middle" fill="#fff" font-family="Segoe UI" font-size="16">${safe}</text>
  <circle cx="120" cy="70" r="40" fill="#182033" stroke="#7c93e6"/><text x="120" y="74" text-anchor="middle" fill="#fff" font-size="14">${a}</text>
  <circle cx="520" cy="70" r="40" fill="#182033" stroke="#7c93e6"/><text x="520" y="74" text-anchor="middle" fill="#fff" font-size="14">${b}</text>
  <circle cx="320" cy="300" r="40" fill="#182033" stroke="#7c93e6"/><text x="320" y="304" text-anchor="middle" fill="#fff" font-size="14">${c}</text>
</svg>
<script>window.__gandalSetState = () => {}; ${widgetListener()}</script>
</body></html>`;
}

function gameLab(title: string, locale: 'en' | 'fr', derivatives: boolean): string {
  const prompt = derivatives
    ? locale === 'fr'
      ? 'Quelle est la dérivée de x² ?'
      : 'What is the derivative of x squared?'
    : locale === 'fr'
      ? `Quelle est l'idée de ${esc(title)} ?`
      : `What should you do first with ${esc(title)}?`;
  const right = derivatives
    ? '2x'
    : locale === 'fr'
      ? "La nommer"
      : 'Name it';
  const wrong = derivatives ? 'x' : locale === 'fr' ? 'La sauter' : 'Skip it';
  const yes = locale === 'fr' ? 'Oui. Gandho montre la bonne réponse.' : 'Yes. Gandho is pointing at the right answer.';
  const no = locale === 'fr' ? 'Regarde encore le cours.' : 'Look back at the lesson.';
  return `<!DOCTYPE html><html lang="en"><body style="font-family:Segoe UI,sans-serif;background:#0f172a;color:#fff;padding:16px">
  <h1 id="prompt">${prompt}</h1>
  <button id="right" type="button">${esc(right)}</button>
  <button id="wrong" type="button">${esc(wrong)}</button>
  <p id="result"></p>
<script>
  document.getElementById('right').onclick = () => { document.getElementById('result').textContent = ${JSON.stringify(yes)}; };
  document.getElementById('wrong').onclick = () => { document.getElementById('result').textContent = ${JSON.stringify(no)}; };
  window.__gandalSetState = (state) => {
    if (state.choice === 'right') document.getElementById('right').click();
  };
  ${widgetListener()}
</script></body></html>`;
}

function codeLab(derivatives: boolean): string {
  const sample = derivatives
    ? 'function slope(x) { return 2 * x; } console.log(slope(2));'
    : 'function idea(name) { return "Study " + name; } console.log(idea("today"));';
  return `<!DOCTYPE html><html lang="en"><body style="font-family:Segoe UI,sans-serif;background:#0f172a;color:#fff;padding:16px">
  <h1 id="editor">In-browser code</h1>
  <textarea id="src" style="width:100%;height:120px;font-family:monospace">${sample}</textarea>
  <p><button id="run" type="button">Run</button></p>
  <pre id="out"></pre>
<script>
  document.getElementById('run').onclick = () => {
    const logs = [];
    try {
      new Function('console', document.getElementById('src').value)({ log: (...args) => logs.push(args.join(' ')) });
      document.getElementById('out').textContent = logs.join('\\n');
    } catch (err) {
      document.getElementById('out').textContent = String(err);
    }
  };
  window.__gandalSetState = (state) => {
    if (state.run) document.getElementById('run').click();
  };
  ${widgetListener()}
</script></body></html>`;
}

function textEl(id: string, html: string, top: number, height: number) {
  return {
    type: 'text',
    id,
    left: 56,
    top,
    width: 880,
    height,
    rotate: 0,
    defaultFontName: 'Segoe UI',
    defaultColor: '#f8fafc',
    content: html,
  };
}

function slideContent(title: string, formula: string, note: string) {
  return {
    type: 'slide',
    schemaVersion: 1,
    canvas: {
      id: 'slide-lesson',
      viewportSize: 1000,
      viewportRatio: 0.5625,
      theme: {
        backgroundColor: '#0f172a',
        themeColors: ['#e8b86d', '#38bdf8', '#a855f7'],
        fontColor: '#f8fafc',
        fontName: 'Segoe UI',
      },
      background: { type: 'solid', color: '#0f172a' },
      elements: [
        textEl('title-el', `<p><span style="font-size:40px">${esc(title)}</span></p>`, 48, 90),
        textEl('formula-el', `<p><span style="font-size:28px">${esc(formula)}</span></p>`, 160, 80),
        textEl('note-el', `<p><span style="font-size:18px">${esc(note)}</span></p>`, 270, 140),
      ],
    },
  };
}

function interactive(kind: string, html: string) {
  return { type: 'interactive', html, widgetType: kind, widgetConfig: { type: kind } };
}

function buildClassroom(topic: string, locale: 'en' | 'fr', modelLine: string, unavailable: boolean) {
  const derivatives = isDerivatives(topic);
  const title = derivatives ? (locale === 'fr' ? 'Dérivées' : 'Derivatives') : lessonTitle(topic, locale);
  const formula = derivatives
    ? 'd/dx x² = 2x'
    : locale === 'fr'
      ? 'Nommer, changer, regarder'
      : 'Name it, change it, watch it';
  const note = unavailable
    ? locale === 'fr'
      ? "Gemma ne tourne pas et aucune clé Gemini n'est définie. Gandho enseigne quand même."
      : 'Gemma is not running and no Gemini key is set. Gandho is teaching this lesson anyway.'
    : locale === 'fr'
      ? 'Gandho explique et montre la page.'
      : 'Gandho explains the lesson and points at the page.';
  const opening = modelLine
    ? `${modelLine} ${locale === 'fr' ? 'Je montre le titre.' : 'I am pointing at the title.'}`
    : locale === 'fr'
      ? `Je suis Gandho. Aujourd'hui, ${title}. Je montre le titre.`
      : `I am Gandho. Today we study ${title}. I am pointing at the title.`;
  const second = derivatives
    ? locale === 'fr'
      ? 'La dérivée de x carré est 2x. Je pointe la formule.'
      : 'The derivative of x squared is 2x. I am pointing at the formula.'
    : locale === 'fr'
      ? 'Je pointe la phrase qui dit quoi faire ensuite.'
      : 'I am pointing at the line that says what to do next.';
  const labSpeech = derivatives
    ? locale === 'fr'
      ? 'Je déplace x jusqu’à 2. Regarde la tangente. La pente vaut 4.'
      : 'I am moving x to 2. Watch the tangent. The slope is 4.'
    : locale === 'fr'
      ? "J'avance le contrôle à l'étape 3."
      : 'I am moving the control to step 3.';
  const now = Date.now();
  const stageId = `gandal-${now.toString(36)}`;
  const agents = [
    {
      id: 'gandho',
      name: 'Gandho',
      role: 'teacher',
      persona:
        'You are Gandho. You explain the lesson and point at the page with the spotlight, the laser, and the laboratory controls.',
      avatar: '/avatars/gandho.svg',
      color: '#a855f7',
      priority: 10,
    },
    {
      id: 'assistant-gandal',
      name: 'Assistant',
      role: 'assistant',
      persona: 'You help Gandho by restating one idea in simpler words. English or French only.',
      avatar: '/avatars/assist.png',
      color: '#10b981',
      priority: 6,
    },
    {
      id: 'classmate-gandal',
      name: 'Classmate',
      role: 'student',
      persona: 'You ask one short question. English or French only.',
      avatar: '/avatars/curious.png',
      color: '#38bdf8',
      priority: 4,
    },
  ];
  const scenes = [
    {
      id: `${stageId}-slide`,
      stageId,
      type: 'slide',
      title,
      order: 0,
      content: slideContent(title, formula, note),
      actions: [
        { id: 'spot-title', type: 'spotlight', elementId: 'title-el' },
        { id: 'say-open', type: 'speech', text: opening },
        { id: 'laser-formula', type: 'laser', elementId: 'formula-el', color: '#e8b86d' },
        { id: 'say-formula', type: 'speech', text: second },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${stageId}-lab`,
      stageId,
      type: 'interactive',
      title: derivatives ? (locale === 'fr' ? 'Laboratoire' : 'Laboratory') : locale === 'fr' ? 'Atelier' : 'Workshop',
      order: 1,
      content: interactive('simulation', derivatives ? derivativeLab() : genericLab(title)),
      actions: [
        { id: 'say-lab', type: 'speech', text: labSpeech },
        { id: 'hi-lab', type: 'widget_highlight', target: derivatives ? '#curve' : '#focus' },
        {
          id: 'move-lab',
          type: 'widget_setState',
          state: derivatives ? { x: 2 } : { step: 3 },
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${stageId}-3d`,
      stageId,
      type: 'interactive',
      title: locale === 'fr' ? 'Vue 3D' : '3D view',
      order: 2,
      content: interactive('visualization3d', orbitLab(title)),
      actions: [
        {
          id: 'say-3d',
          type: 'speech',
          text: locale === 'fr' ? 'Je montre l’objet au centre.' : 'I am pointing at the object in the center.',
        },
        { id: 'hi-3d', type: 'widget_highlight', target: '#view' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${stageId}-map`,
      stageId,
      type: 'interactive',
      title: locale === 'fr' ? 'Carte' : 'Mind map',
      order: 3,
      content: interactive('diagram', mindMap(title, locale)),
      actions: [
        {
          id: 'say-map',
          type: 'speech',
          text: locale === 'fr' ? 'Je montre le centre de la carte.' : 'I am pointing at the center of the map.',
        },
        { id: 'hi-map', type: 'widget_highlight', target: '#center' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${stageId}-game`,
      stageId,
      type: 'interactive',
      title: locale === 'fr' ? 'Jeu' : 'Game',
      order: 4,
      content: interactive('game', gameLab(title, locale, derivatives)),
      actions: [
        {
          id: 'say-game',
          type: 'speech',
          text: derivatives
            ? locale === 'fr'
              ? 'Je choisis 2x.'
              : 'I am choosing 2x.'
            : locale === 'fr'
              ? 'Je choisis la première étape.'
              : 'I am choosing the first step.',
        },
        { id: 'hi-game', type: 'widget_highlight', target: '#right' },
        { id: 'go-game', type: 'widget_setState', state: { choice: 'right' } },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${stageId}-code`,
      stageId,
      type: 'interactive',
      title: locale === 'fr' ? 'Code' : 'Code',
      order: 5,
      content: interactive('code', codeLab(derivatives)),
      actions: [
        {
          id: 'say-code',
          type: 'speech',
          text: locale === 'fr' ? 'Je lance le code.' : 'I am running the code.',
        },
        { id: 'hi-code', type: 'widget_highlight', target: '#run' },
        { id: 'go-code', type: 'widget_setState', state: { run: true } },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
  const stage = {
    id: stageId,
    name: title,
    description: note,
    languageDirective: locale === 'fr' ? 'Teach in French only.' : 'Teach in English only.',
    style: 'interactive',
    interactiveMode: true,
    createdAt: now,
    updatedAt: now,
    agentIds: agents.map((agent) => agent.id),
    generatedAgentConfigs: agents,
  };
  return { stageId, stage, scenes };
}

async function persistClassroom(built: ReturnType<typeof buildClassroom>) {
  const now = Date.now();
  const payload = {
    stage: built.stage,
    scenes: built.scenes,
    currentSceneId: built.scenes[0].id,
    chats: [],
    outline: { outlines: [], generationComplete: true, createdAt: now, updatedAt: now },
  };
  try {
    await saveStageData(built.stageId, payload as never, 0);
  } catch {
    await db.stages.put(built.stage as never);
    for (const scene of built.scenes) await db.scenes.put(scene as never);
    await db.stageOutlines.put({
      stageId: built.stageId,
      outlines: [],
      generationComplete: true,
      createdAt: now,
      updatedAt: now,
    } as never);
  }
}

async function askModel(topic: string, locale: 'en' | 'fr') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gemma-4-e4b',
        messages: [
          {
            role: 'system',
            content:
              locale === 'fr'
                ? 'Tu es Gandho. Réponds en français, en deux phrases, sans caractères chinois.'
                : 'You are Gandho. Reply in English, in two sentences, with no Chinese characters.',
          },
          { role: 'user', content: topic },
        ],
      }),
    });
    const data = await response.json();
    const engine = String(data.gandal_engine || '');
    const text = String(data.choices?.[0]?.message?.content || '');
    if (engine === 'unavailable' || hasCjk(text)) {
      return { engine: 'unavailable', line: '' };
    }
    const line = text.replace(/\s+/g, ' ').trim().slice(0, 360);
    return { engine: engine || 'ready', line };
  } catch {
    return { engine: 'unavailable', line: '' };
  } finally {
    clearTimeout(timer);
  }
}

export default function GandalTopicPage() {
  const [topic, setTopic] = useState('teach me derivatives');
  const [locale, setLocale] = useState<'en' | 'fr'>('en');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale');
      if (stored === 'fr-FR') setLocale('fr');
    } catch {
      /* ignore */
    }
  }, []);

  async function generate(nextTopic: string, nextLocale: 'en' | 'fr') {
    const clean = nextTopic.trim();
    if (!clean || busy) return;
    setBusy(true);
    setStatus(nextLocale === 'fr' ? 'Gandho prépare la classe...' : 'Gandho is preparing the classroom...');
    try {
      localStorage.setItem('locale', nextLocale === 'fr' ? 'fr-FR' : 'en-US');
    } catch {
      /* ignore */
    }
    const model = await askModel(clean, nextLocale);
    const built = buildClassroom(clean, nextLocale, model.line, model.engine === 'unavailable');
    await persistClassroom(built);
    try {
      useSettingsStore.getState().setAutoPlayLecture(true);
      useSettingsStore.getState().setTTSEnabled(false);
    } catch {
      /* playback still starts from the session flag */
    }
    sessionStorage.setItem('gandalPlay', '1');
    window.location.assign(`/classroom/${built.stageId}`);
  }

  async function onFile(file: File) {
    const textLike = file.type.startsWith('text') || /\.(txt|md|csv)$/i.test(file.name);
    const next = textLike ? (await file.text()).slice(0, 800) : file.name.replace(/\.[^.]+$/, '');
    if (next.trim()) setTopic(next.trim());
  }

  return (
    <main style={{ fontFamily: 'Segoe UI, sans-serif', background: '#0b1020', color: '#f8fafc', minHeight: '100vh', padding: 28 }}>
      <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8b86d' }}>Classroom</p>
      <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Gandho</h1>
      <p style={{ maxWidth: 640, lineHeight: 1.5 }}>
        {locale === 'fr'
          ? 'Écris un sujet. Gandho enseigne dans le lecteur de la classe, montre la page et déplace les contrôles.'
          : 'Type a topic. Gandho teaches it in the classroom player, points at the page, and moves the controls.'}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void generate(topic, locale);
        }}
        style={{ display: 'grid', gap: 12, maxWidth: 640, marginTop: 20 }}
      >
        <textarea
          id="gandal-topic-input"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          rows={3}
          style={{ font: 'inherit', padding: 12, borderRadius: 12, border: '1px solid #334155', background: '#111827', color: '#f8fafc' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setLocale('en')} style={{ font: 'inherit', padding: '8px 12px', borderRadius: 999, border: 0, background: locale === 'en' ? '#f8fafc' : '#1f2937', color: locale === 'en' ? '#111827' : '#f8fafc' }}>English</button>
          <button type="button" onClick={() => setLocale('fr')} style={{ font: 'inherit', padding: '8px 12px', borderRadius: 999, border: 0, background: locale === 'fr' ? '#f8fafc' : '#1f2937', color: locale === 'fr' ? '#111827' : '#f8fafc' }}>Français</button>
        </div>
        <label style={{ fontSize: 14 }}>
          {locale === 'fr' ? 'Ou importe un fichier texte' : 'Or import a text file'}
          <input
            id="gandal-topic-file"
            type="file"
            accept=".txt,.md,.csv,.pdf,text/plain"
            style={{ display: 'block', marginTop: 6 }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
        <button id="gandal-topic-go" type="submit" disabled={busy} style={{ font: 'inherit', padding: '12px 16px', borderRadius: 12, border: 0, background: '#e8b86d', color: '#1b1408' }}>
          {locale === 'fr' ? 'Générer la classe' : 'Generate classroom'}
        </button>
      </form>
      <p id="gandal-topic-status" style={{ marginTop: 16 }}>{status}</p>
      <p style={{ marginTop: 28 }}>
        <a href="/" style={{ color: '#93c5fd' }}>
          {locale === 'fr' ? 'Ouvrir aussi le générateur complet' : 'Open the full generator too'}
        </a>
      </p>
    </main>
  );
}
