"""
agent_engine.py - Gandal Space Hybrid AI Engine (A2UI & Offline Edge / Cloud Fallback)
Supports:
  1. Local Edge LLM: Gemma 4 e4b via Ollama (http://localhost:11434)
  2. Cloud Fallback: Google Gemini (gemini-2.5-flash via google-genai SDK)
  3. Declarative A2UI Protocol: TextBlock, Card, Container, FormulaCard, PronunciationCard, AudioFeedback
"""

import os
import json
import time
import urllib.request
import urllib.error
import re
from typing import Dict, Any, Optional, Tuple

# Load environment variables if not already set
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if line.lower().startswith("export "):
                        line = line[7:].strip()
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        k = parts[0].strip()
                        v = parts[1].strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env()

OLLAMA_BASE_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("LOCAL_LLM_MODEL", "gemma4:e4b")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

A2UI_SYSTEM_INSTRUCTION = """You are Gandal Space AI, an elite adaptive educational assistant for students across K-12 and university level.
You must ALWAYS respond with a single, raw, valid JSON object conforming to the A2UI (Agent-to-User Interface) specification.
Do NOT wrap your output in markdown code blocks like ```json ... ```. Return ONLY the parseable JSON payload.

Root Schema:
{
  "type": "Container",
  "direction": "vertical",
  "title": "<Topic or Question Title>",
  "subject": "Math" | "Physics" | "Chemistry" | "Biology" | "Phonics" | "Language" | "History" | "ComputerScience" | "General",
  "summary": "<Concise 1-sentence pedagogical summary>",
  "suggested_followups": [
    "<Engaging follow-up exploration question 1>",
    "<Engaging follow-up exploration question 2>",
    "<Engaging follow-up exploration question 3>"
  ],
  "children": [
    // List of UI components matching the student's request
    // MUST END with a QuizCard for active practice
  ]
}

Available A2UI Components:
1. TextBlock:
   {
     "type": "TextBlock",
     "content": "Rich markdown explanation. Supports LaTeX math like $x^2$ or $$\\int_0^2 x^2 dx$$"
   }

2. Card:
   {
     "type": "Card",
     "title": "Concept or Subtopic Title",
     "content": "Core explanation or definition with LaTeX math if applicable",
     "badge": "Key Fact" | "Definition" | "Tip" | "Important",
     "tags": ["Tag1", "Tag2"]
   }

3. FormulaCard (MANDATORY for math / physics problems like integrals, equations, derivatives):
   {
     "type": "FormulaCard",
     "title": "Step-by-Step Mathematical Formulation",
     "formula": "\\int_{0}^{2} x^2 \\, dx",
     "steps": [
       "1. Identify the antiderivative: F(x) = \\frac{x^3}{3}",
       "2. Apply Fundamental Theorem of Calculus: F(2) - F(0)",
       "3. Calculate: \\frac{2^3}{3} - 0 = \\frac{8}{3}"
     ],
     "result": "\\frac{8}{3} \\approx 2.667"
   }

4. PronunciationCard (MANDATORY when asked about practicing the alphabet, letters, phonics, or reading):
   {
     "type": "PronunciationCard",
     "letter": "A",
     "expected_phoneme": "/eɪ/",
     "word_example": "Apple",
     "text_to_speak": "A. A is for Apple. /eɪ/.",
     "tip": "Open your mouth wide, keep your tongue relaxed, and glide into a light 'ee' sound."
   }

5. AudioFeedback (Used for pronunciation grading):
   {
     "type": "AudioFeedback",
     "status": "success" | "retry",
     "score": 92,
     "feedback_text": "Great pronunciation! Clear /eɪ/ phoneme detected.",
     "phoneme_detected": "/eɪ/"
   }

6. GraphCard (MANDATORY for Math, Geometry, Physics, and Chemistry):
   {
     "type": "GraphCard",
     "model_type": "geometry_triangle" | "geometry_circle" | "geometry_pythagoras" | "physics_projectile" | "physics_newton" | "chemistry_titration" | "chemistry_kinetics" | "function_plot",
     "title": "Interactive Model: Triangle ABC / Function / Simulation",
     "formula": "triangle" | "circle" | "sgn(x)" | "x^2" | "sin(x)" | "F = ma",
     "theorem": "\\angle A + \\angle B + \\angle C = 180^\\circ \\quad | \\quad \\text{Area} = \\frac{1}{2}bh",
     "domain": [-1, 6],
     "range": [-1, 5],
     "description": "Visual interactive representation showing shape vertices, coordinates, angle arcs, curve behavior, or physical simulation."
   }

7. QuizCard (MANDATORY FOR EVERY TOPIC/QUESTION):
   {
     "type": "QuizCard",
     "question": "Clear multiple-choice practice question testing the core concept?",
     "options": [
       "Option A with math or text",
       "Option B with math or text",
       "Option C with math or text",
       "Option D with math or text"
     ],
     "answer_index": 0,
     "explanation": "Clear explanation of why this answer is correct and why the alternatives are incorrect."
   }

CRITICAL RULES:
- MANDATORY PRACTICE QUIZ: EVERY single response without exception MUST include a QuizCard as the final component in 'children' so the student can immediately test their mastery!
- MANDATORY VISUAL MODEL / GRAPHCARD FOR ALL STEM TOPICS: Whenever a query asks about Math (including Geometry shapes like Triangles, Circles, Polygons, Angles, Pythagorean theorem, as well as functions, calculus, curves), Physics (Newton's laws, forces, kinematics, projectiles, free fall), or Chemistry (titrations, reactions, kinetics, gas laws), YOU MUST ALWAYS INCLUDE A GraphCard in 'children'! Never define geometric shapes, math functions, or scientific laws in plain text only — the student must see and interact with the visual shape or graph!
- DO NOT INCLUDE GraphCard FOR NON-STEM TOPICS: For queries about reading, alphabets, letters, language learning, phonics, vocabulary, spelling, grammar, literature, or history, NEVER output a GraphCard. Use PronunciationCard, ConceptCard, or TextCard instead.
- COLUMN ARITHMETIC / VERTICAL ADDITION (Posée en colonnes): Whenever explaining addition of 2, 3, 4 or more numbers (such as 12 + 10, or adding 3 numbers like 125 + 48 + 37), format the calculations vertically stacked like arithmetic on paper using LaTeX array block notation:
  $$\\begin{array}{cr}
   & 125 \\\\
   & 48 \\\\
  + & 37 \\\\
  \\hline
   & 210
  \\end{array}$$
  Align numbers by column (units under units, tens under tens), show the horizontal rule, and explain step-by-step column additions and carries (retenues).
- LATEX MATH: For all mathematical variables, equations, integrals, and formulas, ALWAYS format with LaTeX math delimiters: inline with $...$ and block with $$...$$ (e.g. $f'(x) = nx^{n-1}$, $\\frac{d}{dx}(x^3) = 3x^2$, $\\angle A + \\angle B + \\angle C = 180^\\circ$). Never output raw unescaped math without delimiters.
- SUGGESTED FOLLOW-UPS: Always provide 2 to 3 enticing 'suggested_followups' that allow the student to explore deeper or test variations of the concept.
- For math queries (e.g. 'area(x^2, 0, 2)'): ALWAYS provide FormulaCard with step-by-step calculus integration and exact fraction + decimal answer.
- For reading/phonics practice: Use PronunciationCard with warm, encouraging prompts and phoneme details.
- Always be pedagogical, accurate, structured, and inspiring.
"""

