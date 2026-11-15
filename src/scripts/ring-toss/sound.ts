// Small sounds, made on the spot with Web Audio (no files): the card reader's beep, coins, a ring on glass, a
// win, a ring off the owner's head; and the recorded street under it all. Browsers only allow sound after the
// player has touched the page, so nothing plays until the first click.
import { on } from './events';

let ctx: AudioContext | null = null;
let out: GainNode | null = null;

/** call on the first click or key press */
export function wake(): void {
  if (ctx) { void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    out = ctx.createGain();
    out.gain.value = muted ? 0 : 0.6;
    out.connect(ctx.destination);
    street();
    loadKeys();
    loadSfx();
  } catch { ctx = null; }
}

/** all of it silent (the switch, top right), or back on */
let muted = false;
export function mute(m: boolean): void {
  muted = m;
  if (ctx && out) out.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.08);
}

/** whether the browser is letting it play yet (it waits for a click, unless the visitor has played here before) */
export function soundOn(): boolean { return ctx?.state === 'running'; }

/** one plain tone, shaped: a quick rise, then it fades */
function tone(freq: number, at: number, len: number, type: OscillatorType = 'sine', vol = 0.3, slide = 0): void {
  if (!ctx || !out) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + len);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.05);
}

/** one key on a laptop keyboard (a MacBook's: light, short travel, muffled), quietly, for the opening's typing: a
 *  soft, dull tap going down and a fainter one coming up, never twice the same. The space bar is a lower, wider
 *  thud; the last key of a line (enter) a touch heavier */
let keyNoise: AudioBuffer | null = null;
function synthKey(kind: 'letter' | 'space' | 'enter'): void {
  if (!ctx || !out) return;
  const c = ctx, o = out;
  if (!keyNoise) {
    keyNoise = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate);
    const d = keyNoise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.003));
  }
  const big = kind !== 'letter';
  const vol = (kind === 'enter' ? 0.3 : big ? 0.26 : 0.2) * (0.8 + Math.random() * 0.4);   // clear over the street, still soft
  const tap = (at: number, freq: number, v: number, rate: number): void => {
    const src = c.createBufferSource();
    src.buffer = keyNoise;
    src.playbackRate.value = rate;
    const bp = c.createBiquadFilter();   // the body of the tap
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 0.7;
    const lp = c.createBiquadFilter();   // and nothing bright: muffled
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const g = c.createGain();
    g.gain.value = v;
    src.connect(bp).connect(lp).connect(g).connect(o);
    src.start(c.currentTime + at);
  };
  const f = big ? 380 + Math.random() * 120 : 650 + Math.random() * 450;   // each key a little different, all low
  tap(0, f, vol, big ? 0.55 : 0.75 + Math.random() * 0.2);                                       // down
  tone(big ? 90 : 140 + Math.random() * 40, 0.001, big ? 0.05 : 0.025, 'sine', vol * 0.5);       // the soft bottom
  tap((big ? 0.06 : 0.04) + Math.random() * 0.025, f * 1.15, vol * 0.22, 0.9);                   // and the faint return
}

/** Siman's own MacBook, recorded (_source/sound/typing.m4a): twenty keys cut from it, each in its own quarter second
 *  of keys.mp3, the letters first, then the space bar, then enter. Each key plays one of its kind, never the same one
 *  twice running, a touch higher or lower each time. Until the file is in, the made-up key above stands in. */
const KEYS = '/play/no-cash-only/keys.mp3';
const KEY_SLOT = 0.25, KEY_SETS = { letter: [0, 15], space: [15, 18], enter: [18, 20] } as const;
let keys: AudioBuffer | null = null, keysAsked = false, lastKey = -1, lastKeyAt = 0;
function loadKeys(): void {
  if (keysAsked || !ctx) return;
  keysAsked = true;
  const c = ctx;
  fetch(KEYS).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).then((buf) => { keys = buf; }).catch(() => {});
}
export function key(kind: 'letter' | 'space' | 'enter' = 'letter'): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx;
  loadKeys();
  // a hand on a real keyboard (the recording) lands a key every tenth of a second or so, even typing fast; the
  // letters on screen may come quicker, but the keys heard keep to a hand's pace (a space or enter always sounds)
  const now = c.currentTime;
  if (kind === 'letter' && now - lastKeyAt < 0.085 + Math.random() * 0.06) return;
  lastKeyAt = now;
  if (!keys) { synthKey(kind); return; }
  const [from, to] = KEY_SETS[kind];
  let i = from + Math.floor(Math.random() * (to - from));
  if (i === lastKey && to - from > 1) i = from + ((i - from + 1) % (to - from));
  lastKey = i;
  const src = c.createBufferSource();
  src.buffer = keys;
  src.playbackRate.value = 0.94 + Math.random() * 0.12;
  const g = c.createGain();
  g.gain.value = (kind === 'letter' ? 0.4 : 0.5) * (0.8 + Math.random() * 0.4);
  const soft = c.createBiquadFilter();   // the click's top taken off: softer, as if from across the room
  soft.type = 'lowpass';
  soft.frequency.value = 3200;
  src.connect(soft).connect(g).connect(out);
  src.start(0, i * KEY_SLOT, KEY_SLOT - 0.01);
}

