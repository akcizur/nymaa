import * as THREE from "three";
import "./style.css";

const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

const WORLD_SIZE = 100;
const HALF_WORLD = WORLD_SIZE / 2;
const PLAYER_SPEED = 7;
const PLAYER_RADIUS = 0.55;
const ENTER_RANGE = 4.2;

const BUILDING_TYPES = {
  HOUSE: { w: 10, h: 4, d: 10, color: 0x8f674f },
  OFFICE: { w: 12, h: 10, d: 12, color: 0x666f7d },
  SHOP: { w: 14, h: 5, d: 10, color: 0xa48b4b },
  WAREHOUSE: { w: 20, h: 6, d: 14, color: 0x707a83 },
  BLOCK: { w: 16, h: 16, d: 16, color: 0x525b69 }
};

const LAYOUT = [
  ["OFFICE", -10, -6],
  ["SHOP", 8, -8],
  ["HOUSE", -12, 8],
  ["OFFICE", 10, 8],
  ["HOUSE", -38, -35],
  ["WAREHOUSE", 0, -35],
  ["SHOP", 37, -35],
  ["OFFICE", -38, 35],
  ["BLOCK", -8, 35],
  ["SHOP", 10, 35],
  ["HOUSE", 37, 35],
  ["HOUSE", -37, 0],
  ["OFFICE", 37, 0]
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c10);

const renderer = new THREE.WebGLRenderer({
  antialias: !isTouch,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !isTouch;
if (!isTouch) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector("#game").appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);

scene.add(new THREE.HemisphereLight(0xc9d5df, 0x20252c, 1.45));

if (!isTouch) {
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.9);
  sun.position.set(34, 58, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -62;
  sun.shadow.camera.right = 62;
  sun.shadow.camera.top = 62;
  sun.shadow.camera.bottom = -62;
  sun.shadow.camera.far = 150;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
} else {
  const fill = new THREE.DirectionalLight(0xe6edf5, 0.8);
  fill.position.set(20, 40, 10);
  scene.add(fill);
}

function plane(width, depth, color, y = 0.01) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = !isTouch;
  scene.add(mesh);
}

plane(WORLD_SIZE, WORLD_SIZE, 0x38413b, 0);

plane(WORLD_SIZE, 10, 0x1b1f25, 0.02);
plane(WORLD_SIZE, 10, 0x1b1f25, 0.02);
scene.children[scene.children.length - 2].position.z = -20;
scene.children[scene.children.length - 1].position.z = 20;

plane(10, WORLD_SIZE, 0x1b1f25, 0.024);
plane(10, WORLD_SIZE, 0x1b1f25, 0.024);
scene.children[scene.children.length - 2].position.x = -25;
scene.children[scene.children.length - 1].position.x = 25;

const colliders = [];

function addBuilding(type, x, z) {
  const t = BUILDING_TYPES[type];
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(t.w, t.h, t.d),
    new THREE.MeshLambertMaterial({ color: t.color })
  );
  mesh.position.set(x, t.h / 2, z);
  mesh.castShadow = !isTouch;
  mesh.receiveShadow = !isTouch;
  scene.add(mesh);

  colliders.push({
    minX: x - t.w / 2,
    maxX: x + t.w / 2,
    minZ: z - t.d / 2,
    maxZ: z + t.d / 2
  });
}

for (const [type, x, z] of LAYOUT) addBuilding(type, x, z);

const player = new THREE.Group();

const playerBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.36, 0.72, 5, 8),
  new THREE.MeshLambertMaterial({ color: 0x4d89b4 })
);
playerBody.position.y = 0.72;
playerBody.castShadow = !isTouch;
player.add(playerBody);

const playerHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 12, 8),
  new THREE.MeshLambertMaterial({ color: 0xe6bd98 })
);
playerHead.position.y = 1.52;
playerHead.castShadow = !isTouch;
player.add(playerHead);

const playerMarker = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.16, 0.26),
  new THREE.MeshLambertMaterial({ color: 0x15202b })
);
playerMarker.position.set(0, 1.52, 0.3);
player.add(playerMarker);

player.position.set(0, 0, -20);
scene.add(player);

const car = new THREE.Group();
const carBody = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.7, 4.4),
  new THREE.MeshLambertMaterial({ color: 0xb94447 })
);
carBody.position.y = 0.75;
carBody.castShadow = !isTouch;
car.add(carBody);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 0.62, 2),
  new THREE.MeshLambertMaterial({ color: 0x27303b })
);
cabin.position.set(0, 1.4, -0.25);
cabin.castShadow = !isTouch;
car.add(cabin);

