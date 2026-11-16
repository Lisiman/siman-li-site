// [No more] Cash Only: ring toss on a Chinatown street at night. This file runs the game: the counter and the
// rings in your hand, throwing, what happens when a ring lands, and the events the rest of the game listens to.
// The street, lights and sign are scene.ts; the glow and grain post.ts; the stage and prizes prizes.ts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { emit, onAny } from './events';
import { pointerInput, HINT, type Toss } from './input';
import { buildPrizes, restock, type Slot, type Kind } from './prizes';
import { CATALOG, entry, no, find, isFound, foundCount } from './catalog';
import { thumbs } from './thumbs';
import { Ring, setRounds, setLuck, BIG, type Luck, HAND, HAND_SWAY, MID, TUBE, COLORS, type Result } from './ring';
import { setupAd, adWatched, AD_AFTER, AD_REWARD } from './ad';
import { buildOwner, startTalking, STAND_TOP } from './stall';
import { oddsJob } from './odds';
import { STATUS, LINES } from './lines';
import { setupPay, type Method } from './pay';
import { stamp, plop, press, wake, clank, rustle, soundOn, key, glitch, hover, streetLevel, bulb, buzz, mute } from './sound';
import { playOpening } from './opening';
import { buildBag } from './bag';
import { wakeVoice, muteVoice } from './voice';
import { buildWorld, LIGHT_UP, BULB_SWITCHES } from './scene';
import { makePost } from './post';
import { loadOwner, type OwnerFigure } from './owner';
import { loadPrizeModels, loadDecor, preloadPrizes } from './models';
import { watchLoading } from './loading';
import { makeStudio } from './studio';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('rt-canvas');
const hintEl = $('rt-hint'), powerEl = $('rt-power');
const bulbs = [...powerEl.querySelectorAll('i')];
const cashEl = $<HTMLButtonElement>('rt-pay-cash'), tapEl = $<HTMLButtonElement>('rt-pay-tap'), receiptEl = $('rt-receipt');
const summaryEl = $('rt-summary'), veilEl = $('rt-veil');
const termEl = $('rt-term'), termText = $('rt-term-text'), spokenEl = $('rt-spoken');
// the dev log of events (top left): only with ?log in the address
const logEl = new URLSearchParams(location.search).has('log') ? document.getElementById('rt-log') : null;
if (!logEl) document.getElementById('rt-log')?.remove();

// --- the scene --------------------------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// how sharp it draws: as sharp as the screen up to 2×, then lower by itself if frames keep taking too long (and back
// up when there's room), so it stays smooth on any machine. Never below 1.5× on a retina screen: at 1× it's blurry.
const MAX_PR = Math.min(devicePixelRatio, 2);
const MIN_PR = devicePixelRatio >= 2 ? 1.5 : 1;
let prCap = MAX_PR, prCapUntil = 0;   // after it had to come down, it doesn't climb straight back to where it was slow
let pixelRatio = MAX_PR;
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // redrawn every other frame (main loop): nothing moves fast enough to show it
renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the toys' colours true, where ACES greys and darkens them

const scene = new THREE.Scene();
/** dev only: set at and look to hold the camera somewhere else (to look closely at something) */
const devView: { at?: THREE.Vector3; look?: THREE.Vector3 } = {};
const world = buildWorld(scene, renderer);

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
if (import.meta.env.DEV) (window as unknown as { __rt: unknown }).__rt = { scene, renderer, camera, view: devView, THREE, world };   // for measuring
// you stand at the counter, a step back from it, looking down over it at the prizes. The opening walks you up to
// it from out in the street.
// a long lens from a step back: near and far come out at much the same size, the stall square-on and filling the view
const FOV = 30;
const STAND_AT = new THREE.Vector3(-0.12, 1.55, 3.1), STREET_AT = new THREE.Vector3(0, 1.8, 6.2), LOOK_AT = new THREE.Vector3(-0.12, 1.2, -3.0);
camera.position.copy(STREET_AT);
camera.lookAt(LOOK_AT);

const post = makePost(renderer, scene, camera);

// the loading line, watching before anything starts to download (loading.ts)
const loading = watchLoading($('rt-load'));
const slots = buildPrizes(scene, true, (k) => !isFound(k));   // what you haven't found yet goes out first
/** every prize the player has seen on the stand (this visit, and any they've won before) */
const shown = new Set<Kind>(CATALOG.map((e) => e.kind).filter((k) => isFound(k)));
slots.forEach((s) => s.prize && shown.add(s.prize.kind));
makeStudio(renderer);
loadPrizeModels(slots);
loadDecor(scene);
const { owner, table, figure } = buildOwner(scene);
slots.push(table);   // his table: rings land on it like a stool with nothing on it
let figureModel: OwnerFigure | null = null;
const talk = startTalking(termEl, termText, spokenEl, () => figureModel?.talking());
figureModel = loadOwner(scene, owner, figure, camera);
if (import.meta.env.DEV) (window as unknown as { __rt: Record<string, unknown> }).__rt.figure = figureModel;   // dev: __rt.figure.greet()

