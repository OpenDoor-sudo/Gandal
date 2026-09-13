/**
 * breadboard_3d.js - High-Fidelity 3D WebGL Breadboard & Procedural Wire Engine
 * Built with Three.js for interactive electronics walkthroughs.
 */

export class Breadboard3DEngine {
  constructor(mountContainer) {
    this.container = mountContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;

    // Groups
    this.breadboardGroup = null;
    this.wiresGroup = null;
    this.componentsGroup = null;
    this.highlightsGroup = null;

    // Dimensions & Pitch (in Three.js world units)
    this.pinPitch = 0.254; // Standard 0.1 inch (2.54mm) scaled to 0.254 units
    this.rowsCount = 30;
    this.boardWidth = 8.5;
    this.boardLength = 3.0;
    this.boardHeight = 0.35;

    // Coordinate Vector Cache
    this.pinCoordinates = new Map();
    this.activeWires = [];
    this.activeComponents = new Map();
    this.activeHighlights = [];

    this.isInitialized = false;
  }

  async init() {
    await this._ensureThreeLoaded();
    this._setupScene();
    this._setupLighting();
    this._buildBreadboardGeometry();
    this._startRenderLoop();

    window.addEventListener("resize", this._onResize.bind(this));
    this.isInitialized = true;
    console.log("[BREADBOARD 3D] Engine initialized successfully with", this.pinCoordinates.size, "pin nodes.");
  }

