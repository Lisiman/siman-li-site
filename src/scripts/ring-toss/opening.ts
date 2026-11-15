// The opening, before the game: black, and all the lines on one screen, typed out quickly one after another, like
// the title on the home page ("Hi, I'm Siman, a Creative Technologist_"), over the noise of the street (sound.ts).
// The lines are in the page (play.astro). Skip intro goes straight in. Then the button that lets you in. Behind it the stall goes on loading, so by the time you step up it's all there.

const TYPE = 45;      // ms a letter, on average: a person typing fast, so never even (see gapAfter)
const LINE = 250;     // ms between lines
const GROUP = 500;    // ms more between groups
const FIRST = 500;    // ms of black before the first letter

export type KeyKind = 'letter' | 'space' | 'enter';

/** how long a fast typist takes before the next key: uneven, in little runs. Letters inside a word come quick
 *  (common pairs quicker still), there's a beat after a space and a longer one after a comma or a full stop, and
 *  now and then a small hesitation, as a hand finds the next word */
function gapAfter(c: string, next: string | undefined): number {
  let ms = TYPE * (0.45 + Math.random() * 0.9);
  if (c === ' ') ms = TYPE * (1.3 + Math.random() * 1.4);
  else if (/[,.…?·]/.test(c)) ms = TYPE * (3 + Math.random() * 3);
  else if (next && /[aeiouthnrs]/i.test(next) && Math.random() < 0.5) ms *= 0.6;   // fingers that fall together
  if (Math.random() < 0.05) ms += 80 + Math.random() * 140;
  return ms;
}

/**
 * Play the opening in `el`. Resolves when the player has pressed the button (and the stall has loaded), once the
 * black has faded away. (The sound has its own switch, top right: main.ts.)
 */
export function playOpening(el: HTMLElement, o: { ready(): boolean; soundOn(): boolean; key?(kind: KeyKind): void; glitch?(): void; hover?(): void; press?(): void; seen?: boolean }): Promise<void> {
  // seen already in this tab: no opening (the loading line shows meanwhile), only, once the stall is in, the lights
  // coming on
  if (o.seen) {
    el.remove();
    return new Promise<void>((done) => {
      const go = (): void => { if (o.ready()) done(); else requestAnimationFrame(go); };
      go();
    });
  }
  const text = el.querySelector<HTMLElement>('.rt-cine-text')!;
  const cta = el.querySelector<HTMLButtonElement>('.rt-cine-go')!;
  const skipEl = el.querySelector<HTMLButtonElement>('.rt-cine-skip')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let skip = reduce, jump = false;
  // Skip intro: straight in (the rest of the lines at once, then the way in, without Step right up). A click
  // anywhere else only turns the sound on
  skipEl.addEventListener('click', () => { o.press?.(); skip = true; jump = true; skipEl.disabled = true; });
  decodeOnHover(skipEl, o.hover);
  // 'Click anywhere for sound', under the button, until the sound is on (at once, if the browser allows it)
  const soundHint = el.querySelector<HTMLElement>('.rt-cine-sound');
  const watchSound = (): void => {
    if (!soundHint || !el.isConnected) return;
    if (o.soundOn()) { soundHint.classList.add('is-off'); return; }
    requestAnimationFrame(watchSound);
  };
  watchSound();


  // every line is in the page already (play.astro), its untyped part invisible, so nothing moves while it types
  const cursor = document.createElement('span');
  cursor.className = 'rt-cine-cursor';
  cursor.textContent = '\u2588';   // a terminal's block cursor
  const rows = [...text.querySelectorAll<HTMLElement>('.rt-cine-group')].flatMap((g) => [...g.querySelectorAll('p')].map((p, i) => {
    const [typed, rest] = [...p.children] as HTMLElement[];
    return { typed, rest, full: rest.textContent ?? '', gap: i === 0, fast: g.classList.contains('is-cmd') };
  }));

  const wait = (ms: number): Promise<void> => (skip ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
  const run = async (): Promise<void> => {
    await wait(FIRST);
    for (const [i, row] of rows.entries()) {
      if (i) await wait(row.gap ? GROUP : LINE);
      row.typed.after(cursor);
      row.typed.parentElement!.classList.add('is-started');   // its prompt shows as the line begins
      for (let n = 1; n <= row.full.length; n++) {
        if (skip) n = row.full.length;
        row.typed.textContent = row.full.slice(0, n);
        const c = row.full[n - 1];
        if (!skip) o.key?.(c === ' ' ? 'space' : n === row.full.length ? 'enter' : 'letter');
        row.rest.textContent = row.full.slice(n);
        await wait(gapAfter(c, row.full[n]) / (row.fast ? 2 : 1));   // the command, typed by a hand that types it every day: twice as fast
      }
    }
  };

  return run().then(() => new Promise<void>((done) => {
    /** in, from this button: the stall is nearly always loaded by now; if not, the button says so and goes in as
     *  soon as it is. Then a soft glitch, and the screen dissolves into the street (the page's CSS) */
    const enter = (btn: HTMLButtonElement): void => {
      btn.disabled = true;
      const go = (): void => {
        if (!o.ready()) { btn.textContent = 'Setting up the stall…'; requestAnimationFrame(go); return; }
        const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
        o.glitch?.();
        el.classList.add('is-glitch');
        window.setTimeout(() => {
          el.classList.add('is-off');
          done();
          window.setTimeout(() => el.remove(), 1200);
        }, quick ? 0 : 550);
      };
      go();
    };
    if (jump) { enter(skipEl); return; }   // skipped: no Step right up
    skipEl.classList.remove('is-on');
    skipEl.tabIndex = -1;
    cta.classList.add('is-on');
    decodeOnHover(cta, o.hover);
    cta.focus({ preventScroll: true });
    cta.addEventListener('click', () => { o.press?.(); enter(cta); }, { once: true });
  }));
}

/** the button's word, on hover or focus: each letter flickers through random ones and settles, left to right; and
 *  on hover, a sound to go with it (sound.ts hover) */
function decodeOnHover(btn: HTMLElement, sound?: () => void): void {
  // the sound with it, on a real hover only (not when the button takes the focus by itself as it appears)
  btn.addEventListener('pointerenter', () => sound?.());
  const label = btn.querySelector<HTMLElement>('.rt-cine-cta-label');
  if (!label || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const word = label.textContent ?? '';
  label.setAttribute('aria-label', word);
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=/<>';
  let raf = 0;
  const run = (): void => {
    cancelAnimationFrame(raf);
    const t0 = performance.now(), LEN = 420;
    const tick = (): void => {
      const k = (performance.now() - t0) / LEN;
      label.textContent = [...word].map((c, i) => (c === ' ' || i < k * word.length ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      if (k < 1) raf = requestAnimationFrame(tick); else label.textContent = word;
    };
    tick();
  };
  btn.addEventListener('pointerenter', run);
  btn.addEventListener('focus', run);
}