// the counter you stand at, and what's on it: the rings you've paid for, piled near your right hand (low in the
// view, below the prizes), and the card reader (and the cash tin: pay.ts). (Her pink tumbler, on her own stand, is in models.ts.)
const PILE_AT = new THREE.Vector3(0.72, 0, 0.5);   // out to the right, past the card reader: from where you stand it never covers it
const COUNTER_TOP = 0.72;   // low enough that the front row shows over it
// old wood under many coats of varnish: it shines with the bulbs
const [grainC, grainG] = ((): [HTMLCanvasElement, CanvasRenderingContext2D] => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; return [c, c.getContext('2d')!]; })();
grainG.fillStyle = '#4a2c1c';
grainG.fillRect(0, 0, 512, 128);
for (let y = 0; y < 128; y += 2) {
  grainG.fillStyle = `rgba(${120 + Math.sin(y * 0.37) * 30}, ${70 + Math.sin(y * 0.23) * 15}, 40, ${0.12 + Math.abs(Math.sin(y * 0.11)) * 0.18})`;
  grainG.fillRect(0, y + Math.sin(y) * 2, 512, 1.5);
}
const woodTex = new THREE.CanvasTexture(grainC);
woodTex.colorSpace = THREE.SRGBColorSpace;
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
woodTex.repeat.set(2, 3);
const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, COUNTER_TOP, 0.7), new THREE.MeshPhysicalMaterial({ map: woodTex, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
counter.position.set(0, COUNTER_TOP / 2, 0.35);   // a narrow counter: from the stall's edge to just past the ring in your hand
counter.receiveShadow = true;
scene.add(counter);
const pile: THREE.Mesh[] = [];
const PILE_COLORS = [0xe8473b, 0x3fbf9a, 0xf2c14e, 0x5aa9e6];
for (let i = 0; i < 4; i++) {   // a low stack: the top few of your rings
  const r = new THREE.Mesh(new THREE.TorusGeometry(MID, TUBE, 12, 48).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: PILE_COLORS[i % 4], roughness: 0.35 }));
  r.position.set(PILE_AT.x + Math.sin(i * 2.3) * 0.02, COUNTER_TOP + TUBE + i * TUBE * 2, PILE_AT.z + Math.cos(i * 1.7) * 0.02);
  r.rotation.set(Math.sin(i) * 0.05, i, Math.cos(i * 1.3) * 0.05);
  r.castShadow = true;
  scene.add(r);
  pile.push(r);
}
// the card reader: a small, plain, white rounded square with the contactless sign on its face, a row of four
// status lights along the top and a slot for chip cards along the bottom (no screen, no logo), standing in a
// little dock that tilts it toward you. Drawn at its real size, then shown a bit bigger (READER), so it reads from
// where you stand.
const READER = 1.65;
const D = 0.09, T = 0.022;   // face, thickness
const shell = new THREE.MeshStandardMaterial({ color: 0xeceef1, roughness: 0.4, metalness: 0.05 });
const reader = new THREE.Mesh(new RoundedBoxGeometry(D, D, T, 4, 0.014), shell);
const READER_X = 0.48;   // in toward the middle, as the cash tin is on the other side
// as far forward as the cash tin's front, so their feet are in line on the counter (the tin, 0.075 round its middle
// at z 0.1, comes forward to 0.175; the dock, 0.05 deep, shown READER times bigger)
const READER_Z = 0.175 - 0.025 * READER + 0.012 * READER;
reader.position.set(READER_X, COUNTER_TOP + 0.062 * READER, READER_Z);
reader.scale.setScalar(READER);
reader.rotation.set(-0.42, -0.25, 0);
const dock = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.03, 0.05, 3, 0.008), new THREE.MeshStandardMaterial({ color: 0xd2d5da, roughness: 0.5 }));
dock.position.set(READER_X, COUNTER_TOP + 0.015 * READER, READER_Z - 0.012 * READER);
dock.scale.setScalar(READER);
dock.rotation.y = -0.25;
// the face: the contactless sign, printed dark grey
const fc = document.createElement('canvas');
fc.width = fc.height = 256;
const fg = fc.getContext('2d')!;
fg.fillStyle = '#eceef1';
fg.fillRect(0, 0, 256, 256);
fg.strokeStyle = '#3a3d45';
fg.lineWidth = 11;
fg.lineCap = 'round';
for (let i = 0; i < 4; i++) { fg.beginPath(); fg.arc(98, 136, 22 + i * 21, -0.8, 0.8); fg.stroke(); }
const faceTex = new THREE.CanvasTexture(fc);
faceTex.colorSpace = THREE.SRGBColorSpace;
const face = new THREE.Mesh(new THREE.PlaneGeometry(D * 0.78, D * 0.78), new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 }));
face.position.z = T / 2 + 0.0005;
reader.add(face);
// the chip-card slot along the bottom edge
const slot = new THREE.Mesh(new THREE.BoxGeometry(D * 0.6, 0.0025, 0.004), new THREE.MeshBasicMaterial({ color: 0x2a2c31 }));
slot.position.set(0, -D / 2 + 0.0005, 0);
reader.add(slot);
// four status lights along the top of the face. They glow blurple: the colour of the company that makes paying
// easy (the one nod to it in the piece); pay.ts makes them breathe while you can pay, and flash when you tap.
const screenMat = new THREE.MeshBasicMaterial({ toneMapped: false });
screenMat.color.set(0x635bff).multiplyScalar(1.6);
const ledGeo = new THREE.CircleGeometry(0.0032, 16);
for (let i = 0; i < 4; i++) {
  const led = new THREE.Mesh(ledGeo, screenMat);
  led.position.set((i - 1.5) * 0.011, D / 2 - 0.009, T / 2 + 0.0008);
  reader.add(led);
}
for (const m of [reader, dock]) { m.castShadow = true; scene.add(m); }

// the ring in your hand. One at a time: when the one you threw has come to rest, you take the next off the pile.
const heldMat = new THREE.MeshStandardMaterial({ color: COLORS[1], roughness: 0.35 });
const held = new THREE.Mesh(new THREE.TorusGeometry(MID, TUBE, 12, 48).rotateX(Math.PI / 2), heldMat);
held.visible = false;
scene.add(held);
let ready = false;                        // a ring in your hand, ready to throw
let fetching: number | null = null;       // 0…1 while one comes up from the pile to your hand
const fetchFrom = new THREE.Vector3();
let aimNow = 0;
const FETCH = 0.4;                        // seconds: from the pile to your hand

