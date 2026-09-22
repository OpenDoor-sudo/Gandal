"""Topic in, classroom lesson out. English or French only."""

import json
import re

from gandal_classroom.hybrid import complete, docker_hint, engine_flags, unavailable_message

_CJK = re.compile(r"[\u3400-\u9fff\uf900-\ufaff]")
_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.I)
_LOCALE_ALIASES = {
    "en": "en",
    "en-us": "en",
    "en-gb": "en",
    "english": "en",
    "fr": "fr",
    "fr-fr": "fr",
    "fr-ca": "fr",
    "french": "fr",
    "francais": "fr",
    "français": "fr",
}
_SCENE_ALIASES = {
    "slide": "slides",
    "slides": "slides",
    "deck": "slides",
    "3d": "viz3d",
    "viz3d": "viz3d",
    "visualization": "viz3d",
    "three": "viz3d",
    "simulation": "simulation",
    "sim": "simulation",
    "lab": "simulation",
    "game": "game",
    "quiz": "game",
    "mindmap": "mindmap",
    "mind_map": "mindmap",
    "mind-map": "mindmap",
    "diagram": "mindmap",
    "code": "code",
    "programming": "code",
    "playground": "code",
}
REQUIRED_SCENES = ("slides", "viz3d", "simulation", "game", "mindmap", "code")

SYSTEM_PROMPT = """You are the lesson writer for Gandal Classroom.
Return ONLY one JSON object. No markdown fences.

The lesson language is either English or French. The user message names which one.
Write every title, bullet, caption, button label, teacher line, code comment, and choice in that language only.
Never write Chinese characters. Never name a Chinese locale.
Do not switch language because the topic looks like another language. Translate the idea into the requested language.

JSON shape:
{
  "title": "short lesson title",
  "scenes": [
    {"id": "slides", "type": "slides", "title": "Slides", "slides": [{"title": "", "bullets": ["", ""], "notes": ""}]},
    {"id": "viz3d", "type": "viz3d", "title": "3D view", "caption": "", "objects": [{"id": "core", "label": "", "color": "#22c55e", "radius": 1.1, "orbit": 0, "phase": 0}]},
    {"id": "simulation", "type": "simulation", "title": "", "kind": "wavelength or intensity", "caption": "", "control": {"label": "", "min": 380, "max": 750, "value": 450, "unit": "nm"}, "start_label": "", "reset_label": ""},
    {"id": "game", "type": "game", "title": "Game", "rounds": [{"prompt": "", "choices": [{"label": "", "correct": true}]}]},
    {"id": "mindmap", "type": "mindmap", "title": "Mind map", "center": "", "nodes": [{"id": "n1", "label": "", "detail": ""}]},
    {"id": "code", "type": "code", "title": "Code", "task": "", "starter": "javascript the student can run"}
  ],
  "teacher": [
    {"scene": "slides", "say": "", "actions": [{"op": "spotlight", "index": 0}]},
    {"scene": "viz3d", "say": "", "actions": [{"op": "spin"}]},
    {"scene": "simulation", "say": "", "actions": [{"op": "set_control", "value": 450}, {"op": "start"}]},
    {"scene": "game", "say": "", "actions": []},
    {"scene": "mindmap", "say": "", "actions": [{"op": "focus", "id": "n1"}]},
    {"scene": "code", "say": "", "actions": [{"op": "run_code"}]}
  ]
}

Rules:
- Include all six scenes: slides, viz3d, simulation, game, mindmap, code.
- Three short slides. Four 3D objects (one orbit 0 at the center). One simulation control.
- Use kind "wavelength" (380 to 750 nm) for light, color, plants, or photosynthesis. Otherwise kind "intensity" from 0 to 100.
- English buttons: Start and Reset. French buttons: Démarrer and Recommencer.
- Game: 3 rounds, 3 or 4 choices each, exactly one correct choice per round.
- Mind map: 4 nodes around the topic.
- Code: plain JavaScript that uses console.log. No network, no HTML, no imports.
- Teacher lines are short spoken guidance. Actions use only: spotlight, goto_slide, spin, set_control, start, reset, focus, run_code, reveal.
- At least six teacher steps, one for each scene, and the simulation step must set the control then start.
"""


