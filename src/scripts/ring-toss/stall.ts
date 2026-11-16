// The owner: stands off to the left behind a waist-high stand, seen from the waist up (greybox: legs, a body in the
// jade vest, a head, until the real model comes), and talks through a terminal beside him: he listens to the game's
// events and picks a line from lines.ts.
import * as THREE from 'three';
import { on } from './events';
import { LINES, ASK, END, endMood, type Pool } from './lines';
import { speak } from './voice';
import type { Slot } from './prizes';

export interface Owner {
  x: number;
  z: number;
  /** below this he is legs, hidden behind his stand */
  hipH: number;
  /** the platform he stands on */
  floor: number;
  bodyR: number;
  bodyTop: number;
  head: THREE.Vector3;
  headY: number;
  headR: number;
  headTop: number;
}

/** where he stands: off to the left of the prizes, behind his stand, so you see him from the waist up */
const SPOT = { x: -1.5, z: -2.05 };
/** he stands on a low platform behind his stand, to be up level with the raised stage */
const LIFT = 0.32;
/** dx: its middle, to the left of hers: it keeps its left side (by the post, at x -1.95) and its right side just
 *  meets the stage's (the cloth's edge, at x -1.215: at 0.7 wide, centred on her, it went 5 cm into the steps) */
const STAND = { w: 0.635, dx: -0.0325, d: 0.4, h: 0.95 + LIFT, z: -1.7 };
export const STAND_TOP = STAND.h;

/** His laptop, open on the stand with its screen toward him: you see the back of the lid (space grey aluminium,
 *  no logo, a few stickers), and the screen lights his face from below. */
