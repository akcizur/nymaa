import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const SAVE_KEY = 'nymaa-post-catastrophe-mvp-v1';
const WORLD = 40;
const HALF = WORLD / 2;
const PLAYER_R = 0.30;
const INTERACT_R = 1.35;
const GAME_MINUTES_PER_SECOND = 2.5;
const MAX_INVENTORY = 14;
const PLAYER_HEIGHT = 1.80;
const WALK_SPEED = 5.00;
const RUN_SPEED = 7.20;
const WALK_ANIM_SPEED = 5.00;
const RUN_ANIM_SPEED = 7.20;

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

const BUILDING_TYPES = {
  small:  { w: 3.2, h: 2.4, d: 2.6 },
  medium: { w: 4.8, h: 3.0, d: 3.6 },
  large:  { w: 6.4, h: 3.6, d: 4.8 },
};

// World architecture intentionally stays primitive:
// a small number of solid boxes, scaled from the 1.80 m player height.
const BUILDINGS = [
  { x: -15.0, z: -14.0, ...BUILDING_TYPES.small,  color: 0x8b6f62 },
  { x:   3.2, z: -13.2, ...BUILDING_TYPES.medium, color: 0x9a8b68 },
  { x:  14.5, z: -14.0, ...BUILDING_TYPES.large,  color: 0x7d8585 },

  { x: -15.0, z:   0.0, ...BUILDING_TYPES.small,  color: 0x796b5f },
  { x:  14.8, z:   0.0, ...BUILDING_TYPES.large,  color: 0x707878 },

  { x: -14.0, z:  14.0, ...BUILDING_TYPES.medium, color: 0x7d8585 },
  { x:  -3.0, z:  14.0, ...BUILDING_TYPES.large,  color: 0x707878 },
  { x:   5.0, z:  14.0, ...BUILDING_TYPES.medium, color: 0x9a8b68 },
];
const LOOT_SEEDS = [
  { id: 'crate-a', x: -12, z: -12, label: 'ABANDONED CACHE', items: { water: 2, food: 1, scrap: 2 } },
  { id: 'crate-b', x: -12, z: -5.5, label: 'KITCHEN', items: { food: 2, medicine: 1, dirtyWater: 2 } },
  { id: 'crate-c', x: 10, z: -5.5, label: 'WORKSHOP', items: { scrap: 5, wood: 2 } , requires: 'tool' },
  { id: 'crate-d', x: 11, z: 11, label: 'FOREST EDGE', items: { wood: 6 }, requires: 'axe' },
  { id: 'crate-e', x: -10, z: 11, label: 'CLINIC', items: { medicine: 2, water: 2, food: 1 } },
  { id: 'crate-f', x: 13, z: -13, label: 'GARAGE', items: { scrap: 6, wood: 2 }, requires: 'tool' },
  { id: 'crate-g', x: -3, z: 9, label: 'DRAINAGE', items: { dirtyWater: 5, scrap: 1 } },
];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x5a6666, 0.010);
const bgCanvas = document.createElement('canvas');
bgCanvas.width = 2; bgCanvas.height = 256;
const bgctx = bgCanvas.getContext('2d');
const bgGrad = bgctx.createLinearGradient(0, 0, 0, 256);
bgGrad.addColorStop(0, '#6c7d83');
bgGrad.addColorStop(1, '#40504f');
bgctx.fillStyle = bgGrad; bgctx.fillRect(0, 0, 2, 256);
scene.background = new THREE.CanvasTexture(bgCanvas);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 400);
const ambient = new THREE.AmbientLight(0xc0c0c0, 1.45);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff4d0, 2.05);
sun.position.set(40, 65, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { near: 1, far: 190, left: -60, right: 60, top: 60, bottom: -60 });
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD, WORLD),
  new THREE.MeshLambertMaterial({ color: 0x62685b })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(WORLD, 50, 0x54594f, 0x54594f);
grid.position.y = 0.005;
scene.add(grid);

const ROAD_WIDTH = 5;
const SIDEWALK_WIDTH = 1.2;
const CURB_H = 0.12;

