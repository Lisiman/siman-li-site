// Section 1 · Hero — the living painting.
// The landscape is fixed (SITE.seed). What changes, gently, with New York:
//   sky     sun / moon / moon phase / stars, dark mode after sunset
//   season  leaves, blossoms, falling leaves, snow-bare mountains
//   weather rain / snow / fog / cloud, rain rings and wind waves on the water, ice below freezing
//   wind    trees sway, reeds bend, the boat rocks
//   life    the ferry crosses age / 100 of the river toward the other shore
import { Painting } from './painting';
import type { Cloud, Point, Stroke, WeatherKind } from './painting-types';
import { starPositions } from './stars';
import { moonLines } from './moon';
import { SITE } from '../data/site';
import { TEACHINGS } from '../data/teachings';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
interface Wind { /** sway degrees */ a: number; /** seconds per swing */ d: number; /** boat bob px */ b: number }
/** Open-Meteo `current` block */
interface Current { temperature_2m: number; weather_code: number; wind_speed_10m: number; wind_direction_10m: number }

const SVGNS = 'http://www.w3.org/2000/svg';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${SITE.city.lat}&longitude=${SITE.city.lng}`
  + '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m'
  + `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(SITE.city.tz)}`;
const WIND: readonly Wind[] = [
  { a: 0.5, d: 5.6, b: 0.6 },               // calm   < 6 mph
  { a: 1.4, d: 3.6, b: 1.2 },               // breeze < 15
  { a: 3.2, d: 2.1, b: 2.0 },               // windy  < 28
  { a: 6.5, d: 1.25, b: 3.0 },              // gale
];
const windLevel = (mph: number): number => (mph < 6 ? 0 : mph < 15 ? 1 : mph < 28 ? 2 : 3);

/** getElementById that fails loudly if the markup and the script drift apart */
function $<T extends Element = SVGElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from Hero.astro`);
  return el as unknown as T;
}
const f1 = (n: number): string => n.toFixed(1);
/** fill an optional text slot (e.g. the colophon), skipping it if it isn't on the page */
const setText = (id: string, text: string): void => { const el = document.getElementById(id); if (el) el.textContent = text; };
const root = document.documentElement;
const svg = $<SVGSVGElement>('scene');
// On tall (portrait) screens the sky grows upward so it starts right under the header: the landscape keeps its size
// and stays on the bottom; only the viewBox reaches higher. skyTop = the top of the visible sky in painting units.
// On a portrait screen the whole width would leave the trees and rocks a thin strip at the bottom, so the painting is
// drawn larger there (up to 1.4×) and a little of each side is left out: vx0 / vw = the part of the 1800 units across
// that shows (a little more is kept on the right, where the pagoda stands, than on the left).
let skyTop = 20, vx0 = 0, vw = 1800, treeGrow = 1;   // treeGrow: on a portrait screen the trees grow taller still (up to 1.3×, from their roots)
/** how much the sky's things (sun, moon, clouds) are enlarged on tall screens, where the painting is drawn small */
const skyScale = (): number => Math.min(2.4, Math.max(1, Math.sqrt((720 - skyTop) / 700)));
function fitSky(): boolean {
  const box = svg.parentElement!.getBoundingClientRect();
  if (!box.width || !box.height) return false;
  const zoom = Math.min(1.4, Math.max(1, 1 + (box.height / box.width - 1) * 0.6));   // 1 up to a square, 1.4 on a phone
  let w = Math.round(1800 / zoom), x0 = Math.round((1800 - w) * 0.4);
  // a screen wider than the painting: it still spans the width (the hills reach both edges), and the empty sky at its
  // top is cut instead — up to 95 units (the main peak is at ~138), never into the hills; past that the view widens
  // past the painting's edges, where the river and the hills carry on (the wings, section 1)
  let top = Math.round(720 - w * box.height / box.width);
  if (top > 95) { top = 95; if (zoom === 1) { const ww = Math.round((720 - top) * box.width / box.height); x0 = Math.round((1800 - ww) / 2); w = ww; } }   // wider still: the wings (below) fill the sides
  treeGrow = Math.min(1.3, Math.max(1, 1 + (box.height / box.width - 1) * 0.5));
  if (top === skyTop && w === vw) return false;
  skyTop = top; vw = w; vx0 = x0; svg.setAttribute('viewBox', `${x0} ${top} ${w} ${720 - top}`);
  return true;
}
fitSky();
const svgG = (cls: string): SVGGElement => { const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', cls); return g; };

/** tiny seeded random, so seasonal marks sit in the same places every visit */
const rng = (seed: number): (() => number) => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
/** smooth value noise, a few octaves (the same kind the painting's ridges are made with) */
const fbm = (x: number): number => {
  const hash = (n: number): number => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  const noise = (t: number): number => { const i = Math.floor(t), fr = t - i, u = fr * fr * (3 - 2 * fr); return hash(i) * (1 - u) + hash(i + 1) * u; };
  let v = 0, a = 0.5, fq = 1; for (let o = 0; o < 4; o++) { v += a * noise(x * fq); fq *= 2; a *= 0.5; } return v / 0.9375;
};

// ---------------------------------------------------------------------------
// 1. The fixed painting
// ---------------------------------------------------------------------------
const P = Painting.build(SITE.seed, { W: 1800, H: 720, vertical: false, ink: 'ink', mid: 'mid', light: 'lt' });
const G = P.geo;

// tag strokes so seasons can touch them: 皴 texture strokes, moss dots, water lines
// and so the dotted style can draw outlines solid and interiors dotted (see hero.css)
const tag = (p: Stroke, layer: number): string => {
  if (p.snow) return 'snowcap';            // snow on the rocks, shown in heavy snow (hero.css)
  if (p.t === 1.219) return 'bud-ring';    // the little Buddha's ring breathes, very faintly (hero.css)
  if (p.t === 1.2191) return 'bud-rays';   // his rays, all round him: they flicker (see section 3)
  if (layer === 2) return p.w === 0.6 ? 'water wl' : p.w === 0.7 ? 'horizon' : 'boat';
  if (layer === 3) {
    if (p.w === 1.3) return 'rock'; if (p.w === 0.6) return 'rockin'; if (p.w === 0.7 && p.o === 0.55) return 'axe';
    if (p.w === 1.9) return 'moss'; return 'near';
  }
  if (p.w === 0.55 && p.o === 0.42) return 'cun';
  if (p.w === 1.9) return 'moss';
  if (p.w === 0.8 && p.o === 0.85) return 'tiny';
  if (p.w >= 1.05 && p.o === 1) return 'ridge';
  if (p.w === 0.6) return 'contour';
  return '';
};
const pathStr = (p: Stroke, cls = ''): string => p.bg
  ? `<path class="occ${p.snow ? ' snowcap' : ''}" d="${p.d}" style="fill:var(--bg);stroke:none"></path>`   // hides the lines of the hill behind
  : `<path${cls ? ` class="${cls}"` : ''} d="${p.d}" style="stroke:var(--${p.c})" stroke-width="${p.w}" opacity="${p.o}"></path>`;
$('layers').innerHTML = P.layers.map((L, li) => `<g>${L.paths.map((p) => pathStr(p, tag(p, li))).join('')}</g>`).join('');

// the sun and the moon only ever show above the skyline: trace the top of every hill and rock (their outlines, taken
// point by point) and clip the sun / moon to the sky above it — so nothing of them peeps through a gap between hills
{
  const N = 450, step = 1800 / N, top = new Array<number>(N + 1).fill(720);
  document.querySelectorAll<SVGPathElement>('#layers > g:not(:nth-child(3)) path:is(.occ, .ridge, .contour, .rock, .near)').forEach((path) => {
    const len = path.getTotalLength();
    for (let d = 0; d <= len; d += 3) {
      const pt = path.getPointAtLength(d), i = Math.round(pt.x / step);
      if (i >= 0 && i <= N && pt.y < top[i]) top[i] = pt.y;
    }
  });
  const sky = `M-6000,-4000 L7800,-4000 L7800,${f1(G.w0)} L1800,${f1(G.w0)} L1800,${f1(top[N])} ` + top.map((y, i) => `L${f1(i * step)},${f1(y)}`).reverse().join(' ') + ` L0,${f1(G.w0)} L-6000,${f1(G.w0)} Z`;
  const clip = document.createElementNS(SVGNS, 'clipPath');
  clip.setAttribute('id', 'sky-clip');
  clip.innerHTML = `<path d="${sky}"></path>`;
  svg.prepend(clip);
  $('orb').setAttribute('clip-path', 'url(#sky-clip)');
}

/** where the rocks, carried on past the left edge, come down to the ground: the shore beyond starts there */
let leftShore = 0;
// the wings: on a screen wider than the painting the river and the hills carry on past its edges. Every hill and rock
// outline that meets an edge goes on the way it was heading, over a gentle shoulder, and comes down to the water (a
// rock, to the ground), drawn like the painting: a slightly wavering ridge with moss dots, dotted contours and 皴 strokes
// under it (their look taken from the painting's own). The water line runs on, and the ripples are laid on again, one
// painting's width over. Out of sight on most screens.
{
  const r = rng(SITE.seed + 977);
  const look = (cls: string, fb: string): string => {
    const q = document.querySelector<SVGPathElement>(`#layers path.${cls}`);
    return q ? `class="${cls}" style="${q.getAttribute('style')}" stroke-width="${q.getAttribute('stroke-width')}" opacity="${q.getAttribute('opacity')}"` : fb;
  };
  const LK = { contour: look('contour', 'class="contour" style="stroke:var(--mid)"'), cun: look('cun', 'class="cun" style="stroke:var(--mid)"'), moss: look('moss', 'class="moss" style="stroke:var(--ink)"') };
  const at = (path: SVGPathElement, d: number): DOMPoint => path.getPointAtLength(d);
  const line = (pts: [number, number][]): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)},${f1(y)}`).join(' ');
  let html = '';
  document.querySelectorAll<SVGPathElement>('#layers path.ridge, #layers path.rock, #layers path.horizon').forEach((path) => {
    const len = path.getTotalLength(); if (len < 6) return;
    const isRock = path.classList.contains('rock'), isLine = path.classList.contains('horizon');
    const ground = isRock ? 740 : G.w0;
    [[at(path, 0), at(path, Math.min(10, len))], [at(path, len), at(path, Math.max(0, len - 10))]].forEach(([e, nb]) => {
      const side = e.x <= 4 ? -1 : e.x >= 1796 ? 1 : 0; if (!side) return;
      if ((nb.x - e.x) * side > 0) return;   // only where the line runs out over the edge
      const keep = `class="${path.getAttribute('class')}" style="${path.getAttribute('style')}" stroke-width="${path.getAttribute('stroke-width')}" opacity="${path.getAttribute('opacity')}"`;
      if (isLine) { html += `<path ${keep} d="M${f1(e.x)},${f1(e.y)} H${side > 0 ? 7800 : -6000}"></path>`; return; }
      const h = ground - e.y; if (h < 3) return;
      // the profile: a Hermite curve from the edge (height 1, the slope it had) down to the ground (height 0, flat)
      const L = Math.max(140, Math.min(700, h * 3.6));
      const dx = Math.abs(e.x - nb.x) || 1, slope = (nb.y - e.y) / dx;   // >0: rising outward
      const m = Math.max(-1, Math.min(2.2, slope * L / h));
      const N = Math.max(24, Math.round(L / 6));
      const f = (u: number): number => (1 + 2 * u) * (1 - u) ** 2 + m * u * (1 - u) ** 2;
      // the ridge, made the way the painting makes its own (painting.ts range()): the height wanders slowly (fbm at
      // 0.012 per unit, ±12%) and the line trembles finely on top (fbm at 0.09, ±2.5 units); both fade out at the two
      // ends so it meets the painting's line and the water cleanly
      const off = r() * 200;
      const xAt = (u: number): number => e.x + side * u * L;
      const fade = (u: number): number => Math.min(1, u * 8, (1 - u) * 6);
      const Hof = (u: number): number => h * f(u) * (1 + 0.24 * (fbm(xAt(u) * 0.012 + off) - fbm(e.x * 0.012 + off)) * fade(u));
      const pts: [number, number][] = Array.from({ length: N + 1 }, (_, i) => {
        const u = i / N, H = Hof(u);
        return [xAt(u), ground - H + (H > 2 ? (fbm(xAt(u) * 0.09 + off) - 0.5) * 5 * fade(u) : 0)];
      });
      if (isRock && side < 0) leftShore = Math.min(leftShore, e.x - L);
      html += `<path class="occ" d="${line(pts)} L${f1(e.x)},${f1(ground)} Z" style="fill:var(--bg);stroke:none"></path>`;
      if (!isRock) {
        // the inner lines: the same profile drawn lower each time (as painting.ts does), dotted, trembling a little
        for (let k = 1; k <= 4; k++) {
          const fk = 1 - k / 4.6; let d = '', on = false;
          for (let i = 0; i <= N; i++) {
            const u = i / N, H = Hof(u); if (H < 1.5 + k * 2) { on = false; continue; }
            d += `${on ? ' L' : ' M'}${f1(xAt(u))},${f1(ground - H * fk + k * 1.4 + (fbm(xAt(u) * 0.06 + k * 13) - 0.5) * 4)}`; on = true;
          }
          if (d) html += `<path ${LK.contour} d="${d}"></path>`;
        }
        // 皴: curved strokes hanging from the ridge, sweeping away from the top
        let cun = '';
        for (let i = 0, nC = Math.floor(L / 7); i < nC; i++) {
          const u = r(), H = Hof(u); if (H < 12) continue;
          const x = xAt(u), y = ground - H + 3 + r() * Math.min(30, H * 0.5), len = 10 + r() * Math.min(50, H * 0.7), sg = side * (u > 0.15 ? 1 : -1);
          cun += `M${f1(x)},${f1(y)} q${f1(sg * (2 + r() * 4))},${f1(len * 0.5)} ${f1(sg * (5 + r() * 9))},${f1(len)} `;
        }
        if (cun) html += `<path ${LK.cun} d="${cun}"></path>`;
        // moss dots on the ridge, as the painting puts them
        let moss = '';
        for (let x = 6 + r() * 20; x < L - 6; x += 6 + r() * 18) { const u = x / L, H = Hof(u); if (H < 8) continue; moss += `M${f1(xAt(u))},${f1(ground - H - 1)} l0.6,1.6 `; }
        if (moss) html += `<path ${LK.moss} d="${moss}"></path>`;
      }
      html += `<path ${keep} d="${line(pts)}"></path>`;
    });
  });
  // far off on each side, a row of pale hills (the palest ink of the painting), rising out of the water a little way
  // past the painting's edge: they give the wings the same depth as the middle
  let far = '';
  ([-1, 1] as const).forEach((side) => {
    const edge = side < 0 ? 0 : 1800, start = 60, span = 3200, off = r() * 300;
    const peaks: { c: number; top: number; w: number }[] = [];
    for (let d = start + 120 + r() * 120; d < span; d += 170 + r() * 260) peaks.push({ c: edge + side * d, top: 30 + r() * 70, w: 110 + r() * 170 });
    const shape = (t: number): number => (t >= 1 ? 0 : Math.pow(1 - Math.pow(t, 1.1), 2.2));
    const rise = (d: number): number => { const u = Math.max(0, Math.min(1, (d - start) / 180)); return u * u * (3 - 2 * u); };
    const Hx = (x: number): number => { const d = (x - edge) * side; let hh = 0; peaks.forEach((p) => { hh = Math.max(hh, p.top * shape(Math.abs(x - p.c) / p.w)); }); return hh * rise(d) * (0.86 + 0.24 * fbm(x * 0.012 + off)); };
    const xs: number[] = []; for (let d = start; d <= span; d += 5) xs.push(edge + side * d);
    const ridge: [number, number][] = xs.map((x) => { const hh = Hx(x); return [x, G.w0 - hh + (hh > 2 ? (fbm(x * 0.09 + off) - 0.5) * 3 : 0)]; });
    far += `<path class="occ" d="${line(ridge)} L${f1(xs[xs.length - 1])},${f1(G.w0)} L${f1(xs[0])},${f1(G.w0)} Z" style="fill:var(--bg);stroke:none"></path>`;
    for (let k = 1; k <= 2; k++) {
      const fk = 1 - k / 3.2; let d = '', on = false;
      xs.forEach((x) => { const hh = Hx(x); if (hh < 4 + k * 3) { on = false; return; } d += `${on ? ' L' : ' M'}${f1(x)},${f1(G.w0 - hh * fk + k * 1.4 + (fbm(x * 0.06 + k * 7) - 0.5) * 3)}`; on = true; });
      if (d) far += `<path class="contour" d="${d}" style="stroke:var(--lt)" stroke-width="0.6" opacity="0.6"></path>`;
    }
    far += `<path d="${line(ridge)}" style="stroke:var(--lt)" stroke-width="0.9" opacity="0.9"></path>`;
  });
  // the ripples, laid on again one painting's width to each side
  const ripples = [...document.querySelectorAll<SVGPathElement>('#layers path.water')].map((p) => p.outerHTML).join('');
  const wings = document.createElementNS(SVGNS, 'g');
  wings.innerHTML = `<g transform="translate(-1800,0)">${ripples}</g><g transform="translate(1800,0)">${ripples}</g>` + far + html;
  $('layers').appendChild(wings);
}

// ---------------------------------------------------------------------------
// 2. Season (in New York) — leaves, blossoms, falling leaves, bare winter hills
// ---------------------------------------------------------------------------
function nyParts(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: SITE.city.tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const get = (t: Intl.DateTimeFormatPartTypes): number => Number(parts.find((x) => x.type === t)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}
const seasonOf = (m: number): Season => (m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter');
const isSeason = (s: string | null): s is Season => s === 'spring' || s === 'summer' || s === 'autumn' || s === 'winter';

// preview any season / weather with URL params, e.g. /?season=winter&wx=snow&wind=30&temp=25
const params = new URLSearchParams(location.search);
const seasonParam = params.get('season');
const SEASON: Season = isSeason(seasonParam) ? seasonParam : seasonOf(nyParts().month);
const SEASON_LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
// how full the trees are: spring young and sparse (plus blossoms), summer thick, autumn thinning and pale, winter bare
const LEAF_KEEP: Record<Season, number> = { spring: 0.4, summer: 1, autumn: 0.55, winter: 0.03 };
svg.classList.add(`s-${SEASON}`);

const leafPoints: [number, number, number][] = [];   // canopy positions (x, y, which tree), for blossoms & falling leaves
const treeEls = P.trees.map((t, ti) => {
  const r = rng(SITE.seed + ti * 97);
  const marks = t.l.split(/(?=M)/).filter(Boolean);
  const kept = marks.filter(() => r() < LEAF_KEEP[SEASON]);
  marks.forEach((m) => { const xy = m.match(/^M(-?[\d.]+),(-?[\d.]+)/); if (xy) leafPoints.push([Number(xy[1]), Number(xy[2]), ti]); });
  // summer: a second, offset layer of leaves makes the canopy dense; autumn: about half the leaves turn pale
  const extra = SEASON === 'summer' ? marks.filter(() => r() < 0.6).map((m) => m.replace(/^M(-?[\d.]+),(-?[\d.]+)/, (_, x, y) => `M${f1(+x + 2.4)},${f1(+y - 2)}`)) : [];
  const pale = SEASON === 'autumn' ? kept.filter(() => r() < 0.5) : [];
  const dark = SEASON === 'autumn' ? kept.filter((m) => !pale.includes(m)) : kept;
  const leafW = SEASON === 'spring' ? 0.75 : 0.9, leafC = SEASON === 'spring' ? 'mid' : 'ink';   // spring leaves: fine, light
  const g = svgG('sway');
  g.innerHTML = `<path d="${t.d}" style="stroke:var(--ink)" stroke-width="1"></path>`
    + `<path d="${dark.concat(extra).join('')}" style="stroke:var(--${leafC})" stroke-width="${leafW}" opacity="0.9"></path>`
    + (pale.length ? `<path d="${pale.join('')}" style="stroke:var(--mid)" stroke-width="0.8" opacity="0.7"></path>` : '');
  const grow = svgG('');   // scaled from the root on a portrait screen (growTrees); the sway stays inside it
  grow.appendChild(g); $('trees').appendChild(grow);
  return { g, grow, r: t.r, root: [0, 0] as Point };
});
// each tree's root: the middle of the foot of its trunk
treeEls.forEach((t) => { const b = t.g.getBBox(); t.root = [b.x + b.width / 2, b.y + b.height]; });
/** where a point on a tree is drawn once the tree has grown */
const grown = (x: number, y: number, ti: number): Point => {
  const [rx, ry] = treeEls[ti].root;
  return [rx + (x - rx) * treeGrow, ry + (y - ry) * treeGrow];
};
function growTrees(): void {
  treeEls.forEach(({ grow, root: [rx, ry] }) => {
    if (treeGrow === 1) grow.removeAttribute('transform');
    else grow.setAttribute('transform', `translate(${f1(rx)},${f1(ry)}) scale(${treeGrow.toFixed(3)}) translate(${f1(-rx)},${f1(-ry)})`);
  });
}
growTrees();
const reedEls = P.reeds.map((t) => {
  const g = svgG('bend');
  g.innerHTML = `<path d="${t.d}" style="stroke:var(--ink)" stroke-width="0.7" opacity="0.8"></path>`;
  $('reeds').appendChild(g);
  return { g, r: t.r };
});
// on a screen wider than the painting the reeds carry on to the right, thinning and paling: the last third of the bed
// laid on again past the edge, then once more further out (they sway with the others: see the wind)
{
  const xOf = (d: string): number => Number(d.match(/^M\s*(-?[\d.]+)/)?.[1] ?? 0);
  const tail = P.reeds.filter((t) => xOf(t.d) > 1200);
  // …and on the left as well, past the rocks
  const lx = leftShore - 1800 - 60;   // the left copies start just past where the rocks come down
  [[600, 0.85, 1], [1200, 0.6, 2], [1800, 0.4, 3], [lx, 0.8, 1], [lx - 600, 0.55, 2]].forEach(([dx, o, every]) => {
    const wrap = svgG(''); wrap.setAttribute('transform', `translate(${dx},0)`); wrap.setAttribute('opacity', String(o));
    tail.forEach((t, i) => {
      if (i % every) return;
      const g = svgG('bend');
      g.innerHTML = `<path d="${t.d}" style="stroke:var(--ink)" stroke-width="0.7" opacity="0.8"></path>`;
      wrap.appendChild(g); reedEls.push({ g, r: (t.r + 0.37 * Math.abs(dx) / 600) % 1 });
    });
    $('reeds').appendChild(wrap);
  });
}

function drawSeason(windIdx: number): void {
  const r = rng(SITE.seed + 7);
  const pick = (n: number): Point[] => Array.from({ length: Math.min(n, leafPoints.length) }, () => { const [x, y, ti] = leafPoints[Math.floor(r() * leafPoints.length)]; return grown(x, y, ti); });
  let html = '';
  if (SEASON === 'spring') {                 // a scatter of blossoms in the canopies
    html = pick(80).map(([x, y]) => `<circle cx="${f1(x + (r() - 0.5) * 10)}" cy="${f1(y + (r() - 0.5) * 8)}" r="${f1(1.3 + r() * 1.2)}" style="stroke:var(--mid)" stroke-width="0.8"></circle>`).join('');
  }
  if (SEASON === 'autumn' || (SEASON === 'winter' && windIdx >= 2)) {   // leaves letting go; more of them in wind
    const n = SEASON === 'autumn' ? 8 + windIdx * 6 : 3;
    html = pick(n).map(([x, y]) => {
      const fall = 160 + r() * 200, drift = (windIdx + 1) * (30 + r() * 40) * (r() < 0.8 ? 1 : -1);
      return `<g transform="translate(${f1(x)},${f1(y)})"><path class="leaf" d="M0,0 q2.2,-2.2 4.4,0 q-2.2,2.2 -4.4,0" style="stroke:var(--ink);--fall:${f1(fall)}px;--drift:${f1(drift)}px;--dur:${f1(7 + r() * 6)}s;--dl:${f1(-r() * 12)}s" stroke-width="0.8"></path></g>`;
    }).join('');
  }
  $('season').innerHTML = html;
}

// ---------------------------------------------------------------------------
// 3. The other shore — a small Buddha sitting in the saddle beyond the mountains
// ---------------------------------------------------------------------------
// The little Buddha now sits in the painting itself, beside the pagoda on the far shore (painting.ts).
// His rays (painted all round him, behind the figure — painting.ts) shoot out and draw back one by one, each on its own
// quick rhythm, so the light seems to radiate in every direction; under them a very faint glow (under 10%) breathes.
{
  const rr = rng(SITE.seed + 7);
  document.querySelectorAll<SVGPathElement>('#layers .bud-rays').forEach((ray) => {
    const lo = 0.2 + rr() * 0.25, dur = 4 + rr() * 3.5, dl = -rr() * dur;   // gentle: each ray draws back only a little, slowly
    ray.setAttribute('pathLength', '1');
    ray.style.setProperty('--lo', lo.toFixed(2)); ray.style.setProperty('--d', `${dur.toFixed(2)}s`); ray.style.setProperty('--dl', `${dl.toFixed(2)}s`);
  });
  const [bx, by] = P.geo.bud, r = 0.72 * 0.4 * 0.7 * 0.6 * P.geo.k / 1.1 * 140;
  $('bud-glow').innerHTML = '<defs><radialGradient id="bud-glow-g"><stop offset="0" style="stop-color:var(--ink);stop-opacity:1"></stop>'
    + '<stop offset=".5" style="stop-color:var(--ink);stop-opacity:.35"></stop><stop offset="1" style="stop-color:var(--ink);stop-opacity:0"></stop></radialGradient></defs>'
    + `<circle class="glow" cx="${f1(bx)}" cy="${f1(by)}" r="${f1(r)}" style="fill:url(#bud-glow-g);stroke:none"></circle>`;
}

// ---------------------------------------------------------------------------
// 4. The ferry — age / lifespan of the way across; the ferryman rows
// ---------------------------------------------------------------------------
$('boat').innerHTML =
  '<g id="bob" class="bob"><g id="surge">'
  + '<path class="wake" d="M-44,4 q-9,2 -18,0 M-52,9 q-11,2 -22,0" style="stroke:var(--mid)" stroke-width="0.8"></path>'
  // the hull and the cabin are solid (filled with the paper): the river behind does not show through the boat
  + '<path class="boat-fill" d="M-34,-3 Q0,7 34,-4 L30,-3 L-2,-2.5 V-11 L0,-11 Q-10,-15 -20,-11 L-18,-11 V-2.2 L-30,-2 Z" style="fill:var(--bg);stroke:none"></path>'
  + '<path d="M-34,-3 Q0,7 34,-4 M-30,-2 L30,-3 M-18,-2 v-9 h16 v9 M-20,-11 q10,-4 20,0" style="stroke:var(--ink)" stroke-width="1"></path>'
  // a paper lantern on a bamboo pole at the stern; it swings a little on its hook (hero.css .lantern-swing)
  + '<g class="lantern" aria-hidden="true">'
  + '<path d="M-30,-2 L-32.5,-27 M-32.3,-25 L-41,-26.2 M-32.6,-22 L-36,-25.6" style="stroke:var(--ink)" stroke-width="1"></path>'
  + '<g class="lantern-swing"><path d="M-40.6,-26 v2.4" style="stroke:var(--ink)" stroke-width="0.6"></path>'
  + '<path d="M-42.3,-23.4 h3.4 M-42.3,-16 h3.4" style="stroke:var(--ink)" stroke-width="1.3"></path>'
  // at night the lantern is lit: a soft glow around it and a small flame inside, both flickering (hero.css)
  + '<defs><radialGradient id="lantern-g"><stop offset="0" style="stop-color:var(--ink);stop-opacity:.55"></stop><stop offset=".45" style="stop-color:var(--ink);stop-opacity:.18"></stop><stop offset="1" style="stop-color:var(--ink);stop-opacity:0"></stop></radialGradient></defs>'
  + '<circle class="lantern-glow" cx="-40.6" cy="-19.7" r="13" style="fill:url(#lantern-g);stroke:none"></circle>'
  + '<ellipse cx="-40.6" cy="-19.7" rx="2.5" ry="3.4" style="fill:var(--bg);stroke:var(--ink)" stroke-width="0.85"></ellipse>'
  + '<path class="lantern-flame" d="M-40.6,-22.1 q1.3,1.7 .9,3 q-.3,1 -.9,1 q-.6,0 -.9,-1 q-.4,-1.3 .9,-3 Z" style="fill:var(--ink);stroke:none"></path>'
  + '<path d="M-40.6,-23 v6.6 M-41.9,-22.6 q-.6,2.9 0,5.8 M-39.3,-22.6 q.6,2.9 0,5.8" style="stroke:var(--ink)" stroke-width="0.45" opacity="0.8"></path>'
  + '<path d="M-40.6,-15.6 v2.6" style="stroke:var(--ink)" stroke-width="0.65"></path></g></g>'
  + '<g class="ferryman" id="ferryman" role="button" tabindex="0" aria-label="The ferry — say hello to the ferryman">'
  // the hit area covers the whole boat (hull, cabin, pole, wake), so a click anywhere on it reaches the ferryman
  + '<rect class="hit" x="-62" y="-32" width="106" height="46" style="fill:transparent;stroke:none"></rect>'
  + '<g id="lean">'                                     // the whole figure leans from the feet (18,-3)
  + '<path d="M18,-3 v-10.2 M18,-12 l4,3" style="stroke:var(--ink)" stroke-width="1.05"></path>'
  // the free arm hangs from its shoulder (18,-10), so he can wave
  + '<g transform="translate(18,-10)"><path id="ferry-arm" class="arm" d="M0,0 l-4,5" style="stroke:var(--ink)" stroke-width="1.05"></path></g>'
  // the head sits on its own pivot (the neck), so a click can make it nod or shake
  + '<g transform="translate(18,-13.2)"><g id="ferry-head" class="head"><path d="M0,-4.8 a2.4,2.4 0 1,0 0.1,0" style="stroke:var(--ink)" stroke-width="1.05"></path>'
  // a douli (bamboo hat) in rain and snow: one low arc over the head (hero.css shows it)
  + '<path class="hat" d="M-6.8,-3.2 Q0,-10.6 6.8,-3.2" style="stroke:var(--ink)" stroke-width="1.05"></path></g></g>'
  + '<g id="pole-lift"><g id="oar"><path d="M11,-22 L40,13" style="stroke:var(--ink)" stroke-width="1.05"></path></g></g>'   // the pole turns in the front hand (22,-9)
  + '</g>'
  + '</g></g></g>';

// poling, like a real ferryman (the boat travels to the right):
//   plant  the pole goes in ahead of him, tip forward
//   push   he leans into it; the tip stays on the riverbed, so the pole swings back as the boat glides on
//   lift   he draws the pole up out of the water
//   swing  carries it forward through the air, then plants it again
if (!reduceMotion) {
  const DUR = '4.2s', KT = '0;0.55;0.65;0.9;1';
  const SPL = '.4 0 .6 1;.3 0 .7 1;.45 0 .55 1;.5 0 .5 1';   // push · lift · swing · plant
  const anim = (target: Element, type: 'rotate' | 'translate', values: string): void => {
    const a = document.createElementNS(SVGNS, 'animateTransform');
    a.setAttribute('attributeName', 'transform'); a.setAttribute('type', type);
    a.setAttribute('values', values); a.setAttribute('dur', DUR); a.setAttribute('repeatCount', 'indefinite');
    a.setAttribute('calcMode', 'spline'); a.setAttribute('keyTimes', KT); a.setAttribute('keySplines', SPL);
    target.appendChild(a);
  };
  //                          plant        push end     lifted        swung forward   planted
  anim($('oar'), 'rotate', '-6 22 -9;50 22 -9;50 22 -9;-10 22 -9;-6 22 -9');
  anim($('pole-lift'), 'translate', '0 0;0 0;2 -9;-3 -8;0 0');
  anim($('lean'), 'rotate', '0 18 -3;8 18 -3;3 18 -3;-2 18 -3;0 18 -3');
  anim($('surge'), 'translate', '0 0;3.9 0;3.6 0;1.2 0;0 0');      // a clear glide forward on the push, easing back while the pole swings
  // the hands work the pole: the free hand reaches up and grips it for the push, draws it up hand over hand,
  // lets go as it swings forward, and comes back to it as it's planted
  anim($('ferry-arm'), 'rotate', '-112;-140;-122;-40;-112');
}

// ?age=70 previews the ferry at another age (the /mock page uses it)
const AGE_PARAM = Number(new URLSearchParams(location.search).get('age'));
const ageYears = (): number => (AGE_PARAM > 0 ? AGE_PARAM : (Date.now() - SITE.born) / (365.2425 * 86400000));
function drawFerry(): void {
  const age = ageYears(), t = Math.max(0, Math.min(1, age / SITE.lifespan));
  const [Sx, Sy] = G.S, [Ex, Ey] = G.E, Cx = (Sx + Ex) / 2 + 40, Cy = Sy - 30;
  const bz = (u: number): Point => [(1 - u) ** 2 * Sx + 2 * (1 - u) * u * Cx + u * u * Ex, (1 - u) ** 2 * Sy + 2 * (1 - u) * u * Cy + u * u * Ey];
  const poly = (u0: number, u1: number): string => { let d = ''; for (let i = 0; i <= 24; i++) { const p = bz(u0 + (u1 - u0) * i / 24); d += (i ? ' L' : 'M') + f1(p[0]) + ',' + f1(p[1]); } return d; };
  $('trail-past').setAttribute('d', poly(0, t));
  $('trail-next').setAttribute('d', poly(t, 1));
  // from the landing, a faint path climbs toward the other shore
  $('trail-beyond').setAttribute('d', `M${f1(Ex)},${f1(Ey)} Q${f1((Ex + P.far.x) / 2 + 30)},${f1((Ey + P.far.y) / 2 + 20)} ${f1(P.far.x)},${f1(P.far.y + 8)}`);
  const [bx, by] = bz(t), s = G.k * (1.15 - 0.55 * t);
  $('boat').setAttribute('transform', `translate(${f1(bx)},${f1(by)}) scale(${s.toFixed(3)})`);
  // hover the boat: how far across — age / lifespan (at 100 it reaches the Buddha's shore); it creeps on a little every year
  // at the end of the crossing (age ≥ lifespan) the ferryman has stepped ashore: he stands beside the little Buddha
  // and waves to us; the boat waits, empty, at the landing
  const ashore = age >= SITE.lifespan;
  $('ferryman').style.display = ashore ? 'none' : '';
  $('ashore').innerHTML = ashore ? (() => {
    const k = G.k * 0.68, x = G.bud[0] + 15 * G.k, y = G.budG;
    return `<g transform="translate(${f1(x)},${f1(y)}) scale(${k.toFixed(3)})" style="stroke:var(--ink)" stroke-width="1.05">`
      + '<path d="M-2,0 L0,-6.5 L2,0 M0,-6.5 V-13.5 M0,-11.5 l3.5,4"></path>'          // legs, body, the arm at rest
      + '<path d="M0,-18.3 a2.4,2.4 0 1,0 0.1,0"></path>'                                // head
      + '<g transform="translate(0,-11.5)"><path class="wave-on" d="M0,0 l-4,5"></path></g>'   // the waving arm (pivots at the shoulder)
      + '</g>';
  })() : '';
  if (AGE_PARAM > 0) svg.classList.add('show-age');   // previewing an age: keep the label up
  const lbl = $('boat-age'); lbl.textContent = `${Math.floor(age)}/${SITE.lifespan}`;
  $('boat-age-g').setAttribute('transform', `translate(${f1(bx)},${f1(by + 6 + 8 * s)})`);   // just under the hull, on the water
  setText('c-life', `Crossing · year ${Math.floor(age)} of ${SITE.lifespan}`);
}

// ---------------------------------------------------------------------------
// 5. Sky — sun, moon, stars, automatic dark mode; the sun / moon is a switch
// ---------------------------------------------------------------------------
// a click on the sun/moon overrides the sky for this page view, until the next sunrise or sunset; a reload follows the sky
let override: boolean | null = null, overrideAt: boolean | null = null;
let isDark = false, autoDark = false;
const deg = 180 / Math.PI;
const moonName = (ph: number): string => (ph < 0.03 || ph > 0.97 ? 'New moon' : ph < 0.22 ? 'Waxing crescent' : ph < 0.28 ? 'First quarter' : ph < 0.47 ? 'Waxing gibbous'
  : ph < 0.53 ? 'Full moon' : ph < 0.72 ? 'Waning gibbous' : ph < 0.78 ? 'Last quarter' : 'Waning crescent');
/** the real stars over New York right now, placed like the sun and moon (facing south: east on the left, west on the
 *  right, altitude upward), sized by brightness. The hills hide
 *  whatever is behind them, just as the horizon would. */
function realStars(yTop: number): string {
  const pos = starPositions(Date.now()), pt = new Map<string, Point>();
  const deg = 180 / Math.PI;
  let dots = '';
  pos.forEach((p, name) => {
    if (p.alt <= 0) return;
    const x = 900 + (p.az / (Math.PI / 2)) * 760, y = 330 - (p.alt * deg / 62) * (330 - yTop);
    if (x < -10 || x > 1810 || y < skyTop + 4) return;
    pt.set(name, [x, y]);
    const w = Math.max(2.4, Math.min(6.5, 4.2 - p.mag * 1.1)), o = Math.max(0.55, Math.min(1, 1 - p.mag * 0.12));   // brighter stars are bigger dots
    dots += `<path d="M${f1(x)},${f1(y)}h0.01" stroke-width="${w.toFixed(2)}" opacity="${o.toFixed(2)}"></path>`;
  });
  return dots;   // just the stars, no constellation lines
}

let skyDrawn = false;   // the first paint sets the mode without a fade
/** the sun's halo follows the weather and the heat:
 *  clear — rings of dashes, more, wider and denser the hotter it is (1 ring when cold, 3 in summer heat), turning slowly
 *  cloudy — one faint, sparse ring · snow — a thin pale ring · rain / fog — none (the sun is hidden) */
let sunMood: { kind: WeatherKind; tF: number } | null = null;
function sunHalo(): string {
  const m = sunMood ?? { kind: 'clear' as WeatherKind, tF: 55 };
  if (m.kind === 'rain' || m.kind === 'fog') return '';
  const ring = (r: number, dash: string, o: number, w: number, dur: number, dir: 1 | -1): string =>
    `<circle class="sun-halo" cx="0" cy="0" r="${f1(r)}" style="stroke:var(--ink);--d:${f1(dur)}s;--dl:${f1(-since(dur))}s;--dir:${dir * 360}deg" stroke-width="${w}" stroke-dasharray="${dash}" opacity="${o}"></circle>`;
  if (m.kind === 'snow') return ring(33, '1 7', 0.3, 0.6, 140, 1);
  if (m.kind === 'cloudy') return ring(35, '2 8', 0.45, 0.7, 120, 1);
  const heat = Math.max(0, Math.min(1, (m.tF - 30) / 60));            // 30°F → 0 · 90°F → 1
  const n = 1 + Math.round(heat * 2);
  let html = '';
  for (let i = 0; i < n; i++) {
    const r = 35 + heat * 3 + i * (9 + heat * 3);
    html += ring(r, `${f1(1.6 + heat * 2.4)} ${f1(5.5 - heat * 2)}`, +(0.95 - i * 0.28).toFixed(2), +(0.75 - i * 0.12).toFixed(2), 90 - heat * 45 + i * 20, i % 2 ? -1 : 1);
  }
  return html;
}

function drawSky(): void {
  const A = Painting.astro(Date.now());
  const sunAlt = A.sun.alt * deg, useMoon = sunAlt < 0, body = useMoon ? A.moon : A.sun;
  autoDark = sunAlt < -0.833;   // night = after sunset in New York (upper limb below the horizon, with refraction)
  if (override !== null && overrideAt !== autoDark) {   // the sun has risen or set since: back to the sky
    override = overrideAt = null;
  }
  isDark = override === null ? autoDark : override;
  if (root.classList.contains('dark') !== isDark) {
    // one crossfade for everything (page, text, every line and fill in the painting) — nothing lags behind
    const flip = (): void => { root.classList.toggle('dark', isDark); };
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
    if (vt && skyDrawn && !matchMedia('(prefers-reduced-motion: reduce)').matches) vt.call(document, flip); else flip();
  }
  skyDrawn = true;

  let x = Math.max(vx0 + 90, Math.min(vx0 + vw - 90, vx0 + vw / 2 + (body.az / (Math.PI / 2)) * 760 * vw / 1800));   // across the part that shows
  // highest the sun / moon goes: on wide screens near the top of the sky. The squarer (and taller) the screen, the more
  // sky shows above the hills, so the sun is lifted further into it: its ceiling moves up toward the top, and a given
  // altitude climbs higher (it reaches the ceiling at ~40° instead of 62°), so it never sits low in a big empty sky
  const tall = Math.max(0, Math.min(1, (20 - skyTop) / 700));   // 0 on wide screens … 1 on square / portrait ones
  const sc = skyScale(), yTop = skyTop < 20 ? Math.min(70, skyTop + (0.2 - 0.14 * tall) * (720 - skyTop)) : Math.max(70, skyTop + 40);   // (under the cut on a very wide screen)
  const altMax = 62 - 22 * tall;
  const lift = Math.max(0, Math.min(1, body.alt * deg / altMax)) ** (1 - 0.4 * tall);   // on squarer screens a low sun is lifted most
  let y = Math.max(yTop, Math.min(330, 330 - (body.alt > 0 ? lift : body.alt * deg / altMax) * (330 - yTop)));
  // once it is up (past ~10°) the sun / moon always clears the main mountain, even where the sky is short (wide screens);
  // near the horizon it may still rise and set behind the hills
  if (body.alt > 0) { const u = Math.min(1, body.alt * deg / 10); y = Math.min(y, 330 + (G.peakY - 40 - 330) * u); }
  y = Math.max(y, skyTop + 40 * sc);   // never cut by the top of the painting (a very wide screen cuts its sky)
  // the sun and the moon simply set behind the hills, where they really are in the New York sky
  // a new moon (a dotted ring: the moon you cannot see) is shown on such a night even though it is below the horizon —
  // it always is at night — high on the right, where the sky is open
  const newMoon = useMoon && (A.phase < 0.03 || A.phase > 0.97);
  if (newMoon && body.alt < 0) { x = vx0 + vw * 0.83; y = Math.max(yTop, Math.min(120, yTop + 0.25 * (330 - yTop))); }
  let inner: string;
  if (!useMoon) {
    inner = '<circle cx="0" cy="0" r="46" style="fill:transparent"></circle><circle class="orb-ring" cx="0" cy="0" r="24" style="stroke:var(--ink)" stroke-width="1.4"></circle>' + sunHalo();
  } else {
    // the moon in line only, its shape the phase (moon.ts, shared with the sky of home at the bottom)
    inner = `<circle cx="0" cy="0" r="46" style="fill:transparent"></circle><g style="stroke:var(--ink);fill:none">${moonLines(A.phase, 22, 1.3, 'orb-ring')}</g>`
      + `<text class="orb-label" x="0" y="48">${moonName(A.phase)}</text>`;   // hover the moon: tonight's phase, by name
  }
  const orb = $('orb');
  // no moon in the sky (it has not risen yet, or has set): none in the painting either — except the new moon's ring
  const none = useMoon && body.alt < 0 && !newMoon;
  orb.innerHTML = none ? '' : `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${sc.toFixed(3)})">${inner}</g>`;
  orb.toggleAttribute('hidden', none);
  if (none) orb.setAttribute('tabindex', '-1'); else orb.removeAttribute('tabindex');
  orb.setAttribute('aria-label', `${useMoon ? 'The moon' : 'The sun'} — switch to ${isDark ? 'light' : 'dark'} mode`);
  orb.setAttribute('aria-pressed', String(isDark));
  $('stars').innerHTML = autoDark ? `<g style="stroke:var(--ink)" opacity="${isDark ? 1 : 0.6}">${realStars(yTop)}</g>` : '';
  setText('moon-name', moonName(A.phase));

  // day count = painting number. Day 0 is 25 Dec 1993, counted on the New York calendar.
  const p = nyParts();
  const days = Math.round((Date.UTC(p.year, p.month - 1, p.day) - SITE.born) / 86400000).toLocaleString('en-US');
  $<HTMLElement>('days').textContent = days;
  document.querySelectorAll('[data-days]').forEach((el) => { el.textContent = days; });   // the same count in the About text
  setText('date', new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE.city.tz }));
}
$('orb').addEventListener('click', (e) => {
  e.preventDefault(); e.stopPropagation();
  override = !isDark; overrideAt = autoDark;
  if (override === autoDark) override = overrideAt = null;   // flipped back to what the sky says: no override
  drawSky();
});

