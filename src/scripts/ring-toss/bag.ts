// What you win goes home in a bag: Siman's LUCKY 88 paper carrier (kraft paper, red rope handles; a Tripo model,
// _source/prizes/paper-bag/). It stands open on the counter, right of the card reader, and fills up: the top of each
// prize shows over its rim.
import * as THREE from 'three';
import { loadProp } from './models';

/** the whole bag, handles and all, is this tall (m); the paper part ends at RIM of that. It narrows toward the top:
 *  at the rim it's about W across and only DEEP front to back (measured from the model), so that's what a prize
 *  has to fit inside */
const HEIGHT = 0.42;
const RIM = HEIGHT * 0.72;
const W = HEIGHT * 0.66, DEEP = HEIGHT * 0.31;

/** kraft paper's grain: fine fibres running mostly one way, and a few soft creases (a bump map, tiled) */
function grain(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, l = 3 + Math.random() * 10, a = (Math.random() - 0.5) * 0.5;
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    g.lineWidth = 0.6 + Math.random() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 6; i++) {   // creases
    const x = Math.random() * 256;
    const cr = g.createLinearGradient(x - 6, 0, x + 6, 0);
    cr.addColorStop(0, 'rgba(0,0,0,0)'); cr.addColorStop(0.5, 'rgba(0,0,0,0.25)'); cr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cr;
    g.fillRect(x - 6, 0, 12, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}

export interface Bag {
  group: THREE.Group;
  /** where the next prize goes in, in the world, and how big it is drawn there (a share of its size on the stand) */
  slot(height: number, footR: number): { at: THREE.Vector3; scale: number; tilt: number };
  /** one more inside: the bag gives a little shake (the caller plays the sound) */
  drop(): void;
  update(dt: number): void;
}

export function buildBag(scene: THREE.Scene, x: number, top: number, z: number): Bag {
  const group = new THREE.Group();
  group.position.set(x, top, z);
  group.rotation.y = -0.35;   // turned a little toward you
  const body = new THREE.Group();   // what shakes
  group.add(body);
  loadProp('paper-bag', HEIGHT, (m) => {
    // paper, not glazed: no shine and no reflection, a dry matte face with a little grain to it
    const bump = grain();
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      Object.assign(mat, { roughness: 1, roughnessMap: null, metalness: 0, metalnessMap: null, envMapIntensity: 0.12, bumpMap: bump, bumpScale: 0.6 });
      mat.normalScale.set(0.25, 0.25);   // the model's own bumps made the print look embossed, like leather: ink lies flat
      mat.color.setScalar(0.92);
      mesh.material = mat;
    });
    body.add(m);
  });
  scene.add(group);

  // where each prize stands in the bag: [across (share of W), front to back (share of DEEP), how much lower, lean].
  // Three at the back, then two in front, lower, between them, so the back ones show over them; the ones at the
  // sides lean out a little, as things stuffed in a bag do. Past five, round again, each round a little higher.
  const PLACES: [number, number, number, number][] = [
    [0, -0.2, 0, 0.03],
    [-0.25, -0.16, 0.008, 0.14],
    [0.25, -0.16, 0.008, -0.14],
    [-0.12, 0.22, 0.045, 0.06],
    [0.12, 0.22, 0.045, -0.07],
  ];
  let taken = 0, wobble = 0;
  return {
    group,
    slot(height, footR) {
      // drawn smaller and stuffed in standing up, so the top of each shows over the rim: you see what you've won.
      // Small enough that neighbours don't run into each other (front to back is the tight way). The place is taken
      // now, when it starts to fall, not when it lands: two won together mustn't both get the same one.
      const n = taken++;
      const [ax, az, down, tilt] = PLACES[n % PLACES.length];
      const scale = Math.min(0.5, (RIM * 0.75) / height, (DEEP * 0.26) / footR);
      const shown = height * scale;
      const base = Math.max(0.005, RIM - shown * 0.6 - down + Math.floor(n / PLACES.length) * 0.015);   // its top ~40% over the rim
      const local = new THREE.Vector3(ax * W, base, az * DEEP);
      return { at: group.localToWorld(local), scale, tilt };
    },
    drop() { wobble = 1; },
    update(dt) {
      wobble = Math.max(0, wobble - dt * 2.5);
      const w = Math.sin(wobble * 18) * wobble;
      body.rotation.z = w * 0.04;
      body.scale.set(1 + w * 0.02, 1 - w * 0.015, 1 + w * 0.02);
    },
  };
}