const roadMat = new THREE.MeshLambertMaterial({ color: 0x454545 });
const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x929292 });
const curbMat = new THREE.MeshLambertMaterial({ color: 0x6d6d6d });
const dashMat = new THREE.MeshBasicMaterial({ color: 0xd0d0b5 });
const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xc0c0a0 });

function addStreetStrip(axis, fixed, length = WORLD) {
  const road = new THREE.Mesh(
    axis === 'x'
      ? new THREE.PlaneGeometry(length, ROAD_WIDTH)
      : new THREE.PlaneGeometry(ROAD_WIDTH, length),
    roadMat
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(axis === 'x' ? 0 : fixed, 0.02, axis === 'x' ? fixed : 0);
  road.receiveShadow = true;
  scene.add(road);

  const sideOffset = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2;
  for (const sign of [-1, 1]) {
    const sidewalk = new THREE.Mesh(
      axis === 'x'
        ? new THREE.PlaneGeometry(length, SIDEWALK_WIDTH)
        : new THREE.PlaneGeometry(SIDEWALK_WIDTH, length),
      sidewalkMat
    );
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(
      axis === 'x' ? 0 : fixed + sign * sideOffset,
      0.026,
      axis === 'x' ? fixed + sign * sideOffset : 0
    );
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    const curb = new THREE.Mesh(
      axis === 'x'
        ? new THREE.BoxGeometry(length, CURB_H, 0.12)
        : new THREE.BoxGeometry(0.12, CURB_H, length),
      curbMat
    );
    curb.position.set(
      axis === 'x' ? 0 : fixed + sign * (ROAD_WIDTH / 2),
      CURB_H / 2,
      axis === 'x' ? fixed + sign * (ROAD_WIDTH / 2) : 0
    );
    curb.receiveShadow = true;
    scene.add(curb);
  }
}

function addStreetDashes(axis, fixed) {
  const gap = 6;
  const dashLength = 4;
  for (let v = -18; v <= 18; v += gap) {
    // Keep junction centers visually open.
    if ([-10, 10].some((junction) => Math.abs(v - junction) < 4)) continue;

    const dash = new THREE.Mesh(
      axis === 'x' ? new THREE.PlaneGeometry(dashLength, 0.22) : new THREE.PlaneGeometry(0.22, dashLength),
      dashMat
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(axis === 'x' ? v : fixed, 0.035, axis === 'x' ? fixed : v);
    scene.add(dash);
  }
}

function addCrosswalk(x, z, horizontal = true) {
  for (let i = -2; i <= 2; i++) {
    const stripe = new THREE.Mesh(
      horizontal
        ? new THREE.PlaneGeometry(0.45, ROAD_WIDTH - 1)
        : new THREE.PlaneGeometry(ROAD_WIDTH - 1, 0.45),
      crosswalkMat
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(
      horizontal ? x + i * 1.05 : x,
      0.037,
      horizontal ? z : z + i * 1.05
    );
    scene.add(stripe);
  }
}

addStreetStrip('x', -5.5);
addStreetStrip('x', 5.5);
addStreetStrip('z', -10);
addStreetStrip('z', 10);

addStreetDashes('x', -5.5);
addStreetDashes('x', 5.5);
addStreetDashes('z', -10);
addStreetDashes('z', 10);

for (const x of [-10, 10]) {
  for (const z of [-5.5, 5.5]) {
    addCrosswalk(x, z, true);
    addCrosswalk(x, z, false);
  }
}

const colliders = [];
const mat = (color) => new THREE.MeshLambertMaterial({ color });

for (const building of BUILDINGS) {
  const { x, z, w, h, d, color } = building;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat(color)
  );

  body.position.set(x, h / 2, z);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);

  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
}

const baseCenter = new THREE.Vector3(0, 0, -17);
const baseSize = { x: 7, z: 4.5 };
const baseFloor = new THREE.Mesh(
  new THREE.BoxGeometry(baseSize.x, 0.25, baseSize.z),
  new THREE.MeshLambertMaterial({ color: 0x707870 })
);
baseFloor.position.set(baseCenter.x, 0.12, baseCenter.z);
baseFloor.receiveShadow = true;
scene.add(baseFloor);

const baseWallMat = mat(0x7c817c);
for (const [w, d, x, z, y] of [
  [7, 0.35, 0, -19.25, 0.9],
  [2.2, 0.35, -2.4, -14.75, 0.9], [2.2, 0.35, 2.4, -14.75, 0.9],
  [0.35, 4.5, -3.5, -17, 0.9], [0.35, 4.5, 3.5, -17, 0.9],
]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.8, d), baseWallMat);
  wall.position.set(x, y, z);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(wall);
}
const baseMarker = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24),
  new THREE.MeshBasicMaterial({ color: 0x008080, transparent: true, opacity: 0.25 })
);
baseMarker.position.set(baseCenter.x, 0.05, baseCenter.z);
scene.add(baseMarker);