// ---------------------------------------------------------------------------
// 6. Weather & wind (Open-Meteo, free, no key)
// ---------------------------------------------------------------------------
const codeToKind = (c: number): WeatherKind => (c <= 1 ? 'clear' : c <= 3 ? 'cloudy' : c === 45 || c === 48 ? 'fog' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'snow' : 'rain');
const KIND_LABEL: Record<WeatherKind, string> = { clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow', fog: 'Fog' };
const compass = (d: number): string => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((d % 360) + 360) % 360) / 45) % 8];

function applyWind(mph: number, dirDeg: number): number {
  const lvl = windLevel(mph), w = WIND[lvl];
  const bias = (Math.sin(dirDeg * Math.PI / 180) >= 0 ? -1 : 1) * w.a * 0.55;   // lean away from where it blows
  treeEls.forEach(({ g, r }) => {
    const amp = w.a * (0.7 + r * 0.6);
    g.style.cssText = `--a0:${(bias - amp).toFixed(2)}deg;--a1:${(bias + amp).toFixed(2)}deg;--d:${(w.d * (0.85 + r * 0.35)).toFixed(2)}s;--dl:${(-r * 3).toFixed(2)}s`;
  });
  reedEls.forEach(({ g, r }) => {
    g.style.cssText = `--a0:${(bias * 2.2 - w.a * 2.4).toFixed(2)}deg;--a1:${(bias * 2.2 + w.a * 2.4).toFixed(2)}deg;--d:${(w.d * (0.6 + r * 0.3)).toFixed(2)}s;--dl:${(-r * 2).toFixed(2)}s`;
  });
  $<SVGGElement>('bob').style.cssText = `--d:${(w.d * 1.4).toFixed(2)}s;--b:${w.b}px`;
  drawSeason(lvl);
  return lvl;
}

