// Paying is how the game starts. Two things on the counter: on the left a cash tin, on the right the card reader.
// Click one (or its label, which is a real button for the keyboard). Both work and both are fun, at their own
// pace: cash goes in the tin and he counts out your change; tap beeps, ripples and prints a receipt at once.
// The receipt is also how a round ends: what you threw, what you won.
import * as THREE from 'three';
import { beep, coins, holy, wakeReader, wakeTin } from './sound';

export type Method = 'cash' | 'tap';

export interface PayOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  canvas: HTMLCanvasElement;
  /** the card reader on the counter, and its screen */
  reader: THREE.Object3D;
  screen: THREE.MeshBasicMaterial;
  counterTop: number;
  cashButton: HTMLButtonElement;
  tapButton: HTMLButtonElement;
  receipt: HTMLElement;
  /** the end-of-round receipt, printed in the middle of the screen over a blurred stall, and the veil behind it */
  summary: HTMLElement;
  veil: HTMLElement;
  /** nothing in your hand and nothing in the air */
  canPay(): boolean;
  /** the moment you pay: he reacts */
  begin(m: Method): void;
  /** you've just pointed at one of the two (once per time you move onto it) */
  /** pointing at a way to pay: on the stall (the tin, the reader, their labels) or on the end-of-round receipt */
  hovered?(m: Method, from: 'stall' | 'receipt'): void;
  /** the rings are yours */
  done(m: Method): void;
  /** while you choose how to pay, how far into the spotlit choosing it is (0 none … 1): the stall dims by it */
  staging?(k: number): void;
}

export interface Pay {
  update(): void;
  /** print a small receipt at the bottom right (lines of text), for a while or until dismissed */
  print(lines: string[], linger?: number): void;
  /** the end of a round: the receipt prints in the middle of the screen, the stall blurs behind it, and it
   *  offers the two ways to pay again */
  summary(lines: string[]): void;
}

const BLURPLE = 0x635bff;
const TIN_AT = new THREE.Vector3(-0.48, 0, 0.12);   // y: on the counter (in toward the middle)
const TIN = 1.15;   // drawn at a real tin's size, shown this much bigger, so it reads from where you stand (less than the reader now)

/** the tin's paper label: CASH ONLY, with the ONLY crossed out in marker (like the banner over the stall) */
function label(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efe4c8';
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#a82a24';
  g.textAlign = 'center';
  g.font = '700 96px "Futura", "Arial Black", sans-serif';   // both words in one face and size
  g.fillText('CASH', 256, 104);
  g.fillText('ONLY', 256, 208);
  // the marker: two quick strokes through ONLY, a little crooked
  g.strokeStyle = '#1d1b17';
  g.lineCap = 'round';
  g.lineWidth = 15;
  g.beginPath(); g.moveTo(128, 180); g.lineTo(386, 168); g.stroke();
  g.lineWidth = 10;
  g.beginPath(); g.moveTo(138, 194); g.lineTo(378, 184); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** a red tin with a slot in the lid and a paper label: CASH ~~ONLY~~ */
function buildTin(top: number): THREE.Group {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xb8262c, roughness: 0.35, metalness: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a23a, roughness: 0.3, metalness: 0.85 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.1, 32), red);
  body.position.y = 0.05;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.012, 32), gold);
  rim.position.y = 0.1;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.008), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  slot.position.y = 0.107;
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.0655, 0.0655, 0.062, 32, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: label(), roughness: 0.9 }));
  paper.position.y = 0.05;
  g.add(body, rim, slot, paper);
  g.traverse((o) => { o.castShadow = true; });
  g.position.set(TIN_AT.x, top, TIN_AT.z);
  g.rotation.y = 0.25;
  g.scale.setScalar(TIN);
  return g;
}

/** a five, as a plain green note (not a copy of any real one) */
function buildBill(): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 112;
  const g = c.getContext('2d')!;
  g.fillStyle = '#9fb592';
  g.fillRect(0, 0, 256, 112);
  g.strokeStyle = '#4c6a45';
  g.lineWidth = 6;
  g.strokeRect(8, 8, 240, 96);
  g.fillStyle = '#3d5a37';
  g.font = '700 64px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('5', 128, 78);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 }));
  m.visible = false;
  return m;
}

