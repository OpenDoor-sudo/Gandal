/**
 * CoordinateMapper - High-Precision Translation Layer between Physics Units & Screen Viewport
 * 
 * Physics World: Standard Cartesian coordinates (meters, seconds)
 * - Origin (0,0) typically at bottom-left or origin
 * - Positive X extends RIGHT (+X ->)
 * - Positive Y extends UP (+Y ^)
 * 
 * Canvas Screen: HTML5 Canvas raster coordinates (pixels)
 * - Origin (0,0) at top-left
 * - Positive X extends RIGHT
 * - Positive Y extends DOWN (+Y v)
 */
export class CoordinateMapper {
  constructor(options = {}) {
    this.screenWidth = options.screenWidth || 800;
    this.screenHeight = options.screenHeight || 600;

    // World bounds in metric units (default -10 to +10 meters)
    this.xMin = options.xMin !== undefined ? options.xMin : -10;
    this.xMax = options.xMax !== undefined ? options.xMax : 10;
    this.yMin = options.yMin !== undefined ? options.yMin : -6;
    this.yMax = options.yMax !== undefined ? options.yMax : 6;

    // Initial snapshot for resets
    this.initialBounds = {
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax
    };

    this.preserveAspect = options.preserveAspect !== undefined ? options.preserveAspect : true;
    this.updateScale();
  }

  setScreenDimensions(width, height) {
    this.screenWidth = Math.max(1, width);
    this.screenHeight = Math.max(1, height);
    this.updateScale();
  }

  setWorldBounds(xMin, xMax, yMin, yMax) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.updateScale();
  }

  resetBounds() {
    this.xMin = this.initialBounds.xMin;
    this.xMax = this.initialBounds.xMax;
    this.yMin = this.initialBounds.yMin;
    this.yMax = this.initialBounds.yMax;
    this.updateScale();
  }

  updateScale() {
    const worldW = this.xMax - this.xMin;
    const worldH = this.yMax - this.yMin;

    let scaleX = this.screenWidth / (worldW || 1);
    let scaleY = this.screenHeight / (worldH || 1);

    if (this.preserveAspect) {
      const uniformScale = Math.min(scaleX, scaleY);
      this.scaleX = uniformScale;
      this.scaleY = uniformScale;
    } else {
      this.scaleX = scaleX;
      this.scaleY = scaleY;
    }
  }

  // --- World to Screen Transformations ---

  toScreenX(worldX) {
    return (worldX - this.xMin) * this.scaleX;
  }

  toScreenY(worldY) {
    // Invert Y axis: world max Y maps to screen top (0)
    return this.screenHeight - (worldY - this.yMin) * this.scaleY;
  }

  worldToScreen(worldX, worldY) {
    return {
      x: this.toScreenX(worldX),
      y: this.toScreenY(worldY)
    };
  }

  toScreenDist(worldDist) {
    return worldDist * this.scaleX;
  }

  toScreenVector(worldVx, worldVy) {
    return {
      x: worldVx * this.scaleX,
      y: -worldVy * this.scaleY // negative because screen Y is flipped
    };
  }

  // --- Screen to World Transformations ---

  toWorldX(screenX) {
    return this.xMin + screenX / this.scaleX;
  }

  toWorldY(screenY) {
    // Invert Y axis
    return this.yMin + (this.screenHeight - screenY) / this.scaleY;
  }

  screenToWorld(screenX, screenY) {
    return {
      x: this.toWorldX(screenX),
      y: this.toWorldY(screenY)
    };
  }

  toWorldDist(screenDist) {
    return screenDist / this.scaleX;
  }

  // --- Interactive Navigation: Pan & Zoom ---

  pan(deltaScreenX, deltaScreenY) {
    const deltaWorldX = deltaScreenX / this.scaleX;
    const deltaWorldY = deltaScreenY / this.scaleY;

    this.xMin -= deltaWorldX;
    this.xMax -= deltaWorldX;
    this.yMin += deltaWorldY; // Invert delta Y for Cartesian pan
    this.yMax += deltaWorldY;
  }

  zoom(zoomFactor, centerScreenX = this.screenWidth / 2, centerScreenY = this.screenHeight / 2) {
    const anchorWorld = this.screenToWorld(centerScreenX, centerScreenY);

    const newWorldW = (this.xMax - this.xMin) * zoomFactor;
    const newWorldH = (this.yMax - this.yMin) * zoomFactor;

    const ratioX = (anchorWorld.x - this.xMin) / (this.xMax - this.xMin);
    const ratioY = (anchorWorld.y - this.yMin) / (this.yMax - this.yMin);

    this.xMin = anchorWorld.x - ratioX * newWorldW;
    this.xMax = this.xMin + newWorldW;

    this.yMin = anchorWorld.y - ratioY * newWorldH;
    this.yMax = this.yMin + newWorldH;

    this.updateScale();
  }

  // Helper to get JSXGraph bounding box format: [xMin, yMax, xMax, yMin]
  toJSXBoundingBox() {
    return [this.xMin, this.yMax, this.xMax, this.yMin];
  }
}