// --- the game ---------------------------------------------------------------------------------------------
const PACK = 10;
let rings = 0, thrown = 0, missStreak = 0, winStreak = 0, ownerHits = 0;
// this round (one payment's worth of rings), for the receipt at the end
let roundThrown = 0, roundOwner = 0, roundsPaid = 0;
let roundWins: Kind[] = [];
// the ad (ad.ts): offered after AD_AFTER misses in a row (counted across rounds), once a round at most, not again
// once watched (till the page is opened again); its reward, the next AD_REWARD rings lucky (wider and gold: ring.ts setLuck)
let luckyLeft = 0, adRound = -1;
/** three prizes or fewer left to find: closing time, she'd like to go home, so the rings are bigger from now on */
let closing = false;
/** over his odds, which bigger ring this is */
const luckLine = (): string => {
  const k = luckNow();
  return k === 'ad' ? `★ Lucky ring ×3 · ${luckyLeft} left\n` : k === 'closing' ? '★ Closing-time special: big ring\n' : k ? '★ Last one: even bigger ring\n' : '';
};
/** misses at the very last prize left: her ring grows (two, then four: ring.ts BIG) so the end never drags on */
let lastMisses = 0;
/** which bigger ring the next one is, if any: the biggest going (the ad's, or hers, growing at the last one) */
const luckNow = (): Luck | null => {
  const hers: Luck | null = !closing ? null : lastMisses >= 4 ? 'closing3' : lastMisses >= 2 ? 'closing2' : 'closing';
  const ad: Luck | null = luckyLeft > 0 ? 'ad' : null;
  if (!hers || !ad) return hers ?? ad;
  return BIG[ad].extra >= BIG[hers].extra ? ad : hers;
};
/** the rings from now on, and the one in your hand, as big as they now are (and his odds worked out again) */
function refreshLuck(): void {
  const k = luckNow();
  setLuck(k);
  heldMat.color.setHex(k ? BIG[k].color : COLORS[(thrown + 1) % COLORS.length]);
  heldMat.emissive.setHex(k ? BIG[k].emissive : 0x000000);
  heldMat.emissiveIntensity = 0.6;
  held.scale.setScalar(k ? (MID + BIG[k].extra) / MID : 1);
  oddsAt = -1;
  showRings();
}
let cleanedOut = false;   // the ring just down won the last prize not yet found (hooks.done)
/** the round is over and its receipt is on its way: no paying for more till it's up (paid then, at the stall, the
 *  receipt came up over a new round, and its own Cash and Tap did nothing) */
let ending = false;
/** the round's last ring was the fifth miss in a row: its receipt waits on her offer. Watched, the five lucky rings
 *  are on the house (no paying for them), and the round goes on; said no to (or let be, END_WAIT s), the receipt */
let endWaiting = false, endTimer = 0;
const END_WAIT = 15;
/** the round's over: her line about it, and the receipt */
function endRound(): void {
  emit('empty', { wins: roundWins.length });
  ending = true;
  window.setTimeout(summary, 1400);
}
const ad = setupAd(() => {
  luckyLeft = AD_REWARD;
  // no rings to make lucky (the round's over, or none paid for yet): the five are on the house
  if (endWaiting || rings === 0 && flying.length === 0 && !ready && fetching === null) {
    endWaiting = false;
    ending = false;
    rings += AD_REWARD;
    showRings();
  }
  refreshLuck();
}, (watched) => {
  if (watched) next();   // (the next ring up, if it's waiting: a gift's first)
  else if (endWaiting) { endWaiting = false; endRound(); }
});
/** offer the ad, if it's time: true if it was offered */
function maybeAd(): boolean {
  if (missStreak < AD_AFTER || luckyLeft > 0 || adRound === roundsPaid || adWatched()) return false;
  adRound = roundsPaid;
  // she says it now, in place of her line about the misses (said this same moment, it never gets heard: voice.ts)
  talk.line('adOffer', 4, true);   // said in full: what happens meanwhile is said after
  figureModel?.secret();           // and she leans in to say it
  asking(true);
  return true;
}
/** her offer of the ad, in her terminal under whatever she's saying: Y plays it at once (from the click itself, so a
 *  phone plays its sound), N says no. Throwing on doesn't (many throw again before she's done talking): it stays up
 *  till you answer, or till the round's over */
const askEl = $('rt-term-ask');
let offering = false;
function asking(on: boolean): void {
  offering = on;
  termEl.classList.toggle('is-asking', on);
  if (on) ad.prepare();
}
const answer = (yes: boolean): void => {
  if (!offering) return;
  asking(false);
  clearTimeout(endTimer);
  if (yes) ad.play();
  else if (endWaiting) { endWaiting = false; endRound(); }
};
askEl.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.answer === 'y')));
addEventListener('keydown', (e) => { if (offering && /^[yn]$/i.test(e.key)) answer(e.key.toLowerCase() === 'y'); });
const roundNew = new Set<Kind>();
const paidWith = new Set<Method>();
let cashTeased = -Infinity;
let bothSaid = false;
const IDLE_EVERY = 10, IDLE_SAY = 3;   // s of nothing between her fidgets; and a line with every this many of them
let lastAction = performance.now(), idleSaid = 0;   // idleSaid: how many times she's fidgeted about it since
const flying: Ring[] = [];
const resting: Ring[] = [];
/** what's in the bag, oldest first (only the last bag.shows of them are still shown) */
const inBag: THREE.Group[] = [];
/** prizes on their way to you: up off the stand, held up in front of you, then into the bag (into: its spot there,
 *  fixed when it sets off for it) */
const won: { kind: Kind; fresh: boolean; group: THREE.Group; t: number; from: THREE.Vector3; s0: number; r0: number; h: number; size: number; footR: number; into: { at: THREE.Vector3; scale: number; tilt: number; from: THREE.Vector3; fromS: number } | null }[] = [];

function showRings(): void {
  // (no counter on screen: the rings left are the pile on the counter)
  const inHand = ready || fetching !== null ? 1 : 0;
  held.visible = inHand > 0;
  pile.forEach((r, i) => {
    r.visible = i < rings - inHand;
    // and each looks as it will when it's thrown: the ad's gold for as many as it has left (from the top, after the
    // one in your hand), her red at closing time; a little bigger, not as big as in your hand (the pile would spill
    // off the counter and over the bag)
    const next = rings - inHand - 1 - i + inHand;   // throws before this one
    const hers: Luck | null = !closing ? null : lastMisses >= 4 ? 'closing3' : lastMisses >= 2 ? 'closing2' : 'closing';
    const ad: Luck | null = next < luckyLeft ? 'ad' : null;
    const k = !hers || !ad ? hers ?? ad : BIG[ad].extra >= BIG[hers].extra ? ad : hers;
    const m = r.material as THREE.MeshStandardMaterial;
    m.color.setHex(k ? BIG[k].color : PILE_COLORS[i % PILE_COLORS.length]);
    m.emissive.setHex(k ? BIG[k].emissive : 0x000000);
    m.emissiveIntensity = 0.6;
    r.scale.setScalar(k ? Math.min(1.2, (MID + BIG[k].extra) / MID) : 1);
  });
  hintEl.classList.toggle('is-on', ready && thrown === 0);
}

