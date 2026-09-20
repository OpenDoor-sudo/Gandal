/**
 * gandal_space.js - Gandal Space Client & Declarative A2UI DOM Renderer
 * Integrates:
 *   1. 70% Answers & Exploration Pane + 30% Gandho Avatar & Voice Companion Pane
 *   2. Dual-mode routing (Edge/Gemma 4 E4B on LOCAL_LLM_URL :8080 / optional Gemini)
 *   3. Declarative A2UI layout renderer (TextBlock, FormulaCard, PronunciationCard)
 *   4. Continuous voice conversation loop with Gandho (Web Speech API + Socratic Chat API)
 *   5. Seamless LiveKit / Spatius Avatar coordination
 */

const GANDAL_ALPHABET_DICTIONARY = [
  { 
    letter: "A", phoneme: "/eɪ/", word: "Apple", example: "A is for Apple", tip: "Open your mouth wide and make a bright 'ay' sound.", text_to_speak: "A. A is for Apple.",
    quiz: {
      question: "Which of these words starts with the letter 'A' sound, like in 'Apple'?",
      options: ["Ant", "Ball", "Cat"],
      answerIndex: 0,
      explanation: "Spot on! 'Ant' begins with the letter A sound (/eɪ/ or short /æ/), matching 'Apple'!"
    }
  },
  { 
    letter: "B", phoneme: "/biː/", word: "Ball", example: "B is for Ball", tip: "Press your lips firmly together and pop them open with voice: 'buh'.", text_to_speak: "B. B is for Ball.",
    quiz: {
      question: "Which of these words starts with the letter 'B' sound, like in 'Ball'?",
      options: ["Banana", "Apple", "Cat"],
      answerIndex: 0,
      explanation: "Spot on! 'Banana' begins with the letter B sound (/b/), matching 'Ball'!"
    }
  },
  { 
    letter: "C", phoneme: "/siː/", word: "Cat", example: "C is for Cat", tip: "Touch the back of your tongue to the roof of your mouth: 'kuh'.", text_to_speak: "C. C is for Cat.",
    quiz: {
      question: "Which of these words starts with the letter 'C' sound, like in 'Cat'?",
      options: ["Carrot", "Dog", "Fish"],
      answerIndex: 0,
      explanation: "Spot on! 'Carrot' begins with the crisp letter C sound (/k/), matching 'Cat'!"
    }
  },
  { 
    letter: "D", phoneme: "/diː/", word: "Dog", example: "D is for Dog", tip: "Tap your tongue tip right behind your upper front teeth: 'duh'.", text_to_speak: "D. D is for Dog.",
    quiz: {
      question: "Which of these words starts with the letter 'D' sound, like in 'Dog'?",
      options: ["Dolphin", "Bird", "Kangaroo"],
      answerIndex: 0,
      explanation: "Spot on! 'Dolphin' begins with the letter D sound (/d/), matching 'Dog'!"
    }
  },
  { 
    letter: "E", phoneme: "/iː/", word: "Elephant", example: "E is for Elephant", tip: "Smile slightly and let out a crisp 'eh' sound.", text_to_speak: "E. E is for Elephant.",
    quiz: {
      question: "Which of these words starts with the letter 'E' sound, like in 'Elephant'?",
      options: ["Egg", "Sun", "Lion"],
      answerIndex: 0,
      explanation: "Spot on! 'Egg' starts with the short 'e' sound (/ɛ/), matching 'Elephant'!"
    }
  },
  { 
    letter: "F", phoneme: "/ɛf/", word: "Fish", example: "F is for Fish", tip: "Place your upper teeth gently on your bottom lip and blow air: 'fff'.", text_to_speak: "F. F is for Fish.",
    quiz: {
      question: "Which of these words starts with the letter 'F' sound, like in 'Fish'?",
      options: ["Frog", "Monkey", "Giraffe"],
      answerIndex: 0,
      explanation: "Spot on! 'Frog' begins with the letter F sound (/f/), matching 'Fish'!"
    }
  },
  { 
    letter: "G", phoneme: "/dʒiː/", word: "Giraffe", example: "G is for Giraffe", tip: "Voice a gentle soft 'j' sound as in Giraffe, or a strong 'guh' sound as in Guitar.", text_to_speak: "G. G is for Giraffe.",
    quiz: {
      question: "Which of these words starts with the letter 'G' sound, like in 'Giraffe'?",
      options: ["Grape", "Apple", "House"],
      answerIndex: 0,
      explanation: "Spot on! 'Grape' begins with the letter G sound, matching 'Giraffe'!"
    }
  },
  { 
    letter: "H", phoneme: "/eɪtʃ/", word: "House", example: "H is for House", tip: "Breathe warm air out gently from your throat: 'huh'.", text_to_speak: "H. H is for House.",
    quiz: {
      question: "Which of these words starts with the letter 'H' sound, like in 'House'?",
      options: ["Horse", "Owl", "Penguin"],
      answerIndex: 0,
      explanation: "Spot on! 'Horse' begins with the letter H breath sound (/h/), matching 'House'!"
    }
  },
  { 
    letter: "I", phoneme: "/aɪ/", word: "Iguana", example: "I is for Iguana", tip: "Open your mouth a little and make a clean 'ih' sound.", text_to_speak: "I. I is for Iguana.",
    quiz: {
      question: "Which of these words starts with the letter 'I' sound, like in 'Iguana'?",
      options: ["Igloo", "Tiger", "Dog"],
      answerIndex: 0,
      explanation: "Spot on! 'Igloo' begins with the short 'i' sound (/ɪ/), matching 'Iguana'!"
    }
  },
  { 
    letter: "J", phoneme: "/dʒeɪ/", word: "Jellyfish", example: "J is for Jellyfish", tip: "Press your tongue behind your top teeth and release with 'juh'.", text_to_speak: "J. J is for Jellyfish.",
    quiz: {
      question: "Which of these words starts with the letter 'J' sound, like in 'Jellyfish'?",
      options: ["Jam", "Cat", "Sun"],
      answerIndex: 0,
      explanation: "Spot on! 'Jam' begins with the letter J sound (/dʒ/), matching 'Jellyfish'!"
    }
  },
  { 
    letter: "K", phoneme: "/keɪ/", word: "Kangaroo", example: "K is for Kangaroo", tip: "Raise the back of your tongue and let out a quick puff: 'kuh'.", text_to_speak: "K. K is for Kangaroo.",
    quiz: {
      question: "Which of these words starts with the letter 'K' sound, like in 'Kangaroo'?",
      options: ["Kite", "Elephant", "Ball"],
      answerIndex: 0,
      explanation: "Spot on! 'Kite' begins with the crisp letter K sound (/k/), matching 'Kangaroo'!"
    }
  },
  { 
    letter: "L", phoneme: "/ɛl/", word: "Lion", example: "L is for Lion", tip: "Press your tongue tip firmly behind your top front teeth: 'lll'.", text_to_speak: "L. L is for Lion.",
    quiz: {
      question: "Which of these words starts with the letter 'L' sound, like in 'Lion'?",
      options: ["Lemon", "Monkey", "Fish"],
      answerIndex: 0,
      explanation: "Spot on! 'Lemon' begins with the letter L sound (/l/), matching 'Lion'!"
    }
  },
  { 
    letter: "M", phoneme: "/ɛm/", word: "Monkey", example: "M is for Monkey", tip: "Press your lips together and hum gently through your nose: 'mmm'.", text_to_speak: "M. M is for Monkey.",
    quiz: {
      question: "Which of these words starts with the letter 'M' sound, like in 'Monkey'?",
      options: ["Moon", "Zebra", "House"],
      answerIndex: 0,
      explanation: "Spot on! 'Moon' begins with the letter M hum sound (/m/), matching 'Monkey'!"
    }
  },
  { 
    letter: "N", phoneme: "/ɛn/", word: "Nest", example: "N is for Nest", tip: "Touch your tongue to the roof of your mouth and hum: 'nnn'.", text_to_speak: "N. N is for Nest.",
    quiz: {
      question: "Which of these words starts with the letter 'N' sound, like in 'Nest'?",
      options: ["Nose", "Duck", "Whale"],
      answerIndex: 0,
      explanation: "Spot on! 'Nose' begins with the letter N sound (/n/), matching 'Nest'!"
    }
  },
  { 
    letter: "O", phoneme: "/oʊ/", word: "Owl", example: "O is for Owl", tip: "Round your lips into a small circle: 'oh' or 'ow'.", text_to_speak: "O. O is for Owl.",
    quiz: {
      question: "Which of these words starts with the letter 'O' sound, like in 'Owl'?",
      options: ["Orange", "Fish", "Bear"],
      answerIndex: 0,
      explanation: "Spot on! 'Orange' begins with the letter O sound, matching 'Owl'!"
    }
  },
  { 
    letter: "P", phoneme: "/piː/", word: "Penguin", example: "P is for Penguin", tip: "Close both lips tightly and pop air out softly without voice: 'puh'.", text_to_speak: "P. P is for Penguin.",
    quiz: {
      question: "Which of these words starts with the letter 'P' sound, like in 'Penguin'?",
      options: ["Panda", "Giraffe", "Tiger"],
      answerIndex: 0,
      explanation: "Spot on! 'Panda' begins with the letter P pop sound (/p/), matching 'Penguin'!"
    }
  },
  { 
    letter: "Q", phoneme: "/kjuː/", word: "Queen", example: "Q is for Queen", tip: "Round your lips quickly while making a 'kw' sound: 'kwuh'.", text_to_speak: "Q. Q is for Queen.",
    quiz: {
      question: "Which of these words starts with the letter 'Q' sound, like in 'Queen'?",
      options: ["Quiet", "Rabbit", "Sun"],
      answerIndex: 0,
      explanation: "Spot on! 'Quiet' begins with the letter Q sound (/kw/), matching 'Queen'!"
    }
  },
  { 
    letter: "R", phoneme: "/ɑːr/", word: "Rabbit", example: "R is for Rabbit", tip: "Curl your tongue slightly back without touching the roof: 'rrr'.", text_to_speak: "R. R is for Rabbit.",
    quiz: {
      question: "Which of these words starts with the letter 'R' sound, like in 'Rabbit'?",
      options: ["Rainbow", "Apple", "Monkey"],
      answerIndex: 0,
      explanation: "Spot on! 'Rainbow' begins with the letter R sound (/r/), matching 'Rabbit'!"
    }
  },
  { 
    letter: "S", phoneme: "/ɛs/", word: "Sun", example: "S is for Sun", tip: "Bring your teeth close together and hiss air through them: 'sss'.", text_to_speak: "S. S is for Sun.",
    quiz: {
      question: "Which of these words starts with the letter 'S' sound, like in 'Sun'?",
      options: ["Star", "Cat", "Dog"],
      answerIndex: 0,
      explanation: "Spot on! 'Star' begins with the letter S hiss sound (/s/), matching 'Sun'!"
    }
  },
  { 
    letter: "T", phoneme: "/tiː/", word: "Tiger", example: "T is for Tiger", tip: "Tap your tongue against your upper gum ridge: 'tuh'.", text_to_speak: "T. T is for Tiger.",
    quiz: {
      question: "Which of these words starts with the letter 'T' sound, like in 'Tiger'?",
      options: ["Turtle", "Lion", "Elephant"],
      answerIndex: 0,
      explanation: "Spot on! 'Turtle' begins with the letter T tap sound (/t/), matching 'Tiger'!"
    }
  },
  { 
    letter: "U", phoneme: "/juː/", word: "Umbrella", example: "U is for Umbrella", tip: "Relax your mouth and vocalize a short, gentle 'uh'.", text_to_speak: "U. U is for Umbrella.",
    quiz: {
      question: "Which of these words starts with the letter 'U' sound, like in 'Umbrella'?",
      options: ["Under", "Horse", "Fish"],
      answerIndex: 0,
      explanation: "Spot on! 'Under' begins with the short 'u' sound (/ʌ/), matching 'Umbrella'!"
    }
  },
  { 
    letter: "V", phoneme: "/viː/", word: "Violin", example: "V is for Violin", tip: "Touch upper teeth to lower lip and hum with your voice: 'vvv'.", text_to_speak: "V. V is for Violin.",
    quiz: {
      question: "Which of these words starts with the letter 'V' sound, like in 'Violin'?",
      options: ["Van", "Ball", "Cat"],
      answerIndex: 0,
      explanation: "Spot on! 'Van' begins with the buzzing letter V sound (/v/), matching 'Violin'!"
    }
  },
  { 
    letter: "W", phoneme: "/ˈdʌbəl.juː/", word: "Whale", example: "W is for Whale", tip: "Pucker your lips small and glide them open: 'wuh'.", text_to_speak: "W. W is for Whale.",
    quiz: {
      question: "Which of these words starts with the letter 'W' sound, like in 'Whale'?",
      options: ["Water", "Duck", "Zebra"],
      answerIndex: 0,
      explanation: "Spot on! 'Water' begins with the rounded letter W sound (/w/), matching 'Whale'!"
    }
  },
  { 
    letter: "X", phoneme: "/ɛks/", word: "Xylophone", example: "X is for Xylophone", tip: "Blend a 'k' and 's' sound ('ks') or make a buzzing 'z' sound.", text_to_speak: "X. X is for Xylophone.",
    quiz: {
      question: "Which of these words features the letter 'X' sound, like in 'Xylophone' or 'Fox'?",
      options: ["Box", "Sun", "Moon"],
      answerIndex: 0,
      explanation: "Spot on! 'Box' ends with the crisp 'ks' sound of the letter X!"
    }
  },
  { 
    letter: "Y", phoneme: "/waɪ/", word: "Yacht", example: "Y is for Yacht", tip: "Raise the middle of your tongue and glide smoothly: 'yuh'.", text_to_speak: "Y. Y is for Yacht.",
    quiz: {
      question: "Which of these words starts with the letter 'Y' sound, like in 'Yacht'?",
      options: ["Yellow", "Penguin", "Dog"],
      answerIndex: 0,
      explanation: "Spot on! 'Yellow' begins with the smooth letter Y glide (/j/), matching 'Yacht'!"
    }
  },
  { 
    letter: "Z", phoneme: "/ziː/", word: "Zebra", example: "Z is for Zebra", tip: "Bring teeth together and buzz your vocal cords like a bee: 'zzz'.", text_to_speak: "Z. Z is for Zebra.",
    quiz: {
      question: "Which of these words starts with the letter 'Z' sound, like in 'Zebra'?",
      options: ["Zoo", "Apple", "Tiger"],
      answerIndex: 0,
      explanation: "Spot on! 'Zoo' begins with the buzzing letter Z sound (/z/), matching 'Zebra'!"
    }
  }
];

const DARK_GRAPH_AXIS_LABEL = "#f8fafc";
const DARK_GRAPH_AXIS_TICK = "#94a3b8";
const DARK_GRAPH_AXIS_LINE = "#e2e8f0";

function darkGraphAxisTickLabelAttrs(extra) {
  return Object.assign({
    visible: true,
    strokeColor: DARK_GRAPH_AXIS_LABEL,
    highlightStrokeColor: DARK_GRAPH_AXIS_LABEL,
    cssStyle: `color: ${DARK_GRAPH_AXIS_LABEL};`,
    highlightCssStyle: `color: ${DARK_GRAPH_AXIS_LABEL};`
  }, extra || {});
}

function darkGraphDefaultAxes() {
  return {
    x: {
      strokeColor: DARK_GRAPH_AXIS_LINE,
      highlight: false,
      ticks: {
        strokeColor: DARK_GRAPH_AXIS_TICK,
        highlightStrokeColor: DARK_GRAPH_AXIS_TICK,
        drawLabels: true,
        drawZero: true,
        label: darkGraphAxisTickLabelAttrs()
      }
    },
    y: {
      strokeColor: DARK_GRAPH_AXIS_LINE,
      highlight: false,
      ticks: {
        strokeColor: DARK_GRAPH_AXIS_TICK,
        highlightStrokeColor: DARK_GRAPH_AXIS_TICK,
        drawLabels: true,
        drawZero: true,
        label: darkGraphAxisTickLabelAttrs({ anchorX: "right", anchorY: "middle" })
      }
    }
  };
}

function paintDarkGraphTickDom(root) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  root.querySelectorAll("svg text, .JXGtext").forEach((el) => {
    if (!el) return;
    if (el.tagName && el.tagName.toLowerCase() === "text") {
      el.setAttribute("fill", DARK_GRAPH_AXIS_LABEL);
      el.style.fill = DARK_GRAPH_AXIS_LABEL;
      el.style.color = DARK_GRAPH_AXIS_LABEL;
    } else {
      el.style.color = DARK_GRAPH_AXIS_LABEL;
      el.style.fill = DARK_GRAPH_AXIS_LABEL;
    }
  });
}

function applyDarkGraphAxisTicks(board) {
  if (!board || !board.defaultAxes) return;
  const labelAttrs = darkGraphAxisTickLabelAttrs();
  const tickAttrs = {
    strokeColor: DARK_GRAPH_AXIS_TICK,
    highlightStrokeColor: DARK_GRAPH_AXIS_TICK,
    drawLabels: true,
    drawZero: true,
    label: labelAttrs
  };
  ["x", "y"].forEach((key) => {
    const axis = board.defaultAxes[key];
    if (!axis) return;
    axis.setAttribute({
      strokeColor: DARK_GRAPH_AXIS_LINE,
      highlightStrokeColor: DARK_GRAPH_AXIS_LINE
    });
    if (axis.defaultTicks) {
      axis.defaultTicks.setAttribute(tickAttrs);
      const labels = axis.defaultTicks.labels;
      if (Array.isArray(labels)) {
        labels.forEach((lab) => {
          if (lab && typeof lab.setAttribute === "function") {
            lab.setAttribute(labelAttrs);
          }
        });
      }
    }
  });
  const root = board.containerObj
    || (typeof board.container === "string" ? document.getElementById(board.container) : board.container);
  paintDarkGraphTickDom(root);
}

function keepDarkGraphAxisTicks(board) {
  applyDarkGraphAxisTicks(board);
  if (!board || board._darkTickHook) return;
  board._darkTickHook = true;
  board.on("update", () => applyDarkGraphAxisTicks(board));
  requestAnimationFrame(() => applyDarkGraphAxisTicks(board));
}

const GANDAL_WB_GRAPH_ID = "gandal_wb_graph";

function cloneQuizItem(q) {
  return {
    question: q.question || "",
    options: Array.isArray(q.options) ? q.options.slice() : [],
    answerIndex: typeof q.answerIndex === "number" ? q.answerIndex
      : (typeof q.answer_index === "number" ? q.answer_index : 0),
    explanation: q.explanation || "",
    answered: false
  };
}

function isMetaQuizQuestion(q) {
  if (!q) return true;
  const blob = `${q.question || ""} ${(q.options || []).join(" ")} ${q.explanation || ""}`;
  return /current lesson|change subjects|change subject|ready to practice|naming triangle sides|only about\s*[πp]i|π and circles|pi and circles|jump to geometry|rest of the track|leave the track|switch to a new subject|what should you practice right now|which statement is true about|a good next step on|what is a good next step when you see a geometric figure|if you get a question wrong on|the rest of the track stays hidden|finished and we should change|name the given lengths/i.test(blob);
}

