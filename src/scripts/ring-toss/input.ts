// Every way of throwing ends in the same Toss: which way (aim) and how hard (power). With a mouse or trackpad you
// hold to aim and release to throw; with a finger you swipe up. The hand seen by the camera (hands.ts, later)
// makes the same Toss, so the game never changes.

export interface Toss {
  /** -1 (far left) … 1 (far right) */
  aim: number;
  /** 0 (a short lob) … 1 (as far as it goes) */
  power: number;
}

export interface InputHooks {
  toss(t: Toss): void;
  /** where it would go now (the ring in your hand follows it) */
  aim?(aim: number): void;
  /** while holding: the power swinging up and down; null when let go */
  charge?(power: number | null): void;
}

interface Sample { x: number; y: number; t: number; }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** one full swing of the power, 0 → 1 → 0, in ms */
const SWING = 1700;

/** the pointer's place across the screen as an aim: the middle is straight ahead */
const aimAt = (x: number): number => clamp((x / innerWidth * 2 - 1) * 1.15, -1, 1);

export function pointerInput(el: HTMLElement, hooks: InputHooks): void {
  let id: number | null = null;
  let touch = false;
  let samples: Sample[] = [];
  let aim = 0, power = 0, start = 0, frame = 0;

  const swing = (now: number): void => {
    const phase = ((now - start) / SWING) % 1;
    power = 1 - Math.abs(1 - phase * 2);                 // up, then down again
    hooks.charge?.(power);
    frame = requestAnimationFrame(swing);
  };
  const stop = (): void => {
    id = null;
    cancelAnimationFrame(frame);
    hooks.charge?.(null);
  };

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      if (e.pointerId !== id) return;
      samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      if (samples.length > 40) samples.shift();
      hooks.aim?.(clamp((e.clientX - samples[0].x) / (innerWidth / 2), -1, 1));
      return;
    }
    aim = aimAt(e.clientX);                              // the mouse aims whether held or not
    hooks.aim?.(aim);
  });

  el.addEventListener('pointerdown', (e) => {
    if (id !== null || e.button > 0) return;
    id = e.pointerId;
    touch = e.pointerType === 'touch';
    el.setPointerCapture(e.pointerId);
    if (touch) { samples = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]; return; }
    aim = aimAt(e.clientX);
    start = performance.now();
    swing(start);
  });

  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    if (!touch) { stop(); hooks.toss({ aim, power }); return; }
    stop();
    hooks.aim?.(0);
    // a swipe: the last 90 ms of it is the throw itself; its speed is the power, its slant the aim
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    const last = samples[samples.length - 1];
    const from = samples.find((s) => last.t - s.t <= 90) ?? samples[0];
    const dt = Math.max(16, last.t - from.t);
    const up = (from.y - last.y) / dt * 1000 / innerHeight;   // screen heights per second, upward
    const side = (last.x - from.x) / dt * 1000 / innerHeight;
    if (up < 0.5 || samples[0].y - last.y < 24) return;        // a tap or a drag down is not a throw
    hooks.toss({ aim: clamp(side / up * 1.6, -1, 1), power: clamp((up - 0.9) / 3.4, 0, 1) });
  });

  el.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { stop(); if (touch) hooks.aim?.(0); } });
}

/** what to tell the player, for the kind of pointer they have */
export const HINT = matchMedia('(pointer: coarse)').matches ? 'Swipe up to toss' : 'Hold to aim · Release to throw';
