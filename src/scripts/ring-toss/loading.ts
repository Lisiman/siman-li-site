// While the owner and the prizes download, a line of till paper says how it's going, with real numbers (every
// file three.js loads goes through its default loading manager). The opening waits for it, so nothing pops in
// from greybox to model in front of you; after 8 s it starts anyway with whatever has arrived.
import * as THREE from 'three';

const LIMIT = 8000;

/** what's being loaded, by file */
function doing(url: string): string {
  if (url.includes('/owner/owner.glb')) return 'waking the owner';
  if (url.includes('/owner/')) return 'ironing the vest';
  if (url.includes('/prizes/')) return 'stocking prizes';
  return 'hanging the banner';
}

/** Watch the loading; call before anything starts to load. ready() is true once it is all in (or time is up). */
/** a bar of n cells, as a terminal draws one */
const bar = (k: number, n = 16): string => '\u25A0'.repeat(Math.round(k * n)) + '\u25A1'.repeat(n - Math.round(k * n));

export function watchLoading(el: HTMLElement): { ready(): boolean } {
  // every place the progress is shown: the loading screen, and the foot of the opening
  const lines = [...document.querySelectorAll<HTMLElement>('.rt-status')];
  let loaded = 0, total = 0, done = false, what = 'hanging the banner';
  const write = (html: string): void => { for (const l of lines) l.innerHTML = html; };
  const show = (): void => {
    if (finishing) return;
    const k = total ? loaded / total : 0;
    write(`<b>\u203A</b> ${what}  ${bar(k)}  ${String(Math.round(k * 100)).padStart(3)}%`);
  };
  let finishing = false;
  const finish = (): void => {
    if (finishing) return;
    finishing = true;
    write(`<b>\u203A</b> stall ready  ${bar(1)}  100%`);
    for (const l of lines) l.classList.add('is-done');
    window.setTimeout(() => el.classList.add('is-done'), 300);
    window.setTimeout(() => { done = true; }, 500);
    window.setTimeout(() => el.remove(), 1000);
  };
  const m = THREE.DefaultLoadingManager;
  // all in, for now: but the models start loading a moment after the first textures, so all-in once isn't all-in.
  // Done only when nothing new has started for a little while
  let settle = 0;
  const more = (url: string, l: number, t: number): void => { clearTimeout(settle); what = doing(url); loaded = l; total = t; show(); };
  m.onStart = more;
  m.onProgress = more;
  m.onLoad = () => { loaded = total; show(); clearTimeout(settle); settle = window.setTimeout(finish, 700); };
  m.onError = (url) => console.warn('did not load', url);
  show();
  window.setTimeout(finish, LIMIT);
  // nothing to load at all (all of it failed to start): don't wait. (It used to look after two frames, before the
  // models had begun to load: it called it done at once, at 0%)
  window.setTimeout(() => { if (total === 0) finish(); }, 1500);
  return { ready: () => done };
}
