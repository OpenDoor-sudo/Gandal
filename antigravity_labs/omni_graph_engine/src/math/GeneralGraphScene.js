import { BaseScene } from "../core/BaseScene.js";
import { MathParser } from "../utils/MathParser.js";

export const CURVE_PALETTE = [
  { stroke: "#38bdf8", fill: "#38bdf8", fillOpacity: 0.32, name: "Cyan" },
  { stroke: "#c084fc", fill: "#c084fc", fillOpacity: 0.32, name: "Purple" },
  { stroke: "#fbbf24", fill: "#fbbf24", fillOpacity: 0.32, name: "Amber" },
  { stroke: "#34d399", fill: "#34d399", fillOpacity: 0.32, name: "Emerald" },
  { stroke: "#f43f5e", fill: "#f43f5e", fillOpacity: 0.32, name: "Rose" }
];

/**
 * GeneralGraphScene - High-Fidelity Universal Math Grapher Powered by JSXGraph
 * Supports:
 * - Multi-formula graphing & comparisons in contrasting colors
 * - Dynamic parameter sliders that NEVER disappear
 * - Trigonometric decomposition (Amplitude A, Frequency k, Shift C)
 * - Circle and conic analysis with Radius r and Diameter d sync
 * - Inequalities (linear, polynomial, trig, circular) with shaded regions
 * - Definite integrals (Area under curve) and Solids of Revolution (Volume)
 */
export class GeneralGraphScene extends BaseScene {
  constructor() {
    super("general-math");
    this.board = null;
    this.currentFormula = "3x + 5";
    this.params = {};
    this.elements = [];
    this.activeCurves = [];
    this.boardId = "jsxgraph_board_" + Math.random().toString(36).substr(2, 9);
    this.onVariablesDetected = () => {};
    this.onCurvesUpdated = () => {};
    this.onMetricsUpdated = () => {};
    this.onElementMoved = () => {};
  }

  init(container, options = {}) {
    super.init(container, options);
    this.currentFormula = options.formula || this.currentFormula;
    this.params = options.params || {};
    this.onVariablesDetected = options.onVariablesDetected || (() => {});
    this.onCurvesUpdated = options.onCurvesUpdated || (() => {});
    this.onMetricsUpdated = options.onMetricsUpdated || (() => {});
    this.onElementMoved = options.onElementMoved || (() => {});

    this.defaultBoundingBox = [-10, 8, 10, -8];

    // Create container element for JSXGraph
    this.container.innerHTML = `
      <div id="${this.boardId}" class="jxgbox" style="width: 100%; height: 100%; position: absolute; top:0; left:0; border: none; background: #09090b;"></div>
    `;

    // Smooth and natural mouse-wheel zoom directly bound to viewport
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
    this.plot(this.currentFormula, this.params);
  }