function laptop(top: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const alu = new THREE.MeshStandardMaterial({ color: 0x6f7175, metalness: 0.85, roughness: 0.34 });   // space grey
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.016, 0.25), alu);
  base.position.set(0, 0.007, 0);
  // the back of the lid, with stickers (drawn at twice the size, in 1024 x 680 units, so they stay sharp)
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1360;
  let s = c.getContext('2d')!;
  s.scale(2, 2);
  s.fillStyle = '#5d5f63';   // the lid: space grey aluminium
  s.fillRect(0, 0, 1024, 680);
  const INK = '#23401f', LIME = '#9ccc5a', PAPER = '#f7f3ea';
  /** a die-cut sticker: the shapes drawn once fat and in paper (its edge, with a little shadow under it), then as
   *  they are */
  const dieCut = (draw: (cut: boolean) => void, edge: number): void => {
    // the edge is drawn on a sheet of its own, then laid down with one shadow, so the overlaps don't darken
    const sheet = document.createElement('canvas');
    sheet.width = c.width; sheet.height = c.height;
    const o = sheet.getContext('2d')!;
    o.setTransform(s.getTransform());
    const main = s;
    s = o;
    s.fillStyle = s.strokeStyle = PAPER; s.lineWidth = edge; s.lineJoin = s.lineCap = 'round';
    draw(true);
    s = main;
    s.save();
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.shadowColor = 'rgba(0,0,0,0.35)'; s.shadowBlur = 16; s.shadowOffsetY = 6;
    s.drawImage(sheet, 0, 0);
    s.restore();
    s.save(); draw(false); s.restore();
  };

  // a little green alien, top left (stuck on first: the big one overlaps it)
  s.save();
  s.translate(150, 150);
  s.rotate(-0.22);
  const head = (): void => {
    s.beginPath();
    s.moveTo(0, 108);
    s.bezierCurveTo(-32, 102, -96, 34, -99, -18);
    s.bezierCurveTo(-102, -80, -56, -114, 0, -114);
    s.bezierCurveTo(56, -114, 102, -80, 99, -18);
    s.bezierCurveTo(96, 34, 32, 102, 0, 108);
    s.closePath();
  };
  const eye = (k: number): void => {
    s.beginPath();
    s.moveTo(k * 88, -24);
    s.bezierCurveTo(k * 42, -34, k * 12, 2, k * 9, 46);
    s.bezierCurveTo(k * 50, 46, k * 84, 20, k * 88, -24);
    s.closePath();
  };
  dieCut((cut) => {
    head();
    if (cut) { s.stroke(); s.fill(); return; }
    s.fillStyle = '#4fd47a'; s.fill();
    s.strokeStyle = '#111'; s.lineWidth = 8; s.stroke();
    s.fillStyle = '#111'; eye(-1); s.fill(); eye(1); s.fill();
  }, 30);
  s.restore();

  // the big one, in the middle, facing everyone who comes to the stall: and where to find him. Heavy italic
  // lettering, a hand-drawn swoosh, the address, and a pixel mouse pointer clicking on it.
  s.save();
  s.translate(545, 330);
  s.rotate(-0.06);
  const HEAVY = 'italic 800 132px "Avenir Next", "Nunito", "Futura", "Arial Black", sans-serif';
  const MONO = '800 70px "SF Mono", "Menlo", ui-monospace, monospace';   // the address: big enough to read across the stall
  // the pointer, as pixels: 1 ink, 2 paper
  const ARROW = [
    '1', '11', '121', '1221', '12221', '122221', '1222221', '12222221', '122222221', '1222222221',
    '12222222221', '122222211111', '1221221', '121.1221', '11..1221', '1....1221', '.....1221', '......11',
  ];
  const PX = 8.5, AX = 278, AY = 4;
  const pointer = (cut: boolean): void => {
    ARROW.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      if (!cut) s.fillStyle = ch === '1' ? INK : PAPER;
      s.fillRect(AX + x * PX, AY + y * PX, PX + 0.4, PX + 0.4);
      if (cut) s.strokeRect(AX + x * PX, AY + y * PX, PX, PX);
    }));
  };
  const swoosh = (): void => {
    s.beginPath();
    s.moveTo(-330, 128);
    s.bezierCurveTo(-200, 92, 40, 82, 175, 88);
  };
  dieCut((cut) => {
    s.textAlign = 'left';
    s.textBaseline = 'alphabetic';
    s.font = HEAVY;
    const text = (t: string, x: number, y: number, slant = 0): void => {
      s.save(); s.translate(x, y); s.transform(1, 0, -slant, 1, 0, 0);
      if (cut) s.strokeText(t, 0, 0);
      s.fillText(t, 0, 0);
      s.restore();
    };
    if (!cut) s.fillStyle = INK;
    text('Available', -345, -58, 0.2);
    text('for Hire', -322, 66, 0.2);
    if (!cut) { s.strokeStyle = LIME; s.lineCap = 'round'; }
    s.lineWidth = cut ? 20 + 64 : 20;
    swoosh(); s.stroke();
    s.lineWidth = cut ? 64 : 0;
    s.font = MONO;
    if (!cut) s.fillStyle = INK;
    text('www.siman.li', -262, 212);
    s.lineWidth = cut ? 64 : 0;
    pointer(cut);
    // the click: three short strokes off the pointer's tip
    s.lineCap = 'round';
    ([[262, -6, 250, -40, INK], [284, -16, 292, -52, LIME], [250, 18, 220, 12, INK]] as const).forEach(([x1, y1, x2, y2, col]) => {
      s.lineWidth = cut ? 64 : 9;
      if (!cut) s.strokeStyle = col;
      s.beginPath(); s.moveTo(x1, y1); s.lineTo(x2, y2); s.stroke();
    });
  }, 64);
  s.restore();

  // a developer's joke, bottom right ("works on my machine")
  s.save();
  s.translate(860, 612);
  s.rotate(0.08);
  s.fillStyle = '#1d1b17';
  s.beginPath();
  s.roundRect(-150, -46, 300, 92, 14);
  s.fill();
  s.fillStyle = '#3dff9a';
  s.font = '700 30px "Menlo", "SF Mono", ui-monospace, monospace';
  s.textAlign = 'center';
  s.textBaseline = 'middle';
  s.fillText('WORKS ON', 0, -16);
  s.fillText('MY STALL', 0, 20);
  s.restore();
  const back = new THREE.CanvasTexture(c);
  back.colorSpace = THREE.SRGBColorSpace;
  back.anisotropy = 8;
  const lidMats = [alu, alu, alu, alu, new THREE.MeshStandardMaterial({ map: back, metalness: 0.3, roughness: 0.45, emissive: 0xffffff, emissiveMap: back, emissiveIntensity: 0.22 }), new THREE.MeshBasicMaterial({ color: 0x0e1a14 })];
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.008), lidMats);   // +z face: the back, toward you
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.016, 0.125);   // the hinge is on the side away from him
  lid.position.set(0, 0.12, 0);
  hinge.rotation.x = 0.32;               // the lid leans back, toward you
  hinge.add(lid);
  g.add(base, hinge);
  g.traverse((o) => { o.castShadow = true; });
  g.position.set(-0.02, top, z - 0.02);   // (in from the stand's right edge)
  g.rotation.y = 0.12;
  return g;
}

