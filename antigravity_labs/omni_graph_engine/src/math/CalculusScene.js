import { BaseScene } from "../core/BaseScene.js";
import { MathParser } from "../utils/MathParser.js";

/**
 * CalculusScene - Production-Grade Riemann Sums & Definite Integral Engine
 * Visualizes integration bounds, Riemann partitions, and tangent tracker
 */
export class CalculusScene extends BaseScene {
  constructor() {
    super("calculus-riemann");
    this.board = null;
    this.boardId = "jxg_calc_" + Math.random().toString(36).substr(2, 9);

    this.formula = "sin(x) + 1.5";
    this.a = 0;   // Lower bound
    this.b = 4;   // Upper bound
    this.n = 8;   // Partitions
    this.type = "midpoint"; // 'left', 'right', 'middle' (midpoint), 'trapezoidal'

    this.elements = {};
    this.onMetricsUpdated = () => {};
  }

  init(container, options = {}) {
    super.init(container, options);
    this.formula = options.formula || this.formula;
    this.a = options.a !== undefined ? options.a : this.a;
    this.b = options.b !== undefined ? options.b : this.b;
    this.n = options.n !== undefined ? options.n : this.n;
    this.type = options.type || this.type;
    this.onMetricsUpdated = options.onMetricsUpdated || (() => {});

    this.defaultBoundingBox = [-2, 5, 8, -2];

    this.container.innerHTML = `
      <div id="${this.boardId}" class="jxgbox" style="width: 100%; height: 100%; position: absolute; top:0; left:0; border: none; background: #09090b;"></div>
    `;

    this._wheelHandler = (e) => {
      e.preventDefault();
      if (!this.board) return;
      if (e.deltaY < 0) {
        this.board.zoomIn();
      } else {
        this.board.zoomOut();
      }
    };
    this.container.addEventListener("wheel", this._wheelHandler, { passive: false });

    // Intuitive grab-and-pan: drag anywhere on graph canvas to move viewport
    let isDraggingBoard = false;
    let dragStartX = 0;
    let dragStartY = 0;

    this._onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest && (e.target.closest(".zoom-hud-btn") || e.target.closest(".top-search-bar-wrapper"))) {
        return;
      }
      if (this.board && typeof this.board.getAllObjectsUnderMouse === "function") {
        const objs = this.board.getAllObjectsUnderMouse(e) || [];
        const isInteractive = objs.some(o => o && o.isDraggable && o.visProp && o.visProp.visible);
        if (isInteractive) return;
      }

