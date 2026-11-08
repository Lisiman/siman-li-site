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
buttons.forEach((b) => b.addEventListener('click', () => { if (isView(b.dataset.viewBtn)) set(b.dataset.viewBtn); }));

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
function placePreviews(): void {
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
  });
}
document.fonts.ready.then(placePreviews);
let placeRaf = 0;
addEventListener('resize', () => { cancelAnimationFrame(placeRaf); placeRaf = requestAnimationFrame(placePreviews); });