/** The owner and his stand. The stand is returned as a slot with no prize: rings land on it or knock against it;
 *  figure is the greybox stand-in, hidden once the real model has loaded (owner.ts). */
export function buildOwner(scene: THREE.Scene): { owner: Owner; table: Slot; figure: THREE.Object3D } {
  const hipH = 0.9 + LIFT, bodyR = 0.19, bodyTop = 1.38 + LIFT, headR = 0.1, headY = 1.5 + LIFT;
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(STAND.w, STAND.h, STAND.d), new THREE.MeshStandardMaterial({ color: 0x5a3b28, roughness: 0.7 }));
  stand.position.set(STAND.dx, STAND.h / 2, STAND.z - SPOT.z);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, hipH - LIFT, 16), new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.9 }));
  legs.position.y = LIFT + (hipH - LIFT) / 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyR * 0.85, bodyR, bodyTop - hipH, 24), new THREE.MeshStandardMaterial({ color: 0x2e8b6a, roughness: 0.6 }));
  body.position.y = (hipH + bodyTop) / 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe8c4a0, roughness: 0.6 }));
  head.position.y = headY;
  const figure = new THREE.Group();
  figure.add(legs, body, head);
  g.add(stand, figure, laptop(STAND.h, STAND.z - SPOT.z));
  g.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  g.position.set(SPOT.x, 0, SPOT.z);
  scene.add(g);
  return {
    owner: {
      x: SPOT.x, z: SPOT.z, hipH, floor: LIFT, bodyR, bodyTop,
      head: new THREE.Vector3(SPOT.x, headY, SPOT.z), headY, headR, headTop: headY + headR,
    },
    table: { x: SPOT.x + STAND.dx, z: STAND.z, stoolH: STAND.h, stoolR: STAND.w / 2 - 0.05, prize: null, group: null, claimed: false },
    figure,
  };
}

export interface Talk {
  /** hold: nothing cuts in till it's been said in full (meanwhile only the latest line waits: said after, it's about
   *  what has just happened, not what happened before) */
  say(text: string, rank?: number, hold?: boolean): void;
  /** one line from a pool (not the one it said last) */
  line(pool: Pool, rank?: number, hold?: boolean): void;
  /** what his terminal shows between lines (your odds, or a nudge to buy); null to show nothing */
  status(text: string | null): void;
}

/** He talks through a little terminal beside him: each line types itself out, then the screen goes back to the
 *  status (your odds). Which events he answers, and how keen he is: a higher rank is not cut off by a lower one.
 *  spoken: a hidden element that screen readers hear (the lines only, not the odds changing as you aim). */
