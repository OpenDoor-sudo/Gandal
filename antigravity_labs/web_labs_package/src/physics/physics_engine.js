/**
 * Physics Engine - 2D Rigid-Body Mechanics Simulation
 * Supports Circles, Boxes, Inclined Ramps, Collisions, Friction, Restitution,
 * and Interactive Touch / Mouse Spring Drag & Fling.
 */

export class PhysicsBody {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.type = options.type || "circle"; // "circle", "box", "ramp"
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.ax = 0;
    this.ay = 0;

    // Dimensions
    this.radius = options.radius || 24;
    this.width = options.width || 48;
    this.height = options.height || 48;

    // Physical properties
    this.isStatic = options.isStatic || false;
    this.mass = this.isStatic ? Infinity : (options.mass || 1.0);
    this.invMass = this.isStatic ? 0 : 1.0 / this.mass;
    this.restitution = options.restitution !== undefined ? options.restitution : 0.75; // Bounciness
    this.friction = options.friction !== undefined ? options.friction : 0.05; // Surface friction

    // Visual attributes
    this.color = options.color || "#818cf8";
    this.label = options.label || "";
    this.isGrabbed = false;
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  getKineticEnergy() {
    if (this.isStatic) return 0;
    return 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy);
  }
}

export class PhysicsWorld {
  constructor(options = {}) {
    this.gravityX = options.gravityX || 0;
    this.gravityY = options.gravityY !== undefined ? options.gravityY : 980; // 9.8 m/s^2 scaled
    this.globalFriction = options.globalFriction !== undefined ? options.globalFriction : 0.05;
    this.globalRestitution = options.globalRestitution !== undefined ? options.globalRestitution : 0.75;
    this.floorOffset = options.floorOffset !== undefined ? options.floorOffset : 64;
    this.bodies = [];
    this.width = options.width || 800;
    this.height = options.height || 600;

    // Drag tracking
    this.grabbedBody = null;
    this.dragHistory = [];
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  get gravity() {
    return { x: this.gravityX, y: this.gravityY };
  }

  set gravity(val) {
    if (typeof val === "object" && val !== null) {
      if (val.x !== undefined) this.gravityX = val.x;
      if (val.y !== undefined) this.gravityY = val.y;
    } else if (typeof val === "number") {
      this.gravityY = val;
    }
  }

  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  removeBody(id) {
    this.bodies = this.bodies.filter(b => b.id !== id);
  }

  clear() {
    this.bodies = this.bodies.filter(b => b.isStatic);
  }

  clearAll() {
    this.bodies = [];
  }

  getBodyAt(x, y) {
    // Check in reverse order so top-most object is selected
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (b.isStatic) continue;

      if (b.type === "circle") {
        const dx = x - b.x;
        const dy = y - b.y;
        // Generous touch tolerance (+ 24px margin of error for fingers & mice)
        const hitRadius = b.radius + 24;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) return b;
      } else if (b.type === "box") {
        const halfW = b.width / 2 + 24;
        const halfH = b.height / 2 + 24;
        if (x >= b.x - halfW && x <= b.x + halfW && y >= b.y - halfH && y <= b.y + halfH) {
          return b;
        }
      }
    }
    return null;
  }

  startGrab(x, y) {
    const body = this.getBodyAt(x, y);
    if (body) {
      body.isGrabbed = true;
      this.grabbedBody = body;
      body.vx = 0;
      body.vy = 0;
      this.dragHistory = [{ x, y, t: performance.now() }];
      return body;
    }
    return null;
  }

  updateGrab(x, y) {
    if (this.grabbedBody) {
      this.grabbedBody.x = x;
      this.grabbedBody.y = y;
      this.dragHistory.push({ x, y, t: performance.now() });
      if (this.dragHistory.length > 5) this.dragHistory.shift();
    }
  }

  endGrab() {
    if (this.grabbedBody) {
      const b = this.grabbedBody;
      b.isGrabbed = false;
      // Calculate fling/throw release velocity
      if (this.dragHistory.length >= 2) {
        const first = this.dragHistory[0];
        const last = this.dragHistory[this.dragHistory.length - 1];
        const dt = (last.t - first.t) / 1000.0;
        const dist = Math.hypot(last.x - first.x, last.y - first.y);
        if (dt > 0.005 && dist > 5) {
          const vx = (last.x - first.x) / dt;
          const vy = (last.y - first.y) / dt;
          const maxFling = 2500;
          b.vx = Math.max(-maxFling, Math.min(maxFling, vx));
          b.vy = Math.max(-maxFling, Math.min(maxFling, vy));
        } else {
          // Simple CLICK / TAP: give it an instant energetic hop!
          b.vy = -320;
          b.vx = (Math.random() - 0.5) * 120;
        }
      } else {
        b.vy = -320;
        b.vx = (Math.random() - 0.5) * 120;
      }
      this.grabbedBody = null;
      this.dragHistory = [];
      return b;
    }
    return null;
  }

  step(dt) {
    // Clamp delta time to prevent tunneling during lag
    const subSteps = 4;
    const sdt = Math.min(dt, 0.05) / subSteps;

    for (let step = 0; step < subSteps; step++) {
      // 1. Apply gravity & integrate velocities
      for (const b of this.bodies) {
        if (b.isStatic || b.isGrabbed) continue;

        b.vx += this.gravityX * sdt;
        b.vy += this.gravityY * sdt;

        // Air drag
        b.vx *= (1 - 0.0005);
        b.vy *= (1 - 0.0005);

        // Position step
        b.x += b.vx * sdt;
        b.y += b.vy * sdt;
      }

      // 2. Resolve boundary constraints (Walls & Floor)
      for (const b of this.bodies) {
        if (b.isStatic || b.isGrabbed) continue;
        this.resolveBoundaries(b);
      }

      // 3. Resolve inter-body collisions
      for (let i = 0; i < this.bodies.length; i++) {
        for (let j = i + 1; j < this.bodies.length; j++) {
          this.resolveCollision(this.bodies[i], this.bodies[j]);
        }
      }
    }
  }

  resolveBoundaries(b) {
    const boundRestitution = Math.min(b.restitution, this.globalRestitution);
    const boundFriction = Math.max(b.friction, this.globalFriction);
    const floorLimit = Math.max(100, this.height - (this.floorOffset || 0));

    if (b.type === "circle") {
      // Floor platform
      if (b.y + b.radius > floorLimit) {
        b.y = floorLimit - b.radius;
        if (Math.abs(b.vy) > 35 && typeof this.onImpact === "function") {
          this.onImpact(b.mass, Math.abs(b.vy));
        }
        b.vy = -b.vy * boundRestitution;
        b.vx *= (1 - boundFriction);
      }
      // Ceiling
      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.vy = -b.vy * boundRestitution;
      }
      // Left wall
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = -b.vx * boundRestitution;
      }
      // Right wall
      if (b.x + b.radius > this.width) {
        b.x = this.width - b.radius;
        b.vx = -b.vx * boundRestitution;
      }
    } else if (b.type === "box") {
      const halfW = b.width / 2;
      const halfH = b.height / 2;
      // Floor platform
      if (b.y + halfH > floorLimit) {
        b.y = floorLimit - halfH;
        b.vy = -b.vy * boundRestitution;
        b.vx *= (1 - boundFriction);
      }
      // Ceiling
      if (b.y - halfH < 0) {
        b.y = halfH;
        b.vy = -b.vy * boundRestitution;
      }
      // Left wall
      if (b.x - halfW < 0) {
        b.x = halfW;
        b.vx = -b.vx * boundRestitution;
      }
      // Right wall
      if (b.x + halfW > this.width) {
        b.x = this.width - halfW;
        b.vx = -b.vx * boundRestitution;
      }
    }
  }

  resolveCollision(a, b) {
    if (a.isGrabbed && b.isGrabbed) return;
    if (a.isStatic && b.isStatic) return;

    // Circle vs Circle
    if (a.type === "circle" && b.type === "circle") {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.radius + b.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Positional correction
        const penetration = minDist - dist;
        const totalMass = a.mass + b.mass;
        const ratioA = a.isStatic ? 0 : (b.isStatic ? 1 : b.mass / totalMass);
        const ratioB = b.isStatic ? 0 : (a.isStatic ? 1 : a.mass / totalMass);

        if (!a.isStatic && !a.isGrabbed) { a.x -= nx * penetration * ratioA; a.y -= ny * penetration * ratioA; }
        if (!b.isStatic && !b.isGrabbed) { b.x += nx * penetration * ratioB; b.y += ny * penetration * ratioB; }

        // Relative velocity along normal
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          if (Math.abs(velAlongNormal) > 30 && typeof this.onImpact === "function") {
            this.onImpact(Math.max(a.mass, b.mass), Math.abs(velAlongNormal));
          }
          const e = Math.min(a.restitution, b.restitution, this.globalRestitution);
          let impulse = -(1 + e) * velAlongNormal;
          impulse /= (a.invMass + b.invMass);

          const ix = impulse * nx;
          const iy = impulse * ny;

          if (!a.isStatic && !a.isGrabbed) { a.vx -= a.invMass * ix; a.vy -= a.invMass * iy; }
          if (!b.isStatic && !b.isGrabbed) { b.vx += b.invMass * ix; b.vy += b.invMass * iy; }
        }
      }
    }
    // Box vs Box or Circle vs Box (AABB projection)
    else {
      const halfWa = a.type === "box" ? a.width / 2 : a.radius;
      const halfHa = a.type === "box" ? a.height / 2 : a.radius;
      const halfWb = b.type === "box" ? b.width / 2 : b.radius;
      const halfHb = b.type === "box" ? b.height / 2 : b.radius;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const overlapX = (halfWa + halfWb) - Math.abs(dx);
      const overlapY = (halfHa + halfHb) - Math.abs(dy);

      if (overlapX > 0 && overlapY > 0) {
        let nx = 0, ny = 0, penetration = 0;

        if (overlapX < overlapY) {
          penetration = overlapX;
          nx = dx > 0 ? 1 : -1;
        } else {
          penetration = overlapY;
          ny = dy > 0 ? 1 : -1;
        }

        const totalMass = a.mass + b.mass;
        const ratioA = a.isStatic ? 0 : (b.isStatic ? 1 : b.mass / totalMass);
        const ratioB = b.isStatic ? 0 : (a.isStatic ? 1 : a.mass / totalMass);

        if (!a.isStatic && !a.isGrabbed) { a.x -= nx * penetration * ratioA; a.y -= ny * penetration * ratioA; }
        if (!b.isStatic && !b.isGrabbed) { b.x += nx * penetration * ratioB; b.y += ny * penetration * ratioB; }

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          const e = Math.min(a.restitution, b.restitution, this.globalRestitution);
          let impulse = -(1 + e) * velAlongNormal;
          impulse /= (a.invMass + b.invMass);

          const ix = impulse * nx;
          const iy = impulse * ny;

          if (!a.isStatic && !a.isGrabbed) { a.vx -= a.invMass * ix; a.vy -= a.invMass * iy; }
          if (!b.isStatic && !b.isGrabbed) { b.vx += b.invMass * ix; b.vy += b.invMass * iy; }
        }
      }
    }
  }
}
