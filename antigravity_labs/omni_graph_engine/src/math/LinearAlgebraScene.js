import { BaseScene } from "../core/BaseScene.js";

/**
 * LinearAlgebraScene - Interactive 2D Vector Space & Matrix Transformation Engine
 * Draggable basis vectors (î, ĵ), dynamic determinant parallelogram, and sheared coordinate grid
 */
export class LinearAlgebraScene extends BaseScene {
  constructor() {
    super("linear-algebra");
    this.board = null;
    this.boardId = "jxg_la_" + Math.random().toString(36).substr(2, 9);

    // Initial 2x2 Transformation Matrix [[a, b], [c, d]]
    // Column 1 is î = [a, c], Column 2 is ĵ = [b, d]
    this.matrix = {
      a: 1.5,
      b: 0.5,
      c: 0.5,
      d: 1.5
    };

    this.elements = {};
    this.gridLines = [];
    this.onMetricsUpdated = () => {};
  }

  init(container, options = {}) {
    super.init(container, options);
    if (options.matrix) {
      this.matrix = { ...this.matrix, ...options.matrix };
    }
    this.onMetricsUpdated = options.onMetricsUpdated || (() => {});

    this.defaultBoundingBox = [-6, 6, 6, -6];

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
    this.buildLinearAlgebraScene();
  }