const edgeMat = mat(0x55595a);
for (const [w, d, x, z] of [
  [WORLD, 0.6, 0, -HALF + 0.3],
  [WORLD, 0.6, 0, HALF - 0.3],
  [0.6, WORLD, -HALF + 0.3, 0],
  [0.6, WORLD, HALF - 0.3, 0],
]) {
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, d), edgeMat);
  edge.position.set(x, 0.275, z);
  edge.castShadow = edge.receiveShadow = true;
  scene.add(edge);
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2
  });
}

// Player — animated rigged GLB
const player = new THREE.Group();
player.position.set(0, 0, -17);
player.castShadow = true;
player.rotation.y = Math.PI;
scene.add(player);

let playerMixer = null;
let playerActions = new Map();
let playerAction = '';
let playerModel = null;
let playerLoaded = false;
let playerLocomotion = 'Idle';
let playerOneShot = false;
let playerOneShotAction = null;
let playerOneShotUntil = 0;
let playerDeadUntil = 0;

const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.34, 20),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.008;
scene.add(playerShadow);

const PLAYER_MODEL_URL = new URL('../assets/player/xy-blue-metal-manequin.glb', import.meta.url).href;
const PLAYER_MODEL_FALLBACK_URL = new URL('../assets/player/demo-avatar.glb', import.meta.url).href;

function playPlayerAnimation(name, movementSpeed = 0, fade = 0.14) {
  if (!playerMixer || !playerActions.size) return;

  const clipName = playerActions.has(name) ? name : 'Idle';
  playerLocomotion = clipName;

  if (playerOneShot) return;

  const wanted = playerActions.get(clipName);
  if (!wanted) return;

  const referenceSpeed =
    clipName === 'Run' ? RUN_ANIM_SPEED :
    clipName === 'Walk' ? WALK_ANIM_SPEED : 1;

  const timeScale = clipName === 'Idle'
    ? 1
    : THREE.MathUtils.clamp(movementSpeed / referenceSpeed, 0.88, 1.12);

  wanted.enabled = true;
  wanted.setLoop(THREE.LoopRepeat, Infinity);
  wanted.clampWhenFinished = false;
  wanted.setEffectiveTimeScale(timeScale);
  wanted.setEffectiveWeight(1);

  if (playerAction === clipName) return;

  const previous = playerActions.get(playerAction);
  wanted.reset().fadeIn(fade).play();
  if (previous && previous !== wanted) previous.fadeOut(fade);
  playerAction = clipName;
}

function playPlayerOneShot(name, timeScale = 1, fade = 0.10) {
  if (!playerMixer || !playerActions.size || !playerActions.has(name) || playerOneShot) return false;

  const wanted = playerActions.get(name);
  const previous = playerActions.get(playerAction);

  playerOneShot = true;
  playerOneShotAction = wanted;
  playerOneShotUntil = performance.now() + 1600;

  wanted.reset();
  wanted.enabled = true;
  wanted.setLoop(THREE.LoopOnce, 1);
  wanted.clampWhenFinished = true;
  wanted.setEffectiveTimeScale(timeScale);
  wanted.setEffectiveWeight(1);
  wanted.fadeIn(fade).play();

  if (previous && previous !== wanted) previous.fadeOut(fade);
  playerAction = name;
  return true;
}

