// What sits on the stall: a stage of steps under a dark cloth, rising to the back; on each step a row of prizes,
// each on a red paper mat. Each prize is drawn as a simple shape until its model loads (models.ts); footR and height
// are what the ring plays against (they set the difficulty), and match the model's own size.
import * as THREE from 'three';

export type Kind = 'tin' | 'jar' | 'soy' | 'soda' | 'cat' | 'plush' | 'mooncake' | 'cooker'
  | 'tatcat' | 'bokchoy' | 'mug' | 'beer' | 'dog' | 'dragon' | 'record' | 'controller'
  | 'panda' | 'lunchbox' | 'pup' | 'ingot' | 'dumpling';

export interface Prize {
  id: string;
  kind: Kind;
  /** placeholder until the made-up shops are written */
  name: string;
  shop: string;
  /** the radius of the circle the prize stands in: the ring (inside radius 0.13 m) must go round all of it */
  footR: number;
  height: number;
  glass: boolean;
  /** the big prize: the ring must go cleanly round it, no tipping over (ring.ts) */
  strict: boolean;
}

export interface Slot {
  x: number;
  z: number;
  stoolH: number;
  /** the stool top, taken as a circle */
  stoolR: number;
  prize: Prize | null;
  group: THREE.Group | null;
  /** a ring is already sliding down round it */
  claimed: boolean;
}

// All the same size to the eye: each is sized by the larger of its height and its width (SMALL_SIZE, or BIG_SIZE at
// the back), not by its height, so the tall cat and the squat bao read alike. r: the model's widest radius as a
// share of its height (measured from the model), which also gives footR, what the ring has to go round.
// (all larger than life, with the rings to match: the prizes read at the back of the stall)
const SMALL_SIZE = 0.28 * 0.85, BIG_SIZE = 0.34 * 0.85;   // (15% smaller than at first: they crowded the steps)
type Spec = { name: string; footR: number; height: number; glass?: boolean; strict?: boolean };
const sized = (name: string, r: number, size: number, more: Partial<Spec> = {}): Spec => {
  const height = size / Math.max(1, 2 * r);
  return { name, height: +height.toFixed(3), footR: +(r * height).toFixed(3), ...more };
};
const SPEC: Record<Kind, Spec> = {
  cat:        sized('Lucky cat', 0.444, SMALL_SIZE),
  tatcat:     sized('Tattooed cat', 0.456, SMALL_SIZE),
  bokchoy:    sized('Jade cabbage', 0.447, SMALL_SIZE),
  tin:        sized('Tea tin', 0.392, SMALL_SIZE),
  plush:      sized('Bao plush', 0.629, SMALL_SIZE),
  mug:        sized('Tiger mug', 0.639, SMALL_SIZE),
  beer:       sized('Lucky beer mug', 0.514, SMALL_SIZE),
  dog:        sized('Lucky pup', 0.501, SMALL_SIZE),
  controller: sized("The owner's controller", 0.79, SMALL_SIZE),   // lies flat (and it's hers)
  soy:        sized('Soy sauce', 0.351, SMALL_SIZE, { glass: true }),
  jar:        sized('Chili oil', 0.474, SMALL_SIZE, { glass: true }),
  mooncake:   sized('Mooncake tin', 1.263, SMALL_SIZE),   // flat: wide and low
  panda:      sized('Panda', 0.498, SMALL_SIZE),
  lunchbox:   sized('Lunchbox', 0.5, SMALL_SIZE),
  pup:        sized('Little pup', 0.495, SMALL_SIZE),
  dumpling:   sized('Dumpling buddy', 0.536, SMALL_SIZE),
  soda:       { name: 'Soda', footR: 0.045, height: 0.263, glass: true },   // (no model, not put out)
  // the big ones: about 2 cm to spare round each, and the ring must go cleanly round, no tipping: rare. "Is it rigged?"
  dragon:     sized('Jade dragon', 0.485, BIG_SIZE, { strict: true }),
  cooker:     sized('Rice cooker', 0.499, BIG_SIZE, { strict: true }),
  record:     sized('Record player', 0.554, BIG_SIZE * 1.19),   // bigger still: low and boxy, it looked small (it reaches 17 cm out from its middle; the ring's inside is 19)
  ingot:      sized('Gold ingot', 0.718, BIG_SIZE * 0.85, { strict: true }),   // smaller: it loomed over the others
};

