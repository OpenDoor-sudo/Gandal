/**
 * BaseScene - Standard Abstract Lifecycle for All STEM Graphing & Physics Scenes
 */
export class BaseScene {
  constructor(name = "base-scene") {
    this.name = name;
    this.container = null;
    this.active = false;
  }

  init(container, options = {}) {
    this.container = container;
    this.active = true;
  }

  update(params = {}) {
    // Override in derived classes
  }

  resize(width, height) {
    // Override in derived classes
  }

  zoomIn() {
    if (this.board && typeof this.board.zoomIn === "function") {
      this.board.zoomIn();
    }
  }

  zoomOut() {
    if (this.board && typeof this.board.zoomOut === "function") {
      this.board.zoomOut();
    }
  }

  resetZoom() {
    if (this.board && typeof this.board.setBoundingBox === "function") {
      const box = this.defaultBoundingBox || [-10, 8, 10, -8];
      this.board.setBoundingBox(box, true, "reset");
      if (typeof this.board.fullUpdate === "function") {
        this.board.fullUpdate();
      }
    }
  }

  destroy() {
    this.active = false;
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  exportState() {
    return { name: this.name };
  }

  getTelemetry() {
    return { name: this.name, active: this.active };
  }

  /**
   * High-contrast x/y tick numbers for dark STEM boards.
   * JSXGraph defaults to black text; axis:true uses defaultAxes (not Options.axis).
   */
  darkAxisLabelColor() {
    return "#f8fafc";
  }

  darkAxisDefaultAxes() {
    const labelColor = this.darkAxisLabelColor();
    const tickColor = "#94a3b8";
    const axisColor = "#e2e8f0";
    const label = {
      visible: true,
      strokeColor: labelColor,
      highlightStrokeColor: labelColor,
      cssStyle: `color: ${labelColor};`,
      highlightCssStyle: `color: ${labelColor};`
    };
    return {
      x: {
        strokeColor: axisColor,
        highlight: false,
        ticks: {
          strokeColor: tickColor,
          highlightStrokeColor: tickColor,
          drawLabels: true,
          drawZero: true,
          label
        }
      },
      y: {
        strokeColor: axisColor,
        highlight: false,
        ticks: {
          strokeColor: tickColor,
          highlightStrokeColor: tickColor,
          drawLabels: true,
          drawZero: true,
          label: Object.assign({}, label, { anchorX: "right", anchorY: "middle" })
        }
      }
    };
  }

  applyHighContrastAxisTicks(board) {
    if (!board || !board.defaultAxes) return;
    const labelColor = this.darkAxisLabelColor();
    const tickColor = "#94a3b8";
    const axisColor = "#e2e8f0";
    const labelAttrs = {
      strokeColor: labelColor,
      highlightStrokeColor: labelColor,
      cssStyle: `color: ${labelColor};`,
      highlightCssStyle: `color: ${labelColor};`
    };
    const tickAttrs = {
      strokeColor: tickColor,
      highlightStrokeColor: tickColor,
      drawLabels: true,
      drawZero: true,
      label: labelAttrs
    };
    ["x", "y"].forEach((key) => {
      const axis = board.defaultAxes[key];
      if (!axis) return;
      axis.setAttribute({
        strokeColor: axisColor,
        highlightStrokeColor: axisColor
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
  }
}