/** take the next ring off the pile, once the last one has come to rest */
function next(): void {
  if (ready || fetching !== null || rings <= 0 || flying.length > 0) return;
  const top = pile[Math.min(pile.length, rings) - 1];
  fetchFrom.copy(top.position);
  refreshLuck();
  fetching = 0;
  showRings();
}

function touch(): void { lastAction = performance.now(); idleSaid = 0; }

// paying: the cash tin on the left, the card reader on the right (pay.ts)
const pay = setupPay({
  scene, camera, canvas, reader, screen: screenMat, counterTop: COUNTER_TOP,
  cashButton: cashEl, tapButton: tapEl, receipt: receiptEl, summary: summaryEl, veil: veilEl,
  staging: (k) => world.stage(k),
  canPay: () => introDone && !ending && rings === 0 && flying.length === 0 && fetching === null && !ready,
  hovered(m, from) {
    // your hand over the cash tin: in a stall that's all about tapping, she notices (once in a while, not every time).
    // On the stall only before the first round; after that only on the receipt (once the rings are all thrown, the
    // tin isn't what you're reaching for: the receipt is coming)
    if (from === 'stall' && roundsPaid > 0) return;
    const now = performance.now();
    if (m === 'cash' && now - cashTeased > 12000) { cashTeased = now; talk.line('payCash', 2); }   // one of her recorded cash lines (paying cash then gets another)
  },
  begin(m) {
    touch();
    for (const r of resting) r.dispose(scene);   // he gathers up the rings
    resting.length = 0;
    talk.status(null);
    paidWith.add(m);
    const both = paidWith.size === 2 && !bothSaid;
    if (both) bothSaid = true;
    emit('coin', { rings: PACK, method: m, both });
  },
  done() {
    setRounds(++roundsPaid);   // kinder the longer you stay (ring.ts)
    // the places left empty by what was won last round: something new in each, what you haven't found first
    // what's put out: what the player has never seen on the stand, then what they've seen but not won; never what
    // they've already won (its place stays empty)
    const filled = restock(scene, slots, (k) => (isFound(k) ? Infinity : shown.has(k) ? 1 : 0));
    const unseen = filled.filter((s) => s.prize && !shown.has(s.prize.kind)).length;
    filled.forEach((s) => s.prize && shown.add(s.prize.kind));
    if (filled.length) {
      loadPrizeModels(filled);
      // and they come down into their places from above, one after another
      filled.forEach((sl, i) => { if (sl.group) { drops.push({ group: sl.group, y: sl.group.position.y, t: -0.15 * i }); sl.group.position.y += DROP_FROM; } });
      emit('restock', { count: filled.length, unseen, all: foundCount() === CATALOG.length });
    }
    rings += PACK;
    roundThrown = roundOwner = 0;
    roundWins = [];
    roundNew.clear();
    showRings();
    next();
  },
});

/** the end of a round: what it came to, printed */
/** this round's chops come down one by one once the receipt has printed (the page's CSS: rt-chop), each with its thump */
const STAMP_AT = 1.3, STAMP_GAP = 0.42, STAMP_HIT = 0.21;   // s: the first, between them, and from its start to landing
let stampTimers: number[] = [];
function summary(): void {
  ending = false;
  if (offering) asking(false);   // the round's over: her offer with it
  renderBook();
  // all of it found: the receipt's last state (SOLD OUT, and a way to start over or to see more work)
  const complete = foundCount() === CATALOG.length;
  summaryEl.classList.toggle('is-complete', complete);
  summaryEl.querySelector('.rt-summary-title')!.textContent = complete ? 'Collection complete' : "Today's damage";
  stampTimers.forEach(clearTimeout);
  const n = new Set(roundWins).size;
  stampTimers = Array.from({ length: n }, (_, i) => window.setTimeout(() => stamp(i), (STAMP_AT + STAMP_GAP * i + STAMP_HIT) * 1000));
  // the lines: a label, a dotted leader, the figure; under RINGED, each thing won (NEW the first time)
  const row = (label: string, figure: string, cls = '', figCls = ''): HTMLElement => {
    const p = document.createElement('p');
    p.className = `rt-row ${cls}`.trim();
    const l = document.createElement('span'), lead = document.createElement('i'), f = document.createElement('b');
    l.innerHTML = label;
    f.textContent = figure;
    if (figCls) f.className = figCls;
    p.append(l, lead, f);
    return p;
  };
  statsEl.replaceChildren(
    row('Rings thrown', String(roundThrown)),
    row('Ringed', String(roundWins.length)),
    ...roundWins.map((k) => {
      const e = entry(k);
      const label = e ? `<em>${no(e.no)}</em>${e.name}` : k;
      return roundNew.has(k) ? row(label, 'NEW', 'rt-item', 'is-new') : row(label, '', 'rt-item');
    }),
  );
  pay.summary([]);
}

function toss(t: Toss): void {
  if (!ready || rings <= 0) return;
  touch();
  ready = false;
  talk.status(null);
  rings--;
  thrown++;
  roundThrown++;
  const ring = new Ring(scene, t, thrown);   // lucky, if there are lucky ones left (setLuck)
  if (luckyLeft > 0 && ring.lucky === 'ad') { luckyLeft--; setLuck(luckNow()); }
  ring.pos.x = held.position.x;   // from where your hand is
  flying.push(ring);
  showRings();
  emit('throw', { left: rings, count: thrown, aim: +t.aim.toFixed(2), power: +t.power.toFixed(2) });
}
hintEl.textContent = HINT;
pointerInput(canvas, {
  toss,
  aim(aim) { aimNow = aim; },   // the ring in your hand moves and turns the way it will go
  charge(power) {
    charging = power !== null && ready ? power : null;
    powerEl.classList.toggle('is-on', power !== null && ready);
    if (power !== null) {
      const lit = Math.round(power * bulbs.length);
      bulbs.forEach((b, i) => b.classList.toggle('is-lit', i < lit));
    }
  },
});

