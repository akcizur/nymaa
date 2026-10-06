import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const SAVE_KEY = 'nymaa-post-catastrophe-mvp-v1';
const WORLD = 100;
const HALF = WORLD / 2;
const PLAYER_R = 0.42;
const INTERACT_R = 3.0;
const GAME_MINUTES_PER_SECOND = 2.5;
const MAX_INVENTORY = 14;
const PLAYER_HEIGHT = 1.8;
const WALK_SPEED = 4.2;
const RUN_SPEED = 7.2;
const WALK_ANIM_SPEED = 4.2;
const RUN_ANIM_SPEED = 7.2;

const ITEM = {
  water: { label: 'WATER', weight: 1 },
  food: { label: 'FOOD', weight: 1 },
  medicine: { label: 'MEDICINE', weight: 1 },
  wood: { label: 'WOOD', weight: 2 },
  scrap: { label: 'SCRAP', weight: 1 },
  dirtyWater: { label: 'DIRTY WATER', weight: 1 },
};

const RECIPES = [
  { id: 'campfire', label: 'CAMPFIRE', kind: 'building', cost: { wood: 6, scrap: 2 }, slot: 'campfire', benefit: 'restores health near base' },
  { id: 'storageBox', label: 'STORAGE BOX', kind: 'building', cost: { wood: 8, scrap: 4 }, slot: 'storageBox', benefit: 'storage capacity 40 → 100' },
  { id: 'bed', label: 'BED', kind: 'building', cost: { wood: 8, scrap: 2 }, slot: 'bed', benefit: 'sleep until morning + full health' },
  { id: 'waterFilter', label: 'WATER FILTER', kind: 'building', cost: { wood: 5, scrap: 6 }, slot: 'waterFilter', benefit: 'convert dirty water at base' },
  { id: 'axe', label: 'BASIC AXE', kind: 'item', cost: { wood: 3, scrap: 3 }, item: 'axe', benefit: 'required for wood nodes' },
  { id: 'tool', label: 'BASIC TOOL', kind: 'item', cost: { wood: 4, scrap: 5 }, item: 'tool', benefit: 'required for heavy scrap nodes' },
];

const BUILDINGS = [
  [-10, -7, 12, 10, 12, 0x6d7887],
  [9, -8, 12, 6, 9, 0xb28b47],
  [-12, 8, 11, 5, 10, 0x9d6a4f],
  [12, 8, 12, 11, 12, 0x6d7887],
  [-38, -34, 10, 4, 10, 0x9d6a4f],
  [34, -34, 14, 5, 10, 0xb28b47],
  [-38, 34, 12, 9, 12, 0x6d7887],
  [-8, 34, 16, 17, 16, 0x596472],
  [10, 35, 14, 5, 10, 0xb28b47],
  [36, 34, 10, 4, 10, 0x9d6a4f],
  [-37, 0, 10, 4, 10, 0x9d6a4f],
  [37, 0, 12, 12, 12, 0x6d7887],
  [-36, -4, 8, 4, 8, 0x7a6655],
  [33, 10, 8, 4, 8, 0x7a6655],
];

const LOOT_SEEDS = [
  { id: 'crate-a', x: -31, z: -30, label: 'ABANDONED CACHE', items: { water: 2, food: 1, scrap: 2 } },
  { id: 'crate-b', x: -31, z: -11, label: 'KITCHEN', items: { food: 2, medicine: 1, dirtyWater: 2 } },
  { id: 'crate-c', x: 24, z: -12, label: 'WORKSHOP', items: { scrap: 5, wood: 2 } , requires: 'tool' },
  { id: 'crate-d', x: 28, z: 28, label: 'FOREST EDGE', items: { wood: 6 }, requires: 'axe' },
  { id: 'crate-e', x: -27, z: 29, label: 'CLINIC', items: { medicine: 2, water: 2, food: 1 } },
  { id: 'crate-f', x: 33, z: -35, label: 'GARAGE', items: { scrap: 6, wood: 2 }, requires: 'tool' },
  { id: 'crate-g', x: -7, z: 23, label: 'DRAINAGE', items: { dirtyWater: 5, scrap: 1 } },
];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x182019, 0.009);
const bgCanvas = document.createElement('canvas');
bgCanvas.width = 2; bgCanvas.height = 256;
const bgctx = bgCanvas.getContext('2d');
const bgGrad = bgctx.createLinearGradient(0, 0, 0, 256);
bgGrad.addColorStop(0, '#1c2520');
bgGrad.addColorStop(1, '#101512');
bgctx.fillStyle = bgGrad; bgctx.fillRect(0, 0, 2, 256);
scene.background = new THREE.CanvasTexture(bgCanvas);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 400);
const ambient = new THREE.AmbientLight(0x9cafb1, 1.35);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff0cf, 2.15);
sun.position.set(40, 65, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { near: 1, far: 190, left: -60, right: 60, top: 60, bottom: -60 });
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD, WORLD),
  new THREE.MeshLambertMaterial({ color: 0x27352c })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(WORLD, 50, 0x1e2b22, 0x1e2b22);
