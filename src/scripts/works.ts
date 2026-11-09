// Index / Images switch (Index by default). One choice for the whole page.
type View = 'img' | 'txt';
const isView = (v: string | null | undefined): v is View => v === 'img' || v === 'txt';

const buttons = document.querySelectorAll<HTMLButtonElement>('[data-view-btn]');
const set = (v: View): void => {
  if (document.documentElement.dataset.view !== v) tidyAll(false);   // switching views puts every card back
  document.documentElement.dataset.view = v;
  requestAnimationFrame(() => placePreviews());   // the Index lists can only be measured while shown
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === v)));
};

// ---- Images: pick the cards up and move them (desktop only) ----
// a press that moves under 5px is still a click (opens the work); further than that it's a drag, and the click is dropped
const canDrag = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches;
let zTop = 1;
const tidyBtns = document.querySelectorAll<HTMLButtonElement>('[data-tidy]');
function tidyAll(animate: boolean): void {
  document.querySelectorAll<HTMLElement>('.card').forEach((c) => {
    if (!c.style.getPropertyValue('--dx')) return;
    if (animate) { c.classList.add('is-tidying'); setTimeout(() => c.classList.remove('is-tidying'), 950); }
    c.style.removeProperty('--dx'); c.style.removeProperty('--dy');
  });
  tidyBtns.forEach((b) => { b.hidden = true; });
}
if (canDrag) {
  document.documentElement.classList.add('can-drag');
  tidyBtns.forEach((b) => b.addEventListener('click', () => tidyAll(true)));
  document.querySelectorAll<HTMLAnchorElement>('.card').forEach((card) => {
    card.draggable = false;
    let sx = 0, sy = 0, ox = 0, oy = 0, down = false, moved = false;
    let lim = { x0: -Infinity, x1: Infinity, y0: -Infinity, y1: Infinity };   // how far it may go: it stays inside its own section
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY;
      ox = parseFloat(card.style.getPropertyValue('--dx')) || 0; oy = parseFloat(card.style.getPropertyValue('--dy')) || 0;
      // the picture + caption as they sit now, and the section's box: the offset is clamped so they never leave it
      const parts = [...card.querySelectorAll<HTMLElement>('.ph, .cap')].map((el) => el.getBoundingClientRect());
      const sec = card.closest('.works')?.getBoundingClientRect();
      if (sec && parts.length) {
        const l = Math.min(...parts.map((r) => r.left)), r = Math.max(...parts.map((q) => q.right));
        const t = Math.min(...parts.map((q) => q.top)), b = Math.max(...parts.map((q) => q.bottom));
        lim = { x0: ox + sec.left - l, x1: ox + sec.right - r, y0: oy + sec.top - t, y1: oy + sec.bottom - b };
      }
    });
    card.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) { moved = true; card.setPointerCapture(e.pointerId); card.classList.add('is-dragging'); card.style.zIndex = String(++zTop); }
      const cl = (v: number, a: number, b: number): number => Math.max(Math.min(a, b), Math.min(Math.max(a, b), v));
      card.style.setProperty('--dx', `${cl(ox + dx, lim.x0, lim.x1)}px`); card.style.setProperty('--dy', `${cl(oy + dy, lim.y0, lim.y1)}px`);
    });
    const end = (): void => {
      if (!down) return; down = false;
      card.classList.remove('is-dragging');
      if (moved) card.closest('.works')?.querySelector<HTMLButtonElement>('[data-tidy]')?.removeAttribute('hidden');
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    card.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } });
    card.addEventListener('dragstart', (e) => e.preventDefault());
  });
}

// every visit opens on Index; a click switches the whole page for this view (an old saved choice is forgotten)
try { sessionStorage.removeItem('sl-view'); } catch { /* private mode */ }
set('txt');
// switching changes the height of every section (the choice is for the whole page), so the page would jump: keep the
// switch that was pressed exactly where it was on the screen, so you stay in the section you were looking at. The
// sections above go on changing for a moment (their pictures load, the view fades in), so it is held there (until
// the reader scrolls, or five seconds), re-measured as the page settles; the browser's own scroll anchoring is off meanwhile, so the two
// don't both correct.
let hold = 0;
buttons.forEach((b) => b.addEventListener('click', () => {
  const v = b.dataset.viewBtn; if (!isView(v)) return;
  const target = b.getBoundingClientRect().top, root = document.documentElement;
  root.style.overflowAnchor = 'none';
  set(v);
  const pin = (): void => {
    const d = b.getBoundingClientRect().top - target;
    if (Math.abs(d) > .5) window.scrollTo({ top: window.scrollY + d, behavior: 'instant' as ScrollBehavior });
  };
  pin();
  cancelAnimationFrame(hold);
  const until = performance.now() + 5000;   // (pictures above may still be loading: hold it until the reader scrolls, or five seconds)
  const loop = (): void => { pin(); if (performance.now() < until) hold = requestAnimationFrame(loop); else root.style.overflowAnchor = ''; };
  hold = requestAnimationFrame(loop);
  const stop = (): void => { cancelAnimationFrame(hold); root.style.overflowAnchor = ''; };
  addEventListener('wheel', stop, { once: true, passive: true }); addEventListener('touchmove', stop, { once: true, passive: true }); addEventListener('keydown', stop, { once: true });   // (the reader scrolls: let go)
}));

