import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const SAVE_KEY = 'nymaa-post-catastrophe-mvp-v1';
const WORLD = 40;
const HALF = WORLD / 2;

// One Three.js unit represents one real-world metre.
// Keep the human at a believable 1.80 m; scale the environment around that reference.
const SCALE = {
  playerHeight: 1.80,
  playerRadius: 0.30,
  interactRadius: 1.35,
  buildingWidth: 1.9,
  buildingDepth: 1.9,
  buildingHeight: 1.55,
};

const PLAYER_R = SCALE.playerRadius;
const INTERACT_R = SCALE.interactRadius;
const GAME_MINUTES_PER_SECOND = 2.5;
const MAX_INVENTORY = 14;
const PLAYER_HEIGHT = SCALE.playerHeight;
const WALK_SPEED = 1.60;
const RUN_SPEED = 4.80;
const WALK_ANIM_SPEED = WALK_SPEED;
const RUN_ANIM_SPEED = RUN_SPEED;

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

// Buildings are deliberately larger than the 1.80 m player. The previous map used
// 2–4 m wide / ~2 m tall boxes, making a correctly sized human look oversized.
const BUILDINGS = [
  [-3.6, -2.2, 5.6, 4.8, 4.0, 0x7d8585],
  [3.0, -2.6, 5.6, 3.6, 3.6, 0x9a8b68],
  [-3.4, 3.2, 5.2, 3.4, 3.7, 0x8b6f62],
  [3.5, 3.1, 5.8, 4.8, 4.0, 0x7d8585],
  [-15.0, -14.0, 4.4, 3.6, 3.4, 0x8b6f62],
  [14.5, -14.0, 5.6, 4.4, 3.4, 0x9a8b68],
  [-14.8, 14.3, 5.0, 6.4, 3.7, 0x7d8585],
  [-3.2, 14.0, 6.4, 8.0, 4.6, 0x707878],
  [3.5, 14.0, 5.6, 4.2, 3.6, 0x9a8b68],
  [14.5, 14.2, 4.6, 3.6, 3.4, 0x8b6f62],
  [-14.5, 0, 4.6, 3.6, 3.4, 0x8b6f62],
  [14.8, 0, 5.6, 7.0, 4.0, 0x7d8585],
  [-13.7, -1.6, 4.0, 3.2, 3.1, 0x796b5f],
  [13.5, 4.0, 4.0, 3.2, 3.1, 0x796b5f],
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

for (const [x, z, w, h, d, color] of BUILDINGS) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, 0.18, d + 0.18), mat(0x626666));
  roof.position.y = h + 0.09;
  roof.castShadow = true;
  g.add(roof);
  const frontWindowMat = new THREE.MeshBasicMaterial({ color: 0xd1c88f });
  const windowCount = Math.max(1, Math.min(3, Math.floor(w / 4)));
  const windowSpacing = w / (windowCount + 1);
  for (let i = 1; i <= windowCount; i++) {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, Math.min(1.2, Math.max(0.8, h * 0.18)), 0.05),
      frontWindowMat
    );
    window.position.set(-w / 2 + windowSpacing * i, Math.min(h * 0.62, 3.0), d / 2 + 0.028);
    g.add(window);
  }
  scene.add(g);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

const baseCenter = new THREE.Vector3(0, 0, -17);
const baseSize = { x: 7, z: 4.5 };
const baseFloor = new THREE.Mesh(new THREE.BoxGeometry(baseSize.x, 0.25, baseSize.z), new THREE.MeshLambertMaterial({ color: 0x707870 }));
baseFloor.position.set(baseCenter.x, 0.12, baseCenter.z);
baseFloor.receiveShadow = true;
scene.add(baseFloor);
const baseWallMat = mat(0x7c817c);
for (const [w, d, x, z, y] of [[7, 0.35, 0, -19.25, 0.9], [2.2, 0.35, -2.4, -14.75, 0.9], [2.2, 0.35, 2.4, -14.75, 0.9], [0.35, 4.5, -3.5, -17, 0.9], [0.35, 4.5, 3.5, -17, 0.9]]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.8, d), baseWallMat);
  wall.position.set(x, y, z);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(wall);
}
const baseMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24), new THREE.MeshBasicMaterial({ color: 0x008080, transparent: true, opacity: 0.25 }));
baseMarker.position.set(baseCenter.x, 0.05, baseCenter.z);
scene.add(baseMarker);

const edgeMat = mat(0x55595a);
for (const [w, d, x, z] of [[WORLD, 0.6, 0, -HALF + 0.3], [WORLD, 0.6, 0, HALF - 0.3], [0.6, WORLD, -HALF + 0.3, 0], [0.6, WORLD, HALF - 0.3, 0]]) {
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, d), edgeMat);
  edge.position.set(x, 0.275, z);
  edge.castShadow = edge.receiveShadow = true;
  scene.add(edge);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

// Player — 1.80 m reference human.
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

const playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.008;
scene.add(playerShadow);

const PLAYER_MODEL_URL = `${import.meta.env.BASE_URL}assets/player/demo-avatar.glb`;

function playPlayerAnimation(name, movementSpeed = 0, fade = 0.14) {
  if (!playerMixer || !playerActions.size) return;
  const clipName = playerActions.has(name) ? name : 'Idle';
  playerLocomotion = clipName;
  if (playerOneShot) return;
  const wanted = playerActions.get(clipName);
  if (!wanted) return;
  const referenceSpeed = clipName === 'Run' ? RUN_ANIM_SPEED : clipName === 'Walk' ? WALK_ANIM_SPEED : 1;
  const timeScale = clipName === 'Idle' ? 1 : THREE.MathUtils.clamp(movementSpeed / referenceSpeed, 0.88, 1.12);
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

async function loadPlayerModel() {
  const loader = new GLTFLoader();
  await new Promise((resolve, reject) => {
    loader.load(PLAYER_MODEL_URL, (gltf) => {
      const root = gltf.scene;
      root.rotation.y = 0;
      root.updateMatrixWorld(true);

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

      // Fit the imported asset from its actual world-space bounds. This avoids
      // relying on the GLB's authoring scale and prevents an oversized character.
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const sourceHeight = Math.max(size.y, 0.001);
      const fitScale = PLAYER_HEIGHT / sourceHeight;
      root.scale.setScalar(fitScale);
      root.updateMatrixWorld(true);

      const fittedBounds = new THREE.Box3().setFromObject(root);
      root.position.y -= fittedBounds.min.y;
      root.updateMatrixWorld(true);

      // Final guard: the visible mesh must be exactly 1.80 m tall after fitting.
      const finalBounds = new THREE.Box3().setFromObject(root);
      const finalHeight = finalBounds.max.y - finalBounds.min.y;
      if (finalHeight > 0.001) root.scale.multiplyScalar(PLAYER_HEIGHT / finalHeight);
      root.position.y -= finalBounds.min.y;

      player.add(root);
      playerModel = root;
      playerMixer = new THREE.AnimationMixer(root);
      playerActions = new Map(gltf.animations.map((clip) => [clip.name, playerMixer.clipAction(clip)]));
      playerMixer.addEventListener('finished', (event) => {
        if (event.action !== playerOneShotAction) return;
        playerOneShot = false;
        playerOneShotAction = null;
        playerOneShotUntil = 0;
        playPlayerAnimation(playerLocomotion, 0);
      });
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