def normalize_locale(locale: str) -> str:
    key = (locale or "").strip().lower().replace("_", "-")
    if key in ("zh", "zh-cn", "zh-tw", "zh-hans", "zh-hant", "chinese"):
        return "en"
    return _LOCALE_ALIASES.get(key, "en")


def contains_cjk(text: str) -> bool:
    return bool(_CJK.search(text or ""))


def strip_cjk(text: str) -> str:
    return _CJK.sub("", text or "")


def _light_lab(topic: str) -> bool:
    t = (topic or "").lower()
    keys = (
        "photosynth", "chlorophyll", "chlorophylle", "wavelength",
        "lumiere", "lumière", "light", "leaf", "feuille", "plant", "plante",
    )
    return any(k in t for k in keys)


def _copy(locale: str):
    if locale == "fr":
        return {
            "slides": "Diapositives",
            "viz": "Vue 3D",
            "sim": "Simulation",
            "game": "Jeu",
            "map": "Carte mentale",
            "code": "Code",
            "start": "Démarrer",
            "reset": "Recommencer",
            "what": "De quoi s'agit-il ?",
            "how": "Comment l'observer",
            "remember": "À retenir",
            "parts": "Parties",
            "change": "Changement",
            "test": "Essai",
            "use": "Usage",
            "wave": "Laboratoire des longueurs d'onde",
            "wave_cap": "La chlorophylle absorbe le bleu et le rouge. Elle renvoie le vert.",
            "wave_label": "Longueur d'onde",
            "intensity": "Intensité",
            "intensity_cap": "Bougez le curseur. Une seule variable change, et le résultat suit.",
            "generic_title": "Sujet de classe",
        }
    return {
        "slides": "Slides",
        "viz": "3D view",
        "sim": "Simulation",
        "game": "Game",
        "map": "Mind map",
        "code": "Code",
        "start": "Start",
        "reset": "Reset",
        "what": "What this is",
        "how": "How to look at it",
        "remember": "What to remember",
        "parts": "Parts",
        "change": "Change",
        "test": "Test",
        "use": "Use",
        "wave": "Wavelength laboratory",
        "wave_cap": "Chlorophyll absorbs blue and red light and reflects green.",
        "wave_label": "Wavelength",
        "intensity": "Intensity",
        "intensity_cap": "Move the slider. One variable changes, and the result follows.",
        "generic_title": "Classroom topic",
    }


def display_topic(topic: str, locale: str) -> str:
    cleaned = " ".join(strip_cjk(topic or "").split())
    if cleaned:
        return cleaned[:120]
    return _copy(locale)["generic_title"]


def _slides(topic: str, locale: str, c: dict):
    if locale == "fr":
        return [
            {
                "title": c["what"],
                "bullets": [
                    f"{topic} est l'idée de cette classe.",
                    "On la regarde par scènes, pas par un seul paragraphe.",
                    "L'enseignant peut avancer la page avec vous.",
                ],
                "notes": "Lire le titre, puis la première puce.",
            },
            {
                "title": c["how"],
                "bullets": [
                    "Nommez les parties.",
                    "Changez une seule variable.",
                    "Regardez ce qui bouge.",
                ],
                "notes": "Annoncer la simulation et la vue 3D.",
            },
            {
                "title": c["remember"],
                "bullets": [
                    "Une carte relie les parties.",
                    "Un petit programme vérifie l'idée.",
                    "Le jeu demande une réponse précise.",
                ],
                "notes": "Terminer sur le jeu et le code.",
            },
        ]
    return [
        {
            "title": c["what"],
            "bullets": [
                f"{topic} is the idea of this classroom.",
                "You meet it as scenes, not one long paragraph.",
                "The teacher can move the page with you.",
            ],
            "notes": "Read the title, then the first bullet.",
        },
        {
            "title": c["how"],
            "bullets": [
                "Name the parts.",
                "Change one variable.",
                "Watch what moves.",
            ],
            "notes": "Point ahead to the simulation and the 3D view.",
        },
        {
            "title": c["remember"],
            "bullets": [
                "A map connects the parts.",
                "A short program checks the idea.",
                "The game asks for a precise answer.",
            ],
            "notes": "Close on the game and the code.",
        },
    ]