async function fetchPlayerBuffer(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`PLAYER MODEL HTTP ${response.status}: ${url}`);
  }

  const total = Number(response.headers.get('content-length')) || 0;
  const reader = response.body?.getReader();

  if (!reader) return new Uint8Array(await response.arrayBuffer());

  let loaded = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.byteLength;

    if (total) {
      console.debug('PLAYER MODEL progress', {
        loaded,
        total,
        ratio: loaded / total,
      });
    }
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return buffer;
}

async function loadPlayerModel() {
  let sourceUrl = PLAYER_MODEL_URL;
  let buffer;

  try {
    buffer = await fetchPlayerBuffer(PLAYER_MODEL_URL);
  } catch (primaryError) {
    console.warn('PLAYER MODEL primary asset unavailable, using fallback.', primaryError);
    sourceUrl = PLAYER_MODEL_FALLBACK_URL;
    buffer = await fetchPlayerBuffer(PLAYER_MODEL_FALLBACK_URL);
  }

  const loader = new GLTFLoader();

  await new Promise((resolve, reject) => {
    loader.parse(
      buffer.buffer,
      new URL('./', sourceUrl).href,
      (gltf) => {
        const root = gltf.scene;
        root.rotation.y = 0;

        root.traverse((object) => {
          if (!object.isMesh) return;

          object.castShadow = true;
          object.receiveShadow = true;

          if (!object.material) return;

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          for (const material of materials) {
            material.metalness = Math.min(material.metalness ?? 0, 0.15);
            material.roughness = Math.max(material.roughness ?? 0.55, 0.55);
          }
        });

        const bounds = new THREE.Box3().setFromObject(root);
        const size = bounds.getSize(new THREE.Vector3());

        if (size.y > 0.001) {
          root.scale.setScalar(PLAYER_HEIGHT / size.y);
        }

        const fittedBounds = new THREE.Box3().setFromObject(root);
        root.position.y -= fittedBounds.min.y;

        player.add(root);
        playerModel = root;

        playerMixer = new THREE.AnimationMixer(root);
        playerActions = new Map(
          gltf.animations.map((clip) => [clip.name, playerMixer.clipAction(clip)])
        );

        if (playerActions.size) {
          playerMixer.addEventListener('finished', (event) => {
            if (event.action !== playerOneShotAction) return;

            playerOneShot = false;
            playerOneShotAction = null;
            playerOneShotUntil = 0;

            playPlayerAnimation(playerLocomotion, 0);
          });
        } else {
          console.info('PLAYER MODEL: static rig, no embedded animations');
        }

        playPlayerAnimation('Idle', 0);
        playerLoaded = true;
        document.getElementById('load')?.remove();
        resolve();
      },
      reject
    );
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
  campfire: new THREE.Vector3(-2.0, 0, -17),
  storageBox: new THREE.Vector3(-0.6, 0, -17.7),
  bed: new THREE.Vector3(1.4, 0, -17.4),
  waterFilter: new THREE.Vector3(2.0, 0, -15.9),
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
  player: { x: 0, z: -17, rot: Math.PI },
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
const touchLook = { x: 0, y: 0 };
let touchRun = false;
let actionQueued = false;
const onKey = (e, down) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if (down && e.repeat) return;
  if (down && e.code === 'Space') playPlayerOneShot('Jump', 1.0);
  if (down && e.code === 'KeyF') playPlayerOneShot('Punch', 1.05);
  if (down && e.code === 'KeyT') playPlayerOneShot('Working', 1.0);
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
const leftZone = document.getElementById('touch-left-zone');
const rightZone = document.getElementById('touch-right-zone');
const leftStick = document.getElementById('touch-left-stick');
const rightStick = document.getElementById('touch-right-stick');
const leftKnob = leftStick.querySelector('span');
const rightKnob = rightStick.querySelector('span');
const touchPointers = { left: null, right: null };
const TOUCH_MAX = 42;

if (matchMedia('(pointer: coarse)').matches) touch.classList.remove('hidden');

function resetTouchStick(kind) {
  const stickEl = kind === 'left' ? leftStick : rightStick;
  const knobEl = kind === 'left' ? leftKnob : rightKnob;
  const axis = kind === 'left' ? touchAxis : touchLook;
  const pointerKey = kind === 'left' ? 'left' : 'right';

  touchPointers[pointerKey] = null;
  axis.x = 0;
  if (kind === 'left') axis.z = 0;
  else axis.y = 0;
  knobEl.style.transform = 'translate(0,0)';
  stickEl.classList.add('hidden');
}

function updateDynamicStick(kind, clientX, clientY) {
  const stickEl = kind === 'left' ? leftStick : rightStick;
  const knobEl = kind === 'left' ? leftKnob : rightKnob;
  const axis = kind === 'left' ? touchAxis : touchLook;
  const anchorX = Number(stickEl.dataset.anchorX);
  const anchorY = Number(stickEl.dataset.anchorY);

  let dx = clientX - anchorX;
  let dy = clientY - anchorY;
  const distance = Math.hypot(dx, dy);
  if (distance > TOUCH_MAX) {
    dx = dx / distance * TOUCH_MAX;
    dy = dy / distance * TOUCH_MAX;
  }

  knobEl.style.transform = `translate(${dx}px,${dy}px)`;
  axis.x = dx / TOUCH_MAX;
  if (kind === 'left') axis.z = -dy / TOUCH_MAX;
  else axis.y = dy / TOUCH_MAX;
}

function beginDynamicStick(kind, event) {
  const pointerKey = kind === 'left' ? 'left' : 'right';
  if (touchPointers[pointerKey] !== null) return;

  touchPointers[pointerKey] = event.pointerId;
  const stickEl = kind === 'left' ? leftStick : rightStick;
  stickEl.dataset.anchorX = String(event.clientX);
  stickEl.dataset.anchorY = String(event.clientY);
  stickEl.style.left = `${event.clientX}px`;
  stickEl.style.top = `${event.clientY}px`;
  stickEl.classList.remove('hidden');

  const zone = kind === 'left' ? leftZone : rightZone;
  try { zone.setPointerCapture(event.pointerId); } catch {}
  updateDynamicStick(kind, event.clientX, event.clientY);
  event.preventDefault();
}

function moveDynamicStick(kind, event) {
  const pointerKey = kind === 'left' ? 'left' : 'right';
  if (touchPointers[pointerKey] !== event.pointerId) return;
  updateDynamicStick(kind, event.clientX, event.clientY);
  event.preventDefault();
}

function endDynamicStick(kind, event) {
  const pointerKey = kind === 'left' ? 'left' : 'right';
  if (touchPointers[pointerKey] !== event.pointerId) return;
  resetTouchStick(kind);
  event.preventDefault();
}

for (const eventName of ['pointerdown','pointermove','pointerup','pointercancel']) {
  leftZone.addEventListener(eventName, (event) => {
    if (eventName === 'pointerdown') beginDynamicStick('left', event);
    else if (eventName === 'pointermove') moveDynamicStick('left', event);
    else endDynamicStick('left', event);
  });
  rightZone.addEventListener(eventName, (event) => {
    if (eventName === 'pointerdown') beginDynamicStick('right', event);
    else if (eventName === 'pointermove') moveDynamicStick('right', event);
    else endDynamicStick('right', event);
  });
}

const bindTouchAction = (id, onDown, onUp = null) => {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.classList.add('is-active');
    onDown();
  });
  const release = (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.classList.remove('is-active');
    onUp?.();
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
};

bindTouchAction('touch-interact', () => { actionQueued = true; });
bindTouchAction('touch-jump', () => playPlayerOneShot('Jump', 1.0));
bindTouchAction('touch-punch', () => playPlayerOneShot('Punch', 1.05));
bindTouchAction('touch-run', () => { touchRun = true; }, () => { touchRun = false; });
bindTouchAction('touch-inventory', () => togglePanel('inventory'));

addEventListener('blur', () => {
  touchRun = false;
  resetTouchStick('left');
  resetTouchStick('right');
});

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
  return Math.hypot(player.position.x - baseCenter.x, player.position.z - baseCenter.z) <= 2.8;
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
    playPlayerOneShot('Working', 1.05, 0.08);
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

const focus = new THREE.Vector3(0, 0, -17);
let camYaw = Math.PI;
let camPitch = 0.95;
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
  return touchRun || keys.has('ShiftLeft') || keys.has('ShiftRight');
}