/** the pointer on one of the opening's buttons, as its word decodes: a quick run of tiny ticks, like digits rolling
 *  over, then a soft high note as it settles. Quiet; it's only a hover */
let hoverAt = 0;
export function hover(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  if (ctx.currentTime - hoverAt < 0.25) return;   // not again for a pointer brushing in and out
  hoverAt = ctx.currentTime;
  for (let i = 0; i < 7; i++) tone(2200 + Math.random() * 1600, i * 0.05, 0.018, 'square', 0.105);   // (louder, three times over: it was hard to hear)
  tone(1320, 0.36, 0.22, 'sine', 0.33);
  tone(1980, 0.37, 0.16, 'sine', 0.15);
}

/** a button in the opening pressed (Step right up, Skip intro): the return key struck, firmly, and the terminal's
 *  answer, two quick rising notes, "accepted", over a soft low thunk. That click is often the first, which wakes the
 *  sound: it waits for that rather than be lost */
export function press(): void {
  if (!ctx || !out) return;
  const go = (): void => {
    lastKeyAt = -1;
    key('enter');
    tone(110, 0, 0.22, 'sine', 0.9, 0.5);
    tone(880, 0.05, 0.07, 'square', 0.18);
    tone(1320, 0.11, 0.2, 'sine', 0.42);
    tone(1980, 0.12, 0.16, 'sine', 0.15);
    tone(2640, 0.13, 0.14, 'sine', 0.075);
  };
  if (ctx.state === 'running') go(); else void ctx.resume().then(go).catch(() => {});
}

/** a moment of grace (a way to pay, chosen): a soft, bright major chord that swells in and hangs, like a choir's
 *  "ah" heard from far off, with a little shimmer over it */
export function holy(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx, t = c.currentTime;
  for (const [f, v] of [[523.25, 0.05], [659.25, 0.04], [783.99, 0.04], [1046.5, 0.03], [1318.5, 0.015]] as const) {
    for (const det of [-4, 4]) {   // two voices a hair apart on each note: a choir, not an organ
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = det;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.35);
      g.gain.setValueAtTime(v, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 2.7);
    }
  }
  for (let i = 0; i < 6; i++) tone(2093 * (1 + (i % 3) * 0.25), 0.15 + i * 0.09, 0.5, 'sine', 0.008);   // the shimmer
}

/** recorded sounds, small ones (public/play/no-cash-only/sfx; made in ElevenLabs, _source/sound/), fetched when the
 *  sound wakes; until one is in, its made-up stand-in plays */
const SFX = { tap: '/play/no-cash-only/sfx/hover-tap.mp3', cash: '/play/no-cash-only/sfx/hover-cash.mp3' } as const;
const sfx: Partial<Record<keyof typeof SFX, AudioBuffer>> = {};
let sfxAsked = false;
function loadSfx(): void {
  if (sfxAsked || !ctx) return;
  sfxAsked = true;
  const c = ctx;
  for (const [k, url] of Object.entries(SFX) as [keyof typeof SFX, string][]) {
    fetch(url).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).then((buf) => { sfx[k] = buf; }).catch(() => {});
  }
}
/** play a recorded sound at a level; soft: its top taken off above that frequency, and it eased in over that many
 *  seconds. False if it isn't in yet */
function play(k: keyof typeof SFX, vol: number, soft?: { lp: number; attack: number }): boolean {
  const buf = sfx[k];
  if (!ctx || !out || !buf) return false;
  const t = ctx.currentTime, src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(soft ? 0 : vol, t);
  if (soft) g.gain.linearRampToValueAtTime(vol, t + soft.attack);
  let node: AudioNode = src;
  if (soft) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = soft.lp; lp.Q.value = 0.5; node = src.connect(lp); }
  node.connect(g).connect(out);
  src.start();
  return true;
}