  initBoard() {
    if (!window.JXG) {
      console.error("JSXGraph (window.JXG) is not loaded!");
      return;
    }

    if (window.JXG && window.JXG.Options) {
      if (window.JXG.Options.pan) {
        window.JXG.Options.pan.needShift = false;
        window.JXG.Options.pan.enabled = true;
      }
      if (window.JXG.Options.axis) {
        window.JXG.Options.axis.strokeColor = "#e2e8f0";
        window.JXG.Options.axis.strokeWidth = 1.5;
        window.JXG.Options.axis.highlight = false;
        if (window.JXG.Options.axis.ticks) {
          window.JXG.Options.axis.ticks.strokeColor = "#94a3b8";
          window.JXG.Options.axis.ticks.drawZero = true;
          window.JXG.Options.axis.ticks.drawLabels = true;
          window.JXG.Options.axis.ticks.label = Object.assign({}, window.JXG.Options.axis.ticks.label || {}, {
            strokeColor: "#f8fafc",
            highlightStrokeColor: "#f8fafc",
            cssStyle: "color: #f8fafc;",
            highlightCssStyle: "color: #f8fafc;"
          });
        }
      }
      if (window.JXG.Options.defaultAxes) {
        ["x", "y"].forEach((key) => {
          const axis = window.JXG.Options.defaultAxes[key];
          if (!axis) return;
          axis.strokeColor = "#e2e8f0";
          if (axis.ticks) {
            axis.ticks.strokeColor = "#94a3b8";
            axis.ticks.drawZero = true;
            axis.ticks.drawLabels = true;
            axis.ticks.label = Object.assign({}, axis.ticks.label || {}, {
              strokeColor: "#f8fafc",
              highlightStrokeColor: "#f8fafc",
              cssStyle: "color: #f8fafc;",
              highlightCssStyle: "color: #f8fafc;"
            });
          }
        });
      }
    }

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

    // High-visibility Permanent Origin Marker at (0, 0)
    this.originMarker = this.board.create("point", [0, 0], {
      name: "(0,0)",
      size: 3.5,
      color: "#94a3b8",
      fillColor: "#09090b",
      strokeColor: "#94a3b8",
      strokeWidth: 2,
      fixed: true,
      highlight: false,
      label: {
        strokeColor: "#cbd5e1",
        fontSize: 11,
        fontWeight: "bold",
        offset: [-24, -14]
      }
    });
  }