      isDraggingBoard = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const box = this.container.querySelector(".jxgbox") || this.container;
      box.classList.add("grabbing");
    };

    this._onMouseMove = (e) => {
      if (!isDraggingBoard || !this.board) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      if (dx !== 0 || dy !== 0) {
        const curX = this.board.origin.scrCoords[1];
        const curY = this.board.origin.scrCoords[2];
        this.board.moveOrigin(curX + dx, curY + dy);
      }
    };

    this._onMouseUp = () => {
      if (isDraggingBoard) {
        isDraggingBoard = false;
        const box = this.container.querySelector(".jxgbox") || this.container;
        box.classList.remove("grabbing");
      }
    };

    this.container.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);

    this.initBoard();
    this.buildCalculusScene();
  }

  initBoard() {
    if (!window.JXG) return;

    this.board = window.JXG.JSXGraph.initBoard(this.boardId, {
      boundingbox: this.defaultBoundingBox,
      axis: true,
      grid: true,
      defaultAxes: this.darkAxisDefaultAxes(),
      showCopyright: false,
      showNavigation: false,
      zoom: {
        enabled: true,
        factorX: 1.25,
        factorY: 1.25,
        wheel: false,
        needshift: false,
        needShift: false,
        min: 0.00001,
        max: 100000
      },
      pan: {
        enabled: true,
        needshift: false,
        needShift: false,
        needtwofingers: false,
        needTwoFingers: false
      }
    });

    if (this.board && this.board.attr && this.board.attr.pan) {
      this.board.attr.pan.needshift = false;
    }

    this.applyHighContrastAxisTicks(this.board);
  }

  buildCalculusScene() {
    if (!this.board) return;

    const compiled = MathParser.compileFunction(this.formula);
    const f = (x) => compiled.fn(x, {});

    // 1. Plot the continuous function curve
    this.elements.curve = this.board.create("functiongraph", [f], {
      strokeColor: "#38bdf8",
      strokeWidth: 3,
      name: "f(x)"
    });

    // 2. Gliders for integration bounds a and b
    this.elements.pointA = this.board.create("glider", [this.a, 0, this.board.defaultAxes.x], {
      name: "a",
      size: 6,
      color: "#10b981",
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: "#34d399", fontSize: 13, offset: [-5, -20] }
    });

    this.elements.pointB = this.board.create("glider", [this.b, 0, this.board.defaultAxes.x], {
      name: "b",
      size: 6,
      color: "#f59e0b",
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: "#fbbf24", fontSize: 13, offset: [-5, -20] }
    });

    // 3. Shaded Riemann Sum Rectangles / Trapezoids
    const getRiemannType = () => {
      if (this.type === "left") return "left";
      if (this.type === "right") return "right";
      if (this.type === "trapezoidal") return "trapezoidal";
      return "middle"; // midpoint
    };

    this.elements.riemann = this.board.create("riemannsum", [
      f,
      () => this.n,
      () => getRiemannType(),
      () => this.elements.pointA.X(),
      () => this.elements.pointB.X()
    ], {
      fillColor: "rgba(168, 85, 247, 0.35)",
      fillOpacity: 0.4,
      strokeColor: "#c084fc",
      strokeWidth: 1.5
    });

    // 4. Glider on curve with Tangent Line (Calculus derivative inspection)
    this.elements.tangentGlider = this.board.create("glider", [2, f(2), this.elements.curve], {
      name: "x₀",
      size: 5,
      color: "#ec4899",
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: "#f472b6", fontSize: 12 }
    });

    this.elements.tangentLine = this.board.create("tangent", [this.elements.tangentGlider], {
      strokeColor: "#ec4899",
      strokeWidth: 2,
      dash: 2
    });

    // Update metrics when user drags a or b or glider
    const emitMetrics = () => {
      const aVal = this.elements.pointA.X();
      const bVal = this.elements.pointB.X();
      const riemannVal = typeof this.elements.riemann.Value === "function" ? this.elements.riemann.Value() : 0;
      
      // Numerical integration benchmark using Simpson's Rule (1000 slices)
      const exactVal = this.simpsonsRule(f, aVal, bVal, 1000);
      const absError = Math.abs(riemannVal - exactVal);

      this.onMetricsUpdated({
        a: aVal.toFixed(3),
        b: bVal.toFixed(3),
        n: this.n,
        type: this.type,
        riemannSum: riemannVal.toFixed(4),
        exactIntegral: exactVal.toFixed(4),
        error: absError.toFixed(4),
        tangentSlope: this.numericalDerivative(f, this.elements.tangentGlider.X()).toFixed(3)
      });
    };

    this.elements.pointA.on("drag", emitMetrics);
    this.elements.pointB.on("drag", emitMetrics);
    this.elements.tangentGlider.on("drag", emitMetrics);
    this.board.on("update", emitMetrics);

    emitMetrics();
  }

  setPartitions(n) {
    this.n = Math.max(1, Math.min(100, Math.round(n)));
    if (this.board) this.board.update();
  }

  setRiemannType(type) {
    this.type = type; // 'left', 'right', 'midpoint', 'trapezoidal'
    if (this.board) this.board.update();
  }

  setFormula(newFormula) {
    this.formula = newFormula;
    this.destroy();
    this.initBoard();
    this.buildCalculusScene();
  }

  simpsonsRule(f, a, b, n) {
    if (a === b) return 0;
    if (a > b) return -this.simpsonsRule(f, b, a, n);
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i += 2) sum += 4 * f(a + i * h);
    for (let i = 2; i < n - 1; i += 2) sum += 2 * f(a + i * h);
    return (h / 3) * sum;
  }

  numericalDerivative(f, x, h = 1e-5) {
    return (f(x + h) - f(x - h)) / (2 * h);
  }

  resize(w, h) {
    if (this.board) this.board.resizeContainer(w, h);
  }

  zoomIn() {
    if (this.board) this.board.zoomIn();
  }

  zoomOut() {
    if (this.board) this.board.zoomOut();
  }

  resetZoom() {
    if (this.board) {
      if (typeof this.board.zoom100 === "function") {
        this.board.zoom100();
      }
      this.board.setBoundingBox(this.defaultBoundingBox, false);
      this.a = 0;
      this.b = 4;
      this.n = 8;
      this.type = "midpoint";
      this.board.update();
      this.emitMetrics();
    }
  }

  destroy() {
    if (this.container && this._wheelHandler) {
      this.container.removeEventListener("wheel", this._wheelHandler);
    }
    if (this.container && this._onMouseDown) {
      this.container.removeEventListener("mousedown", this._onMouseDown);
    }
    if (this._onMouseMove) {
      window.removeEventListener("mousemove", this._onMouseMove);
    }
    if (this._onMouseUp) {
      window.removeEventListener("mouseup", this._onMouseUp);
    }
    if (this.board && window.JXG) {
      window.JXG.JSXGraph.freeBoard(this.board);
      this.board = null;
    }
    this.elements = {};
    super.destroy();
  }
}