grid.position.y = 0.005;
scene.add(grid);

const roadMat = new THREE.MeshLambertMaterial({ color: 0x1a1d20 });
const dashMat = new THREE.MeshBasicMaterial({ color: 0x9ca8af });
function addRoad(w, d, x, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.02, z);
  m.receiveShadow = true;
  scene.add(m);
}
function addDashes(axis, fixed) {
  const geo = axis === 'x' ? new THREE.PlaneGeometry(4, 0.28) : new THREE.PlaneGeometry(0.28, 4);
  for (let v = -45; v <= 45; v += 10) {
    const m = new THREE.Mesh(geo, dashMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(axis === 'x' ? v : fixed, 0.028, axis === 'x' ? fixed : v);
    scene.add(m);
  }
}
addRoad(WORLD, 9, 0, -20);
addRoad(WORLD, 9, 0, 20);
addRoad(9, WORLD, -25, 0);
addRoad(9, WORLD, 25, 0);
addDashes('x', -20);
addDashes('x', 20);
addDashes('z', -25);
addDashes('z', 25);

const colliders = [];
const mat = (color) => new THREE.MeshLambertMaterial({ color });

for (const [x, z, w, h, d, color] of BUILDINGS) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const windows = new THREE.MeshBasicMaterial({ color: 0xccc38a });
  for (let y = 2.0; y < h - 0.7; y += 2.7) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.16, d + 0.05), windows);
    strip.position.y = y;
    g.add(strip);
  }
  scene.add(g);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

const baseCenter = new THREE.Vector3(0, 0, -39);
const baseSize = { x: 18, z: 10 };
const baseFloor = new THREE.Mesh(
  new THREE.BoxGeometry(baseSize.x, 0.25, baseSize.z),
  new THREE.MeshLambertMaterial({ color: 0x37433a })
);
baseFloor.position.set(baseCenter.x, 0.12, baseCenter.z);
baseFloor.receiveShadow = true;
scene.add(baseFloor);

const baseWallMat = mat(0x3d473f);
for (const [w, d, x, z, y] of [
  [18, 0.5, 0, -44, 1.25],
  [6.0, 0.5, -6, -34, 1.25], [6.0, 0.5, 6, -34, 1.25],
  [0.5, 10, -9, -39, 1.25], [0.5, 10, 9, -39, 1.25],
]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 2.5, d), baseWallMat);
  wall.position.set(x, y, z);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(wall);
}
const baseMarker = new THREE.Mesh(
  new THREE.CylinderGeometry(4.2, 4.2, 0.12, 32),
  new THREE.MeshBasicMaterial({ color: 0x55745d, transparent: true, opacity: 0.35 })
);
baseMarker.position.set(baseCenter.x, 0.08, baseCenter.z);
scene.add(baseMarker);

for (const [w, d, x, z] of [
  [WORLD, 1, 0, -HALF], [WORLD, 1, 0, HALF],
  [1, WORLD, -HALF, 0], [1, WORLD, HALF, 0],
]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3, d), mat(0x2d3530));
  wall.position.set(x, 1.5, z);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(wall);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

// Player — animated rigged GLB
const player = new THREE.Group();
player.position.set(0, 0, -39);
player.rotation.y = Math.PI;
scene.add(player);

let playerMixer = null;
let playerActions = new Map();
let playerAction = '';
let playerModel = null;
let playerLoaded = false;

const PLAYER_MODEL_URL = `${import.meta.env.BASE_URL}assets/player/demo-avatar.glb`;

function playPlayerAnimation(name, movementSpeed = 0, fade = 0.16) {
  if (!playerMixer || !playerActions.size) return;

  const clipName = playerActions.has(name) ? name : 'Idle';
  const wanted = playerActions.get(clipName);
  if (!wanted) return;

  const referenceSpeed =
    clipName === 'Run' ? RUN_ANIM_SPEED :
    clipName === 'Walk' ? WALK_ANIM_SPEED : 1;

  const timeScale = clipName === 'Idle'
    ? 1
    : THREE.MathUtils.clamp(movementSpeed / referenceSpeed, 0.72, 1.35);

  wanted.setEffectiveTimeScale(timeScale);
  wanted.setEffectiveWeight(1);

  if (playerAction === clipName) return;

  const previous = playerActions.get(playerAction);
  wanted.reset().fadeIn(fade).play();
  if (previous) previous.fadeOut(fade);
  playerAction = clipName;
}

