// The owner's voice: Siman's lines, recorded (lines.ts VOICED), played as she types them out. A line that has no
// recording is only shown. Browsers won't play sound before the first click, so a line said before it (the
// greeting, when the opening runs by itself) waits, and is said on that click if it's still on screen.
import { LINES, VOICED } from './lines';
import { duck } from './sound';

const BASE = '/play/no-cash-only/voice/';
const FILES = new Map<string, string>();
for (const pool of VOICED) LINES[pool].forEach((line, i) => FILES.set(line, `${BASE}${pool}-${i + 1}.mp3`));

const clips = new Map<string, HTMLAudioElement>();
let playing: HTMLAudioElement | null = null;
let waiting: { clip: HTMLAudioElement; at: number } | null = null;
let woken = false;
let quiet = false;
/** her lines silent too, when the sound is switched off */
export function muteVoice(m: boolean): void { quiet = m; for (const c of clips.values()) c.muted = m; }

const clip = (url: string): HTMLAudioElement => {
  let a = clips.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = 'auto';
    a.muted = quiet;
    a.addEventListener('playing', () => duck(true));
    a.addEventListener('ended', () => duck(false));
    a.addEventListener('pause', () => { if (!playing || playing.paused) duck(false); });
    clips.set(url, a);
  }
  return a;
};

/** say this line out loud, if it was recorded; whatever she was saying stops. length: told how long it runs (ms) */
export function speak(text: string, length?: (ms: number) => void): void {
  const url = FILES.get(text);
  playing?.pause();
  playing = null;
  waiting = null;
  if (!url) return;
  const a = clip(url);
  a.currentTime = 0;
  playing = a;
  if (length) {
    if (a.duration) length(a.duration * 1000);
    else a.addEventListener('loadedmetadata', () => { if (playing === a) length(a.duration * 1000); }, { once: true });
  }
  a.play().catch(() => { if (playing === a) waiting = { clip: a, at: performance.now() }; });
}

/** the first click: fetch the rest, and say the line that was held back, if it's recent */
export function wakeVoice(): void {
  if (woken) return;
  woken = true;
  // the lines likely in the first minute now; the rest a little later, so they don't hold up the prizes loading
  const SOON = ['open', 'payCash', 'payTap', 'miss', 'win', 'near'];
  const soon = [...FILES.values()].filter((u) => SOON.some((p) => u.includes(`/${p}-`)));
  for (const url of soon) clip(url);
  window.setTimeout(() => { for (const url of FILES.values()) clip(url); }, 20000);
  if (waiting && performance.now() - waiting.at < 5000) { const a = waiting.clip; a.currentTime = 0; void a.play().catch(() => {}); }
  waiting = null;
}
