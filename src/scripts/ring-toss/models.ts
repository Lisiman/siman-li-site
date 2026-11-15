// The real prizes, made from pictures (Tripo), in place of the greybox shapes once they've loaded. Each file is one
// model, upright, its base at y = 0 and 1 unit tall (made from _source/prizes/ by scale and orientation only);
// here it is sized to the prize's height. The ring still plays against footR and height (prizes.ts), so a model
// changes how it looks, not how hard it is.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Kind, Slot } from './prizes';
import { studioLit } from './studio';
import { STAND_TOP } from './stall';

const BASE = '/play/no-cash-only/prizes/';

/** the kinds that have a model so far, its file stem, and which way it faces (radians about y, to face you) */
/** tone: a darker tint for the ones painted near-white (or bright gold): under the bulbs they glowed */
type Model = { file: string; turn: number; tone?: number };
export const MODELS: Partial<Record<Kind, Model>> = {
  cat: { file: 'lucky-cat', turn: 0 },
  tatcat: { file: 'tattooed-cat', turn: 0 },
  bokchoy: { file: 'jade-cabbage', turn: 0 },
  plush: { file: 'bao-plush', turn: 0 },
  mug: { file: 'tiger-mug', turn: 0 },
  beer: { file: 'beer-mug', turn: 0 },
  dog: { file: 'puppy', turn: 0 },
  record: { file: 'record-player', turn: 0 },
  dragon: { file: 'jade-dragon', turn: 0 },
  cooker: { file: 'rice-cooker', turn: 0 },
  controller: { file: 'game-controller', turn: 0 },   // his own, put up as a prize
  soy: { file: 'soy-sauce', turn: 0 },
  jar: { file: 'chili-oil', turn: 0 },
  panda: { file: 'panda', turn: 0, tone: 0.8 },
  lunchbox: { file: 'lunchbox', turn: 0, tone: 0.85 },
  pup: { file: 'cute-dog', turn: 0, tone: 0.72 },
  dumpling: { file: 'dumpling', turn: 0, tone: 0.75 },
  ingot: { file: 'gold-ingot', turn: 0, tone: 0.75 },
};

/** the owner's own things, not prizes: on and by his stand (stall.ts has it at x -1.5, front at z -1.5, top STAND_TOP) */
const DECOR: { file: string; height: number; at: [number, number, number]; rot: [number, number, number] }[] = [
  // (her skateboard, leaning on the front of her stand, is out: it crowded the cash tin)
  // her pink tumbler, at her right hand (your left as you face her), handle out to that side
  { file: 'tumbler', height: 0.24, at: [-1.76, STAND_TOP, -1.6], rot: [0, Math.PI - 0.4, 0] },
];

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const textures = new THREE.TextureLoader();
const tex = (file: string, color = false): THREE.Texture => {
  const t = textures.load(BASE + file);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
/** a model's own textures, as one material */
// Tripo's metallic maps are noisy: at full strength glazed ceramic and painted tin read as dirty metal. So only a
// little of it, the roughness a touch glossier than the map says, and the studio light to shine in.
const look = (file: string): THREE.MeshStandardMaterial => studioLit(new THREE.MeshStandardMaterial({
  map: tex(file + '-base.webp', true), normalMap: tex(file + '-normal.webp'), normalScale: new THREE.Vector2(0.6, 0.6),
  roughnessMap: tex(file + '-rough.webp'), metalnessMap: tex(file + '-metal.webp'), roughness: 0.75, metalness: 0.2,
}), 0.6);

/** one of these models on its own, sized to a height (m), with its own textures; done is handed it once it's in */
export function loadProp(file: string, height: number, done: (model: THREE.Object3D) => void): void {
  loader.load(BASE + file + '.glb', (gltf) => {
    const material = look(file);
    gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).material = material; o.castShadow = true; o.receiveShadow = true; } });
    gltf.scene.scale.setScalar(height);
    done(gltf.scene);
  }, undefined, (e) => console.warn(`${file} did not load`, e));
}

/** the owner's skateboard and tumbler (his controller is a prize now: prizes.ts) */
export function loadDecor(scene: THREE.Scene): void {
  for (const d of DECOR) {
    loader.load(BASE + d.file + '.glb', (gltf) => {
      const material = look(d.file);
      gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).material = material; o.castShadow = true; } });
      gltf.scene.scale.setScalar(d.height);
      gltf.scene.position.set(...d.at);
      gltf.scene.rotation.set(...d.rot);
      scene.add(gltf.scene);
    }, undefined, (e) => console.warn(`${d.file} did not load`, e));
  }
}

/** each prize's model, ready to show: loaded, and its textures with it (a model shown before its textures were in came
 *  up black for a moment). Fetched once; every later use is a copy of the same */
const ready = new Map<Kind, Promise<THREE.Object3D>>();
function prepared(kind: Kind): Promise<THREE.Object3D> | null {
  const m = MODELS[kind];
  if (!m) return null;
  let p = ready.get(kind);
  if (!p) {
    p = (async () => {
      const load = (f: string, color = false): Promise<THREE.Texture> => textures.loadAsync(BASE + f).then((t) => { if (color) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
      const [gltf, map, normalMap, roughnessMap, metalnessMap] = await Promise.all([
        loader.loadAsync(BASE + m.file + '.glb'), load(m.file + '-base.webp', true), load(m.file + '-normal.webp'), load(m.file + '-rough.webp'), load(m.file + '-metal.webp'),
      ]);
      const material = studioLit(new THREE.MeshStandardMaterial({ map, normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughnessMap, metalnessMap, roughness: 0.75, metalness: 0.2 }), 0.6);
      if (m.tone) material.color.setScalar(m.tone);
      gltf.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          (o as THREE.Mesh).material = material;
          o.castShadow = true;   // they cast on the steps; small curved things shadowing themselves only look blotchy
        }
      });
      return gltf.scene;
    })();
    p.catch((e) => console.warn(`prize model ${m.file} did not load; the greybox stays`, e));
    ready.set(kind, p);
  }
  return p;
}

/** put each slot's model in, once it's ready (its group marked ready then: main.ts waits for that to drop a new one in) */
export function loadPrizeModels(slots: Slot[]): void {
  for (const s of slots) {
    const kind = s.prize?.kind, group = s.group;
    if (!kind || !group) continue;
    const p = prepared(kind);
    if (!p) { group.userData.ready = true; continue; }
    void p.then((source) => {
      if (s.group !== group || !s.prize) return;   // won meanwhile
      const model = source.clone();
      model.scale.setScalar(s.prize.height);
      model.rotation.y = MODELS[kind]!.turn;
      group.clear();
      group.add(model);
      group.userData.ready = true;
    }).catch(() => { group.userData.ready = true; });
  }
}

/** fetch every prize's model now, in the background, so one put out later comes in at once */
export function preloadPrizes(): void {
  for (const k of Object.keys(MODELS) as Kind[]) void prepared(k)?.catch(() => {});
}
