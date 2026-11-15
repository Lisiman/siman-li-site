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
export function watchLoading(el: HTMLElement): { ready(): boolean } {
  const text = el.querySelector('pre')!;
  let loaded = 0, total = 0, done = false, what = 'hanging the banner';
  const show = (): void => {
    const pct = total ? Math.round((loaded / total) * 100) : 0;
    text.textContent = `LUCKY 88 · RING TOSS\n\n${what} · ${pct}%`;
  };
  let finishing = false;
  const finish = (): void => {
    if (finishing) return;
    finishing = true;
    text.textContent = 'LUCKY 88 · RING TOSS\n\nopen · 100%';
    window.setTimeout(() => el.classList.add('is-done'), 300);
    window.setTimeout(() => { done = true; }, 500);
    window.setTimeout(() => el.remove(), 1000);
  };
  const m = THREE.DefaultLoadingManager;
  m.onStart = (url, l, t) => { what = doing(url); loaded = l; total = t; show(); };
  m.onProgress = (url, l, t) => { what = doing(url); loaded = l; total = t; show(); };
  m.onLoad = () => { loaded = total; show(); window.setTimeout(finish, 250); };
  m.onError = (url) => console.warn('did not load', url);
  show();
  window.setTimeout(finish, LIMIT);
  // nothing to load at all (all of it failed to start): don't wait
  requestAnimationFrame(() => requestAnimationFrame(() => { if (total === 0) finish(); }));
  return { ready: () => done };
}