async function loadPlayerModel() {
  const loader = new GLTFLoader();
  await new Promise((resolve, reject) => {
    loader.load(PLAYER_MODEL_URL, (gltf) => {
      const root = gltf.scene;

      root.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              material.metalness = Math.min(material.metalness ?? 0, 0.15);
              material.roughness = Math.max(material.roughness ?? 0.55, 0.55);
            }
          }
        }
      });

      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      if (size.y > 0.001) root.scale.setScalar(PLAYER_HEIGHT / size.y);

      const fittedBounds = new THREE.Box3().setFromObject(root);
      root.position.y -= fittedBounds.min.y;

      player.add(root);
      playerModel = root;

      playerMixer = new THREE.AnimationMixer(root);
      playerActions = new Map(
        gltf.animations.map((clip) => [clip.name, playerMixer.clipAction(clip)])
      );

      playPlayerAnimation('Idle', 0);
      playerLoaded = true;
      document.getElementById('load')?.remove();
      resolve();
    }, reject);
  });
}

loadPlayerModel().catch((error) => {
  console.error('PLAYER MODEL', error);
  document.getElementById('load').textContent = 'PLAYER MODEL ERROR';
});

// Loot
const lootObjects = new Map();
const lootState = Object.fromEntries(LOOT_SEEDS.map((s) => [s.id, true]));
const crateMat = mat(0x8f6b3d);
for (const seed of LOOT_SEEDS) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.1), crateMat);
  box.position.y = 0.45;
  box.castShadow = true;
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: 0xc9b070 }));
  band.position.set(0, 0.58, 0.56);
  g.add(box, band);
  g.position.set(seed.x, 0, seed.z);
  scene.add(g);
  lootObjects.set(seed.id, g);
}

// Base build objects
const buildObjects = new Map();
const BUILD_POS = {
  campfire: new THREE.Vector3(-5.2, 0, -39),
  storageBox: new THREE.Vector3(-1.7, 0, -40.8),
  bed: new THREE.Vector3(3.4, 0, -40.2),
  waterFilter: new THREE.Vector3(5.2, 0, -36.7),
};
function rebuildBaseVisuals(buildings) {
  for (const g of buildObjects.values()) scene.remove(g);
  buildObjects.clear();
  if (buildings.campfire) {
    const g = new THREE.Group();
    const stones = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.28, 10), mat(0x4a4d4b));
    stones.position.y = 0.14;
    g.add(stones);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.25, 8), new THREE.MeshBasicMaterial({ color: 0xff9b38 }));
    fire.position.y = 0.78;
    g.add(fire);
    g.position.copy(BUILD_POS.campfire);
    scene.add(g);
    buildObjects.set('campfire', g);
  }
  if (buildings.storageBox) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 1.45), mat(0x6b5137));
    g.position.copy(BUILD_POS.storageBox); g.position.y = 0.58;
    g.castShadow = true; scene.add(g); buildObjects.set('storageBox', g);
  }
  if (buildings.bed) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 3.0), mat(0x574532));
    frame.position.y = 0.16;
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, 2.65), mat(0x6f7d72));
    blanket.position.y = 0.45;
    g.add(frame, blanket); g.position.copy(BUILD_POS.bed);
    scene.add(g); buildObjects.set('bed', g);
  }
  if (buildings.waterFilter) {
    const g = new THREE.Group();
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.25, 12), mat(0x6b7771));
    tank.position.y = 0.62;
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), mat(0xb3b5ad));
    pipe.position.set(0.55, 0.55, 0);
    g.add(tank, pipe); g.position.copy(BUILD_POS.waterFilter);
    scene.add(g); buildObjects.set('waterFilter', g);
  }
}

// State
const defaultState = () => ({
  time: 8 * 60,
  health: 100,
  hunger: 100,
  thirst: 100,
  player: { x: 0, z: -39, rot: Math.PI },
  inventory: { water: 2, food: 1, medicine: 1, wood: 0, scrap: 0, dirtyWater: 0 },
  storage: { water: 6, food: 4, medicine: 2, wood: 8, scrap: 6, dirtyWater: 0 },
  tools: { axe: false, tool: false },
  buildings: { campfire: false, storageBox: false, bed: false, waterFilter: false },
  loot: { ...lootState },
});
let state = defaultState();
rebuildBaseVisuals(state.buildings);
for (const [id, visible] of Object.entries(state.loot)) lootObjects.get(id).visible = visible;