/** the pointer onto the cash tin: a little jingle of coins (recorded). Not again for a moment */
let tinAt = 0;
export function wakeTin(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  if (ctx.currentTime - tinAt < 0.4) return;
  tinAt = ctx.currentTime;
  play('cash', 0.55);
}

/** the pointer onto the card reader: a short, clean electronic "vwom", as a device wakes (recorded; made up, a low
 *  tone sweeping up through an opening filter with a faint glint on top, until the recording is in). Not again for a
 *  moment */
let readerAt = 0;
export function wakeReader(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx, t = c.currentTime;
  if (t - readerAt < 0.4) return;
  readerAt = t;
  if (play('tap', 0.55, { lp: 2400, attack: 0.08 })) return;   // gentle: quieter, its edge taken off, eased in
  const o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
  o1.type = 'sawtooth'; o2.type = 'sine';
  o1.frequency.setValueAtTime(70, t); o1.frequency.exponentialRampToValueAtTime(150, t + 0.35);
  o2.frequency.setValueAtTime(140, t); o2.frequency.exponentialRampToValueAtTime(300, t + 0.35);
  lp.type = 'lowpass'; lp.Q.value = 6;
  lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(1800, t + 0.22); lp.frequency.exponentialRampToValueAtTime(500, t + 0.55);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o1.connect(lp); o2.connect(lp); lp.connect(g).connect(out);
  o1.start(t); o2.start(t); o1.stop(t + 0.65); o2.stop(t + 0.65);
  tone(2640, 0.12, 0.25, 'sine', 0.012, 1.5);   // the glint
}

/** the opening's screen glitching and dissolving: a soft wash of stuttering static that fades, and a faint high
 *  tone falling away */
export function glitch(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx, o = out;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / c.sampleRate;
    const gate = Math.sin(t * 90 + Math.sin(t * 23) * 4) > 0.2 ? 1 : 0.15;   // stuttering, on and off
    d[i] = (Math.random() * 2 - 1) * gate * (1 - t / 0.6);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1600;
  bp.Q.value = 0.5;
  const g = c.createGain();
  g.gain.value = 0.27;   // (louder: going in should be felt)
  src.connect(bp).connect(g).connect(o);
  src.start();
  tone(2600, 0.45, 0.8, 'sine', 0.09, 0.5);              // the screen, going off
  tone(70, 0.4, 0.9, 'sine', 0.66, 1.6);                 // and a low swell under it, rising, into the street
}

/** a rubber chop coming down hard on a receipt on a wooden counter: a low thump, a dry slap of paper, and a little
 *  knock of the wood under it. Each one a touch different (n: which in a run, so a run climbs a little) */
export function stamp(n = 0): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx, o = out, t0 = c.currentTime;
  const lift = 1 + Math.min(n, 6) * 0.04 + (Math.random() - 0.5) * 0.06;
  const thump = c.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(150 * lift, t0);
  thump.frequency.exponentialRampToValueAtTime(52, t0 + 0.12);
  const tg = c.createGain();
  tg.gain.setValueAtTime(0.0001, t0);
  tg.gain.exponentialRampToValueAtTime(1.0, t0 + 0.005);   // (louder: three times, near the top)
  tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  thump.connect(tg).connect(o);
  thump.start(t0);
  thump.stop(t0 + 0.2);
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.09), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
  const slap = c.createBufferSource();
  slap.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1400 * lift;
  bp.Q.value = 0.7;
  const sg = c.createGain();
  sg.gain.value = 1.05;
  slap.connect(bp).connect(sg).connect(o);
  slap.start(t0);
  // the wood: a short hollow knock
  const knock = c.createOscillator();
  knock.type = 'triangle';
  knock.frequency.setValueAtTime(420 * lift, t0);
  const kg = c.createGain();
  kg.gain.setValueAtTime(0.0001, t0);
  kg.gain.exponentialRampToValueAtTime(0.36, t0 + 0.003);
  kg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
  knock.connect(kg).connect(o);
  knock.start(t0);
  knock.stop(t0 + 0.08);
}

/** the card reader: two quick beeps, the second higher */
export function beep(): void {
  tone(1320, 0, 0.09, 'square', 0.12);
  tone(1760, 0.11, 0.16, 'square', 0.12);
}

/** coins dropped one by one into the tin, or counted out as change */
export function coins(n: number, gap = 0.13): void {
  for (let i = 0; i < n; i++) {
    const f = 2600 + Math.random() * 900;
    tone(f, i * gap, 0.22, 'triangle', 0.14);
    tone(f * 1.5, i * gap + 0.004, 0.12, 'sine', 0.06);
  }
}