/** the water answers the weather: wind ruffles it, rain dots it with rings, frost stills it */
function drawWater({ lvl, rain, frozen }: { lvl: number; rain: boolean; frozen: boolean }): void {
  svg.classList.toggle('ice', frozen);
  const r = rng(SITE.seed + 31), y0 = G.w0 + 14, y1 = G.w0 + 0.3 * 720;
  const inWater = (): Point => { for (let k = 0; k < 20; k++) { const x = 40 + r() * 1720, y = y0 + r() * (y1 - y0); if (!(x < G.rkx + 20 && y > G.rky - 40)) return [x, y]; } return [1200, y0 + 20]; };
  let html = '';
  if (!frozen) {
    const waves = [2, 6, 14, 24][lvl];
    for (let i = 0; i < waves; i++) { const [x, y] = inWater(), s = 0.7 + r() * 0.8; html += `<path class="wave" d="M${f1(x)},${f1(y)} q${f1(4 * s)},${f1(-2 * s)} ${f1(8 * s)},0 q${f1(4 * s)},${f1(2 * s)} ${f1(8 * s)},0" style="stroke:var(--mid);--dl:${f1(-r() * 4)}s" stroke-width="0.7"></path>`; }
  }
  if (rain && !frozen) {
    for (let i = 0; i < 16; i++) { const [x, y] = inWater(); html += `<g transform="translate(${f1(x)},${f1(y)})"><ellipse class="drop" rx="14" ry="2.2" style="stroke:var(--mid);--dl:${f1(-r() * 2.4)}s" stroke-width="0.7"></ellipse></g>`; }
  }
  swapIn('water-live', html, true);
}