// Input
const keys = new Set();
const touchAxis = { x: 0, z: 0 };
let actionQueued = false;
const onKey = (e, down) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if (down && e.repeat) return;
  if (down && e.code === 'KeyE') actionQueued = true;
  if (down && e.code === 'KeyI') togglePanel('inventory');
  if (down && e.code === 'KeyC' && nearBase()) togglePanel('craft');
  if (down && e.code === 'KeyB' && nearBase()) togglePanel('base');
  if (down && e.code === 'KeyR') resetGame();
  if (down && e.code === 'KeyL') loadGame(true);
  if (down && e.code === 'KeyK') saveGame(true);
  down ? keys.add(e.code) : keys.delete(e.code);
};
addEventListener('keydown', e => onKey(e, true));
addEventListener('keyup', e => onKey(e, false));
addEventListener('blur', () => keys.clear());

const touch = document.getElementById('touch');
if (matchMedia('(pointer: coarse)').matches) touch.classList.remove('hidden');
const stick = document.getElementById('stick');
const knob = stick.querySelector('span');
let pointerId = null;
function updateStick(clientX, clientY) {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const max = r.width * .36;
  let dx = clientX - cx, dy = clientY - cy;
  const d = Math.hypot(dx, dy);
  if (d > max) { dx = dx / d * max; dy = dy / d * max; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  touchAxis.x = dx / max;
  touchAxis.z = -dy / max;
}
stick.addEventListener('pointerdown', e => { pointerId = e.pointerId; stick.setPointerCapture(pointerId); updateStick(e.clientX, e.clientY); });
stick.addEventListener('pointermove', e => { if (e.pointerId === pointerId) updateStick(e.clientX, e.clientY); });
stick.addEventListener('pointerup', e => { if (e.pointerId === pointerId) { pointerId = null; touchAxis.x = touchAxis.z = 0; knob.style.transform = 'translate(0,0)'; } });
stick.addEventListener('pointercancel', () => { pointerId = null; touchAxis.x = touchAxis.z = 0; knob.style.transform = 'translate(0,0)'; });
document.getElementById('touch-interact').addEventListener('pointerdown', () => { actionQueued = true; });
document.getElementById('touch-inventory').addEventListener('pointerdown', () => togglePanel('inventory'));

// UI
const panels = ['inventory','craft','base'];
function togglePanel(name) {
  const el = document.getElementById(name);
  const opening = el.classList.contains('hidden');
  for (const p of panels) if (p !== name) document.getElementById(p).classList.add('hidden');
  el.classList.toggle('hidden', !opening);
  renderUI();
}
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => document.getElementById(b.dataset.close).classList.add('hidden')));
const messageEl = document.getElementById('message');
let messageTimer = 0;
function message(text, ms = 2200) {
  messageEl.textContent = text;
  messageEl.classList.add('show');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageEl.classList.remove('show'), ms);
}
function setBar(id, value) {
  document.getElementById(id).style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function invWeight() {
  return Object.entries(state.inventory).reduce((sum, [key, amount]) => sum + (ITEM[key]?.weight || 0) * amount, 0);
}
function storageCapacity() { return state.buildings.storageBox ? 100 : 40; }
function storageWeight() {
  return Object.entries(state.storage).reduce((sum, [key, amount]) => sum + (ITEM[key]?.weight || 0) * amount, 0);
}
function canCarry(items) {
  return invWeight() + Object.entries(items).reduce((sum, [key, amount]) => sum + (ITEM[key]?.weight || 0) * amount, 0) <= MAX_INVENTORY;
}
function addInventory(items) {
  if (!canCarry(items)) return false;
  for (const [key, amount] of Object.entries(items)) state.inventory[key] = (state.inventory[key] || 0) + amount;
  return true;
}
function consumeInventory(key, amount = 1) {
  if ((state.inventory[key] || 0) < amount) return false;
  state.inventory[key] -= amount;
  return true;
}

function nearBase() {
  return Math.hypot(player.position.x - baseCenter.x, player.position.z - baseCenter.z) <= 6.2;
}
function nearestLoot() {
  let best = null, dist = Infinity;
  for (const seed of LOOT_SEEDS) {
    if (!state.loot[seed.id]) continue;
    const d = Math.hypot(player.position.x - seed.x, player.position.z - seed.z);
    if (d < dist) { best = seed; dist = d; }
  }
  return best && dist <= INTERACT_R ? { seed: best, dist } : null;
}
function nearestBuild() {
  let best = null, dist = Infinity;
  for (const [slot, pos] of Object.entries(BUILD_POS)) {
    if (!state.buildings[slot]) continue;
    const d = Math.hypot(player.position.x - pos.x, player.position.z - pos.z);
    if (d < dist) { best = slot; dist = d; }
  }
  return best && dist <= 2.7 ? { slot: best, dist } : null;
}

function action() {
  const loot = nearestLoot();
  if (loot) {
    const { seed } = loot;
    if (seed.requires && !state.tools[seed.requires]) {
      message(`${seed.label}: potřebuješ ${seed.requires === 'axe' ? 'AXE' : 'TOOL'}.`);
      return;
    }
    if (!canCarry(seed.items)) {
      message('BACKPACK FULL — vrať se na základnu.');
      return;
    }
    addInventory(seed.items);
    state.loot[seed.id] = false;
    lootObjects.get(seed.id).visible = false;
    message(`SCAVENGED: ${seed.label}`);
    updateObjective();
    saveGame(false);
    return;
  }

  if (nearBase()) {
    document.getElementById('base').classList.remove('hidden');
    for (const p of ['inventory','craft']) document.getElementById(p).classList.add('hidden');
    renderUI();
    return;
  }

  const build = nearestBuild();
  if (build?.slot === 'campfire') {
    state.health = Math.min(100, state.health + 10);
    message('CAMPFIRE: odpočinek +10 HEALTH.');
    return;
  }
  if (build?.slot === 'waterFilter' && state.buildings.waterFilter) {
    const dirty = state.inventory.dirtyWater || 0;
    if (!dirty) { message('Nemáš DIRTY WATER.'); return; }
    state.inventory.dirtyWater = 0;
    state.inventory.water += dirty;
    message(`FILTERED: +${dirty} WATER.`);
    return;
  }

  message('Nic použitelného není dost blízko.');
}

function useItem(item) {
  let changed = false;
  if (item === 'food' && consumeInventory('food')) {
    state.hunger = Math.min(100, state.hunger + 34);
    message('FOOD consumed.');
    changed = true;
  } else if (item === 'water' && consumeInventory('water')) {
    state.thirst = Math.min(100, state.thirst + 44);
    message('WATER consumed.');
    changed = true;
  } else if (item === 'medicine' && consumeInventory('medicine')) {
    state.health = Math.min(100, state.health + 35);
    message('MEDICINE used.');
    changed = true;
  } else {
    message('Nedostatek zásoby.');
  }
  if (changed) saveGame(false);
  renderUI();
}

function canAfford(cost) {
  return Object.entries(cost).every(([key, amount]) => (state.storage[key] || 0) >= amount);
}
function spendStorage(cost) {
  for (const [key, amount] of Object.entries(cost)) state.storage[key] -= amount;
}
function craft(id) {
  const recipe = RECIPES.find(r => r.id === id);
  if (!recipe || !nearBase()) {
    message('Crafting/building probíhá na základně.');
    return;
  }
  if (recipe.kind === 'building' && state.buildings[recipe.slot]) {
    message('Tento slot už je postavený.');
    return;
  }
  if (recipe.kind === 'item' && state.tools[recipe.item]) {
    message('Tento nástroj už máš.');
    return;
  }
  if (!canAfford(recipe.cost)) {
    message('Nedostatek materiálu ve STORAGE.');
    return;
  }
  spendStorage(recipe.cost);
  if (recipe.kind === 'building') {
    state.buildings[recipe.slot] = true;
    rebuildBaseVisuals(state.buildings);
    message(`BUILT: ${recipe.label}`);
  } else {
    state.tools[recipe.item] = true;
    message(`CRAFTED: ${recipe.label}`);
  }
  saveGame(false);
  renderUI();
  updateObjective();
}

function storeAll() {
  if (!nearBase()) { message('Musíš být na základně.'); return; }
  for (const key of Object.keys(state.inventory)) {
    const amount = state.inventory[key] || 0;
    const available = Math.min(amount, Math.floor((storageCapacity() - storageWeight()) / (ITEM[key]?.weight || 1)));
    if (available > 0) {
      state.inventory[key] -= available;
      state.storage[key] = (state.storage[key] || 0) + available;
    }
  }
  message('BACKPACK → STORAGE');
  saveGame(false);
  renderUI();
  updateObjective();
}

function filterStoredWater() {
  if (!state.buildings.waterFilter) return;
  const dirty = state.storage.dirtyWater || 0;
  if (!dirty) { message('Žádná DIRTY WATER ve storage.'); return; }
  state.storage.dirtyWater = 0;
  state.storage.water += dirty;
  message(`FILTERED: +${dirty} WATER`);
  saveGame(false);
  renderUI();
}

function rest() {
  if (!nearBase()) {
    message('Musíš být na základně.');
    return;
  }
  if (state.buildings.bed) {
    const now = state.time;
    let nextMorning = 6 * 60;
    if (now >= nextMorning) nextMorning += 24 * 60;
    state.time = nextMorning;
    state.health = 100;
    state.hunger = Math.max(0, state.hunger - 12);
    state.thirst = Math.max(0, state.thirst - 18);
    message('SLEEP — nový den. Zkontroluj FOOD/WATER.');
  } else if (state.buildings.campfire) {
    state.health = Math.min(100, state.health + 10);
    message('CAMPFIRE REST — HEALTH +10.');
  } else {
    message('Postav CAMPFIRE nebo BED.');
  }
  saveGame(false);
  renderUI();
}

function saveGame(show = true) {
  const data = {
    ...state,
    player: { x: player.position.x, z: player.position.z, rot: player.rotation.y },
    loot: { ...state.loot },
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (show) message('GAME SAVED');
}
function loadGame(show = true) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { message('Žádný save.'); return; }
  try {
    const saved = JSON.parse(raw);
    state = { ...defaultState(), ...saved,
      player: { ...defaultState().player, ...saved.player },
      inventory: { ...defaultState().inventory, ...saved.inventory },
      storage: { ...defaultState().storage, ...saved.storage },
      tools: { ...defaultState().tools, ...saved.tools },
      buildings: { ...defaultState().buildings, ...saved.buildings },
      loot: { ...defaultState().loot, ...saved.loot },
    };
    player.position.set(state.player.x, 0, state.player.z);
    player.rotation.y = state.player.rot;
    rebuildBaseVisuals(state.buildings);
    for (const [id, visible] of Object.entries(state.loot)) lootObjects.get(id).visible = visible;
    renderUI();
    if (show) message('GAME LOADED');
  } catch {
    message('SAVE DATA CORRUPTED.');
  }
}
function resetGame() {
  if (!confirm('Resetovat celý MVP save?')) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  player.position.set(0, 0, -39);
  player.rotation.y = Math.PI;
  rebuildBaseVisuals(state.buildings);
  for (const [id, visible] of Object.entries(state.loot)) lootObjects.get(id).visible = visible;
  for (const p of panels) document.getElementById(p).classList.add('hidden');
  renderUI();
  updateObjective();
  message('NEW GAME');
}

document.getElementById('store-all').addEventListener('click', storeAll);
document.getElementById('rest-button').addEventListener('click', rest);
document.getElementById('save-button').addEventListener('click', () => saveGame(true));
document.getElementById('load-button').addEventListener('click', () => loadGame(true));

function renderUI() {
  setBar('health', state.health);
  setBar('hunger', state.hunger);
  setBar('thirst', state.thirst);
  const h = Math.floor((state.time % 1440) / 60);
  const m = Math.floor(state.time % 60);
  document.getElementById('clock').textContent = [h, m].map(v => String(v).padStart(2,'0')).join(':');
  const hour = h + m / 60;
  const phase = hour < 7 || hour >= 22 ? 'NIGHT' : hour < 9 ? 'MORNING' : hour < 18 ? 'DAY' : 'EVENING';
  document.getElementById('phase').textContent = phase;

  const inv = document.getElementById('inventory-list');
  inv.innerHTML = '';
  for (const [key, def] of Object.entries(ITEM)) {
    const amount = state.inventory[key] || 0;
    if (!amount) continue;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div><strong>${def.label}</strong><small>${amount} unit(s)</small></div><div class="actions"></div>`;
    if (['food','water','medicine'].includes(key)) {
      const b = document.createElement('button');
      b.textContent = key === 'food' ? 'EAT' : key === 'water' ? 'DRINK' : 'USE';
      b.addEventListener('click', () => useItem(key));
      row.querySelector('.actions').appendChild(b);
    }
    inv.appendChild(row);
  }
  if (!inv.children.length) inv.innerHTML = '<div class="row"><span>EMPTY</span></div>';
  document.getElementById('inventory-capacity').textContent = `CAPACITY ${invWeight()} / ${MAX_INVENTORY}`;

  const recipes = document.getElementById('recipe-list');
  recipes.innerHTML = '';
  for (const recipe of RECIPES) {
    const row = document.createElement('div');
    row.className = 'recipe';
    const cost = Object.entries(recipe.cost).map(([k,v]) => `${ITEM[k]?.label || k} ${v}`).join(' · ');
    const done = recipe.kind === 'building' ? state.buildings[recipe.slot] : state.tools[recipe.item];
    row.innerHTML = `<strong>${recipe.label}</strong><div class="cost">${cost}</div><small>${recipe.benefit}</small>`;
    const b = document.createElement('button');
    b.textContent = done ? 'BUILT / OWNED' : 'CRAFT';
    b.disabled = !!done || !nearBase() || !canAfford(recipe.cost);
    b.style.marginTop = '8px';
    b.addEventListener('click', () => craft(recipe.id));
    row.appendChild(b);
    recipes.appendChild(row);
  }

  const storage = document.getElementById('storage-list');
  storage.innerHTML = '';
  for (const [key, def] of Object.entries(ITEM)) {
    const amount = state.storage[key] || 0;
    if (!amount) continue;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${def.label}</span><strong>${amount}</strong>`;
    storage.appendChild(row);
  }
  document.getElementById('storage-list').insertAdjacentHTML('beforeend',
    `<div class="row"><small>CAPACITY</small><strong>${storageWeight()} / ${storageCapacity()}</strong></div>`);

  const builds = document.getElementById('build-list');
  builds.innerHTML = '';
  for (const [key, label] of [
    ['campfire','CAMPFIRE'],
    ['storageBox','STORAGE BOX'],
    ['bed','BED'],
    ['waterFilter','WATER FILTER'],
  ]) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${label}</span><strong>${state.buildings[key] ? 'READY' : 'EMPTY'}</strong>`;
    builds.appendChild(row);
  }
  const filterBtn = document.createElement('button');
  filterBtn.textContent = 'FILTER STORED WATER';
  filterBtn.disabled = !state.buildings.waterFilter || !(state.storage.dirtyWater > 0);
  filterBtn.style.margin = '0 10px 10px';
  filterBtn.addEventListener('click', filterStoredWater);
  document.getElementById('storage-list').appendChild(filterBtn);
}

function updateObjective() {
  const hasLoot = Object.values(state.loot).some(Boolean);
  const low = state.thirst < 35 || state.hunger < 35;
  let text = 'VYDEJ SE NA EXPEDICI A PROHLEDEJ OPUSŤENÁ MÍSTA.';
  if (low) text = state.thirst < 35 ? 'THIRST LOW — najdi WATER a vrať se domů.' : 'HUNGER LOW — najdi FOOD a vrať se domů.';
  else if (!hasLoot) text = 'SVĚT JE PROHLEDANÝ — vrať suroviny do STORAGE.';
  else if (nearBase()) text = 'ZKONTROLUJ STORAGE → CRAFT / BUILD → DALŠÍ EXPEDICE.';
  document.getElementById('objective').textContent = text;
}

function updateHint() {
  const hint = document.getElementById('hint');
  const loot = nearestLoot();
  let text = '';
  if (loot) text = `E — ${loot.seed.label}${loot.seed.requires ? ` · requires ${loot.seed.requires.toUpperCase()}` : ''}`;
  else if (nearBase()) text = 'E — BASE · C — CRAFT / BUILD';
  else if (state.buildings.campfire || state.buildings.waterFilter) {
    const build = nearestBuild();
    if (build) text = `E — ${build.slot.toUpperCase()}`;
  }
  hint.textContent = text;
  hint.classList.toggle('hidden', !text);
}

const focus = new THREE.Vector3(0, 0, -39);
let camYaw = Math.PI;
let flashClock = 0;
const clock = new THREE.Clock();

function getInput() {
  let x = touchAxis.x, z = touchAxis.z;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z -= 1;
  const d = Math.hypot(x, z);
  return d > 1 ? { x: x / d, z: z / d, mag: 1 } : { x, z, mag: d };
}

function isRunning() {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}
function pushOut(p, r) {
  for (let pass = 0; pass < 2; pass++) {
    let hit = false;
    for (const c of colliders) {
      const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      hit = true;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2), k = (r - d) / d;
        p.x += dx * k; p.z += dz * k;
      } else {
        const dl = p.x - c.minX, dr = c.maxX - p.x, db = p.z - c.minZ, df = c.maxZ - p.z;
        const m = Math.min(dl, dr, db, df);
        if (m === dl) p.x = c.minX - r;
        else if (m === dr) p.x = c.maxX + r;
        else if (m === db) p.z = c.minZ - r;
        else p.z = c.maxZ + r;
      }
    }
    if (!hit) break;
  }
}
function clampWorld() {
  const m = PLAYER_R + 0.15;
  player.position.x = THREE.MathUtils.clamp(player.position.x, -HALF + m, HALF - m);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -HALF + m, HALF - m);
}

function updatePlayer(dt) {
  const input = getInput();

  if (!input.mag) {
    playPlayerAnimation('Idle');
    return;
  }

  // Camera-relative world direction.
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
  const rx = -fz, rz = fx;
  const wx = input.z * fx + input.x * rx;
  const wz = input.z * fz + input.x * rz;

  const survivalPenalty = Math.min(state.hunger, state.thirst) < 30 ? 0.82 : 1;
  const running = isRunning();
  const speed = (running ? RUN_SPEED : WALK_SPEED) * survivalPenalty;

  player.position.x += wx * speed * dt;
  player.position.z += wz * speed * dt;
  pushOut(player.position, PLAYER_R);
  clampWorld();

  // Character forward = actual travel direction. No extra model rotation.
  const targetYaw = Math.atan2(wx, wz);
  const delta = Math.atan2(
    Math.sin(targetYaw - player.rotation.y),
    Math.cos(targetYaw - player.rotation.y)
  );
  player.rotation.y += delta * (1 - Math.exp(-16 * dt));

  playPlayerAnimation(running ? 'Run' : 'Walk', speed);
}

function updateSurvival(dt) {
  state.hunger = Math.max(0, state.hunger - dt * 0.11);
  state.thirst = Math.max(0, state.thirst - dt * 0.17);
  if (state.hunger <= 8 || state.thirst <= 8) state.health = Math.max(0, state.health - dt * 0.42);
  if (state.health <= 0) {
    message('YOU COLLAPSED — respawn at base.', 3500);
    player.position.set(0,0,-39);
    state.health = 55;
    state.hunger = 35;
    state.thirst = 45;
  }
  state.time = (state.time + dt * GAME_MINUTES_PER_SECOND) % 1440;
}

function updateLighting() {
  const t = state.time / 1440;
  const sunAngle = t * Math.PI * 2 - Math.PI / 2;
  const daylight = Math.max(0, Math.sin(sunAngle));
  const night = 1 - daylight;
  sun.position.set(Math.cos(t * Math.PI * 2) * 45, 25 + daylight * 50, Math.sin(t * Math.PI * 2) * 35);
  sun.intensity = 0.35 + daylight * 2.0;
  ambient.intensity = 0.52 + daylight * 1.0;
  scene.fog.density = 0.007 + night * 0.007;
  document.body.classList.toggle('night', night > 0.55);
}

function updateCamera(dt, snap = false) {
  // Camera heading follows the character, not raw input.
  // This prevents D/A from continuously rotating the camera underneath the player.
  const desiredYaw = player.rotation.y;
  let d = Math.atan2(Math.sin(desiredYaw - camYaw), Math.cos(desiredYaw - camYaw));
  camYaw += d * (snap ? 1 : 1 - Math.exp(-5.2 * dt));

  const k = snap ? 1 : 1 - Math.exp(-7 * dt);
  const lookAhead = 1.8;
  const aheadX = Math.sin(player.rotation.y) * lookAhead;
  const aheadZ = Math.cos(player.rotation.y) * lookAhead;

  focus.x += (player.position.x + aheadX - focus.x) * k;
  focus.z += (player.position.z + aheadZ - focus.z) * k;

  const dist = 12.5;
  const height = 18.5;
  const desired = new THREE.Vector3(
    focus.x - Math.sin(camYaw) * dist,
    height,
    focus.z - Math.cos(camYaw) * dist
  );

  camera.position.lerp(desired, snap ? 1 : 1 - Math.exp(-7 * dt));
  if (camera.position.y < 6) camera.position.y = 6;
  camera.lookAt(focus.x, 0.9, focus.z);
}

function closePanelsWhenFar() {
  if (document.getElementById('base').classList.contains('hidden')) return;
  if (!nearBase()) document.getElementById('base').classList.add('hidden');
}

// Init controls
document.getElementById('load').remove();
loadGame(false);
renderUI();
updateLighting();
updateObjective();
updateCamera(0, true);

let lastSave = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (actionQueued) { actionQueued = false; action(); }
  updateSurvival(dt);
  updatePlayer(dt);
  updateLighting();
  if (playerMixer) playerMixer.update(dt);
  updateCamera(dt);
  updateHint();
  closePanelsWhenFar();

  lastSave += dt;
  if (lastSave > 20) { lastSave = 0; saveGame(false); }

  flashClock += dt;
  if (flashClock > 0.15) {
    flashClock = 0;
    renderUI();
  }
  renderer.render(scene, camera);
}
loop();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