/** a ring on a glass bottle */
function clink(): void {
  const f = 2200 + Math.random() * 600;
  tone(f, 0, 0.5, 'sine', 0.16);
  tone(f * 2.76, 0, 0.25, 'sine', 0.05);
}

/** a ringer: three notes up */
function win(): void {
  [784, 988, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.18));
}

/** a prize into the plastic bag: a short crinkle (noise, high-passed, in a few quick bursts) */
export function rustle(): void {
  if (!ctx || !out) return;
  const len = Math.floor(0.35 * ctx.sampleRate);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate;
    const bursts = Math.max(0, Math.sin(t * 70 + Math.sin(t * 23) * 3)) ** 3;
    d[i] = (Math.random() * 2 - 1) * bursts * Math.exp(-t * 7);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  src.connect(hp).connect(g).connect(out);
  src.start();
}

/** a ring against the neon sign: a hollow tin knock, and the buzz of the tube catching again */
/** a prize set down on the cloth-covered stand: a soft, low knock */
export function plop(): void {
  tone(190, 0, 0.12, 'sine', 0.22, 0.4);
  tone(95, 0.01, 0.16, 'sine', 0.16);
}

export function clank(): void {
  tone(420, 0, 0.12, 'triangle', 0.18, 0.7);
  tone(1100, 0.005, 0.08, 'square', 0.05);
  tone(120, 0.05, 0.35, 'sawtooth', 0.05);
}

/** a ring off the owner's head */
function bonk(): void {
  tone(220, 0, 0.18, 'sine', 0.35, 0.5);
}

/** the night market, recorded (made in ElevenLabs: _source/sound/), on a loop under everything; quieter while
 *  she talks (duck), so her lines come through */
const MARKET = '/play/no-cash-only/street.mp3';
const MARKET_VOL = 1.6;   // the recording is quiet (about -35 dB on average): brought well up, so the crowd is what you hear
let market: GainNode | null = null;
function crowd(): void {
  if (!ctx || !out) return;
  const c = ctx, o = out;
  market = c.createGain();
  market.gain.value = 0;
  market.connect(o);
  fetch(MARKET).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).then((buf) => {
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0.06;                     // past the MP3's bit of silence at each end, so the loop has no gap
    src.loopEnd = buf.duration - 0.06;
    src.connect(market!);
    src.start(0, 0.06);
    market!.gain.linearRampToValueAtTime(MARKET_VOL, c.currentTime + 2.5);   // fades in
  }).catch(() => {});
}

/** the street's noise brought to a level (share of its usual) over so many seconds: hushed while the stall is dark
 *  in the opening, back up as its lights come on */
export function streetLevel(level: number, secs: number): void {
  if (!ctx || !market) return;
  const t = ctx.currentTime;
  market.gain.cancelScheduledValues(t);
  market.gain.setValueAtTime(market.gain.value, t);
  market.gain.linearRampToValueAtTime(MARKET_VOL * level, t + secs);
}

/** a bulb taking: a tiny tick and a faint tink of glass */
export function bulb(): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  tone(2400 + Math.random() * 1200, 0, 0.02, 'square', 0.02);
  tone(5200 + Math.random() * 800, 0.004, 0.06, 'sine', 0.012);
}

/** a neon sign striking: the transformer's buzz, stuttering as the tube catches, for `len` seconds, then a steady
 *  low hum that fades under the street */
export function buzz(len: number): void {
  if (!ctx || !out || ctx.state !== 'running') return;
  const c = ctx, t = c.currentTime;
  const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.value = 120;
  bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
  g.gain.setValueAtTime(0, t);
  for (let k = 0; k < len; k += 0.04) g.gain.setValueAtTime(Math.random() < 0.55 ? 0.05 : 0.004, t + k);   // stutter
  g.gain.setValueAtTime(0.035, t + len);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + 1.6);
  o.connect(bp).connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 1.7);
}

/** she has started (true) or finished (false) saying a line */
export function duck(on: boolean): void {
  if (!ctx || !market) return;
  const t = ctx.currentTime;
  market.gain.cancelScheduledValues(t);
  market.gain.setValueAtTime(market.gain.value, t);
  market.gain.linearRampToValueAtTime(on ? MARKET_VOL * 0.4 : MARKET_VOL, t + (on ? 0.15 : 0.6));
}

/** the street: just the recorded night market (crowd), for as long as the page is open. (There was a made-up
 *  rumble of traffic and a neon hum under it; they only muddied the recording, so they're gone) */
function street(): void {
  crowd();
}

on('clink', ({ prize }) => { if (prize.glass) clink(); });
on('win', () => win());
on('owner', () => bonk());