// looping videos: pause while off screen, stay still for reduced motion
const videos = document.querySelectorAll<HTMLVideoElement>('.works .ph video');   // the Images cards only; the Index previews play on hover (below)
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  videos.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
} else if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    if (e.isIntersecting) v.play().catch(() => undefined); else v.pause();
  }), { rootMargin: '200px' });
  videos.forEach((v) => io.observe(v));
}

export {};

// Index hover: the preview video only loads and plays while its line is hovered (or focused), then pauses
document.querySelectorAll<HTMLAnchorElement>('.ix').forEach((row) => {
  const v = row.querySelector<HTMLVideoElement>('.ixp video');
  if (!v) return;
  // the first hover starts it from the beginning; after that each hover picks up where the last one paused
  let started = false;
  const play = (): void => { if (!started) { started = true; v.currentTime = 0; } void v.play().catch(() => {}); };
  const stop = (): void => { v.pause(); };
  row.addEventListener('mouseenter', play); row.addEventListener('focus', play);
  row.addEventListener('mouseleave', stop); row.addEventListener('blur', stop);
});

// (the scroll reveal is site-wide now: scripts/reveal.ts)


// Index previews sit in the empty band between the longest title and the category column, so a preview never
// covers another work's title. Measured per list on load, once the fonts are in, and on resize.
function bandOf(list: HTMLElement): { titleEnd: number; free: number } {
  const lr = list.getBoundingClientRect();
  let titleEnd = 0, catStart = lr.width;
  list.querySelectorAll<HTMLElement>('.ix').forEach((ix) => {
    const pt = ix.querySelector('.pt'), rg = document.createRange();
    if (pt) rg.selectNodeContents(pt);
    const t = pt ? rg.getBoundingClientRect() : null, c = ix.querySelector('.cat')?.getBoundingClientRect();
    if (t) titleEnd = Math.max(titleEnd, t.right - lr.left + 10);
    if (c) catStart = Math.min(catStart, c.left - lr.left);
  });
  return { titleEnd, free: catStart - titleEnd - 80 };
}
function placePreviews(): void {
  const webList = document.querySelector<HTMLElement>('#web .ixl');
  const webFree = webList && webList.getBoundingClientRect().width ? bandOf(webList).free : 562;
  document.querySelectorAll<HTMLElement>('.ixl').forEach((list) => {
    const lr = list.getBoundingClientRect();
    if (!lr.width) return;
    let titleEnd = 0, catStart = lr.width;
    list.querySelectorAll<HTMLElement>('.ix').forEach((ix) => {
      // the title box stretches across its grid column, so measure the words themselves
      const pt = ix.querySelector('.pt'), rg = document.createRange();
      if (pt) rg.selectNodeContents(pt);
      const t = pt ? rg.getBoundingClientRect() : null, c = ix.querySelector('.cat')?.getBoundingClientRect();
      if (t) titleEnd = Math.max(titleEnd, t.right - lr.left + 10);   // +10: the title nudges right on hover
      if (c) catStart = Math.min(catStart, c.left - lr.left);
    });
    const gap = 40, free = catStart - titleEnd - gap * 2;
    const w = Math.min(list.closest('#web') ? 562 : 360, free);   // Web previews larger (562 vs 360)
    if (w < 140) {   // no room beside the titles (narrow screens): fall back to the default spot
      list.style.removeProperty('--ixp-x'); list.style.removeProperty('--ixp-w'); list.style.removeProperty('--ixp-r');
      return;
    }
    list.style.setProperty('--ixp-x', `${Math.round(titleEnd + gap + (free - w) / 2)}px`);
    list.style.setProperty('--ixp-w', `${Math.round(w)}px`);
    list.style.setProperty('--ixp-r', 'auto');
    // Art: each preview as large in area as a Web one (a Web screen is about 3:2), so a wide one is wider and a tall one
    // narrower but taller; centred in its band and never wider than the band (works.css)
    if (list.closest('#art')) {
      const webW = Math.min(562, webFree);
      list.style.setProperty('--ixp-k', `${(webW / Math.sqrt(1.5)).toFixed(1)}px`);
      list.style.setProperty('--ixp-free', `${Math.round(free)}px`);
      list.style.setProperty('--ixp-cx', `${Math.round(titleEnd + gap + free / 2)}px`);
    }
  });
}
document.fonts.ready.then(placePreviews);
let placeRaf = 0;
addEventListener('resize', () => { cancelAnimationFrame(placeRaf); placeRaf = requestAnimationFrame(placePreviews); });