const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10);
wheelGeo.rotateZ(Math.PI / 2);
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x12151a });
for (const [x, z] of [[-1.02,1.45],[1.02,1.45],[-1.02,-1.45],[1.02,-1.45]]) {
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.position.set(x, 0.42, z);
  wheel.castShadow = !isTouch;
  car.add(wheel);
}

car.position.set(6, 0, -20);
scene.add(car);

const keys = new Set();
const touch = { x: 0, y: 0, active: false };
let enterEdge = false;
let driving = false;

const carState = {
  speed: 0,
  rotation: 0,
  maxSpeed: 24,
  maxReverse: 9,
  accel: 16,
  brake: 32,
  drag: 2.4
};

const clamp = THREE.MathUtils.clamp;

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function resolveCircle(pos, radius) {
  for (const c of colliders) {
    const closestX = clamp(pos.x, c.minX, c.maxX);
    const closestZ = clamp(pos.z, c.minZ, c.maxZ);
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const d2 = dx * dx + dz * dz;

    if (d2 >= radius * radius) continue;

    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      const push = radius - d;
      pos.x += (dx / d) * push;
      pos.z += (dz / d) * push;
    } else {
      const left = pos.x - c.minX;
      const right = c.maxX - pos.x;
      const back = pos.z - c.minZ;
      const front = c.maxZ - pos.z;
      const min = Math.min(left, right, back, front);
      if (min === left) pos.x = c.minX - radius;
      else if (min === right) pos.x = c.maxX + radius;
      else if (min === back) pos.z = c.minZ - radius;
      else pos.z = c.maxZ + radius;
    }
  }
}

const probe = new THREE.Vector3();

function resolveCar() {
  let total = 0;
  for (const offset of [1.35, -1.35]) {
    probe.set(
      car.position.x + Math.sin(car.rotation.y) * offset,
      0,
      car.position.z + Math.cos(car.rotation.y) * offset
    );

    const bx = probe.x;
    const bz = probe.z;
    resolveCircle(probe, 1.15);

    const dx = probe.x - bx;
    const dz = probe.z - bz;
    car.position.x += dx;
    car.position.z += dz;
    total += Math.hypot(dx, dz);
  }
  return total;
}

function clampWorld(pos, margin) {
  const limit = HALF_WORLD - margin;
  pos.x = clamp(pos.x, -limit, limit);
  pos.z = clamp(pos.z, -limit, limit);
}

function updatePlayer(dt) {
  let x = 0;
  let z = 0;

  if (keys.has("KeyW") || keys.has("ArrowUp")) z -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) z += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;

  if (touch.active) {
    x = touch.x;
    z = touch.y;
  }

  const len = Math.hypot(x, z);
  if (len > 0.04) {
    const scale = Math.min(1, len);
    x = (x / len) * scale;
    z = (z / len) * scale;

    player.position.x += x * PLAYER_SPEED * dt;
    player.position.z += z * PLAYER_SPEED * dt;

    const target = Math.atan2(x, z);
    player.rotation.y = lerpAngle(
      player.rotation.y,
      target,
      1 - Math.exp(-14 * dt)
    );
  }

  player.position.y = 0;
  resolveCircle(player.position, PLAYER_RADIUS);
  clampWorld(player.position, PLAYER_RADIUS + 0.1);
}

function updateCar(dt) {
  let throttle = 0;
  let steer = 0;

  if (keys.has("KeyW") || keys.has("ArrowUp")) throttle += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) throttle -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) steer += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) steer -= 1;

  if (touch.active) {
    throttle = -touch.y;
    steer = touch.x;
  }

  if (throttle > 0.04) {
    carState.speed += carState.accel * throttle * dt;
  } else if (throttle < -0.04) {
    if (carState.speed > 0.2) carState.speed -= carState.brake * Math.abs(throttle) * dt;
    else carState.speed -= carState.accel * Math.abs(throttle) * 0.6 * dt;
  } else {
    carState.speed -= carState.speed * carState.drag * dt;
    if (Math.abs(carState.speed) < 0.05) carState.speed = 0;
  }

  carState.speed = clamp(carState.speed, -carState.maxReverse, carState.maxSpeed);

  if (Math.abs(steer) > 0.04 && Math.abs(carState.speed) > 0.3) {
    const grip = Math.min(1, Math.abs(carState.speed) / 6);
    carState.rotation += steer * 2.2 * dt * grip * Math.sign(carState.speed);
  }

  car.rotation.y = carState.rotation;
  car.position.x += Math.sin(carState.rotation) * carState.speed * dt;
  car.position.z += Math.cos(carState.rotation) * carState.speed * dt;

  if (resolveCar() > 0.0008) carState.speed *= 0.3;
  clampWorld(car.position, 2.6);
}