export function setupPay(o: PayOptions): Pay {
  const tin = buildTin(o.counterTop);
  o.scene.add(tin);
  const bill = buildBill();
  o.scene.add(bill);

  // the reader's ripple: a blurple ring that spreads from the contactless sign on its face and fades
  const rippleMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
  rippleMat.color.set(BLURPLE).multiplyScalar(2);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.025, 48), rippleMat);
  ripple.position.set(-0.008, -0.002, 0.0125);   // on the reader's face, at the contactless sign
  ripple.visible = false;
  o.reader.add(ripple);
  const SCREEN = o.screen.color.clone();

  // The choosing, lit like a stage: while you can pay, the stall dims a little and two spotlights come down from above,
  // one on each, both warm: on the cash tin a tired old bulb, dim and deep yellow, never steady, every few seconds all but
  // going out; on the reader a cleaner, whiter warm light, strong and steady, just breathing. Pointing at
  // one brings its light up. Each has a faint shaft of light in the air, so you see the beams.
  const shaftTex = ((): THREE.CanvasTexture => {   // bright at the lamp, gone by the counter
    const c = document.createElement('canvas'); c.width = 4; c.height = 128;
    const g = c.getContext('2d')!, grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
  })();
  const dot = ((): THREE.CanvasTexture => {   // a soft round mote, not a square
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d')!, rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.4, 'rgba(255,255,255,0.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  type Spot = { light: THREE.SpotLight; shaft: THREE.MeshBasicMaterial; cone: THREE.Mesh; motes: THREE.Points; moteMat: THREE.PointsMaterial; on: THREE.Vector3; top: THREE.Vector3 };
  const spot = (color: number, on: THREE.Vector3): Spot => {
    const H = 2.4, ANGLE = 0.13;   // the lamp this far above the thing (out of sight above the top of the view), a little in front; narrow, so the pool of light is the same size
    const light = new THREE.SpotLight(color, 0, 4.5, ANGLE, 0.55, 1.4);
    light.position.set(0, on.y + H, on.z + 0.25);   // both from one point, high over the middle of the counter: two beams out of one lamp, a V
    light.target.position.copy(on);
    o.scene.add(light, light.target);
    const shaft = new THREE.MeshBasicMaterial({ color, map: shaftTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const len = light.position.distanceTo(on), cone = new THREE.Mesh(new THREE.CylinderGeometry(0.003, Math.tan(ANGLE) * len * 0.5, len, 32, 1, true), shaft);
    cone.position.copy(light.position).add(on).multiplyScalar(0.5);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), light.position.clone().sub(on).normalize());
    o.scene.add(cone);
    // dust in the beam, as in a shaft of sun through a window: many tiny motes, drifting slowly every which way, each
    // catching the light and losing it. Seen faintly while you choose, and fully when it's chosen
    const N = 150, pts = new Float32Array(N * 3), cols = new Float32Array(N * 3);
    const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)).setAttribute('color', new THREE.BufferAttribute(cols, 3)),
      new THREE.PointsMaterial({ color, size: 0.0045, map: dot, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    // each: where along the beam (0 at the thing … up toward the lamp), its angle round, how far out, and its own pace
    motes.userData.phase = Array.from({ length: N }, () => [Math.random(), Math.random() * Math.PI * 2, Math.random(), 0.5 + Math.random(), Math.random() * 10]);
    motes.frustumCulled = false;
    o.scene.add(motes);
    return { light, shaft, cone, motes, moteMat: motes.material as THREE.PointsMaterial, on, top: light.position.clone() };
  };
  /** the chosen one, as it's chosen: a moment of grace. Its beam swells and brightens, warm and steady (the old
   *  bulb too: it holds, for once), motes rise in it, a soft chord; then it all settles away. k: 0 … 1 … 0 */
  const grace = (sp: Spot, k: number, sec: number): void => {
    sp.cone.scale.set(1 + 0.9 * k, 1, 1 + 0.9 * k);
    sp.moteMat.opacity = 0.9 * k;
    const pos = sp.motes.geometry.attributes.position as THREE.BufferAttribute;
    const col = sp.motes.geometry.attributes.color as THREE.BufferAttribute;
    (sp.motes.userData.phase as number[][]).forEach(([u, a, r, pace, ph], i) => {
      // slow: a few millimetres a second, up a little, round a little, wandering
      const f = (u + sec * 0.012 * pace + Math.sin(sec * 0.3 * pace + ph) * 0.01 + 1) % 1 * 0.85;
      const at = sp.on.clone().lerp(sp.top, f);
      const ang = a + sec * 0.05 * pace + Math.sin(sec * 0.2 + ph) * 0.3;
      const rad = (1 - f) * 0.15 * Math.sqrt(r) * (1 + 0.9 * k);
      pos.setXYZ(i, at.x + Math.cos(ang) * rad, at.y + Math.sin(sec * 0.5 * pace + ph) * 0.004, at.z + Math.sin(ang) * rad);
      const glint = Math.sin(sec * 0.9 * pace + ph * 3) ** 2;   // catching the light, and losing it
      const b = 0.15 + 0.85 * glint * glint;
      col.setXYZ(i, b, b, b);
    });
    col.needsUpdate = true;
    pos.needsUpdate = true;
  };
  const tinTop = new THREE.Vector3(TIN_AT.x, o.counterTop + 0.08, TIN_AT.z);
  const readerAt = new THREE.Vector3();
  o.reader.updateWorldMatrix(true, false);
  o.reader.getWorldPosition(readerAt);
  // both warm, the same family of light: the old bulb a deep yellow; the reader's a cleaner, whiter warm, and stronger
  const cashSpot = spot(0xffa040, tinTop), tapSpot = spot(0xffdcaa, readerAt);
  const SPOT = 16, TAP_MORE = 1.08;
  let staged = 0, flickerUntil = 0, dip = 1;
  let chosen: Method | null = null, chosenAt = 0;

  let busy = false;
  let t = 0;
  let startAt = 0;          // by the clock, so a few slow frames don't stall a payment
  let rattled = false, changed = false;
  let flow: Method | null = null;
  let finished = false;
  let receiptTimer = 0;
  const billFrom = new THREE.Vector3(-0.3, 1.15, 1.0);   // from your hand, just in front of you
  const slot = new THREE.Vector3(TIN_AT.x, o.counterTop + 0.11 * TIN + 0.02, TIN_AT.z);

  const pay = (m: Method): void => {
    if (busy || !o.canPay()) return;
    busy = true;
    flow = m;
    t = 0;
    startAt = performance.now();
    finished = false;
    rattled = changed = false;
    o.receipt.classList.remove('is-on');
    closeSummary();
    o.begin(m);
    if (m === 'tap') beep();
    chosen = m; chosenAt = performance.now();
    holy();
  };

  // clicking the things themselves
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = (e: PointerEvent): Method | null => {
    const r = o.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, o.camera);
    if (ray.intersectObject(tin, true).length) return 'cash';
    if (ray.intersectObject(o.reader, true).length) return 'tap';
    return null;
  };
  let hover: Method | null = null;
  o.canvas.addEventListener('pointermove', (e) => {
    const was = hover;
    hover = o.canPay() && !busy ? hit(e) : null;
    if (hover && hover !== was) { o.hovered?.(hover, 'stall'); if (hover === 'tap') wakeReader(); else wakeTin(); }
    o.canvas.classList.toggle('is-point', hover !== null);   // the game's pointing hand (the page's CSS)
  });
  o.canvas.addEventListener('pointerdown', (e) => {
    const m = o.canPay() && !busy ? hit(e) : null;
    if (m) pay(m);
  });
  o.cashButton.addEventListener('click', () => pay('cash'));
  o.tapButton.addEventListener('click', () => pay('tap'));
  // pointing at a label is pointing at its thing: the same glow on both
  let onLabel: Method | null = null;
  for (const [b, m] of [[o.cashButton, 'cash'], [o.tapButton, 'tap']] as const) {
    b.addEventListener('pointerenter', () => { onLabel = m; o.hovered?.(m, 'stall'); if (m === 'tap') wakeReader(); else wakeTin(); });
    b.addEventListener('pointerleave', () => { if (onLabel === m) onLabel = null; });
  }
  // how lit each one is (0-1): eased toward where the pointer is, so the glow comes up and goes down, not on and off
  let cashK = 0, tapK = 0, lastT = performance.now();
  o.receipt.addEventListener('click', () => o.receipt.classList.remove('is-on'));

  const closeSummary = (): void => {
    o.summary.classList.remove('is-on');
    o.veil.classList.remove('is-on');
  };
  const summary = (lines: string[]): void => {
    o.summary.querySelector('pre')!.textContent = lines.join('\n');
    o.receipt.classList.remove('is-on');
    o.summary.classList.add('is-on');
    o.veil.classList.add('is-on');
    // the focus on the receipt itself, not on Tap (which then wore a focus ring for no reason); Tab goes on from there
    o.summary.tabIndex = -1;
    o.summary.focus({ preventScroll: true });
  };
  o.veil.addEventListener('click', closeSummary);
  // the receipt's own Cash and Tap: the same sounds as the tin and the reader, and she notices the cash
  o.summary.querySelectorAll<HTMLButtonElement>('[data-pay]').forEach((b) => b.addEventListener('pointerenter', () => {
    const m = b.dataset.pay as Method;
    o.hovered?.(m, 'receipt');
    if (m === 'tap') wakeReader(); else wakeTin();
  }));
  o.summary.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    if (b.dataset.pay === 'cash' || b.dataset.pay === 'tap') pay(b.dataset.pay);
    else closeSummary();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSummary(); });

  const print = (lines: string[], linger = 0): void => {
    o.receipt.querySelector('pre')!.textContent = lines.join('\n');
    o.receipt.classList.add('is-on');
    clearTimeout(receiptTimer);
    if (linger) receiptTimer = window.setTimeout(() => o.receipt.classList.remove('is-on'), linger * 1000);
  };

  // the labels float over the two things while you can pay
  const at = new THREE.Vector3();
  const place = (b: HTMLElement, p: THREE.Vector3, show: boolean): void => {
    at.copy(p).project(o.camera);
    b.style.transform = `translate(${Math.round((at.x + 1) / 2 * innerWidth)}px, ${Math.round((1 - at.y) / 2 * innerHeight)}px) translate(-50%, -100%)`;
    b.classList.toggle('is-on', show);
    b.tabIndex = show ? 0 : -1;
  };
  const readerTop = new THREE.Vector3();

  return {
    print,
    summary,
    update() {
      const show = o.canPay() && !busy;
      place(o.cashButton, slot.clone().setY(o.counterTop + 0.11 * TIN + 0.09), show);
      o.reader.getWorldPosition(readerTop).setY(o.counterTop + 0.2);
      place(o.tapButton, readerTop, show);
      // a glow on whichever you're pointing at, coming up and going down over about a fifth of a second
      const now = performance.now(), dtMs = Math.min(100, now - lastT), ease = 1 - Math.exp(-dtMs / 70);
      lastT = now;
      const pointing = show ? onLabel ?? hover : null;
      cashK += ((pointing === 'cash' ? 1 : 0) - cashK) * ease;
      tapK += ((pointing === 'tap' ? 1 : 0) - tapK) * ease;
      o.cashButton.classList.toggle('is-hover', pointing === 'cash');
      o.tapButton.classList.toggle('is-hover', pointing === 'tap');
      // the stage: up while you can choose, down once you have
      staged += ((show ? 1 : 0) - staged) * (1 - Math.exp(-dtMs / 400));   // over about a second
      o.staging?.(staged);
      const sec = now / 1000;
      // the old bulb: about as bright as the other, but on a bad current. It trembles a little all the time, and every
      // few seconds it stutters: a run of quick drops, uneven, as the current catches and slips, then holds again
      if (sec > flickerUntil && Math.random() < 0.015) { flickerUntil = sec + 0.12 + Math.random() * 0.45; }
      if (sec < flickerUntil && Math.random() < 0.35) dip = 0.25 + Math.random() * 0.5;
      dip += (1 - dip) * (1 - Math.exp(-dtMs / 45));
      const old = 0.92 * (1 + Math.sin(sec * 9.3) * 0.03 + (Math.random() - 0.5) * 0.06) * dip;
      const fresh = 1 + Math.sin(sec * 1.6) * 0.03;
      // grace on the one chosen: up in a quarter second, held, and gone by about two and a half
      const since = (now - chosenAt) / 1000;
      const g = !chosen ? 0 : since < 0.25 ? since / 0.25 : since < 1.1 ? 1 : Math.max(0, 1 - (since - 1.1) / 1.4);
      if (chosen && g === 0 && since > 1) chosen = null;
      const gc = chosen === 'cash' ? g : 0, gt = chosen === 'tap' ? g : 0;
      const oldNow = old + (1 - old) * gc;   // the old bulb holds steady in its moment
      cashSpot.light.intensity = SPOT * Math.max(staged * oldNow * (1 + 0.35 * cashK), 3.2 * gc);
      tapSpot.light.intensity = SPOT * TAP_MORE * Math.max(staged * fresh * (1 + 0.35 * tapK), 2.6 * gt);
      cashSpot.shaft.opacity = Math.max(0.065 * staged * oldNow * (1 + 0.5 * cashK), 0.2 * gc);
      tapSpot.shaft.opacity = Math.max(0.065 * TAP_MORE * staged * fresh * (1 + 0.5 * tapK), 0.2 * gt);
      // and a little of it all the while you're choosing: a few motes in each beam, the beams a touch wider (more on the
      // one you point at)
      const hush = 0.28 * staged;
      grace(cashSpot, Math.max(gc, hush * (1 + 0.6 * cashK)), sec);
      grace(tapSpot, Math.max(gt, hush * (1 + 0.6 * tapK)), sec);
      const red = tin.children[0] as THREE.Mesh;
      (red.material as THREE.MeshStandardMaterial).emissive.setRGB(0x40 / 255 * cashK, 0x10 / 255 * cashK, 0x10 / 255 * cashK);
      if (!flow) {
        const idle = show ? 1 + Math.sin(now / 300) * 0.2 : 0.7;
        o.screen.color.copy(SCREEN).multiplyScalar(idle + (1.6 - idle) * tapK);
        return;
      }
      t = (performance.now() - startAt) / 1000;
      if (flow === 'tap') {
        // beep (already), ripple out, the screen flashes, the rings are yours, a receipt prints
        const k = Math.min(1, t / 0.6);
        ripple.visible = k < 1;
        ripple.scale.setScalar(1 + k * 4);
        rippleMat.opacity = 1 - k;
        o.screen.color.copy(SCREEN).multiplyScalar(1 + (1 - k) * 2);
        if (!finished && t > 0.35) {
          finished = true;
          o.done('tap');
          print([
            'LUCKY 88 · RING TOSS',
            '   Mott St · est. 2026',
            '',
            '10 RINGS ............ $5.00',
            'PAID ............. TAP ✓',
            'ODDS ...... QUESTIONABLE',
            '',
            'No refunds. Some regrets.',
          ], 6);
        }
        if (t > 0.7) { flow = null; busy = false; ripple.visible = false; }
      } else {
        // the note flies from your hand into the tin, the tin rattles, he counts out change
        const k = Math.min(1, t / 0.7);
        const e = k * k * (3 - 2 * k);
        bill.visible = k < 1;
        bill.position.lerpVectors(billFrom, slot, e);
        bill.position.y += Math.sin(e * Math.PI) * 0.12;
        bill.rotation.set(-Math.PI / 2 + e * 1.2, e * 2, 0);
        if (t > 0.7 && !rattled) { rattled = true; coins(3); }
        tin.rotation.z = t > 0.7 && t < 1.2 ? Math.sin((t - 0.7) * 50) * 0.04 * (1.2 - t) * 2 : 0;
        if (t > 1.3 && !changed) { changed = true; coins(4, 0.18); }   // your change, coin by coin
        if (!finished && t > 2.0) { finished = true; o.done('cash'); }
        if (t > 2.1) { flow = null; busy = false; bill.visible = false; }
      }
    },
  };
}
