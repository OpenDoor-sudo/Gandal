# 📊 OmniGraphEngine

> **Fully open-source, commercial-friendly (MIT/LGPL) interactive STEM graphing and physics simulation package.**
> Powered by **JSXGraph** for high-precision analytical mathematics & geometry, and **Matter.js** for Newtonian rigid-body physics.

---

## 🏛️ Architecture & Folder Structure

```
antigravity_labs/omni_graph_engine/
├── index.html                  # Standalone testbed & showcase viewer (70/30 split layout)
├── styles.css                  # Modern dark-mode STEM stylesheet
├── package.json                # Standard package definition
├── lib/                        # 100% offline local vendor libraries (zero CDN reliance)
│   ├── jsxgraphcore.js         # JSXGraph Core (LGPL-3.0 / MIT compatible)
│   ├── jsxgraph.css            # JSXGraph Board Stylesheet
│   └── matter.min.js           # Matter.js 2D Rigid Body Physics Engine (MIT)
├── src/
│   ├── core/
│   │   ├── CoordinateMapper.js # Metric (meters) to Canvas (pixels) transform with pan/zoom
│   │   ├── BaseScene.js        # Universal scene lifecycle (init, update, resize, destroy)
│   │   └── OmniGraphEngine.js  # Unified namespace orchestrator & API facade
│   ├── math/
│   │   ├── GeneralGraphScene.js# Universal function & geometric entity grapher
│   │   ├── CalculusScene.js    # Riemann sums, area under curve, tangent tracker
│   │   └── LinearAlgebraScene.js# 2D basis vectors (î, ĵ), matrix shear, determinant
│   ├── physics/
│   │   └── KinematicsScene.js  # Ballistic projectile launcher with Matter.js collisions
│   └── utils/
│       ├── MathParser.js       # Equation parser & automatic variable/parameter detector
│       ├── VoiceInput.js       # Web Speech API math phrase converter
│       └── VisionOcr.js        # Mathematical screenshot & image OCR handler
```

---

## 🚀 Key Features

1. **Massive 70/30 Ergonomic Split**:
   * **Left Side (~70%)**: Expansive, high-resolution interactive graphing board.
   * **Right Side (~30%)**: Interactive parameter sliders, formula bar, voice mic, and presets.
2. **From a Dot to Linear Algebra**:
   * Graphs points `(3, 4)`, vectors `[3, 2]`, lines `y = m*x + b`, parabolas `a*x^2 + b*x + c`, trigonometry `a*sin(b*x) + c`, conics `x^2 + y^2 = 25`, and polynomial functions.
3. **Three Input Modalities**:
   * ⌨️ **Typing**: Direct expression input with automatic variable parameter detection (`a, b, c` auto-spawn sliders).
   * 🎙️ **Voice**: Speech-to-math conversion (e.g. *"graph sine of two x plus one"* ➔ `sin(2*x) + 1`).
   * 📷 **Image Upload (OCR)**: Drag-and-drop or upload photos of handwritten or printed formulas.
4. **Pre-Loaded Production Modules**:
   * **Calculus**: Area-under-curve Riemann sums ($n \in [1, 100]$, Left/Right/Midpoint/Trapezoid), exact definite integral, and tangent tracker line.
   * **Linear Algebra**: Draggable basis vectors $\hat{i}$ and $\hat{j}$, transformed coordinate grid, determinant area calculation $\det(A)$, and eigenvalue calculation.
   * **Physics Kinematics**: Metric ballistic projectile motion with gravity $g$, angle $\theta$, velocity $v_0$, aerodynamic drag $C_d$, and Matter.js rigid-body collision targets.

---

## 💻 How to Run Standalone

### Standalone Browser Test (Zero Backend Dependencies):
Run any lightweight static file server inside `antigravity_labs/omni_graph_engine/` or open `index.html` directly in your browser:
```bash
python -m http.server 8085 --directory antigravity_labs/omni_graph_engine
```
Then visit: `http://localhost:8085/`

### Programmatic Embedding (JavaScript):
```javascript
import { OmniGraphEngine } from "./src/core/OmniGraphEngine.js";

const engine = new OmniGraphEngine({
  container: document.getElementById("graphContainer"),
  onVariablesDetected: (vars, params) => {
    console.log("Detected parameters:", vars);
  },
  onTelemetry: (telemetry) => {
    console.log("Live telemetry:", telemetry);
  }
});

// Load a specific scene
await engine.loadScene("general-math", { formula: "a*x^2 + b*x + c" });
// or Calculus
await engine.loadScene("calculus-riemann", { formula: "sin(x) + 1.5", n: 12 });
// or Linear Algebra
await engine.loadScene("linear-algebra");
// or Physics Kinematics
await engine.loadScene("physics-kinematics", { v0: 25, angleDeg: 45 });
```

### Python / FastAPI Integration:
In FastAPI or any Python backend, `OmniGraphEngine` can be served as static files or embedded via template:
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/graphs", StaticFiles(directory="antigravity_labs/omni_graph_engine", html=True), name="graphs")
```