const hooks = {
  clink(slot: Slot): void { if (slot.prize) emit('clink', { prize: slot.prize }); },
  owner(): void { roundOwner++; emit('owner', { count: ++ownerHits }); },
  sign(): void { world.jolt(); clank(); },
  done(ring: Ring, result: Result): void {
    flying.splice(flying.indexOf(ring), 1);
    resting.push(ring);
    if (result.kind === 'win') {
      const { slot } = result;
      const prize = slot.prize!;
      missStreak = 0;
      winStreak++;
      const fresh = find(prize.kind);
      const last = fresh && foundCount() === CATALOG.length;   // the last one there was to find
      emit('win', { prize, streak: winStreak, last });
      roundWins.push(prize.kind);
      if (fresh) roundNew.add(prize.kind);
      const left = CATALOG.length - foundCount();
      if (fresh && left > 0 && left <= 3) { closing = true; emit('closing', { left }); }   // her bigger rings, from the next one
      if (last) {
        emit('complete', { total: CATALOG.length });
        cleanedOut = true;
      }
      if (winStreak >= 2 && !last) emit('streak', { count: winStreak });
      if (slot.group) {
        const g = slot.group;
        // one won while another is still held up in front of you: that one goes into the bag now, out of the way
        for (const w of won) if (w.t < FLY + HOLD) w.t = FLY + HOLD;
        won.push({ kind: prize.kind, fresh, group: g, t: 0, from: g.position.clone(), s0: g.scale.x, r0: g.rotation.y, h: prize.height, size: Math.max(prize.height, 2 * prize.footR), footR: prize.footR, into: null });
      }
      slot.prize = null;
      slot.group = null;
    } else if (result.kind === 'miss') {
      winStreak = 0;
      missStreak++;
      if (result.near) emit('near', { prize: result.near.slot.prize!, gap: +result.near.gap.toFixed(3), streak: missStreak });
      else emit('miss', { streak: missStreak });
    } else {
      winStreak = 0;
      missStreak++;   // on his head: he has already said something
    }
    if (result.kind !== 'win' && closing && CATALOG.length - foundCount() === 1) lastMisses++;   // (the next ring up is sized by it: next)
    const offered = result.kind !== 'win' && maybeAd();
    if (cleanedOut) {
      // the last one found: that's the game. The receipt comes now (once the prize has been held up and her line
      // said), not after the rest of the rings are thrown; he takes back the ones still on the counter
      cleanedOut = false;
      rings = 0;
      showRings();
      ending = true;
      window.setTimeout(summary, (FLY + HOLD + 0.6) * 1000);
      return;
    }
    if (rings === 0 && flying.length === 0) {
      if (offered) {
        endWaiting = true;
        ending = true;   // (no paying meanwhile)
        endTimer = window.setTimeout(() => { if (endWaiting && offering) { asking(false); endWaiting = false; endRound(); } }, END_WAIT * 1000);
      } else endRound();
    }
    next();
  },
};

if (import.meta.env.DEV) {   // dev: win the next n prizes without throwing (to look at the counter)
  (window as unknown as { __rt: Record<string, unknown> }).__rt.win = (n: number) => {
    for (const slot of slots.filter((x) => x.prize).slice(0, n)) {
      const fake = { dispose() {} } as unknown as Ring;
      hooks.done(fake, { kind: 'win', slot });
      resting.splice(resting.indexOf(fake), 1);   // (left lying there, it has no place: the odds stopped on it, and the stall with them)
    }
  };
}

// a prize you win comes over to you: it hops off the stand and flies up to just in front of your eyes, big (as if
// handed to you), turns there for a moment, then drops into the THANK YOU bag on the counter (bag.ts)
const bag = buildBag(scene, 0.93, COUNTER_TOP, 0.22);   // right of the reader: the left end of the counter is under the talk box
const SHOW_H = 0.18;                      // how tall it's shown, in front of you (m, SHOW_AT from your eyes)
const SHOW_AT = 1.75;                     // not closer: up close the models' detail runs out
const FLY = 0.75, HOLD = 2.4, DROP = 0.6;   // s (held long enough to read its tag)
const showAt = new THREE.Vector3(), camFwd = new THREE.Vector3(), camRight = new THREE.Vector3();
// the tag tied to a prize as it's held up: its number, its name, its line (catalog.ts)
const tagEl = document.getElementById('rt-tag')!, bookEl = document.getElementById('rt-book')!;
// start over: the page again, from the stall (the collection is this visit's only, so it's empty again; the opening,
// seen already in this tab, is skipped)
summaryEl.querySelector('.rt-restart')?.addEventListener('click', () => location.reload());
const bookHead = bookEl.querySelector('.rt-row b')!, bookGrid = bookEl.querySelector(':scope > div')!, statsEl = document.getElementById('rt-stats')!;
const tagAt = new THREE.Vector3();
let tagOf: (typeof won)[number] | null = null;
function showTag(w: (typeof won)[number] | null): void {
  if (w === tagOf) return;
  tagOf = w;
  if (!w) { tagEl.classList.remove('is-on'); return; }
  const e = entry(w.kind);
  if (!e) { tagEl.classList.remove('is-on'); return; }
  tagEl.querySelector('.rt-tag-no')!.textContent = `NO. ${no(e.no)} / ${CATALOG.length}`;
  tagEl.querySelector('.rt-tag-new')!.toggleAttribute('hidden', !w.fresh);
  tagEl.querySelector('b')!.textContent = e.name;
  tagEl.querySelector('.rt-tag-line')!.textContent = `“${e.line}”`;
  tagEl.classList.remove('is-on');
  void tagEl.offsetWidth;   // (to swing in again, from the start)
  tagEl.classList.add('is-on');
}
/** the collection, on the receipt: every number, the ones found filled in, this round's new ones marked */
function renderBook(): void {
  bookHead.textContent = `${no(foundCount())} / ${CATALOG.length}`;
  let ringed = 0;
  const cells = CATALOG.map((e) => {
    const c = document.createElement('i');
    const n = document.createElement('span');
    n.textContent = no(e.no);
    const pic = document.createElement('b');   // its drawing (thumbs.ts), as a mask, so it takes the cell's ink
    c.append(pic, n);
    // everything you've ever ringed has a red chop on it, 中 (a hit); this round's are stamped on one after another
    // as the receipt comes out, the others are there already
    if (isFound(e.kind)) {
      c.title = e.name;
      const now = roundWins.includes(e.kind);
      c.className = now ? 'is-found is-ringed' : 'is-found';
      c.style.setProperty('--tilt', `${Math.round(Math.random() * 24 - 12)}deg`);
      if (now) c.style.setProperty('--at', `${STAMP_AT + STAMP_GAP * ringed++}s`);
      c.insertAdjacentHTML('beforeend', '<svg class="rt-chop" viewBox="0 0 100 100" aria-hidden="true"><g filter="url(#rt-chop-ink)"><circle cx="50" cy="50" r="44"/><path d="M27 36h46v26H27zM50 17v66"/></g></svg>');
    }
    return { c, pic, kind: e.kind };
  });
  bookGrid.replaceChildren(...cells.map((x) => x.c));
  void thumbs(CATALOG.map((e) => e.kind)).then((m) => cells.forEach(({ pic, kind }) => {
    const url = m.get(kind);
    if (url) pic.style.setProperty('--pic', `url(${url})`);
  }));
}