// every looping weather animation takes its phase from one page clock, so a redraw (new weather, resize)
// picks up exactly where the old one was instead of jumping back to the start
const T0 = performance.now();
const since = (dur: number): number => ((performance.now() - T0) / 1000) % dur;

// clouds drift with the wind: speed from mph, always left to right.
// Each cloud loops from just off one edge to just off the other, starting where it was painted.
function drawClouds(clouds: Cloud[], mph: number, _dir: number): string {
  const toward = 1;   // always drift left → right, whatever the wind direction
  const speed = Math.max(1.2, mph * 0.7);                        // user units per second: 8 mph ≈ 5.6 → ~5 min across
  return clouds.map((c) => {
    const a = -c.x1 - 20, b = 1820 - c.x0, span = b - a, dur = span / (speed * c.k);
    const [from, to] = toward > 0 ? [a, b] : [b, a];
    const delay = -(dur * Math.abs(0 - from) / span + since(dur));
    return `<g class="drift" style="--from:${f1(from)}px;--to:${f1(to)}px;--d:${f1(dur)}s;--dl:${f1(delay)}s">`
      + `<path d="${c.d}" style="fill:var(--bg);stroke:var(--ink)" stroke-width="1" stroke-opacity="0.45" fill-opacity="0.7"></path></g>`;
  }).join('');
}