const PRACTICE_QUIZ_BANKS = {
  circle: [
    {
      question: "If a circle has a radius of $r = 5\\text{ cm}$, what is its area?",
      options: ["$25\\pi\\text{ cm}^2 \\approx 78.54\\text{ cm}^2$", "$10\\pi\\text{ cm}^2 \\approx 31.42\\text{ cm}^2$", "$50\\pi\\text{ cm}^2 \\approx 157.08\\text{ cm}^2$", "$5\\pi\\text{ cm}^2 \\approx 15.71\\text{ cm}^2$"],
      answerIndex: 0,
      explanation: "Area is $A = \\pi r^2 = 25\\pi$. $10\\pi$ is the circumference $2\\pi r$."
    },
    {
      question: "If $r = 4$, what is the diameter $d$?",
      options: ["$8$", "$4$", "$2$", "$16$"],
      answerIndex: 0,
      explanation: "Diameter is twice the radius: $d = 2r = 8$."
    },
    {
      question: "A circle has $r = 3$. What is its circumference $C$?",
      options: ["$6\\pi$", "$9\\pi$", "$3\\pi$", "$12\\pi$"],
      answerIndex: 0,
      explanation: "$C = 2\\pi r = 6\\pi$."
    },
    {
      question: "If you double the radius, what happens to the circumference?",
      options: ["It doubles", "It quadruples", "It stays the same", "It is halved"],
      answerIndex: 0,
      explanation: "$C = 2\\pi r$ is linear in $r$, so doubling $r$ doubles $C$. Area $A = \\pi r^2$ would quadruple."
    },
    {
      question: "The equation $x^2 + y^2 = 9$ describes a circle of radius…",
      options: ["$3$", "$9$", "$81$", "$\\sqrt{3}$"],
      answerIndex: 0,
      explanation: "$x^2 + y^2 = r^2$ with $r^2 = 9$ so $r = 3$."
    }
  ],
  triangle: [
    {
      question: "If a triangle has two angles measuring $55^\\circ$ and $65^\\circ$, what is the third angle?",
      options: ["$60^\\circ$", "$50^\\circ$", "$70^\\circ$", "$80^\\circ$"],
      answerIndex: 0,
      explanation: "$180^\\circ - (55^\\circ + 65^\\circ) = 60^\\circ$."
    },
    {
      question: "The sum of interior angles in any Euclidean triangle is…",
      options: ["$180^\\circ$", "$90^\\circ$", "$360^\\circ$", "$270^\\circ$"],
      answerIndex: 0,
      explanation: "The angle sum theorem: $\\angle A + \\angle B + \\angle C = 180^\\circ$."
    },
    {
      question: "An equilateral triangle has all angles equal to…",
      options: ["$60^\\circ$", "$45^\\circ$", "$90^\\circ$", "$120^\\circ$"],
      answerIndex: 0,
      explanation: "$180^\\circ / 3 = 60^\\circ$."
    },
    {
      question: "Can sides $3$, $4$, and $10$ form a triangle?",
      options: ["No — $3+4 < 10$", "Yes", "Only if it is right-angled", "Only if it is isosceles"],
      answerIndex: 0,
      explanation: "Triangle inequality: $a+b>c$. Here $3+4=7<10$."
    },
    {
      question: "A triangle has base $6$ and height $4$. What is its area?",
      options: ["$12$", "$24$", "$10$", "$8$"],
      answerIndex: 0,
      explanation: "$\\text{Area} = \\tfrac{1}{2}bh = \\tfrac{1}{2}\\cdot 6\\cdot 4 = 12$."
    }
  ],
  pythagoras: [
    {
      question: "A right triangle has legs $a=6$ and $b=8$. What is hypotenuse $c$?",
      options: ["$10$", "$14$", "$12$", "$48$"],
      answerIndex: 0,
      explanation: "$c=\\sqrt{6^2+8^2}=\\sqrt{100}=10$."
    },
    {
      question: "In a $3$-$4$-$5$ triangle, $3^2+4^2$ equals…",
      options: ["$5^2 = 25$", "$7$", "$12$", "$9$"],
      answerIndex: 0,
      explanation: "$9+16=25=5^2$."
    },
    {
      question: "The hypotenuse is always…",
      options: ["Opposite the right angle, and longest", "A leg of the right angle", "Equal to $a+b$", "Shorter than each leg"],
      answerIndex: 0,
      explanation: "Side $c$ opposite $90^\\circ$ is strictly the longest."
    },
    {
      question: "A right triangle has $a=5$, $c=13$. What is $b$?",
      options: ["$12$", "$8$", "$18$", "$\\sqrt{13}$"],
      answerIndex: 0,
      explanation: "$b=\\sqrt{c^2-a^2}=\\sqrt{169-25}=12$."
    },
    {
      question: "If $a^2+b^2=c^2$ with $a=b=1$, then $c$ is…",
      options: ["$\\sqrt{2}$", "$2$", "$1$", "$0$"],
      answerIndex: 0,
      explanation: "$c=\\sqrt{1+1}=\\sqrt{2}$."
    }
  ],
  ellipse: [
    {
      question: "The standard ellipse equation $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ has semi-axes…",
      options: ["$a$ and $b$", "$a+b$ and $a-b$", "Only $r$", "$\\pi a b$"],
      answerIndex: 0,
      explanation: "$a$ and $b$ are the semi-major / semi-minor axes."
    },
    {
      question: "If $a=b$ on an ellipse, the figure is…",
      options: ["A circle", "A parabola", "A hyperbola", "A rectangle"],
      answerIndex: 0,
      explanation: "Equal semi-axes recover $x^2+y^2=a^2$."
    },
    {
      question: "Linear eccentricity of an ellipse is $c=\\sqrt{|a^2-b^2|}$. The foci lie…",
      options: ["On the major axis, at $(\\pm c,0)$ if $a>b$", "At the origin only", "Outside $x=\\pm a$ always", "On the directrix"],
      answerIndex: 0,
      explanation: "Foci are inside the ellipse along the longer axis."
    },
    {
      question: "Area of an ellipse is…",
      options: ["$\\pi a b$", "$2\\pi a$", "$\\pi a^2$", "$ab$"],
      answerIndex: 0,
      explanation: "The circle area $\\pi r^2$ generalizes to $\\pi a b$."
    },
    {
      question: "For $a=5$, $b=4$, $c=\\sqrt{a^2-b^2}$ equals…",
      options: ["$3$", "$1$", "$\\sqrt{41}$", "$9$"],
      answerIndex: 0,
      explanation: "$\\sqrt{25-16}=\\sqrt{9}=3$."
    }
  ],
  rectangle: [
    {
      question: "A rectangle has length $\\ell=5$ and width $w=3$. What is its area?",
      options: ["$15$", "$16$", "$8$", "$30$"],
      answerIndex: 0,
      explanation: "Area $= \\ell w = 15$."
    },
    {
      question: "Perimeter of a rectangle is…",
      options: ["$2(\\ell+w)$", "$\\ell w$", "$\\ell+w$", "$4\\ell$"],
      answerIndex: 0,
      explanation: "Two lengths and two widths."
    },
    {
      question: "The diagonals of a rectangle are…",
      options: ["Equal", "Perpendicular but unequal", "Parallel", "Never equal unless it is a square"],
      answerIndex: 0,
      explanation: "Both diagonals equal $\\sqrt{\\ell^2+w^2}$."
    },
    {
      question: "If $\\ell=w$, the rectangle is a…",
      options: ["Square", "Rhombus that is not a square", "Circle", "Trapezoid"],
      answerIndex: 0,
      explanation: "Equal sides and right angles make a square."
    },
    {
      question: "A $6\\times 8$ rectangle has diagonal…",
      options: ["$10$", "$14$", "$48$", "$7$"],
      answerIndex: 0,
      explanation: "$\\sqrt{36+64}=10$."
    }
  ],
  square: [
    {
      question: "A square of side $s=4$ has area…",
      options: ["$16$", "$8$", "$12$", "$4$"],
      answerIndex: 0,
      explanation: "Area $= s^2 = 16$."
    },
    {
      question: "Perimeter of a square is…",
      options: ["$4s$", "$s^2$", "$2s$", "$s\\sqrt{2}$"],
      answerIndex: 0,
      explanation: "Four equal sides."
    },
    {
      question: "Diagonal of a square of side $s$ is…",
      options: ["$s\\sqrt{2}$", "$2s$", "$s/2$", "$s^2$"],
      answerIndex: 0,
      explanation: "Pythagoras: $\\sqrt{s^2+s^2}=s\\sqrt{2}$."
    },
    {
      question: "Every square is a rectangle. Is every rectangle a square?",
      options: ["No", "Yes", "Only if $\\ell=2w$", "Only in 3D"],
      answerIndex: 0,
      explanation: "A square is the special rectangle with $\\ell=w$."
    },
    {
      question: "If you double the side of a square, area…",
      options: ["Quadruples", "Doubles", "Stays the same", "Is multiplied by $2\\sqrt{2}$"],
      answerIndex: 0,
      explanation: "$(2s)^2 = 4s^2$."
    }
  ],
  polygon: [
    {
      question: "A regular hexagon has how many sides?",
      options: ["$6$", "$5$", "$8$", "$4$"],
      answerIndex: 0,
      explanation: "Hexa- means six."
    },
    {
      question: "Interior angle sum of a convex $n$-gon is…",
      options: ["$(n-2)180^\\circ$", "$n\\cdot 180^\\circ$", "$360^\\circ$", "$n\\cdot 90^\\circ$"],
      answerIndex: 0,
      explanation: "Split into $n-2$ triangles."
    },
    {
      question: "Each interior angle of a regular pentagon is…",
      options: ["$108^\\circ$", "$90^\\circ$", "$120^\\circ$", "$72^\\circ$"],
      answerIndex: 0,
      explanation: "$(5-2)180^\\circ/5 = 108^\\circ$."
    },
    {
      question: "A regular polygon with $n=4$ is a…",
      options: ["Square", "Equilateral triangle", "Hexagon", "Circle"],
      answerIndex: 0,
      explanation: "Four equal sides and equal angles."
    },
    {
      question: "Circumradius $R$ of a regular $n$-gon with side $s$ is…",
      options: ["$R = s / (2\\sin(\\pi/n))$", "$R = ns$", "$R = s/n$", "$R = 2s$"],
      answerIndex: 0,
      explanation: "Central angle $2\\pi/n$ bisects each side."
    }
  ],
  counting: [
    {
      question: "The number 4 means how many things?",
      options: ["4", "3", "5", "10"],
      answerIndex: 0,
      explanation: "The numeral 4 stands for four things — four dots in that row."
    },
    {
      question: "How many dots should stand next to the number 1?",
      options: ["1", "0", "2", "10"],
      answerIndex: 0,
      explanation: "One means a single thing — one dot."
    },
    {
      question: "Which number has more dots: 7 or 5?",
      options: ["7", "5", "They have the same", "Neither has dots"],
      answerIndex: 0,
      explanation: "7 is a bigger quantity than 5, so it has more dots."
    },
    {
      question: "What comes right after 9 when you count to 20?",
      options: ["10", "8", "19", "11"],
      answerIndex: 0,
      explanation: "After 9 you say 10."
    },
    {
      question: "If you add one more object to a group of 6, how many do you have?",
      options: ["7", "6", "5", "16"],
      answerIndex: 0,
      explanation: "Counting on by one: 6 and one more is 7."
    }
  ],
  default: [
    {
      question: "What is a good next step when you see a geometric figure?",
      options: ["Name the given lengths and what you must find", "Ignore the labels", "Assume every angle is $90^\\circ$", "Multiply all sides"],
      answerIndex: 0,
      explanation: "Socratic geometry starts from the given data."
    },
    {
      question: "If a formula has $\\pi$, the figure is most likely related to…",
      options: ["A circle or ellipse", "A square only", "A triangle only", "A line"],
      answerIndex: 0,
      explanation: "$\\pi$ appears in round-figure perimeter and area."
    },
    {
      question: "Changing one side of a triangle can change…",
      options: ["Angles and the other sides' roles via constraints", "Nothing else", "Only the color", "$\\pi$"],
      answerIndex: 0,
      explanation: "Sides and angles are coupled."
    },
    {
      question: "A variable slider should…",
      options: ["Update the drawn figure", "Be a dead label", "Only change the title", "Reset the topic"],
      answerIndex: 0,
      explanation: "Controls exist to experiment with the model."
    },
    {
      question: "The Cartesian plane origin is the point…",
      options: ["$(0,0)$", "$(1,1)$", "$(0,1)$", "$(1,0)$"],
      answerIndex: 0,
      explanation: "Axes meet at the origin."
    }
  ]
};

function inferQuizBankKey(topic, modelType) {
  const t = `${topic || ""} ${modelType || ""}`.toLowerCase();
  if (/\bcount(?:ing)?\b/.test(t) && !/skip[\s-]?count/.test(t)) return "counting";
  if (/ellips/.test(t)) return "ellipse";
  if (/rectangl/.test(t)) return "rectangle";
  if (/\bsquare\b|carr[eé]/.test(t)) return "square";
  if (/pythagor|hypotenuse|right[\s-]?triangle|triangle rectangle/.test(t)) return "pythagoras";
  if (/triangle/.test(t)) return "triangle";
  if (/circle|cercle|radius|circumfer/.test(t)) return "circle";
  if (/hexagon|pentagon|octagon|regular polygon|n-gon/.test(t)) return "polygon";
  if (/alphabet|letter|phonic/.test(t)) return "alphabet";
  return "default";
}

function quizMatchesTrackTopic(quiz, track) {
  if (!quiz || !track) return false;
  const title = String(track.title || "").toLowerCase();
  const blob = `${quiz.question || ""} ${(quiz.options || []).join(" ")} ${quiz.explanation || ""}`.toLowerCase();
  if (title && blob.indexOf(title) >= 0) return true;
  if (track.id === "math.k2.counting" || /counting to \d+/i.test(track.title || "")) {
    return /\b(count|dot|how many|number|object|quantity|numeral)\b/i.test(blob)
      && !/geometric figure/i.test(blob);
  }
  const words = title.split(/\s+/).filter((w) => w.length > 2);
  return words.some((w) => blob.indexOf(w) >= 0);
}

function buildTrackTopicQuizBank(topic) {
  const title = ((topic && topic.title) || topic || "this topic").toString().trim() || "this topic";
  const band = (topic && topic.band) ? ` (${topic.band})` : "";
  return [
    {
      question: `What should you practice right now?`,
      options: [title, "A random geometric figure", "A different track topic", "Skipping this lesson"],
      answerIndex: 0,
      explanation: `This track is on one topic: ${title}.`
    },
    {
      question: `Which statement is true about "${title}"?`,
      options: [
        `It is the current lesson${band}.`,
        "It is about naming triangle sides.",
        "It is only about π and circles.",
        "It is finished and we should change subjects."
      ],
      answerIndex: 0,
      explanation: `Stay with ${title} until you quiz and advance.`
    },
    {
      question: `A good next step on "${title}" is to…`,
      options: [
        "Check you understand this topic, then take the quiz",
        "Name the given lengths on a geometric figure",
        "Assume every angle is 90°",
        "Switch to a new subject"
      ],
      answerIndex: 0,
      explanation: "One topic at a time."
    },
    {
      question: `If you get a question wrong on "${title}", you should…`,
      options: ["Retry this topic", "Jump to geometry", "Ignore the mistake", "Leave the track"],
      answerIndex: 0,
      explanation: "Misses stay on this topic and write a struggle."
    },
    {
      question: `The rest of the track stays hidden so you can focus on…`,
      options: [title, "Every geometry theorem at once", "The whole catalog", "A different subject"],
      answerIndex: 0,
      explanation: "One topic at a time."
    }
  ];
}

function looksLikeInlineCountingChart(text) {
  if (!text) return false;
  const matches = String(text).match(/\d+\s*:\s*[●•○◉⚫⬤]+/g);
  return !!(matches && matches.length >= 2);
}

function stripInlineCountingChart(text) {
  if (!text) return "";
  return String(text)
    .replace(/(?:\d+\s*:\s*[●•○◉⚫⬤]+\s*)+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCountingMax(comp) {
  const n = Number(comp && comp.count);
  if (Number.isFinite(n) && n >= 1 && n <= 20) return Math.floor(n);
  const blob = `${(comp && comp.formula) || ""} ${(comp && comp.description) || ""} ${(comp && comp.title) || ""}`;
  const toMatch = blob.match(/count(?:ing)?\s+to\s+(\d+)/i);
  if (toMatch) {
    const v = parseInt(toMatch[1], 10);
    if (v >= 1 && v <= 20) return v;
  }
  let maxN = 0;
  const re = /(\d+)\s*:\s*[●•○◉⚫⬤]/g;
  let m;
  while ((m = re.exec(blob))) {
    const v = parseInt(m[1], 10);
    if (v > maxN) maxN = v;
  }
  if (maxN >= 1) return Math.min(20, maxN);
  return 20;
}

function isCountingGraph(comp) {
  if (!comp || typeof comp !== "object") return false;
  const mt = String(comp.model_type || "").toLowerCase();
  if (mt === "counting" || mt === "count_dots" || mt === "count") return true;
  if (mt.indexOf("geometry_") === 0 || mt.indexOf("physics_") === 0 || mt.indexOf("chemistry_") === 0) {
    return false;
  }
  if (mt === "compare") return false;
  const blob = `${comp.formula || ""} ${comp.description || ""} ${comp.title || ""}`;
  if (/skip[\s-]?count/i.test(blob) && !looksLikeInlineCountingChart(blob)) return false;
  if (looksLikeInlineCountingChart(blob)) return true;
  if (/count(?:ing)?\s+to\s+\d+/i.test(blob)) return true;
  if (/each number represents a quantity/i.test(blob)) return true;
  return false;
}

function isComparingNumbersTopic(topic, extra) {
  const t = `${topic || ""} ${extra || ""}`.toLowerCase();
  if (/math\.k2\.compare\b/.test(t)) return true;
  if (/compar(?:e|ing)\s+numbers/.test(t)) return true;
  if (/\bgreater than\b|\bless than\b/.test(t) && /\bnumbers?\b/.test(t) && !/fraction|length|weight|capacity/.test(t)) {
    return true;
  }
  return false;
}

function isComparingGraph(comp, topic) {
  if (comp && String(comp.model_type || "").toLowerCase() === "compare") return true;
  const blob = `${(comp && comp.title) || ""} ${(comp && comp.formula) || ""} ${(comp && comp.description) || ""} ${topic || ""}`;
  if (isCountingGraph(comp) && !isComparingNumbersTopic(blob)) return false;
  return isComparingNumbersTopic(blob);
}

function parseComparePair(comp, topic) {
  const leftN = Number(comp && comp.left);
  const rightN = Number(comp && comp.right);
  if (Number.isFinite(leftN) && Number.isFinite(rightN) && leftN !== rightN) {
    return { left: Math.round(leftN), right: Math.round(rightN) };
  }
  const blob = `${(comp && comp.formula) || ""} ${topic || ""}`;
  const nums = [];
  const re = /\b(\d{1,2})\b/g;
  let m;
  while ((m = re.exec(blob))) {
    const v = parseInt(m[1], 10);
    if (v >= 0 && v <= 20) nums.push(v);
  }
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] !== nums[i + 1]) return { left: nums[i], right: nums[i + 1] };
  }
  return { left: 5, right: 10 };
}

function compareGraphComp(topic, comp) {
  const pair = parseComparePair(comp || {}, topic);
  const symbol = pair.left > pair.right ? ">" : pair.left < pair.right ? "<" : "=";
  return {
    model_type: "compare",
    left: pair.left,
    right: pair.right,
    title: (comp && comp.title) || "Comparing numbers",
    formula: `${pair.left} ${symbol} ${pair.right}`,
    description: (comp && comp.description) || `${pair.left} vs ${pair.right}. The taller tower is greater.`
  };
}

function inferGeometryModelType(comp, topic) {
  const t = `${topic || ""} ${(comp && comp.model_type) || ""} ${(comp && comp.formula) || ""} ${(comp && comp.title) || ""}`.toLowerCase();
  if (/ellips/.test(t)) return "geometry_ellipse";
  if (/rectangl/.test(t)) return "geometry_rectangle";
  if (/\bsquare\b|carr[eé]/.test(t)) return "geometry_square";
  if (/pythagor|hypotenuse|right[\s-]?triangle|triangle rectangle/.test(t)) return "geometry_pythagoras";
  if (/triangle/.test(t)) return "geometry_triangle";
  if (/circle|cercle|radius|circumfer/.test(t)) return "geometry_circle";
  if (/hexagon|pentagon|octagon|regular polygon|n-gon/.test(t)) return "geometry_polygon";
  if (comp && typeof comp.model_type === "string" && comp.model_type.indexOf("geometry_") === 0) {
    return comp.model_type;
  }
  return (comp && comp.model_type) || null;
}

function inferGeometryVarSpecs(modelType, values) {
  const v = values || {};
  if (modelType === "geometry_circle") {
    return [
      { key: "r", label: "r", min: 0.5, max: 8, step: 0.1, value: v.r ?? 3 },
      { key: "d", label: "d", min: 1, max: 16, step: 0.1, value: v.d ?? 6 },
      { key: "pi", label: "π", min: 3.0, max: 3.2, step: 0.01, value: v.pi ?? 3.14 },
      { key: "c", label: "C", min: 3, max: 50, step: 0.1, value: v.c ?? 18.84 }
    ];
  }
  if (modelType === "geometry_triangle") {
    return [
      { key: "a", label: "a", min: 0.8, max: 8, step: 0.1, value: v.a ?? 4.19 },
      { key: "b", label: "b", min: 0.8, max: 8, step: 0.1, value: v.b ?? 3.67 },
      { key: "c", label: "c", min: 0.8, max: 8, step: 0.1, value: v.c ?? 4.5 }
    ];
  }
  if (modelType === "geometry_pythagoras") {
    return [
      { key: "a", label: "a", min: 1, max: 7, step: 0.1, value: v.a ?? 4 },
      { key: "b", label: "b", min: 1, max: 7, step: 0.1, value: v.b ?? 3 },
      { key: "c", label: "c", min: 1, max: 10, step: 0.1, value: v.c ?? 5, readonly: true }
    ];
  }
  if (modelType === "geometry_ellipse") {
    return [
      { key: "a", label: "a", min: 0.5, max: 6, step: 0.1, value: v.a ?? 4 },
      { key: "b", label: "b", min: 0.5, max: 6, step: 0.1, value: v.b ?? 2 },
      { key: "f", label: "c (foci)", min: 0, max: 6, step: 0.1, value: v.f ?? 3.46, readonly: true }
    ];
  }
  if (modelType === "geometry_rectangle") {
    return [
      { key: "l", label: "ℓ", min: 0.5, max: 8, step: 0.1, value: v.l ?? 5 },
      { key: "w", label: "w", min: 0.5, max: 8, step: 0.1, value: v.w ?? 3 }
    ];
  }
  if (modelType === "geometry_square") {
    return [
      { key: "s", label: "s", min: 0.5, max: 8, step: 0.1, value: v.s ?? 3 }
    ];
  }
  if (modelType === "geometry_polygon") {
    return [
      { key: "n", label: "n", min: 3, max: 12, step: 1, value: v.n ?? 6 },
      { key: "s", label: "s", min: 0.5, max: 5, step: 0.1, value: v.s ?? 2 }
    ];
  }
  return [];
}

function formatGeomVarValue(key, value) {
  if (key === "n") return String(Math.round(value));
  if (key === "pi") return Number(value).toFixed(2);
  return Number(value).toFixed(2);
}

function clampTriangleSides(a, b, c) {
  const min = 0.8;
  a = Math.max(min, a);
  b = Math.max(min, b);
  c = Math.max(min, c);
  if (a + b <= c) c = a + b - 0.12;
  if (a + c <= b) b = a + c - 0.12;
  if (b + c <= a) a = b + c - 0.12;
  return { a, b, c };
}

function sssTrianglePoints(a, b, c) {
  const sides = clampTriangleSides(a, b, c);
  a = sides.a; b = sides.b; c = sides.c;
  const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return {
    a, b, c,
    A: [0, 0],
    B: [c, 0],
    C: [b * cosA, b * sinA]
  };
}