/** new prizes put out on the stand (restock): falling in from above, a bounce, a little squash as they land */
const DROP_FROM = 1.6, DROP_FALL = 0.5, DROP_SETTLE = 0.35;   // m above; s falling; s settling
const drops: { group: THREE.Group; y: number; t: number }[] = [];
function dropIn(dt: number): void {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.t += dt;
    const g = d.group;
    if (d.t < 0 || !g.userData.ready) { g.visible = false; d.t = Math.min(d.t, 0); continue; }   // (not till its model and textures are in)
    g.visible = true;
    const sy = g.userData.sy ??= g.scale.y, sx = g.userData.sx ??= g.scale.x;
    if (d.t < DROP_FALL) {
      const k = d.t / DROP_FALL;
      g.position.y = d.y + DROP_FROM * (1 - k * k);   // falling, quicker as it goes
      g.scale.set(sx * 0.94, sy * 1.08, sx * 0.94);   // stretched a little by the fall
    } else {
      const e = Math.min(1, (d.t - DROP_FALL) / DROP_SETTLE);
      g.position.y = d.y + Math.abs(Math.sin(e * Math.PI * 1.5)) * 0.05 * (1 - e);   // a small bounce, dying away
      const squash = Math.sin(Math.min(1, e * 2.5) * Math.PI) * 0.16 * (1 - e);
      g.scale.set(sx * (1 + squash * 0.6), sy * (1 - squash), sx * (1 + squash * 0.6));
      if (d.t - DROP_FALL < dt) plop();   // lands
      if (e >= 1) { g.position.y = d.y; g.scale.set(sx, sy, sx); delete g.userData.sy; delete g.userData.sx; drops.splice(i, 1); }
    }
  }
}

let charging: number | null = null;   // (the power while you hold to throw)

function carry(dt: number): void {
  dropIn(dt);
  bag.update(dt);
  // the newest one being held up has its tag out, beside it
  camera.getWorldDirection(camFwd);
  camRight.crossVectors(camFwd, camera.up).normalize();
  let holding: (typeof won)[number] | null = null;
  for (const w of won) if (w.t > FLY * 0.7 && w.t < FLY + HOLD) holding = w;
  showTag(holding);
  if (holding) {
    // tied on at its side: from where it is now, clear of its widest side by a finger, up by half its height, as it's shown
    const k = holding.group.scale.x / holding.s0;
    tagAt.copy(holding.group.position).addScaledVector(camRight, holding.footR * k + 0.015).addScaledVector(camera.up, holding.h * k * 0.5).project(camera);
    const x = Math.min(innerWidth - 16 - tagEl.offsetWidth, (tagAt.x + 1) / 2 * innerWidth);
    const y = (1 - tagAt.y) / 2 * innerHeight;
    tagEl.style.left = `${Math.round(x)}px`;
    tagEl.style.top = `${Math.round(y)}px`;
  }
  camera.getWorldDirection(camFwd);
  camRight.crossVectors(camFwd, camera.up).normalize();
  for (let i = won.length - 1; i >= 0; i--) {
    const w = won[i];
    w.t += dt;
    const big = w.s0 * (SHOW_H / w.size);   // by its larger side, like on the stand: a flat one isn't blown up wide
    // held a little below the middle of your view, a touch left of centre (clear of the ring in your hand)
    showAt.copy(camera.position).addScaledVector(camFwd, SHOW_AT).addScaledVector(camRight, -0.1).addScaledVector(camera.up, -0.16 - SHOW_H / 2);
    if (w.t < FLY) {
      const e = w.t / FLY, k = e * e * (3 - 2 * e);
      w.group.position.lerpVectors(w.from, showAt, k);
      w.group.position.y += Math.sin(k * Math.PI) * 0.35;
      w.group.scale.setScalar(w.s0 + (big - w.s0) * k);
      w.group.rotation.y = w.r0 * (1 - k) + Math.sin(k * Math.PI) * Math.PI * 2;   // a spin on the way, and lands facing you
    } else if (w.t < FLY + HOLD) {
      const h = (w.t - FLY) / HOLD;
      w.group.position.copy(showAt);
      w.group.position.y += Math.sin(h * Math.PI * 2) * 0.008;
      w.group.scale.setScalar(big * (1 + 0.04 * Math.sin(Math.min(1, h * 4) * Math.PI)));   // a little pop as it arrives
      w.group.rotation.y = Math.sin(h * Math.PI * 1.5) * 0.55;   // turned one way and the other, to be looked at
    } else {
      if (!w.into) {
        const spot = bag.slot(w.h, w.footR);
        w.into = { at: spot.at, scale: w.s0 * spot.scale, tilt: spot.tilt, from: w.group.position.clone(), fromS: w.group.scale.x };
      }
      const e = Math.min(1, (w.t - FLY - HOLD) / DROP), k = e * e;   // falls, quicker as it goes
      w.group.position.lerpVectors(w.into.from, w.into.at, k);
      w.group.position.y += Math.sin(Math.min(1, e * 1.2) * Math.PI) * 0.12;
      w.group.scale.setScalar(w.into.fromS + (w.into.scale - w.into.fromS) * Math.min(1, e * 1.5));
      w.group.rotation.y *= 0.9;
      w.group.rotation.z = w.into.tilt * k;   // leaning as it settles in
      if (e >= 1) {   // and stays in there: the last few showing over the rim, the one it's taken the place of gone down inside
        bag.drop(); rustle(); won.splice(i, 1);
        inBag.push(w.group);
        while (inBag.length > bag.shows) inBag.shift()!.visible = false;
      }
    }
  }
}