def _viz(topic: str, locale: str, light: bool):
    if light:
        if locale == "fr":
            objects = [
                ("core", "Chloroplaste", "#22c55e", 1.15, 0, 0),
                ("blue", "Lumière bleue", "#3b82f6", 0.38, 2.15, 0.4),
                ("red", "Lumière rouge", "#ef4444", 0.38, 2.7, 2.4),
                ("green", "Lumière verte", "#86efac", 0.28, 3.35, 4.2),
            ]
            caption = "Le chloroplaste au centre. Le bleu et le rouge tournent près de lui. Le vert reste plus loin."
        else:
            objects = [
                ("core", "Chloroplast", "#22c55e", 1.15, 0, 0),
                ("blue", "Blue light", "#3b82f6", 0.38, 2.15, 0.4),
                ("red", "Red light", "#ef4444", 0.38, 2.7, 2.4),
                ("green", "Green light", "#86efac", 0.28, 3.35, 4.2),
            ]
            caption = "The chloroplast sits in the center. Blue and red orbit close in. Green stays farther out."
    else:
        if locale == "fr":
            objects = [
                ("core", topic, "#a78bfa", 1.1, 0, 0),
                ("p1", "Partie", "#38bdf8", 0.36, 2.2, 0.2),
                ("p2", "Variable", "#fbbf24", 0.36, 2.8, 2.2),
                ("p3", "Résultat", "#34d399", 0.32, 3.3, 4.0),
            ]
            caption = f"Vue 3D de {topic} : un centre et trois idées qui tournent autour."
        else:
            objects = [
                ("core", topic, "#a78bfa", 1.1, 0, 0),
                ("p1", "Part", "#38bdf8", 0.36, 2.2, 0.2),
                ("p2", "Variable", "#fbbf24", 0.36, 2.8, 2.2),
                ("p3", "Result", "#34d399", 0.32, 3.3, 4.0),
            ]
            caption = f"A 3D view of {topic}: one center and three ideas in orbit."
    return [
        {"id": i, "label": lab, "color": col, "radius": rad, "orbit": orb, "phase": ph}
        for i, lab, col, rad, orb, ph in objects
    ], caption