/** rain and snow fall for ever: the marks split into three depths, each tile (700 tall) slides down one tile and
 *  repeats, so the pattern never ends. Rain streaks fall along their slant; snow drifts with the wind and sways. */
function fall(wx: Stroke[], kind: WeatherKind, mph: number): string {
  if (!wx.length || (kind !== 'rain' && kind !== 'snow')) return '';
  const rain = kind === 'rain', p = wx[0], segs = p.d.split(/(?=M)/).filter((x) => x.trim());
  const units: string[] = [];   // one mark each: a streak, a dot, or a 4-stroke star
  for (let i = 0; i < segs.length; i++) units.push(!rain && segs[i].includes('h6') ? segs.slice(i, (i += 3) + 1).join('') : segs[i]);
  const sl = -(4 + mph * 0.45);
  const dx = rain ? sl * 700 / 16 : -(20 + mph * 8);   // horizontal travel per tile
  // tiles sit on a lattice that one loop step (dx, 700) maps onto itself, so the restart is invisible.
  // Row j is shifted j·dx sideways; copies every 1820 across cover the width while it drifts.
  const offs: Point[] = [];
  for (let j = 0; 20 + j * 700 > skyTop - 700; j--) for (let m = -2; m <= 2; m++) {
    const ox = j * dx + m * 1820; if (ox + 1820 + Math.min(0, dx) > 0 && ox + Math.max(0, dx) < 1800) offs.push([ox, j * 700]);
  }
  const r = rng(SITE.seed + 11);
  return [0, 1, 2].map((k) => {
    const rr = 3.4 - k * 0.7;   // snow: each dot becomes a hollow ring, smaller further away
    const ring = (u: string): string => {   // every flake, dot or star, becomes the same hollow ring: line only, no fill
      const m = /^M([-\d.]+),([-\d.]+) (l0\.1,0|h6)/.exec(u); if (!m) return u; const x = +m[1] + (m[3] === 'h6' ? 3 : 0), y = +m[2];
      return `M${f1(x - rr)},${f1(y)} a${rr},${rr} 0 1,0 ${f1(2 * rr)},0 a${rr},${rr} 0 1,0 ${f1(-2 * rr)},0 `; };
    const d = units.filter((_, i) => i % 3 === k).map((u) => (rain ? u : ring(u))).join('');
    const dur = rain ? [0.85, 1.1, 1.4][k] : [14, 19, 26][k];
    const tile = offs.map(([x, y]) => `<path transform="translate(${f1(x)},${y})" d="${d}"></path>`).join('');
    const sd = 3 + k * 1.3, sway = rain ? '' : ` class="snow-sway" style="--sw:${f1(4 + k * 3)}px;--d:${f1(sd)}s;--dl:${f1(-(r() * 4 + since(sd * 2)))}s"`;
    return `<g class="fall" style="--dx:${f1(dx)}px;--d:${dur}s;--dl:${(-(r() * dur + since(dur))).toFixed(2)}s;stroke:var(--${p.c})" stroke-width="${rain ? f1(p.w) : '0.9'}" fill="none" opacity="${f1(p.o * [1, 0.8, 0.6][k])}"><g${sway}>${tile}</g></g>`;
  }).join('');
}