class GandalSpaceClient {
  constructor(containerId = "gandalSpaceMountPoint") {
    this.containerId = containerId;
    this.container = null;
    this.activeQuizCardId = null;
    this.isRecording = false;           // Search bar dictation
    this.isConvoListening = false;     // Gandho conversational voice loop
    this.isGandhoSpeaking = false;     // Gandho TTS actively speaking
    this.isContinuousConvo = true;     // Continuous dialogue turn-after-turn
    this.recognition = null;
    this.convoRecognition = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.activeLetter = "A";
    this.activePhoneme = "/eɪ/";
    this.activeAlphabetIndex = 0;
    this.chatHistory = [];
    this.searchHistory = [];
    this.quizCards = {};
    this._wbFlipAnim = null;
    this._wbQuizCardId = null;
    this._wbQuizSet = [];
    this._wbQuizIndex = 0;
    this.trackMode = false;
    this.trackState = null;
    this._savedTrack = null;
    this._loadingTrackLesson = false;
    this._startingTrack = false;
    this._trackDelegateBound = false;
  }

  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`[GANDAL SPACE] Mount point #${this.containerId} not found.`);
      return;
    }
    this.renderSkeleton();
    this.bindTrackDelegation();
    window.startGandalK12Track = () => this.submitTrackIntent();
    window.gandalSpaceApp = this;
    this.checkEngineStatus();
    this.initSpeechRecognition();
    this.initConvoRecognition();
    this.refreshTrackState();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="gandal-space-wrapper">
        <!-- LEFT 70% PANE: ANSWERS & A2UI EXPLORATION -->
        <div class="gandal-space-answers-pane">
          <!-- Header & Status -->
          <header class="gandal-space-header">
            <div class="gandal-space-title-row">
              <h1 class="gandal-space-title">🪐 Gandal Space</h1>
              <span class="gandal-space-badge">Universal K-12+ AI</span>
            </div>
            <p class="gandal-space-subtitle">
              Explore any topic across mathematics, science, language, and the humanities powered by local-first edge intelligence with cloud fallback.
            </p>
            <div class="gandal-engine-status-bar" id="gandalStatusBar" hidden>
              <span class="status-dot edge-online" id="statusDot"></span>
              <span id="statusText">Checking intelligence engine...</span>
            </div>

            <!-- Starter Topic Chips (hidden while a K-12 track is active) -->
            <div class="gandal-quick-topics" id="gandalQuickTopics" style="margin-top: 6px;">
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('what is a sign function?')">📈 Sign Function sgn(x)</span>
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('area(x^2, 0, 2)')">📐 area(x^2, 0, 2)</span>
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('Practice reading the alphabet: Letter A')">🔤 Letter 'A' Phonics</span>
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('Explain Newton\\'s 2nd Law of Motion')">⚛️ Newton's 2nd Law</span>
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('How does Photosynthesis work?')">🌿 Photosynthesis</span>
              <span class="quick-topic-chip" onclick="window.gandalSpaceApp.selectPrompt('Summary of the French Revolution')">🏛️ French Revolution</span>
              <span class="quick-topic-chip gandal-track-chip" onclick="window.gandalSpaceApp.enterK12Track()">🎓 K-12 Track</span>
            </div>
            <div class="gandal-track-bar" id="gandalTrackBar" hidden>
              <div class="gandal-track-bar-main">
                <span class="gandal-track-kicker">K-12 track · one topic</span>
                <strong id="gandalTrackTitle">Mathematics</strong>
                <span id="gandalTrackMeta">Tell Gandho what you want to learn</span>
              </div>
              <div class="gandal-track-bar-actions">
                <button type="button" class="gandal-track-btn" id="gandalTrackLeaveBtn" data-track-leave="1">Leave track</button>
              </div>
            </div>
          </header>

          <!-- A2UI Dynamic Render Surface for Answers -->
          <main id="gandalA2UISurface"></main>
        </div>

        <!-- RIGHT 30% PANE: GANDHO AVATAR & VOICE COMPANION DOCK -->
        <aside class="gandal-space-companion-pane">
          <!-- Companion Header -->
          <div class="gandal-companion-header">
            <div class="gandal-companion-badge-row">
              <span class="gandal-companion-badge">🟣 Live Tutor</span>
              <div class="gandal-companion-status-row">
                <span class="status-dot edge-online" id="gandalCompanionDot"></span>
                <span id="gandalCompanionStatusText">Online &amp; Ready</span>
              </div>
            </div>
            <h2 class="gandal-companion-title">
              <span>Gandho</span>
            </h2>
          </div>

          <!-- 3D Avatar Mount Container -->
          <div class="gandal-avatar-wrapper">
            <div class="gandal-avatar-glow-ring" id="gandalAvatarGlowRing"></div>
            <div id="gandalSpaceAvatarContainer">
              <img 
                id="gandalFallbackAvatarImg" 
                src="/static/professor_evans_avatar.png" 
                onerror="this.onerror=null;this.src='/static/gandho_avatar.svg';" 
                alt="Gandho Avatar"
              />
            </div>
          </div>

          <!-- REDESIGNED CHAT / SEARCH INPUT BAR (BELOW AVATAR) -->
          <div class="gandal-companion-search-wrapper">
            <div class="gandal-search-bar-pill gandal-companion-pill" id="gandalSearchPill">
              <!-- Left Action Button '+' -->
              <button class="gandal-pill-btn-add" id="gandalAddBtn" title="Topic presets &amp; tools" onclick="window.gandalSpaceApp.toggleAddMenu(event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              <!-- Popup Menu for '+' -->
              <div class="gandal-add-menu" id="gandalAddMenu">
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('what is a sign function?')">📈 Math: Sign Function sgn(x)</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('area(x^2, 0, 2)')">📐 Calculus: area(x^2, 0, 2)</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('Practice reading the alphabet: Letter A')">🔤 Phonics: Letter 'A'</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('Explain Newton\\'s 2nd Law with examples')">⚛️ Physics: Newton's 2nd Law</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('How does photosynthesis work?')">🌿 Biology: Photosynthesis</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.selectPrompt('Summary of the French Revolution')">📜 History: French Revolution</div>
                <div class="gandal-add-item" onclick="window.gandalSpaceApp.openTrackIntake()">🎓 Start a K-12 track</div>
              </div>

              <!-- Main Input Field (Type or Speak Question) -->
              <input 
                type="text" 
                class="gandal-pill-input" 
                id="gandalQueryInput" 
                placeholder="Ask Gandho anything..."
                onkeydown="if(event.key==='Enter') window.gandalSpaceApp.submitQuery()"
              />

              <!-- Action Buttons: Search/Submit + Voice Mic -->
              <div class="gandal-pill-actions">
                <button class="gandal-pill-btn-search" id="gandalSearchBtn" title="Search / Ask Gandho (Enter)" onclick="window.gandalSpaceApp.submitQuery()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <button class="gandal-pill-btn-mic mic-glow-button" id="gandalConvoMicBtn" title="Voice Dialogue (Click to speak)" onclick="window.gandalSpaceApp.toggleGandhoVoice(event)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Compact Sub-bar: Status Text + Continuous Convo Switch -->
            <div class="gandal-companion-subbar">
              <div class="gandal-voice-state-text" id="gandalVoiceStateLabel">
                <span class="gandal-status-pulse-dot"></span>
                <span id="gandalVoiceStatusText">Tap mic to speak or press Enter</span>
              </div>
              <div class="gandal-convo-toggle-compact" title="Continuous voice dialogue: keep mic active turn-after-turn">
                <span class="gandal-toggle-text">Continuous</span>
                <label class="gandal-switch">
                  <input type="checkbox" id="gandalContinuousSwitch" checked onchange="window.gandalSpaceApp.toggleContinuous(this.checked)" />
                  <span class="gandal-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Quick Suggestion Chips -->
          <div class="gandal-quick-prompts">
            <span class="gandal-quick-prompt-chip" onclick="window.gandalSpaceApp.handleExplainSimpler()">💡 Explain simpler</span>
            <span class="gandal-quick-prompt-chip" onclick="window.gandalSpaceApp.handleRealExample()">🌍 Real example</span>
            <span class="gandal-quick-prompt-chip" onclick="window.gandalSpaceApp.handleQuizMe()">❓ Quiz me</span>
            <span class="gandal-quick-prompt-chip" onclick="window.gandalSpaceApp.handleShowGraph()">📈 Show graph</span>
          </div>

          <!-- Companion Sidebar Mode Tabs -->
          <div class="gandal-sidebar-mode-tabs">
            <button class="gandal-mode-tab active" id="gandalTabWhiteboard" onclick="window.gandalSpaceApp.switchCompanionTab('whiteboard')">📋 Tableau Noir</button>
            <button class="gandal-mode-tab" id="gandalTabChat" onclick="window.gandalSpaceApp.switchCompanionTab('chat')">💬 Dialogue</button>
          </div>

          <!-- TABLEAU NOIR SOCRATIQUE (Socratic Blackboard Canvas) -->
          <div class="gandal-whiteboard-card" id="gandalWhiteboardPane">
            <div class="gandal-whiteboard-header">
              <div class="gandal-whiteboard-title">
                <span class="gandal-chalk-icon">📋</span>
                <span>TABLEAU NOIR SOCRATIQUE</span>
              </div>
              <div class="gandal-whiteboard-meta">
                <span id="gandalWhiteboardStatus" class="gandal-whiteboard-status">En attente</span>
                <button class="gandal-whiteboard-minimize-btn" id="gandalWhiteboardDismissBtn" title="Réduire le tableau (Échap)" onclick="window.gandalSpaceApp.collapseWhiteboard()" style="display: none;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="4 14 10 14 10 20"></polyline>
                    <polyline points="20 10 14 10 14 4"></polyline>
                    <line x1="14" y1="10" x2="21" y2="3"></line>
                    <line x1="10" y1="14" x2="3" y2="21"></line>
                  </svg>
                  <span>Réduire</span>
                </button>
                <button class="gandal-whiteboard-expand-btn" id="gandalWhiteboardExpandBtn" title="Agrandir / Réduire le tableau" onclick="window.gandalSpaceApp.toggleWhiteboardExpansion()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>
                <button class="gandal-whiteboard-clear-btn" title="Effacer le tableau" onclick="window.gandalSpaceApp.clearWhiteboard()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div id="gandalWhiteboardText" class="gandal-whiteboard-content">
              <div class="gandal-chalk-welcome">
                <div class="gandal-chalk-welcome-title">Bienvenue dans Gandal Space !</div>
                <p>Posez votre question au micro ou choisissez une suggestion ci-dessus. Les explications, dérivations et formules mathématiques de Gandho s'afficheront ici en direct avec notation KaTeX.</p>
              </div>
            </div>
          </div>

          <!-- Live Conversation Feed (Scrollable Chat Feed - Hidden when in Tableau Noir tab) -->
          <div class="gandal-chat-feed" id="gandalChatFeed" style="display: none;">
            <div class="gandal-bubble gandho">
              <div class="gandal-bubble-author">Gandho</div>
              <span>Bonjour ! Je suis Gandho. Posez-moi vos questions ou explorez n'importe quel sujet au micro ou par écrit.</span>
            </div>
          </div>
        </aside>
      </div>
    `;

    // Close '+' menu when clicking outside
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("gandalAddMenu");
      const btn = document.getElementById("gandalAddBtn");
      if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("active");
      }
    });
  }

  toggleAddMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById("gandalAddMenu");
    if (menu) menu.classList.toggle("active");
  }

  selectPrompt(promptText) {
    const input = document.getElementById("gandalQueryInput");
    if (input) {
      input.value = promptText;
      const menu = document.getElementById("gandalAddMenu");
      if (menu) menu.classList.remove("active");
      this.submitQuery();
    }
  }

  async checkEngineStatus() {
    try {
      const resp = await fetch("/api/gandal_space/status");
      if (resp.ok) {
        const data = await resp.json();
        const dot = document.getElementById("statusDot");
        const text = document.getElementById("statusText");
        const compDot = document.getElementById("gandalCompanionDot");
        const compText = document.getElementById("gandalCompanionStatusText");

        const bar = document.getElementById("gandalStatusBar");
        if (data.local_edge && data.local_edge.available) {
          const modelName = data.local_edge.model || "gemma-4-e4b";
          if (bar) {
            bar.hidden = false;
            bar.removeAttribute("hidden");
          }
          if (dot) dot.className = "status-dot edge-online";
          if (text) text.innerHTML = `<strong>Edge/Gemma</strong>: ${escapeHtml(modelName)}`;
          if (compDot) compDot.className = "status-dot edge-online";
          if (compText) compText.innerText = "Edge/Gemma on :8080";
        } else if (data.cloud_fallback && data.cloud_fallback.available) {
          if (bar) {
            bar.hidden = true;
            bar.setAttribute("hidden", "");
          }
          if (compDot) compDot.className = "status-dot cloud-online";
          if (compText) compText.innerText = "Ready";
        } else {
          if (bar) {
            bar.hidden = false;
            bar.removeAttribute("hidden");
          }
          if (dot) dot.className = "status-dot offline";
          if (text) text.innerText = "Gemma 4 E4B not running on :8080";
          if (compDot) compDot.className = "status-dot offline";
          if (compText) compText.innerText = "Start LOCAL_LLM_URL (gemma-4-e4b) or set GOOGLE_API_KEY";
        }
      }
    } catch (e) {
      const dot = document.getElementById("statusDot");
      const text = document.getElementById("statusText");
      if (dot) dot.className = "status-dot offline";
      if (text) text.innerText = "Gemma 4 E4B not running on :8080";
    }
  }

  /* ------------------------------------------------------------------------
     ADDITIVE K-12 TRACK (one topic at a time; free ask still works)
     ------------------------------------------------------------------------ */
  rememberSavedTrack(data) {
    if (data && data.topic) this._savedTrack = data;
  }

  quizFocusTopic() {
    const live = this.trackState && this.trackState.topic;
    if (this.trackMode && live) return live;
    if (live) return live;
    const saved = this._savedTrack && this._savedTrack.topic;
    if (saved) return saved;
    return null;
  }

  applyTrackChrome() {
    const root = this.container || document;
    const chips = root.querySelector("#gandalQuickTopics");
    const bar = root.querySelector("#gandalTrackBar");
    const title = root.querySelector("#gandalTrackTitle");
    const meta = root.querySelector("#gandalTrackMeta");
    const topic = this.trackState && this.trackState.topic;
    if (this.trackMode && topic) {
      if (chips) chips.style.display = "none";
      if (bar) {
        bar.hidden = false;
        bar.removeAttribute("hidden");
      }
      if (title) title.innerText = `${topic.subject_title || "Mathematics"} · ${topic.title}`;
      if (meta) {
        meta.innerText = `${topic.band || ""} · ${topic.index + 1} of ${topic.total} · quiz then advance`;
      }
    } else {
      if (chips) chips.style.display = "";
      if (bar) {
        bar.hidden = true;
        bar.setAttribute("hidden", "");
      }
    }
  }

  async refreshTrackState() {
    try {
      const resp = await fetch("/api/gandal_space/tracks");
      if (!resp.ok) return;
      const data = await resp.json();
      this._trackCatalog = data.subjects || [];
      if (data.current && data.current.topic) {
        this.rememberSavedTrack(data.current);
      }
      this.applyTrackChrome();
    } catch (e) {
      console.warn("[GANDAL TRACK] status", e);
    }
  }

  async enterK12Track() {
    const menu = document.getElementById("gandalAddMenu");
    if (menu) menu.classList.remove("active");
    this.openTrackIntake();
    return false;
  }

  async resumeSavedTrack() {
    const saved = this._savedTrack;
    if (!saved || !saved.subject) {
      this.openTrackIntake();
      return false;
    }
    return this.startSelectedTrack(saved.subject, false);
  }

  openTrackIntake() {
    const menu = document.getElementById("gandalAddMenu");
    if (menu) menu.classList.remove("active");
    const surface = document.getElementById("gandalA2UISurface");
    if (!surface) return;
    const subjects = this._trackCatalog || [];
    const subjectBtns = (subjects.length ? subjects : [
      { id: "mathematics", title: "Mathematics", walkable: true },
      { id: "physics", title: "Physics", walkable: true },
      { id: "chemistry", title: "Chemistry", walkable: true },
      { id: "biology", title: "Biology", walkable: true },
      { id: "philosophy", title: "Philosophy", walkable: true },
      { id: "english", title: "English", walkable: true },
      { id: "french", title: "French", walkable: true }
    ]).map((s) => {
      const ready = s.walkable ? "ready" : "soon";
      return `<button type="button" class="gandal-track-subject ${ready}" data-subject="${escapeAttr(s.id)}">${escapeHtml(s.title)}${s.walkable ? "" : " · soon"}</button>`;
    }).join("");
    surface.innerHTML = `
      <div class="gandal-track-intake" id="gandalTrackIntake">
        <h3>What do you want to learn?</h3>
        <p>Tell Gandho the subject (and if you are starting from scratch). The full catalog stays hidden — you will see <strong>one topic</strong> at a time, then a quiz, then the next topic.</p>
        <div class="gandal-track-subjects" id="gandalTrackSubjects">${subjectBtns}</div>
        <label class="gandal-track-scratch">
          <input type="checkbox" id="gandalTrackFromScratch" />
          I am starting from scratch
        </label>
        <input type="text" id="gandalTrackIntentInput" class="gandal-track-intent-input" placeholder="e.g. I want to learn physics from scratch, or teach me the English alphabet" />
        <div class="gandal-track-intake-actions">
          <button type="button" class="gandal-track-btn primary" id="gandalTrackStartBtn" data-track-start="1">Start this topic</button>
        </div>
        <p class="gandal-track-error" id="gandalTrackIntakeError" hidden></p>
        <p class="gandal-track-footnote">Free ask, Quiz me, Show graph, and Tableau Noir stay available. All seven subjects walk K–12 one topic at a time.</p>
      </div>
    `;
    this.bindTrackIntake();
    this.appendGandhoBubble("What do you want to learn, and are you starting from scratch? Mathematics, Physics, Chemistry, Biology, Philosophy, English, and French are ready.");
  }

  bindTrackDelegation() {
    if (this._trackDelegateBound) return;
    this._trackDelegateBound = true;
    const onClick = (event) => {
      const leave = event.target && event.target.closest && event.target.closest("#gandalTrackLeaveBtn, [data-track-leave]");
      if (leave) {
        event.preventDefault();
        event.stopPropagation();
        this.leaveTrack();
        return;
      }
      const start = event.target && event.target.closest && event.target.closest("#gandalTrackStartBtn, [data-track-start]");
      if (start) {
        event.preventDefault();
        event.stopPropagation();
        this.submitTrackIntent();
        return;
      }
      const chip = event.target && event.target.closest && event.target.closest("#gandalTrackSubjects .gandal-track-subject");
      if (chip) {
        event.preventDefault();
        this.pickTrackSubject(chip.getAttribute("data-subject"), chip.classList.contains("ready"));
      }
    };
    document.addEventListener("click", onClick, true);
    const inputRoot = this.container || document;
    inputRoot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target && event.target.id === "gandalTrackIntentInput") {
        event.preventDefault();
        this.submitTrackIntent();
      }
    });
  }

  bindTrackIntake() {
    const scratchEl = document.getElementById("gandalTrackFromScratch");
    if (scratchEl) {
      scratchEl.addEventListener("change", () => {
        if (this._pendingTrackSubject) {
          this.pickTrackSubject(this._pendingTrackSubject, true);
        }
      });
    }
    this.pickTrackSubject(this._pendingTrackSubject || "mathematics", true);
  }

  markTrackStartPending(pending) {
    const btn = document.getElementById("gandalTrackStartBtn");
    if (!btn) return;
    btn.disabled = !!pending;
    btn.textContent = pending ? "Starting…" : "Start this topic";
  }

  showTrackIntakeError(message) {
    const err = document.getElementById("gandalTrackIntakeError");
    if (err) {
      err.hidden = !message;
      err.textContent = message || "";
    }
    if (message) this.appendGandhoBubble(message);
  }

  pickTrackSubject(subjectId, walkable) {
    this._pendingTrackSubject = subjectId;
    const input = document.getElementById("gandalTrackIntentInput");
    const scratchEl = document.getElementById("gandalTrackFromScratch");
    const fromScratch = !scratchEl || scratchEl.checked;
    document.querySelectorAll("#gandalTrackSubjects .gandal-track-subject").forEach((btn) => {
      btn.classList.toggle("selected", btn.getAttribute("data-subject") === subjectId);
    });
    if (input && walkable) {
      const base = subjectId === "mathematics" ? "I want to learn math" : `I want to learn ${subjectId}`;
      input.value = fromScratch ? `${base} from scratch` : base;
    }
    if (!walkable) {
      this.appendGandhoBubble(`${subjectId} is in the picker but not walkable yet.`);
    }
  }

  async submitTrackIntent(customMessage) {
    if (this._startingTrack) return false;
    this._startingTrack = true;
    this.markTrackStartPending(true);
    this.showTrackIntakeError("");
    try {
      const input = document.getElementById("gandalTrackIntentInput");
      const scratchEl = document.getElementById("gandalTrackFromScratch");
      const fromScratch = !scratchEl || scratchEl.checked;
      let message = (typeof customMessage === "string" && customMessage.trim()) ? customMessage.trim() : (input ? input.value.trim() : "");
      if (this._pendingTrackSubject) {
        return await this.startSelectedTrack(this._pendingTrackSubject, fromScratch);
      }
      if (!message) {
        message = fromScratch ? "I want to learn math from scratch" : "I want to learn math";
      } else if (fromScratch && !/scratch|début|zero|beginner/i.test(message)) {
        message = `${message} from scratch`;
      }
      const started = await this.applyTrackIntent(message);
      if (started) return true;
      return await this.startSelectedTrack("mathematics", fromScratch);
    } finally {
      this._startingTrack = false;
      this.markTrackStartPending(false);
    }
  }

  async startSelectedTrack(subjectId, fromScratch) {
    try {
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
      const resp = await fetch("/api/gandal_space/track/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId || "mathematics",
          from_scratch: !!fromScratch
        }),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (timer) clearTimeout(timer);
      const data = await resp.json();
      return this.activateTrackResult(data, !!fromScratch);
    } catch (e) {
      console.warn("[GANDAL TRACK] start", e);
      this.showTrackIntakeError("Could not start that topic. Is the classroom server running? Try Start this topic again.");
      return false;
    }
  }

  activateTrackResult(data, fromScratch) {
    if (!data || !data.success || !data.topic) {
      this.showTrackIntakeError((data && (data.reply || data.error)) || "Could not start that topic.");
      return true;
    }
    this.trackMode = true;
    this.trackState = data;
    this.rememberSavedTrack(data);
    this.applyTrackChrome();
    const topic = data.topic;
    const title = topic.subject_title || "this subject";
    this.appendGandhoBubble(data.reply || (fromScratch
      ? `We will start ${title} from the beginning. First topic only: ${topic.title} (${topic.band}). The rest of the track stays hidden. Quiz, then we move on.`
      : `One topic at a time: ${topic.title} (${topic.band}, ${(topic.index || 0) + 1} of ${topic.total}). Quiz when you are ready and I will advance you.`));
    if (topic.lesson_prompt) {
      this.loadTrackLesson(topic.lesson_prompt);
    }
    return true;
  }

  async applyTrackIntent(message) {
    try {
      const resp = await fetch("/api/gandal_space/track/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await resp.json();
      if (!data.matched) return false;
      return this.activateTrackResult(data, !!(data.from_scratch));
    } catch (e) {
      console.warn("[GANDAL TRACK] intent", e);
      return false;
    }
  }

  async loadTrackLesson(prompt) {
    this._loadingTrackLesson = true;
    try {
      await this.submitQuery(prompt, false);
    } finally {
      this._loadingTrackLesson = false;
    }
  }

  showHomeChrome() {
    this.trackMode = false;
    this.trackState = null;
    this._pendingTrackSubject = null;
    this.applyTrackChrome();
    const root = this.container || document;
    const surface = root.querySelector("#gandalA2UISurface");
    if (surface) surface.innerHTML = "";
  }

  async leaveTrack() {
    if (this.trackState && this.trackState.topic) this.rememberSavedTrack(this.trackState);
    this.showHomeChrome();
    this.appendGandhoBubble("Left the K-12 track. Free explore, Quiz me, Show graph, and Tableau Noir are still here.");
    try {
      await fetch("/api/gandal_space/track/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
    } catch (e) {}
  }

  async reportTrackQuiz(correct, question) {
    if (!this.trackMode || !this.trackState || !this.trackState.topic) return;
    try {
      const resp = await fetch("/api/gandal_space/track/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: this.trackState.topic.id,
          correct: !!correct,
          question: question || ""
        })
      });
      const data = await resp.json();
      if (!data.success) return;
      if (data.correct && data.advanced && data.topic) {
        this.trackState = data;
        this.rememberSavedTrack(data);
        this.applyTrackChrome();
        this.appendGandhoBubble(`Nice. Next topic only: ${data.topic.title}.`);
        const surface = document.getElementById("gandalA2UISurface");
        if (surface) {
          const btn = document.createElement("button");
          btn.className = "gandal-track-btn primary";
          btn.innerText = `Continue to ${data.topic.title}`;
          btn.onclick = () => this.loadTrackLesson(data.topic.lesson_prompt);
          const wrap = document.createElement("div");
          wrap.className = "gandal-track-advance";
          wrap.appendChild(btn);
          surface.appendChild(wrap);
        }
      } else if (data.correct && data.finished) {
        const doneTitle = (this.trackState && this.trackState.topic && this.trackState.topic.subject_title) || "this";
        this.appendGandhoBubble(`You reached the end of the ${doneTitle} track. Free-explore or pick another subject.`);
      } else if (!data.correct) {
        this.appendGandhoBubble("Recorded as a struggle in your OKF profile. Retry this quiz, then we advance.");
      }
    } catch (e) {
      console.warn("[GANDAL TRACK] quiz", e);
    }
  }

  /* ------------------------------------------------------------------------
     SEARCH BAR SPEECH RECOGNITION (Input text dictation)
     ------------------------------------------------------------------------ */
  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isRecording = true;
        const btn = document.getElementById("gandalMicBtn");
        if (btn) btn.classList.add("recording");
      };

      this.recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const input = document.getElementById("gandalQueryInput");
        if (input && transcript) {
          input.value = transcript;
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("[GANDAL SPACE] Search speech error:", event.error);
        this.stopMic();
      };

      this.recognition.onend = () => {
        this.stopMic();
        const input = document.getElementById("gandalQueryInput");
        if (input && input.value.trim().length > 0) {
          this.submitQuery();
        }
      };
    }
  }

  toggleMic(event) {
    this.toggleGandhoVoice(event);
  }

  stopMic() {
    this.isRecording = false;
    const btn = document.getElementById("gandalMicBtn");
    if (btn) btn.classList.remove("recording");
  }

  /* ------------------------------------------------------------------------
     GANDHO CONTINUOUS VOICE CONVERSATION SYSTEM
     ------------------------------------------------------------------------ */
  initConvoRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.convoRecognition = new SpeechRec();
      this.convoRecognition.continuous = false;
      this.convoRecognition.interimResults = true;
      this.convoRecognition.lang = "en-US";

      this.convoRecognition.onstart = () => {
        this.isConvoListening = true;
        this.setConvoStateUI("listening", "Listening... speak now");
        this.switchCompanionTab("whiteboard");
        this.expandWhiteboard(true);
      };

      this.convoRecognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        const input = document.getElementById("gandalQueryInput");
        if (input && (finalText || interimText)) {
          input.value = (finalText || interimText).trim();
        }
        if (finalText.trim()) {
          const spoken = finalText.trim();
          this.handleStudentVoiceInput(spoken);
          if (spoken.length > 3) {
            this.submitQuery(spoken, false);
          }
        }
      };

      this.convoRecognition.onerror = (event) => {
        console.warn("[GANDAL CONVO] Speech recognition error:", event.error);
        this.isConvoListening = false;
        if (event.error !== "no-speech") {
          this.setConvoStateUI("idle", "Tap mic to speak or press Enter");
        } else if (this.isContinuousConvo && !this.isGandhoSpeaking) {
          // In continuous mode, if silence/no-speech, quietly re-listen
          setTimeout(() => {
            if (this.isContinuousConvo && !this.isConvoListening && !this.isGandhoSpeaking) {
              this.startConvoRecognition();
            }
          }, 800);
        }
      };

      this.convoRecognition.onend = () => {
        this.isConvoListening = false;
        if (!this.isGandhoSpeaking) {
          this.setConvoStateUI("idle", "Tap mic to speak or press Enter");
        }
      };
    }
  }

  toggleGandhoVoice(event) {
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
    }
    // Coordinate with host application's LiveKit voice session (Gandho Realtime Voice)
    if (typeof window.toggleMicRaiseHand === "function") {
      window.toggleMicRaiseHand(event);
      const isLkActive = !!window.isConversationSessionActive;
      this.setConvoStateUI(isLkActive ? "listening" : "idle", isLkActive ? "Gandho listening..." : "Tap mic to speak or press Enter");
      if (isLkActive) {
        this.switchCompanionTab("whiteboard");
        this.expandWhiteboard(true);
      } else {
        this.collapseWhiteboard();
      }
      return;
    }

    // Built-in browser speech recognition + Gandho Socratic chat loop
    if (this.isConvoListening) {
      this.stopConvoRecognition();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      this.startConvoRecognition();
    }
  }

  startConvoRecognition() {
    if (!this.convoRecognition) {
      alert("Speech recognition is not supported in this browser. You can type to Gandho in the box below!");
      return;
    }
    try {
      this.convoRecognition.start();
    } catch (e) {
      this.isConvoListening = false;
      this.setConvoStateUI("idle", "Tap mic to speak or press Enter");
    }
  }

  stopConvoRecognition() {
    if (this.convoRecognition) {
      try { this.convoRecognition.stop(); } catch (e) {}
    }
    this.isConvoListening = false;
    this.setConvoStateUI("idle", "Tap mic to speak or press Enter");
    this.collapseWhiteboard();
  }

  setConvoStateUI(state, text) {
    const btn = document.getElementById("gandalConvoMicBtn");
    const statusText = document.getElementById("gandalVoiceStatusText");
    const label = document.getElementById("gandalVoiceStateLabel");
    const ring = document.getElementById("gandalAvatarGlowRing");

    if (btn) {
      btn.classList.remove("active", "loading", "recording");
      if (state === "listening") btn.classList.add("active", "recording");
      if (state === "thinking") btn.classList.add("loading");
    }
    if (statusText) {
      statusText.innerText = text;
    } else if (label) {
      label.innerText = text;
    }
    if (ring) {
      if (state === "speaking") {
        ring.classList.add("speaking");
      } else {
        ring.classList.remove("speaking");
      }
    }
  }

  toggleContinuous(checked) {
    this.isContinuousConvo = checked;
    if (checked && !this.isConvoListening && !this.isGandhoSpeaking) {
      this.startConvoRecognition();
    }
  }

  appendStudentBubble(text) {
    const chatFeed = document.getElementById("gandalChatFeed");
    if (!chatFeed) return;
    const studentBubble = document.createElement("div");
    studentBubble.className = "gandal-bubble student";
    studentBubble.innerHTML = `
      <div class="gandal-bubble-author">You</div>
      <span>${escapeHtml(text)}</span>
    `;
    chatFeed.appendChild(studentBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  appendGandhoBubble(text) {
    const chatFeed = document.getElementById("gandalChatFeed");
    if (!chatFeed) return;
    const gandhoBubble = document.createElement("div");
    gandhoBubble.className = "gandal-bubble gandho";
    gandhoBubble.innerHTML = `
      <div class="gandal-bubble-author">Gandho</div>
      <span>${escapeHtml(text)}</span>
    `;
    chatFeed.appendChild(gandhoBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  async handleStudentVoiceInput(message) {
    // 1. Append Student Bubble
    this.appendStudentBubble(message);
    if (await this.applyTrackIntent(message)) {
      this.setConvoStateUI("idle", "K-12 track");
      return;
    }

    // Update state to thinking
    this.setConvoStateUI("thinking", "Gandho is thinking...");

    // Record turn in history
    this.chatHistory.push({ role: "user", content: message });

    // 2. Fetch Socratic response from backend
    try {
      const resp = await fetch("/api/gandal_space/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          context: this.currentContext,
          history: this.chatHistory.slice(-6)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.error || "Gemma 4 E4B is not running on :8080.";
        this.chatHistory.push({ role: "assistant", content: reply });

        // 3. Append Gandho Bubble
        this.appendGandhoBubble(reply);

        // 4. Stream onto the Tableau Noir Socratique with full KaTeX formatting
        this.writeToWhiteboard(reply, "Gandho");
        if (data.success === false) {
          this.setConvoStateUI("idle", "Gemma not running");
          return;
        }
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      console.error("[GANDAL CONVO] Chat error:", err);
      this.setConvoStateUI("idle", "Tap mic to speak or press Enter");
    }
  }

  /* Safe Socratic State Animation — Browser mechanical speechSynthesis is disabled */
  speakGandhoReply(text) {
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    this.isGandhoSpeaking = true;
    this.setConvoStateUI("speaking", "Gandho explique...");
    setTimeout(() => {
      this.isGandhoSpeaking = false;
      this.setConvoStateUI("idle", "Gandho à votre écoute");
    }, Math.min(6000, Math.max(1500, (text || "").length * 35)));
  }

  /* ------------------------------------------------------------------------
     TABLEAU NOIR SOCRATIQUE (Socratic Blackboard with KaTeX formatting)
     ------------------------------------------------------------------------ */
  /* Helper to format vertical column arithmetic (l'addition posée en colonnes comme sur papier) */
  formatStackedAddition(numbers, operator = "+", result = null) {
    if (!numbers || numbers.length < 2) return "";
    let out = "\\begin{array}{cr}\n";
    for (let idx = 0; idx < numbers.length; idx++) {
      const num = String(numbers[idx]).trim();
      if (idx === numbers.length - 1) {
        out += `${operator} & ${num} \\\\\n`;
      } else {
        out += `  & ${num} \\\\\n`;
      }
    }
    out += "\\hline\n";
    if (result !== null && result !== undefined && String(result).trim() !== "") {
      out += `  & ${String(result).trim()}\n`;
    } else {
      const sum = numbers.reduce((acc, n) => acc + (parseInt(n, 10) || 0), 0);
      out += `  & ${sum}\n`;
    }
    out += "\\end{array}";
    return out;
  }

  /* Automatically detect multi-term additions (2, 3, 4+ numbers) and format vertically like on paper */
  convertAdditionsToStackedColumn(rawText) {
    if (!rawText || rawText.includes("\\begin{array}")) return rawText;

    // Detect patterns like: 12 + 10 = 22, 125 + 48 + 37 = 210, or 125 + 48 + 37
    const addPattern = /\b(\d{1,6}(?:\s*\+\s*\d{1,6}){1,5})(?:\s*=\s*(\d{1,8}))?\b/g;

    return rawText.replace(addPattern, (fullMatch, sumPart, resPart) => {
      const terms = sumPart.split("+").map(t => t.trim()).filter(t => t.length > 0);
      if (terms.length < 2) return fullMatch;

      const result = resPart ? resPart.trim() : terms.reduce((a, b) => parseInt(a, 10) + parseInt(b, 10), 0);
      const stacked = this.formatStackedAddition(terms, "+", result);
      return `${fullMatch}\n\n$$\n${stacked}\n$$\n`;
    });
  }

  formatMathWithKaTeX(rawText) {
    if (!rawText) return "";
    let text = rawText;

    // 0. Auto-convert multi-number additions to vertical column format if not already in array
    text = this.convertAdditionsToStackedColumn(text);

    // 1. Normalize LaTeX brackets \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

    // 2. Wrap naked LaTeX environments like \begin{array}...\end{array} in $$...$$ if not already wrapped
    text = text.replace(/(?<!\$)\\begin\{(array|matrix|pmatrix|bmatrix|aligned)\}([\s\S]*?)\\end\{\1\}(?!\$)/g, (match) => {
      return `\n$$\n${match}\n$$\n`;
    });

    // 3. Wrap naked equations like a^2 + b^2 = c^2 or a² + b² = c² in LaTeX delimiters
    text = text.replace(/(?<!\$)\b([a-zA-Z]\^2\s*\+\s*[a-zA-Z]\^2\s*=\s*[a-zA-Z]\^2)\b(?!\$)/g, '$$$1$$');
    text = text.replace(/(?<!\$)\b([a-zA-Z]²\s*\+\s*[a-zA-Z]²\s*=\s*[a-zA-Z]²)\b(?!\$)/g, '$$a^2 + b^2 = c^2$$');

    // 4. Use global renderMathSymbolsInHtml if available
    if (typeof window.renderMathSymbolsInHtml === "function") {
      try {
        return window.renderMathSymbolsInHtml(text);
      } catch (e) {
        console.warn("[GANDAL MATH] renderMathSymbolsInHtml notice:", e);
      }
    }

    // 5. Fallback to direct KaTeX if present
    if (typeof window.katex !== "undefined") {
      try {
        let out = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
          try {
            return window.katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false });
          } catch (err) {
            return match;
          }
        });
        out = out.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
          try {
            return window.katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false });
          } catch (err) {
            return match;
          }
        });
        return out;
      } catch (e) {}
    }

    return (typeof this.formatMarkdown === "function") ? this.formatMarkdown(text) : text;
  }

  initWhiteboardHoverListeners() {
    const wb = document.getElementById("gandalWhiteboardPane");
    if (!wb || wb._hoverInitialized) return;
    wb._hoverInitialized = true;
    wb.addEventListener("mouseenter", () => {
      this._isMouseOverWhiteboard = true;
      if (this._wbCollapseTimeout) {
        clearTimeout(this._wbCollapseTimeout);
        this._wbCollapseTimeout = null;
      }
    });
    wb.addEventListener("mouseleave", () => {
      this._isMouseOverWhiteboard = false;
      // Note: Auto-collapse on mouseleave is removed to give the student full control.
      // The student can manually collapse/dismiss when ready via "Réduire" or Escape.
    });

    // Support keyboard Escape to dismiss expanded whiteboard
    if (!this._escWhiteboardListenerAdded) {
      this._escWhiteboardListenerAdded = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const p = document.getElementById("gandalWhiteboardPane");
          if (p && p.classList.contains("expanded-explaining")) {
            this.collapseWhiteboard();
          }
        }
      });
    }
  }

  _moveTableauNoirToLeftDock(wbPane) {
    const wrapper = (wbPane && wbPane.closest(".gandal-space-wrapper")) || document.querySelector(".gandal-space-wrapper");
    if (!wbPane || !wrapper) return null;
    if (wbPane.parentElement !== wrapper) {
      this._wbHomeParent = wbPane.parentElement;
      this._wbHomeNext = wbPane.nextElementSibling;
      const companion = wrapper.querySelector(".gandal-space-companion-pane");
      wrapper.insertBefore(wbPane, companion || null);
    }
    wrapper.classList.add("tableau-explaining");
    return wrapper;
  }

  _restoreTableauNoirHome(wbPane) {
    const wrapper = (wbPane && wbPane.closest(".gandal-space-wrapper")) || document.querySelector(".gandal-space-wrapper");
    if (wbPane && this._wbHomeParent && wbPane.parentElement !== this._wbHomeParent) {
      if (this._wbHomeNext && this._wbHomeNext.parentNode === this._wbHomeParent) {
        this._wbHomeParent.insertBefore(wbPane, this._wbHomeNext);
      } else {
        this._wbHomeParent.appendChild(wbPane);
      }
    }
    if (wrapper) wrapper.classList.remove("tableau-explaining");
  }

  _playTableauFlip(wbPane, firstRect) {
    if (!wbPane || !firstRect) return;

    const run = () => {
      const lastRect = wbPane.getBoundingClientRect();
      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;
      const sx = firstRect.width / Math.max(1, lastRect.width);
      const sy = firstRect.height / Math.max(1, lastRect.height);
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Math.abs(sx - 1) < 0.05) {
        return false;
      }
      if (this._wbFlipAnim) {
        try { this._wbFlipAnim.cancel(); } catch (e) {}
        this._wbFlipAnim = null;
      }
      const invert = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      wbPane.style.transformOrigin = "top left";
      wbPane.style.willChange = "transform";
      // Invert immediately so the first paint stays at the origin slot
      wbPane.style.transform = invert;
      void wbPane.offsetWidth;
      if (typeof wbPane.animate === "function") {
        this._wbFlipAnim = wbPane.animate(
          [
            { transform: invert },
            { transform: "translate(0px, 0px) scale(1, 1)" }
          ],
          { duration: 440, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
        const clear = () => {
          wbPane.style.transform = "";
          wbPane.style.transformOrigin = "";
          wbPane.style.willChange = "";
          this._wbFlipAnim = null;
        };
        this._wbFlipAnim.addEventListener("finish", clear);
        this._wbFlipAnim.addEventListener("cancel", clear);
      } else {
        wbPane.style.transition = "transform 440ms cubic-bezier(0.16, 1, 0.3, 1)";
        wbPane.style.transform = "translate(0px, 0px) scale(1, 1)";
        setTimeout(() => {
          wbPane.style.transition = "";
          wbPane.style.transform = "";
          wbPane.style.transformOrigin = "";
          wbPane.style.willChange = "";
        }, 460);
      }
      return true;
    };

    if (!run()) {
      requestAnimationFrame(() => {
        if (!run()) requestAnimationFrame(run);
      });
    }
  }

  expandWhiteboard(isExplaining = true) {
    const wbPane = document.getElementById("gandalWhiteboardPane");
    const expandBtn = document.getElementById("gandalWhiteboardExpandBtn");
    const dismissBtn = document.getElementById("gandalWhiteboardDismissBtn");
    if (!wbPane) return;

    this.initWhiteboardHoverListeners();

    if (this._wbCollapseTimeout) {
      clearTimeout(this._wbCollapseTimeout);
      this._wbCollapseTimeout = null;
    }

    const wrapper = wbPane.closest(".gandal-space-wrapper") || document.querySelector(".gandal-space-wrapper");
    const alreadyDocked = wbPane.classList.contains("expanded-explaining") &&
      wrapper && wrapper.classList.contains("tableau-explaining") &&
      wbPane.parentElement === wrapper;
    if (alreadyDocked) return;

    const firstRect = wbPane.getBoundingClientRect();
    wbPane.classList.remove("sliding-down");
    this._moveTableauNoirToLeftDock(wbPane);
    wbPane.classList.add("expanded-explaining");
    const wrapperNow = document.querySelector(".gandal-space-wrapper");
    if (wrapperNow) void wrapperNow.offsetWidth;
    this._playTableauFlip(wbPane, firstRect);

    // Show dedicated manual "Réduire" button
    if (dismissBtn) {
      dismissBtn.style.display = "inline-flex";
    }

    if (expandBtn) {
      expandBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="4 14 10 14 10 20"></polyline>
          <polyline points="20 10 14 10 14 4"></polyline>
          <line x1="14" y1="10" x2="21" y2="3"></line>
          <line x1="10" y1="14" x2="3" y2="21"></line>
        </svg>
      `;
      expandBtn.title = "Réduire le tableau (Échap)";
    }
  }

  collapseWhiteboard() {
    const wbPane = document.getElementById("gandalWhiteboardPane");
    const expandBtn = document.getElementById("gandalWhiteboardExpandBtn");
    const dismissBtn = document.getElementById("gandalWhiteboardDismissBtn");
    if (!wbPane || !wbPane.classList.contains("expanded-explaining")) return;

    const firstRect = wbPane.getBoundingClientRect();
    wbPane.classList.add("sliding-down");
    wbPane.classList.remove("expanded-explaining");
    this._restoreTableauNoirHome(wbPane);
    void wbPane.offsetWidth;
    this._playTableauFlip(wbPane, firstRect);

    if (this._wbCollapseUiTimeout) {
      clearTimeout(this._wbCollapseUiTimeout);
    }
    this._wbCollapseUiTimeout = setTimeout(() => {
      wbPane.classList.remove("sliding-down");
      if (dismissBtn) {
        dismissBtn.style.display = "none";
      }
      if (expandBtn) {
        expandBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        `;
        expandBtn.title = "Agrandir le tableau";
      }
      this._wbCollapseUiTimeout = null;
    }, 440);
  }

  toggleWhiteboardExpansion() {
    const wbPane = document.getElementById("gandalWhiteboardPane");
    if (wbPane && wbPane.classList.contains("expanded-explaining")) {
      this.collapseWhiteboard();
    } else {
      this.expandWhiteboard(false);
    }
  }

  scheduleWhiteboardCollapse(delay = 7000) {
    if (this._wbCollapseTimeout) {
      clearTimeout(this._wbCollapseTimeout);
    }
    if (this._isMouseOverWhiteboard) {
      return;
    }
    this._wbCollapseTimeout = setTimeout(() => {
      this.collapseWhiteboard();
    }, delay);
  }

  writeToWhiteboard(text, author = "Gandho") {
    const wbPane = document.getElementById("gandalWhiteboardPane");
    const wbText = document.getElementById("gandalWhiteboardText");
    const wbStatus = document.getElementById("gandalWhiteboardStatus");
    if (!wbText) return;

    this.freeWhiteboardGraph();
    this._wbQuizCardId = null;

    // Ensure Tableau Noir tab is active
    this.switchCompanionTab("whiteboard");

    // Automatically slide up and expand while Gandho is explaining!
    this.expandWhiteboard(true);

    if (wbStatus) {
      wbStatus.innerText = "Gandho explique...";
      wbStatus.className = "gandal-whiteboard-status speaking";
    }

    if (this._wbTimeout) {
      clearTimeout(this._wbTimeout);
    }

    const clean = (typeof tidySpokenTranscript === "function") ? tidySpokenTranscript(text) : (text || "").trim();
    let i = 0;
    wbText.innerHTML = "";

    const stream = () => {
      if (i < clean.length) {
        i = Math.min(clean.length, i + 3);
        const sub = clean.substring(0, i);
        wbText.innerHTML = this.formatMathWithKaTeX(sub);
        wbText.scrollTop = wbText.scrollHeight;
        if (i < clean.length) {
          this._wbTimeout = setTimeout(stream, 18);
        } else {
          if (wbStatus) {
            wbStatus.innerText = "Explication affichée";
            wbStatus.className = "gandal-whiteboard-status completed";
          }
          // The whiteboard stays expanded so the student can read at their leisure.
          // Dismiss anytime via the "Réduire" button or Esc key.
        }
      }
    };
    stream();
  }

  clearWhiteboard() {
    this.freeWhiteboardGraph();
    this._wbQuizCardId = null;
    this._wbQuizSet = [];
    this._wbQuizIndex = 0;
    this.collapseWhiteboard();
    const wbText = document.getElementById("gandalWhiteboardText");
    const wbStatus = document.getElementById("gandalWhiteboardStatus");
    if (wbText) {
      wbText.innerHTML = `
        <div class="gandal-chalk-welcome">
          <div class="gandal-chalk-welcome-title">Tableau Noir effacé</div>
          <p>Posez votre prochaine question au micro ou choisissez une suggestion ci-dessus.</p>
        </div>
      `;
    }
    if (wbStatus) {
      wbStatus.innerText = "En attente";
      wbStatus.className = "gandal-whiteboard-status";
    }
  }

  switchCompanionTab(tabName) {
    const tabWb = document.getElementById("gandalTabWhiteboard");
    const tabChat = document.getElementById("gandalTabChat");
    const paneWb = document.getElementById("gandalWhiteboardPane");
    const paneChat = document.getElementById("gandalChatFeed");

    if (tabName === "whiteboard") {
      if (tabWb) tabWb.classList.add("active");
      if (tabChat) tabChat.classList.remove("active");
      if (paneWb) paneWb.style.display = "flex";
      if (paneChat) paneChat.style.display = "none";
    } else {
      this.collapseWhiteboard();
      if (tabWb) tabWb.classList.remove("active");
      if (tabChat) tabChat.classList.add("active");
      if (paneWb) paneWb.style.display = "none";
      if (paneChat) paneChat.style.display = "flex";
    }
  }

  /* ------------------------------------------------------------------------
     QUICK PROMPT ACTIONS (Graph Engine, Quiz Engine, Explanations)
     ------------------------------------------------------------------------ */
  freeWhiteboardGraph() {
    const viewport = document.getElementById(`${GANDAL_WB_GRAPH_ID}_viewport`);
    const board = viewport && viewport._jxgBoard;
    if (board && window.JXG && typeof window.JXG.JSXGraph.freeBoard === "function") {
      try { window.JXG.JSXGraph.freeBoard(board); } catch (e) {}
    }
    if (viewport) viewport._jxgBoard = null;
  }

  setWhiteboardStatus(text, className) {
    const wbStatus = document.getElementById("gandalWhiteboardStatus");
    if (!wbStatus) return;
    wbStatus.innerText = text;
    wbStatus.className = "gandal-whiteboard-status" + (className ? ` ${className}` : "");
  }

  setWhiteboardHtml(html, statusText, statusClass) {
    const wbText = document.getElementById("gandalWhiteboardText");
    if (!wbText) return;
    if (this._wbTimeout) {
      clearTimeout(this._wbTimeout);
      this._wbTimeout = null;
    }
    this.freeWhiteboardGraph();
    wbText.innerHTML = html;
    wbText.scrollTop = 0;
    if (statusText) this.setWhiteboardStatus(statusText, statusClass || "speaking");
  }

  openTableauNoir() {
    this.switchCompanionTab("whiteboard");
    this.expandWhiteboard(true);
  }

  highlightA2UICard(el) {
    if (!el) return;
    el.classList.remove("a2ui-card-highlight");
    void el.offsetWidth;
    el.classList.add("a2ui-card-highlight");
  }

  socraticGraphPrompt(comp, topic) {
    const model = (comp && comp.model_type) || "";
    if (model === "geometry_circle") {
      return "Voici le cercle $x^2 + y^2 = r^2$. Change $r$, $d$, $\\pi$ ou $C$ — le dessin doit suivre. Comment $C = 2\\pi r$ réagit-il ?";
    }
    if (model === "geometry_pythagoras") {
      return "Règle les jambes $a$ et $b$. Que devient $c = \\sqrt{a^2+b^2}$, et les carrés sur les côtés ?";
    }
    if (model === "geometry_triangle") {
      return "Les curseurs $a$, $b$, $c$ sont les côtés. Que se passe-t-il pour les angles si tu allonges un côté ?";
    }
    if (model === "geometry_ellipse") {
      return "Varie les semi-axes $a$ et $b$. Où vont les foyers $c = \\sqrt{|a^2-b^2|}$ ? Quand $a=b$, que vois-tu ?";
    }
    if (model === "geometry_rectangle") {
      return "Change la longueur $\\ell$ et la largeur $w$. Quand $\\ell=w$, quelle figure obtiens-tu ?";
    }
    if (model === "geometry_square") {
      return "Le seul paramètre est le côté $s$. Que font l'aire $s^2$ et la diagonale $s\\sqrt{2}$ ?";
    }
    if (model === "geometry_polygon") {
      return "Un polygone régulier : nombre de côtés $n$ et longueur $s$. Que devient l'angle central $2\\pi/n$ ?";
    }
    if (model === "compare") {
      const pair = parseComparePair(comp, topic);
      return `Deux tours : ${pair.left} et ${pair.right}. La plus haute est le plus grand nombre. Où sont-ils sur la droite numérique, et quel symbole (>, <, =) est vrai ?`;
    }
    if (model.startsWith("physics_")) {
      return `Observe ce modèle de **${topic}**. Que change un déplacement le long de la courbe — et que cela te dit-il physiquement ?`;
    }
    if (model.startsWith("chemistry_")) {
      return `Lis ce graphe de **${topic}**. Quel point ou quelle région est le plus important, et pourquoi ?`;
    }
    return `Voici le graphe de **${topic}**. Choisis un point, dis ce qu'il représente, puis formule une question de suivi.`;
  }

  geometryCompForTopic(comp, topic) {
    const inferred = inferGeometryModelType(comp, topic);
    const base = (comp && typeof comp === "object") ? Object.assign({}, comp) : {};
    if (inferred) base.model_type = inferred;
    if (!base.domain) {
      if (inferred === "geometry_pythagoras") { base.domain = [-5, 9]; base.range = [-6, 9]; }
      else if (inferred === "geometry_ellipse") { base.domain = [-6, 6]; base.range = [-4, 4]; }
      else if (inferred === "geometry_polygon") { base.domain = [-5, 5]; base.range = [-5, 5]; }
      else { base.domain = [-5, 5]; base.range = [-5, 5]; }
    }
    return base;
  }

  bindGeometryControls(cardId, modelType, values, onUserChange) {
    const host = document.getElementById(`${cardId}_vars`);
    const specs = inferGeometryVarSpecs(modelType, values);
    if (!host || !specs.length) {
      if (host) {
        host.innerHTML = "";
        host.style.display = "none";
      }
      return { lock: false, values, sync() {} };
    }
    host.style.display = "";
    host.innerHTML = specs.map((s) => {
      const val = formatGeomVarValue(s.key, values[s.key] ?? s.value);
      if (s.readonly) {
        return `<div class="gandal-wb-geom-var">
          <div class="gandal-wb-geom-var-top"><span>${s.label}</span><span id="${cardId}_var_${s.key}_out">${val}</span></div>
        </div>`;
      }
      return `<div class="gandal-wb-geom-var">
        <div class="gandal-wb-geom-var-top"><label for="${cardId}_var_${s.key}">${s.label}</label><span id="${cardId}_var_${s.key}_out">${val}</span></div>
        <input type="range" id="${cardId}_var_${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${values[s.key] ?? s.value}" />
      </div>`;
    }).join("");
    const api = {
      lock: false,
      values,
      sync() {
        specs.forEach((s) => {
          const input = document.getElementById(`${cardId}_var_${s.key}`);
          const out = document.getElementById(`${cardId}_var_${s.key}_out`);
          const shown = formatGeomVarValue(s.key, values[s.key]);
          if (input && !s.readonly && document.activeElement !== input) {
            input.value = String(values[s.key]);
          } else if (input && !s.readonly) {
            input.value = String(values[s.key]);
          }
          if (out) out.textContent = shown;
        });
      }
    };
    specs.forEach((s) => {
      if (s.readonly) return;
      const input = document.getElementById(`${cardId}_var_${s.key}`);
      if (!input) return;
      input.addEventListener("input", () => {
        if (api.lock) return;
        const raw = s.key === "n" ? parseInt(input.value, 10) : parseFloat(input.value);
        onUserChange(s.key, raw);
        api.sync();
      });
    });
    api.sync();
    return api;
  }

  presentGraphOnTableau(comp, topic) {
    if (isComparingGraph(comp, topic) || isComparingNumbersTopic(topic)) {
      this.presentCompareGraphOnTableau(compareGraphComp(topic, comp), topic);
      return;
    }
    this._wbQuizCardId = null;
    const wbPane = document.getElementById("gandalWhiteboardPane");
    const wrapper = document.querySelector(".gandal-space-wrapper");
    const alreadyDocked = !!(wbPane && wbPane.classList.contains("expanded-explaining")
      && wrapper && wrapper.classList.contains("tableau-explaining"));
    this.openTableauNoir();
    const prompt = this.socraticGraphPrompt(comp, topic);
    const html = `
      <div class="gandal-wb-socratic">
        <div class="gandal-wb-kicker">📈 Question socratique — graphe</div>
        <div class="gandal-wb-question">${this.formatMathWithKaTeX(prompt)}</div>
        <div class="gandal-wb-geom-vars" id="${GANDAL_WB_GRAPH_ID}_vars"></div>
        <div class="a2ui-graph-viewport-wrapper gandal-wb-graph-wrap">
          <div class="a2ui-graph-viewport gandal-wb-graph-viewport" id="${GANDAL_WB_GRAPH_ID}_viewport">
            <canvas id="${GANDAL_WB_GRAPH_ID}_canvas" class="a2ui-graph-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
    this.setWhiteboardHtml(html, "Graphe sur le tableau", "speaking");
    const resizeBoard = () => {
      const viewport = document.getElementById(`${GANDAL_WB_GRAPH_ID}_viewport`);
      const board = viewport && viewport._jxgBoard;
      if (board && typeof board.resizeContainer === "function") {
        try { board.resizeContainer(); } catch (e) {}
      }
      keepDarkGraphAxisTicks(board);
    };
    const mount = () => {
      this._wbGraphMountTimer = null;
      this.initGraphPlot(GANDAL_WB_GRAPH_ID, comp);
      resizeBoard();
      this.setWhiteboardStatus("Graphe affiché", "completed");
      if (!alreadyDocked) setTimeout(resizeBoard, 80);
    };
    if (this._wbGraphMountTimer) clearTimeout(this._wbGraphMountTimer);
    this._wbGraphMountTimer = setTimeout(mount, alreadyDocked ? 80 : 480);
  }

  presentQuizOnTableau(cardId) {
    const quiz = this.quizCards[cardId];
    if (!quiz) return false;
    this._wbQuizSet = [cloneQuizItem(quiz)];
    this._wbQuizIndex = 0;
    return this.presentCurrentTableauQuiz();
  }

  buildPracticeQuizSet(topic, modelType, existingQuiz) {
    const trackTopic = this.quizFocusTopic && this.quizFocusTopic();
    const quizTopic = (trackTopic && trackTopic.title) || topic;
    let key = inferQuizBankKey(quizTopic, modelType);
    if (trackTopic && (trackTopic.id === "math.k2.counting" || /counting to \d+/i.test(trackTopic.title || ""))) {
      key = "counting";
    }
    let bank = PRACTICE_QUIZ_BANKS[key];
    if (key === "alphabet") {
      const start = this.activeAlphabetIndex || 0;
      bank = GANDAL_ALPHABET_DICTIONARY.slice(start, start + 5).map((item) => ({
        question: (item.quiz && item.quiz.question) || `Which word starts with ${item.letter}?`,
        options: (item.quiz && item.quiz.options) || [item.word, "Apple", "Ball"],
        answerIndex: (item.quiz && item.quiz.answerIndex) || 0,
        explanation: (item.quiz && item.quiz.explanation) || ""
      }));
    }
    if (trackTopic && (key === "default" || !bank || !bank.length)) {
      bank = buildTrackTopicQuizBank(trackTopic);
    }
    if (!bank || !bank.length) bank = PRACTICE_QUIZ_BANKS.default;
    const set = [];
    const seen = new Set();
    const push = (q) => {
      if (!q || !q.question || seen.has(q.question) || set.length >= 5) return;
      seen.add(q.question);
      set.push(cloneQuizItem(q));
    };
    if (existingQuiz && (!trackTopic || quizMatchesTrackTopic(existingQuiz, trackTopic))) push(existingQuiz);
    bank.forEach(push);
    const geometryKeys = {
      circle: 1, triangle: 1, pythagoras: 1, ellipse: 1,
      rectangle: 1, square: 1, polygon: 1, default: 1
    };
    if (trackTopic) {
      buildTrackTopicQuizBank(trackTopic).forEach(push);
    } else if (geometryKeys[key]) {
      PRACTICE_QUIZ_BANKS.default.forEach(push);
    }
    return set.slice(0, 5);
  }

  presentCurrentTableauQuiz() {
    const quiz = this._wbQuizSet[this._wbQuizIndex];
    if (!quiz) return false;
    const cardId = `wb_set_${this._wbQuizIndex}`;
    this.quizCards[cardId] = quiz;
    this._wbQuizCardId = cardId;
    this.openTableauNoir();
    const letters = ["A", "B", "C", "D", "E", "F"];
    const optionsHtml = (quiz.options || []).map((opt, idx) => {
      const letter = letters[idx] || String(idx + 1);
      return `
        <button type="button" class="gandal-wb-quiz-option" id="wb_quiz_opt_${idx}"
          onclick="window.gandalSpaceApp.selectQuizOption('${cardId}', ${idx})">
          <span class="gandal-wb-quiz-letter">${letter}</span>
          <span class="gandal-wb-quiz-text">${this.formatMathWithKaTeX(String(opt))}</span>
          <span class="gandal-wb-quiz-mark" id="wb_quiz_mark_${idx}"></span>
        </button>
      `;
    }).join("");
    const total = this._wbQuizSet.length;
    const idx = this._wbQuizIndex;
    const hasMore = idx < total - 1;
    const html = `
      <div class="gandal-wb-socratic gandal-wb-socratic-quiz">
        <div class="gandal-wb-kicker">❓ Question socratique — quiz ${idx + 1} / ${total}</div>
        <div class="gandal-wb-question">${this.formatMathWithKaTeX(quiz.question || "")}</div>
        <p class="gandal-wb-hint">Réfléchis d'abord, puis choisis une réponse — ou dis-la au micro.</p>
        <div class="gandal-wb-quiz-options">${optionsHtml}</div>
        <div class="gandal-wb-quiz-explanation" id="wb_quiz_explanation" hidden>
          ${this.formatMathWithKaTeX(quiz.explanation || "")}
        </div>
        <div class="gandal-wb-quiz-footer">
          <span class="gandal-wb-quiz-count">${idx + 1} / ${total}</span>
          <button type="button" class="gandal-wb-show-more" ${hasMore ? "" : "disabled"}
            onclick="window.gandalSpaceApp.showNextTableauQuiz()">Show more</button>
        </div>
      </div>
    `;
    this.setWhiteboardHtml(html, "Quiz sur le tableau", "completed");
    if (quiz.answered) {
      const guessed = typeof quiz.lastSelectedIndex === "number" ? quiz.lastSelectedIndex : quiz.answerIndex;
      this.syncTableauQuizMarks(cardId, guessed);
    }
    return true;
  }

  showNextTableauQuiz() {
    if (!this._wbQuizSet || this._wbQuizIndex >= this._wbQuizSet.length - 1) return;
    this._wbQuizIndex += 1;
    this.presentCurrentTableauQuiz();
  }

  syncTableauQuizMarks(cardId, selectedIndex) {
    if (this._wbQuizCardId !== cardId) return;
    const quiz = this.quizCards[cardId];
    if (!quiz) return;
    const isCorrect = selectedIndex === quiz.answerIndex;
    (quiz.options || []).forEach((_, idx) => {
      const optEl = document.getElementById(`wb_quiz_opt_${idx}`);
      const markEl = document.getElementById(`wb_quiz_mark_${idx}`);
      if (optEl) optEl.classList.add("disabled");
      if (idx === selectedIndex && optEl) {
        optEl.classList.add(isCorrect ? "correct" : "incorrect");
      }
      if (idx === quiz.answerIndex && optEl) {
        optEl.classList.add("show-correct");
      }
      if (markEl) {
        if (idx === selectedIndex) {
          markEl.textContent = isCorrect ? "✅" : "❌";
        } else if (idx === quiz.answerIndex && !isCorrect) {
          markEl.textContent = "✓";
        }
      }
    });
    const expl = document.getElementById("wb_quiz_explanation");
    if (expl) expl.hidden = false;
  }

  presentCompareGraphOnTableau(comp, topic) {
    this._wbQuizCardId = null;
    this.openTableauNoir();
    const pair = parseComparePair(comp, topic);
    const prompt = this.socraticGraphPrompt(Object.assign({}, comp, { model_type: "compare" }), topic);
    const chart = this.compareChartHtml(pair);
    const html = `
      <div class="gandal-wb-socratic">
        <div class="gandal-wb-kicker">📈 Question socratique — graphe</div>
        <div class="gandal-wb-question">${this.formatMathWithKaTeX(prompt)}</div>
        ${chart}
      </div>
    `;
    this.setWhiteboardHtml(html, "Graphe affiché", "completed");
  }

  handleShowGraph() {
    this.openTableauNoir();
    const surface = document.getElementById("gandalA2UISurface");
    const existingGraph = surface ? surface.querySelector(".a2ui-graph-card") : null;
    const track = this.quizFocusTopic && this.quizFocusTopic();
    const topic = (track && track.title) || this.currentContext || "right triangle";
    if (isComparingNumbersTopic(topic, track && track.id) || isComparingGraph(
      (existingGraph && this.activeModels && this.activeModels[existingGraph.id]) || {},
      topic
    )) {
      this.presentCompareGraphOnTableau(compareGraphComp(topic), topic);
      return;
    }
    const show = (card) => {
      if (card) this.highlightA2UICard(card);
      const raw = (card && this.activeModels && this.activeModels[card.id]) || {};
      const comp = this.geometryCompForTopic(raw, topic);
      this.presentGraphOnTableau(comp, topic);
    };

    if (existingGraph) {
      show(existingGraph);
      return;
    }

    this.setWhiteboardHtml(
      `<div class="gandal-wb-socratic"><div class="gandal-wb-kicker">📈 Question socratique — graphe</div><p class="gandal-wb-hint">Préparation du modèle visuel pour <strong>${escapeHtml(topic)}</strong>…</p></div>`,
      "Chargement du graphe",
      "speaking"
    );
    const inferred = inferGeometryModelType({}, topic);
    if (inferred && inferred.indexOf("geometry_") === 0) {
      show(null);
      return;
    }
    this.submitQuery(`Graph and interactive visual model for ${topic}`, false).then(() => {
      setTimeout(() => {
        const newGraph = document.getElementById("gandalA2UISurface")?.querySelector(".a2ui-graph-card");
        if (newGraph) show(newGraph);
        else if (inferred) this.presentGraphOnTableau(this.geometryCompForTopic({}, topic), topic);
        else this.writeToWhiteboard("Je n'ai pas pu charger le graphe. Reformule le sujet, puis réessaie.", "Gandho");
      }, 350);
    });
  }

  async generatePracticeQuiz(topic, extras) {
    const extra = extras || {};
    const body = {
      topic: topic || "",
      topic_id: extra.topic_id || extra.topicId || "",
      band: extra.band || "",
      context: extra.context || this.currentContext || topic || ""
    };
    const parseJson = async (resp) => {
      const text = await resp.text();
      try { return JSON.parse(text); } catch (e) { return {}; }
    };
    try {
      const resp = await fetch("/api/gandal_space/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (resp.ok) {
        const data = await parseJson(resp);
        if (data && data.success && Array.isArray(data.questions) && data.questions.length) {
          return data;
        }
      }
    } catch (e) {}
    const askResp = await fetch("/api/gandal_space/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: (
          `Write a practice quiz of FIVE distinct content multiple-choice questions ` +
          `about this ONE topic. Include five QuizCard children. Topic: ${topic}. ` +
          `Do not ask meta questions about the current lesson, changing subjects, triangles, or pi.`
        ),
        context: body.context
      })
    });
    const asked = await parseJson(askResp);
    const kids = ((asked.ui_payload || {}).children) || [];
    const questions = kids
      .filter((c) => c && c.type === "QuizCard")
      .map((c) => ({
        question: c.question,
        options: c.options,
        answerIndex: c.answer_index,
        answer_index: c.answer_index,
        explanation: c.explanation
      }));
    if (questions.length) {
      return { success: true, questions, provider: asked.provider, engine_type: asked.engine_type };
    }
    return asked;
  }

  async handleQuizMe() {
    this.openTableauNoir();
    const surface = document.getElementById("gandalA2UISurface");
    const existingQuizEl = surface ? surface.querySelector(".a2ui-quiz-card") : null;
    const track = this.quizFocusTopic();
    const topic = (track && track.title) || this.currentContext || "";
    if (!topic) {
      this.setWhiteboardHtml(
        `<div class="gandal-wb-socratic"><div class="gandal-wb-kicker">❓ Quiz me</div><p class="gandal-wb-hint">Tell me what you are studying first — start a K-12 topic or ask a question — then tap Quiz me.</p></div>`,
        "Need a topic",
        "error"
      );
      return;
    }
    if (existingQuizEl) this.highlightA2UICard(existingQuizEl);
    this.setWhiteboardHtml(
      `<div class="gandal-wb-socratic"><div class="gandal-wb-kicker">❓ Question socratique — quiz</div><p class="gandal-wb-hint">Préparation de 5 questions sur <strong>${escapeHtml(topic)}</strong>…</p></div>`,
      "Chargement du quiz",
      "speaking"
    );
    try {
      const data = await this.generatePracticeQuiz(topic, {
        topic_id: track && track.id,
        band: track && track.band,
        context: this.currentContext || topic
      });
      const raw = (data && data.questions) || [];
      const set = [];
      const seen = new Set();
      raw.forEach((q) => {
        if (!q || !q.question || isMetaQuizQuestion(q) || seen.has(q.question) || set.length >= 5) return;
        seen.add(q.question);
        set.push(cloneQuizItem(q));
      });
      if (!data || !data.success || !set.length) {
        const err = (data && (data.error || data.reply)) || "Could not load a quiz for this topic.";
        this.setWhiteboardHtml(
          `<div class="gandal-wb-socratic"><div class="gandal-wb-kicker">❓ Quiz me</div><p class="gandal-wb-hint">${escapeHtml(err)}</p></div>`,
          "Quiz unavailable",
          "error"
        );
        return;
      }
      this._wbQuizSet = set;
      this._wbQuizIndex = 0;
      this.presentCurrentTableauQuiz();
    } catch (e) {
      this.setWhiteboardHtml(
        `<div class="gandal-wb-socratic"><div class="gandal-wb-kicker">❓ Quiz me</div><p class="gandal-wb-hint">Could not load a quiz for this topic.</p></div>`,
        "Quiz unavailable",
        "error"
      );
    }
  }

  async handleExplainSimpler() {
    this.switchCompanionTab("whiteboard");
    const topic = this.currentContext || "ce concept";
    const prompt = `Explique-moi "${topic}" de manière très simple et intuitive, avec des étapes claires et les formules mathématiques clés bien écrites.`;
    this.appendStudentBubble("💡 Peux-tu m'expliquer plus simplement ?");
    this.writeToWhiteboard(`💡 *Préparation d'une explication simplifiée pour "${topic}"...*`, "Gandho");

    try {
      const resp = await fetch("/api/gandal_space/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: this.currentContext,
          history: this.chatHistory.slice(-4)
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.error || "Gemma 4 E4B is not running on :8080.";
        this.chatHistory.push({ role: "assistant", content: reply });
        this.writeToWhiteboard(reply, "Gandho");
      }
    } catch (e) {
      this.writeToWhiteboard("Une erreur est survenue lors de l'explication. Veuillez réessayer.", "Gandho");
    }
  }

  async handleRealExample() {
    this.switchCompanionTab("whiteboard");
    const topic = this.currentContext || "ce concept";
    const prompt = `Donne-moi un exemple concret et réel issu du quotidien ou de l'ingénierie illustrant "${topic}", avec des calculs et formules mathématiques concrètes.`;
    this.appendStudentBubble("🌍 Peux-tu me donner un exemple concret ?");
    this.writeToWhiteboard(`🌍 *Recherche d'un exemple concret d'application pour "${topic}"...*`, "Gandho");

    try {
      const resp = await fetch("/api/gandal_space/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: this.currentContext,
          history: this.chatHistory.slice(-4)
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.error || "Gemma 4 E4B is not running on :8080.";
        this.chatHistory.push({ role: "assistant", content: reply });
        this.writeToWhiteboard(reply, "Gandho");
      }
    } catch (e) {
      this.writeToWhiteboard("Une erreur est survenue lors de la recherche d'exemple. Veuillez réessayer.", "Gandho");
    }
  }

  askGandhoAboutTopic(topic) {
    const query = `Can you explain "${topic}" to me step-by-step?`;
    this.handleStudentVoiceInput(query);
  }

  askGandhoPreset(presetPrompt) {
    if (presetPrompt.includes("graph")) {
      this.handleShowGraph();
    } else if (presetPrompt.includes("quiz") || presetPrompt.includes("question")) {
      this.handleQuizMe();
    } else if (presetPrompt.includes("simpler") || presetPrompt.includes("simple")) {
      this.handleExplainSimpler();
    } else if (presetPrompt.includes("example")) {
      this.handleRealExample();
    } else {
      this.handleStudentVoiceInput(presetPrompt);
    }
  }

  sendChatMessage() {
    const input = document.getElementById("gandalQueryInput") || document.getElementById("gandalChatTextInput");
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    this.handleStudentVoiceInput(msg);
  }

  /* ------------------------------------------------------------------------
     A2UI QUERY SUBMISSION (Answers Pane)
     ------------------------------------------------------------------------ */
  async submitQuery(customQuery = null, appendToChat = true) {
    const input = document.getElementById("gandalQueryInput");
    const query = (typeof customQuery === "string" && customQuery.trim()) ? customQuery.trim() : (input ? input.value.trim() : "");
    if (!query) return;
    if (!this._loadingTrackLesson) {
      const tracked = await this.applyTrackIntent(query);
      if (tracked) return;
    }

    // Reset search input immediately so the student can follow up with another question
    if (input) {
      input.value = "";
      input.placeholder = "Ask a follow-up question or explore more...";
    }

    // Save previous exploration query to history
    if (this.currentContext && this.currentContext !== query) {
      this.searchHistory.push({ query: query, title: this.currentContext });
    }

    // Update active context for Gandho
    this.currentContext = query;
    const ctxTitle = document.getElementById("gandalActiveContextTitle");
    if (ctxTitle) ctxTitle.innerText = query;
    if (typeof window.updateActiveViewState === "function") {
      window.updateActiveViewState();
    }

    if (appendToChat) {
      this.appendStudentBubble(query);
    }

    this.renderLoading(query);

    try {
      const resp = await fetch("/api/gandal_space/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          context: this.currentContext,
          history: this.searchHistory.slice(-5)
        })
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();

      if (result && result.success === false) {
        throw new Error(result.error || "Gemma 4 E4B is not running on :8080.");
      }
      if (result && result.ui_payload) {
        this.renderA2UI(result.ui_payload, result);
        const title = result.ui_payload.title || query;
        if (appendToChat) {
          this.appendGandhoBubble(`I've loaded "${title}" on the left! Let me know if you want me to explain any part or test your understanding.`);
        }
      } else {
        throw new Error((result && result.error) || "Invalid A2UI response payload");
      }
    } catch (err) {
      console.error("[GANDAL SPACE] Query failed:", err);
      this.renderError(query, err.message);
    }
  }



  renderLoading(query) {
    const surface = document.getElementById("gandalA2UISurface");
    if (!surface) return;
    surface.innerHTML = `
      <div class="a2ui-result-meta">
        <span>Exploring <em>"${escapeHtml(query)}"</em>...</span>
        <span class="a2ui-provider-badge">Processing A2UI Blueprint</span>
      </div>
      <div class="a2ui-loading-skeleton">
        <div class="skeleton-line" style="width: 45%; height: 26px;"></div>
        <div class="skeleton-line" style="width: 80%;"></div>
        <div class="skeleton-line" style="width: 65%;"></div>
        <div class="skeleton-line" style="width: 90%; height: 60px;"></div>
      </div>
    `;
  }

  renderError(query, errMsg) {
    const surface = document.getElementById("gandalA2UISurface");
    if (!surface) return;
    surface.innerHTML = `
      <div class="a2ui-container" style="border-color: rgba(239, 68, 68, 0.4);">
        <h3 style="color: #f87171; margin: 0;">Could not complete exploration</h3>
        <p style="color: #cbd5e1; margin: 0;">${escapeHtml(errMsg)}</p>
        <button class="quick-topic-chip" style="align-self: flex-start;" onclick="window.gandalSpaceApp.submitQuery()">Try Again</button>
      </div>
    `;
  }

  /* ========================================================================
     A2UI DECLARATIVE RENDER ENGINE
     ======================================================================== */
  renderA2UI(payload, meta = {}) {
    const surface = document.getElementById("gandalA2UISurface");
    if (!surface) return;

    surface.innerHTML = "";

    // Sync active context with Gandho companion
    if (payload.title) {
      this.currentContext = `${payload.title}. ${payload.summary || ""}`;
      const ctxTitle = document.getElementById("gandalActiveContextTitle");
      if (ctxTitle) ctxTitle.innerText = payload.title;
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }
    }

    // Header metadata bar
    const metaBar = document.createElement("div");
    metaBar.className = "a2ui-result-meta";
    const provider = meta.provider || "Gandal Space Hybrid Engine";
    const isEdge = meta.engine_type === "offline_edge";
    metaBar.innerHTML = `
      <span>Topic: <strong>${escapeHtml(payload.title || "Subject Breakdown")}</strong></span>
      <span class="a2ui-provider-badge ${isEdge ? 'offline-edge' : 'cloud-fallback'}">
        ${isEdge ? '🟢' : '🔵'} ${escapeHtml(provider)}
      </span>
    `;
    surface.appendChild(metaBar);

    // Root Container
    const rootEl = this.buildComponent(payload);

    // Append suggested follow-up chips if present
    if (Array.isArray(payload.suggested_followups) && payload.suggested_followups.length > 0) {
      const followupsEl = this.buildFollowupChips(payload.suggested_followups);
      if (followupsEl) rootEl.appendChild(followupsEl);
    }

    surface.appendChild(rootEl);

    // Typeset any math formulas in the entire rendered surface
    this.typesetMath(surface);
  }

  buildComponent(component) {
    if (!component) return document.createComment("Empty component");
    const type = component.type;

    switch (type) {
      case "Container":
        return this.buildContainer(component);
      case "TextBlock":
        return this.buildTextBlock(component);
      case "Card":
        return this.buildCard(component);
      case "FormulaCard":
        return this.buildFormulaCard(component);
      case "GraphCard":
        return this.buildGraphCard(component);
      case "QuizCard":
        return this.buildQuizCard(component);
      case "PronunciationCard":
        return this.buildPronunciationCard(component);
      case "AudioFeedback":
        return this.buildAudioFeedback(component);
      default:
        return this.buildCard({
          title: component.title || type,
          content: JSON.stringify(component, null, 2)
        });
    }
  }

  buildContainer(comp) {
    const container = document.createElement("div");
    container.className = "a2ui-container";

    if (comp.title || comp.summary) {
      const header = document.createElement("div");
      header.className = "a2ui-container-header";
      if (comp.title) {
        header.innerHTML += `<h2 class="a2ui-container-title">${this.formatMarkdown(comp.title)}</h2>`;
      }
      if (comp.summary) {
        header.innerHTML += `<p class="a2ui-container-summary">${this.formatMarkdown(comp.summary)}</p>`;
      }
      container.appendChild(header);
    }

    if (Array.isArray(comp.children)) {
      comp.children.forEach(child => {
        container.appendChild(this.buildComponent(child));
      });
    }

    return container;
  }

  buildTextBlock(comp) {
    const el = document.createElement("div");
    el.className = "a2ui-textblock";
    el.innerHTML = this.formatMarkdown(comp.content || "");
    return el;
  }

  buildCard(comp) {
    const card = document.createElement("div");
    card.className = "a2ui-card";

    let topHtml = "";
    if (comp.title || comp.badge) {
      topHtml = `
        <div class="a2ui-card-top">
          <h3 class="a2ui-card-title">${this.formatMarkdown(comp.title || "")}</h3>
          ${comp.badge ? `<span class="a2ui-card-badge">${escapeHtml(comp.badge)}</span>` : ""}
        </div>
      `;
    }

    let tagsHtml = "";
    if (Array.isArray(comp.tags) && comp.tags.length > 0) {
      tagsHtml = `
        <div class="a2ui-tags-row">
          ${comp.tags.map(t => `<span class="a2ui-tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      `;
    }

    const discussTitle = comp.title || "this concept";
    card.innerHTML = `
      ${topHtml}
      <div class="a2ui-card-content">${this.formatMarkdown(comp.content || "")}</div>
      ${tagsHtml}
      <button class="a2ui-discuss-btn" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(discussTitle)}')">
        🎙️ Ask Gandho to Explain This
      </button>
    `;
    return card;
  }

  buildFormulaCard(comp) {
    const card = document.createElement("div");
    card.className = "a2ui-formula-card";

    let stepsHtml = "";
    if (Array.isArray(comp.steps) && comp.steps.length > 0) {
      stepsHtml = `
        <div class="a2ui-formula-steps">
          ${comp.steps.map(s => `<div class="a2ui-step-item"><span>📌</span><span>${this.formatMarkdown(s)}</span></div>`).join("")}
        </div>
      `;
    }

    const formulaTitle = comp.title || "this formula";
    const heroFormulaHtml = comp.formula ? this.renderMath(comp.formula, true) : "";
    const resultHtml = comp.result ? this.formatMarkdown(comp.result) : "";

    card.innerHTML = `
      <div class="a2ui-card-top">
        <h3 class="a2ui-card-title">${this.formatMarkdown(comp.title || "Step-by-Step Mathematical Formulation")}</h3>
        <span class="a2ui-card-badge" style="background: rgba(139, 92, 246, 0.25); color: #c084fc;">Calculus &amp; Algebra</span>
      </div>
      <div class="a2ui-formula-hero">${heroFormulaHtml}</div>
      ${stepsHtml}
      ${resultHtml ? `<div class="a2ui-formula-result">${resultHtml}</div>` : ""}
      <button class="a2ui-discuss-btn" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(formulaTitle)}')">
        🎙️ Ask Gandho to Walk Through Formula
      </button>
    `;
    return card;
  }

  compareChartHtml(pair) {
    const left = pair.left;
    const right = pair.right;
    const max = Math.max(left, right, 1);
    const leftH = Math.max(12, Math.round((left / max) * 150));
    const rightH = Math.max(12, Math.round((right / max) * 150));
    const symbol = left > right ? ">" : left < right ? "<" : "=";
    const lineMax = Math.max(10, max);
    const labelSet = new Set([0, left, right]);
    const ticks = [];
    for (let n = 0; n <= lineMax; n++) {
      const pct = (n / lineMax) * 100;
      const label = labelSet.has(n) ? `<em>${n}</em>` : "";
      ticks.push(
        `<span class="a2ui-compare-tick" style="left:${pct}%;">` +
          `<i></i>${label}` +
        `</span>`
      );
    }
    const mark = (value, cls) => {
      const pct = (value / lineMax) * 100;
      const shift = pct >= 99 ? "translateX(-100%)" : "translateX(-50%)";
      return `<span class="a2ui-compare-mark ${cls}" style="left:${pct}%;transform:${shift};">${value}</span>`;
    };
    return `
      <div class="a2ui-compare-chart">
        <div class="a2ui-compare-towers" role="img" aria-label="${left} versus ${right}">
          <div class="a2ui-compare-col">
            <div class="a2ui-compare-bar${left > right ? " is-greater" : ""}" style="height:${leftH}px"></div>
            <div class="a2ui-compare-num">${left}</div>
          </div>
          <div class="a2ui-compare-symbol" aria-hidden="true">${symbol}</div>
          <div class="a2ui-compare-col">
            <div class="a2ui-compare-bar${right > left ? " is-greater" : ""}" style="height:${rightH}px"></div>
            <div class="a2ui-compare-num">${right}</div>
          </div>
        </div>
        <p class="a2ui-compare-caption">${left} ${symbol} ${right} — the taller tower is greater.</p>
        <div class="a2ui-compare-line" role="img" aria-label="Number line from 0 to ${lineMax}">
          ${ticks.join("")}
          ${mark(left, "is-left")}
          ${mark(right, "is-right")}
        </div>
      </div>
    `;
  }

  buildCompareGraphCard(comp) {
    const card = document.createElement("div");
    card.className = "a2ui-card a2ui-graph-card a2ui-compare-card";
    const pair = parseComparePair(comp);
    const titleHtml = this.formatMarkdown(comp.title || "Comparing numbers");
    const descHtml = comp.description ? this.formatMarkdown(comp.description) : "";
    card.innerHTML = `
      <div class="a2ui-card-top">
        <h3 class="a2ui-card-title">${titleHtml}</h3>
        <span class="a2ui-card-badge" style="background: rgba(250, 204, 21, 0.2); color: #fde68a;">⚖️ Compare</span>
      </div>
      ${descHtml ? `<p class="a2ui-card-content" style="margin-bottom: 12px;">${descHtml}</p>` : ""}
      ${this.compareChartHtml(pair)}
      <div class="a2ui-graph-actions">
        <button class="a2ui-discuss-btn" style="margin-top: 0;" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(comp.title || "Comparing numbers")}')">
          🎙️ Ask Gandho to Explain This Model
        </button>
      </div>
    `;
    return card;
  }

  buildCountingGraphCard(comp) {
    const card = document.createElement("div");
    card.className = "a2ui-card a2ui-graph-card a2ui-counting-card";
    const n = parseCountingMax(comp);
    const titleHtml = this.formatMarkdown(comp.title || `Counting to ${n}`);
    const rawDesc = looksLikeInlineCountingChart(comp.description || "")
      ? stripInlineCountingChart(comp.description || "")
      : (comp.description || "");
    const descHtml = rawDesc ? this.formatMarkdown(rawDesc) : "";
    const rows = [];
    for (let i = 1; i <= n; i++) {
      rows.push(
        `<div class="a2ui-counting-row" role="listitem">` +
          `<span class="a2ui-counting-numeral">${i}</span>` +
          `<span class="a2ui-counting-dots" aria-label="${i} dots">${"●".repeat(i)}</span>` +
        `</div>`
      );
    }
    const graphDiscussPrompt = comp.title || `counting to ${n}`;
    card.innerHTML = `
      <div class="a2ui-card-top">
        <h3 class="a2ui-card-title">${titleHtml}</h3>
        <span class="a2ui-card-badge" style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc;">🔢 Counting Chart</span>
      </div>
      ${descHtml ? `<p class="a2ui-card-content" style="margin-bottom: 12px;">${descHtml}</p>` : ""}
      <div class="a2ui-counting-chart" role="list">${rows.join("")}</div>
      <div class="a2ui-graph-actions">
        <button class="a2ui-discuss-btn" style="margin-top: 0;" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(graphDiscussPrompt)}')">
          🎙️ Ask Gandho to Explain This Model
        </button>
      </div>
    `;
    return card;
  }

  buildGraphCard(comp) {
    if (isCountingGraph(comp)) {
      return this.buildCountingGraphCard(comp);
    }
    if (isComparingGraph(comp)) {
      return this.buildCompareGraphCard(comp);
    }
    const cardId = "graph_" + Math.random().toString(36).substring(2, 9);
    const card = document.createElement("div");
    card.className = "a2ui-card a2ui-graph-card";
    card.id = cardId;

    const modelType = comp.model_type || "function_plot";
    const titleHtml = this.formatMarkdown(comp.title || "Interactive Visual Model");
    const descHtml = comp.description ? this.formatMarkdown(comp.description) : "";
    const formulaStr = comp.formula || "";

    // Determine badge and accent colors based on subject/modelType
    let badgeText = "📈 Interactive Function Graph";
    let badgeColor = "#7dd3fc";
    let badgeBg = "rgba(56, 189, 248, 0.2)";

    if (modelType.startsWith("geometry_")) {
      badgeText = "📐 Interactive Geometry Model";
      badgeColor = "#c084fc";
      badgeBg = "rgba(168, 85, 247, 0.2)";
    } else if (modelType.startsWith("physics_")) {
      badgeText = "⚛️ Physics Simulation";
      badgeColor = "#34d399";
      badgeBg = "rgba(16, 185, 129, 0.2)";
    } else if (modelType.startsWith("chemistry_")) {
      badgeText = "🧪 Chemistry Model";
      badgeColor = "#f472b6";
      badgeBg = "rgba(244, 114, 182, 0.2)";
    }

    // Format display formula or theorem pill using LaTeX
    let formulaHtml = "";
    if (comp.theorem) {
      formulaHtml = this.formatMarkdown(`$${comp.theorem}$`);
    } else if (formulaStr) {
      if (formulaStr.includes("=") || formulaStr.includes("\\") || formulaStr.includes("+") || formulaStr.includes("^")) {
        formulaHtml = this.formatMarkdown(`$${formulaStr}$`);
      } else {
        formulaHtml = this.formatMarkdown(`$f(x) = ${formulaStr}$`);
      }
    }

    // Initial HUD guide text
    let initialHudText = "Hover over model to inspect coordinates";
    if (modelType === "geometry_triangle") {
      initialHudText = "🖐️ Drag vertices A, B, or C to test angle sum";
    } else if (modelType === "geometry_circle") {
      initialHudText = "🖐️ Drag point P to explore radius, circumference & area";
    } else if (modelType === "geometry_pythagoras") {
      initialHudText = "📐 Visual proof: a² + b² = c² (9 + 16 = 25)";
    } else if (modelType === "physics_projectile") {
      initialHudText = "🚀 Drag projectile along curve to inspect (x, y, t)";
    } else if (modelType === "physics_newton") {
      initialHudText = "⚛️ Drag mass to test F = ma relationship";
    } else if (modelType === "chemistry_titration") {
      initialHudText = "🧪 Drag titrant to explore pH and equivalence point";
    }

    const graphDiscussPrompt = comp.title || `the visual model for ${formulaStr || "this concept"}`;

    card.innerHTML = `
      <div class="a2ui-card-top">
        <h3 class="a2ui-card-title">${titleHtml}</h3>
        <span class="a2ui-card-badge" style="background: ${badgeBg}; color: ${badgeColor};">${badgeText}</span>
      </div>

      <div class="a2ui-graph-header">
        ${formulaHtml ? `<div class="a2ui-graph-formula-pill">${formulaHtml}</div>` : ""}
        <div class="a2ui-graph-hud-coords" id="${cardId}_coords">${initialHudText}</div>
      </div>

      ${descHtml ? `<p class="a2ui-card-content" style="margin-bottom: 12px;">${descHtml}</p>` : ""}

      <div class="a2ui-graph-viewport-wrapper">
        <div class="a2ui-graph-viewport" id="${cardId}_viewport">
          <canvas id="${cardId}_canvas" class="a2ui-graph-canvas"></canvas>
        </div>
      </div>
      ${String(modelType).indexOf("geometry_") === 0 ? `<div class="gandal-wb-geom-vars" id="${cardId}_vars"></div>` : ""}

      <div class="a2ui-graph-actions">
        ${modelType === "function_plot" ? `
        <button class="a2ui-graph-btn" onclick="window.gandalSpaceApp.openInOmniGraph('${escapeAttr(formulaStr)}')">
          🚀 Open in Omni Graph Engine (Full Studio)
        </button>` : `
        <button class="a2ui-graph-btn" style="background: rgba(168, 85, 247, 0.18); border-color: rgba(168, 85, 247, 0.4); color: #e9d5ff;" onclick="window.gandalSpaceApp.resetModelPlot('${cardId}')">
          🔄 Reset Visual Model
        </button>`}
        <button class="a2ui-discuss-btn" style="margin-top: 0;" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(graphDiscussPrompt)}')">
          🎙️ Ask Gandho to Explain This Model
        </button>
      </div>
    `;

    // Cache component for dynamic reset actions
    if (!this.activeModels) this.activeModels = {};
    this.activeModels[cardId] = comp;

    // Initialize graph once mounted in DOM
    setTimeout(() => {
      this.initGraphPlot(cardId, comp);
    }, 60);

    return card;
  }

  resetModelPlot(cardId) {
    if (this.activeModels && this.activeModels[cardId]) {
      this.initGraphPlot(cardId, this.activeModels[cardId]);
    }
  }

  initGraphPlot(cardId, compArg, domainArg, rangeArg) {
    const viewport = document.getElementById(`${cardId}_viewport`);
    const canvas = document.getElementById(`${cardId}_canvas`);
    const coordsEl = document.getElementById(`${cardId}_coords`);
    if (!viewport || !canvas) return;

    // Support both object and legacy signature: (cardId, formulaStr, domain, range)
    let comp = {};
    if (typeof compArg === "object" && compArg !== null) {
      comp = compArg;
    } else {
      comp = {
        model_type: "function_plot",
        formula: compArg || "sgn(x)",
        domain: domainArg,
        range: rangeArg
      };
    }

    const modelType = comp.model_type || "function_plot";
    const formulaStr = comp.formula || "sgn(x)";
    const domain = Array.isArray(comp.domain) && comp.domain.length === 2 ? comp.domain : [-5, 5];
    const range = Array.isArray(comp.range) && comp.range.length === 2 ? comp.range : [-3, 3];

    const xMin = domain[0], xMax = domain[1];
    const yMin = range[0], yMax = range[1];

    // Priority 1: JSXGraph if loaded in browser
    if (window.JXG && typeof window.JXG.JSXGraph !== "undefined") {
      try {
        canvas.style.display = "none";
        
        // Remove existing JXG container if re-initializing
        const existingJxg = document.getElementById(`${cardId}_jxg`);
        if (existingJxg) existingJxg.remove();

        const jxgDiv = document.createElement("div");
        jxgDiv.id = `${cardId}_jxg`;
        jxgDiv.className = "jxgbox";
        jxgDiv.style.width = "100%";
        jxgDiv.style.height = "100%";
        jxgDiv.style.position = "absolute";
        jxgDiv.style.inset = "0";
        jxgDiv.style.background = "#08090d";
        viewport.appendChild(jxgDiv);

        const board = window.JXG.JSXGraph.initBoard(jxgDiv.id, {
          boundingbox: [xMin, yMax, xMax, yMin],
          axis: true,
          grid: true,
          showNavigation: false,
          showCopyright: false,
          pan: { enabled: true },
          zoom: { enabled: true },
          defaultAxes: darkGraphDefaultAxes()
        });
        keepDarkGraphAxisTicks(board);
        viewport._jxgBoard = board;

        // ====================================================================
        // MODEL 1: GEOMETRY TRIANGLE ABC (sides a, b, c drive the figure)
        // ====================================================================
        if (modelType === "geometry_triangle") {
          const placed = sssTrianglePoints(4.19, 3.67, 4.5);
          const vals = { a: placed.a, b: placed.b, c: placed.c };
          const pA = board.create('point', placed.A, {
            name: 'A', size: 5, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: false
          });
          const pB = board.create('point', placed.B, {
            name: 'B', size: 5, strokeColor: '#a855f7', fillColor: '#a855f7', fixed: false
          });
          const pC = board.create('point', placed.C, {
            name: 'C', size: 5, strokeColor: '#ec4899', fillColor: '#ec4899', fixed: false
          });
          board.create('polygon', [pA, pB, pC], {
            fillColor: '#8b5cf6', fillOpacity: 0.22,
            borders: { strokeColor: '#a855f7', strokeWidth: 3 }
          });
          board.create('angle', [pB, pA, pC], { radius: 0.7, name: 'α', fillColor: '#38bdf8', fillOpacity: 0.35, strokeColor: '#38bdf8' });
          board.create('angle', [pC, pB, pA], { radius: 0.7, name: 'β', fillColor: '#a855f7', fillOpacity: 0.35, strokeColor: '#a855f7' });
          board.create('angle', [pA, pC, pB], { radius: 0.7, name: 'γ', fillColor: '#ec4899', fillOpacity: 0.35, strokeColor: '#ec4899' });

          const applySides = () => {
            const pts = sssTrianglePoints(vals.a, vals.b, vals.c);
            vals.a = pts.a; vals.b = pts.b; vals.c = pts.c;
            pA.moveTo(pts.A, 0);
            pB.moveTo(pts.B, 0);
            pC.moveTo(pts.C, 0);
            board.update();
          };
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            ctrl.lock = true;
            vals[key] = raw;
            applySides();
            ctrl.lock = false;
            ctrl.sync();
          });
          const updateTriangleHUD = () => {
            const a = Math.hypot(pB.X() - pC.X(), pB.Y() - pC.Y());
            const b = Math.hypot(pA.X() - pC.X(), pA.Y() - pC.Y());
            const c = Math.hypot(pA.X() - pB.X(), pA.Y() - pB.Y());
            if (!(ctrl && ctrl.lock)) {
              vals.a = a; vals.b = b; vals.c = c;
              if (ctrl) ctrl.sync();
            }
            if (!coordsEl || a < 0.001 || b < 0.001 || c < 0.001) return;
            const cosA = Math.max(-1, Math.min(1, (b*b + c*c - a*a) / (2 * b * c)));
            const cosB = Math.max(-1, Math.min(1, (a*a + c*c - b*b) / (2 * a * c)));
            const degA = Math.acos(cosA) * (180 / Math.PI);
            const degB = Math.acos(cosB) * (180 / Math.PI);
            const degC = Math.max(0, 180.0 - degA - degB);
            const area = 0.5 * Math.abs(pA.X()*(pB.Y() - pC.Y()) + pB.X()*(pC.Y() - pA.Y()) + pC.X()*(pA.Y() - pB.Y()));
            coordsEl.innerHTML = `a=${a.toFixed(2)} b=${b.toFixed(2)} c=${c.toFixed(2)} | ∠A ${degA.toFixed(1)}° + ∠B ${degB.toFixed(1)}° + ∠C ${degC.toFixed(1)}° = 180° | Area ${area.toFixed(2)}`;
          };
          board.on('update', updateTriangleHUD);
          updateTriangleHUD();
          return;
        }

        // ====================================================================
        // MODEL 2: GEOMETRY CIRCLE (r, d, π, C drive the figure)
        // ====================================================================
        else if (modelType === "geometry_circle") {
          const vals = { r: 3, d: 6, pi: 3.14, c: 2 * 3.14 * 3 };
          const pO = board.create('point', [0, 0], {
            name: 'O(0,0)', size: 4, strokeColor: '#94a3b8', fillColor: '#64748b', fixed: true
          });
          const pP = board.create('point', [vals.r, 0], {
            name: 'P(r)', size: 5, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: false
          });
          board.create('circle', [pO, pP], {
            strokeColor: '#38bdf8', strokeWidth: 3, fillColor: 'rgba(56, 189, 248, 0.15)'
          });
          board.create('segment', [pO, pP], {
            strokeColor: '#f43f5e', strokeWidth: 2.5, dash: 2, name: 'r', withLabel: true
          });
          const applyRadius = (r) => {
            vals.r = Math.max(0.5, Math.min(8, r));
            vals.d = 2 * vals.r;
            vals.c = 2 * vals.pi * vals.r;
            pP.moveTo([vals.r, 0], 0);
            board.update();
          };
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            ctrl.lock = true;
            if (key === "r") applyRadius(raw);
            else if (key === "d") applyRadius(raw / 2);
            else if (key === "pi") {
              vals.pi = raw;
              vals.c = 2 * vals.pi * vals.r;
            } else if (key === "c") {
              vals.pi = vals.pi || 3.14;
              applyRadius(raw / (2 * vals.pi));
            }
            ctrl.lock = false;
            ctrl.sync();
          });
          const updateCircleHUD = () => {
            const r = Math.hypot(pP.X() - pO.X(), pP.Y() - pO.Y());
            if (!(ctrl && ctrl.lock)) {
              vals.r = r;
              vals.d = 2 * r;
              vals.c = 2 * vals.pi * r;
              if (ctrl) ctrl.sync();
            }
            if (!coordsEl) return;
            const circum = 2 * vals.pi * r;
            const area = vals.pi * r * r;
            coordsEl.innerHTML = `r = ${r.toFixed(2)} | d = ${(2*r).toFixed(2)} | π = ${vals.pi.toFixed(2)} | C = ${circum.toFixed(2)} | A = ${area.toFixed(2)}`;
          };
          board.on('update', updateCircleHUD);
          updateCircleHUD();
          return;
        }

        // ====================================================================
        // MODEL 3: PYTHAGOREAN THEOREM (legs a, b drive c and the squares)
        // ====================================================================
        else if (modelType === "geometry_pythagoras") {
          const vals = { a: 4, b: 3, c: 5 };
          const pA = board.create('point', [() => 0, () => 0], { name: 'A(90°)', size: 4, strokeColor: '#94a3b8', fillColor: '#94a3b8', fixed: true });
          const pB = board.create('point', [() => vals.a, () => 0], { name: 'B', size: 4, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true });
          const pC = board.create('point', [() => 0, () => vals.b], { name: 'C', size: 4, strokeColor: '#a855f7', fillColor: '#a855f7', fixed: true });
          board.create('polygon', [pA, pB, pC], {
            fillColor: '#6366f1', fillOpacity: 0.25, borders: { strokeColor: '#6366f1', strokeWidth: 3 }
          });
          const sqB = [
            board.create('point', [() => 0, () => 0], { visible: false, fixed: true }),
            board.create('point', [() => 0, () => vals.b], { visible: false, fixed: true }),
            board.create('point', [() => -vals.b, () => vals.b], { visible: false, fixed: true }),
            board.create('point', [() => -vals.b, () => 0], { visible: false, fixed: true })
          ];
          board.create('polygon', sqB, { fillColor: '#a855f7', fillOpacity: 0.35, borders: { strokeColor: '#c084fc', strokeWidth: 2 } });
          const txtB = board.create('text', [() => -vals.b / 2, () => vals.b / 2, () => `b² = ${(vals.b * vals.b).toFixed(1)}`], { color: '#e9d5ff', fontSize: 13, strokeColor: 'none' });
          const sqA = [
            board.create('point', [() => 0, () => 0], { visible: false, fixed: true }),
            board.create('point', [() => vals.a, () => 0], { visible: false, fixed: true }),
            board.create('point', [() => vals.a, () => -vals.a], { visible: false, fixed: true }),
            board.create('point', [() => 0, () => -vals.a], { visible: false, fixed: true })
          ];
          board.create('polygon', sqA, { fillColor: '#38bdf8', fillOpacity: 0.35, borders: { strokeColor: '#7dd3fc', strokeWidth: 2 } });
          board.create('text', [() => vals.a / 2, () => -vals.a / 2, () => `a² = ${(vals.a * vals.a).toFixed(1)}`], { color: '#bae6fd', fontSize: 13, strokeColor: 'none' });
          const sqC = [
            pB,
            pC,
            board.create('point', [() => vals.b, () => vals.a + vals.b], { visible: false, fixed: true }),
            board.create('point', [() => vals.a + vals.b, () => vals.a], { visible: false, fixed: true })
          ];
          board.create('polygon', sqC, { fillColor: '#10b981', fillOpacity: 0.35, borders: { strokeColor: '#34d399', strokeWidth: 2 } });
          board.create('text', [() => (vals.a + vals.b) / 2, () => (vals.a + vals.b) / 2, () => `c² = ${(vals.c * vals.c).toFixed(1)}`], { color: '#a7f3d0', fontSize: 14, strokeColor: 'none' });
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            if (key === "c") return;
            vals[key] = raw;
            vals.c = Math.hypot(vals.a, vals.b);
            board.update();
            ctrl.sync();
            if (coordsEl) {
              coordsEl.innerHTML = `a² (${(vals.a*vals.a).toFixed(1)}) + b² (${(vals.b*vals.b).toFixed(1)}) = c² (${(vals.c*vals.c).toFixed(1)})`;
            }
          });
          if (coordsEl) {
            coordsEl.innerHTML = `a² (16) + b² (9) = c² (25)`;
          }
          return;
        }

        // ====================================================================
        // MODEL 3b: ELLIPSE (semi-axes a, b + foci)
        // ====================================================================
        else if (modelType === "geometry_ellipse") {
          const vals = { a: 4, b: 2, f: Math.sqrt(12) };
          const curve = board.create('curve', [
            (t) => vals.a * Math.cos(t),
            (t) => vals.b * Math.sin(t),
            0, 2 * Math.PI
          ], { strokeColor: '#38bdf8', strokeWidth: 3, fillColor: 'rgba(56, 189, 248, 0.12)', fillOpacity: 0.35 });
          const f1 = board.create('point', [() => vals.f, 0], { name: 'F₁', size: 4, strokeColor: '#f472b6', fillColor: '#f472b6', fixed: true });
          const f2 = board.create('point', [() => -vals.f, 0], { name: 'F₂', size: 4, strokeColor: '#f472b6', fillColor: '#f472b6', fixed: true });
          const refreshF = () => {
            vals.f = Math.sqrt(Math.abs(vals.a * vals.a - vals.b * vals.b));
          };
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            vals[key] = raw;
            refreshF();
            board.update();
            ctrl.sync();
            if (coordsEl) {
              coordsEl.innerHTML = `a = ${vals.a.toFixed(2)} | b = ${vals.b.toFixed(2)} | c foci = ${vals.f.toFixed(2)} | Area = ${(Math.PI * vals.a * vals.b).toFixed(2)}`;
            }
          });
          refreshF();
          if (coordsEl) {
            coordsEl.innerHTML = `a = 4.00 | b = 2.00 | c foci = ${vals.f.toFixed(2)}`;
          }
          return;
        }

        // ====================================================================
        // MODEL 3c: RECTANGLE (length ℓ, width w)
        // ====================================================================
        else if (modelType === "geometry_rectangle") {
          const vals = { l: 5, w: 3 };
          const pts = [
            board.create('point', [() => 0, () => 0], { name: 'A', size: 4, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true }),
            board.create('point', [() => vals.l, () => 0], { name: 'B', size: 4, strokeColor: '#a855f7', fillColor: '#a855f7', fixed: true }),
            board.create('point', [() => vals.l, () => vals.w], { name: 'C', size: 4, strokeColor: '#34d399', fillColor: '#34d399', fixed: true }),
            board.create('point', [() => 0, () => vals.w], { name: 'D', size: 4, strokeColor: '#f472b6', fillColor: '#f472b6', fixed: true })
          ];
          board.create('polygon', pts, {
            fillColor: '#38bdf8', fillOpacity: 0.18, borders: { strokeColor: '#7dd3fc', strokeWidth: 3 }
          });
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            vals[key] = raw;
            board.update();
            ctrl.sync();
            if (coordsEl) {
              coordsEl.innerHTML = `ℓ = ${vals.l.toFixed(2)} | w = ${vals.w.toFixed(2)} | Area = ${(vals.l*vals.w).toFixed(2)} | P = ${(2*(vals.l+vals.w)).toFixed(2)}`;
            }
          });
          if (coordsEl) coordsEl.innerHTML = `ℓ = 5.00 | w = 3.00 | Area = 15.00`;
          return;
        }

        // ====================================================================
        // MODEL 3d: SQUARE (side s)
        // ====================================================================
        else if (modelType === "geometry_square") {
          const vals = { s: 3 };
          const pts = [
            board.create('point', [() => 0, () => 0], { name: 'A', size: 4, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true }),
            board.create('point', [() => vals.s, () => 0], { name: 'B', size: 4, strokeColor: '#a855f7', fillColor: '#a855f7', fixed: true }),
            board.create('point', [() => vals.s, () => vals.s], { name: 'C', size: 4, strokeColor: '#34d399', fillColor: '#34d399', fixed: true }),
            board.create('point', [() => 0, () => vals.s], { name: 'D', size: 4, strokeColor: '#f472b6', fillColor: '#f472b6', fixed: true })
          ];
          board.create('polygon', pts, {
            fillColor: '#a855f7', fillOpacity: 0.18, borders: { strokeColor: '#c084fc', strokeWidth: 3 }
          });
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            vals.s = raw;
            board.update();
            ctrl.sync();
            if (coordsEl) {
              coordsEl.innerHTML = `s = ${vals.s.toFixed(2)} | Area = ${(vals.s*vals.s).toFixed(2)} | diagonal = ${(vals.s * Math.SQRT2).toFixed(2)}`;
            }
          });
          if (coordsEl) coordsEl.innerHTML = `s = 3.00 | Area = 9.00`;
          return;
        }

        // ====================================================================
        // MODEL 3e: REGULAR POLYGON (n sides, side length s)
        // ====================================================================
        else if (modelType === "geometry_polygon") {
          const vals = { n: Math.max(3, Math.round(comp.n || 6)), s: comp.side || 2 };
          const n0 = vals.n;
          const R0 = vals.s / (2 * Math.sin(Math.PI / n0));
          const polyPts = [];
          for (let k = 0; k < n0; k++) {
            polyPts.push(board.create('point', [
              R0 * Math.cos(2 * Math.PI * k / n0),
              R0 * Math.sin(2 * Math.PI * k / n0)
            ], {
              name: String.fromCharCode(65 + (k % 26)), size: 3,
              strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true
            }));
          }
          board.create('polygon', polyPts, {
            fillColor: '#38bdf8', fillOpacity: 0.16, borders: { strokeColor: '#7dd3fc', strokeWidth: 2.5 }
          });
          const place = () => {
            const n = Math.max(3, Math.round(vals.n));
            const R = vals.s / (2 * Math.sin(Math.PI / n));
            polyPts.forEach((p, k) => {
              if (k < n) p.moveTo([R * Math.cos(2 * Math.PI * k / n), R * Math.sin(2 * Math.PI * k / n)], 0);
            });
            board.update();
          };
          const ctrl = this.bindGeometryControls(cardId, modelType, vals, (key, raw) => {
            if (key === "n") {
              const nextN = Math.max(3, Math.min(12, Math.round(raw)));
              if (nextN !== n0) {
                comp.n = nextN;
                comp.side = vals.s;
                this.initGraphPlot(cardId, comp);
                return;
              }
              vals.n = nextN;
            } else {
              vals.s = raw;
              comp.side = raw;
              place();
            }
            ctrl.sync();
            const R = vals.s / (2 * Math.sin(Math.PI / vals.n));
            if (coordsEl) {
              coordsEl.innerHTML = `n = ${vals.n} | s = ${vals.s.toFixed(2)} | R = ${R.toFixed(2)} | interior ${(180 * (vals.n - 2) / vals.n).toFixed(1)}°`;
            }
          });
          if (coordsEl) coordsEl.innerHTML = `n = ${vals.n} | s = ${vals.s.toFixed(2)} | regular polygon`;
          return;
        }

        // ====================================================================
        // MODEL 4: PHYSICS PROJECTILE MOTION
        // ====================================================================
        else if (modelType === "physics_projectile") {
          const trajFn = (x) => Math.max(0, x - 0.0245 * x * x);

          board.create('functiongraph', [trajFn, 0, 40.82], {
            strokeColor: '#38bdf8', strokeWidth: 3.5
          });

          // Ground reference line
          board.create('line', [[-5, 0], [50, 0]], { strokeColor: '#475569', strokeWidth: 2, fixed: true });

          // Key markers
          board.create('point', [0, 0], { name: 'Launch (v₀=20m/s, θ=45°)', size: 4, strokeColor: '#34d399', fillColor: '#34d399', fixed: true });
          board.create('point', [20.41, 10.2], { name: 'Apex (H_max=10.2m)', size: 4, strokeColor: '#f59e0b', fillColor: '#f59e0b', fixed: true });
          board.create('point', [40.82, 0], { name: 'Landing (R=40.8m)', size: 4, strokeColor: '#ec4899', fillColor: '#ec4899', fixed: true });

          // Interactive glider along trajectory
          const gliderCurve = board.create('curve', [(t) => t, (t) => trajFn(t), 0, 40.82], { visible: false });
          const glider = board.create('glider', [15, trajFn(15), gliderCurve], {
            name: 'Projectile', size: 6, strokeColor: '#ffffff', fillColor: '#38bdf8'
          });

          const updateProjectileHUD = () => {
            if (!coordsEl) return;
            const x = Math.max(0, Math.min(40.82, glider.X()));
            const y = trajFn(x);
            const t = x / (20 * Math.cos(Math.PI / 4));
            coordsEl.innerHTML = `Time: <strong style="color:#f59e0b">${t.toFixed(2)}s</strong> | Position: <strong style="color:#38bdf8">x = ${x.toFixed(1)}m</strong>, <strong style="color:#34d399">y = ${y.toFixed(1)}m</strong>`;
          };

          glider.on('drag', updateProjectileHUD);
          board.on('update', updateProjectileHUD);
          updateProjectileHUD();
          return;
        }

        // ====================================================================
        // MODEL 5: PHYSICS NEWTON'S 2ND LAW (F = ma)
        // ====================================================================
        else if (modelType === "physics_newton") {
          const newtonFn = (a) => 5 * a;
          board.create('functiongraph', [newtonFn, 0, 10], {
            strokeColor: '#34d399', strokeWidth: 3.5
          });

          const gliderCurve = board.create('curve', [(t) => t, (t) => 5 * t, 0, 10], { visible: false });
          const glider = board.create('glider', [4, 20, gliderCurve], {
            name: 'Mass (5kg)', size: 6, strokeColor: '#ffffff', fillColor: '#34d399'
          });

          const updateNewtonHUD = () => {
            if (!coordsEl) return;
            const a = Math.max(0, Math.min(10, glider.X()));
            const F = 5 * a;
            coordsEl.innerHTML = `Acceleration <strong style="color:#38bdf8">a = ${a.toFixed(1)} m/s²</strong> ➔ Net Force <strong style="color:#34d399">F = ma = ${F.toFixed(1)} N</strong> (m = 5 kg)`;
          };

          glider.on('drag', updateNewtonHUD);
          board.on('update', updateNewtonHUD);
          updateNewtonHUD();
          return;
        }

        // ====================================================================
        // MODEL 6: CHEMISTRY ACID-BASE TITRATION CURVE
        // ====================================================================
        else if (modelType === "chemistry_titration") {
          const titrationFn = (V) => 7.0 + 3.8 * Math.atan(0.7 * (V - 25));

          board.create('functiongraph', [titrationFn, 0, 50], {
            strokeColor: '#ec4899', strokeWidth: 3.5
          });

          // Neutral pH 7 dashed line
          board.create('line', [[0, 7], [50, 7]], {
            strokeColor: 'rgba(255, 255, 255, 0.25)', strokeWidth: 1.5, dash: 2, fixed: true
          });

          // Equivalence point dot
          board.create('point', [25, 7], {
            name: 'Equivalence Pt (V=25mL, pH=7.0)', size: 5, strokeColor: '#34d399', fillColor: '#34d399', fixed: true
          });

          const gliderCurve = board.create('curve', [(t) => t, (t) => titrationFn(t), 0, 50], { visible: false });
          const glider = board.create('glider', [25, 7, gliderCurve], {
            name: 'Titrant', size: 6, strokeColor: '#ffffff', fillColor: '#ec4899'
          });

          const updateTitrationHUD = () => {
            if (!coordsEl) return;
            const V = Math.max(0, Math.min(50, glider.X()));
            const ph = titrationFn(V);
            const state = ph < 6.8 ? "<span style='color:#f87171'>Acidic Region</span>" : (ph > 7.2 ? "<span style='color:#60a5fa'>Basic Region</span>" : "<strong style='color:#34d399'>Neutral Equivalence Point</strong>");
            coordsEl.innerHTML = `Added NaOH: <strong style="color:#ec4899">${V.toFixed(1)} mL</strong> | pH: <strong style="color:#fbcfe8">${ph.toFixed(2)}</strong> (${state})`;
          };

          glider.on('drag', updateTitrationHUD);
          board.on('update', updateTitrationHUD);
          updateTitrationHUD();
          return;
        }

        // ====================================================================
        // MODEL 7: CHEMISTRY REACTION KINETICS
        // ====================================================================
        else if (modelType === "chemistry_kinetics") {
          const kineticsFn = (x) => {
            const baseline = 35 - 1.5 * x;
            const barrier = 55 * Math.exp(-Math.pow((x - 4.5) / 1.6, 2));
            return baseline + barrier;
          };

          board.create('functiongraph', [kineticsFn, 0, 9], {
            strokeColor: '#f59e0b', strokeWidth: 3.5
          });

          board.create('point', [1, kineticsFn(1)], { name: 'Reactants (35 kJ/mol)', size: 4, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true });
          board.create('point', [4.5, kineticsFn(4.5)], { name: 'Transition State (E_a = 50 kJ)', size: 5, strokeColor: '#ef4444', fillColor: '#ef4444', fixed: true });
          board.create('point', [8, kineticsFn(8)], { name: 'Products (ΔH = -15 kJ)', size: 4, strokeColor: '#34d399', fillColor: '#34d399', fixed: true });

          if (coordsEl) {
            coordsEl.innerHTML = `Activation Energy: <strong style="color:#ef4444">E_a = 50 kJ/mol</strong> | Enthalpy: <strong style="color:#34d399">ΔH = -15 kJ/mol (Exothermic)</strong>`;
          }
          return;
        }

        // ====================================================================
        // MODEL 8: GENERAL FUNCTION PLOT (Calculus, Signum, Polynomials, Trig)
        // ====================================================================
        else {
          const isSign = formulaStr.toLowerCase().includes("sgn") || formulaStr.toLowerCase().includes("sign");

          if (isSign) {
            // Negative piece: x in [xMin, 0), y = -1
            board.create('line', [[-30, -1], [0, -1]], {
              straightFirst: false, straightLast: false, strokeColor: '#38bdf8', strokeWidth: 3.5
            });
            // Positive piece: x in (0, xMax], y = 1
            board.create('line', [[0, 1], [30, 1]], {
              straightFirst: false, straightLast: false, strokeColor: '#38bdf8', strokeWidth: 3.5
            });
            // Solid Point at origin (0, 0)
            board.create('point', [0, 0], {
              name: '(0,0)', size: 4, strokeColor: '#38bdf8', fillColor: '#38bdf8', fixed: true
            });
            // Open circles at (0, -1) and (0, 1) to indicate jump discontinuity
            board.create('point', [0, -1], {
              name: '', size: 4, strokeColor: '#38bdf8', fillColor: '#08090d', strokeWidth: 2, fixed: true
            });
            board.create('point', [0, 1], {
              name: '', size: 4, strokeColor: '#38bdf8', fillColor: '#08090d', strokeWidth: 2, fixed: true
            });
          } else {
            const fn = this.compileMathFunction(formulaStr);
            board.create('functiongraph', [fn], {
              strokeColor: '#38bdf8',
              strokeWidth: 3.5
            });
          }

          board.on('move', (e) => {
            if (!coordsEl) return;
            try {
              const coords = board.getUsrCoordsOfMouse(e);
              if (coords && coords.length >= 3) {
                coordsEl.innerText = `x: ${coords[1].toFixed(2)}, y: ${coords[2].toFixed(2)}`;
              }
            } catch (_) {}
          });
          return;
        }
      } catch (err) {
        console.warn("[GANDAL GRAPH] JSXGraph init error, falling back to Canvas:", err);
      }
    }

    // Priority 2: High-DPI HTML5 Canvas Fallback Plotter
    this.renderCanvasGraph(canvas, coordsEl, comp, domain, range);
  }

  compileMathFunction(expr) {
    let clean = (expr || "").trim()
      .replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "")
      .replace(/^[yY]\s*=\s*/, "");
    
    if (clean.includes("sgn") || clean.includes("sign")) {
      return (x) => Math.sign(x);
    }

    clean = clean.replace(/\^/g, "**")
      .replace(/\bsin\b/g, "Math.sin")
      .replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan")
      .replace(/\bsqrt\b/g, "Math.sqrt")
      .replace(/\babs\b/g, "Math.abs")
      .replace(/\bexp\b/g, "Math.exp")
      .replace(/\bln\b/g, "Math.log")
      .replace(/\blog\b/g, "Math.log10")
      .replace(/\bpi\b/gi, "Math.PI")
      .replace(/\be\b/g, "Math.E");

    clean = clean.replace(/(\d)\s*([xX])/g, "$1*$2");
    clean = clean.replace(/(\d)\s*(Math\.)/g, "$1*$2");

    try {
      const compiled = new Function("x", `"use strict"; return (${clean});`);
      compiled(1);
      return compiled;
    } catch (e) {
      return (x) => x * x;
    }
  }

  renderCanvasGraph(canvas, coordsEl, comp, domain, range) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 500;
    const height = 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const modelType = (typeof comp === "object" && comp.model_type) ? comp.model_type : "function_plot";
    const formulaStr = (typeof comp === "object" && comp.formula) ? comp.formula : (typeof comp === "string" ? comp : "sgn(x)");

    const xMin = domain[0], xMax = domain[1];
    const yMin = range[0], yMax = range[1];

    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;
    const fromCanvasX = (cx) => xMin + (cx / width) * (xMax - xMin);
    const fromCanvasY = (cy) => yMax - (cy / height) * (yMax - yMin);

    // Background
    ctx.fillStyle = "#08090d";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;

    // X Axis
    if (yMin <= 0 && yMax >= 0) {
      const cy = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
    }
    // Y Axis
    if (xMin <= 0 && xMax >= 0) {
      const cx = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }

    // Axis tick numbers — same high-contrast as formula labels (e.g. c² = 25)
    ctx.fillStyle = DARK_GRAPH_AXIS_LABEL;
    ctx.font = "12px ui-monospace, 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let xStep = 1;
    if (xMax - xMin > 12) xStep = 2;
    if (xMax - xMin > 24) xStep = 5;
    const xAxisY = Math.min(Math.max(toCanvasY(0) + 6, 8), height - 16);
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
      if (x === 0) continue;
      ctx.fillText(String(x), toCanvasX(x), xAxisY);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    let yStep = 1;
    if (yMax - yMin > 12) yStep = 2;
    if (yMax - yMin > 24) yStep = 5;
    let yAxisX = toCanvasX(0) - 8;
    if (yAxisX < 22) {
      yAxisX = toCanvasX(0) + 8;
      ctx.textAlign = "left";
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
      if (y === 0) continue;
      ctx.fillText(String(y), yAxisX, toCanvasY(y));
    }

    // ====================================================================
    // CANVAS MODEL 1: GEOMETRIC TRIANGLE ABC
    // ====================================================================
    if (modelType === "geometry_triangle") {
      const ax = toCanvasX(0), ay = toCanvasY(0);
      const bx = toCanvasX(4.5), by = toCanvasY(0);
      const cx = toCanvasX(1.8), cy = toCanvasY(3.2);

      // Filled translucent polygon
      const grad = ctx.createLinearGradient(ax, ay, cx, cy);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      grad.addColorStop(0.5, "rgba(168, 85, 247, 0.25)");
      grad.addColorStop(1, "rgba(236, 72, 153, 0.25)");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();

      // Border
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dashed altitude line from C to base
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, ay);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label altitude
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px monospace";
      ctx.fillText("h = 3.2", cx + 22, (cy + ay) / 2);

      // Vertices
      const drawVertex = (x, y, name, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(name, x, y - 10);
      };

      drawVertex(ax, ay, "A (0,0)", "#38bdf8");
      drawVertex(bx, by, "B (4.5,0)", "#a855f7");
      drawVertex(cx, cy, "C (1.8,3.2)", "#ec4899");

      // Angle Arcs
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ax, ay, 24, -Math.atan2(3.2, 1.8), 0);
      ctx.stroke();

      ctx.strokeStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(bx, by, 24, Math.PI, Math.PI + Math.atan2(3.2, 2.7));
      ctx.stroke();

      if (coordsEl) {
        coordsEl.innerHTML = `<span style="color:#38bdf8">∠A: 60.6°</span> + <span style="color:#a855f7">∠B: 49.9°</span> + <span style="color:#ec4899">∠C: 69.5°</span> = <strong style="color:#34d399">180.0°</strong> | Base: 4.5, Height: 3.2`;
      }
      return;
    }

    // ====================================================================
    // CANVAS MODEL 2: GEOMETRIC CIRCLE
    // ====================================================================
    else if (modelType === "geometry_circle") {
      const ox = toCanvasX(0), oy = toCanvasY(0);
      const px = toCanvasX(3), py = toCanvasY(0);
      const rPx = Math.abs(px - ox);

      // Circle fill and stroke
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.beginPath();
      ctx.arc(ox, oy, rPx, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Radius line
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center and perimeter points
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("O(0,0)", ox - 16, oy - 8);

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("P(3,0) [r=3]", px + 10, py - 6);

      if (coordsEl) {
        coordsEl.innerHTML = `Radius: <strong style="color:#38bdf8">r = 3.00</strong> | Circumference: <strong style="color:#f472b6">C = 2πr ≈ 18.85</strong> | Area: <strong style="color:#34d399">A = πr² ≈ 28.27</strong>`;
      }
      return;
    }

    // ====================================================================
    // CANVAS MODEL 3: PYTHAGOREAN THEOREM (3-4-5)
    // ====================================================================
    else if (modelType === "geometry_pythagoras") {
      const ax = toCanvasX(0), ay = toCanvasY(0);
      const bx = toCanvasX(4), by = toCanvasY(0);
      const cx = toCanvasX(0), cy = toCanvasY(3);

      // Triangle
      ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Squares
      ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
      ctx.fillRect(toCanvasX(0), toCanvasY(0), toCanvasX(4) - toCanvasX(0), toCanvasY(-4) - toCanvasY(0));

      ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
      ctx.fillRect(toCanvasX(-3), toCanvasY(3), toCanvasX(0) - toCanvasX(-3), toCanvasY(0) - toCanvasY(3));

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("a² = 16", (ax + bx) / 2, ay + 30);
      ctx.fillText("b² = 9", ax - 45, (ay + cy) / 2);
      ctx.fillText("c² = 25", (bx + cx) / 2 + 15, (by + cy) / 2 - 15);

      if (coordsEl) {
        coordsEl.innerHTML = `<span style="color:#38bdf8">a² (16)</span> + <span style="color:#c084fc">b² (9)</span> = <span style="color:#34d399">c² (25)</span> ➔ <strong style="color:#34d399">9 + 16 = 25 (Verified!)</strong>`;
      }
      return;
    }

    // ====================================================================
    // CANVAS MODEL 4: PHYSICS PROJECTILE MOTION
    // ====================================================================
    else if (modelType === "physics_projectile") {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= 40.82; x += 0.2) {
        const y = Math.max(0, x - 0.0245 * x * x);
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Ground
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0));
      ctx.lineTo(width, toCanvasY(0));
      ctx.stroke();

      // Apex point
      const apexX = toCanvasX(20.41), apexY = toCanvasY(10.2);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(apexX, apexY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Apex: H_max = 10.2m", apexX, apexY - 10);

      if (coordsEl) {
        coordsEl.innerHTML = `Launch: <strong style="color:#38bdf8">v₀ = 20 m/s, θ = 45°</strong> | Apex: <strong style="color:#f59e0b">10.2 m</strong> | Range: <strong style="color:#34d399">40.8 m</strong>`;
      }
      return;
    }

    // ====================================================================
    // CANVAS MODEL 5: CHEMISTRY TITRATION
    // ====================================================================
    else if (modelType === "chemistry_titration") {
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let V = 0; V <= 50; V += 0.2) {
        const ph = 7.0 + 3.8 * Math.atan(0.7 * (V - 25));
        const cx = toCanvasX(V);
        const cy = toCanvasY(ph);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Neutral pH line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(7));
      ctx.lineTo(width, toCanvasY(7));
      ctx.stroke();
      ctx.setLineDash([]);

      // Equivalence point
      const eqX = toCanvasX(25), eqY = toCanvasY(7);
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(eqX, eqY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Equivalence Point (pH 7.0, 25 mL)", eqX + 10, eqY - 8);

      if (coordsEl) {
        coordsEl.innerHTML = `Equivalence Point: <strong style="color:#34d399">V = 25 mL, pH = 7.0 (Neutralized)</strong>`;
      }
      return;
    }

    // ====================================================================
    // CANVAS MODEL 6: GENERAL FUNCTION PLOT (Calculus, Signum, Trig)
    // ====================================================================
    const isSign = formulaStr.toLowerCase().includes("sgn") || formulaStr.toLowerCase().includes("sign");
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;

    if (isSign) {
      const yNeg = toCanvasY(-1);
      const yPos = toCanvasY(1);

      // x < 0 piece
      ctx.beginPath();
      ctx.moveTo(toCanvasX(xMin), yNeg);
      ctx.lineTo(toCanvasX(0), yNeg);
      ctx.stroke();

      // x > 0 piece
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), yPos);
      ctx.lineTo(toCanvasX(xMax), yPos);
      ctx.stroke();

      // Solid center point (0, 0)
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(toCanvasX(0), toCanvasY(0), 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Open circles at (0, -1) and (0, 1)
      ctx.fillStyle = "#08090d";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(toCanvasX(0), yNeg, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(toCanvasX(0), yPos, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const fn = this.compileMathFunction(formulaStr);
      ctx.beginPath();
      let started = false;
      const steps = width * 2;
      for (let s = 0; s <= steps; s++) {
        const x = xMin + (s / steps) * (xMax - xMin);
        try {
          const y = fn(x);
          if (Number.isFinite(y)) {
            const cx = toCanvasX(x);
            const cy = toCanvasY(y);
            if (!started) {
              ctx.moveTo(cx, cy);
              started = true;
            } else {
              ctx.lineTo(cx, cy);
            }
          }
        } catch (e) {}
      }
      ctx.stroke();
    }

    canvas.onmousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      const mouseX = e.clientX - r.left;
      const mouseY = e.clientY - r.top;
      const mathX = fromCanvasX(mouseX);
      const mathY = fromCanvasY(mouseY);
      if (coordsEl) {
        coordsEl.innerText = `x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)}`;
      }
    };
  }

  openInOmniGraph(formula) {
    if (typeof window.selectLauncherTab === "function") {
      window.selectLauncherTab("stem_graphs");
      setTimeout(() => {
        const iframe = document.getElementById("stemGraphsIframe");
        if (iframe && iframe.contentWindow) {
          const clean = (formula || "").replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "").replace(/^[yY]\s*=\s*/, "");
          iframe.contentWindow.postMessage({ type: "PLOT_FORMULA", formula: clean }, "*");
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const inp = doc.getElementById("formulaInputBox");
            if (inp) {
              inp.value = clean;
              inp.dispatchEvent(new Event("input", { bubbles: true }));
              inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            }
          } catch (e) {}
        }
      }, 350);
    }
  }

  buildQuizCard(comp) {
    const cardId = "quiz_" + Math.random().toString(36).substring(2, 9);
    this.activeQuizCardId = cardId;
    const card = document.createElement("div");
    card.className = "a2ui-quiz-card";
    card.id = cardId;

    const questionHtml = this.formatMarkdown(comp.question || "Practice Question");
    const options = Array.isArray(comp.options) ? comp.options : [];
    const answerIndex = typeof comp.answer_index === "number" ? comp.answer_index : 0;
    const explanation = comp.explanation || "Well done! Keep exploring.";

    // Save quiz card data in memory
    this.quizCards[cardId] = {
      question: comp.question || "",
      options: options,
      answerIndex: answerIndex,
      explanation: explanation,
      answered: false
    };

    const letters = ["A", "B", "C", "D", "E", "F"];
    let optionsHtml = "";
    options.forEach((opt, idx) => {
      const letter = letters[idx] || String(idx + 1);
      const optHtml = this.formatMarkdown(opt);
      optionsHtml += `
        <div 
          class="a2ui-quiz-option" 
          id="${cardId}_opt_${idx}"
          onclick="window.gandalSpaceApp.selectQuizOption('${cardId}', ${idx})"
        >
          <div class="a2ui-quiz-letter">${letter}</div>
          <div class="a2ui-quiz-text">${optHtml}</div>
          <span class="a2ui-quiz-mark" id="${cardId}_mark_${idx}"></span>
        </div>
      `;
    });

    const quizDiscussPrompt = `the quiz question: ${comp.question || "this quiz"}`;

    card.innerHTML = `
      <div class="a2ui-card-top">
        <h3 class="a2ui-card-title" style="color: #c084fc;">🎯 Practice Quiz: Test Your Understanding</h3>
        <span class="a2ui-card-badge" style="background: rgba(34, 197, 94, 0.2); color: #86efac;">Instant Check</span>
      </div>

      <div class="a2ui-quiz-question">${questionHtml}</div>

      <div class="a2ui-quiz-options" id="${cardId}_options">
        ${optionsHtml}
      </div>

      <div class="a2ui-quiz-explanation" id="${cardId}_explanation">
        <div class="a2ui-quiz-explanation-header">💡 Detailed Explanation</div>
        <div class="a2ui-quiz-explanation-text">${this.formatMarkdown(explanation)}</div>
      </div>

      <div class="a2ui-quiz-ai-box">
        <div class="a2ui-quiz-ai-title">
          <span>⚡ Want to practice your own explanation? Ask AI:</span>
        </div>
        <div class="a2ui-quiz-ai-input-row">
          <input 
            type="text" 
            class="a2ui-quiz-ai-input" 
            id="${cardId}_ai_input" 
            placeholder="Type your explanation or reasoning in your own words..."
            onkeydown="if(event.key==='Enter') window.gandalSpaceApp.checkQuizWithAI('${cardId}')"
          />
          <button class="a2ui-quiz-ai-btn" onclick="window.gandalSpaceApp.checkQuizWithAI('${cardId}')">
            Check with AI
          </button>
        </div>
        <div class="a2ui-quiz-ai-feedback" id="${cardId}_ai_feedback"></div>
      </div>

      <button class="a2ui-discuss-btn" id="${cardId}_discuss_btn" onclick="window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(quizDiscussPrompt)}')">
        🎙️ Ask Gandho to Explain This Quiz
      </button>
    `;

    return card;
  }

  selectQuizOption(cardId, selectedIndex) {
    const quiz = this.quizCards[cardId];
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    quiz.lastSelectedIndex = selectedIndex;

    const isCorrect = selectedIndex === quiz.answerIndex;
    const selectedOpt = document.getElementById(`${cardId}_opt_${selectedIndex}`);
    const selectedMark = document.getElementById(`${cardId}_mark_${selectedIndex}`);
    const explanationEl = document.getElementById(`${cardId}_explanation`);

    // Disable all options
    quiz.options.forEach((_, idx) => {
      const optEl = document.getElementById(`${cardId}_opt_${idx}`);
      if (optEl) optEl.classList.add("disabled");
    });

    if (isCorrect) {
      if (selectedOpt) selectedOpt.classList.add("correct");
      if (selectedMark) {
        selectedMark.innerText = "✅";
        selectedMark.style.display = "inline-block";
      }
    } else {
      if (selectedOpt) selectedOpt.classList.add("incorrect");
      if (selectedMark) {
        selectedMark.innerText = "❌";
        selectedMark.style.display = "inline-block";
      }
      // Highlight correct answer in green
      const correctOpt = document.getElementById(`${cardId}_opt_${quiz.answerIndex}`);
      if (correctOpt) correctOpt.classList.add("show-correct");
      const correctMark = document.getElementById(`${cardId}_mark_${quiz.answerIndex}`);
      if (correctMark) {
        correctMark.innerText = "✓ (Correct)";
        correctMark.style.display = "inline-block";
        correctMark.style.color = "#22c55e";
      }
    }

    if (explanationEl) {
      explanationEl.classList.add("visible");
    }
    this.syncTableauQuizMarks(cardId, selectedIndex);
    this.reportTrackQuiz(isCorrect, quiz.question || "");
  }

  async checkQuizWithAI(cardId) {
    const quiz = this.quizCards[cardId];
    const input = document.getElementById(`${cardId}_ai_input`);
    const feedbackEl = document.getElementById(`${cardId}_ai_feedback`);
    if (!quiz || !input || !feedbackEl) return;

    const studentText = input.value.trim();
    if (!studentText) {
      input.focus();
      return;
    }

    feedbackEl.classList.add("visible");
    feedbackEl.innerHTML = `<em>Analyzing your explanation with AI...</em>`;

    const prompt = `The student is practicing a quiz question: "${quiz.question}". The correct answer is: "${quiz.options[quiz.answerIndex]}". The student explains their reasoning as: "${studentText}". In 2 short sentences, evaluate whether their reasoning is correct, clarify any misconception, and give encouraging feedback.`;

    try {
      const resp = await fetch("/api/gandal_space/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: quiz.question,
          history: []
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.error || "Gemma 4 E4B is not running on :8080.";
        if (data.success === false) {
          feedbackEl.innerHTML = `<strong>Gemma unavailable:</strong> ${escapeHtml(reply)}`;
        } else {
          feedbackEl.innerHTML = `<strong>AI Assessment:</strong> ${escapeHtml(reply)}`;
        }
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      console.warn("[GANDAL QUIZ] AI check error:", err);
      feedbackEl.innerHTML = `<strong>Gemma unavailable:</strong> Start LOCAL_LLM_URL (gemma-4-e4b on :8080) or set GOOGLE_API_KEY.`;
    }
  }

  buildFollowupChips(followups) {
    if (!Array.isArray(followups) || followups.length === 0) return null;
    const container = document.createElement("div");
    container.className = "a2ui-followups-container";

    container.innerHTML = `
      <div class="a2ui-followups-header">
        <span>🧭 Suggested Follow-up Questions</span>
      </div>
      <div class="a2ui-followup-chips">
        ${followups.map(f => `
          <span class="a2ui-followup-chip" onclick="window.gandalSpaceApp.selectPrompt('${escapeAttr(f)}')">
            <span>${escapeHtml(f)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </span>
        `).join("")}
      </div>
    `;
    return container;
  }

  /* ========================================================================
     PHONICS, ALPHABET PROGRESSION & INTERACTIVE SPEECH
     ======================================================================== */
  static ALPHABET_DICTIONARY = GANDAL_ALPHABET_DICTIONARY;

  buildPronunciationCard(comp) {
    const rawLetter = (comp.letter || "A").toUpperCase().trim();
    const foundIdx = GANDAL_ALPHABET_DICTIONARY.findIndex(item => item.letter === rawLetter);
    this.activeAlphabetIndex = foundIdx >= 0 ? foundIdx : 0;
    const item = GANDAL_ALPHABET_DICTIONARY[this.activeAlphabetIndex];

    // Merge any custom properties provided by server
    const letter = rawLetter || item.letter;
    const phoneme = comp.expected_phoneme || item.phoneme;
    const word = comp.word_example || item.word;
    const textToSpeak = comp.text_to_speak || item.text_to_speak;
    const tip = comp.tip || item.tip;
    const example = item.example || `${letter} is for ${word}`;

    this.activeLetter = letter;
    this.activePhoneme = phoneme;

    const card = document.createElement("div");
    card.className = "a2ui-pronunciation-card";
    card.id = "a2uiPronunciationCardContainer";

    card.innerHTML = `
      <div class="a2ui-card-top">
        <div class="a2ui-card-title-group">
          <h3 class="a2ui-card-title">Phonics &amp; Pronunciation Challenge</h3>
          <span class="a2ui-card-sub">Letter <span id="a2uiLetterNum">${this.activeAlphabetIndex + 1}</span> of 26 &bull; Swipe or click arrows to swap</span>
        </div>
        <div class="a2ui-card-top-controls">
          <span class="a2ui-card-badge" style="background: rgba(236, 72, 153, 0.25); color: #f472b6;">Interactive Speech</span>
          <div class="a2ui-letter-nav-pills">
            <button class="a2ui-letter-nav-btn prev" title="Previous letter (‹ or swipe right)" onclick="window.gandalSpaceApp.navigateAlphabetLetter(-1)">‹</button>
            <button class="a2ui-letter-nav-btn next" title="Next letter (› or swipe left)" onclick="window.gandalSpaceApp.navigateAlphabetLetter(1)">›</button>
          </div>
        </div>
      </div>
      
      <div class="a2ui-phonics-showcase-container" id="a2uiPhonicsShowcaseArea">
        <button class="a2ui-arrow-side prev" title="Previous Letter (‹)" onclick="window.gandalSpaceApp.navigateAlphabetLetter(-1)">
          ‹
        </button>

        <div class="a2ui-phonics-showcase">
          <div class="a2ui-letter-avatar" id="a2uiActiveLetterAvatar">${escapeHtml(letter)}</div>
          <div class="a2ui-phonics-details">
            <span class="a2ui-phoneme-badge" id="a2uiActivePhoneme">Phoneme: ${escapeHtml(phoneme)}</span>
            <span class="a2ui-word-example" id="a2uiActiveWord">Word: ${escapeHtml(word)}</span>
            <span class="a2ui-sentence-example" id="a2uiActiveSentence">${escapeHtml(example)}</span>
          </div>
        </div>

        <button class="a2ui-arrow-side next" title="Next Letter (›)" onclick="window.gandalSpaceApp.navigateAlphabetLetter(1)">
          ›
        </button>
      </div>

      <div class="a2ui-phonics-tip" id="a2uiActiveTip">
        💡 <strong>Pronunciation Guide:</strong> ${escapeHtml(tip)}
      </div>

      <div class="a2ui-phonics-actions">
        <button class="a2ui-btn-hear" id="a2uiBtnHear" onclick="window.gandalSpaceApp.speakText('${escapeAttr(textToSpeak)}')">
          🔊 Hear It
        </button>
        <button class="a2ui-btn-record" id="a2uiBtnRecord" onclick="window.gandalSpaceApp.recordAndCheck('${letter}', '${escapeAttr(phoneme)}')">
          🎤 Repeat &amp; Check
        </button>
      </div>

      <div id="pronounceFeedbackMount" class="a2ui-feedback-mount"></div>
    `;

    this.setupCardSwipeGestures(card);
    return card;
  }

  buildAudioFeedback(comp) {
    const isSuccess = comp.status === "success";
    const el = document.createElement("div");
    el.className = `a2ui-audio-feedback ${isSuccess ? 'success' : 'retry'}`;
    
    const nextIdx = (this.activeAlphabetIndex + 1) % GANDAL_ALPHABET_DICTIONARY.length;
    const nextItem = GANDAL_ALPHABET_DICTIONARY[nextIdx];

    el.innerHTML = `
      <div class="a2ui-feedback-main">
        <div class="a2ui-feedback-score">${comp.score || (isSuccess ? 96 : 65)}%</div>
        <div class="a2ui-feedback-text">
          <strong>${isSuccess ? '🎉 Spot on! Bravo !' : '🔄 Let\'s try again!'}</strong><br/>
          ${escapeHtml(comp.feedback_text || "")}
        </div>
      </div>
      ${isSuccess ? `
        <div class="a2ui-success-action-row">
          <button class="a2ui-btn-next-letter-celebrate" onclick="window.gandalSpaceApp.navigateAlphabetLetter(1)">
            <span>✨ Reveal Next Letter: <strong>${nextItem.letter} (${nextItem.word})</strong></span>
            <span class="a2ui-btn-arrow">➡️</span>
          </button>
        </div>
      ` : `
        <div class="a2ui-retry-action-row">
          <button class="a2ui-btn-retry-hear" onclick="window.gandalSpaceApp.speakText('${escapeAttr(GANDAL_ALPHABET_DICTIONARY[this.activeAlphabetIndex].text_to_speak)}')">
            🔊 Hear '${GANDAL_ALPHABET_DICTIONARY[this.activeAlphabetIndex].letter}' again
          </button>
        </div>
      `}
    `;
    return el;
  }

  navigateAlphabetLetter(delta, autoHear = true) {
    if (!GANDAL_ALPHABET_DICTIONARY || GANDAL_ALPHABET_DICTIONARY.length === 0) return;
    const total = GANDAL_ALPHABET_DICTIONARY.length;
    this.activeAlphabetIndex = (this.activeAlphabetIndex + delta + total) % total;
    const item = GANDAL_ALPHABET_DICTIONARY[this.activeAlphabetIndex];

    this.activeLetter = item.letter;
    this.activePhoneme = item.phoneme;

    // Update DOM elements inside the pronunciation card
    const letterNumEl = document.getElementById("a2uiLetterNum");
    if (letterNumEl) letterNumEl.innerText = `${this.activeAlphabetIndex + 1}`;

    const avatarEl = document.getElementById("a2uiActiveLetterAvatar");
    if (avatarEl) {
      avatarEl.innerText = item.letter;
      avatarEl.classList.remove("a2ui-pop-anim");
      void avatarEl.offsetWidth; // Force reflow
      avatarEl.classList.add("a2ui-pop-anim");
    }

    const phonemeEl = document.getElementById("a2uiActivePhoneme");
    if (phonemeEl) phonemeEl.innerText = `Phoneme: ${item.phoneme}`;

    const wordEl = document.getElementById("a2uiActiveWord");
    if (wordEl) wordEl.innerText = `Word: ${item.word}`;

    const sentenceEl = document.getElementById("a2uiActiveSentence");
    if (sentenceEl) sentenceEl.innerText = item.example || `${item.letter} is for ${item.word}`;

    const tipEl = document.getElementById("a2uiActiveTip");
    if (tipEl) {
      tipEl.innerHTML = `💡 <strong>Pronunciation Guide:</strong> ${escapeHtml(item.tip)}`;
    }

    const btnHear = document.getElementById("a2uiBtnHear");
    if (btnHear) {
      btnHear.setAttribute("onclick", `window.gandalSpaceApp.speakText('${escapeAttr(item.text_to_speak)}')`);
    }

    const btnRecord = document.getElementById("a2uiBtnRecord") || document.getElementById(`btnRecord_${item.letter}`);
    if (btnRecord) {
      btnRecord.id = "a2uiBtnRecord";
      btnRecord.setAttribute("onclick", `window.gandalSpaceApp.recordAndCheck('${item.letter}', '${escapeAttr(item.phoneme)}')`);
      btnRecord.classList.remove("recording");
    }

    const feedbackMount = document.getElementById("pronounceFeedbackMount") || document.getElementById(`pronounceFeedback_${item.letter}`);
    if (feedbackMount) {
      feedbackMount.innerHTML = "";
    }

    // Update Tableau Noir Socratique with Gandho's chalk guide for the new letter
    const chalkNote = `### Letter ${item.letter} (${item.letter.toLowerCase()})\n\n` +
      `**Word:** ${item.word} &bull; **Phoneme:** \`${item.phoneme}\`\n\n` +
      `*${item.example}*\n\n` +
      `> 💡 **Gandho's Guide:** ${item.tip}\n\n` +
      `Click **"🔊 Hear It"** or **"🎤 Repeat & Check"** to practice!`;
    
    if (typeof this.writeToWhiteboard === "function") {
      this.writeToWhiteboard(chalkNote, "Gandho");
    }

    // Speak audio pronunciation aloud
    if (autoHear) {
      this.speakText(item.text_to_speak);
    }

    // Automatically update the Practice Quiz Card below for this revealed letter!
    this.updateQuizCardForLetter(item);
  }

  updateQuizCardForLetter(item) {
    if (!item) return;

    // Locate the active QuizCard in the DOM
    const quizCardEl = (this.activeQuizCardId ? document.getElementById(this.activeQuizCardId) : null) 
      || document.querySelector(".a2ui-quiz-card");
    if (!quizCardEl) return;

    const cardId = quizCardEl.id;
    this.activeQuizCardId = cardId;

    const quizData = item.quiz || {
      question: `Which of these words starts with the letter '${item.letter}' sound, like in '${item.word}'?`,
      options: [item.word, "Sun", "Moon"],
      answerIndex: 0,
      explanation: `Spot on! '${item.word}' begins with the letter ${item.letter} sound (${item.phoneme})!`
    };

    // Update in-memory state and reset answered flag
    this.quizCards[cardId] = {
      question: quizData.question,
      options: quizData.options,
      answerIndex: quizData.answerIndex,
      explanation: quizData.explanation,
      answered: false
    };

    // Smooth bounce / pulse animation on the quiz card
    quizCardEl.classList.remove("a2ui-quiz-pop-anim");
    void quizCardEl.offsetWidth; // Force DOM reflow
    quizCardEl.classList.add("a2ui-quiz-pop-anim");

    // Update Question text
    const questionEl = quizCardEl.querySelector(".a2ui-quiz-question");
    if (questionEl) {
      questionEl.innerHTML = this.formatMarkdown(quizData.question);
    }

    // Re-render Options cleanly (clearing disabled, correct, incorrect, show-correct)
    const optionsContainer = document.getElementById(`${cardId}_options`) || quizCardEl.querySelector(".a2ui-quiz-options");
    if (optionsContainer) {
      const letters = ["A", "B", "C", "D", "E", "F"];
      let optionsHtml = "";
      quizData.options.forEach((opt, idx) => {
        const letter = letters[idx] || String(idx + 1);
        const optHtml = this.formatMarkdown(opt);
        optionsHtml += `
          <div 
            class="a2ui-quiz-option" 
            id="${cardId}_opt_${idx}"
            onclick="window.gandalSpaceApp.selectQuizOption('${cardId}', ${idx})"
          >
            <div class="a2ui-quiz-letter">${letter}</div>
            <div class="a2ui-quiz-text">${optHtml}</div>
            <span class="a2ui-quiz-mark" id="${cardId}_mark_${idx}"></span>
          </div>
        `;
      });
      optionsContainer.innerHTML = optionsHtml;
    }

    // Reset Explanation box (hide until answered)
    const explanationEl = document.getElementById(`${cardId}_explanation`) || quizCardEl.querySelector(".a2ui-quiz-explanation");
    if (explanationEl) {
      explanationEl.classList.remove("visible");
      const textEl = explanationEl.querySelector(".a2ui-quiz-explanation-text");
      if (textEl) {
        textEl.innerHTML = this.formatMarkdown(quizData.explanation);
      }
    }

    // Reset AI input and feedback
    const aiInput = document.getElementById(`${cardId}_ai_input`);
    if (aiInput) aiInput.value = "";
    const aiFeedback = document.getElementById(`${cardId}_ai_feedback`);
    if (aiFeedback) {
      aiFeedback.innerHTML = "";
      aiFeedback.className = "a2ui-quiz-ai-feedback";
    }

    // Update Discuss Button prompt
    const discussBtn = document.getElementById(`${cardId}_discuss_btn`) || quizCardEl.querySelector(".a2ui-discuss-btn");
    if (discussBtn) {
      const quizDiscussPrompt = `the quiz question: ${quizData.question}`;
      discussBtn.setAttribute("onclick", `window.gandalSpaceApp.askGandhoAboutTopic('${escapeAttr(quizDiscussPrompt)}')`);
    }
  }

  setupCardSwipeGestures(card) {
    if (!card) return;
    let startX = 0;
    let startY = 0;
    let isTouching = false;

    // Mobile / Touchscreen gestures
    card.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTouching = true;
      }
    }, { passive: true });

    card.addEventListener("touchend", (e) => {
      if (!isTouching || e.changedTouches.length === 0) return;
      isTouching = false;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Ensure horizontal swipe is dominant and exceeds 45px
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        if (diffX < 0) {
          // Swiped left -> advance to next letter
          this.navigateAlphabetLetter(1);
        } else {
          // Swiped right -> go back to previous letter
          this.navigateAlphabetLetter(-1);
        }
      }
    }, { passive: true });

    // Desktop mouse / pointer drag gesture
    let pointerStartX = 0;
    let pointerDown = false;

    card.addEventListener("mousedown", (e) => {
      // Ignore click on interactive buttons or links
      if (e.target.closest("button, a, input, select, textarea")) return;
      pointerStartX = e.clientX;
      pointerDown = true;
    });

    card.addEventListener("mouseup", (e) => {
      if (!pointerDown) return;
      pointerDown = false;
      const diffX = e.clientX - pointerStartX;
      if (Math.abs(diffX) > 50) {
        if (diffX < 0) {
          this.navigateAlphabetLetter(1);
        } else {
          this.navigateAlphabetLetter(-1);
        }
      }
    });

    card.addEventListener("mouseleave", () => {
      pointerDown = false;
    });
  }

  /* Phonics & Pronunciation Spoken Audio Guidance */
  speakText(text, lang = "en-US") {
    // Also display phonetic guide on Tableau Noir Socratique
    if (typeof this.writeToWhiteboard === "function") {
      this.writeToWhiteboard(text, "Gandho");
    }

    // Play clear spoken audio pronunciation so the student can repeat it!
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        // Clean markdown characters like asterisks, hashes, and slashes
        const clean = text.replace(/[\*\#\_]/g, "").trim();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = lang || (document.documentElement.lang === "fr" ? "fr-FR" : "en-US");
        utterance.rate = 0.88; // Slightly measured rate for crisp phonetic pronunciation
        utterance.pitch = 1.0;

        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length) {
            const prefix = utterance.lang.slice(0, 2);
            const naturalVoice = voices.find(v => v.lang.startsWith(prefix) && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neural") || v.name.includes("Online")))
              || voices.find(v => v.lang.startsWith(prefix))
              || voices[0];
            if (naturalVoice) utterance.voice = naturalVoice;
          }
        };

        pickVoice();
        if (!utterance.voice && window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = pickVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[Gandal Space] Phonics speech playback warning:", err);
      }
    }
  }

  /* MediaRecorder Pronunciation Check */
  async recordAndCheck(letter, phoneme) {
    const btn = document.getElementById("a2uiBtnRecord") || document.getElementById(`btnRecord_${letter}`);
    const feedbackMount = document.getElementById("pronounceFeedbackMount") || document.getElementById(`pronounceFeedback_${letter}`);

    if (btn && btn.classList.contains("recording")) {
      return; // Already recording
    }

    const currentItem = GANDAL_ALPHABET_DICTIONARY[this.activeAlphabetIndex] || { letter, phoneme };
    const curLetter = currentItem.letter || letter;
    const curPhoneme = currentItem.phoneme || phoneme;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (feedbackMount) {
        feedbackMount.innerHTML = `<p style="font-size:0.85rem; color:#94a3b8; margin:8px 0 0;">Evaluating pronunciation match for '${curLetter}'...</p>`;
      }
      try {
        const resp = await fetch("/api/gandal_space/eval_audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_letter: curLetter,
            expected_phoneme: curPhoneme,
            student_transcript: curLetter
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (feedbackMount) {
            feedbackMount.innerHTML = "";
            feedbackMount.appendChild(this.buildAudioFeedback(data));
          }
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (btn) btn.classList.add("recording");
      if (feedbackMount) {
        feedbackMount.innerHTML = `<p style="font-size:0.85rem; color:#f472b6; margin:8px 0 0;">🎙️ Listening... Repeat letter '${curLetter}' now!</p>`;
      }

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (btn) btn.classList.remove("recording");
        if (feedbackMount) {
          feedbackMount.innerHTML = `<p style="font-size:0.85rem; color:#94a3b8; margin:8px 0 0;">⏳ Analyzing phoneme match with intelligence engine...</p>`;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result.split(",")[1];
          try {
            const resp = await fetch("/api/gandal_space/eval_audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                target_letter: curLetter,
                expected_phoneme: curPhoneme,
                audio_base64: base64Data
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              if (feedbackMount) {
                feedbackMount.innerHTML = "";
                feedbackMount.appendChild(this.buildAudioFeedback(data));
              }
            }
          } catch (err) {
            console.error("[GANDAL SPACE] Evaluation error:", err);
          }
        };
      };

      mediaRecorder.start();
      // Record for 2.5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 2500);

    } catch (err) {
      console.warn("[GANDAL SPACE] Mic access error, evaluating fallback:", err);
      if (btn) btn.classList.remove("recording");
      try {
        const resp = await fetch("/api/gandal_space/eval_audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_letter: curLetter,
            expected_phoneme: curPhoneme,
            student_transcript: curLetter
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (feedbackMount) {
            feedbackMount.innerHTML = "";
            feedbackMount.appendChild(this.buildAudioFeedback(data));
          }
        }
      } catch (e2) {}
    }
  }

  /* ========================================================================
     KATEX MATH FORMATTING ENGINE
     ======================================================================== */
  renderMath(expr, displayMode = false) {
    const latex = String(expr || "").trim();
    if (!latex) return "";
    if (window.katex && typeof window.katex.renderToString === "function") {
      try {
        return window.katex.renderToString(latex, {
          displayMode: !!displayMode,
          throwOnError: false,
          strict: "ignore"
        });
      } catch (err) {
        console.warn("[GANDAL KaTeX] Render failed:", err);
      }
    }
    const tag = displayMode ? "div" : "span";
    return `<${tag} class="tex-fallback">${escapeHtml(displayMode ? `$$${latex}$$` : `$${latex}$`)}</${tag}>`;
  }

  typesetMath(rootElement) {
    if (!rootElement) return;
    if (window.renderMathInElement && typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(rootElement, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
        return;
      } catch (e) {
        console.warn("[GANDAL KaTeX] renderMathInElement failed:", e);
      }
    }

    // Fallback tree-walker to render any remaining $...$ text nodes
    if (window.katex && typeof window.katex.renderToString === "function") {
      const walker = (node) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const val = node.nodeValue || "";
          if (!val.includes("$")) return;
          const parts = [];
          let last = 0;
          const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
          let m;
          while ((m = re.exec(val))) {
            if (m.index > last) parts.push(escapeHtml(val.slice(last, m.index)));
            const display = m[1] != null;
            const expr = display ? m[1] : m[2];
            try {
              parts.push(window.katex.renderToString(expr, { displayMode: display, throwOnError: false, strict: "ignore" }));
            } catch (_) {
              parts.push(escapeHtml(m[0]));
            }
            last = m.index + m[0].length;
          }
          if (parts.length > 0) {
            if (last < val.length) parts.push(escapeHtml(val.slice(last)));
            const span = document.createElement("span");
            span.innerHTML = parts.join("");
            if (node.parentNode) node.parentNode.replaceChild(span, node);
          }
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("katex")) {
          Array.from(node.childNodes).forEach(walker);
        }
      };
      walker(rootElement);
    }
  }

  formatMarkdown(raw) {
    if (!raw) return "";
    const pockets = [];
    let text = String(raw).replace(/\r\n/g, "\n");

    // 1. Extract block math $$...$$ and \[...\]
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
      const key = `@@MATHDISP${pockets.length}@@`;
      pockets.push({ key, html: this.renderMath(expr, true) });
      return key;
    });
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => {
      const key = `@@MATHDISP${pockets.length}@@`;
      pockets.push({ key, html: this.renderMath(expr, true) });
      return key;
    });

    // 2. Extract inline math $...$ and \(...\)
    text = text.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
      const key = `@@MATHINLINE${pockets.length}@@`;
      pockets.push({ key, html: this.renderMath(expr, false) });
      return key;
    });
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => {
      const key = `@@MATHINLINE${pockets.length}@@`;
      pockets.push({ key, html: this.renderMath(expr, false) });
      return key;
    });

    // 3. Escape surrounding text for HTML safety
    let html = escapeHtml(text);

    // 4. Standard Markdown replacements
    html = html.replace(/^###\s+(.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^##\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^#\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
    html = html.replace(/\n\n+/g, "</p><p>");
    html = `<p>${html}</p>`;

    // 5. Restore rendered KaTeX math blocks
    pockets.forEach(({ key, html: math }) => {
      html = html.split(key).join(math);
    });

    return html;
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function escapeAttr(str) {
  if (typeof str !== "string") return String(str);
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// Global initialization
window.GandalSpaceClient = GandalSpaceClient;