def _game(topic: str, locale: str, light: bool):
    if light and locale == "fr":
        return [
            {
                "prompt": "Quelle lumière une feuille utilise-t-elle le plus ?",
                "choices": [
                    {"label": "Le bleu et le rouge", "correct": True},
                    {"label": "Seulement le vert", "correct": False},
                    {"label": "Aucune lumière", "correct": False},
                ],
            },
            {
                "prompt": "Que rejette surtout la feuille ?",
                "choices": [
                    {"label": "De l'oxygène", "correct": True},
                    {"label": "Du fer", "correct": False},
                    {"label": "Du sel", "correct": False},
                ],
            },
            {
                "prompt": "Où va le sucre fabriqué ?",
                "choices": [
                    {"label": "Il devient de l'énergie stockée", "correct": True},
                    {"label": "Il disparaît", "correct": False},
                    {"label": "Il reste de la lumière", "correct": False},
                ],
            },
        ]
    if light:
        return [
            {
                "prompt": "Which light does a leaf use most?",
                "choices": [
                    {"label": "Blue and red", "correct": True},
                    {"label": "Only green", "correct": False},
                    {"label": "No light at all", "correct": False},
                ],
            },
            {
                "prompt": "What does the leaf mainly give off?",
                "choices": [
                    {"label": "Oxygen", "correct": True},
                    {"label": "Iron", "correct": False},
                    {"label": "Salt", "correct": False},
                ],
            },
            {
                "prompt": "Where does the sugar go?",
                "choices": [
                    {"label": "It becomes stored energy", "correct": True},
                    {"label": "It vanishes", "correct": False},
                    {"label": "It stays as light", "correct": False},
                ],
            },
        ]
    if locale == "fr":
        return [
            {
                "prompt": f"Quelle est la meilleure façon d'étudier {topic} ?",
                "choices": [
                    {"label": "Changer une variable et regarder", "correct": True},
                    {"label": "Deviner sans essai", "correct": False},
                    {"label": "Ignorer les parties", "correct": False},
                ],
            },
            {
                "prompt": "À quoi sert la carte mentale ?",
                "choices": [
                    {"label": "À relier les parties", "correct": True},
                    {"label": "À cacher le sujet", "correct": False},
                    {"label": "À remplacer l'essai", "correct": False},
                ],
            },
            {
                "prompt": "À quoi sert le code dans cette classe ?",
                "choices": [
                    {"label": "À vérifier une idée dans le navigateur", "correct": True},
                    {"label": "À éteindre la page", "correct": False},
                    {"label": "À éviter la question", "correct": False},
                ],
            },
        ]
    return [
        {
            "prompt": f"What is a good way to study {topic}?",
            "choices": [
                {"label": "Change one variable and watch", "correct": True},
                {"label": "Guess without a test", "correct": False},
                {"label": "Ignore the parts", "correct": False},
            ],
        },
        {
            "prompt": "What is the mind map for?",
            "choices": [
                {"label": "Connecting the parts", "correct": True},
                {"label": "Hiding the topic", "correct": False},
                {"label": "Replacing the test", "correct": False},
            ],
        },
        {
            "prompt": "What is the code scene for?",
            "choices": [
                {"label": "Checking an idea in the browser", "correct": True},
                {"label": "Turning the page off", "correct": False},
                {"label": "Skipping the question", "correct": False},
            ],
        },
    ]


def _nodes(topic: str, locale: str, light: bool):
    if light and locale == "fr":
        center = "Photosynthèse"
        nodes = [
            ("light", "Lumière", "Le bleu et le rouge sont absorbés."),
            ("water", "Eau", "Les racines apportent l'eau."),
            ("co2", "Dioxyde de carbone", "L'air entre par la feuille."),
            ("sugar", "Glucose", "Le sucre stocke l'énergie."),
        ]
    elif light:
        center = "Photosynthesis"
        nodes = [
            ("light", "Light", "Blue and red are absorbed."),
            ("water", "Water", "Roots bring water in."),
            ("co2", "Carbon dioxide", "Air enters through the leaf."),
            ("sugar", "Glucose", "Sugar stores the energy."),
        ]
    elif locale == "fr":
        center = topic
        nodes = [
            ("parts", "Parties", f"Les morceaux de {topic}."),
            ("change", "Changement", "Une variable à la fois."),
            ("test", "Essai", "On vérifie ce qui change."),
            ("use", "Usage", "Où cette idée sert."),
        ]
    else:
        center = topic
        nodes = [
            ("parts", "Parts", f"The pieces of {topic}."),
            ("change", "Change", "One variable at a time."),
            ("test", "Test", "Check what changes."),
            ("use", "Use", "Where this idea is used."),
        ]
    return center, [{"id": i, "label": lab, "detail": det} for i, lab, det in nodes]