/** swap a layer's content: the new fades in while the old fades out, so nothing pops (no fade if only the size changed) */
function swapIn(id: string, html: string, fade: boolean): void {
  const host = $(id);
  if (!fade) { host.innerHTML = `<g>${html}</g>`; return; }
  const old = [...host.children] as SVGElement[];
  old.forEach((el) => { el.classList.add('wx-out'); setTimeout(() => el.remove(), 2600); });
  host.insertAdjacentHTML('beforeend', `<g class="wx-in">${html}</g>`);
}

let lastCur: Current | null = null, lastSig = '', lastLook = '', lastWind = '';
function applyWeather(cur: Current | null): void {
  if (!cur) {                                              // no data: the plain painting in a light breeze
    if (lastSig === 'none') return;
    lastSig = 'none'; lastLook = 'none'; lastWind = 'none';
    const lvl = applyWind(8, 315);
    drawWater({ lvl, rain: false, frozen: false });
    svg.classList.remove('heavy-snow', 'wet');
    swapIn('wx', '', true); swapIn('fog', '', true); $('layers').removeAttribute('opacity');
    $<HTMLElement>('wx-line').textContent = SEASON_LABEL[SEASON];
    setText('c-wx', SEASON_LABEL[SEASON]);
    setText('c-wind', '—');
    return;
  }
  const kind = codeToKind(cur.weather_code), mph = cur.wind_speed_10m, dir = cur.wind_direction_10m, tF = cur.temperature_2m;
  const W = Painting.weather(kind, SITE.seed, mph);
  lastCur = cur;
  const frozen = tF <= 32 && kind !== 'rain', lvlNow = windLevel(mph);
  const mood = { kind, tF: Math.round(tF / 5) * 5 };   // the sun's halo (redrawn only when it would look different)
  if (!sunMood || sunMood.kind !== mood.kind || sunMood.tF !== mood.tF) { sunMood = mood; drawSky(); }
  const heavy = kind === 'snow' && [75, 86].includes(cur.weather_code);   // heavy snow: it settles on the rocks
  svg.classList.toggle('heavy-snow', heavy);
  svg.classList.toggle('wet', kind === 'rain' || kind === 'snow');      // the ferryman puts on his hat
  const look = `${cur.weather_code}|${kind}|${Math.round(mph)}|${lvlNow}|${frozen}`, sig = `${look}|${skyTop}|${vw}`;
  if (sig !== lastSig) {   // only redraw when something you can see changes; a new look cross-fades, a resize just redraws
    const fade = look !== lastLook; lastSig = sig; lastLook = look;
  const up = fall(W.wx, kind, mph);   // rain / snow, falling over the whole sky
  const sc = skyScale();   // the cloud band (y ≈ 85–185) starts 15% down the scene, enlarged on tall screens
  swapIn('wx', `<g transform="translate(${f1(vx0 + vw / 2)},${f1(skyTop + 0.15 * (720 - skyTop))}) scale(${sc.toFixed(3)}) translate(-900,-85)">${drawClouds(W.clouds, mph, dir)}</g>` + up, fade);
  swapIn('fog', W.fog.map((fg, i) => `<g class="mist" style="--d:${9 + i * 3}s;--dl:${-i * 4}s"><rect x="-20" y="${fg.y}" width="1840" height="${fg.h}" style="fill:var(--bg)" opacity="${fg.o}"></rect></g>`).join(''), fade);   // fog banks breathe
  $('layers').setAttribute('opacity', String(W.dim));
  // trees, reeds and the water only change with the wind *level* (or its side) and rain / ice, so their sway never restarts for a 1 mph change
  const windSig = `${lvlNow}|${Math.sin(dir * Math.PI / 180) >= 0}|${kind === 'rain'}|${frozen}`;
  if (windSig !== lastWind) { lastWind = windSig; const lvl = applyWind(mph, dir); drawWater({ lvl, rain: kind === 'rain', frozen }); }
  }
  const temp = `${Math.round(tF)}°F / ${Math.round((tF - 32) * 5 / 9)}°C`, wind = `${Math.round(mph)} mph ${compass(dir)}`;
  // 55°F / 13°C · 8 mph NW · Cloudy (calm, < 1 mph: no wind). On a phone the °C and the wind are left out (hero.css), so
  // the bar under the painting keeps to two lines: New York · 7:38 PM · 55°F · Cloudy
  $<HTMLElement>('wx-line').innerHTML = `${Math.round(tF)}°F<span class="wx-more"> / ${Math.round((tF - 32) * 5 / 9)}°C</span>`
    + (Math.round(mph) >= 1 ? `<span class="wx-more"> · ${wind}</span>` : '') + ` · ${KIND_LABEL[kind]}`;
  setText('c-wx', `${SEASON_LABEL[SEASON]} · ${temp} · ${KIND_LABEL[kind]}`);
  setText('c-wind', `Wind ${wind}`);
}

const PREVIEW_CODE: Record<WeatherKind, number> = { clear: 0, cloudy: 3, rain: 61, snow: 73, fog: 45 };
const isKind = (s: string | null): s is WeatherKind => s !== null && s in PREVIEW_CODE;

