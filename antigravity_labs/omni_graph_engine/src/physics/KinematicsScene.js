import { BaseScene } from "../core/BaseScene.js";
import { CoordinateMapper } from "../core/CoordinateMapper.js";

/**
 * KinematicsScene - Metric Ballistic Projectiles & Matter.js Rigid-Body Collisions
 * Translates standard metric mechanics (m, m/s, m/s²) to screen pixels via CoordinateMapper
 */
export class KinematicsScene extends BaseScene {
  constructor() {
    super("physics-kinematics");
    this.canvas = null;
    this.ctx = null;
    this.mapper = null;

    // Matter.js components
    this.engine = null;
    this.runner = null;
    this.ball = null;
    this.targets = [];

    // Metric Simulation Parameters
    this.angleDeg = 45;
    this.v0 = 22;           // Initial velocity in m/s
    this.gravityY = 9.81;    // Metric gravity in m/s²
    this.dragCoeff = 0.00;   // Aerodynamic air drag coefficient
    this.restitution = 0.75; // Bounciness

    this.trailPoints = [];
    this.isFlying = false;
    this.animationFrameId = null;
    this.onTelemetry = () => {};
  }

  init(container, options = {}) {
    super.init(container, options);
    this.angleDeg = options.angleDeg !== undefined ? options.angleDeg : this.angleDeg;
    this.v0 = options.v0 !== undefined ? options.v0 : this.v0;
    this.gravityY = options.gravityY !== undefined ? options.gravityY : this.gravityY;
    this.onTelemetry = options.onTelemetry || (() => {});

    // Create canvas
    this.container.innerHTML = `
      <canvas id="kinematicsCanvas" style="width: 100%; height: 100%; display: block; background: #09090b; cursor: crosshair;"></canvas>
    `;
    this.canvas = this.container.querySelector("#kinematicsCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Initialize CoordinateMapper: metric range [X: -2m to 60m, Y: -2m to 35m]
    this.mapper = new CoordinateMapper({
      screenWidth: this.container.clientWidth || 800,
      screenHeight: this.container.clientHeight || 600,
      xMin: -2,
      xMax: 65,
      yMin: -2,
      yMax: 35,
      preserveAspect: true
    });

    this.resize(this.container.clientWidth, this.container.clientHeight);
    this.initPhysicsEngine();
    this.startRenderLoop();
    this.emitTelemetry();
  }

  initPhysicsEngine() {
    if (!window.Matter) {
      console.error("Matter.js is not loaded!");
      return;
    }

    const { Engine, Bodies, Composite } = window.Matter;

    // Create Matter.js physics engine
    this.engine = Engine.create({
      gravity: {
        x: 0,
        // In Matter.js, positive Y is down in pixels. We set gravity to match metric scale.
        y: this.gravityY * 0.001 * (this.mapper.scaleY / 50),
        scale: 0.001
      }
    });

    // Add Ground boundary in metric world at Y = 0
    const groundP1 = this.mapper.worldToScreen(0, 0);
    const groundP2 = this.mapper.worldToScreen(65, -1);
    const groundWidth = Math.abs(this.mapper.toScreenDist(80));
    const groundHeight = 50;

    const ground = Bodies.rectangle(
      groundP1.x + groundWidth / 2,
      groundP1.y + groundHeight / 2,
      groundWidth,
      groundHeight,
      { isStatic: true, friction: 0.8, restitution: 0.4 }
    );

    // Add Target stack in metric coordinates (e.g. at x = 45m)
    this.targets = [];
    const targetX = 42;
    for (let row = 0; row < 4; row++) {
      const p = this.mapper.worldToScreen(targetX, row * 1.5 + 0.75);
      const bW = this.mapper.toScreenDist(1.2);
      const bH = this.mapper.toScreenDist(1.4);
      const block = Bodies.rectangle(p.x, p.y, bW, bH, {
        density: 0.004,
        friction: 0.5,
        restitution: 0.3
      });
      this.targets.push(block);
    }

    Composite.add(this.engine.world, [ground, ...this.targets]);
  }

  launch() {
    if (!this.engine || !window.Matter) return;
    const { Bodies, Body, Composite } = window.Matter;

    // Remove existing ball if any
    if (this.ball) {
      Composite.remove(this.engine.world, this.ball);
      this.ball = null;
    }

    this.trailPoints = [];
    this.isFlying = true;

    // Launcher origin at world (0, 0.5) meters
    const origin = this.mapper.worldToScreen(0, 0.5);
    const radiusPx = this.mapper.toScreenDist(0.5); // 0.5m radius sphere

    this.ball = Bodies.circle(origin.x, origin.y, radiusPx, {
      density: 0.01,
      restitution: this.restitution,
      frictionAir: this.dragCoeff,
      friction: 0.1
    });

    // Velocity vector in standard metric: v_x = v0 * cos(theta), v_y = v0 * sin(theta)
    const rad = (this.angleDeg * Math.PI) / 180;
    const vxMetric = this.v0 * Math.cos(rad);
    const vyMetric = this.v0 * Math.sin(rad);

    // Convert metric velocity to Matter.js pixel velocity step
    const vScreen = this.mapper.toScreenVector(vxMetric, vyMetric);
    // Scale velocity appropriately for Matter.js delta step
    const speedScale = 0.02 * (this.mapper.scaleX / 10);
    Body.setVelocity(this.ball, {
      x: vScreen.x * speedScale,
      y: vScreen.y * speedScale
    });

    Composite.add(this.engine.world, this.ball);
  }

  reset() {
    if (this.ball && this.engine) {
      window.Matter.Composite.remove(this.engine.world, this.ball);
      this.ball = null;
    }
    this.trailPoints = [];
    this.isFlying = false;

    // Rebuild targets
    if (this.engine) {
      for (const t of this.targets) {
        window.Matter.Composite.remove(this.engine.world, t);
      }
      this.initPhysicsEngine();
    }
    this.emitTelemetry();
  }

  startRenderLoop() {
    const render = () => {
      if (!this.active) return;

      // Update Matter.js engine
      if (this.engine) {
        window.Matter.Engine.update(this.engine, 1000 / 60);
      }

      this.drawScene();
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  drawScene() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Cartesian Grid & Axes
    this.drawMetricGrid(ctx);

    // 2. Draw Theoretical Parabolic Trajectory Curve (Analytical Physics)
    this.drawAnalyticalTrajectory(ctx);

    // 3. Draw Launcher Base & Aiming Vector
    this.drawLauncher(ctx);

    // 4. Draw Obstacle Targets
    this.drawTargets(ctx);

    // 5. Draw Flight Trail & Rigid-Body Ball
    if (this.ball) {
      const pos = this.ball.position;
      this.trailPoints.push({ x: pos.x, y: pos.y });
      if (this.trailPoints.length > 300) this.trailPoints.shift();

      // Draw trail
      ctx.beginPath();
      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < this.trailPoints.length; i++) {
        const pt = this.trailPoints[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Draw Ball
      const r = this.ball.circleRadius || 12;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Current metric position telemetry
      const worldPos = this.mapper.screenToWorld(pos.x, pos.y);
      if (this.isFlying) {
        this.emitTelemetry({
          currX: worldPos.x.toFixed(1),
          currY: Math.max(0, worldPos.y).toFixed(1),
          speed: Math.sqrt(this.ball.velocity.x ** 2 + this.ball.velocity.y ** 2).toFixed(1)
        });
      }
    }
  }

  drawMetricGrid(ctx) {
    const mapper = this.mapper;

    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 1;

    // Vertical grid lines every 5 meters
    for (let x = 0; x <= 65; x += 5) {
      const p1 = mapper.worldToScreen(x, -2);
      const p2 = mapper.worldToScreen(x, 35);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#71717a";
      ctx.font = "11px monospace";
      ctx.fillText(`${x}m`, p1.x - 8, mapper.toScreenY(0) + 16);
    }

    // Horizontal grid lines every 5 meters
    for (let y = 0; y <= 35; y += 5) {
      const p1 = mapper.worldToScreen(-2, y);
      const p2 = mapper.worldToScreen(65, y);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (y > 0) {
        ctx.fillStyle = "#71717a";
        ctx.font = "11px monospace";
        ctx.fillText(`${y}m`, mapper.toScreenX(0) - 26, p1.y + 4);
      }
    }

    // Ground line at Y = 0
    const gStart = mapper.worldToScreen(-2, 0);
    const gEnd = mapper.worldToScreen(65, 0);
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.moveTo(gStart.x, gStart.y);
    ctx.lineTo(gEnd.x, gEnd.y);
    ctx.stroke();
  }

  drawAnalyticalTrajectory(ctx) {
    const rad = (this.angleDeg * Math.PI) / 180;
    const vx = this.v0 * Math.cos(rad);
    const vy = this.v0 * Math.sin(rad);
    const g = this.gravityY;

    // Total flight time T = 2 * vy / g
    const tFlight = (2 * vy) / g;

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tFlight;
      const x = vx * t;
      const y = 0.5 + vy * t - 0.5 * g * t * t;
      if (y < 0) break;
      const p = this.mapper.worldToScreen(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawLauncher(ctx) {
    const base = this.mapper.worldToScreen(0, 0.5);
    const rad = (this.angleDeg * Math.PI) / 180;
    const len = this.mapper.toScreenDist(3.0); // 3m cannon barrel

    const tipX = base.x + len * Math.cos(rad);
    const tipY = base.y - len * Math.sin(rad);

    // Barrel
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Pivot
    ctx.beginPath();
    ctx.arc(base.x, base.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  drawTargets(ctx) {
    ctx.fillStyle = "rgba(244, 63, 94, 0.85)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    for (const body of this.targets) {
      const pos = body.position;
      const angle = body.angle;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);
      const bW = this.mapper.toScreenDist(1.2);
      const bH = this.mapper.toScreenDist(1.4);
      ctx.fillRect(-bW / 2, -bH / 2, bW, bH);
      ctx.strokeRect(-bW / 2, -bH / 2, bW, bH);
      ctx.restore();
    }
  }

  setAngle(deg) {
    this.angleDeg = Math.max(0, Math.min(90, parseFloat(deg) || 45));
    this.emitTelemetry();
  }

  setVelocity(v) {
    this.v0 = Math.max(1, Math.min(50, parseFloat(v) || 20));
    this.emitTelemetry();
  }

  setGravity(g) {
    this.gravityY = Math.max(1, Math.min(30, parseFloat(g) || 9.81));
    if (this.engine) {
      this.engine.gravity.y = this.gravityY * 0.001 * (this.mapper.scaleY / 50);
    }
    this.emitTelemetry();
  }

  emitTelemetry(extra = {}) {
    const rad = (this.angleDeg * Math.PI) / 180;
    const vx = this.v0 * Math.cos(rad);
    const vy = this.v0 * Math.sin(rad);
    const g = this.gravityY;

    // Max Height H = (v0 * sin(theta))^2 / (2g)
    const maxHeight = (vy * vy) / (2 * g);
    // Range R = v0^2 * sin(2*theta) / g
    const maxRange = (this.v0 * this.v0 * Math.sin(2 * rad)) / g;
    // Flight time T = 2 * vy / g
    const flightTime = (2 * vy) / g;

    this.onTelemetry({
      angle: this.angleDeg,
      v0: this.v0,
      gravity: this.gravityY,
      theoreticalMaxHeight: maxHeight.toFixed(2),
      theoreticalRange: maxRange.toFixed(2),
      theoreticalTime: flightTime.toFixed(2),
      ...extra
    });
  }

  resize(w, h) {
    if (this.canvas) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.mapper) {
        this.mapper.setScreenDimensions(w, h);
      }
    }
  }

  resetZoom() {
    this.reset();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.engine) {
      window.Matter.Engine.clear(this.engine);
      this.engine = null;
    }
    super.destroy();
  }
}