def _starter(topic: str, locale: str, light: bool) -> tuple:
    safe = topic.replace("\\", "").replace('"', "'")
    if light:
        code = """function absorbed(wavelengthNm) {
  var blue = Math.exp(-Math.pow((wavelengthNm - 430) / 40, 2));
  var red = Math.exp(-Math.pow((wavelengthNm - 662) / 45, 2));
  return Math.round((blue + red) * 100);
}
console.log("450 nm", absorbed(450));
console.log("550 nm", absorbed(550));
"""
        task = (
            "Exécutez la fonction. 450 nm est fort, 550 nm est faible."
            if locale == "fr"
            else "Run the function. 450 nm scores high. 550 nm scores low."
        )
        return task, code
    if locale == "fr":
        code = (
            "function decrire(sujet) {\n"
            "  return \"On étudie \" + sujet + \" en changeant une variable.\";\n"
            "}\n"
            f"console.log(decrire(\"{safe}\"));\n"
        )
        return "Exécutez le programme, puis changez la phrase.", code
    code = (
        "function describe(topic) {\n"
        "  return \"Study \" + topic + \" by changing one variable.\";\n"
        "}\n"
        f"console.log(describe(\"{safe}\"));\n"
    )
    return "Run the program, then change the sentence.", code


def _teacher(locale: str, light: bool, first_node: str):
    if locale == "fr":
        sim_say = (
            "J'ouvre le laboratoire. Je règle 450 nanomètres et je lance la lumière."
            if light else
            "Je règle le curseur et je démarre la simulation."
        )
        return [
            {"scene": "slides", "say": "On commence par l'idée. Je mets la première puce en lumière.", "actions": [{"op": "spotlight", "index": 0}]},
            {"scene": "slides", "say": "Deuxième diapositive : nommer, changer, regarder.", "actions": [{"op": "goto_slide", "index": 1}, {"op": "spotlight", "index": 1}]},
            {"scene": "viz3d", "say": "Voici la vue 3D. Je la fais tourner.", "actions": [{"op": "spin"}]},
            {"scene": "simulation", "say": sim_say, "actions": [{"op": "set_control", "value": 450 if light else 70}, {"op": "start"}]},
            {"scene": "game", "say": "À vous. Choisissez une réponse. Je peux révéler ensuite.", "actions": [{"op": "reveal"}]},
            {"scene": "mindmap", "say": "Suivez la carte. Je montre un nœud.", "actions": [{"op": "focus", "id": first_node}]},
            {"scene": "code", "say": "J'exécute le programme dans la page.", "actions": [{"op": "run_code"}]},
        ]
    sim_say = (
        "I am opening the laboratory. I set 450 nanometers and start the light."
        if light else
        "I set the slider and start the simulation."
    )
    return [
        {"scene": "slides", "say": "We start with the idea. I spotlight the first bullet.", "actions": [{"op": "spotlight", "index": 0}]},
        {"scene": "slides", "say": "Second slide: name it, change it, watch it.", "actions": [{"op": "goto_slide", "index": 1}, {"op": "spotlight", "index": 1}]},
        {"scene": "viz3d", "say": "Here is the 3D view. I will turn it.", "actions": [{"op": "spin"}]},
        {"scene": "simulation", "say": sim_say, "actions": [{"op": "set_control", "value": 450 if light else 70}, {"op": "start"}]},
        {"scene": "game", "say": "Your turn. Pick an answer. I can reveal it next.", "actions": [{"op": "reveal"}]},
        {"scene": "mindmap", "say": "Follow the map. I will focus one node.", "actions": [{"op": "focus", "id": first_node}]},
        {"scene": "code", "say": "I am running the program on this page.", "actions": [{"op": "run_code"}]},
    ]


