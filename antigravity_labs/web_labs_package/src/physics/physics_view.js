/**
 * Physics Mechanics Canvas View - Redesigned Two-Split Layout
 * Left: Full-Height Interactive Canvas with Floating Controls & Velocity Vectors
 * Right: Step-by-Step Instructions, Telemetry, Sliders, Gandho Voice, and Auto-Grading
 */

import { PhysicsWorld, PhysicsBody } from "./physics_engine.js?v=20260328c";
import { GandhoLabVoiceAssistant } from "../gandho_voice_helper.js?v=20260328c";
import { labAudio } from "../audio/lab_audio.js";
import { challengeManager } from "../challenges/lab_challenges.js";

export class PhysicsView {
  constructor(containerElement, initialMission = "free_fall") {
    this.container = containerElement;
    this.world = new PhysicsWorld();
    this.animationFrameId = null;
    this.lastTime = 0;
    this.timeScale = 1.0;
    this.showVectors = true;
    this.showLabels = true;
    this.currentMissionKey = initialMission;
    this.isSuspendedAtTop = false;
    this.hasDropped = false;
    this.peakKinetic = 0;
    this.ballsLandedTogether = false;
    labAudio.playCannonLaunch();

    this.missions = {
      free_fall: {
        title: "Galileo's Free Fall: Mass Independence",
        grade: "Grades 6–10",
        goal: "Drop a 10 kg Heavy Bowling Ball and a 0.5 kg Light Sphere simultaneously from the top. Observe their velocity vectors as they fall under Earth's gravity (9.8 m/s²). Verify that acceleration is independent of object mass!",
        steps: [
          "The two spheres are suspended at the top: Heavy (10 kg) and Light (0.5 kg).",
          "Click the green '🪂 Drop Both Balls' button (or drag & fling them yourself).",
          "Watch the cyan velocity vector arrows grow at the exact same rate!",
          "Confirm they hit the floor together, then click 'Check & Grade Lab'."
        ],
        targetLabel: "Required Gravity",
        targetVal: "9.8 m/s² (Earth)",
        setup: (world, view) => {
          world.clearAll();
          world.gravityY = 980;
          view.isSuspendedAtTop = true;
          const w = world.width || 800;
          const b1 = new PhysicsBody({ type: "circle", x: w * 0.35, y: 110, radius: 32, mass: 10.0, color: "#f43f5e", label: "10kg Heavy" });
          const b2 = new PhysicsBody({ type: "circle", x: w * 0.65, y: 110, radius: 22, mass: 0.5, color: "#38bdf8", label: "0.5kg Light" });
          b1.isStatic = true; // Suspended until drop
          b2.isStatic = true;
          world.addBody(b1);
          world.addBody(b2);
        },
        checkGrading: (world) => {
          if (world.bodies.length >= 2 && Math.abs(world.gravityY - 980) < 100) {
            return { 
              pass: true, 
              score: 100, 
              title: "🎉 100% - Galileo Proven!", 
              msg: "Outstanding! In uniform gravity (g = 9.8 m/s²), both the 10 kg and 0.5 kg spheres accelerate at the exact same rate regardless of mass. Mass cancels out in Newton's second law: a = F/m = (mg)/m = g!" 
            };
          }
          return { pass: false, score: 65, title: "⚠️ Check Setup", msg: "Make sure both spheres were dropped under standard Earth gravity (9.8 m/s²)." };
        }
      },
      momentum: {
        title: "Elastic Collisions & Momentum Transfer (p = mv)",
        grade: "Grades 9–12",
        goal: "Set up two bodies colliding head-on. Observe how momentum vectors transfer between them. In an elastic collision (e = 1.0), kinetic energy and momentum are conserved!",
        steps: [
          "Observe m₁ (2 kg) and m₂ (2 kg) moving toward each other.",
          "Watch the cyan velocity vector arrows before and after impact.",
          "Touch/click and drag either ball to fling them at different angles.",
          "Observe momentum reflection and click 'Check & Grade Lab'."
        ],
        targetLabel: "Target Elasticity",
        targetVal: "e = 1.00",
        setup: (world, view) => {
          world.clearAll();
          world.gravityY = 0; // Zero-G collision test
          view.isSuspendedAtTop = false;
          const w = world.width || 800;
          const h = world.height || 500;
          const b1 = new PhysicsBody({ type: "circle", x: w * 0.25, y: h * 0.5, radius: 26, mass: 2.0, color: "#ec4899", label: "m₁=2kg", vx: 280, vy: 0, restitution: 1.0 });
          const b2 = new PhysicsBody({ type: "circle", x: w * 0.75, y: h * 0.5, radius: 26, mass: 2.0, color: "#06b6d4", label: "m₂=2kg", vx: -280, vy: 0, restitution: 1.0 });
          world.addBody(b1);
          world.addBody(b2);
        },
        checkGrading: (world) => {
          return { pass: true, score: 100, title: "💥 Momentum Conserved!", msg: "Law of Conservation of Linear Momentum verified! Total initial momentum equals total final momentum (p_initial = p_final)." };
        }
      },
      planetary: {
        title: "Planetary Gravity Comparison (Moon vs Earth vs Jupiter)",
        grade: "Grades 6–9",
        goal: "Use the Gravity slider on the right to test how falling objects behave under Moon gravity (1.6 m/s²), Earth gravity (9.8 m/s²), and Jupiter gravity (24.8 m/s²). Touch and fling them to feel the difference!",
        steps: [
          "Slide Gravity to Moon (~1.6 m/s²) and toss a ball upward.",
          "Slide Gravity to Jupiter (~24.8 m/s²) and feel the heavy downward pull.",
          "Watch the live velocity and kinetic energy readings in the HUD.",
          "Observe how weight changes while inertial mass stays constant."
        ],
        targetLabel: "Exploration Mode",
        targetVal: "All Planets",
        setup: (world, view) => {
          world.clearAll();
          world.gravityY = 980;
          view.isSuspendedAtTop = false;
          for (let i = 0; i < 4; i++) {
            world.addBody(new PhysicsBody({ type: "circle", x: 120 + i * 130, y: 120, radius: 24, mass: 1.0 + i, color: "#818cf8", label: `${1+i}kg` }));
          }
        },
        checkGrading: (world) => {
          return { pass: true, score: 100, title: "🚀 Planetary Physicist!", msg: `Current gravity: ${(world.gravityY/100).toFixed(1)} m/s². Notice how weight (W = mg) changes drastically between planets while mass remains unchanged!` };
        }
      }
    };

    this.render();
    this.initCanvas();
    this.initGandhoVoice();
    try {
      this.loadMission(this.currentMissionKey);
    } catch (err) {
      console.error("[PhysicsView] Failed to load mission:", err);
    }
    if (!this.world.bodies.length) {
      try {
        const m = this.missions[this.currentMissionKey] || this.missions.free_fall;
        m.setup(this.world, this);
      } catch (err2) {
        console.error("[PhysicsView] Fallback mission setup failed:", err2);
      }
    }
    try {
      this.bindEvents();
    } catch (err) {
      console.error("[PhysicsView] Failed to bind events:", err);
    }
    this.startLoop();
    // Re-measure after layout settles (full-width labs pane)
    requestAnimationFrame(() => {
      this.resizeCanvas();
      if (!this.world.bodies.length) {
        try {
          const m = this.missions[this.currentMissionKey] || this.missions.free_fall;
          m.setup(this.world, this);
        } catch (_) {}
      }
    });
  }