function toggleVehicle() {
  if (!driving) {
    if (player.position.distanceTo(car.position) > ENTER_RANGE) return;
    driving = true;
    player.visible = false;
    carState.rotation = car.rotation.y;
  } else {
    driving = false;
    player.visible = true;

    const rightX = Math.cos(car.rotation.y);
    const rightZ = -Math.sin(car.rotation.y);
    player.position.set(
      car.position.x + rightX * 2.4,
      0,
      car.position.z + rightZ * 2.4
    );
    resolveCircle(player.position, PLAYER_RADIUS);
    clampWorld(player.position, PLAYER_RADIUS + 0.1);
  }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === "KeyE" && !keys.has("KeyE")) enterEdge = true;
  keys.add(e.code);
});

window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());

const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystick-knob");
const action = document.querySelector("#action");
const actionLabel = document.querySelector("#action-label");
const touchHint = document.querySelector(".touch-hint");

function setJoystick(clientX, clientY) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const radius = r.width * 0.37;
  let x = (clientX - cx) / radius;
  let y = (clientY - cy) / radius;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  touch.x = x;
  touch.y = y;
  knob.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
}

function resetJoystick() {
  touch.active = false;
  touch.x = 0;
  touch.y = 0;
  knob.style.transform = "translate(0,0)";
}

joystick.addEventListener("pointerdown", (e) => {
  touch.active = true;
  joystick.setPointerCapture(e.pointerId);
  setJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointermove", (e) => {
  if (touch.active) setJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);
joystick.addEventListener("lostpointercapture", resetJoystick);

action.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  enterEdge = true;
});

if (!isTouch) touchHint.hidden = true;

const stateEl = document.querySelector("#state");
const prompt = document.querySelector("#prompt");

function updateUI() {
  if (driving) {
    stateEl.textContent = "DRIVING";
    action.hidden = !isTouch;
    actionLabel.textContent = "EXIT";
    prompt.hidden = false;
    prompt.textContent = isTouch ? "EXIT CAR" : "[E] EXIT CAR";
  } else {
    stateEl.textContent = "ON FOOT";
    const near = player.position.distanceTo(car.position) < ENTER_RANGE;
    action.hidden = !isTouch || !near;
    actionLabel.textContent = "ENTER";
    prompt.hidden = !near;
    prompt.textContent = isTouch ? "ENTER CAR" : "[E] ENTER CAR";
  }
}

const camFocus = new THREE.Vector3(0, 0, -20);
const camDesired = new THREE.Vector3();
const camLook = new THREE.Vector3();

const CAMERA = {
  foot: { dist: 13, height: 19, lookAhead: 0 },
  driving: { dist: 16, height: 23, lookAhead: 4.5 }
};

function updateCamera(dt, first = false) {
  const cfg = driving ? CAMERA.driving : CAMERA.foot;
  const subject = driving ? car : player;
  const tx = subject.position.x + (driving ? Math.sin(carState.rotation) * cfg.lookAhead : 0);
  const tz = subject.position.z + (driving ? Math.cos(carState.rotation) * cfg.lookAhead : 0);

  const focusLerp = first ? 1 : 1 - Math.exp(-7 * dt);
  camFocus.x += (tx - camFocus.x) * focusLerp;
  camFocus.z += (tz - camFocus.z) * focusLerp;

  camDesired.set(camFocus.x, cfg.height, camFocus.z + cfg.dist);
  camera.position.lerp(camDesired, first ? 1 : 1 - Math.exp(-6 * dt));
  if (camera.position.y < 6) camera.position.y = 6;

  camLook.set(camFocus.x, 1, camFocus.z);
  camera.lookAt(camLook);
}

const clock = new THREE.Clock();
let firstFrame = true;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (enterEdge) {
    toggleVehicle();
    enterEdge = false;
  }

  if (driving) updateCar(dt);
  else updatePlayer(dt);

  updateCamera(dt, firstFrame);
  updateUI();
  renderer.render(scene, camera);
  firstFrame = false;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateCamera(0, true);
animate();