async function pullWeather(): Promise<void> {
  if (params.has('wx') || params.has('wind') || params.has('temp')) {
    const wx = params.get('wx');
    applyWeather({ weather_code: wx === 'snow' && params.has('heavy') ? 75 : isKind(wx) ? PREVIEW_CODE[wx] : 0, wind_speed_10m: Number(params.get('wind') ?? 8), wind_direction_10m: 300, temperature_2m: Number(params.get('temp') ?? 55) });
    return;
  }
  try {
    const r = await fetch(WEATHER_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { current?: Current };
    applyWeather(j.current ?? null);
  } catch {
    applyWeather(null);
  }
}

// ---------------------------------------------------------------------------
// 7. Touch the painting — ripples on water, birds from the sky, the ferryman nods or shakes his head
// ---------------------------------------------------------------------------
function toSvg(e: MouseEvent): DOMPoint {
  const m = svg.getScreenCTM();
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(m ? m.inverse() : undefined);
}
// on a small screen the whole painting is drawn small (1800 units across a phone's width), and a flock or a ripple
// drawn in its units would shrink with it to a few pixels: draw them at least as big on screen as on a laptop
const touchScale = (): number => Math.max(1, 0.8 / (svg.getScreenCTM()?.a || 0.8));
function ripple(x: number, y: number): void {
  const g = svgG('');
  g.setAttribute('transform', `translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${touchScale().toFixed(2)})`);
  g.innerHTML = ([[80, 9, 0.9], [56, 6.5, 0.8], [32, 4, 0.7]] as const).map(([rx, ry, w]) => `<ellipse class="ripple" rx="${rx}" ry="${ry}" style="stroke:var(--ink)" stroke-width="${w}"></ellipse>`).join('');
  $('fx').appendChild(g); setTimeout(() => g.remove(), 3400);
}
// a few birds always on the move: each crosses the sky right to left, slowly, rising and dipping, wings beating,
// then comes round again after a pause. No bird ever hangs still in the sky.
{
  const r = rng(SITE.seed + 211), n = 3;
  let html = '';
  for (let i = 0; i < n; i++) {
    const y = 70 + r() * 110, dur = 55 + r() * 40, s = 0.8 + r() * 0.5, flap = 0.5 + r() * 0.3;
    html += `<g class="cross" style="--d:${f1(dur)}s;--dl:${f1(-r() * dur)}s;--bob:${f1(6 + r() * 10)}px"><g transform="translate(0,${f1(y)}) scale(${s.toFixed(2)})">`
      + `<path class="flap" d="M-6,0 q3,-3 6,0 q3,-3 6,0" style="stroke:var(--ink);animation-duration:${flap.toFixed(2)}s" stroke-width="0.9" opacity="0.75"></path></g></g>`;
  }
  $('birds').innerHTML = html;
}

// wild geese: every flock flies from right to left, climbing toward the upper left. 1–7 birds a click.
function flock(x: number, y: number): void {
  const n = 1 + Math.floor(Math.random() * 7);
  const g = svgG('');
  // drawn at one unit to a screen pixel, whatever the painting's size: the same size as the geese in About (Ferry.astro)
  const px = 1 / (svg.getScreenCTM()?.a || 1);
  g.setAttribute('transform', `translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${px.toFixed(3)})`);
  let birds = '';
  for (let i = 0; i < n; i++) {
    // a loose V with the leader in front (to the left); the others trail behind it to the right, above and below
    const k = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
    const bx = k * 16 + (Math.random() - 0.5) * 6, by = side * k * 9 + (Math.random() - 0.5) * 5;
    birds += `<g transform="translate(${bx.toFixed(0)},${by.toFixed(0)}) scale(${(0.8 + Math.random() * 0.5).toFixed(2)})"><path class="flap" d="M-7,0 q3.5,-4.2 7,0 q3.5,-4.2 7,0" style="stroke:var(--ink);animation-delay:${(-Math.random() * 0.4).toFixed(2)}s" stroke-width="1.1"></path></g>`;
  }
  g.innerHTML = `<g class="fly-l">${birds}</g>`;
  $('fx').appendChild(g); setTimeout(() => g.remove(), 7400);
}
svg.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.closest('#orb, #ferryman')) return;
  const p = toSvg(e);
  // on the rocks (anywhere under their skyline): no rings on stone
  const near = G.rocks.reduce((b, q) => (Math.abs(q[0] - p.x) < Math.abs(b[0] - p.x) ? q : b), G.rocks[0] ?? [-999, 9999]);
  // …or on one of the little rocks out in the river (between its top outline and its waterline)
  const onIslet = G.islets.some(({ top, by }) => {
    for (let i = 1; i < top.length; i++) {
      const [x0, y0] = top[i - 1], [x1, y1] = top[i];
      if ((p.x - x0) * (p.x - x1) <= 0 && x0 !== x1) { const ty = y0 + (y1 - y0) * (p.x - x0) / (x1 - x0); if (p.y > ty - 4 && p.y < by + 4) return true; }
    }
    return false;
  });
  const onRock = (Math.abs(near[0] - p.x) <= 6 && p.y > near[1] - 4) || onIslet;
  if (p.y > G.w0 - 4 && !onRock) ripple(p.x, p.y);
  else if (p.y < G.w0 - 40) flock(p.x, p.y);
});
const ferryman = $<SVGGElement>('ferryman');
const head = $<SVGGElement>('ferry-head');
const arm = $<SVGPathElement>('ferry-arm');
let nods = 0;   // nod, shake, nod, … and now and then he waves back instead
const replay = (el: SVGGraphicsElement, cls: string, all: string[]): void => { el.classList.remove(...all); void el.getBBox(); el.classList.add(cls); };
const jump = (e: Event): void => {
  e.stopPropagation();
  if (nods > 0 && Math.random() < 0.35) { replay(arm, 'hello', ['hello']); return; }
  replay(head, nods++ % 2 ? 'shake' : 'nod', ['nod', 'shake']);
};
ferryman.addEventListener('click', jump);
ferryman.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(e); } });

// ---------------------------------------------------------------------------
// 7b. The title types itself: a Creative Technologist → Design Engineer → Professor at NYU → New Media Artist
// ---------------------------------------------------------------------------
{
  const ROLES = ['Creative Technologist', 'Design Engineer', 'Professor at NYU', 'New Media Artist'];
  const HOLD = 4200, TYPE = 95, ERASE = 45, GAP = 450;   // ms: unhurried
  const el = $<HTMLElement>('role');
  const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
  // the lines under the title stay put while the roles change. Where the roles would take different numbers of lines
  // (at some widths Creative Technologist needs three, Professor at NYU two), each role breaks before its last word —
  // a Professor at / NYU, a Creative / Technologist — so every one takes the same lines and none leaves a gap; the title
  // also keeps the height of its tallest role, in case one still differs
  let split = false;
  const shown = (r: string): string => (split ? r.replace(/ (\S+)$/, '\n$1') : r);
  el.style.whiteSpace = 'pre-line';
  const h1 = el.closest<HTMLElement>('h1');
  if (h1) {
    const reserve = (): void => {
      const now = (el.textContent ?? '').replace('\n', ' '); h1.style.minHeight = '';
      const tall = (): number[] => ROLES.map((r) => { el.textContent = shown(r); return Math.round(h1.getBoundingClientRect().height); });
      split = false; const plain = tall();
      split = Math.max(...plain) !== Math.min(...plain);
      const hs = split ? tall() : plain;
      el.textContent = ROLES.includes(now) ? shown(now) : now; h1.style.minHeight = `${Math.max(...hs)}px`;
    };
    let w = 0;
    new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (nw !== w) { w = nw; reserve(); } }).observe(h1.parentElement!);
    document.fonts?.ready.then(reserve);
  }
  const loop = async (): Promise<void> => {
    for (let i = 1; ; i = (i + 1) % ROLES.length) {
      await wait(HOLD);
      if (reduceMotion) { el.textContent = shown(ROLES[i]); continue; }   // no typing, just the next word
      for (let n = el.textContent!.length; n >= 0; n--) { el.textContent = el.textContent!.slice(0, n); await wait(ERASE); }
      await wait(GAP);
      for (let n = 1; n <= ROLES[i].length; n++) { el.textContent = shown(ROLES[i]).slice(0, n); await wait(TYPE); }
    }
  };
  void loop();
}

// ---------------------------------------------------------------------------
// 7b. Rest on the little Buddha by the pagoda (or touch him): he offers a teaching, one of sixty-six, at random (never the same twice in a
// row). It unrolls just above him on a little handscroll, like the work previews, and rolls up again when the mouse moves away (or after a while, or a touch elsewhere, or Esc).
{
  const heroEl = svg.closest<HTMLElement>('.hero');
  const [bx, by] = G.bud, gy = G.budG, rr = Math.max(26, (gy - by) * 1.4);   // generous, so the little figure is easy to touch
  const hit = document.createElementNS(SVGNS, 'circle');
  hit.setAttribute('id', 'buddha'); hit.setAttribute('class', 'buddha-hit');
  hit.setAttribute('cx', f1(bx)); hit.setAttribute('cy', f1((by + gy) / 2 - rr * 0.15)); hit.setAttribute('r', f1(rr));
  hit.setAttribute('style', 'fill:transparent;stroke:none');
  hit.setAttribute('role', 'button'); hit.setAttribute('tabindex', '0'); hit.setAttribute('aria-label', 'The Buddha — receive a teaching');
  $('fx').before(hit);
  const card = document.createElement('div');
  card.className = 'teaching'; card.setAttribute('role', 'status'); card.setAttribute('aria-live', 'polite');
  heroEl?.appendChild(card);
  let last = -1, timer = 0, dwell = 0;
  const hide = (): void => { card.classList.remove('is-on'); clearTimeout(timer); };
  const teach = (): void => {
    if (!heroEl) return;
    let i = Math.floor(Math.random() * TEACHINGS.length);
    if (i === last) i = (i + 1 + Math.floor(Math.random() * (TEACHINGS.length - 1))) % TEACHINGS.length;
    last = i;
    const t = TEACHINGS[i], esc = (x: string): string => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    // a little handscroll, like the work previews: it unrolls from the middle (works.css .rod)
    // just the words: no source under them, so it reads as a quiet thought rather than scripture (the sources stay in teachings.ts)
    card.innerHTML = `<div class="teaching-in"><p class="teaching-en">${esc(t.en)}</p></div><i class="rod rod-l"></i><i class="rod rod-r"></i>`;   // English only for now (the Chinese, t.zh, is in teachings.ts)
    // just above him, centred on him, kept inside the painting
    card.style.transition = 'none'; card.classList.remove('is-on'); card.style.left = '0px'; card.style.top = '0px';   // start rolled up
    const h = heroEl.getBoundingClientRect(), b = hit.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
    const pad = 16, left = Math.max(pad, Math.min(h.width - cw - pad, b.left + b.width / 2 - h.left - cw / 2));
    const top = Math.max(pad, b.top - h.top - ch - 10);
    card.style.left = `${left.toFixed(0)}px`; card.style.top = `${top.toFixed(0)}px`;
    void card.offsetWidth; card.style.transition = ''; void card.offsetWidth; card.classList.add('is-on');
    clearTimeout(timer); timer = window.setTimeout(hide, 16000);
  };
  hit.addEventListener('click', (e) => { e.stopPropagation(); clearTimeout(dwell); teach(); });
  // the mouse moving away from him (and from the scroll) rolls it up again
  let away = 0;
  // no click needed with a mouse: rest on him for 0.6 s and the scroll unrolls (a tap or Enter still works)
  const leave = (e: PointerEvent): void => { if (e.pointerType === 'mouse') { clearTimeout(dwell); clearTimeout(away); away = window.setTimeout(hide, 300); } };
  const stay = (): void => clearTimeout(away);
  hit.addEventListener('pointerenter', (e) => {
    stay();
    if (e.pointerType === 'mouse' && !card.classList.contains('is-on')) { clearTimeout(dwell); dwell = window.setTimeout(teach, 600); }
  });
  hit.addEventListener('pointerleave', leave); card.addEventListener('pointerleave', leave); card.addEventListener('pointerenter', stay);
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); teach(); } });
  document.addEventListener('click', (e) => { if (!(e.target as Element).closest('.teaching')) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}

// 7c. In-page links (Web, Art, About, the logo) glide instead of jumping
// ---------------------------------------------------------------------------
{
  const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);   // ease-in-out cubic
  let raf = 0;
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.id === 'orb') return;                       // the sun / moon is a switch, not a link
    const id = a.getAttribute('href')!.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    const y0 = scrollY, y1 = target && id !== 'top' ? target.getBoundingClientRect().top + scrollY : 0;
    history.pushState(null, '', `#${id}`);
    if (reduceMotion) { scrollTo(0, y1); return; }
    const dur = Math.min(1400, Math.max(700, Math.abs(y1 - y0) * 0.45)), t0 = performance.now();
    cancelAnimationFrame(raf);
    const step = (now: number): void => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, y0 + (y1 - y0) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
  // a wheel or touch takes over from a glide in progress
  addEventListener('wheel', () => cancelAnimationFrame(raf), { passive: true });
  addEventListener('touchstart', () => cancelAnimationFrame(raf), { passive: true });
}