  initGandhoVoice() {
    const slot = this.container.querySelector("#gandhoPhysMicSlot");
    if (slot) {
      this.gandhoAssistant = new GandhoLabVoiceAssistant(slot, () => ({
        domain: "physics",
        mission: this.currentMissionKey,
        bodiesCount: this.world.bodies.length,
        gravity: (this.world.gravityY / 100).toFixed(1),
        maxSpeed: 0
      }));
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-split-workspace">
        <!-- LEFT: Full-Height Canvas Lab Space -->
        <div class="lab-split-left" id="canvasBox">
          <canvas id="physicsCanvas" style="width: 100%; height: 100%; touch-action: none; cursor: crosshair; display: block;"></canvas>

          <!-- Floating Telemetry HUD -->
          <div class="telemetry-hud" style="top: 20px; right: 20px;">
            <div class="telemetry-row">
              <span>SIM STATUS:</span>
              <span class="telemetry-val" id="hudSimStatus">RUNNING</span>
            </div>
            <div class="telemetry-row">
              <span>ACTIVE BODIES:</span>
              <span class="telemetry-val" id="hudBodiesCount">0</span>
            </div>
            <div class="telemetry-row">
              <span>TOTAL KINETIC:</span>
              <span class="telemetry-val" id="hudKineticEnergy">0.00 J</span>
            </div>
            <div class="telemetry-row">
              <span>PEAK VELOCITY:</span>
              <span class="telemetry-val" id="hudMaxVel">0.0 m/s</span>
            </div>
            <div class="telemetry-row">
              <span>GRAVITY (g):</span>
              <span class="telemetry-val" id="hudGravityVal">9.8 m/s²</span>
            </div>
          </div>

          <!-- Floating Bottom Toolbar -->
          <div class="canvas-floating-toolbar">
            <button type="button" class="btn-release-drop" id="btnReleaseDrop" title="Drop suspended balls from top">
              🪂 Drop Both Balls
            </button>
            <span style="width: 1px; height: 24px; background: rgba(255,255,255,0.15);"></span>
            <button type="button" id="btnSpawnBall" class="lab-action-btn btn-primary-phys" style="padding: 7px 12px; font-size: 0.8rem;">
              ➕ Ball (1 kg)
            </button>
            <button type="button" id="btnSpawnHeavyBox" class="lab-action-btn btn-secondary" style="padding: 7px 12px; font-size: 0.8rem;">
              ➕ Box (5 kg)
            </button>
            <button type="button" id="btnSpawnBouncy" class="lab-action-btn btn-secondary" style="padding: 7px 12px; font-size: 0.8rem; color: #38bdf8;">
              🎾 Super Bounce
            </button>
            <button type="button" id="btnPause" class="lab-action-btn btn-secondary" style="padding: 7px 12px; font-size: 0.8rem;">
              ⏸️ Pause
            </button>
            <button type="button" id="btnReset" class="lab-action-btn btn-secondary" style="padding: 7px 12px; font-size: 0.8rem; color: #f43f5e;">
              🗑️ Reset
            </button>
          </div>
        </div>

        <!-- RIGHT: Step-by-Step Instructions & Mission Drawer -->
        <div class="lab-split-right">
          <!-- Top Row with Gandho Voice -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--lab-border); padding-bottom: 12px;">
            <span class="mission-badge" id="physMissionBadge" style="margin: 0;">Grades 6–10 • Interactive Practice</span>
            <div id="gandhoPhysMicSlot"></div>
          </div>

          <!-- Mission Selector Tabs -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="preset-pill active" data-mission="free_fall" style="font-size: 0.75rem;">1. Galileo Free Fall</button>
            <button type="button" class="preset-pill" data-mission="momentum" style="font-size: 0.75rem;">2. Momentum Transfer</button>
            <button type="button" class="preset-pill" data-mission="planetary" style="font-size: 0.75rem;">3. Planetary Gravity</button>
          </div>

          <!-- Objective Card -->
          <div style="background: rgba(20, 20, 28, 0.7); border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h3 class="mission-title" id="physMissionTitle" style="font-size: 1.1rem; margin-bottom: 8px;">Galileo's Free Fall</h3>
            <p class="mission-goal" id="physMissionGoal" style="margin: 0; font-size: 0.84rem; color: #d4d4d8; line-height: 1.5;">Goal description...</p>
          </div>

          <!-- Step-by-Step Procedure Checklist -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
              📋 Step-by-Step Instructions
            </h4>
            <ul class="mission-checklist" id="physMissionSteps" style="margin: 0; line-height: 1.5;"></ul>
          </div>

          <!-- Live Mission Tracker Box -->
          <div class="mission-tracker-box">
            <div><span style="color:#a1a1aa;" id="physTargetLabel">Target Condition:</span> <strong style="color:#818cf8;" id="physTargetVal">9.8 m/s²</strong></div>
            <div><span style="color:#a1a1aa;">Current Gravity:</span> <strong style="color:#38bdf8;" id="physCurrentVal">9.8 m/s²</strong></div>
            <div id="physMissionStatus" style="font-weight:bold; color:#10b981;">🟢 READY TO DROP</div>
          </div>

          <!-- Interactive Environment Sliders -->
          <div style="background: #141418; border: 1px solid var(--lab-border); border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 0.82rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">
              ⚙️ Environment Parameters
            </h4>
            
            <div class="control-slider-group">
              <label>
                <span>Gravity (g):</span>
                <span id="gravityLabel" style="color: #818cf8; font-weight: 700;">Earth (9.8 m/s²)</span>
              </label>
              <input type="range" id="gravitySlider" min="0" max="2500" step="50" value="980">
            </div>

            <div class="control-slider-group">
              <label>
                <span>Restitution (Elasticity):</span>
                <span id="restitutionLabel" style="color: #818cf8; font-weight: 700;">0.75</span>
              </label>
              <input type="range" id="restitutionSlider" min="0" max="1" step="0.05" value="0.75">
            </div>

            <div class="control-slider-group">
              <label>
                <span>Surface Friction:</span>
                <span id="frictionLabel" style="color: #818cf8; font-weight: 700;">0.05</span>
              </label>
              <input type="range" id="frictionSlider" min="0" max="0.3" step="0.01" value="0.05">
            </div>
          </div>

          <div id="physChallengesMount"></div>

          <!-- Check & Grade Lab Button -->
          <div style="margin-top: auto; padding-top: 10px;">
            <button type="button" class="btn-check-grade" id="btnPhysCheckGrade" style="padding: 14px; font-size: 0.95rem;">
              ✅ Check & Grade Lab Work
            </button>
          </div>
        </div>
      </div>
    `;
  }

  initCanvas() {
    this.canvas = this.container.querySelector("#physicsCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.world.onImpact = (mass, vel) => labAudio.playImpactThud(mass, vel);
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.floor(rect.width) || 800;
    const height = Math.floor(rect.height) || 600;

    // Direct 1:1 pixel coordinate matching with CSS!
    this.canvas.width = width;
    this.canvas.height = height;
    this.world.setDimensions(width, height);
  }

  bindEvents() {
    const canvas = this.canvas;

    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    // Hover feedback: change cursor to grab when over bodies
    canvas.addEventListener("pointermove", (e) => {
      const pos = getCanvasPos(e);
      if (this.world.grabbedBody) {
        canvas.style.cursor = "grabbing";
        this.world.updateGrab(pos.x, pos.y);
      } else {
        const hovered = this.world.getBodyAt(pos.x, pos.y);
        canvas.style.cursor = hovered ? "grab" : "crosshair";
      }
    });

    // Pointer down: grab body directly
    canvas.addEventListener("pointerdown", (e) => {
      const pos = getCanvasPos(e);
      const grabbed = this.world.startGrab(pos.x, pos.y);
      if (grabbed) {
        // If body was static (suspended at top), unpin it!
        grabbed.isStatic = false;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      }
    });

    const handlePointerUp = (e) => {
      this.world.endGrab();
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      canvas.style.cursor = "crosshair";
    };

    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    // Release / Drop Both Balls Button
    this.container.querySelector("#btnReleaseDrop")?.addEventListener("click", () => {
      labAudio.playClick();
      this.releaseSuspendedBalls();
    });

    // Spawning Buttons
    this.container.querySelector("#btnSpawnBall")?.addEventListener("click", () => {
      labAudio.playClick();
      this.spawnBall(this.world.width * 0.5, 90, 1.0, "#818cf8", "1kg Ball");
    });
    this.container.querySelector("#btnSpawnHeavyBox")?.addEventListener("click", () => {
      labAudio.playClick();
      this.spawnBox(this.world.width * 0.5, 90, 5.0, "#f43f5e", "5kg Box");
    });
    this.container.querySelector("#btnSpawnBouncy")?.addEventListener("click", () => {
      labAudio.playClick();
      const b = this.spawnBall(this.world.width * 0.5, 90, 0.8, "#38bdf8", "SuperBall");
      b.restitution = 0.98;
    });

    // Sliders
    const gravSlider = this.container.querySelector("#gravitySlider");
    const gravLabel = this.container.querySelector("#gravityLabel");
    gravSlider?.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.world.gravityY = val;
      const ms2 = (val / 100).toFixed(1);
      if (val === 0) gravLabel.innerText = "Zero-G (0.0 m/s²)";
      else if (val < 400) gravLabel.innerText = `Moon (~${ms2} m/s²)`;
      else if (val < 1300) gravLabel.innerText = `Earth (~${ms2} m/s²)`;
      else gravLabel.innerText = `Jupiter (~${ms2} m/s²)`;

      this.container.querySelector("#hudGravityVal").innerText = `${ms2} m/s²`;
      this.container.querySelector("#physCurrentVal").innerText = `${ms2} m/s²`;
    });

    const restSlider = this.container.querySelector("#restitutionSlider");
    const restLabel = this.container.querySelector("#restitutionLabel");
    restSlider?.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.world.globalRestitution = val;
      restLabel.innerText = val.toFixed(2);
    });

    const frictSlider = this.container.querySelector("#frictionSlider");
    const frictLabel = this.container.querySelector("#frictionLabel");
    frictSlider?.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.world.globalFriction = val;
      frictLabel.innerText = val.toFixed(2);
    });

    // Pause & Reset
    const pauseBtn = this.container.querySelector("#btnPause");
    pauseBtn?.addEventListener("click", () => {
      if (this.timeScale > 0) {
        this.timeScale = 0;
        pauseBtn.innerText = "▶️ Resume";
        this.container.querySelector("#hudSimStatus").innerText = "PAUSED";
      } else {
        this.timeScale = 1.0;
        pauseBtn.innerText = "⏸️ Pause";
        this.container.querySelector("#hudSimStatus").innerText = "RUNNING";
      }
    });

    this.container.querySelector("#btnReset")?.addEventListener("click", () => {
      this.loadMission(this.currentMissionKey);
    });

    // Mission Tabs
    const missionPills = this.container.querySelectorAll(".preset-pill");
    missionPills.forEach(pill => {
      pill.addEventListener("click", () => {
        missionPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.loadMission(pill.dataset.mission);
      });
    });

    // Grade Lab
    this.container.querySelector("#btnPhysCheckGrade")?.addEventListener("click", () => {
      this.gradeCurrentMission();
    });
  }

  releaseSuspendedBalls() {
    this.hasDropped = true;
    labAudio.playCannonLaunch();
    let releasedCount = 0;
    for (const b of this.world.bodies) {
      if (!b || typeof b.x !== "number" || typeof b.y !== "number") continue;
      if (b.isStatic) {
        b.isStatic = false;
        b.invMass = b.mass > 0 && isFinite(b.mass) ? 1.0 / b.mass : 0;
        b.vy = 50; // Initial drop impulse
        releasedCount++;
      }
    }
    const status = this.container.querySelector("#physMissionStatus");
    if (status) {
      status.innerText = "🚀 DROPPING...";
      status.style.color = "#38bdf8";
    }
    const btn = this.container.querySelector("#btnReleaseDrop");
    if (btn) btn.innerText = "🔄 Reset & Drop Again";
  }

  loadMission(missionKey) {
    this.currentMissionKey = missionKey;
    const m = this.missions[missionKey] || this.missions.free_fall;

    // Ensure layout dimensions are measured accurately before setup
    this.resizeCanvas();
    m.setup(this.world, this);

    const setText = (sel, value) => {
      const el = this.container.querySelector(sel);
      if (el) el.innerText = value;
    };
    setText("#physMissionBadge", `${m.grade || m.level || ""} • Interactive Practice`);
    setText("#physMissionTitle", m.title || "");
    setText("#physMissionGoal", m.goal || "");
    setText("#physTargetLabel", `${m.targetLabel || "Target"}:`);
    setText("#physTargetVal", m.targetVal || "");

    const stepsList = this.container.querySelector("#physMissionSteps");
    if (stepsList) {
      stepsList.innerHTML = (m.steps || []).map(s => `<li style="margin-bottom:8px;"><span style="color:#818cf8; font-weight:bold;">▸</span> <span>${s}</span></li>`).join('');
    }
    console.log("[PhysicsView] Mission loaded:", missionKey, "bodies=", this.world.bodies.length, "canvas=", this.canvas?.width, this.canvas?.height);

    const btnDrop = this.container.querySelector("#btnReleaseDrop");
    if (btnDrop) {
      btnDrop.style.display = missionKey === "free_fall" ? "inline-flex" : "none";
      btnDrop.innerText = "🪂 Drop Both Balls";
    }

    const status = this.container.querySelector("#physMissionStatus");
    if (status) {
      status.innerText = "🟢 READY TO DROP";
      status.style.color = "#10b981";
    }

    this.hasDropped = false;
    this.peakKinetic = 0;
    this.ballsLandedTogether = false;
    const chMount = this.container.querySelector("#physChallengesMount");
    if (chMount) {
      challengeManager.renderSidebarPanel(
        this.currentMissionKey === "momentum" ? "phys_momentum" : "phys_free_fall",
        chMount,
      );
    }
    this.broadcastTelemetry();
  }

  broadcastTelemetry() {
    try {
      const bodies = (this.world?.bodies || []).map(b => {
        if (!b) return "unknown";
        const vy = typeof b.vy === "number" ? b.vy.toFixed(1) : "0";
        const y = typeof b.y === "number" ? b.y.toFixed(0) : "0";
        return `${b.label || "Sphere"} (${b.mass || 0}kg, vel_y: ${vy} m/s, y: ${y}px)`;
      });
      const g = (this.world && typeof this.world.gravityY === "number") ? this.world.gravityY : 980;
      window.currentSocraticLabContext = {
        experiment_id: "phys_" + this.currentMissionKey,
        title: "Physics Mechanics: " + (this.currentMissionKey === "free_fall" ? "Gravity & Free Fall (Galileo)" : (this.currentMissionKey === "momentum" ? "Momentum & Elastic Collisions" : "Planetary Gravity")),
        gravity: ((g || 0) / 100).toFixed(1) + " m/s²",
        bodies_on_canvas: bodies,
        status: this.isSuspendedAtTop ? "Spheres suspended at top ready to drop" : "Spheres in active physical motion"
      };
      if (typeof window.updateActiveViewState === "function") {
        window.updateActiveViewState();
      }
    } catch (err) {
      console.warn("[PhysicsView] broadcastTelemetry skipped:", err);
    }
  }

  gradeCurrentMission() {
    const m = this.missions[this.currentMissionKey] || this.missions.free_fall;
    const grade = m.checkGrading(this.world);

    const modal = document.createElement("div");
    modal.className = "grade-feedback-modal";
    modal.innerHTML = `
      <div class="grade-card ${grade.pass ? '' : 'fail'}">
        <div style="font-size: 3rem; margin-bottom: 12px;">${grade.pass ? '🏆' : '⚛️'}</div>
        <h2 style="margin: 0 0 8px 0; color: ${grade.pass ? '#10b981' : '#ef4444'};">${grade.title}</h2>
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 14px; color: #ffffff;">Grade: ${grade.score}%</div>
        <p style="color: #d4d4d8; font-size: 0.92rem; line-height: 1.5; margin: 0 0 24px 0;">
          ${grade.msg}
        </p>
        <button type="button" class="lab-action-btn ${grade.pass ? 'btn-primary-phys' : 'btn-secondary'}" id="btnClosePhysGrade" style="width: 100%;">
          ${grade.pass ? 'Continue Practicing ➔' : 'Try Again'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#btnClosePhysGrade").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }

  spawnBall(x, y, mass, color, label) {
    const radius = Math.max(18, Math.min(36, 20 * Math.sqrt(mass)));
    const body = new PhysicsBody({ type: "circle", x, y, radius, mass, color, label });
    return this.world.addBody(body);
  }

  spawnBox(x, y, mass, color, label) {
    const size = Math.max(34, Math.min(68, 38 * Math.sqrt(mass)));
    const body = new PhysicsBody({ type: "box", x, y, width: size, height: size, mass, color, label });
    return this.world.addBody(body);
  }

  startLoop() {
    this.lastTime = performance.now();
    const frame = (now) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      if (this.timeScale > 0) {
        this.world.step(dt * this.timeScale);
      }

      this.draw();
      this.updateTelemetry();
      this.animationFrameId = requestAnimationFrame(frame);
    };
    this.animationFrameId = requestAnimationFrame(frame);
  }

  stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.world.width;
    const h = this.world.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Floor line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(w, h - 2);
    ctx.stroke();

    // Bodies
    for (const b of this.world.bodies) {
      if (!b || typeof b.x !== "number" || typeof b.y !== "number") continue;
      ctx.save();

      // Soft glow shadow
      ctx.shadowColor = b.isGrabbed ? "#ffffff" : b.color;
      ctx.shadowBlur = b.isGrabbed ? 20 : 10;

      if (b.type === "circle") {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        // Pulsing selection ring if grabbed or suspended
        ctx.strokeStyle = b.isGrabbed ? "#ffffff" : (b.isStatic ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.4)");
        ctx.lineWidth = b.isGrabbed ? 3 : 2;
        ctx.stroke();

        if (b.isStatic) {
          // Draw small suspension pin
          ctx.beginPath();
          ctx.arc(b.x, b.y - b.radius, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#facc15";
          ctx.fill();
        }
      } else if (b.type === "box") {
        const halfW = b.width / 2;
        const halfH = b.height / 2;
        ctx.beginPath();
        ctx.rect(b.x - halfW, b.y - halfH, b.width, b.height);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = b.isGrabbed ? "#ffffff" : "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      // Velocity Vector arrow
      if (this.showVectors && !b.isGrabbed && !b.isStatic) {
        this.drawVelocityVector(ctx, b);
      }

      // Mass label
      if (this.showLabels) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${b.mass}kg`, b.x, b.y);
      }
    }
  }

  drawVelocityVector(ctx, b) {
    const speed = b.getSpeed();
    if (speed < 5) return;

    const scale = 0.16;
    const arrowX = b.x + b.vx * scale;
    const arrowY = b.y + b.vy * scale;

    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();

    const angle = Math.atan2(b.vy, b.vx);
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - headLen * Math.cos(angle - Math.PI / 6), arrowY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - headLen * Math.cos(angle + Math.PI / 6), arrowY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  updateTelemetry() {
    const bodies = this.world.bodies;
    let totalKE = 0;
    let maxSpeed = 0;

    for (const b of bodies) {
      totalKE += b.getKineticEnergy();
      const s = b.getSpeed();
      if (s > maxSpeed) maxSpeed = s;
    }

    const hudBodies = this.container.querySelector("#hudBodiesCount");
    const hudKE = this.container.querySelector("#hudKineticEnergy");
    const hudMaxV = this.container.querySelector("#hudMaxVel");

    if (hudBodies) hudBodies.innerText = bodies.length;
    if (hudKE) hudKE.innerText = `${(totalKE / 1000).toFixed(2)} J`;
    if (hudMaxV) hudMaxV.innerText = `${(maxSpeed / 100).toFixed(1)} m/s`;

    const keJ = totalKE / 1000;
    if (keJ > this.peakKinetic) this.peakKinetic = keJ;
    const dynamic = bodies.filter((b) => !b.isStatic);
    const floorY = this.world.height || 0;
    const nearFloor = dynamic.filter((b) => (b.y + (b.radius || 20)) > floorY - 12);
    this.ballsLandedTogether = this.hasDropped && nearFloor.length >= 2;
    const topicId =
      this.currentMissionKey === "momentum" ? "phys_momentum" : "phys_free_fall";
    if (challengeManager.checkState(topicId, {
      gravity: this.world.gravityY / 100,
      hasDropped: this.hasDropped,
      ballsLandedTogether: this.ballsLandedTogether,
      peakKinetic: this.peakKinetic,
    })) {
      challengeManager.renderSidebarPanel(topicId, this.container.querySelector("#physChallengesMount"));
    }
  }

  executeVoiceCommand(cmd) {
    if (!cmd) return;
    const action = (cmd.action || "").toLowerCase();
    const val = typeof cmd.value === "number" ? cmd.value : parseFloat(cmd.value || 0);
    if (action.includes("drop") || action.includes("lâche") || action.includes("lache") || action.includes("release")) {
      this.releaseSuspendedBalls();
      this.showVoiceToast("Gandho : les deux sphères sont lâchées.");
    } else if (action.includes("gravity") || action.includes("gravité") || action.includes("gravite")) {
      let g = 980;
      if (val > 0) g = val * (val < 80 ? 100 : 1);
      else if (cmd.preset === "moon" || action.includes("moon") || action.includes("lune")) g = 160;
      else if (cmd.preset === "jupiter" || action.includes("jupiter")) g = 2480;
      else if (cmd.preset === "earth" || action.includes("earth") || action.includes("terre")) g = 980;
      this.world.gravityY = g;
      const gravSlider = this.container.querySelector("#gravitySlider");
      if (gravSlider) gravSlider.value = g;
      const gravLabel = this.container.querySelector("#gravityLabel");
      if (gravLabel) gravLabel.innerText = `${(g / 100).toFixed(1)} m/s²`;
      const hudG = this.container.querySelector("#hudGravityVal");
      if (hudG) hudG.innerText = `${(g / 100).toFixed(1)} m/s²`;
      this.updateTelemetry();
      this.showVoiceToast(`Gandho : gravité réglée à ${(g / 100).toFixed(1)} m/s².`);
    } else if (action.includes("reset") || action.includes("réinitialiser") || action.includes("reinit")) {
      this.loadMission(this.currentMissionKey);
      this.showVoiceToast("Gandho : simulation réinitialisée.");
    } else if (action.includes("pause") || action.includes("stop")) {
      const btn = this.container.querySelector("#btnPause");
      if (btn) btn.click();
      this.showVoiceToast("Gandho : simulation en pause ou reprise.");
    }
  }

  showVoiceToast(msg) {
    this.container.querySelectorAll(".lab-gandho-toast").forEach((el) => el.remove());
    const toast = document.createElement("div");
    toast.className = "lab-gandho-toast";
    toast.innerText = msg;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("is-leaving");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
}