def build_scene_kit(topic: str, locale: str) -> dict:
    """Playable lesson from the topic. Not a model reply."""
    locale = normalize_locale(locale)
    shown = display_topic(topic, locale)
    c = _copy(locale)
    light = _light_lab(shown)
    objects, viz_caption = _viz(shown, locale, light)
    center, nodes = _nodes(shown, locale, light)
    task, starter = _starter(shown, locale, light)
    if light:
        sim = {
            "id": "simulation",
            "type": "simulation",
            "title": c["wave"],
            "kind": "wavelength",
            "caption": c["wave_cap"],
            "control": {"label": c["wave_label"], "min": 380, "max": 750, "value": 450, "unit": "nm"},
            "start_label": c["start"],
            "reset_label": c["reset"],
        }
    else:
        sim = {
            "id": "simulation",
            "type": "simulation",
            "title": c["sim"],
            "kind": "intensity",
            "caption": c["intensity_cap"],
            "control": {"label": c["intensity"], "min": 0, "max": 100, "value": 40, "unit": "%"},
            "start_label": c["start"],
            "reset_label": c["reset"],
        }
    title = shown
    return {
        "locale": locale,
        "title": title,
        "topic": shown,
        "lesson_source": "scene_kit",
        "scenes": [
            {"id": "slides", "type": "slides", "title": c["slides"], "slides": _slides(shown, locale, c)},
            {"id": "viz3d", "type": "viz3d", "title": c["viz"], "caption": viz_caption, "objects": objects},
            sim,
            {"id": "game", "type": "game", "title": c["game"], "rounds": _game(shown, locale, light)},
            {"id": "mindmap", "type": "mindmap", "title": c["map"], "center": center, "nodes": nodes},
            {"id": "code", "type": "code", "title": c["code"], "task": task, "starter": starter},
        ],
        "teacher": _teacher(locale, light, nodes[0]["id"]),
    }


def user_prompt(topic: str, locale: str) -> str:
    language = "French" if normalize_locale(locale) == "fr" else "English"
    return (
        f"Teaching language: {language}.\n"
        f"Topic: {topic.strip()}\n"
        "Build the six-scene classroom JSON now. "
        "If the topic is about light, color, a leaf, or photosynthesis, the simulation kind is wavelength. "
        "Otherwise the simulation kind is intensity."
    )


def _loads(raw: str):
    text = (raw or "").strip()
    fenced = _FENCE.search(text)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end + 1]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _as_str(value, limit=800) -> str:
    if value is None:
        return ""
    text = strip_cjk(str(value))
    text = " ".join(text.split()) if "\n" not in text else text
    return text[:limit]


def _scene_type(raw) -> str:
    key = str((raw or {}).get("type") or (raw or {}).get("id") or "").strip().lower()
    return _SCENE_ALIASES.get(key, "")


