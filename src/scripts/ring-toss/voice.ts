// The owner's voice: Siman's lines, recorded (lines.ts VOICED), played as she types them out. A line that has no
// recording is only shown. They play through the page's own audio (Web Audio, sound.ts), not one <audio> each: on a
// phone or an iPad an <audio> may only start from a tap, so a line said later, after a ring lands, stayed silent
// while its words came up. Browsers won't play sound before the first click, so a line said before it (the greeting,
// when the opening runs by itself) waits, and is said on that click if it's still on screen.
import { LINES, VOICED } from './lines';
import { audioContext, duck } from './sound';

const BASE = '/play/no-cash-only/voice/';
const FILES = new Map<string, string>();
for (const pool of VOICED) LINES[pool].forEach((line, i) => FILES.set(line, `${BASE}${pool}-${i + 1}.mp3`));

const bytes = new Map<string, Promise<ArrayBuffer>>();
const decoded = new Map<string, Promise<AudioBuffer>>();
let gain: GainNode | null = null;
let playing: AudioBufferSourceNode | null = null;
let waiting: { url: string; at: number } | null = null;
let woken = false;
let quiet = false;
let said = 0;   // which line is the latest asked for (a slow decode mustn't play an older one over it)

/** her lines silent too, when the sound is switched off */
export function muteVoice(m: boolean): void { quiet = m; if (gain) gain.gain.value = m ? 0 : 1; }

/** fetch a clip's file (once) */
const fetchClip = (url: string): Promise<ArrayBuffer> => {
  let p = bytes.get(url);
  if (!p) { p = fetch(url).then((r) => r.arrayBuffer()); bytes.set(url, p); }
  return p;
};
/** and decode it, once there's an audio context */
const decode = (ctx: AudioContext, url: string): Promise<AudioBuffer> => {
  let p = decoded.get(url);
  if (!p) { p = fetchClip(url).then((b) => ctx.decodeAudioData(b.slice(0))); decoded.set(url, p); }
  return p;
};

const stop = (): void => {
  if (playing) { playing.onended = null; try { playing.stop(); } catch { /* done already */ } playing = null; duck(false); }
};

/** say this line out loud, if it was recorded; whatever she was saying stops. length: told how long it runs (ms) */
export function speak(text: string, length?: (ms: number) => void): void {
  const url = FILES.get(text);
  stop();
  waiting = null;
  const n = ++said;
  if (!url) return;
  const ctx = audioContext();
  if (!ctx) { waiting = { url, at: performance.now() }; void fetchClip(url); return; }
  // (still waking, on the click that wakes it: it's said once it's up; never woken yet: held for that click)
  const up = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
  void up.then(() => {
    if (ctx.state !== 'running') { if (n === said) waiting = { url, at: performance.now() }; throw new Error('not yet'); }
    return decode(ctx, url);
  }).then((buf) => {
    if (n !== said) return;   // something newer was said meanwhile
    length?.(buf.duration * 1000);
    if (!gain) { gain = ctx.createGain(); gain.gain.value = quiet ? 0 : 1; gain.connect(ctx.destination); }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.onended = () => { if (playing === src) { playing = null; duck(false); } };
    playing = src;
    duck(true);
    src.start();
  }).catch(() => { /* this one didn't load: only shown */ });
}

/** the first click: fetch the lines, and say the one that was held back, if it's recent */
export function wakeVoice(): void {
  if (woken) return;
  woken = true;
  // the lines likely in the first minute now; the rest a little later, so they don't hold up the prizes loading
  const SOON = ['open', 'payCash', 'payTap', 'miss', 'win', 'near'];
  const all = [...FILES.values()];
  for (const url of all.filter((u) => SOON.some((p) => u.includes(`/${p}-`)))) void fetchClip(url);
  window.setTimeout(() => { for (const url of all) void fetchClip(url); }, 20000);
  const w = waiting;
  waiting = null;
  if (w && performance.now() - w.at < 5000) {
    // the context resumes on this same click (sound.ts wake): play it once it has
    const text = [...FILES.entries()].find(([, u]) => u === w.url)?.[0];
    if (text) window.setTimeout(() => speak(text), 60);
  }
}