/** the steps, front to back: where each row stands (z), the height of its step, and its stools
 *  (the owner sits off to the left, at his own table: stall.ts) */
// the whole stage stands on a base, so the prizes are up near your eye, like goods on a shelf
export const BASE = 0.5;
const TIERS: { z: number; step: number; xs: number[]; kinds: Kind[] }[] = [
  // four to a row, the rows a little out of line with each other
  { z: -2.0, step: BASE + 0.00, xs: [-0.84, -0.28, 0.28, 0.84], kinds: ['plush', 'cat', 'dog', 'panda'] },
  { z: -2.7, step: BASE + 0.25, xs: [-0.78, -0.26, 0.26, 0.78], kinds: ['beer', 'controller', 'lunchbox', 'jar'] },
  { z: -3.4, step: BASE + 0.5, xs: [-0.84, -0.28, 0.28, 0.84],  kinds: ['tatcat', 'bokchoy', 'mug', 'dumpling'] },
  { z: -4.1, step: BASE + 0.75, xs: [-0.81, -0.27, 0.27, 0.81], kinds: ['dragon', 'cooker', 'record', 'ingot'] },   // the big prizes
];
const TIER_DEPTH = 0.7;
const FRONT_LIP = 0.35;   // the bottom step reaches this much further forward
export const STAGE_HALF = 1.2;      // the stage is 2.4 m wide
export const BACK_WALL = -4.95;     // its back, against the wall
const MAT_H = 0.004;   // each prize stands on a round red paper mat on the step

/** the height of the stage under (x, z): a step's top, or 0 off the stage and on the bottom step */
/** how far the cloth hangs out in front of each step's face (folds and all): a ring lying below a step keeps
 *  this far off it, so it never sinks into the drape */
export const DRAPE = 0.09;

/** the front of each step a ring lying at height y must stay in front of: x on the stage, z of the step's face
 *  (cloth included), for each step that is higher than y */
export function risersAbove(x: number, y: number): number[] {
  if (Math.abs(x) > STAGE_HALF + 0.05) return [];
  return TIERS.filter((t) => t.step > y + 0.01).map((t) => {
    const first = t === TIERS[0];
    return t.z + TIER_DEPTH / 2 + (first ? FRONT_LIP : 0) + DRAPE;
  });
}

export function floorAt(x: number, z: number): number {
  if (Math.abs(x) > STAGE_HALF) return 0;
  let h = 0;
  TIERS.forEach((t, i) => { if (z <= t.z + TIER_DEPTH / 2 + (i === 0 ? FRONT_LIP : 0)) h = t.step; });
  return h;
}

/** the cloth over the stage. Which one: CLOTH below (in dev, ?cloth=jade|navy|faded|gingham tries the others) */
type Cloth = 'crimson' | 'jade' | 'navy' | 'faded' | 'gingham';
const CLOTH: Cloth = 'crimson';
function clothKind(): Cloth {
  const q = typeof location !== 'undefined' && import.meta.env?.DEV ? new URLSearchParams(location.search).get('cloth') : null;
  return (q === 'crimson' || q === 'jade' || q === 'navy' || q === 'faded' || q === 'gingham') ? q : CLOTH;
}