def _sanitize_scene(scene: dict, kind: str) -> dict:
    out = {"id": kind, "type": kind, "title": _as_str(scene.get("title"), 80)}
    if kind == "slides":
        slides = []
        for item in (scene.get("slides") or [])[:4]:
            if not isinstance(item, dict):
                continue
            bullets = [_as_str(b, 180) for b in (item.get("bullets") or [])[:5]]
            bullets = [b for b in bullets if b]
            title = _as_str(item.get("title"), 100)
            if title or bullets:
                slides.append({"title": title, "bullets": bullets, "notes": _as_str(item.get("notes"), 180)})
        out["slides"] = slides
    elif kind == "viz3d":
        objects = []
        for item in (scene.get("objects") or [])[:6]:
            if not isinstance(item, dict):
                continue
            label = _as_str(item.get("label"), 40)
            if not label:
                continue
            color = str(item.get("color") or "#94a3b8")
            if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
                color = "#94a3b8"
            objects.append({
                "id": _as_str(item.get("id"), 24) or f"o{len(objects)}",
                "label": label,
                "color": color,
                "radius": float(item.get("radius") or 0.4),
                "orbit": float(item.get("orbit") or 0),
                "phase": float(item.get("phase") or 0),
            })
        out["objects"] = objects
        out["caption"] = _as_str(scene.get("caption"), 220)
    elif kind == "simulation":
        kind_name = "wavelength" if str(scene.get("kind") or "") == "wavelength" else "intensity"
        control = scene.get("control") if isinstance(scene.get("control"), dict) else {}
        out["kind"] = kind_name
        out["caption"] = _as_str(scene.get("caption"), 240)
        if kind_name == "wavelength":
            mn, mx, unit, default = 380, 750, "nm", 450
        else:
            mn, mx, unit, default = 0, 100, "%", 40
        try:
            value = float(control.get("value"))
        except (TypeError, ValueError):
            value = default
        out["control"] = {
            "label": _as_str(control.get("label"), 40) or ("Wavelength" if kind_name == "wavelength" else "Intensity"),
            "min": mn,
            "max": mx,
            "value": max(mn, min(mx, value)),
            "unit": unit,
        }
        out["start_label"] = _as_str(scene.get("start_label"), 24)
        out["reset_label"] = _as_str(scene.get("reset_label"), 24)
    elif kind == "game":
        rounds = []
        for item in (scene.get("rounds") or [])[:4]:
            if not isinstance(item, dict):
                continue
            choices = []
            for choice in (item.get("choices") or [])[:4]:
                if not isinstance(choice, dict):
                    continue
                label = _as_str(choice.get("label"), 120)
                if label:
                    choices.append({"label": label, "correct": bool(choice.get("correct"))})
            if _as_str(item.get("prompt"), 180) and len(choices) >= 2:
                if not any(c["correct"] for c in choices):
                    choices[0]["correct"] = True
                rounds.append({"prompt": _as_str(item.get("prompt"), 180), "choices": choices})
        out["rounds"] = rounds
    elif kind == "mindmap":
        nodes = []
        for item in (scene.get("nodes") or [])[:6]:
            if not isinstance(item, dict):
                continue
            label = _as_str(item.get("label"), 40)
            if not label:
                continue
            nodes.append({
                "id": _as_str(item.get("id"), 24) or f"n{len(nodes)}",
                "label": label,
                "detail": _as_str(item.get("detail"), 180),
            })
        out["center"] = _as_str(scene.get("center"), 60)
        out["nodes"] = nodes
    elif kind == "code":
        starter = strip_cjk(str(scene.get("starter") or ""))[:2000]
        out["task"] = _as_str(scene.get("task"), 200)
        out["starter"] = starter
        html = strip_cjk(str(scene.get("html") or ""))
        if html and not contains_cjk(html):
            out["html"] = html[:20000]
    return out


def _sanitize_teacher(steps) -> list:
    clean = []
    allowed = {"spotlight", "goto_slide", "spin", "set_control", "start", "reset", "focus", "run_code", "reveal"}
    for step in (steps or [])[:10]:
        if not isinstance(step, dict):
            continue
        scene = _SCENE_ALIASES.get(str(step.get("scene") or "").lower(), "")
        say = _as_str(step.get("say"), 280)
        actions = []
        for act in (step.get("actions") or [])[:4]:
            if not isinstance(act, dict):
                continue
            op = str(act.get("op") or "")
            if op not in allowed:
                continue
            item = {"op": op}
            if op in ("spotlight", "goto_slide"):
                try:
                    item["index"] = int(act.get("index") or 0)
                except (TypeError, ValueError):
                    item["index"] = 0
            elif op == "set_control":
                try:
                    item["value"] = float(act.get("value"))
                except (TypeError, ValueError):
                    continue
            elif op == "focus":
                node = _as_str(act.get("id"), 24)
                if not node:
                    continue
                item["id"] = node
            actions.append(item)
        if scene and say:
            clean.append({"scene": scene, "say": say, "actions": actions})
    return clean


def parse_model_lesson(raw: str, topic: str, locale: str):
    data = _loads(raw)
    if not data:
        return None
    blob = json.dumps(data, ensure_ascii=False)
    if contains_cjk(blob):
        try:
            data = json.loads(strip_cjk(blob) or "{}")
        except json.JSONDecodeError:
            return None
        if not isinstance(data, dict) or contains_cjk(json.dumps(data, ensure_ascii=False)):
            return None
    by_type = {}
    for scene in data.get("scenes") or []:
        if not isinstance(scene, dict):
            continue
        kind = _scene_type(scene)
        if kind and kind not in by_type:
            by_type[kind] = _sanitize_scene(scene, kind)
    if len(by_type) < 4:
        return None
    locale = normalize_locale(locale)
    shown = display_topic(topic, locale)
    title = _as_str(data.get("title"), 80) or shown
    lesson = {
        "locale": locale,
        "title": title,
        "topic": shown,
        "lesson_source": "model",
        "scenes": list(by_type.values()),
        "teacher": _sanitize_teacher(data.get("teacher")),
    }
    return ensure_scenes(lesson, topic, locale)


