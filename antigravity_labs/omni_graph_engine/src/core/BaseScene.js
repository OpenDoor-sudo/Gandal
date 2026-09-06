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
}
