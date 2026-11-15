// A line drawing of each prize, for the collection on the receipt (main.ts): each model drawn once, small, with
// its normals for colours, and the lines found where those change sharply (its outline, its folds and edges), like
// a pen drawing of it. Made once, in the background, after the stall is in; kept as pictures (data URLs).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Kind } from './prizes';
import { MODELS } from './models';

const BASE = '/play/no-cash-only/prizes/';
const STEP = 0.03;    // a jump in depth (of the 3 model-radii the camera sees through) that makes a line
const S = 112;          // px square: about twice what it's shown at
const CREASE = 0.45;    // how sharp a turn in the surface makes a line (the dot of the two normals below this)

/** the ones with a drawing made for them (public/play/no-cash-only/thumbs/<kind>.png): those, not one made here */
const DRAWN = new Set<Kind>(['cat', 'tatcat', 'dog', 'pup', 'panda', 'plush', 'dumpling', 'bokchoy', 'mug', 'beer', 'controller', 'lunchbox', 'soy', 'jar', 'dragon', 'cooker', 'record', 'ingot']);

let made: Promise<Map<Kind, string>> | null = null;

/** the drawings, made the first time this is asked (each kind that has a model) */
export function thumbs(kinds: Kind[]): Promise<Map<Kind, string>> {
  made ??= draw(kinds);
  return made;
}

async function draw(kinds: Kind[]): Promise<Map<Kind, string>> {
  const out = new Map<Kind, string>();
  for (const k of kinds) if (DRAWN.has(k)) out.set(k, `/play/no-cash-only/thumbs/${k}.png`);
  if (kinds.every((k) => DRAWN.has(k) || !MODELS[k])) return out;   // all drawn by hand: nothing to make here
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(S, S, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  const material = new THREE.MeshNormalMaterial();
  // and its depth, in two channels (for where one part stands in front of another: a paw over a body)
  const depthMat = new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'void main() { float d = gl_FragCoord.z * 255.0; gl_FragColor = vec4(floor(d) / 255.0, fract(d), 0.0, 1.0); }',
  });
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const flat = document.createElement('canvas');
  flat.width = flat.height = S;
  const g = flat.getContext('2d', { willReadFrequently: true })!;

  for (const kind of kinds) {
    if (DRAWN.has(kind)) { out.set(kind, `/play/no-cash-only/thumbs/${kind}.png`); continue; }   // drawn by hand (the sources: _source/prizes/thumbs)
    const m = MODELS[kind];
    if (!m) continue;
    try {
      const gltf = await loader.loadAsync(BASE + m.file + '.glb');
      const model = gltf.scene;
      model.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material; });
      scene.add(model);
      // seen from the front and a little above, as it's held up to you; fitted to the square with a margin
      const box = new THREE.Box3().setFromObject(model), mid = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const r = size.length() / 2;
      camera.position.copy(mid).add(new THREE.Vector3(0, 0.35, 1).normalize().multiplyScalar(r * 4));
      camera.lookAt(mid);
      camera.updateMatrixWorld();
      // fit the square to it as seen: its corners, in the camera's view
      const v = new THREE.Vector3();
      let half = 0;
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(camera.matrixWorldInverse);
        half = Math.max(half, Math.abs(v.x), Math.abs(v.y));
      }
      half *= 1.08;
      Object.assign(camera, { left: -half, right: half, top: half, bottom: -half, near: r * 2.5, far: r * 5.5 });
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      g.clearRect(0, 0, S, S);
      g.drawImage(renderer.domElement, 0, 0);
      const normals = g.getImageData(0, 0, S, S);
      scene.overrideMaterial = depthMat;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.remove(model);
      g.clearRect(0, 0, S, S);
      g.drawImage(renderer.domElement, 0, 0);
      out.set(kind, lines(normals, g.getImageData(0, 0, S, S)));
    } catch (e) {
      console.warn(`no drawing of ${kind}`, e);
    }
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}

/** the lines: its outline; where one part stands in front of another (a jump in depth); and where its surface
 *  turns sharply (lone specks of that dropped: the models are a little bumpy all over). In black */
function lines(img: ImageData, depthImg: ImageData): string {
  const { data } = img, dd = depthImg.data;
  const at = (x: number, y: number): number => (y * S + x) * 4;
  const inside = (x: number, y: number): boolean => data[at(x, y) + 3] > 128;
  const depth = (x: number, y: number): number => { const i = at(x, y); return (dd[i] + dd[i + 1] / 255) / 255; };
  const nrm = (x: number, y: number): [number, number, number] => { const i = at(x, y); return [data[i] / 127.5 - 1, data[i + 1] / 127.5 - 1, data[i + 2] / 127.5 - 1]; };
  const outline = new Uint8Array(S * S), fold = new Uint8Array(S * S);
  for (let y = 0; y < S - 1; y++) for (let x = 0; x < S - 1; x++) {
    const inA = inside(x, y);
    for (const [xx, yy] of [[x + 1, y], [x, y + 1]]) {
      const inB = inside(xx, yy);
      if (inA !== inB) { outline[y * S + x] = 1; continue; }
      if (!inA) continue;
      if (Math.abs(depth(x, y) - depth(xx, yy)) > STEP) { outline[y * S + x] = 1; continue; }
      const a = nrm(x, y), b = nrm(xx, yy);
      if (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] < CREASE) fold[y * S + x] = 1;
    }
  }
  const edge = outline.slice();
  for (let y = 2; y < S - 2; y++) for (let x = 2; x < S - 2; x++) {
    if (!fold[y * S + x]) continue;
    let n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) n += fold[(y + dy) * S + x + dx];
    if (n >= 8) edge[y * S + x] = 1;
  }
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const o = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // thickened by a pixel (its neighbour to the left and above): about one pixel on screen at half the size
      const on = edge[y * S + x] || (x && edge[y * S + x - 1]) || (y && edge[(y - 1) * S + x]);
      if (on) o.data[at(x, y) + 3] = 255;
    }
  }
  g.putImageData(o, 0, 0);
  return c.toDataURL('image/png');
}