  /**
   * Universal Plot: Graphs single or multiple expressions in contrasting palette colors.
   */
  plot(expressionStr, userParams = {}) {
    if (!this.board) return;

    const isDifferentFormula = this.currentFormula !== expressionStr;
    this.currentFormula = expressionStr;
    if (isDifferentFormula && Object.keys(userParams).length === 0) {
      this.params = {};
    } else {
      this.params = { ...this.params, ...userParams };
    }

    const expressions = MathParser.splitExpressions(expressionStr);
    if (expressions.length === 0) {
      this.clearElements();
      this.activeCurves = [];
      this.onCurvesUpdated([]);
      this.onVariablesDetected([], {});
      this.onMetricsUpdated({
        elementCount: 0,
        curvesCount: 0,
        formula: ""
      });
      return;
    }

    this.clearElements();
    this.activeCurves = [];

    const allDetectedVars = [];
    const isMulti = expressions.length > 1;

    for (let i = 0; i < expressions.length; i++) {
      const expr = expressions[i];
      const palette = CURVE_PALETTE[i % CURVE_PALETTE.length];
      const suffix = isMulti ? (i + 1).toString() : "";

      try {
        const classification = MathParser.classifyInput(expr);
        let curveVars = [];

        if (classification.type === "point") {
          curveVars = this.plotPoint(classification.x, classification.y, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "point",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else if (classification.type === "vector") {
          curveVars = this.plotVector(classification.x, classification.y, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "vector",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else if (classification.type === "circle_inequality") {
          curveVars = this.plotCircleInequality(classification, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "circle_inequality",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else if (classification.type === "implicit_conic") {
          curveVars = this.plotCircleOrConic(expr, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "circle",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else if (classification.type === "integral") {
          curveVars = this.plotIntegral(classification, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "integral",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else if (classification.type === "inequality") {
          curveVars = this.plotInequality(classification, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "inequality",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        } else {
          // Explicit function f(x)
          curveVars = this.plotExplicitFunction(expr, palette, suffix);
          this.activeCurves.push({
            id: `curve_${i}`,
            rawExpr: expr,
            type: "explicit",
            color: palette.stroke,
            fill: palette.fill,
            name: palette.name
          });
        }

        for (const v of curveVars) {
          if (!allDetectedVars.includes(v)) {
            allDetectedVars.push(v);
          }
        }
      } catch (err) {
        console.warn("Plot error on expression:", expr, err);
      }
    }

    // Always notify UI with active parameters so sliders NEVER disappear
    this.onVariablesDetected(allDetectedVars, this.params);
    this.onCurvesUpdated(this.activeCurves);
    this.emitTelemetry();

    if (this.board) {
      this.board.update();
    }
  }

  plotPoint(x, y, palette, suffix = "") {
    const varX = `x${suffix}`;
    const varY = `y${suffix}`;
    if (this.params[varX] === undefined) this.params[varX] = x;
    if (this.params[varY] === undefined) this.params[varY] = y;

    const p = this.board.create("point", [
      () => (this.params[varX] !== undefined ? this.params[varX] : x),
      () => (this.params[varY] !== undefined ? this.params[varY] : y)
    ], {
      name: `P${suffix}`,
      size: 6,
      color: palette.stroke,
      fillColor: palette.stroke,
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: {
        strokeColor: palette.stroke,
        fontSize: 13,
        offset: [10, 10]
      }
    });

    p.on("drag", () => {
      this.params[varX] = parseFloat(p.X().toFixed(1));
      this.params[varY] = parseFloat(p.Y().toFixed(1));
      this.onVariablesDetected([varX, varY], this.params);
      this.onElementMoved({ type: "point", x: p.X(), y: p.Y() });
    });

    this.elements.push(p);
    return [varX, varY];
  }

  plotVector(x, y, palette, suffix = "") {
    const varVx = `vx${suffix}`;
    const varVy = `vy${suffix}`;
    if (this.params[varVx] === undefined) this.params[varVx] = x;
    if (this.params[varVy] === undefined) this.params[varVy] = y;

    const origin = this.board.create("point", [0, 0], { visible: false, fixed: true });
    const tip = this.board.create("point", [
      () => (this.params[varVx] !== undefined ? this.params[varVx] : x),
      () => (this.params[varVy] !== undefined ? this.params[varVy] : y)
    ], {
      name: `v${suffix}`,
      size: 5,
      color: palette.stroke,
      fillColor: palette.stroke,
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: palette.stroke, fontSize: 13, offset: [10, 10] }
    });

    const arrow = this.board.create("arrow", [origin, tip], {
      strokeColor: palette.stroke,
      strokeWidth: 3.5,
      lastArrow: { type: 1, size: 7 }
    });

    tip.on("drag", () => {
      this.params[varVx] = parseFloat(tip.X().toFixed(1));
      this.params[varVy] = parseFloat(tip.Y().toFixed(1));
      this.onVariablesDetected([varVx, varVy], this.params);
      this.onElementMoved({ type: "vector", x: tip.X(), y: tip.Y() });
    });

    this.elements.push(origin, tip, arrow);
    return [varVx, varVy];
  }

  plotCircleOrConic(expr, palette, suffix = "") {
    const match = expr.match(/=\s*([\d.]+)/);
    let r2 = match ? parseFloat(match[1]) : 25;
    let r = Math.sqrt(Math.max(0.1, r2));

    const varR = `r${suffix}`;
    const varD = `d${suffix}`;
    if (this.params[varR] === undefined) this.params[varR] = parseFloat(r.toFixed(1));
    this.params[varD] = parseFloat((this.params[varR] * 2).toFixed(1));

    const center = this.board.create("point", [0, 0], {
      name: `Center${suffix}(0,0)`,
      size: 3,
      color: palette.stroke,
      fixed: true,
      visible: false
    });

    const circle = this.board.create("circle", [
      center,
      () => (this.params[varR] !== undefined ? this.params[varR] : r)
    ], {
      strokeColor: palette.stroke,
      strokeWidth: 2.5,
      fillColor: palette.fill,
      fillOpacity: 0.15,
      hasInnerPoints: true,
      highlight: false
    });

    this.elements.push(center, circle);
    return [varR, varD];
  }

  plotCircleInequality(classification, palette, suffix = "") {
    const varR = `r${suffix}`;
    const varD = `d${suffix}`;
    const r = classification.r || 5;
    if (this.params[varR] === undefined) this.params[varR] = parseFloat(r.toFixed(1));
    this.params[varD] = parseFloat((this.params[varR] * 2).toFixed(1));

    const center = this.board.create("point", [0, 0], {
      name: `(0,0)`,
      size: 3,
      color: palette.stroke,
      fixed: true,
      visible: false
    });

    const isStrict = classification.op === "<" || classification.op === ">";
    const isInside = classification.op.startsWith("<");

    const circle = this.board.create("circle", [
      center,
      () => (this.params[varR] !== undefined ? this.params[varR] : r)
    ], {
      strokeColor: palette.stroke,
      strokeWidth: 2.5,
      dash: isStrict ? 2 : 0,
      fillColor: isInside ? palette.fill : "transparent",
      fillOpacity: isInside ? (palette.fillOpacity || 0.32) : 0,
      hasInnerPoints: true,
      highlight: false
    });

    this.elements.push(center, circle);
    return [varR, varD];
  }

  plotInequality(classification, palette, suffix = "") {
    const decomp = MathParser.decomposeFormula(classification.baseExpr, suffix);
    for (const [k, v] of Object.entries(decomp.initialParams)) {
      if (this.params[k] === undefined) this.params[k] = v;
    }
    const compiled = MathParser.compileFunction(decomp.formula);
    if (!compiled.success) return [];

    const isStrict = classification.op === "<" || classification.op === ">";
    const isGreater = classification.op.startsWith(">");

    const curve = this.board.create("functiongraph", [
      (x) => compiled.fn(x, this.params)
    ], {
      strokeColor: palette.stroke,
      strokeWidth: 2.5,
      dash: isStrict ? 2 : 0,
      highlight: false
    });

    const ineq = this.board.create("inequality", [curve], {
      inverse: isGreater,
      fillColor: palette.fill,
      fillOpacity: 0.32,
      highlight: false
    });

    this.elements.push(curve, ineq);
    return decomp.variables;
  }

  plotIntegral(classification, palette, suffix = "") {
    const decomp = MathParser.decomposeFormula(classification.baseExpr, suffix);
    for (const [k, v] of Object.entries(decomp.initialParams)) {
      if (this.params[k] === undefined) this.params[k] = v;
    }
    const compiled = MathParser.compileFunction(decomp.formula);
    if (!compiled.success) return [];

    const curve = this.board.create("functiongraph", [
      (x) => compiled.fn(x, this.params)
    ], {
      strokeColor: palette.stroke,
      strokeWidth: 3,
      highlight: false
    });

    const integral = this.board.create("integral", [
      [classification.a, classification.b],
      curve
    ], {
      color: palette.stroke,
      fillColor: palette.fill,
      fillOpacity: 0.38,
      label: { strokeColor: palette.stroke, fontSize: 12, fontWeight: "bold" }
    });

    this.elements.push(curve, integral);

    // Save metrics computation
    this._lastIntegral = {
      fn: compiled.fn,
      a: classification.a,
      b: classification.b,
      baseExpr: classification.baseExpr,
      paletteName: palette.name
    };

    return decomp.variables;
  }

  plotExplicitFunction(expr, palette, suffix = "") {
    const decomp = MathParser.decomposeFormula(expr, suffix);
    for (const [k, v] of Object.entries(decomp.initialParams)) {
      if (this.params[k] === undefined) this.params[k] = v;
    }

    const compiled = MathParser.compileFunction(decomp.formula);
    if (!compiled.success) return [];

    const curve = this.board.create("functiongraph", [
      (x) => compiled.fn(x, this.params)
    ], {
      strokeColor: palette.stroke,
      strokeWidth: 3,
      highlight: false
    });

    this.elements.push(curve);

    // Clean y-intercept marker for linear forms
    if (decomp.variables.some(v => v.startsWith("m") || v.startsWith("b"))) {
      const y0 = compiled.fn(0, this.params);
      if (isFinite(y0)) {
        const interceptPoint = this.board.create("point", [
          () => 0,
          () => compiled.fn(0, this.params)
        ], {
          name: `y-int${suffix}`,
          size: 4,
          color: palette.stroke,
          strokeColor: "#ffffff",
          strokeWidth: 1.5,
          fixed: true,
          label: { strokeColor: palette.stroke, fontSize: 11, offset: [8, -4] }
        });
        this.elements.push(interceptPoint);
      }
    }

    return decomp.variables;
  }

  updateVariables(newParams) {
    // Synchronize radius & diameter for circles
    for (const key of Object.keys(newParams)) {
      if (key === "r" || key.startsWith("r")) {
        const dKey = "d" + key.substring(1);
        if (newParams[dKey] === undefined) {
          this.params[dKey] = parseFloat((newParams[key] * 2).toFixed(1));
        }
      } else if (key === "d" || key.startsWith("d")) {
        const rKey = "r" + key.substring(1);
        if (newParams[rKey] === undefined) {
          this.params[rKey] = parseFloat((newParams[key] / 2).toFixed(1));
        }
      }
    }

    this.params = { ...this.params, ...newParams };
    if (this.board) {
      this.board.update();
    }
    this.emitTelemetry();
  }

  emitTelemetry() {
    let telemetryData = {
      formula: this.currentFormula,
      curvesCount: this.activeCurves.length,
      curves: this.activeCurves
    };

    if (this._lastIntegral) {
      const { fn, a, b, baseExpr } = this._lastIntegral;
      // Simpson's 1/3 rule for numerical integration
      const n = 100;
      const h = (b - a) / n;
      let sum = fn(a, this.params) + fn(b, this.params);
      let sumSq = Math.pow(fn(a, this.params), 2) + Math.pow(fn(b, this.params), 2);

      for (let i = 1; i < n; i++) {
        const x = a + i * h;
        const y = fn(x, this.params);
        const weight = i % 2 === 0 ? 2 : 4;
        sum += weight * y;
        sumSq += weight * (y * y);
      }

      const areaVal = (h / 3) * sum;
      const volumeVal = Math.PI * (h / 3) * sumSq;

      telemetryData.integral = {
        baseExpr,
        bounds: `[${a}, ${b}]`,
        area: isNaN(areaVal) ? "N/A" : areaVal.toFixed(4),
        revolutionVolume: isNaN(volumeVal) ? "N/A" : volumeVal.toFixed(4)
      };
    }

    this.onMetricsUpdated(telemetryData);
  }

  clearElements() {
    for (const el of this.elements) {
      if (this.board && el) {
        this.board.removeObject(el);
      }
    }
    this.elements = [];
    this._lastIntegral = null;
  }

  zoomIn() {
    if (this.board) this.board.zoomIn();
  }

  zoomOut() {
    if (this.board) this.board.zoomOut();
  }

  clearAll() {
    this.clearElements();
    this.activeCurves = [];
    this.currentFormula = "";
    this.params = {};
    if (this.board) {
      if (typeof this.board.zoom100 === "function") {
        this.board.zoom100();
      }
      this.board.setBoundingBox(this.defaultBoundingBox, false);
      this.board.update();
    }
    this.onVariablesDetected([], {});
    this.onCurvesUpdated([]);
    this.onMetricsUpdated({
      elementCount: 0,
      curvesCount: 0,
      formula: ""
    });
  }

  resetZoom(clearAll = true) {
    if (clearAll) {
      this.clearAll();
    } else if (this.board) {
      if (typeof this.board.zoom100 === "function") {
        this.board.zoom100();
      }
      this.board.setBoundingBox(this.defaultBoundingBox, false);
      this.board.update();
    }
  }

  resize(width, height) {
    if (this.board) {
      this.board.resizeContainer(width, height);
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
    this.elements = [];
    super.destroy();
  }

  getTelemetry() {
    return {
      name: this.name,
      formula: this.currentFormula,
      params: this.params,
      elementCount: this.elements.length,
      curvesCount: this.activeCurves.length
    };
  }
}