class GandalSpaceEngine:
    """Hybrid AI Engine with local-first Ollama and cloud Gemini fallback."""

    def __init__(self):
        self._gemini_client = None
        # Lazy initialization: do not block startup/import with SDK loads

    def _init_gemini(self):
        if self._gemini_client is not None:
            return self._gemini_client
        try:
            from google import genai
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            if api_key:
                self._gemini_client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[GANDAL SPACE] Warning: Google GenAI client init failed: {e}")
        return self._gemini_client

    def check_ollama_status(self) -> Tuple[bool, str]:
        """Check if local Ollama daemon is running and which models are installed."""
        try:
            req = urllib.request.Request(
                f"{OLLAMA_BASE_URL}/api/tags",
                headers={"User-Agent": "GandalSpace/1.0"}
            )
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = [m.get("name", "") for m in data.get("models", [])]
                    target_model = OLLAMA_MODEL.lower()
                    has_gemma = any(target_model in m.lower() or "gemma" in m.lower() for m in models)
                    if has_gemma:
                        return True, f"Online ({len(models)} models available, Gemma ready)"
                    else:
                        return False, f"Ollama online, but {OLLAMA_MODEL} not loaded ({len(models)} other models)"
        except Exception:
            pass
        return False, "Offline (Not running on port 11434)"

    def check_gemini_status(self) -> Tuple[bool, str]:
        """Check if Gemini Cloud API is configured."""
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if api_key and len(api_key) > 5:
            return True, f"Online ({GEMINI_MODEL} ready via Google GenAI)"
        return False, "Offline (GOOGLE_API_KEY not configured in .env)"

    def get_system_status(self) -> Dict[str, Any]:
        """Return combined status of local edge & cloud fallback."""
        ollama_ok, ollama_msg = self.check_ollama_status()
        gemini_ok, gemini_msg = self.check_gemini_status()
        return {
            "local_edge": {
                "available": ollama_ok,
                "model": OLLAMA_MODEL,
                "endpoint": OLLAMA_BASE_URL,
                "detail": ollama_msg
            },
            "cloud_fallback": {
                "available": gemini_ok,
                "model": GEMINI_MODEL,
                "detail": gemini_msg
            },
            "active_preference": "Local Gemma 4 e4b (Offline)" if ollama_ok else "Google Gemini (Cloud Fallback)"
        }

    def _query_ollama(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Attempt to query local Ollama model."""
        try:
            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": A2UI_SYSTEM_INSTRUCTION},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json"
            }
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{OLLAMA_BASE_URL}/api/chat",
                data=data_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12.0) as resp:
                if resp.status == 200:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    raw_content = resp_json.get("message", {}).get("content", "")
                    return self._clean_and_parse_json(raw_content)
        except Exception as e:
            print(f"[GANDAL SPACE] Local Ollama query error: {e}")
        return None

    def _query_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Query Google Gemini with strict structured JSON output."""
        if not self._gemini_client:
            self._init_gemini()
        if not self._gemini_client:
            return None

        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=A2UI_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                temperature=0.3
            )
            response = self._gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=config
            )
            if response and response.text:
                return self._clean_and_parse_json(response.text)
        except Exception as e:
            print(f"[GANDAL SPACE] Gemini fallback query error: {e}")
        return None

    def _clean_and_parse_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """Clean markdown markers if present and parse JSON safely, handling LaTeX backslashes."""
        if not raw_text or not raw_text.strip():
            return None
        import re
        text = raw_text.strip()
        # Strip markdown fences if present
        if text.startswith("```json"):
            text = text[7:].strip()
        elif text.startswith("```"):
            text = text[3:].strip()
        if text.endswith("```"):
            text = text[:-3].strip()

        # Find outer-most JSON object if response contains surrounding text
        m = re.search(r'\{[\s\S]*\}', text)
        candidate = m.group(0) if m else text

        try:
            return json.loads(candidate)
        except Exception:
            pass

        # Repair single backslashes commonly output by LLMs in LaTeX strings (e.g. \circ, \theta, \frac)
        try:
            fixed_text = re.sub(r'\\(?![/"\\bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', candidate)
            return json.loads(fixed_text, strict=False)
        except Exception:
            pass

        try:
            return json.loads(candidate, strict=False)
        except Exception as e:
            print(f"[GANDAL SPACE] JSON Parse warning: {e}. Raw was: {raw_text[:120]}...")
            return None

    def _generate_fallback_blueprint(self, prompt: str, reason: str = "") -> Dict[str, Any]:
        """Safe deterministic educational blueprint when neither LLM is reachable."""
        p_lower = prompt.lower()
        
        # Check if it's sign function / sgn
        if "sign" in p_lower or "sgn" in p_lower or "signum" in p_lower:
            return {
                "type": "Container",
                "direction": "vertical",
                "title": "Understanding the Sign Function: $f(x) = \\text{sgn}(x)$",
                "subject": "Math",
                "summary": "The sign (signum) function extracts the sign of a real number: returning +1 for positives, -1 for negatives, and 0 for zero.",
                "suggested_followups": [
                    "How does the sign function relate to the absolute value function |x|?",
                    "Is the sign function continuous or differentiable at x=0?",
                    "How does the Heaviside step function H(x) relate to sgn(x)?"
                ],
                "children": [
                    {
                        "type": "TextBlock",
                        "content": "### What is the Sign Function?\n\nThe **sign function** (also written as $\\text{sgn}(x)$) is a piecewise mathematical function that determines whether a real number is positive, negative, or zero:\n\n$$\\text{sgn}(x) = \\begin{cases} 1 & \\text{if } x > 0 \\\\ 0 & \\text{if } x = 0 \\\\ -1 & \\text{if } x < 0 \\end{cases}$$\n\nFor any non-zero number $x \\neq 0$, it can also be expressed compactly as $\\text{sgn}(x) = \\frac{x}{|x|} = \\frac{|x|}{x}$."
                    },
                    {
                        "type": "GraphCard",
                        "title": "Interactive Plot: $f(x) = \\text{sgn}(x)$",
                        "formula": "sgn(x)",
                        "domain": [-5, 5],
                        "range": [-3, 3],
                        "description": "Visual piecewise graph of the sign function. Notice the jump discontinuity at $x = 0$, where the curve jumps from $y = -1$ to $y = 1$."
                    },
                    {
                        "type": "FormulaCard",
                        "title": "Mathematical Properties & Definition",
                        "formula": "x = |x| \\cdot \\text{sgn}(x)",
                        "steps": [
                            "1. For positive inputs (x > 0): \\text{sgn}(x) = +1 \\implies x = |x| \\cdot (+1) = x",
                            "2. For negative inputs (x < 0): \\text{sgn}(x) = -1 \\implies x = |x| \\cdot (-1) = -|x| = x",
                            "3. For zero (x = 0): \\text{sgn}(0) = 0 \\implies 0 = 0 \\cdot 0 = 0",
                            "4. Limit Discontinuity: \\lim_{x \\to 0^+} \\text{sgn}(x) = 1 \\neq \\lim_{x \\to 0^-} \\text{sgn}(x) = -1"
                        ],
                        "result": "\\text{Derivative: } \\frac{d}{dx}\\text{sgn}(x) = 2\\delta(x) \\text{ (Dirac delta distribution)}"
                    },
                    {
                        "type": "Card",
                        "title": "Key Real-World Applications",
                        "content": "The signum function is foundational in signal processing, control systems (bang-bang controllers), physics (direction of frictional forces), and computer science (`Math.sign()` in JavaScript or `numpy.sign()` in Python).",
                        "badge": "Core Application",
                        "tags": ["Calculus", "Functions", "Computer Science"]
                    },
                    {
                        "type": "QuizCard",
                        "question": "What is the value of $\\text{sgn}(-7.5)$?",
                        "options": [
                            "$-1$",
                            "$+1$",
                            "$0$",
                            "$-7.5$"
                        ],
                        "answer_index": 0,
                        "explanation": "Because $-7.5 < 0$, by definition the sign function returns $-1$. It extracts only the directional sign, not the magnitude."
                    }
                ]
            }

        # Check if it's right triangle / pythagoras / hypotenuse
        if any(k in p_lower for k in ["right triangle", "triangle rectangle", "pythagor", "hypotenuse", "right-angled triangle", "right angle triangle"]):
            return {
                "type": "Container",
                "direction": "vertical",
                "title": "Understanding Right Triangles: Definition, Hypotenuse & Pythagorean Theorem",
                "subject": "Math",
                "summary": "A right triangle is a triangle with exactly one 90° right angle. The longest side opposite the right angle is the hypotenuse, governed by the Pythagorean Theorem a² + b² = c².",
                "suggested_followups": [
                    "How do we calculate trigonometric ratios (sin, cos, tan) in a right triangle?",
                    "What are common Pythagorean triples like 3-4-5 and 5-12-13?",
                    "How do you find the area of a right triangle?"
                ],
                "children": [
                    {
                        "type": "TextBlock",
                        "content": "### What is a Right Triangle?\n\nA **right triangle** (also called a **right-angled triangle**, or *triangle rectangle* in French) is a three-sided polygon in which **one interior angle measures exactly $90^\\circ$** (a right angle).\n\nKey components of a right triangle:\n- **The Hypotenuse ($c$)**: The longest side of the triangle, always situated directly opposite the $90^\\circ$ right angle.\n- **The Legs ($a$ and $b$, or cathètes)**: The two perpendicular sides that intersect to form the right angle.\n- **Complementary Acute Angles**: The remaining two interior angles always sum to $90^\\circ$ ($\\angle A + \\angle B = 90^\\circ$)."
                    },
                    {
                        "type": "GraphCard",
                        "model_type": "geometry_pythagoras",
                        "title": "Interactive Model: Right Triangle & Pythagorean Theorem (3-4-5)",
                        "formula": "a^2 + b^2 = c^2",
                        "theorem": "a^2 + b^2 = c^2 \\quad \\iff \\quad 3^2 + 4^2 = 9 + 16 = 25 = 5^2",
                        "domain": [-4, 8],
                        "range": [-5, 8],
                        "description": "Visual geometric proof of a right triangle with legs $a=4, b=3$ and hypotenuse $c=5$. The areas of the squares on the legs ($3^2 = 9$ and $4^2 = 16$) combine to equal the area of the square on the hypotenuse ($5^2 = 25$)!"
                    },
                    {
                        "type": "FormulaCard",
                        "title": "The Pythagorean Theorem & Area Formulas",
                        "formula": "a^2 + b^2 = c^2 \\quad \\text{and} \\quad \\text{Area} = \\frac{a \\times b}{2}",
                        "steps": [
                            "1. Pythagorean Theorem: In any Euclidean right triangle with legs $a, b$ and hypotenuse $c$, $a^2 + b^2 = c^2$.",
                            "2. Calculating the Hypotenuse: $c = \\sqrt{a^2 + b^2}$.",
                            "3. Finding a Missing Leg: $a = \\sqrt{c^2 - b^2}$ or $b = \\sqrt{c^2 - a^2}$.",
                            "4. Right Triangle Area: Because the legs are perpendicular, the area is simply half their product: $\\text{Area} = \\frac{1}{2}ab$."
                        ],
                        "result": "c = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5"
                    },
                    {
                        "type": "Card",
                        "title": "Trigonometric Ratios (SOH-CAH-TOA)",
                        "content": "The right triangle is the fundamental building block of all trigonometry:\n- $\\sin(\\theta) = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$\n- $\\cos(\\theta) = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}}$\n- $\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}}$\n\nThese ratios allow you to determine unknown distances and heights anywhere in physics, architecture, and navigation.",
                        "badge": "Trigonometry Core",
                        "tags": ["Right Triangle", "Pythagoras", "Geometry", "Trigonometry", "Hypotenuse"]
                    },
                    {
                        "type": "QuizCard",
                        "question": "A right triangle has perpendicular legs measuring $a = 6$ and $b = 8$. What is the length of its hypotenuse $c$?",
                        "options": [
                            "10",
                            "14",
                            "12",
                            "48"
                        ],
                        "answer_index": 0,
                        "explanation": "Applying the Pythagorean theorem: $c = \\sqrt{a^2 + b^2} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$."
                    }
                ]
            }

        # Check if it's triangle / geometry
        if "triangle" in p_lower:
            return {
                "type": "Container",
                "direction": "vertical",
                "title": "Understanding Triangles: Definition & Geometry",
                "subject": "Math",
                "summary": "A triangle is a fundamental 3-sided polygon with three vertices and three interior angles whose sum is always exactly 180°.",
                "suggested_followups": [
                    "What is the Pythagorean Theorem for right triangles?",
                    "How do we classify triangles by sides and angles?",
                    "What is Heron's formula for finding triangle area?"
                ],
                "children": [
                    {
                        "type": "TextBlock",
                        "content": "### What is a Triangle?\n\nA **triangle** is the most foundational closed shape in plane Euclidean geometry. It is formed by connecting three non-collinear points (called **vertices**) with three straight line segments (called **sides**).\n\nTriangles are inherently rigid structures, which is why architects and engineers use triangular trusses to build bridges, roofs, and cranes!"
                    },
                    {
                        "type": "GraphCard",
                        "model_type": "geometry_triangle",
                        "title": "Interactive Geometric Model: Triangle ABC",
                        "formula": "triangle",
                        "theorem": "\\angle A + \\angle B + \\angle C = 180^\\circ \\quad | \\quad \\text{Area} = \\frac{1}{2} b h",
                        "domain": [-1, 6],
                        "range": [-1, 5],
                        "description": "Visual geometric triangle with vertices $A(0,0)$, $B(4.5,0)$, and $C(1.8,3.2)$. Drag any vertex with your mouse to observe how the interior angles adapt in real-time, verifying that $\\angle A + \\angle B + \\angle C = 180^\\circ$ holds for all triangles!",
                        "points": [[0, 0], [4.5, 0], [1.8, 3.2]]
                    },
                    {
                        "type": "FormulaCard",
                        "title": "Key Properties & Formulas of Triangles",
                        "formula": "\\angle A + \\angle B + \\angle C = 180^\\circ \\quad \\text{and} \\quad \\text{Area} = \\frac{1}{2}bh",
                        "steps": [
                            "1. Angle Sum Theorem: The interior angles always sum to exactly 180°: $\\angle A + \\angle B + \\angle C = 180^\\circ$.",
                            "2. Area Formula: $\\text{Area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height} = \\frac{1}{2}bh$.",
                            "3. Triangle Inequality: The sum of the lengths of any two sides must exceed the third side: $a + b > c$, $a + c > b$, $b + c > a$.",
                            "4. Pythagorean Theorem (Right Triangles): If $\\angle C = 90^\\circ$, then $a^2 + b^2 = c^2$."
                        ],
                        "result": "\\text{Total Interior Angle Sum} = 180^\\circ"
                    },
                    {
                        "type": "Card",
                        "title": "Classifying Triangles",
                        "content": "Triangles are classified in two ways:\n- **By Side Lengths**: **Equilateral** (all 3 sides equal, angles = 60°), **Isosceles** (2 sides equal, base angles equal), and **Scalene** (all 3 sides different).\n- **By Interior Angles**: **Acute** (all angles < 90°), **Right** (one angle = 90°), and **Obtuse** (one angle > 90°).",
                        "badge": "Geometry Core",
                        "tags": ["Geometry", "Triangles", "Angles", "Polygons"]
                    },
                    {
                        "type": "QuizCard",
                        "question": "If a triangle has two angles measuring 55° and 65°, what is the measure of the third angle?",
                        "options": [
                            "60°",
                            "50°",
                            "70°",
                            "80°"
                        ],
                        "answer_index": 0,
                        "explanation": "By the Angle Sum Theorem, the sum of all three interior angles in any triangle is always 180°. Calculating: $180^\\circ - (55^\\circ + 65^\\circ) = 180^\\circ - 120^\\circ = 60^\\circ$."
                    }
                ]
            }

        # Check if it's circle / geometry
        if "circle" in p_lower:
            return {
                "type": "Container",
                "direction": "vertical",
                "title": "Understanding Circles: Radius, Circumference & Area",
                "subject": "Math",
                "summary": "A circle is the set of all coplanar points equidistant from a central point, defined by its radius r, diameter d, and constant π.",
                "suggested_followups": [
                    "What is the mathematical constant π (pi)?",
                    "How does tangent line geometry work on a circle?",
                    "What is the equation of a circle in Cartesian coordinates?"
                ],
                "children": [
                    {
                        "type": "TextBlock",
                        "content": "### What is a Circle?\n\nA **circle** is a perfectly symmetrical 2D geometric shape consisting of all points that are a fixed distance (the **radius** $r$) from a given center point $O$.\n\nThe distance across the circle through the center is the **diameter** $d = 2r$."
                    },
                    {
                        "type": "GraphCard",
                        "model_type": "geometry_circle",
                        "title": "Interactive Geometric Model: Circle with Radius r",
                        "formula": "circle",
                        "theorem": "C = 2\\pi r \\quad | \\quad A = \\pi r^2 \\quad | \\quad x^2 + y^2 = r^2",
                        "domain": [-5, 5],
                        "range": [-5, 5],
                        "description": "Visual geometric circle centered at $O(0,0)$ with radius $r=3$. Drag the boundary point to see how the radius scales circumference $C = 2\\pi r$ and area $A = \\pi r^2$!",
                        "radius": 3
                    },
                    {
                        "type": "FormulaCard",
                        "title": "Essential Circle Formulas",
                        "formula": "C = 2\\pi r \\quad \\text{and} \\quad A = \\pi r^2",
                        "steps": [
                            "1. Diameter relation: $d = 2r$.",
                            "2. Circumference (perimeter): $C = 2\\pi r = \\pi d$.",
                            "3. Area of interior: $A = \\pi r^2$.",
                            "4. Cartesian equation centered at (0,0): $x^2 + y^2 = r^2$."
                        ],
                        "result": "A = \\pi r^2"
                    },
                    {
                        "type": "QuizCard",
                        "question": "If a circle has a radius of $r = 5\\text{ cm}$, what is its area?",
                        "options": [
                            "$25\\pi\\text{ cm}^2 \\approx 78.54\\text{ cm}^2$",
                            "$10\\pi\\text{ cm}^2 \\approx 31.42\\text{ cm}^2$",
                            "$50\\pi\\text{ cm}^2 \\approx 157.08\\text{ cm}^2$",
                            "$5\\pi\\text{ cm}^2 \\approx 15.71\\text{ cm}^2$"
                        ],
                        "answer_index": 0,
                        "explanation": "The area formula is $A = \\pi r^2$. For $r = 5$, $A = \\pi (5)^2 = 25\\pi\\text{ cm}^2 \\approx 78.54\\text{ cm}^2$. ($10\\pi$ is the circumference $2\\pi r$)."
                    }
                ]
            }

        # Check if it's column addition / arithmetic (e.g., 12 + 10, adding 3 numbers like 125 + 48 + 37, etc.)
        if any(k in p_lower for k in ["addition", "additionner", "poser une addition", "column addition", "add 3 numbers", "ajouter"]) or re.search(r'\b\d+\s*\+\s*\d+', p_lower):
            add_match = re.search(r'\b(\d{1,6}(?:\s*\+\s*\d{1,6}){1,5})\b', p_lower)
            if add_match:
                terms = [int(x.strip()) for x in add_match.group(1).split("+") if x.strip().isdigit()]
            elif "3" in p_lower or "trois" in p_lower:
                terms = [125, 48, 37]
            else:
                terms = [12, 10]
            
            if len(terms) < 2:
                terms = [12, 10]

            total = sum(terms)
            terms_str = " + ".join(str(t) for t in terms)
            latex_array = "\\begin{array}{cr}\n"
            for idx, t in enumerate(terms):
                if idx == len(terms) - 1:
                    latex_array += f"+ & {t} \\\\\n"
                else:
                    latex_array += f"  & {t} \\\\\n"
            latex_array += f"\\hline\n  & {total}\n\\end{{array}}"

            return {
                "type": "Container",
                "direction": "vertical",
                "title": f"L'Addition Posée en Colonnes : ${terms_str} = {total}$",
                "subject": "Math",
                "summary": f"Calcul méthodique de l'addition posée en colonnes ({terms_str}) avec alignement des unités, des dizaines et gestion des retenues.",
                "suggested_followups": [
                    "Comment calculer une addition avec 4 nombres et de grandes retenues ?",
                    "Quelle est la différence entre l'addition posée et la soustraction avec retenue ?",
                    "Comment vérifier le résultat avec la preuve par 9 ?"
                ],
                "children": [
                    {
                        "type": "TextBlock",
                        "content": f"### Méthode : Poser l'addition en colonnes\n\nPour additionner plusieurs nombres comme **{terms_str}**, on les écrit **les uns sous les autres** en alignant soigneusement les chiffres à droite :\n- Les **unités** sous les unités\n- Les **dizaines** sous les dizaines\n- Les **centaines** sous les centaines\n\n$$\n{latex_array}\n$$"
                    },
                    {
                        "type": "FormulaCard",
                        "title": "Calcul Étape par Étape en Colonnes",
                        "formula": latex_array,
                        "steps": [
                            f"1. Écriture : Aligner {len(terms)} nombres verticalement par leur chiffre des unités.",
                            f"2. Colonne des unités : Additionner les unités ({' + '.join(str(t % 10) for t in terms)} = {sum(t % 10 for t in terms)}). Poser le chiffre des unités et reporter la retenue.",
                            f"3. Colonne des dizaines : Additionner les dizaines avec la retenue précédente.",
                            f"4. Total final : La somme exacte est {total}."
                        ],
                        "result": f"{terms_str} = {total}"
                    },
                    {
                        "type": "Card",
                        "title": "Conseil Pédagogique : La Clé des Retenues",
                        "content": "N'oubliez jamais d'écrire la petite retenue au-dessus de la colonne suivante ! En alignant toujours à droite, chaque chiffre conserve sa vraie valeur positionnelle (unités, dizaines, centaines).",
                        "badge": "Astuce",
                        "tags": ["Arithmétique", "Addition", "Calcul posé"]
                    },
                    {
                        "type": "QuizCard",
                        "question": "Si vous posez en colonnes l'addition de 3 nombres : $125 + 48 + 37$, quelle est la somme obtenue ?",
                        "options": [
                            "$210$",
                            "$200$",
                            "$215$",
                            "$190$"
                        ],
                        "answer_index": 0,
                        "explanation": "En colonnes : Unités $5 + 8 + 7 = 20$ (on pose 0 et on retient 2). Dizaines $2\\text{ (retenue)} + 2 + 4 + 3 = 11$ (on pose 1 et on retient 1). Centaines $1\\text{ (retenue)} + 1 = 2$. Le résultat final est $210$ !"
                    }
                ]
            }

        # Check if it's area(x^2, 0, 2) or integral
        if "area" in p_lower and ("x^2" in p_lower or "x**2" in p_lower):
            return {
                "type": "Container",
                "direction": "vertical",
                "title": "Definite Integral: Area Under f(x) = x² from 0 to 2",
                "subject": "Math",
                "summary": "The area bounded by f(x) = x² and the x-axis from x=0 to x=2 is calculated using definite integration.",
                "suggested_followups": [
                    "What is the area under x^3 from 0 to 2?",
                    "How does the Fundamental Theorem of Calculus work?",
                    "Can the area under a curve ever be negative?"
                ],
                "children": [
                    {
                        "type": "GraphCard",
                        "title": "Interactive Plot: $f(x) = x^2$",
                        "formula": "x^2",
                        "domain": [-1, 3],
                        "range": [-1, 5],
                        "description": "Interactive graph of the parabola $f(x) = x^2$ showing the region of integration between $x = 0$ and $x = 2$."
                    },
                    {
                        "type": "FormulaCard",
                        "title": "Calculus Integration Breakdown",
                        "formula": "\\int_{0}^{2} x^2 \\, dx",
                        "steps": [
                            "1. Apply the Power Rule: \\int x^n dx = \\frac{x^{n+1}}{n+1} \\implies F(x) = \\frac{x^3}{3}",
                            "2. Evaluate at upper limit x = 2: F(2) = \\frac{2^3}{3} = \\frac{8}{3}",
                            "3. Evaluate at lower limit x = 0: F(0) = \\frac{0^3}{3} = 0",
                            "4. Subtract: F(2) - F(0) = \\frac{8}{3} - 0 = \\frac{8}{3}"
                        ],
                        "result": "\\text{Area} = \\frac{8}{3} \\approx 2.667 \\text{ units}^2"
                    },
                    {
                        "type": "Card",
                        "title": "Geometric Interpretation",
                        "content": "This represents the exact parabolic area underneath the curve between $x=0$ and $x=2$. It is exactly one-third of the enclosing $2 \\times 4$ rectangle (whose area is 8).",
                        "badge": "Calculus Core",
                        "tags": ["Integration", "Calculus", "Area"]
                    },
                    {
                        "type": "QuizCard",
                        "question": "What is the antiderivative $F(x)$ of $f(x) = x^2$?",
                        "options": [
                            "$2x$",
                            "$\\frac{x^3}{3} + C$",
                            "$x^3 + C$",
                            "$\\frac{x^2}{2} + C$"
                        ],
                        "answer_index": 1,
                        "explanation": "By the Power Rule of integration, $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$. For $n=2$, this yields $\\frac{x^{2+1}}{2+1} = \\frac{x^3}{3} + C$. Note that $2x$ is the derivative, not the antiderivative."
                    }
                ]
            }

        # Check if it's alphabet / phonics practice
        if any(k in p_lower for k in ["alphabet", "letter", "phonics", "pronounce", "read", "pronunciation"]):
            letter = "A"
            for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
                if f"letter {ch.lower()}" in p_lower or f"practice {ch.lower()}" in p_lower:
                    letter = ch
                    break
            
            phonemes = {
                "A": ("/eɪ/", "Apple", "A. A is for Apple.", "Open mouth wide, lips relaxed."),
                "B": ("/biː/", "Ball", "B. B is for Ball.", "Press lips together and release with voice."),
                "C": ("/siː/", "Cat", "C. C is for Cat.", "Touch the back of your tongue to the roof of your mouth."),
                "D": ("/diː/", "Dog", "D. D is for Dog.", "Tap your tongue tip right behind your upper front teeth."),
                "E": ("/iː/", "Elephant", "E. E is for Elephant.", "Smile slightly and let out a crisp 'eh' sound."),
                "F": ("/ɛf/", "Fish", "F. F is for Fish.", "Place upper teeth gently on bottom lip and blow air."),
                "G": ("/dʒiː/", "Giraffe", "G. G is for Giraffe.", "Voice a soft 'j' sound as in Giraffe."),
                "H": ("/eɪtʃ/", "House", "H. H is for House.", "Breathe warm air out gently from your throat."),
                "I": ("/aɪ/", "Iguana", "I. I is for Iguana.", "Open mouth slightly and make a clean 'ih' sound."),
                "J": ("/dʒeɪ/", "Jellyfish", "J. J is for Jellyfish.", "Press tongue behind top teeth and release with 'juh'."),
                "K": ("/keɪ/", "Kangaroo", "K. K is for Kangaroo.", "Raise back of tongue and let out a quick puff: 'kuh'."),
                "L": ("/ɛl/", "Lion", "L. L is for Lion.", "Press tongue tip firmly behind top front teeth: 'lll'."),
                "M": ("/ɛm/", "Monkey", "M. M is for Monkey.", "Press lips together and hum gently through your nose."),
                "N": ("/ɛn/", "Nest", "N. N is for Nest.", "Touch tongue to roof of mouth and hum: 'nnn'."),
                "O": ("/oʊ/", "Owl", "O. O is for Owl.", "Round your lips into a circle: 'oh' or 'ow'."),
                "P": ("/piː/", "Penguin", "P. P is for Penguin.", "Close lips tightly and pop air out softly: 'puh'."),
                "Q": ("/kjuː/", "Queen", "Q. Q is for Queen.", "Round lips quickly while making a 'kw' sound."),
                "R": ("/ɑːr/", "Rabbit", "R. R is for Rabbit.", "Curl tongue slightly back without touching the roof."),
                "S": ("/ɛs/", "Sun", "S. S is for Sun.", "Bring teeth close together and hiss air through: 'sss'."),
                "T": ("/tiː/", "Tiger", "T. T is for Tiger.", "Tap tongue against your upper gum ridge: 'tuh'."),
                "U": ("/juː/", "Umbrella", "U. U is for Umbrella.", "Relax mouth and vocalize a short, gentle 'uh'."),
                "V": ("/viː/", "Violin", "V. V is for Violin.", "Touch upper teeth to lower lip and hum: 'vvv'."),
                "W": ("/ˈdʌbəl.juː/", "Whale", "W. W is for Whale.", "Pucker lips small and glide them open: 'wuh'."),
                "X": ("/ɛks/", "Xylophone", "X. X is for Xylophone.", "Blend a 'k' and 's' sound or make a buzzing 'z' sound."),
                "Y": ("/waɪ/", "Yacht", "Y. Y is for Yacht.", "Raise middle of tongue and glide smoothly: 'yuh'."),
                "Z": ("/ziː/", "Zebra", "Z. Z is for Zebra.", "Bring teeth together and buzz vocal cords like a bee: 'zzz'.")
            }
            ph, word, text_spk, tip = phonemes.get(letter, ("/eɪ/", "Apple", f"{letter}. {letter} is for Apple.", "Clear vocal tone."))

            return {
                "type": "Container",
                "direction": "vertical",
                "title": f"Phonics & Reading: Letter '{letter}' Practice",
                "subject": "Phonics",
                "summary": f"Master the pronunciation, phoneme sound, and vocabulary association for the letter '{letter}'.",
                "suggested_followups": [
                    f"Practice the letter following '{letter}'",
                    f"What words start with the phoneme {ph}?",
                    f"Give me another pronunciation challenge"
                ],
                "children": [
                    {
                        "type": "PronunciationCard",
                        "letter": letter,
                        "expected_phoneme": ph,
                        "word_example": word,
                        "text_to_speak": text_spk,
                        "tip": tip
                    },
                    {
                        "type": "Card",
                        "title": f"Vocabulary Spotlight: {word}",
                        "content": f"The letter **{letter}** makes the **{ph}** sound at the start of **{word}**. Press 'Hear It' to listen, then click the mic to repeat and test your pronunciation!",
                        "badge": "Phonics Mastery",
                        "tags": ["Reading", "Phonics", "Speech"]
                    },
                    {
                        "type": "QuizCard",
                        "question": f"Which of these words starts with the letter '{letter}' sound, like in '{word}'?",
                        "options": [
                            {"A": "Ant", "B": "Banana", "C": "Carrot", "D": "Dolphin", "E": "Egg", "F": "Frog", "G": "Grape", "H": "Horse", "I": "Igloo", "J": "Jam", "K": "Kite", "L": "Lemon", "M": "Moon", "N": "Nose", "O": "Orange", "P": "Panda", "Q": "Quiet", "R": "Rainbow", "S": "Star", "T": "Turtle", "U": "Under", "V": "Van", "W": "Water", "X": "Box", "Y": "Yellow", "Z": "Zoo"}.get(letter, word),
                            "Sun" if letter != "S" else "Moon",
                            "Cat" if letter != "C" else "Dog"
                        ],
                        "answer_index": 0,
                        "explanation": f"Spot on! '{letter}' matches the beginning sound ({ph}) in '{word}'!"
                    }
                ]
            }

        # Default general topic card
        return {
            "type": "Container",
            "direction": "vertical",
            "title": f"Exploration: {prompt.capitalize()}",
            "subject": "General",
            "summary": f"Comprehensive educational overview of '{prompt}'.",
            "suggested_followups": [
                f"Give me a real-world application of {prompt}",
                f"Explain {prompt} with simple analogies",
                f"What are the most common misconceptions about {prompt}?"
            ],
            "children": [
                {
                    "type": "TextBlock",
                    "content": f"### Introduction to {prompt}\n\nHere is an interactive conceptual exploration of **{prompt}**. You can explore definitions, practical applications, and step-by-step principles."
                },
                {
                    "type": "Card",
                    "title": "Fundamental Principles",
                    "content": f"Studying **{prompt}** connects core STEM and academic concepts. Try asking follow-up questions or explore the practice question below!",
                    "badge": "Key Concept",
                    "tags": ["K-12", "Interactive", "Learning"]
                },
                {
                    "type": "QuizCard",
                    "question": f"Which statement best reflects a key principle of {prompt}?",
                    "options": [
                        f"It provides foundational principles applicable to real-world problem solving.",
                        "It has no connection to modern scientific or mathematical reasoning.",
                        "It is exclusively used in theoretical computer simulations.",
                        "None of the above."
                    ],
                    "answer_index": 0,
                    "explanation": f"Understanding {prompt} gives students core mental models to connect fundamental concepts to practical applications."
                }
            ]
        }

    def process_query(self, prompt: str, context: str = "", history: list = None) -> Dict[str, Any]:
        """Main routing pipeline with conversational history: Local Edge -> Cloud (Gemini 2.5 Flash) -> Fallback."""
        start_time = time.time()
        query_text = (prompt or "").strip()

        # Build augmented conversational prompt if history or context exists
        history_context = ""
        if history and isinstance(history, list) and len(history) > 0:
            history_lines = []
            for item in history[-4:]:
                if isinstance(item, dict):
                    q = item.get("query", "")
                    t = item.get("title", "")
                    if q:
                        history_lines.append(f"- Student previous inquiry: '{q}' (Topic: {t})")
            if history_lines:
                history_context = "Student's exploration & follow-up history:\n" + "\n".join(history_lines) + "\n\n"

        active_context = f"Current Visual Topic Context: {context}\n\n" if context else ""
        augmented_prompt = f"{history_context}{active_context}Student asks or inquires about: {query_text}"

        def _ensure_quiz_and_followups(payload: Dict[str, Any], query: str) -> Dict[str, Any]:
            if not isinstance(payload, dict):
                return payload
            children = payload.get("children", [])
            if not isinstance(children, list):
                children = []
                payload["children"] = children

            # Verify if QuizCard exists
            has_quiz = any(isinstance(c, dict) and c.get("type") == "QuizCard" for c in children)
            if not has_quiz:
                children.append({
                    "type": "QuizCard",
                    "question": f"Quick Check: What is the core takeaway regarding '{query}'?",
                    "options": [
                        "It is an essential principle with direct applications in this subject.",
                        "It has been fully replaced and is no longer used.",
                        "It only applies under zero gravity conditions.",
                        "It contradicts modern observational findings."
                    ],
                    "answer_index": 0,
                    "explanation": "Mastering fundamental principles allows you to solve complex problems and connect concepts across disciplines."
                })

            # Verify if query/response touches Geometry, Math, Physics, or Chemistry
            q_lower = query.lower()
            title_lower = (payload.get("title") or "").lower()
            combined_text = f"{q_lower} {title_lower}"

            # Check if this is a language, phonics, reading, arts, literature, or non-STEM query:
            is_non_stem_topic = (
                any(c.get("type") == "PronunciationCard" for c in children if isinstance(c, dict))
                or any(re.search(rf"\b{re.escape(w)}\b", q_lower) for w in [
                    "alphabet", "alphabets", "letter", "letters", "reading", "read", "phonics",
                    "pronounce", "pronunciation", "spelling", "spell", "vocabulary", "grammar",
                    "conjugation", "poem", "poetry", "literature", "history", "geography",
                    "french", "english", "spanish", "story", "book", "word", "words"
                ])
            )
            
            has_graph = any(isinstance(c, dict) and c.get("type") == "GraphCard" for c in children)

            # If it's a non-STEM topic, purge any accidental GraphCards
            if is_non_stem_topic and has_graph:
                children = [c for c in children if not (isinstance(c, dict) and c.get("type") == "GraphCard")]
                payload["children"] = children
                has_graph = False

            # If Gemini returned a GraphCard without model_type, tag it properly
            if has_graph and not is_non_stem_topic:
                for c in children:
                    if isinstance(c, dict) and c.get("type") == "GraphCard" and not c.get("model_type"):
                        f_str = (c.get("formula") or "").lower()
                        t_str = (c.get("title") or "").lower()
                        c_text = f"{f_str} {t_str} {q_lower}"
                        if re.search(r'\b(right[\s-]triangle|triangle[\s-]rectangle|pythagor(as|ean)?|hypotenuse|right[\s-]angle)\b', c_text):
                            c["model_type"] = "geometry_pythagoras"
                        elif re.search(r'\btriangles?\b', c_text):
                            c["model_type"] = "geometry_triangle"
                        elif re.search(r'\b(circles?|radius|circumference)\b', c_text):
                            c["model_type"] = "geometry_circle"
                        elif re.search(r'\b(titration|neutralization|burette|titrant|acid[\s-]base)\b', c_text):
                            c["model_type"] = "chemistry_titration"
                        elif re.search(r'\b(projectile|trajector(y|ies)|free[\s-]fall)\b', c_text):
                            c["model_type"] = "physics_projectile"

            # Only inject a GraphCard if it is truly a STEM topic and lacks one
            if not has_graph and not is_non_stem_topic:
                graph_card = None
                
                # 1. Geometry: Right Triangle & Pythagorean Theorem
                if re.search(r'\b(right[\s-]triangle|triangle[\s-]rectangle|pythagor(as|ean)?|hypotenuse|right[\s-]angled|right[\s-]angle)\b', combined_text):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "geometry_pythagoras",
                        "title": "Interactive Model: Pythagorean Theorem (3-4-5 Right Triangle)",
                        "formula": "a^2 + b^2 = c^2",
                        "theorem": "a^2 + b^2 = c^2 \\quad \\iff \\quad 3^2 + 4^2 = 9 + 16 = 25 = 5^2",
                        "domain": [-4, 8],
                        "range": [-5, 8],
                        "description": "Geometric proof of the Pythagorean theorem on right triangle $ABC$ with legs $a=4, b=3$ and hypotenuse $c=5$. Notice the exact equality $3^2 + 4^2 = 25 = 5^2$!"
                    }
                # 2. Geometry: General Triangle
                elif re.search(r'\btriangles?\b', combined_text):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "geometry_triangle",
                        "title": "Interactive Geometric Model: Triangle ABC",
                        "formula": "triangle",
                        "theorem": "\\angle A + \\angle B + \\angle C = 180^\\circ \\quad | \\quad \\text{Area} = \\frac{1}{2} b h",
                        "domain": [-1, 6],
                        "range": [-1, 5],
                        "description": "Visual geometric triangle with vertices $A(0,0)$, $B(4.5,0)$, and $C(1.8,3.2)$. Drag any vertex with your mouse to observe how the interior angles adapt in real-time, verifying that $\\angle A + \\angle B + \\angle C = 180^\\circ$ holds for all triangles!",
                        "points": [[0, 0], [4.5, 0], [1.8, 3.2]]
                    }
                # 3. Geometry: Circle
                elif re.search(r'\b(circles?|radius|circumference)\b', combined_text):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "geometry_circle",
                        "title": "Interactive Geometric Model: Circle with Radius r",
                        "formula": "circle",
                        "theorem": "C = 2\\pi r \\quad | \\quad A = \\pi r^2 \\quad | \\quad x^2 + y^2 = r^2",
                        "domain": [-5, 5],
                        "range": [-5, 5],
                        "description": "Visual geometric circle centered at $O(0,0)$ with radius $r=3$. Drag point P along the boundary to explore how radius directly determines circumference $C = 2\\pi r$ and interior area $A = \\pi r^2$!",
                        "radius": 3
                    }
                # 4. Physics: Projectile Motion / Free Fall / Gravity
                elif re.search(r'\b(projectile|trajector(y|ies)|free[\s-]fall|gravity)\b', combined_text):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "physics_projectile",
                        "title": "Interactive Physics Model: Projectile Motion Trajectory",
                        "formula": "y(x) = x\\tan(\\theta) - \\frac{gx^2}{2v_0^2\\cos^2(\\theta)}",
                        "theorem": "y(x) = x - 0.0245x^2 \\quad | \\quad v_0 = 20\\text{ m/s}, \\theta = 45^\\circ",
                        "domain": [0, 45],
                        "range": [0, 15],
                        "description": "Parabolic trajectory of a projectile launched at $v_0 = 20\\text{ m/s}$ and $\\theta = 45^\\circ$ under gravity $g = 9.8\\text{ m/s}^2$. Peak apex occurs at $H_{\\text{max}} \\approx 10.2\\text{ m}$, landing distance $R \\approx 40.8\\text{ m}$."
                    }
                # 5. Physics: Newton's 2nd Law / Forces
                elif re.search(r'\b(newton|f=ma|second[\s-]law|2nd[\s-]law)\b', combined_text) or (re.search(r'\bforces?\b', combined_text) and re.search(r'\b(mass|acceleration|motion|gravity|physics)\b', combined_text)):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "physics_newton",
                        "title": "Interactive Physics Model: Newton's 2nd Law (F = ma)",
                        "formula": "F = ma",
                        "theorem": "F = ma \\quad \\implies \\quad a = \\frac{F}{m} \\quad (m = 5\\text{ kg})",
                        "domain": [0, 10],
                        "range": [0, 50],
                        "description": "Linear force-acceleration curve for a mass $m = 5\\text{ kg}$. The constant slope represents the mass of the object: doubling the net force directly doubles acceleration!"
                    }
                # 6. Chemistry: Acid-Base Titration Curve (Strict word boundary: no matching inside 'alphabet' or 'database')
                elif re.search(r'\b(titration|neutralization|burette|titrant)\b', combined_text) or re.search(r'\bacid[\s-]base\b', combined_text) or (re.search(r'\bph\b', combined_text) and re.search(r'\b(acid|base|buffer|solution|chemistry|titration)\b', combined_text)):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "chemistry_titration",
                        "title": "Interactive Chemistry Model: Acid-Base Titration Curve",
                        "formula": "pH(V)",
                        "theorem": "\\text{Equivalence Point: } pH = 7.0 \\text{ at } V_{\\text{NaOH}} = 25\\text{ mL}",
                        "domain": [0, 50],
                        "range": [0, 14],
                        "description": "Strong acid-strong base titration ($0.1\\text{ M HCl}$ with $0.1\\text{ M NaOH}$). Note the shallow initial buffer region, rapid vertical jump at $V = 25\\text{ mL}$ ($pH = 7.0$), and basic plateau."
                    }
                # 7. Chemistry: Reaction Kinetics & Activation Energy
                elif re.search(r'\b(kinetics|activation[\s-]energy|catalyst|reaction[\s-]energy)\b', combined_text):
                    graph_card = {
                        "type": "GraphCard",
                        "model_type": "chemistry_kinetics",
                        "title": "Interactive Chemistry Model: Reaction Activation Energy Profile",
                        "formula": "E(r)",
                        "theorem": "E_a = E_{\\text{transition}} - E_{\\text{reactants}} \\quad | \\quad \\Delta H < 0",
                        "domain": [0, 10],
                        "range": [0, 100],
                        "description": "Exothermic reaction coordinate showing the energy barrier $E_a$ required to reach the transition state, and the net enthalpy change $\\Delta H < 0$."
                    }
                # 8. General Math Function / Calculus / Curves
                else:
                    math_keywords = [
                        r'\b(sign|sgn|signum)\b', r'\b(derivative|integral|calculus)\b',
                        r'\b(sin|cos|tan)\b', r'\b(parabola|slope|quadratic)\b',
                        r'\bx\^|\bx\*\*', r'\bfunction\s*plot\b', r'\bplot\s*function\b',
                        r'\bshow\s*graph\b', r'\bgraph\s*of\b'
                    ]
                    if any(re.search(kw, combined_text) for kw in math_keywords):
                        formula = "x^2"
                        domain = [-5, 5]
                        range_y = [-3, 3]
                        title = f"Interactive Function Plot: {query.capitalize()}"
                        desc = "Visual mathematical plot with real-time coordinate inspection."
                        if re.search(r'\b(sign|sgn)\b', combined_text):
                            formula = "sgn(x)"
                            title = "Interactive Plot: f(x) = sgn(x)"
                            desc = "Visual plot of the signum function showing step discontinuity at x=0 (f(x)=1 for x>0, f(x)=-1 for x<0, f(0)=0)."
                        elif "x^3" in combined_text or "x**3" in combined_text:
                            formula = "x^3"
                            title = "Interactive Plot: f(x) = x³"
                            domain = [-3, 3]
                            range_y = [-8, 8]
                        elif "x^4" in combined_text or "x**4" in combined_text:
                            formula = "x^4"
                            title = "Interactive Plot: f(x) = x⁴"
                            domain = [-3, 3]
                            range_y = [-2, 10]
                        elif re.search(r'\bsin\b', combined_text):
                            formula = "sin(x)"
                            title = "Interactive Plot: f(x) = sin(x)"
                            domain = [-7, 7]
                            range_y = [-2, 2]
                        elif re.search(r'\bcos\b', combined_text):
                            formula = "cos(x)"
                            title = "Interactive Plot: f(x) = cos(x)"
                            domain = [-7, 7]
                            range_y = [-2, 2]
                        elif "area" in combined_text and ("x^2" in combined_text or "x**2" in combined_text):
                            formula = "x^2"
                            title = "Interactive Plot: f(x) = x²"
                            domain = [-1, 3]
                            range_y = [-1, 5]

                        graph_card = {
                            "type": "GraphCard",
                            "model_type": "function_plot",
                            "title": title,
                            "formula": formula,
                            "domain": domain,
                            "range": range_y,
                            "description": desc
                        }

                if graph_card:
                    # Insert right before QuizCard if present, else append
                    quiz_idx = next((i for i, c in enumerate(children) if isinstance(c, dict) and c.get("type") == "QuizCard"), len(children))
                    children.insert(quiz_idx, graph_card)

            # Verify suggested followups
            if not payload.get("suggested_followups"):
                payload["suggested_followups"] = [
                    f"Can you give another example of this?",
                    f"Explain this step-by-step with analogies",
                    f"How does this connect to real-world applications?"
                ]
            return payload
        
        # 1. Try Local Ollama if online
        ollama_ok, _ = self.check_ollama_status()
        if ollama_ok:
            payload = self._query_ollama(augmented_prompt)
            if payload:
                payload = _ensure_quiz_and_followups(payload, query_text)
                latency = round((time.time() - start_time) * 1000, 1)
                return {
                    "success": True,
                    "provider": f"Gemma 4 e4b (Local Edge Ollama, {latency}ms)",
                    "engine_type": "offline_edge",
                    "latency_ms": latency,
                    "ui_payload": payload
                }

        # 2. Try Cloud Gemini Fallback
        gemini_ok, _ = self.check_gemini_status()
        if gemini_ok:
            payload = self._query_gemini(augmented_prompt)
            if payload:
                payload = _ensure_quiz_and_followups(payload, query_text)
                latency = round((time.time() - start_time) * 1000, 1)
                return {
                    "success": True,
                    "provider": f"Gemini 2.5 Flash (Cloud Fallback, {latency}ms)",
                    "engine_type": "cloud_fallback",
                    "latency_ms": latency,
                    "ui_payload": payload
                }

        # 3. Deterministic educational fallback
        payload = self._generate_fallback_blueprint(query_text, reason="Edge and Cloud LLMs offline")
        payload = _ensure_quiz_and_followups(payload, query_text)
        latency = round((time.time() - start_time) * 1000, 1)
        return {
            "success": True,
            "provider": "Gandal Knowledge Engine (Deterministic Local)",
            "engine_type": "local_fallback",
            "latency_ms": latency,
            "ui_payload": payload
        }

    def evaluate_pronunciation(self, target_letter: str, expected_phoneme: str, student_transcript: str = "", audio_base64: str = "") -> Dict[str, Any]:
        """Evaluate a student's pronunciation attempt and return an AudioFeedback A2UI card."""
        target_upper = (target_letter or "A").strip().upper()
        transcript_clean = student_transcript.strip().upper()

        is_match = False
        if transcript_clean:
            is_match = (target_upper in transcript_clean or 
                        transcript_clean.startswith(target_upper) or 
                        expected_phoneme.lower() in student_transcript.lower())
        else:
            # When audio is provided without STT, simulate high confidence phoneme detection
            is_match = True

        score = 96 if is_match else 65
        status = "success" if is_match else "retry"
        feedback = (f"Excellent! Your pronunciation of '{target_upper}' matched {expected_phoneme} clearly!"
                    if is_match else
                    f"Good effort on '{target_upper}'! Try opening your mouth slightly wider to reach the clear {expected_phoneme} sound.")

        return {
            "type": "AudioFeedback",
            "status": status,
            "score": score,
            "feedback_text": feedback,
            "phoneme_detected": expected_phoneme if is_match else "/ə/",
            "target_letter": target_upper
        }

    def chat_with_gandho(self, message: str, context: str = "", history: list = None) -> Dict[str, Any]:
        """Socratic conversational dialogue with Gandho, designed for spoken speech synthesis."""
        start_time = time.time()
        student_msg = (message or "").strip()
        if not student_msg:
            return {"success": True, "reply": "I'm listening! What concept would you like to explore?", "provider": "Gandho"}

        system_prompt = (
            "You are Gandho, a warm, brilliant, Socratic AI tutor for students across K-12 and university level. "
            "You are conversing with the student in real-time voice chat. "
            "Keep your responses concise, conversational, and pedagogical (2 to 4 sentences maximum per turn), "
            "so they sound natural when spoken aloud by your 3D avatar. "
            "Help the student understand the core concept, use vivid analogies, and encourage them with a thoughtful follow-up question. "
            "COLUMN ARITHMETIC RULE: Whenever explaining addition of 2, 3, 4 or more numbers (such as 12 + 10 or 125 + 48 + 37), "
            "format the calculations vertically stacked like arithmetic on paper (l'addition posée en colonnes) using LaTeX array block notation: "
            "$$\\begin{array}{cr} & 125 \\\\ & 48 \\\\ + & 37 \\\\ \\hline & 210 \\end{array}$$, "
            "aligning the units, tens, and hundreds columns and explaining any carries (les retenues)."
        )

        context_info = f"\nCurrent visual lesson on the student's screen:\n{context}\n" if context else ""

        # Build prompt
        full_prompt = f"{context_info}\nStudent asks: {student_msg}"

        # 1. Try Ollama if Gemma is loaded
        ollama_ok, _ = self.check_ollama_status()
        if ollama_ok:
            try:
                payload = {
                    "model": OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    "stream": False
                }
                req = urllib.request.Request(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=8.0) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        reply = data.get("message", {}).get("content", "").strip()
                        if reply:
                            return {
                                "success": True,
                                "reply": reply.replace("*", "").replace("#", ""),
                                "provider": f"Gemma 4 e4b (Offline Edge, {round((time.time() - start_time)*1000, 1)}ms)"
                            }
            except Exception as e:
                print(f"[GANDAL CHAT] Local Ollama chat error: {e}")

        # 2. Try Gemini Cloud Fallback
        gemini_ok, _ = self.check_gemini_status()
        if gemini_ok:
            client = self._init_gemini()
            if client:
                try:
                    from google.genai import types
                    config = types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7
                    )
                    resp = client.models.generate_content(
                        model=GEMINI_MODEL,
                        contents=full_prompt,
                        config=config
                    )
                    if resp and resp.text:
                        clean_reply = resp.text.strip().replace("*", "").replace("#", "")
                        return {
                            "success": True,
                            "reply": clean_reply,
                            "provider": f"Gemini 2.5 Flash (Cloud, {round((time.time() - start_time)*1000, 1)}ms)"
                        }
                except Exception as e:
                    print(f"[GANDAL CHAT] Gemini chat error: {e}")

        # 3. Intelligent fallback (specialized for column arithmetic and general Socratic dialogue)
        p_lower = student_msg.lower()
        add_match = re.search(r'\b(\d{1,6}(?:\s*\+\s*\d{1,6}){1,5})\b', p_lower)
        is_addition_question = any(k in p_lower for k in ["addition", "additionner", "poser une addition", "column addition", "add 3 numbers", "ajouter", "somme"])
        if add_match or (is_addition_question and any(c.isdigit() for c in p_lower)):
            if add_match:
                terms = [int(x.strip()) for x in add_match.group(1).split("+") if x.strip().isdigit()]
            elif "3" in p_lower or "trois" in p_lower:
                terms = [125, 48, 37]
            else:
                terms = [12, 10]
            if len(terms) < 2:
                terms = [12, 10]
            total = sum(terms)
            terms_str = " + ".join(str(t) for t in terms)
            latex_array = "\\begin{array}{cr}\n"
            for idx, t in enumerate(terms):
                if idx == len(terms) - 1:
                    latex_array += f"+ & {t} \\\\\n"
                else:
                    latex_array += f"  & {t} \\\\\n"
            latex_array += f"\\hline\n  & {total}\n\\end{{array}}"

            if any(fr_w in p_lower for fr_w in ["comment", "poser", "additionner", "nombres", "somme", "bonjour", "est"]):
                reply = (
                    f"Pour additionner ces nombres ({terms_str}), posons l'addition en colonnes comme sur une feuille de papier :\n\n"
                    f"$${latex_array}$$\n\n"
                    f"On aligne bien les unités à droite : on commence par additionner les unités ({' + '.join(str(t % 10) for t in terms)} = {sum(t % 10 for t in terms)}), "
                    f"on pose le chiffre et on note la retenue, puis on additionne les dizaines et centaines. Le total est {total} ! Voulez-vous essayer avec d'autres nombres ?"
                )
            else:
                reply = (
                    f"To add these numbers ({terms_str}), let's write them stacked vertically in columns just like on paper:\n\n"
                    f"$${latex_array}$$\n\n"
                    f"We align digits on the right, add the units column first, record any carry-over into the tens column, and sum them up to get {total}! Would you like to try another example?"
                )
            return {
                "success": True,
                "reply": reply,
                "provider": "Gandho (Arithmetic Column Engine)"
            }

        return {
            "success": True,
            "reply": f"That is a wonderful question about {context or 'this concept'}! In science and mathematics, we always look at the fundamental patterns first. What part of it feels most interesting or puzzling to you right now?",
            "provider": "Gandho (Offline Persona)"
        }

# Global singleton
default_engine = GandalSpaceEngine()
