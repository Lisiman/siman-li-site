// The moon, the same everywhere on the site: drawn in line only, its shape showing the phase — a crescent, a half, a
// gibbous, a full circle; at new moon just a faint dotted ring. Used by the painting at the top (hero.ts) and the sky
// of home at the bottom (home-sky.ts).

/** the moon's outline at phase `ph` (0 new · 0.25 first quarter · 0.5 full · 0.75 last quarter), radius r, centred
 *  on 0,0. Waxing it is lit on the right, waning on the left (as seen from the northern hemisphere). */
export function moonLines(ph: number, r: number, width: number, cls = ''): string {
  const c = cls ? ` class="${cls}"` : '';
  if (ph < 0.03 || ph > 0.97) return `<circle${c} r="${r}" stroke-width="${width}" stroke-dasharray="0.1 ${(width * 3.2).toFixed(1)}" stroke-linecap="round" opacity="0.7"></circle>`;   // new moon
  const wax = ph < 0.5, k = Math.cos(2 * Math.PI * ph);
  // the terminator's half-width; on the thinnest nights the sliver is kept wide enough to read as a crescent
  const rx = (k > 0 ? Math.min(k, 0.8) : Math.abs(k)) * r;
  const outer = wax ? 1 : 0, term = wax ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  const d = `M0,${-r} A${r},${r} 0 0,${outer} 0,${r} A${rx.toFixed(2)},${r} 0 0,${term} 0,${-r} Z`;
  return `<path${c} d="${d}" stroke-width="${width}" stroke-linejoin="round"></path>`;
}