  initBoard() {
    if (!window.JXG) return;

    this.board = window.JXG.JSXGraph.initBoard(this.boardId, {
      boundingbox: this.defaultBoundingBox,
      axis: true,
      grid: false, // We render our own transformed matrix grid
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

  buildLinearAlgebraScene() {
    if (!this.board) return;

    // Origin (0,0)
    this.elements.origin = this.board.create("point", [0, 0], {
      name: "O(0,0)",
      size: 3,
      color: "#71717a",
      fixed: true
    });

    // Basis Vector î (Column 1: [a, c])
    this.elements.iHat = this.board.create("point", [this.matrix.a, this.matrix.c], {
      name: "î",
      size: 6,
      color: "#06b6d4",
      fillColor: "#06b6d4",
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: "#38bdf8", fontSize: 14, fontWeight: "bold", offset: [8, 8] }
    });

    this.elements.iArrow = this.board.create("arrow", [this.elements.origin, this.elements.iHat], {
      strokeColor: "#06b6d4",
      strokeWidth: 3.5,
      lastArrow: { type: 1, size: 7 }
    });

    // Basis Vector ĵ (Column 2: [b, d])
    this.elements.jHat = this.board.create("point", [this.matrix.b, this.matrix.d], {
      name: "ĵ",
      size: 6,
      color: "#a855f7",
      fillColor: "#a855f7",
      strokeColor: "#ffffff",
      strokeWidth: 2,
      label: { strokeColor: "#c084fc", fontSize: 14, fontWeight: "bold", offset: [-12, 12] }
    });

    this.elements.jArrow = this.board.create("arrow", [this.elements.origin, this.elements.jHat], {
      strokeColor: "#a855f7",
      strokeWidth: 3.5,
      lastArrow: { type: 1, size: 7 }
    });

    // Sum Vector (î + ĵ) to complete the unit square parallelogram
    this.elements.sumPoint = this.board.create("point", [
      () => this.elements.iHat.X() + this.elements.jHat.X(),
      () => this.elements.iHat.Y() + this.elements.jHat.Y()
    ], {
      visible: false
    });

    // Shaded Determinant Area Parallelogram
    this.elements.poly = this.board.create("polygon", [
      this.elements.origin,
      this.elements.iHat,
      this.elements.sumPoint,
      this.elements.jHat
    ], {
      fillColor: () => {
        const det = this.getDeterminant();
        if (Math.abs(det) < 0.05) return "rgba(113, 113, 122, 0.4)";
        return det > 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";
      },
      borders: { strokeColor: "#ffffff", strokeWidth: 1, dash: 2 },
      hasInnerPoints: true
    });

    // Render transformed coordinate grid
    this.renderTransformedGrid();

    // Event handling
    const onTransformDrag = () => {
      this.matrix.a = this.elements.iHat.X();
      this.matrix.c = this.elements.iHat.Y();
      this.matrix.b = this.elements.jHat.X();
      this.matrix.d = this.elements.jHat.Y();

      this.emitMetrics();
    };

    this.elements.iHat.on("drag", onTransformDrag);
    this.elements.jHat.on("drag", onTransformDrag);

    this.emitMetrics();
  }

  renderTransformedGrid() {
    // Clear old grid lines
    for (const l of this.gridLines) {
      if (this.board) this.board.removeObject(l);
    }
    this.gridLines = [];

    const range = 5;
    for (let k = -range; k <= range; k++) {
      if (k === 0) continue;

      // Lines parallel to î
      const l1 = this.board.create("line", [
        [() => k * this.elements.jHat.X(), () => k * this.elements.jHat.Y()],
        [() => k * this.elements.jHat.X() + this.elements.iHat.X(), () => k * this.elements.jHat.Y() + this.elements.iHat.Y()]
      ], {
        strokeColor: "#27272a",
        strokeWidth: 1,
        highlight: false
      });
      this.gridLines.push(l1);

      // Lines parallel to ĵ
      const l2 = this.board.create("line", [
        [() => k * this.elements.iHat.X(), () => k * this.elements.iHat.Y()],
        [() => k * this.elements.iHat.X() + this.elements.jHat.X(), () => k * this.elements.iHat.Y() + this.elements.jHat.Y()]
      ], {
        strokeColor: "#27272a",
        strokeWidth: 1,
        highlight: false
      });
      this.gridLines.push(l2);
    }
  }

  getDeterminant() {
    const a = this.elements.iHat ? this.elements.iHat.X() : this.matrix.a;
    const c = this.elements.iHat ? this.elements.iHat.Y() : this.matrix.c;
    const b = this.elements.jHat ? this.elements.jHat.X() : this.matrix.b;
    const d = this.elements.jHat ? this.elements.jHat.Y() : this.matrix.d;
    return a * d - b * c;
  }

  setMatrixValues(a, b, c, d) {
    this.matrix = { a, b, c, d };
    if (this.elements.iHat && this.elements.jHat) {
      this.elements.iHat.setPosition(window.JXG.COORDS_BY_USER, [a, c]);
      this.elements.jHat.setPosition(window.JXG.COORDS_BY_USER, [b, d]);
      this.board.update();
      this.emitMetrics();
    }
  }

  emitMetrics() {
    const det = this.getDeterminant();
    const trace = this.matrix.a + this.matrix.d;
    // Eigenvalues of 2x2 matrix: λ = (tr ± sqrt(tr² - 4*det)) / 2
    const disc = trace * trace - 4 * det;
    let eigenStr = "Complex conjugate";
    if (disc >= 0) {
      const lambda1 = ((trace + Math.sqrt(disc)) / 2).toFixed(2);
      const lambda2 = ((trace - Math.sqrt(disc)) / 2).toFixed(2);
      eigenStr = `λ₁ = ${lambda1}, λ₂ = ${lambda2}`;
    }

    this.onMetricsUpdated({
      a: this.matrix.a.toFixed(2),
      b: this.matrix.b.toFixed(2),
      c: this.matrix.c.toFixed(2),
      d: this.matrix.d.toFixed(2),
      det: det.toFixed(3),
      detStatus: Math.abs(det) < 0.01 ? "Degenerate (Dimension Collapse)" : (det > 0 ? "Preserves Orientation" : "Reverses Orientation (Flipped)"),
      eigenvalues: eigenStr
    });
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
      this.setMatrixValues(1.5, 0.5, 0.5, 1.5);
      this.board.update();
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
    this.gridLines = [];
    super.destroy();
  }
}