  async _ensureThreeLoaded() {
    if (window.THREE && window.THREE.OrbitControls) return;

    if (!window.THREE) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    if (!window.THREE.OrbitControls) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  _setupScene() {
    const THREE = window.THREE;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // Perspective Camera angled slightly over the breadboard
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 7.5, 6.0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Empty container safely and append
    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.05; // Don't go below table
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 18.0;
    this.controls.target.set(0, 0, 0);

    // Scene Graph hierarchy
    this.breadboardGroup = new THREE.Group();
    this.wiresGroup = new THREE.Group();
    this.componentsGroup = new THREE.Group();
    this.highlightsGroup = new THREE.Group();

    this.scene.add(this.breadboardGroup);
    this.scene.add(this.wiresGroup);
    this.scene.add(this.componentsGroup);
    this.scene.add(this.highlightsGroup);

    // Elegant subtle grid floor
    const grid = new THREE.GridHelper(24, 24, 0x27272a, 0x18181f);
    grid.position.y = -0.2;
    this.scene.add(grid);
  }

  _setupLighting() {
    const THREE = window.THREE;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    mainKeyLight.position.set(5, 12, 8);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.camera.near = 1;
    mainKeyLight.shadow.camera.far = 25;
    mainKeyLight.shadow.camera.left = -6;
    mainKeyLight.shadow.camera.right = 6;
    mainKeyLight.shadow.camera.top = 6;
    mainKeyLight.shadow.camera.bottom = -6;
    this.scene.add(mainKeyLight);

    const rimLight = new THREE.DirectionalLight(0xc2c1ff, 0.45);
    rimLight.position.set(-6, 5, -6);
    this.scene.add(rimLight);
  }

  _buildBreadboardGeometry() {
    const THREE = window.THREE;

    // 1. Breadboard Main Plastic Chassis
    const boardGeo = new THREE.BoxGeometry(this.boardWidth, this.boardHeight, this.boardLength);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x26262c, // Modern dark tech matte breadboard
      roughness: 0.5,
      metalness: 0.1
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.y = this.boardHeight / 2;
    boardMesh.receiveShadow = true;
    this.breadboardGroup.add(boardMesh);

    // 2. Center Divider Trough
    const troughGeo = new THREE.BoxGeometry(this.boardWidth * 0.88, 0.08, 0.22);
    const troughMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.8 });
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, this.boardHeight + 0.01, 0);
    this.breadboardGroup.add(trough);

    // 3. Colored Power Rail Stripes (Red for +, Blue for -)
    const stripeMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const stripeMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const stripeLength = this.boardWidth * 0.86;

    // Top power stripes
    const topRedStripe = new THREE.Mesh(new THREE.BoxGeometry(stripeLength, 0.005, 0.03), stripeMatRed);
    topRedStripe.position.set(0, this.boardHeight + 0.005, -1.22);
    this.breadboardGroup.add(topRedStripe);

    const topBlueStripe = new THREE.Mesh(new THREE.BoxGeometry(stripeLength, 0.005, 0.03), stripeMatBlue);
    topBlueStripe.position.set(0, this.boardHeight + 0.005, -0.92);
    this.breadboardGroup.add(topBlueStripe);

    // Bottom power stripes
    const botBlueStripe = new THREE.Mesh(new THREE.BoxGeometry(stripeLength, 0.005, 0.03), stripeMatBlue);
    botBlueStripe.position.set(0, this.boardHeight + 0.005, 0.92);
    this.breadboardGroup.add(botBlueStripe);

    const botRedStripe = new THREE.Mesh(new THREE.BoxGeometry(stripeLength, 0.005, 0.03), stripeMatRed);
    botRedStripe.position.set(0, this.boardHeight + 0.005, 1.22);
    this.breadboardGroup.add(botRedStripe);

    // 4. Pin Holes & Coordinates Generation
    // Solderless breadboard has 30 columns horizontally across X axis (-3.7 to +3.7)
    // Rows A-E are at Z = -0.7 to -0.2 (top bank)
    // Rows F-J are at Z = +0.2 to +0.7 (bottom bank)
    // Power rails are at Z = -1.35, -1.05 and +1.05, +1.35
    const holeGeo = new THREE.BoxGeometry(0.12, 0.05, 0.12);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c10,
      roughness: 0.9,
      metalness: 0.4
    });

    const startX = -((this.rowsCount - 1) * this.pinPitch) / 2;
    const ySurface = this.boardHeight + 0.02;

    const colOffsets = {
      // Top bank (A-E)
      E: -0.24,
      D: -0.36,
      C: -0.48,
      B: -0.60,
      A: -0.72,
      // Bottom bank (F-J)
      F: 0.24,
      G: 0.36,
      H: 0.48,
      I: 0.60,
      J: 0.72
    };

    // Instantiate InstancedMesh for thousands of pin holes for 60fps performance
    const totalHoles = this.rowsCount * (10 + 4);
    const instancedHoles = new THREE.InstancedMesh(holeGeo, holeMat, totalHoles);
    instancedHoles.receiveShadow = true;
    let holeIdx = 0;
    const dummy = new THREE.Object3D();

    for (let row = 1; row <= this.rowsCount; row++) {
      const posX = startX + (row - 1) * this.pinPitch;

      // Terminal strips A-J
      for (const [colName, offsetZ] of Object.entries(colOffsets)) {
        const pinKey = `${colName}${row}`;
        const pos = new THREE.Vector3(posX, ySurface, offsetZ);
        this.pinCoordinates.set(pinKey, pos);

        dummy.position.copy(pos);
        dummy.position.y -= 0.01;
        dummy.updateMatrix();
        instancedHoles.setMatrixAt(holeIdx++, dummy.matrix);
      }

      // Top Power Rails
      const topPlusPos = new THREE.Vector3(posX, ySurface, -1.35);
      const topMinusPos = new THREE.Vector3(posX, ySurface, -1.05);
      this.pinCoordinates.set(`POWER_PLUS_${row}`, topPlusPos);
      this.pinCoordinates.set(`+${row}`, topPlusPos);
      this.pinCoordinates.set(`POWER_MINUS_${row}`, topMinusPos);
      this.pinCoordinates.set(`-${row}`, topMinusPos);

      dummy.position.copy(topPlusPos);
      dummy.position.y -= 0.01;
      dummy.updateMatrix();
      instancedHoles.setMatrixAt(holeIdx++, dummy.matrix);

      dummy.position.copy(topMinusPos);
      dummy.position.y -= 0.01;
      dummy.updateMatrix();
      instancedHoles.setMatrixAt(holeIdx++, dummy.matrix);

      // Bottom Power Rails
      const botMinusPos = new THREE.Vector3(posX, ySurface, 1.05);
      const botPlusPos = new THREE.Vector3(posX, ySurface, 1.35);
      this.pinCoordinates.set(`BOT_MINUS_${row}`, botMinusPos);
      this.pinCoordinates.set(`BOT_PLUS_${row}`, botPlusPos);

      dummy.position.copy(botMinusPos);
      dummy.position.y -= 0.01;
      dummy.updateMatrix();
      instancedHoles.setMatrixAt(holeIdx++, dummy.matrix);

      dummy.position.copy(botPlusPos);
      dummy.position.y -= 0.01;
      dummy.updateMatrix();
      instancedHoles.setMatrixAt(holeIdx++, dummy.matrix);
    }

    instancedHoles.instanceMatrix.needsUpdate = true;
    this.breadboardGroup.add(instancedHoles);
  }

  getPinPosition(coord) {
    if (!coord) return null;
    const cleanKey = String(coord).trim().toUpperCase();

    if (this.pinCoordinates.has(cleanKey)) {
      return this.pinCoordinates.get(cleanKey).clone();
    }

    // Try fuzzy match (e.g. "PIN 8", "A 12", "ROW 10")
    const simplified = cleanKey.replace(/[^A-Z0-9\+\-]/g, "");
    if (this.pinCoordinates.has(simplified)) {
      return this.pinCoordinates.get(simplified).clone();
    }

    console.warn(`[BREADBOARD] Pin coordinate "${coord}" not found in matrix.`);
    return new THREE.Vector3(0, this.boardHeight + 0.02, 0);
  }

  /**
   * Procedural Arched 3D Jumper Wire Generator
   */
  animateNewWire(wireData) {
    const THREE = window.THREE;
    const fromPos = this.getPinPosition(wireData.from);
    const toPos = this.getPinPosition(wireData.to);

    if (!fromPos || !toPos) return null;

    // Calculate realistic Bezier curve arch
    const distance = fromPos.distanceTo(toPos);
    const midX = (fromPos.x + toPos.x) / 2;
    const midZ = (fromPos.z + toPos.z) / 2;
    const archHeight = Math.max(0.4, Math.min(1.8, distance * 0.45));

    // CatmullRom Curve Points
    const p0 = fromPos.clone();
    const p1 = new THREE.Vector3(fromPos.x, fromPos.y + 0.15, fromPos.z);
    const pMid = new THREE.Vector3(midX, fromPos.y + archHeight, midZ);
    const p3 = new THREE.Vector3(toPos.x, toPos.y + 0.15, toPos.z);
    const p4 = toPos.clone();

    const curve = new THREE.CatmullRomCurve3([p0, p1, pMid, p3, p4]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.032, 8, false);

    // Color mapper
    const colorHex = this._resolveColor(wireData.color);
    const wireMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.2
    });

    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    wireMesh.castShadow = true;

    // Terminal Pin Caps (Silver metallic pins inserting into holes)
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    const pin1 = new THREE.Mesh(pinGeo, pinMat);
    pin1.position.copy(fromPos);
    pin1.position.y += 0.05;

    const pin2 = new THREE.Mesh(pinGeo, pinMat);
    pin2.position.copy(toPos);
    pin2.position.y += 0.05;

    const wireGroup = new THREE.Group();
    wireGroup.add(wireMesh);
    wireGroup.add(pin1);
    wireGroup.add(pin2);
    wireGroup.userData = { wireData, id: `wire_${Date.now()}_${Math.random()}` };

    // Initial scale for spawn pop animation
    wireGroup.scale.set(0.01, 0.01, 0.01);
    this.wiresGroup.add(wireGroup);
    this.activeWires.push(wireGroup);

    // Pop-in tween animation
    let scaleProgress = 0;
    const animInterval = setInterval(() => {
      scaleProgress += 0.12;
      if (scaleProgress >= 1.0) {
        wireGroup.scale.set(1, 1, 1);
        clearInterval(animInterval);
      } else {
        const s = Math.sin((scaleProgress * Math.PI) / 2);
        wireGroup.scale.set(s, s, s);
      }
    }, 16);

    return wireGroup;
  }

  /**
   * 3D Component Models Placer (ICs, LEDs, Resistors, Capacitors)
   */
  placeComponent(compData) {
    const THREE = window.THREE;
    const compType = (compData.type || "").toUpperCase();
    let compMesh = null;

    if (compType.startsWith("IC_") || compType.includes("DIP")) {
      compMesh = this._createDIP_IC(compData);
    } else if (compType.includes("LED")) {
      compMesh = this._createLED(compData);
    } else if (compType.includes("RESISTOR")) {
      compMesh = this._createResistor(compData);
    } else if (compType.includes("TRANSISTOR")) {
      compMesh = this._createTransistor(compData);
    } else if (compType.includes("CAPACITOR") || compType.includes("CAP")) {
      compMesh = this._createCapacitor(compData);
    }

    if (compMesh) {
      this.componentsGroup.add(compMesh);
      this.activeComponents.set(compData.id || `comp_${Date.now()}`, compMesh);
    }
    return compMesh;
  }

  _createDIP_IC(compData) {
    const THREE = window.THREE;
    const group = new THREE.Group();

    // Determine DIP pin count
    let pinCount = 8;
    if (compData.type.includes("14")) pinCount = 14;
    else if (compData.type.includes("16")) pinCount = 16;
    else if (compData.type.includes("20")) pinCount = 20;

    const numRows = pinCount / 2;
    const bodyLength = numRows * this.pinPitch;
    const bodyWidth = 0.38;
    const bodyHeight = 0.18;

    // Body
    const bodyGeo = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyHeight / 2 + 0.08;
    body.castShadow = true;
    group.add(body);

    // Notch circle on Pin 1 end (left side in local space)
    const notchGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.position.set(-bodyLength / 2 + 0.06, bodyHeight + 0.08, 0);
    group.add(notch);

    // Position group over starting row
    const startPinPos = this.getPinPosition(compData.from || compData.pin_start_left || "E10");
    if (startPinPos) {
      group.position.set(startPinPos.x + (bodyLength / 2) - 0.12, startPinPos.y, 0);
    }

    return group;
  }

  _createLED(compData) {
    const THREE = window.THREE;
    const group = new THREE.Group();

    const colorHex = this._resolveColor(compData.color || "red");

    // Epoxy Dome
    const domeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16);
    const capGeo = new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    const ledMat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.88,
      roughness: 0.1,
      transmission: 0.5
    });

    const cylinder = new THREE.Mesh(domeGeo, ledMat);
    cylinder.position.y = 0.16;
    const cap = new THREE.Mesh(capGeo, ledMat);
    cap.position.y = 0.27;

    group.add(cylinder);
    group.add(cap);

    // Position at anode
    const anodePos = this.getPinPosition(compData.from || compData.anode_pin || "E10");
    if (anodePos) group.position.copy(anodePos);

    return group;
  }

  _createResistor(compData) {
    const THREE = window.THREE;
    const fromPos = this.getPinPosition(compData.from || "C5");
    const toPos = this.getPinPosition(compData.to || "C10");

    const group = new THREE.Group();
    if (!fromPos || !toPos) return group;

    const midPos = fromPos.clone().lerp(toPos, 0.5);
    midPos.y += 0.12;

    // Resistor ceramic body
    const bodyGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.35, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd1b48c, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.copy(midPos);
    group.add(body);

    // Color multiplier bands
    const bandGeo = new THREE.CylinderGeometry(0.067, 0.067, 0.035, 12);
    const band1 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: 0xd97706 })); // Orange
    band1.rotation.z = Math.PI / 2;
    band1.position.set(midPos.x - 0.08, midPos.y, midPos.z);
    group.add(band1);

    const band2 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: 0xd97706 })); // Orange
    band2.rotation.z = Math.PI / 2;
    band2.position.set(midPos.x, midPos.y, midPos.z);
    group.add(band2);

    const band3 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: 0x92400e })); // Brown
    band3.rotation.z = Math.PI / 2;
    band3.position.set(midPos.x + 0.08, midPos.y, midPos.z);
    group.add(band3);

    return group;
  }

  _createTransistor(compData) {
    const THREE = window.THREE;
    const group = new THREE.Group();

    // TO-92 plastic package (D-shape)
    const geo = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16, 1, false, 0, Math.PI);
    const mat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.18;
    group.add(mesh);

    const pos = this.getPinPosition(compData.from || compData.emitter || "E12");
    if (pos) group.position.copy(pos);
    return group;
  }

  _createCapacitor(compData) {
    const THREE = window.THREE;
    const group = new THREE.Group();

    // Cylindrical aluminum can
    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.22;
    group.add(mesh);

    const pos = this.getPinPosition(compData.from || "C11");
    if (pos) group.position.copy(pos);
    return group;
  }

  /**
   * Node Illumination / Flashing Guide for Physical Build Mode
   */
  highlightPins(pinKeys, color = 0x38bdf8) {
    const THREE = window.THREE;
    this.clearHighlights();

    pinKeys.forEach(key => {
      const pos = this.getPinPosition(key);
      if (!pos) return;

      // Vertical beacon beacon pillar and pulsing ring
      const beaconGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.65
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(pos.x, pos.y + 0.4, pos.z);

      const ringGeo = new THREE.RingGeometry(0.05, 0.18, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(pos.x, pos.y + 0.02, pos.z);

      const group = new THREE.Group();
      group.add(beacon);
      group.add(ring);
      this.highlightsGroup.add(group);
      this.activeHighlights.push(group);
    });
  }

  clearHighlights() {
    this.activeHighlights.forEach(h => this.highlightsGroup.remove(h));
    this.activeHighlights = [];
  }

  clearAllWiresAndComponents() {
    this.activeWires.forEach(w => this.wiresGroup.remove(w));
    this.activeWires = [];

    this.activeComponents.forEach(c => this.componentsGroup.remove(c));
    this.activeComponents.clear();

    this.clearHighlights();
  }

  _resolveColor(colorName) {
    const colors = {
      red: 0xef4444,
      black: 0x1c1917,
      blue: 0x3b82f6,
      yellow: 0xeab308,
      green: 0x10b981,
      orange: 0xf97316,
      white: 0xf8fafc,
      beige: 0xd1b48c,
      darkgray: 0x27272a
    };
    return colors[String(colorName).toLowerCase()] || 0xef4444;
  }

  _startRenderLoop() {
    let clock = 0;
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      clock += 0.05;

      if (this.controls) this.controls.update();

      // Animate pulsing highlights in Physical Guide Mode
      if (this.activeHighlights.length > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(clock * 3.0);
        this.activeHighlights.forEach(h => {
          if (h.children[0]) {
            h.children[0].material.opacity = 0.3 + 0.5 * pulse;
            h.children[0].scale.y = 0.8 + 0.3 * pulse;
          }
        });
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener("resize", this._onResize.bind(this));
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}