export function startTalking(term: HTMLElement, text: HTMLElement, spoken: HTMLElement, onLine?: () => void): Talk {
  let shownAt = 0, shownRank = 0, timer = 0, typing = 0;
  let current: string | null = null;
  const last = new Map<Pool, string>();
  /** a line being said that nothing may cut into (say's hold), and what's waiting for it to be over */
  let holding = false;
  let waiting: { t: string; rank: number } | null = null;

  const show = (t: string | null): void => {
    term.classList.toggle('is-on', !!t);
    if (t) text.textContent = t;
  };
  const type = (t: string): void => {
    clearInterval(typing);
    let i = 0;
    term.classList.add('is-on', 'is-typing');
    text.textContent = '';
    typing = window.setInterval(() => {
      i += 1;
      text.textContent = t.slice(0, i);
      if (i >= t.length) { clearInterval(typing); term.classList.remove('is-typing'); }
    }, 24);
  };
  const say = (t: string, rank = 1, hold = false): void => {
    if (holding) { waiting = { t, rank }; return; }
    const now = performance.now();
    if (rank < shownRank && now - shownAt < 1800) return;
    holding = hold;
    shownAt = now;
    shownRank = rank;
    spoken.textContent = t;
    onLine?.();
    type(t);
    const done = (): void => {
      shownRank = 0; clearInterval(typing); term.classList.remove('is-typing'); show(current);
      if (hold) { holding = false; const w = waiting; waiting = null; if (w) say(w.t, w.rank); }
    };
    clearTimeout(timer);
    timer = window.setTimeout(done, 2600 + t.length * 45);
    // when it's recorded, the words stay up as long as she's saying them, and a little after
    speak(t, (ms) => { if (shownAt === now) { clearTimeout(timer); timer = window.setTimeout(done, Math.max(ms + 900, t.length * 24 + 1200)); } });
  };
  const status = (t: string | null): void => {
    if (t === current) return;
    current = t;
    if (shownRank === 0) show(t);
  };
  /** say one of a pool's lines (if the dice say so): true if it was said */
  const pick = (pool: Pool, rank = 1, chance = 1, only?: readonly number[], hold = false): boolean => {
    if (!holding && Math.random() > chance) return false;   // (while a held line's said, every one: the last of them is the one said after)
    const lines = only ? only.map((i) => LINES[pool][i]) : LINES[pool];
    const options = lines.length > 1 ? lines.filter((l) => l !== last.get(pool)) : lines;
    const line = options[Math.floor(Math.random() * options.length)];
    last.set(pool, line);
    say(line, rank, hold);
    return true;
  };

  // the misses: she gets a dig in now and then, and mostly just watches you throw (it was nearly every miss, two
  // lines for some). After one, the next GRUMBLE_REST throws go by without; and each only by chance. A run of misses
  // still gets her at its milestones (the 5th: she offers the ad, main.ts). The wins, she always has something for
  const GRUMBLE_REST = 2;
  let sinceGrumble = Infinity;   // throws since she last said something about a miss
  on('throw', () => { sinceGrumble++; });
  const grumble = (pool: Pool, rank: number, chance: number): void => {
    if (sinceGrumble <= GRUMBLE_REST && !holding) return;
    if (pick(pool, rank, chance)) sinceGrumble = 0;
  };
  const milestone = (streak: number): boolean => streak > 0 && streak % 8 === 0;   // the 8th, 16th… (the 5th is the ad's)

  on('coin', ({ method, both }) => pick(both ? 'payBoth' : method === 'cash' ? 'payCash' : 'payTap', 2));
  on('miss', ({ streak }) => { if (milestone(streak)) { pick('missStreak', 2); sinceGrumble = 0; } else grumble('miss', 1, 0.25); });
  on('near', ({ streak }) => { if (milestone(streak)) { pick('missStreak', 2); sinceGrumble = 0; } else grumble('near', 2, 0.5); });
  on('clink', ({ prize }) => { if (prize.glass) grumble('clink', 1, 0.3); });
  on('win', ({ prize, streak, last }) => {
    if (last) return;   // the very last: she says only her line about that (complete)
    if (prize.kind === 'controller') pick('mine', 3);
    else if (prize.strict) pick('jackpot', 3);
    else if (streak < 2) pick('win', 3);
  });
  on('streak', () => pick('streak', 3));
  on('owner', () => pick('owner', 4));
  // standing there: before paying at all, her pitch again (her recorded opening lines, not the hellos); with rings
  // in hand, a dig; out of rings, a nudge to buy more
  on('idle', ({ rings, paid, say }) => { if (say) (!paid && rings === 0 ? pick('open', 1, 1, [2, 3, 4]) : pick(rings > 0 ? 'idle' : 'empty', 1)); });
  on('empty', ({ wins }) => pick('end', 2, 1, END[endMood(wins)]));
  // after the line about how you paid has had its moment
  // (something never seen before: always the auntie's basement, the funnier of the two)
  on('restock', ({ unseen }) => window.setTimeout(() => (unseen ? pick('restockNew', 2, 1, [1]) : pick('restock', 2)), 2600));
  // the moment the last one is won: the LinkedIn line, and only that (no line about the win itself first)
  on('complete', () => window.setTimeout(() => pick('complete', 5, 1, [0]), 700));   // (the LinkedIn one, said straight off: no line about the win before it)
  // three left to find, then the last one: after the line about the win itself
  on('closing', ({ left }) => { if (left === 3 || left === 1) window.setTimeout(() => pick(left === 1 ? 'lastOne' : 'closing', 4), 1800); });
  on('ask', ({ id }) => {
    const a = ASK.find((q) => q.id === id)?.a;
    if (a) say(a[Math.floor(Math.random() * a.length)], 5);
  });
  return { say, status, line: (pool, rank = 1, hold = false) => pick(pool, rank, 1, undefined, hold) };
}