// ---------------------------------------------------------------------------
// 8. Logo — SIMAN LI scatters into particles and gathers as 李思曼
// ---------------------------------------------------------------------------
interface Dots { en: Point[]; zh: Point[]; sc: Point[] }
type Lang = 'en' | 'zh';

const logo = document.querySelector<HTMLAnchorElement>('.logo');
if (logo) {
  const dots = logo.querySelector<SVGSVGElement>('.logo-dots');
  const dotPath = dots?.querySelector<SVGPathElement>('path');
  const zhEl = logo.querySelector<HTMLElement>('.logo-zh');
  let prep: Promise<Dots | null> | null = null;
  let raf = 0;
  let ms: { from: Lang; to: Lang; p: number } = { from: 'en', to: 'en', p: 1 };

  const prepLogo = (): Promise<Dots | null> => {
    if (prep) return prep;
    const EN = 'SIMAN LI', ZH = '李思曼', fs = 18, fEn = `${fs}px "Cutive Mono", monospace`;
    const load = document.fonts?.load ? Promise.all([document.fonts.load(fEn, EN), document.fonts.load(`500 ${fs}px "Noto Serif SC"`, ZH)]).catch(() => undefined) : Promise.resolve();
    prep = load.then(() => {
      const S = 3, PADX = 50, PADY = 34, cv = document.createElement('canvas');
      const cx = cv.getContext('2d', { willReadFrequently: true });
      if (!cx || !dots || !zhEl) return null;
      const spacing = (ls: string): void => { if ('letterSpacing' in cx) (cx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = ls; };
      cx.font = fEn; spacing('0.72px');
      const wEn = cx.measureText(EN).width + 7 * 0.72;
      cx.font = `500 ${fs}px "Noto Serif SC", serif`;
      // 李思曼: about as tall as the capitals of SIMAN LI (70% of its size), and spread to the same width with gaps between
      // the characters, so the two names occupy the same space
      const zhSize = Math.round(fs * 0.7 * 10) / 10;
      cx.font = `500 ${zhSize}px "Noto Serif SC", serif`; spacing('0px');
      const zhGap = Math.max(0, (wEn - cx.measureText(ZH).width) / (ZH.length - 1));
      const zhDy = (fs - zhSize) / 2;   // the smaller characters sit centred on the line of the capitals
      const W = Math.ceil(wEn) + PADX * 2, H = 90; cv.width = W * S; cv.height = H * S;
      const sample = (font: string, text: string, ls: string, dy = 0): Point[] => {
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.setTransform(S, 0, 0, S, 0, 0);
        cx.fillStyle = '#000'; cx.font = font; spacing(ls); cx.textBaseline = 'top'; cx.fillText(text, PADX, PADY + dy);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data, out: Point[] = [];
        for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) if (d[(y * cv.width + x) * 4 + 3] > 120) out.push([x / S, y / S]);
        return out;
      };
      const shuffle = <T>(a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      let en = sample(fEn, EN, '0.72px'), zh = sample(`500 ${zhSize}px "Noto Serif SC", serif`, ZH, `${zhGap.toFixed(2)}px`, zhDy);
      const N = Math.min(300, Math.max(en.length, zh.length));   // sparse enough that the dots never read heavier than the letters
      const fit = (a: Point[]): Point[] => { let b = shuffle(a.slice()); if (!b.length) b = [[PADX, PADY]]; return Array.from({ length: N }, (_, i) => b[i % b.length]); };
      en = fit(en); zh = fit(zh);
      const sc = en.map((p, i): Point => { const mx = (p[0] + zh[i][0]) / 2, my = (p[1] + zh[i][1]) / 2, an = Math.random() * Math.PI * 2, r = 14 + Math.random() * 34; return [mx + Math.cos(an) * r, my + Math.sin(an) * r * 0.7]; });
      dots.setAttribute('viewBox', `0 0 ${W} ${H}`); dots.setAttribute('width', String(W)); zhEl.style.fontSize = `${zhSize}px`; zhEl.style.top = `${(PADY - 24 + zhDy).toFixed(2)}px`; zhEl.style.letterSpacing = `${zhGap.toFixed(2)}px`; zhEl.style.marginRight = `${(-zhGap).toFixed(2)}px`;
      return { en, zh, sc };
    });
    return prep;
  };

  void prepLogo();   // size 李思曼 right away

  const drawDots = (P2: Dots): void => {
    const A = ms.from === 'zh' ? P2.zh : P2.en, B = ms.to === 'zh' ? P2.zh : P2.en, t = ms.p;
    const eo = (x: number): number => 1 - (1 - x) ** 3, eio = (x: number): number => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
    let d = '';
    for (let i = 0; i < A.length; i++) {
      let x: number, y: number;
      if (t < 0.42) { const k = eo(t / 0.42); x = A[i][0] + (P2.sc[i][0] - A[i][0]) * k; y = A[i][1] + (P2.sc[i][1] - A[i][1]) * k; }
      else { const k = eio((t - 0.42) / 0.58); x = P2.sc[i][0] + (B[i][0] - P2.sc[i][0]) * k; y = P2.sc[i][1] + (B[i][1] - P2.sc[i][1]) * k; }
      d += `M${x.toFixed(1)},${y.toFixed(1)}h0.01`;
    }
    dotPath?.setAttribute('d', d);
  };

  const morph = (to: Lang): void => {
    if (ms.to === to && !raf) return;
    if (reduceMotion) { ms = { from: to, to, p: 1 }; logo.classList.toggle('is-zh', to === 'zh'); return; }
    void prepLogo().then((ready) => {
      if (!ready) { logo.classList.toggle('is-zh', to === 'zh'); return; }
      const running = raf !== 0; if (raf) cancelAnimationFrame(raf);
      const start = running ? 1 - ms.p : 0, t0 = performance.now(), D = 1100;
      ms = { from: ms.to, to, p: start }; raf = 0;
      logo.classList.add('is-moving');
      const tick = (now: number): void => {
        ms.p = Math.min(1, start + (now - t0) / D); drawDots(ready);
        // hand over to the real letters while the dots are still settling (no moment of heavy dot-lettering): the
        // letters fade in as the dots fade out
        if (ms.p >= 0.8 && logo.classList.contains('is-moving')) { logo.classList.remove('is-moving'); logo.classList.toggle('is-zh', to === 'zh'); }
        if (ms.p < 1) raf = requestAnimationFrame(tick);
        else raf = 0;
      };
      raf = requestAnimationFrame(tick);
    });
  };
  // only where there is a real hover (a mouse): a phone fakes a hover on a tap and never takes it back, which left the
  // name stuck in Chinese. From the keyboard (Tab) it still turns; a tap's focus does not.
  if (matchMedia('(hover: hover)').matches) {
    logo.addEventListener('mouseenter', () => morph('zh'));
    logo.addEventListener('mouseleave', () => morph('en'));
  }
  logo.addEventListener('focus', () => { if (logo.matches(':focus-visible')) morph('zh'); });
  logo.addEventListener('blur', () => morph('en'));
  void document.fonts?.ready.then(() => prepLogo());
}

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------
applyWeather(null);            // draw immediately with a light breeze, then fill in live weather
drawFerry();
drawSky();
void pullWeather();
setInterval(drawSky, 60 * 1000);
// refit the sky when the hero changes shape (rotation, resizing)
{
  let raf = 0;
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (fitSky()) { growTrees(); drawSky(); if (lastCur) applyWeather(lastCur); } }); }).observe(svg.parentElement!);
}

// the clock in the bottom bar: New York time, ticking over exactly on the minute
const clockFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: SITE.city.tz });
const tick = (): void => {
  const el = document.getElementById('ny-time'); if (!el) return;
  const now = new Date(); el.textContent = clockFmt.format(now); el.setAttribute('datetime', now.toISOString());
  setTimeout(tick, 60000 - (now.getTime() % 60000) + 50);
};
tick();
setInterval(() => void pullWeather(), SITE.weatherEveryMin * 60 * 1000);
setInterval(drawFerry, 60 * 60 * 1000);