/** one tile of the cloth (0.4 m), and how it takes the light */
function clothTexture(kind: Cloth): { map: THREE.CanvasTexture; bump?: THREE.CanvasTexture; roughness: number; sheen: number; sheenColor: number } {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const felt = (base: string, fleck: string): void => {   // a plain felt or velvet: one colour, a fine nap
    g.fillStyle = base;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = fleck.replace('A', String(0.04 + Math.random() * 0.06));
      g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1);
    }
  };
  let roughness = 0.6, sheen = 0, sheenColor = 0xffffff;
  let bump: THREE.CanvasTexture | undefined;
  if (kind === 'crimson') {   // the curtain's deep red, as a coarse, crushed velvet: soft patches of light and dark, a thick nap
    c.width = c.height = 256;
    g.fillStyle = '#3a0b10';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 46; i++) {   // the crush: big soft blotches, wrapped so the tile repeats without a seam
      const x = Math.random() * 256, y = Math.random() * 256, r = 18 + Math.random() * 46;
      const light = Math.random() < 0.5;
      for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
        const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        grad.addColorStop(0, light ? 'rgba(120,34,44,0.18)' : 'rgba(12,2,4,0.26)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < 4200; i++) {
      g.fillStyle = Math.random() < 0.6 ? `rgba(170,70,84,${0.04 + Math.random() * 0.07})` : `rgba(10,0,2,${0.06 + Math.random() * 0.08})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2.5, 1 + Math.random());
    }
    // the nap's texture to the touch: fine noise, as a bump map
    const bc = document.createElement('canvas');
    bc.width = bc.height = 256;
    const bg = bc.getContext('2d')!;
    const img = bg.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 110 + Math.random() * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    bg.putImageData(img, 0, 0);
    bump = new THREE.CanvasTexture(bc);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    roughness = 0.95; sheen = 0.8; sheenColor = 0xb4505e;
  } else if (kind === 'jade') { felt('#1d5a47', 'rgba(170,230,200,A)'); roughness = 0.95; sheen = 0.6; sheenColor = 0x8fe0bf; }
  else if (kind === 'navy') { felt('#1c2348', 'rgba(150,170,230,A)'); roughness = 0.95; sheen = 0.6; sheenColor = 0x9fb0ff; }
  else if (kind === 'faded') {   // the plastic tablecloth, sun-bleached: dusty pink on cream, big soft checks
    g.fillStyle = '#e9dccb';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(196, 120, 118, 0.32)';
    for (let i = 0; i < 128; i += 64) { g.fillRect(i, 0, 32, 128); g.fillRect(0, i, 128, 32); }
    roughness = 0.55;
  } else {                       // the red-and-white gingham, like the plastic tablecloths
    g.fillStyle = '#f1e8dc';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(190, 40, 38, 0.55)';
    for (let i = 0; i < 128; i += 32) { g.fillRect(i, 0, 16, 128); g.fillRect(0, i, 128, 16); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return { map: t, bump, roughness, sheen, sheenColor };
}

/** the stage: each step's top and the front face below it, and the two sides, all under the cloth */
/** one fold pattern across the width, different for each step, a little irregular, like real cloth */
const fold = (x: number, k: number): number => Math.sin(x * 8 + k * 1.7) * 0.55 + Math.sin(x * 17 + k * 3.1) * 0.3 + Math.sin(x * 31 + k) * 0.15;

/** the stage: one cloth over all the steps. It lies flat on each step, rolls over the step's front edge, hangs
 *  down its face in folds (wider toward the bottom) and settles on the step below; down the two sides it hangs
 *  like a curtain. Only to look at: the rings play against floorAt(). */
function buildStage(scene: THREE.Scene): void {
  const kind = clothKind();
  const look = clothTexture(kind);
  const velvet = kind === 'navy' || kind === 'jade' || kind === 'crimson';
  const material = new THREE.MeshPhysicalMaterial({
    map: look.map, roughness: velvet ? 0.85 : look.roughness,
    sheen: velvet ? 1 : 0, sheenColor: look.sheenColor, sheenRoughness: kind === 'crimson' ? 0.55 : 0.35, side: THREE.DoubleSide,
    bumpMap: look.bump ?? null, bumpScale: 1.5,
  });
  if (velvet) material.color.setScalar(kind === 'crimson' ? 0.72 : 0.85);

  // the cloth's line from front to back, as (z, y) points, and for each point how far it hangs (0 on a step's
  // top, 1 at the bottom of a drop) and which drop it is
  const prof: { z: number; y: number; hang: number; k: number }[] = [];
  const push = (z: number, y: number, hang = 0, k = 0): void => { prof.push({ z, y, hang, k }); };
  const R = 0.03;   // the roll over each front edge
  TIERS.forEach((t, i) => {
    const front = i === 0 ? t.z + TIER_DEPTH / 2 + FRONT_LIP : t.z + TIER_DEPTH / 2;
    const back = i === TIERS.length - 1 ? BACK_WALL : t.z - TIER_DEPTH / 2;
    const y = t.step + 0.002;
    if (i === 0) { push(front + 0.09, 0.004); push(front + 0.07, 0.006); }   // the hem, lying on the street
    {
      const below = i === 0 ? 0.006 : TIERS[i - 1].step + 0.002;
      // settling on the step below, then hanging up to the edge of this one
      for (let k = 6; k >= 0; k--) {
        const v = k / 6;   // 1 at the bottom of the drop, 0 at the top
        const zz = front + 0.012 + 0.025 * v * v;
        push(zz, below + (y - R - below) * (1 - v) + 0.004 * v, v, i);
      }
      for (let a = 1; a <= 5; a++) {   // over the rounded edge
        const th = (a / 5) * Math.PI / 2;
        push(front - R + R * Math.cos(th) + 0.012 * (1 - a / 5), y - R + R * Math.sin(th));
      }
    }
    // along the top of this step
    const n = Math.max(2, Math.round((front - R - back) / 0.1));
    for (let a = 1; a <= n; a++) push(front - R - (front - R - back) * (a / n), y);
  });
  push(BACK_WALL - 0.001, TIERS[TIERS.length - 1].step + 0.08);   // tucked up the back wall

  // swept across the width
  const W = STAGE_HALF + 0.015, NX = 120;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let along = 0;
  prof.forEach((p, r) => {
    if (r > 0) along += Math.hypot(p.z - prof[r - 1].z, p.y - prof[r - 1].y);
    for (let c = 0; c <= NX; c++) {
      const x = -W + (2 * W * c) / NX;
      const dz = p.hang > 0 ? 0.026 * Math.pow(p.hang, 1.2) * (fold(x, p.k) + 0.6) : 0;
      pos.push(x, p.y, p.z + dz);
      uv.push(x / 0.4, along / 0.4);
    }
  });
  const row = NX + 1;
  for (let r = 0; r < prof.length - 1; r++) for (let c = 0; c < NX; c++) {
    const a = r * row + c, b = a + 1, d = a + row, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const top = new THREE.Mesh(geo, material);
  top.receiveShadow = true;
  scene.add(top);

  // the two sides: from the edge of each step straight down to the street, in folds
  const front0 = TIERS[0].z + TIER_DEPTH / 2 + 0.35;
  for (const side of [-1, 1]) {
    const sp: number[] = [], suv: number[] = [], sidx: number[] = [];
    const NZ = 90, NY = 10;
    for (let a = 0; a <= NZ; a++) {
      const z = front0 - (front0 - BACK_WALL) * (a / NZ);
      const h = floorAt(0, z) + 0.002;
      for (let b = 0; b <= NY; b++) {
        const v = b / NY;   // 0 at the top edge, 1 on the street
        const out = 0.03 * Math.pow(v, 1.2) * (fold(z, side * 5) + 1) + 0.004;
        sp.push(side * (W + out), h * (1 - v), z);
        suv.push(z / 0.4, (h * (1 - v)) / 0.4);
      }
    }
    for (let a = 0; a < NZ; a++) for (let b = 0; b < NY; b++) {
      const p = a * (NY + 1) + b, q = p + 1, rr = p + NY + 1, t2 = rr + 1;
      sidx.push(p, q, rr, q, t2, rr);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(suv, 2));
    g.setIndex(sidx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    m.receiveShadow = true;
    scene.add(m);
  }
}

export const STOOL_HALF = 0.15;

function mat(color: number, rough = 0.55): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: rough });
}
function glassMat(color: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.06, transmission: 0.92, thickness: 0.03, ior: 1.5 });
}
/** a cylinder standing on y = y0 */
function cyl(r: number, h: number, m: THREE.Material, y0 = 0, seg = 28, rTop = r): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), m);
  mesh.position.y = y0 + h / 2;
  return mesh;
}

/** one plastic stool, its top at h */
export function stool(h: number, color: number): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color, 0.4);
  const top = new THREE.Mesh(new THREE.BoxGeometry(STOOL_HALF * 2, 0.025, STOOL_HALF * 2), m);
  top.position.y = h - 0.0125;
  g.add(top);
  const legH = h - 0.025, inset = STOOL_HALF - 0.025;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, legH, 0.03), m);
    leg.position.set(sx * inset, legH / 2, sz * inset);
    g.add(leg);
  }
  g.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  return g;
}

function build(kind: Kind): THREE.Group {
  const g = new THREE.Group();
  const s = SPEC[kind];
  switch (kind) {
    case 'tin':
      g.add(cyl(s.footR, s.height, mat(0x2f8f83, 0.35)), cyl(s.footR * 1.02, 0.02, mat(0xc9a23a, 0.3), s.height - 0.02));
      break;
    case 'jar':
      g.add(cyl(s.footR, s.height - 0.025, glassMat(0xff6a3a)), cyl(s.footR * 0.8, 0.025, mat(0xb8262c), s.height - 0.025));
      break;
    case 'soy':
    case 'soda': {
      const body = s.height * 0.62;
      const glass = glassMat(kind === 'soy' ? 0x6b3a1e : 0x4fae6a);
      g.add(cyl(s.footR, body, glass), cyl(s.footR, body * 0.18, glass, body, 28, 0.014), cyl(0.014, s.height - body * 1.18, glass, body * 1.18));
      break;
    }
    case 'cat': {
      const white = mat(0xf2ede4, 0.3);
      g.add(cyl(s.footR, s.height * 0.6, white, 0, 28, s.footR * 0.8));
      const head = new THREE.Mesh(new THREE.SphereGeometry(s.footR * 0.75, 24, 16), white);
      head.position.y = s.height * 0.6 + s.footR * 0.55;
      g.add(head);
      break;
    }
    case 'plush': {
      const p = new THREE.Mesh(new THREE.SphereGeometry(s.footR, 28, 16), mat(0xf4e6c8, 0.9));
      p.scale.y = s.height / (s.footR * 2);
      p.position.y = s.height / 2;
      g.add(p);
      break;
    }
    case 'mooncake':
      g.add(cyl(s.footR, s.height, mat(0xa8242a, 0.35), 0, 8), cyl(s.footR * 0.6, 0.004, mat(0xd9b04a, 0.3), s.height, 8));
      break;
    case 'cooker':
      g.add(cyl(s.footR, s.height * 0.8, mat(0xf5f2ea, 0.3)), cyl(s.footR * 0.92, s.height * 0.2, mat(0xe0dbd0, 0.3), s.height * 0.8, 28, s.footR * 0.5));
      break;
    default:   // a model is on its way (models.ts): a plain stand-in of the right size
      g.add(cyl(s.footR * 0.9, s.height, mat(0x8a8f99, 0.6)));
  }
  g.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  return g;
}

/** a round red paper mat with a thin gold ring, like the ones under things in a shop window: marks a prize's place */
let paperMat: THREE.MeshStandardMaterial | null = null;
function paperMatAt(r: number): THREE.Mesh {
  if (!paperMat) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#b3241f';
    g.beginPath(); g.arc(64, 64, 63, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d9b04a';
    g.lineWidth = 4;
    g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    paperMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, transparent: true, alphaTest: 0.5 });
  }
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, MAT_H, 40), paperMat);
  m.receiveShadow = true;
  return m;
}

/** every prize there is: each visit, twelve of the small ones are put out on the front three rows and the big ones
 *  along the back, in a fresh order */
// (out: the tea tin and the mooncake tin, their models never looked right)
const SMALL: Kind[] = ['plush', 'cat', 'dog', 'beer', 'controller', 'tatcat', 'bokchoy', 'mug',
  'soy', 'jar', 'panda', 'lunchbox', 'pup', 'dumpling'];
const BIG: Kind[] = ['dragon', 'cooker', 'record', 'ingot'];
/** a fresh order every visit */
function shuffled<T>(xs: readonly T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** the ones wanted first (not found yet: catalog.ts), in a fresh order, then the rest */
function pick(xs: readonly Kind[], wanted?: (k: Kind) => boolean): Kind[] {
  const a = shuffled(xs);
  return wanted ? [...a.filter(wanted), ...a.filter((k) => !wanted(k))] : a;
}

/** each slot's mat and whether it's on the back row (for putting something new out there: restock) */
const placed = new WeakMap<Slot, { mat: THREE.Mesh | null; big: boolean; step: number }>();

/** The stage and its prizes, added to the scene: each prize straight on its step, on a mat. Those not found yet
 *  (wanted) go out before the others. */
export function buildPrizes(scene: THREE.Scene, shuffle = true, wanted?: (k: Kind) => boolean): Slot[] {
  if (typeof document !== 'undefined') buildStage(scene);   // (not when the odds are tried out away from a page)
  const slots: Slot[] = [];
  let n = 0;
  const front = TIERS.slice(0, -1).flatMap((t) => t.kinds), back = TIERS[TIERS.length - 1].kinds;
  let order = shuffle
    ? [...pick(SMALL, wanted).slice(0, front.length), ...pick(BIG, wanted).slice(0, back.length)]
    : [...front, ...back];
  // dev: ?prizes=panda,jar,… puts those out first (front left to back right), to look at them
  const ask = typeof location !== 'undefined' && import.meta.env?.DEV ? new URLSearchParams(location.search).get('prizes') : null;
  if (ask) { const want = ask.split(',').filter((k): k is Kind => k in SPEC); order = [...want, ...order.filter((k) => !want.includes(k))].slice(0, order.length); }
  TIERS.forEach((row, ri) => row.xs.forEach((x, ci) => {
    const kind = order[n];
    const h = row.step + MAT_H;
    const z = row.z + 0.06 + ((ri * 7 + ci * 3) % 5 - 2) * 0.012;   // toward the front of the step (clear of the drape behind), a little out of line
    const s = SPEC[kind];
    let mat: THREE.Mesh | null = null;
    if (typeof document !== 'undefined') {
      mat = paperMatAt(s.footR + 0.035);
      mat.position.set(x, row.step + MAT_H / 2, z);
      scene.add(mat);
    }
    const prize: Prize = { id: `${kind}-${n++}`, kind, name: s.name, shop: '—', footR: s.footR, height: s.height, glass: !!s.glass, strict: !!s.strict };
    const group = build(kind);
    group.position.set(x, h, z);
    scene.add(group);
    const slot: Slot = { x, z, stoolH: h, stoolR: s.footR, prize, group, claimed: false };   // no stool: the prize itself is all there is to hit
    placed.set(slot, { mat, big: ri === TIERS.length - 1, step: row.step });
    slots.push(slot);
  }));
  return slots;
}

let restocked = 1000;
/**
 * Fill the places left empty by what's been won with something new: of those not out already, the one ranked first
 * (rank: lower first; main.ts puts what the player has never seen first, then what they haven't won), small ones in
 * front, big ones at the back. So playing on, sooner or later every prize comes out. Returns the slots filled (their
 * models to load: models.ts).
 */
export function restock(scene: THREE.Scene, slots: Slot[], rank: (k: Kind) => number): Slot[] {
  const filled: Slot[] = [];
  for (const slot of slots) {
    const at = placed.get(slot);
    if (!at || slot.prize) continue;
    const out = new Set(slots.map((x) => x.prize?.kind).filter(Boolean) as Kind[]);
    const pool = at.big ? BIG : SMALL;
    // (rank Infinity: never put out again, as for what the player has already won; then the place stays empty)
    const free = shuffled(pool).filter((k) => !out.has(k) && rank(k) < Infinity);
    if (!free.length) continue;
    const kind = free.reduce((a, b) => (rank(b) < rank(a) ? b : a));
    const s = SPEC[kind];
    // its own mat, its size
    if (at.mat) {
      scene.remove(at.mat);
      at.mat.geometry.dispose();
      at.mat = paperMatAt(s.footR + 0.035);
      at.mat.position.set(slot.x, at.step + MAT_H / 2, slot.z);
      scene.add(at.mat);
    }
    const group = build(kind);
    group.position.set(slot.x, at.step + MAT_H, slot.z);
    scene.add(group);
    slot.prize = { id: `${kind}-${restocked++}`, kind, name: s.name, shop: '—', footR: s.footR, height: s.height, glass: !!s.glass, strict: !!s.strict };
    slot.group = group;
    slot.stoolR = s.footR;
    slot.claimed = false;
    filled.push(slot);
  }
  return filled;
}