function resize(): void {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  post.setSize(w, h);
  camera.aspect = w / h;
  // keep the whole stall in view on a screen less wide than a laptop's (an iPad's 4:3, say): below 16:10 the view
  // widens to keep as much from side to side as 16:10 shows (the neon sign on the right and the bag stay in)
  const WIDE = 1.6;
  camera.fov = w / h < WIDE ? 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * WIDE / (w / h))) : FOV;
  // a phone held sideways is far wider than a laptop (about 2.6 : 1): it took in the street on both sides, the stall
  // small in the middle. Closer in there, the stall filling more of it
  if (w / h > 2.1) camera.fov = FOV * 0.9;   // (0.8 cut off the sign above and the tin and the reader below)
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
showRings();

let oddsAim = 0, oddsAt = -1;
let job: Generator<void, number> | null = null;
const termAt = new THREE.Vector3();
// the opening: about 3 s from the street to the counter, while the sign is put together; a click skips it
// it starts in the dark: the stall's lights come on one by one (scene.ts LIGHT_UP), and once they're mostly up you
// walk in from the street
const WALK_AT = 2.4, WALK = 3.2, INTRO = WALK_AT + WALK;
/** the sounds of the lights coming on, at their times (s into the opening) */
const CUES: [number, () => void][] = [
  [LIGHT_UP.hanzi, () => buzz(0.3)],
  ...BULB_SWITCHES[0].flatMap((sw) => sw.filter((_, k) => k % 2 === 0).map((at): [number, () => void] => [at, bulb])),   // each time a front bulb takes
  [LIGHT_UP.neon[0], () => buzz(LIGHT_UP.neon[1] - LIGHT_UP.neon[0])],
  [LIGHT_UP.full[0], () => streetLevel(1, LIGHT_UP.full[1] - LIGHT_UP.full[0] + 0.8)],   // and the street comes back up
];
let cueT = -1;
let introT = 0, introDone = false;
let introStart = -1;   // by the clock, not by frames: a slow first few frames mustn't stretch the opening
const finishIntro = (): void => {
  if (introDone) return;
  introDone = true;
  if (introT < LIGHT_UP.full[0]) streetLevel(1, 0.6);   // skipped before the street came back up
  introT = INTRO;
  const open = LINES.open;
  talk.say(open[Math.floor(Math.random() * open.length)], 2);
  // dev only: ?pay=cash or ?pay=tap pays by itself after the opening; ?receipt prints the end-of-round receipt
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search);
    const m = q.get('pay');
    if (m) window.setTimeout(() => (m === 'cash' ? cashEl : tapEl).click(), 400);
    if (q.has('receipt')) window.setTimeout(summary, 400);
    // ?last: one prize left to find, the only one on the stand; it pays, and once the rings are in hand it's won by
    // itself, to watch how the game ends (held up, her line, the receipt). ?closing: three left, the only three on the
    // stand (as late in a real game, the places of what you've won left empty); it pays, she says her closing-time
    // line, and you play on with her bigger rings
    const short = q.has('last') ? 1 : q.has('closing') ? 3 : 0;
    if (short) {
      const out = slots.filter((x) => x.prize).sort(() => Math.random() - 0.5);
      const keep = out.slice(0, short);
      for (const x of out.slice(short)) { if (x.group) scene.remove(x.group); x.group = null; x.prize = null; }
      const kinds = new Set(keep.map((x) => x.prize!.kind));
      for (const e of CATALOG) if (!kinds.has(e.kind)) find(e.kind);
      closing = true;
      window.setTimeout(() => cashEl.click(), 400);
      const wait = window.setInterval(() => {
        if (!ready) return;
        window.clearInterval(wait);
        if (short === 3) { refreshLuck(); emit('closing', { left: 3 }); return; }
        window.setTimeout(() => {
          ready = false;
          const fake = { dispose() {} } as unknown as Ring;   // no ring really thrown: none left lying there after
          hooks.done(fake, { kind: 'win', slot: keep[0] });
          resting.splice(resting.indexOf(fake), 1);
        }, 800);
      }, 200);
    }
    // ?ad: the ad offered in her terminal, once her hello is over
    if (q.has('ad')) { window.setTimeout(() => { talk.line('adOffer', 4, true); figureModel?.secret(); asking(true); }, 4500); }
    // ?complete: the receipt as it is with the whole collection found (the last few as won this round)
    if (q.has('complete')) {
      for (const e of CATALOG) find(e.kind);
      roundWins = CATALOG.slice(-3).map((e) => e.kind);
      roundThrown = 64;
      window.setTimeout(summary, 400);
    }
  }
};
// before all that, the film-like opening on black (opening.ts), with the street already playing if the browser
// allows it (otherwise from the first click); the walk up to the counter starts when you press its button
let entered = false;
wake();
// the sound switch, top right. On means: playing, and not switched off. The browser lets it play only after a click;
// any click or key anywhere wakes it, the switch too, so off → on always works. Only the switch turns it off, and only
// for this visit: every time the page is opened, the first touch brings the sound
{
  const btn = $<HTMLButtonElement>('rt-sound'), word = btn.querySelector('b')!;
  let off = false;
  const set = (m: boolean): void => { off = m; mute(m); muteVoice(m); };
  btn.addEventListener('click', () => set(soundOn() && !off));   // playing → off; otherwise (blocked, or off) → on
  const show = (): void => {
    const on = soundOn() && !off;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    word.textContent = on ? 'on' : 'off';
    requestAnimationFrame(show);
  };
  show();
}
// the typed opening only the first time in a tab: opened again there (a reload), straight to the lights coming on
let seen = false;
try { seen = sessionStorage.getItem('rt-opening') === 'seen'; } catch { /* no storage: show it */ }
void playOpening($('rt-cine'), { ready: () => loading.ready(), soundOn, key, glitch, hover, press, seen }).then(() => {
  entered = true;
  // the drawings for the collection on the receipt, made in the background once the walk in is over
  window.setTimeout(() => void thumbs(CATALOG.map((e) => e.kind)), (INTRO + 2) * 1000);
  // and every prize's model, in the background, so those put out later come in at once
  window.setTimeout(preloadPrizes, (INTRO + 4) * 1000);
  streetLevel(0.25, 0.4);   // hushed while the stall is dark
  try { sessionStorage.setItem('rt-opening', 'seen'); } catch { /* fine */ }
});
addEventListener('pointerdown', () => { wake(); wakeVoice(); if (entered && introT > 0.3) finishIntro(); }, { capture: true });
addEventListener('keydown', () => { wake(); wakeVoice(); if (entered && loading.ready()) finishIntro(); });