def ensure_scenes(lesson: dict, topic: str, locale: str) -> dict:
    kit = build_scene_kit(topic, locale)
    by_type = {}
    for scene in lesson.get("scenes") or []:
        if isinstance(scene, dict) and scene.get("type") in REQUIRED_SCENES:
            by_type[scene["type"]] = scene
    merged = []
    for kind in REQUIRED_SCENES:
        scene = by_type.get(kind) or next(s for s in kit["scenes"] if s["type"] == kind)
        kit_scene = next(s for s in kit["scenes"] if s["type"] == kind)
        if kind == "slides" and not scene.get("slides"):
            scene = kit_scene
        if kind == "viz3d" and not scene.get("objects"):
            scene = kit_scene
        if kind == "game" and not scene.get("rounds"):
            scene = kit_scene
        if kind == "mindmap" and not scene.get("nodes"):
            scene = kit_scene
        if kind == "code" and not scene.get("starter"):
            scene = kit_scene
        if kind == "simulation":
            if not scene.get("start_label"):
                scene["start_label"] = kit_scene["start_label"]
            if not scene.get("reset_label"):
                scene["reset_label"] = kit_scene["reset_label"]
            if not scene.get("caption"):
                scene["caption"] = kit_scene["caption"]
        merged.append(scene)
    lesson["scenes"] = merged
    if not lesson.get("teacher"):
        lesson["teacher"] = kit["teacher"]
    lesson["locale"] = normalize_locale(lesson.get("locale") or locale)
    if contains_cjk(json.dumps(lesson, ensure_ascii=False)):
        return kit
    return lesson


def generate_lesson(topic: str, locale: str = "en") -> dict:
    locale = normalize_locale(locale)
    raw_topic = (topic or "").strip()
    if not raw_topic:
        empty = "Type a topic in English or French." if locale == "en" else "Écrivez un sujet en anglais ou en français."
        return {
            "success": False,
            "error": empty,
            "provider": "none",
            "engine_type": "unavailable",
            "lesson": None,
        }
    system = SYSTEM_PROMPT
    user = user_prompt(raw_topic, locale)
    text, provider, engine_type = complete(system, user)
    lesson = parse_model_lesson(text, raw_topic, locale) if text else None
    if lesson:
        lesson["provider"] = provider
        lesson["engine_type"] = engine_type
        return {
            "success": True,
            "error": None,
            "provider": provider,
            "engine_type": engine_type,
            "lesson": lesson,
            "lesson_source": "model",
        }
    local_ok, gemini_ok = engine_flags()
    if text and (local_ok or gemini_ok):
        err = (
            "The model reply was not a usable English or French lesson."
            if locale == "en"
            else "La réponse du modèle n'est pas une leçon utilisable en anglais ou en français."
        )
    else:
        err = unavailable_message()
        if locale == "fr":
            err = (
                "Il faut Gemma ou une clé Gemini. Gemma 4 E4B ne répond pas sur "
                "http://127.0.0.1:8080/v1 (modèle gemma-4-e4b), et aucune clé Google utilisable n'est définie."
            )
        err += docker_hint()
    kit = build_scene_kit(raw_topic, locale)
    kit["provider"] = "none"
    kit["engine_type"] = "unavailable"
    return {
        "success": False,
        "error": err,
        "provider": "none",
        "engine_type": "unavailable",
        "lesson": kit,
        "lesson_source": "scene_kit",
    }