const clock = new THREE.Clock();
let frames = 0, frameTime = 16, sinceCheck = 0, slowChecks = 0;
renderer.setAnimationLoop(() => {
  // shadows every other frame; and the sharpness kept to what this machine can draw smoothly
  if (++frames % 2 === 0) renderer.shadowMap.needsUpdate = true;
  const raw = clock.getDelta();
  frameTime += (raw * 1000 - frameTime) * 0.05;
  sinceCheck += raw;
  if (sinceCheck > 1.5 && introDone) {
    sinceCheck = 0;
    // down only when it has been slow for a while (a hiccup while something loads is not a reason); up whenever it's
    // keeping up with a 60 Hz screen (16.7 ms a frame: the old test, under 14 ms, never passed there, so once down
    // it stayed down, blurry)
    slowChecks = frameTime > 24 ? slowChecks + 1 : 0;
    const now = performance.now();
    if (now > prCapUntil) prCap = MAX_PR;
    let next = pixelRatio;
    if (slowChecks >= 2) { next = Math.max(MIN_PR, pixelRatio - 0.25); prCap = pixelRatio - 0.25; prCapUntil = now + 30000; slowChecks = 0; }
    else if (frameTime < 18.5 && pixelRatio + 0.25 <= prCap) next = pixelRatio + 0.25;
    if (next !== pixelRatio) { pixelRatio = next; renderer.setPixelRatio(pixelRatio); resize(); }
  }
  const dt = Math.min(raw, 1 / 30);
  if (!introDone) {
    if (introStart < 0 && entered && loading.ready()) { introStart = performance.now(); figureModel?.greet(); }   // the opening waits for the loading
    introT = introStart < 0 ? 0 : (performance.now() - introStart) / 1000;
    if (introT >= INTRO) finishIntro();
  }
  if (!introDone) { for (const [at, play] of CUES) if (cueT < at && introT >= at) play(); cueT = introT; }
  const walk = Math.min(1, Math.max(0, (introT - WALK_AT) / WALK)), ease = 1 - (1 - walk) ** 3;
  camera.position.lerpVectors(STREET_AT, STAND_AT, ease);
  camera.lookAt(LOOK_AT);
  if (devView.at && devView.look) { camera.position.copy(devView.at); camera.lookAt(devView.look); }
  world.title(introDone ? 99 : introT);
  pay.update();
  const n = 4;   // small steps, so a fast ring can't pass through a prize
  for (let i = 0; i < n; i++) for (const r of [...flying]) r.step(dt / n, slots, owner, resting, hooks);
  carry(dt);
  // the ring in your hand: up from the pile, then following your aim
  const handX = HAND.x + aimNow * HAND_SWAY;
  if (fetching !== null) {
    fetching = Math.min(1, fetching + dt / FETCH);
    const k = fetching * fetching * (3 - 2 * fetching);
    held.position.set(fetchFrom.x + (handX - fetchFrom.x) * k, fetchFrom.y + (HAND.y - fetchFrom.y) * k + Math.sin(k * Math.PI) * 0.1, fetchFrom.z + (HAND.z - fetchFrom.z) * k);
    held.rotation.x = -0.5 * k;
    if (fetching >= 1) { fetching = null; ready = true; oddsAt = -1; showRings(); }
  } else held.position.set(handX, HAND.y, HAND.z);
  held.rotation.y = -aimNow * 0.4;
  held.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.04;

  // his terminal: your odds while you hold a ring (worked out again when you aim somewhere new), else a nudge
  const now = performance.now();
  if (ready && (oddsAt < 0 || Math.abs(aimNow - oddsAim) > 0.02 && now - oddsAt > 150)) {
    oddsAim = aimNow;
    oddsAt = now;
    job = oddsJob(aimNow, slots, owner, resting);   // a newer aim replaces any sum still going
  } else if (introDone && !ready && rings === 0 && fetching === null && flying.length === 0) talk.status(STATUS.broke);
  if (job) {   // at most 3 ms of it a frame
    const until = performance.now() + 3;
    let r = job.next();
    while (!r.done && performance.now() < until) r = job.next();
    if (r.done) { job = null; if (ready) talk.status(luckLine() + STATUS.odds(r.value * 100)); }
  }
  if (!ready) job = null;
  // on the front of her stand, hanging from just under the laptop's edge (the stand's face is bare there): its top
  // edge there, centred under the laptop, kept on screen
  termAt.set(owner.x, STAND_TOP - 0.22, owner.z + 0.58).project(camera);   // (a little lower down the stand front than it was)
  const tw = termEl.offsetWidth, th = termEl.offsetHeight;
  const tx = Math.min(innerWidth - 16 - tw / 2, Math.max(16 + tw / 2, (termAt.x + 1) / 2 * innerWidth));
  const ty = Math.min(innerHeight - 16 - th, (1 - termAt.y) / 2 * innerHeight);
  termEl.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px) translate(-50%, 0)`;

  const idle = (performance.now() - lastAction) / 1000;
  // every 10 s of nothing, she yawns, looks at her phone… (owner.ts); and every third time (30 s) she says something
  // about it too (a different line each time, at random: every 10 s, she never stopped talking)
  // (not before the opening is over, nor while the receipt is up)
  const canNag = introDone && !summaryEl.classList.contains('is-on') && !ad.isOpen() && !offering;
  if (canNag && flying.length === 0 && idle > IDLE_EVERY * (idleSaid + 1)) {
    idleSaid++;
    emit('idle', { seconds: Math.round(idle), rings, paid: roundsPaid > 0, say: idleSaid % IDLE_SAY === 0 });
  }
  world.update(clock.elapsedTime, dt);
  figureModel?.update(dt);
  post.render(clock.elapsedTime);
});

// --- dev: every event, in the corner ----------------------------------------------------------------------
if (logEl) {
  onAny((name, payload) => {
    const li = document.createElement('li');
    const p = { ...payload } as Record<string, unknown>;
    if (p.prize && typeof p.prize === 'object') p.prize = (p.prize as { name: string }).name;
    li.textContent = `${name} ${JSON.stringify(p)}`;
    logEl.prepend(li);
    while (logEl.children.length > 10) logEl.lastChild!.remove();
  });
}
