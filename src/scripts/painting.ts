// @ts-nocheck — generative drawing code, kept loose on purpose. Its public shape is typed in painting-types.ts.
/* Siman Li — the painting.
   A line landscape after Qiu Ying's "Waiting for the Ferry on an Autumn River" (秋江待渡图),
   drawn entirely in code. astro(): sun & moon over New York. weather(): rain/snow/fog/cloud marks.
   build(): the landscape itself (deterministic for a given seed). */
import type { PaintingAPI } from './painting-types';

export const Painting: PaintingAPI = {
  astro(ms, latDeg = 40.7128, lngDeg = -74.006) {   // New York unless another place is given
    const PI = Math.PI, rad = PI / 180, e = rad * 23.4397, lat = latDeg * rad, lw = rad * -lngDeg;
    const d = ms / 86400000 - 0.5 + 2440588 - 2451545;
    const radec = (l, b) => ({ ra: Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)), dec: Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) });
    const pos = (c) => { const H = rad * (280.16 + 360.9856235 * d) - lw - c.ra; return { alt: Math.asin(Math.sin(lat) * Math.sin(c.dec) + Math.cos(lat) * Math.cos(c.dec) * Math.cos(H)), az: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(c.dec) * Math.cos(lat)) }; };
    const M = rad * (357.5291 + 0.98560028 * d), C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), Ls = M + C + rad * 102.9372 + PI;
    const sc = radec(Ls, 0);
    const mL = rad * (218.316 + 13.176396 * d), mM = rad * (134.963 + 13.064993 * d), mF = rad * (93.272 + 13.229350 * d);
    const mc = radec(mL + rad * 6.289 * Math.sin(mM), rad * 5.128 * Math.sin(mF)); const mdist = 385001 - 20905 * Math.cos(mM), sdist = 149598000;
    const phi = Math.acos(Math.sin(sc.dec) * Math.sin(mc.dec) + Math.cos(sc.dec) * Math.cos(mc.dec) * Math.cos(sc.ra - mc.ra));
    const inc = Math.atan2(sdist * Math.sin(phi), mdist - sdist * Math.cos(phi));
    const ang = Math.atan2(Math.cos(sc.dec) * Math.sin(sc.ra - mc.ra), Math.sin(sc.dec) * Math.cos(mc.dec) - Math.cos(sc.dec) * Math.sin(mc.dec) * Math.cos(sc.ra - mc.ra));
    return { sun: pos(sc), moon: pos(mc), frac: (1 + Math.cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / PI };
  },

  weather(kind, seed, mph) { mph = mph || 0; const sl = -(4 + mph * 0.45);
    let a = (seed * 7 + kind.length) >>> 0;
    const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = (lo, hi) => lo + (hi - lo) * rnd(); const f = (n) => n.toFixed(1);
    const wx = [], fog = [], clouds = []; let d = '';
    if (kind === 'rain') { for (let i = 0; i < 280; i++) { const x = R(0, 1820), y = R(20, 720); d += `M${f(x)},${f(y)} l${f(sl)},16 `; } wx.push({ d, c: 'mid', w: 0.7, o: 0.6 }); fog.push({ y: 300, h: 90, o: 0.35 }); }
    if (kind === 'snow') { for (let i = 0; i < 220; i++) { const x = R(0, 1800), y = R(20, 720); d += rnd() < 0.8 ? `M${f(x)},${f(y)} l0.1,0 ` : `M${f(x - 3)},${f(y)} h6 M${f(x)},${f(y - 3)} v6 M${f(x - 2)},${f(y - 2)} l4,4 M${f(x + 2)},${f(y - 2)} l-4,4 `; } wx.push({ d, c: 'ink', w: 2.6, o: 0.75 }); }
    if (kind === 'cloudy' || kind === 'rain') {
      // outline clouds: a union of round puffs on top, long flat tails at the ends,
      // on a flat base. The outline is traced column by column.
      const cloud = (x, y, s) => {
        const E = [], n = 3 + Math.floor(rnd() * 3), pk = (n - 1) * R(0.62, 0.8),   /* the tallest puff always toward the right */ rMax = R(22, 30) * s;
        let px0 = x, prev = null;
        for (let i = 0; i < n; i++) {   // the puffs, tallest near the peak, each overlapping the last
          const k = Math.exp(-(((i - pk) / 0.9) ** 2)), r = rMax * (0.4 + 0.6 * k) * R(0.92, 1.04);
          if (prev) px0 += (prev.rx + r) * R(0.5, 0.68);
          prev = { x: px0, y: y - r * R(0.35, 0.55) - 6 * s * k, rx: r, ry: r }; E.push(prev);
        }
        const L = E[0].x - E[0].rx, Rt = E[n - 1].x + E[n - 1].rx, Wd = Rt - L;
        const tl = R(0.2, 0.32) * Wd, tr = R(0.08, 0.15) * Wd,   /* long tail left, short right */ th = R(5, 9) * s;   // the long flat tails
        E.push({ x: L + tl * 0.35, y: y - th * 0.45, rx: tl, ry: th }, { x: Rt - tr * 0.35, y: y - th * 0.45, rx: tr, ry: th });
        rnd();   // (was: flat or scalloped base) — every cloud now sits on a flat base
        let lo = Infinity, hi = -Infinity; for (const e of E) { lo = Math.min(lo, e.x - e.rx); hi = Math.max(hi, e.x + e.rx); }
        const top = [], bot = [];
        for (let i = 0, N = Math.ceil((hi - lo) / 1.6); i <= N; i++) {
          const px = lo + (hi - lo) * i / N; let t = Infinity, b = -Infinity;
          for (const e of E) { const u = (px - e.x) / e.rx; if (u * u > 1) continue; const h = e.ry * Math.sqrt(1 - u * u); t = Math.min(t, e.y - h); b = Math.max(b, e.y + h); }
          if (t === Infinity) continue;
          b = Math.min(b, y);   // flat base
          top.push(f(px) + ',' + f(t)); bot.push(f(px) + ',' + f(Math.max(t, b)));
        }
        const shape = 'M' + top.join(' L') + ' L' + bot.reverse().join(' L') + ' Z';
        clouds.push({ d: shape, x0: lo, x1: hi, k: R(0.8, 1.2) });   // drawn & drifted by hero.ts
      };
      // spread out: one cloud per slot across the sky, alternating high and low, so they never bunch up
      const nC = kind === 'rain' ? 5 : 4, slot = 1700 / nC, hiFirst = rnd() < 0.5;
      for (let i = 0; i < nC; i++) cloud(20 + slot * (i + R(0.05, 0.4)), (i % 2 === 0) === hiFirst ? R(75, 105) : R(150, 190), R(0.9, 1.35));
    }
    if (kind === 'fog') { fog.push({ y: 250, h: 70, o: 0.55 }, { y: 360, h: 60, o: 0.6 }, { y: 470, h: 80, o: 0.5 }); }
    return { wx, fog, clouds, dim: kind === 'fog' ? 0.75 : kind === 'rain' ? 0.85 : 1 };
  },

  // build(): the landscape (same seed → same painting). Round hills, pagoda + hall + little Buddha on the far shore,
  // boulders after Qiu Ying on the near bank, scattered reeds. Each range is paper-filled so hills never cross.
  build(seed, o) {
    let a = seed >>> 0;
    const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = (lo, hi) => lo + (hi - lo) * rnd();
    const RI = (lo, hi) => Math.floor(R(lo, hi + 1));
    const tbl = Array.from({ length: 512 }, () => rnd());
    const vn = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return tbl[((i % 512) + 512) % 512] * (1 - u) + tbl[(((i + 1) % 512) + 512) % 512] * u; };
    const fbm = (x) => vn(x) * 0.55 + vn(x * 2.1 + 17) * 0.27 + vn(x * 4.3 + 41) * 0.13 + vn(x * 9.1 + 7) * 0.05;
    const f1 = (n) => n.toFixed(1);
    const W = o.W, H = o.H, V = o.vertical, INK = o.ink, MID = o.mid, LT = o.light;
    const Ls = { far: [], mid: [], water: [], near: [] }; const TR = [], RD = [];
    const st = { trees: 0, marks: 0, moss: 0 };
    const add = (l, d, c, w, op, t) => { if (d && d.length > 4) Ls[l].push({ d, c, w, o: op, t: t === 1.219 || t === 1.2191 ? t : +t.toFixed(2) }); };   // the Buddha's ring / rays keep their exact tag (hero.ts animates them)
    const LEXT = V ? 0 : 0.09 * W;   // how much further the left bank reaches (landscape)
    const REXT = V ? 0 : 0.06 * W;   // how much further left the Buddha's bank reaches (landscape)
    const g = V ? {
      farBase: 0.40 * H, main: { c: R(0.4, 0.66) * W, top: R(0.12, 0.17) * H, w: R(0.22, 0.32) * W },
      sides: [{ c: R(0.02, 0.22) * W, top: R(0.27, 0.31) * H, w: R(0.18, 0.26) * W }, { c: R(0.78, 0.98) * W, top: R(0.26, 0.3) * H, w: R(0.16, 0.24) * W }],
      dist: [{ c: R(0, 0.4) * W, top: 0.33 * H, w: 0.12 * W }, { c: R(0.6, 1) * W, top: 0.325 * H, w: 0.1 * W }],
      bankL: { x0: -20, x1: R(0.4, 0.6) * W, base: 0.47 * H, top: 0.425 * H }, bankR: { x0: R(0.62, 0.76) * W, x1: W + 20, base: 0.48 * H, top: 0.45 * H },
      w0: 0.5 * H, w1: 0.76 * H, boat: { x: R(0.35, 0.7) * W, y: R(0.56, 0.66) * H },
      rock: { x0: -20, x1: R(0.5, 0.66) * W, top: R(0.8, 0.84) * H }, treeH: [0.21, 0.29], reed: { x0: 0.68 * W, x1: W - 10, y: R(0.9, 0.96) * H, h: [0.04, 0.08] }, k: 1
    } : {
      farBase: 0.47 * H, main: { c: R(0.55, 0.76) * W, top: R(0.1, 0.17) * H, w: R(0.13, 0.19) * W },
      sides: [{ c: R(0.36, 0.5) * W, top: R(0.29, 0.33) * H, w: R(0.12, 0.16) * W }, { c: R(0.86, 1) * W, top: R(0.27, 0.31) * H, w: R(0.12, 0.16) * W }],
      dist: [{ c: R(0.2, 0.45) * W, top: 0.37 * H, w: 0.08 * W }, { c: R(0.8, 1) * W, top: 0.36 * H, w: 0.07 * W }],
      bankL: { x0: -20, x1: R(0.36, 0.5) * W + LEXT, base: 0.55 * H, top: 0.495 * H }, bankR: { x0: R(0.7, 0.8) * W * 0 + 0.71 * W - REXT, x1: W + 20, base: 0.57 * H, top: 0.525 * H },
      w0: 0.6 * H, w1: 0.82 * H, boat: { x: R(0.46, 0.7) * W, y: R(0.65, 0.74) * H },
      rock: { x0: -20, x1: R(0.27, 0.37) * W, top: R(0.8, 0.85) * H }, treeH: [0.46, 0.6], reed: { x0: 0.74 * W, x1: W - 10, y: R(0.93, 0.98) * H, h: [0.07, 0.12] }, k: 1.1
    };
    // mountain form: peak 尖峰 · round 圆峦 · mesa 方台 · ranges 群峰
    const FORM = o.form || 'round';
    if (FORM === 'peak') { g.main.top -= 0.03 * H; g.main.w *= 0.85; }
    if (FORM === 'round') { g.main.top += 0.09 * H; g.main.w *= 1.7; g.sides.forEach((p) => { p.w *= 1.5; p.top += 0.03 * H; }); }
    if (FORM === 'mesa') { g.main.top += 0.05 * H; g.main.w *= 1.45; g.sides.forEach((p) => { p.w *= 1.3; }); }
    if (FORM === 'ranges') { g.main.w *= 0.42; }
    const shape = FORM === 'round' ? (t) => (t >= 1 ? 0 : (Math.cos(t * Math.PI) + 1) / 2)
      : FORM === 'mesa' ? (t) => (t >= 1 ? 0 : t < 0.42 ? 1 - 0.06 * t : Math.pow(1 - (t - 0.42) / 0.58, 1.15))
      : FORM === 'peak' ? (t) => (t >= 1 ? 0 : Math.pow(1 - Math.pow(t, 0.9), 2.6))
      : (t) => (t >= 1 ? 0 : Math.pow(1 - Math.pow(t, 1.1), 2.2));
    const range = (layer, peaks, base, x0, x1, col, n, t0, opt) => {
      const off = R(0, 200);
      // opt.tailR: the right end slopes gently down to the water over that fraction of the range, instead of stopping short
      const ss = (u) => (u >= 1 ? 1 : u <= 0 ? 0 : u * u * (3 - 2 * u));
      const tailRt = (x) => (opt.tailR ? ss((x1 - x) / (opt.tailR * (x1 - x0))) : 1);
      const tailLt = (x) => (opt.tailL ? ss((x - x0) / (opt.tailL * (x1 - x0))) : 1);   // opt.tailL: the same at the left end
      const tail = (x) => tailRt(x) * tailLt(x);
      const hgt = (x) => { let h = 0; peaks.forEach((p) => { h = Math.max(h, (base - p.top) * shape(Math.abs(x - p.c) / p.w)); }); h *= tail(x); return h * (0.86 + 0.24 * fbm(x * 0.012 + off)) + (h > 2 ? (fbm(x * 0.09 + off) - 0.5) * 5 * tail(x) : 0); };
      // opt.footL {xa, xb, drop}: left of xa the ridge keeps curving down (steep first, then easing) until xb, so a slope
      // that would stop in mid-air runs on down behind the bank in front of it
      // footL {from, len, drop}: the foot starts exactly where the original slope (left of `from`) would end, so the
      // mountain itself keeps its shape; only the line beyond it is added
      let fxa = -Infinity;
      if (opt.footL) { fxa = opt.footL.from; while (fxa > x0 && hgt(fxa) >= 1.5) fxa -= 2; }
      const foot = (x) => { const F = opt.footL; if (!F || x >= fxa) return 0; const u = Math.min(1, (fxa - x) / F.len); return F.drop * (1 - (1 - u) * (1 - u)); };
      const bAt = (x) => base + (opt.drop || 0) * (1 - tailRt(x)) + (opt.dropL || 0) * (1 - tailLt(x)) + foot(x);   // the base sinks along the tail (opt.drop) and the foot
      const hide = opt.hide || (() => false);   // opt.hide(x): leave out the strokes there (randoms are still drawn, so nothing else changes)
      const ridge = (x) => bAt(x) - hgt(x);
      const xs0 = Math.max(-10, x0), xs1 = Math.min(W + 10, x1);
      if (layer !== 'far') { let sd = `M${f1(xs0)},${f1(base + 4)}`; for (let x = xs0; x <= xs1; x += 5) sd += ` L${f1(x)},${f1(Math.min(bAt(x), ridge(x)))}`; sd += ` L${f1(xs1)},${f1(bAt(xs1) + 4)} Z`; Ls[layer].push({ d: sd, c: col, w: 0, o: 1, t: t0, bg: true }); }
      else {
        // the far hills' paper only where a hill is drawn (the same test as its outline below): a flat strip of paper
        // along the base where there is no hill was an invisible horizon that cut off a low sun above the bank
        let sd = '', run: [number, number][] = [];
        const flush = (): void => {
          if (run.length > 1) { const [xa] = run[0], [xb] = run[run.length - 1]; sd += `M${f1(xa)},${f1(bAt(xa) + 4)}` + run.map(([x, y]) => ` L${f1(x)},${f1(y)}`).join('') + ` L${f1(xb)},${f1(bAt(xb) + 4)} Z `; }
          run = [];
        };
        for (let x = xs0; x <= xs1; x += 5) {
          const inTail = (opt.tailR && x > x1 - opt.tailR * (x1 - x0)) || (opt.tailL && x < x0 + opt.tailL * (x1 - x0));
          if ((hgt(x) < 1.5 && x >= fxa && !inTail) || hide(x)) flush(); else run.push([x, Math.min(bAt(x), ridge(x))]);
        }
        flush();
        if (sd) Ls[layer].push({ d: sd.trim(), c: col, w: 0, o: 1, t: t0, bg: true });
      }
      for (let k = 0; k < n; k++) {
        const f = 1 - k / (n + 0.6); let d = '', on = false;
        for (let x = xs0; x <= xs1; x += 5) {
          // the outline keeps going along a foot or a sloping end (tailR / tailL), all the way down to the water
          const inTail = !k && ((opt.tailR && x > x1 - opt.tailR * (x1 - x0)) || (opt.tailL && x < x0 + opt.tailL * (x1 - x0)));
          const h = hgt(x), inFoot = !k && x < fxa; if ((h < 1.5 + k * 2 && !inFoot && !inTail) || hide(x)) { on = false; continue; }
          const y = bAt(x) - h * f + k * 1.4 + (k ? (fbm(x * 0.06 + k * 13) - 0.5) * 4 : 0);
          d += (on ? ' L' : ' M') + f1(x) + ',' + f1(y); on = true;
        }
        add(layer, d, col, k ? 0.6 : (opt.bw || 1.05), k ? Math.max(0.2, 0.6 - k * 0.07) : 1, t0 + k * 0.1);
      }
      let cun = '';
      const nC = Math.floor((xs1 - xs0) / 7 * (opt.cun || 1));
      for (let i = 0; i < nC; i++) {
        const x = R(xs0, xs1), h = hgt(x); if (h < 12) continue;
        const pk = peaks.reduce((b, p) => Math.abs(x - p.c) < Math.abs(x - b.c) ? p : b, peaks[0]);
        const sgn = x < pk.c ? -1 : 1, y = ridge(x) + R(3, Math.min(30, h * 0.5)), len = R(10, Math.min(60, h * 0.7));
        if (!hide(x)) cun += `M${f1(x)},${f1(y)} q${f1(sgn * R(2, 6))},${f1(len * 0.5)} ${f1(sgn * R(5, 14))},${f1(len)} `;
      }
      add(layer, cun, col, 0.55, 0.42, t0 + 0.5);
      if (opt.moss) {
        let m = '';
        for (let x = xs0 + R(0, 20); x < xs1; x += R(6, 24)) { const h = hgt(x); if (h < 8) continue; const y = ridge(x) - 1, hd = hide(x); if (!hd) { m += `M${f1(x)},${f1(y)} l0.6,1.6 `; st.moss++; } if (rnd() < 0.35 && !hd) m += `M${f1(x + 2.5)},${f1(y + 1)} l0.5,1.4 `; }
        add(layer, m, INK, 1.9, 0.9, t0 + 0.8);
      }
      if (opt.tiny) {
        let tr = '';
        for (let i = 0; i < opt.tiny; i++) { const x = R(xs0 + 10, xs1 - 10), h = hgt(x); if (h < 4) continue; const y = ridge(x) + 1, s = R(0.6, 1.2) * g.k; if (!(opt.tinyHide && opt.tinyHide(x))) tr += `M${f1(x)},${f1(y)} v${f1(-7 * s)} M${f1(x - 4 * s)},${f1(y - 6 * s)} l${f1(4 * s)},${f1(-5 * s)} l${f1(4 * s)},${f1(5 * s)} M${f1(x - 3 * s)},${f1(y - 10 * s)} l${f1(3 * s)},${f1(-4 * s)} l${f1(3 * s)},${f1(4 * s)} `; }
        add(layer, tr, INK, 0.8, 0.85, t0 + 0.9);
      }
      return ridge;
    };
    // FAR: main peak + side ranges + distant hills
    // the pale hill right of the sun is gone; run the original pass into a scratch layer so the rest of the painting keeps its exact shapes
    Ls.scratch = []; range('scratch', g.dist, g.farBase + 0.02 * H, -10, W + 10, LT, 3, 0.0, { cun: 0.3 });
    // landscape: the left side range only peeked out as a thin pale line beside the main peak, so it is left out there
    const rSides = range('far', g.sides, g.farBase, -10, W + 10, MID, 5, 0.2, { cun: 0.8, moss: true, hide: V ? undefined : (x) => x < g.main.c });
    const mainPeaks = FORM === 'ranges'
      ? Array.from({ length: 6 }, (_, i) => ({ c: g.main.c + (i - 2.5 + R(-0.18, 0.18)) * g.main.w * 1.1, top: g.main.top + (i === 2 ? 0 : R(0.03, 0.15) * H), w: g.main.w * R(0.75, 1.2) }))
      : [g.main, { c: g.main.c + g.main.w * R(0.35, 0.55) * (rnd() < 0.5 ? -1 : 1), top: g.main.top + R(0.04, 0.08) * H, w: g.main.w * 0.55 }];
    // landscape: where the main peak's left slope stops in mid-air, the line runs on, curving down behind the near bank
    // (the mountain itself is untouched: the foot starts exactly where the original slope ends)
    const mainOpts = { cun: 1.4, moss: true, bw: 1.2,
      footL: V ? undefined : { from: g.main.c, len: g.main.w * 0.6, drop: 0.07 * H } };
    // one summit, not two: the second peak is left out, but the two-peak mountain is first run into a scratch pass so
    // the random sequence — and with it everything painted after the mountain — stays exactly as before
    const a0m = a, nFar = Ls.far.length; range('far', mainPeaks, g.farBase, -10, W + 10, INK, 7, 0.4, mainOpts); const a1m = a; Ls.far.length = nFar; a = a0m;
    const rMain = range('far', FORM === 'ranges' ? mainPeaks : [g.main], g.farBase, -10, W + 10, INK, 7, 0.4, mainOpts); a = a1m;
    let birds = ''; for (let i = 0; i < RI(2, 5); i++) { const x = R(0.15, 0.85) * W, y = R(0.06, 0.2) * H; birds += `M${f1(x)},${f1(y)} q3,-3 6,0 q3,-3 6,0 `; }
    void birds;   // (no still birds in the sky: hero.ts flies a few across instead; still generated so the randoms stay the same)
    // MID: low banks with tiny trees
    const bl = g.bankL, br = g.bankR;
    const bankL = (bp, bx, extra) => range('mid', [{ c: bp.x0 + (bp.x1 - bp.x0) * R(0.25, 0.55), top: bp.top, w: (bp.x1 - bp.x0) * 0.55 }, { c: bp.x0 + (bp.x1 - bp.x0) * R(0.65, 0.85), top: bp.top + 0.012 * H, w: (bp.x1 - bp.x0) * 0.35 }], bx.base, bx.x0, bx.x1, INK, 4, 1.0, { cun: 0.6, moss: true, tiny: RI(6, 14), ...extra });
    // the bank reaches a little further and slopes down into the water at its right end (tailR) — but the random
    // sequence is kept exactly as it was with the shorter bank, so everything painted after it stays the same
    const blShort = { ...bl, x1: bl.x1 - LEXT }, a0 = a, nMid = Ls.mid.length;
    const ridgeLOld = bankL(blShort, blShort, {}); const a1 = a; Ls.mid.length = nMid; a = a0;
    const ridgeL = bankL(blShort, bl, { tailR: 0.22, drop: g.w0 - bl.base }); a = a1;   // the tail comes down to the water line
    const bankR = (bp, bx, extra, more = []) => range('mid', [{ c: bp.x0 + (bp.x1 - bp.x0) * R(0.4, 0.7), top: bp.top, w: (bp.x1 - bp.x0) * 0.6 }, ...more], bx.base, bx.x0, bx.x1, INK, 3, 1.15, { cun: 0.5, moss: true, tiny: RI(3, 8),
      // no little trees right in front of the temple (hall · Buddha · pagoda at 0.8 W, see below); randoms unchanged
      tinyHide: (x) => (o.temple || 'pagoda') === 'pagoda' && x > 0.8 * W - 50 * g.k * 1.35 - 20 && x < 0.8 * W + 32 * g.k * 1.35 + 20, ...extra });
    // the Buddha's bank reaches a little further left and slopes down to just above the water (tailL) — with the random
    // sequence of the shorter bank kept, so everything painted after it stays the same
    const brShort = { ...br, x0: br.x0 + REXT }, a0r = a, nMidR = Ls.mid.length;
    const ridgeROld = bankR(brShort, brShort, {}); const a1r = a; Ls.mid.length = nMidR; a = a0r;
    // a gentle slope: from the hall the ground only falls away to the left (its highest point is under the temple), down to the water
    const ridgeR = bankR(brShort, br, { tailL: 0.22, dropL: g.w0 - br.base }, [{ c: 0.8 * W - 49 * g.k * 1.35, top: br.base - 0.017 * H, w: 0.8 * W - 49 * g.k * 1.35 - br.x0 + 20 }]); a = a1r;
    // TEMPLE on the far bank: a small one, line-drawn, with dotted roof tiles
    const TP = o.temple || 'pagoda';
    const tk = g.k * 1.35;
    const roof = (x, y, hw, h, up) => `M${f1(x - hw - up)},${f1(y - up * 0.9)} Q${f1(x - hw * 0.6)},${f1(y + 0.6)} ${f1(x - hw * 0.45)},${f1(y - h)} L${f1(x + hw * 0.45)},${f1(y - h)} Q${f1(x + hw * 0.6)},${f1(y + 0.6)} ${f1(x + hw + up)},${f1(y - up * 0.9)} M${f1(x - hw * 0.45)},${f1(y - h)} l${f1(-1.6)},${f1(-1.8)} M${f1(x + hw * 0.45)},${f1(y - h)} l${f1(1.6)},${f1(-1.8)} `;
    const tiles = (x, y, hw, h) => { let d = ''; for (let u = -0.8; u <= 0.81; u += 0.2) d += `M${f1(x + u * hw * 0.45)},${f1(y - h + 0.8)} L${f1(x + u * hw * 0.85)},${f1(y - 0.6)} `; return d; };
    const hall = (x, y, s) => {
      let d = `M${f1(x - 17 * s)},${f1(y)} h${f1(34 * s)} M${f1(x - 15 * s)},${f1(y - 2 * s)} h${f1(30 * s)} `;          // two-step platform
      d += `M${f1(x - 11 * s)},${f1(y - 2 * s)} v${f1(-8 * s)} M${f1(x + 11 * s)},${f1(y - 2 * s)} v${f1(-8 * s)} M${f1(x - 4 * s)},${f1(y - 2 * s)} v${f1(-8 * s)} M${f1(x + 4 * s)},${f1(y - 2 * s)} v${f1(-8 * s)} `; // columns
      d += `M${f1(x - 2.2 * s)},${f1(y - 2 * s)} v${f1(-5 * s)} h${f1(4.4 * s)} v${f1(5 * s)} `;                               // door
      d += roof(x, y - 10 * s, 15 * s, 6 * s, 3 * s) + `M${f1(x - 7 * s)},${f1(y - 16 * s)} h${f1(14 * s)} `;                  // hip roof + ridge
      return { d, tl: tiles(x, y - 10 * s, 15 * s, 6 * s), top: y - 17 * s };
    };
    const pagoda = (x, y, s, n) => {
      let d = `M${f1(x - 9 * s)},${f1(y)} h${f1(18 * s)} `, tl = '', yy = y, bw = 6.5 * s;
      for (let i = 0; i < n; i++) {
        const bh = (i ? 4.2 : 6) * s;
        d += `M${f1(x - bw)},${f1(yy)} v${f1(-bh)} M${f1(x + bw)},${f1(yy)} v${f1(-bh)} `;
        if (i === 0) d += `M${f1(x - 1.6 * s)},${f1(yy)} v${f1(-3.6 * s)} h${f1(3.2 * s)} v${f1(3.6 * s)} `;
        yy -= bh; const ew = bw + 4 * s;
        d += roof(x, yy, ew, 2.6 * s, 2 * s); tl += tiles(x, yy, ew, 2.6 * s);
        yy -= 2.6 * s; bw *= 0.86;
      }
      d += `M${f1(x)},${f1(yy)} v${f1(-7 * s)} M${f1(x - 1.4 * s)},${f1(yy - 2 * s)} h${f1(2.8 * s)} M${f1(x - 1.1 * s)},${f1(yy - 4 * s)} h${f1(2.2 * s)} `;
      return { d, tl, top: yy - 7 * s };
    };
    const pavilion = (x, y, s) => {
      let d = `M${f1(x - 11 * s)},${f1(y)} h${f1(22 * s)} M${f1(x - 9 * s)},${f1(y)} v${f1(-8 * s)} M${f1(x + 9 * s)},${f1(y)} v${f1(-8 * s)} M${f1(x - 3 * s)},${f1(y - 0.5 * s)} v${f1(-7.5 * s)} M${f1(x + 3 * s)},${f1(y - 0.5 * s)} v${f1(-7.5 * s)} M${f1(x - 9 * s)},${f1(y - 3 * s)} h${f1(18 * s)} `;
      const yr = y - 8 * s;
      d += `M${f1(x - 15 * s)},${f1(yr - 2.6 * s)} Q${f1(x - 9 * s)},${f1(yr + 0.8)} ${f1(x - 5 * s)},${f1(yr - 3 * s)} Q${f1(x - 1.5 * s)},${f1(yr - 6 * s)} ${f1(x)},${f1(yr - 10 * s)} Q${f1(x + 1.5 * s)},${f1(yr - 6 * s)} ${f1(x + 5 * s)},${f1(yr - 3 * s)} Q${f1(x + 9 * s)},${f1(yr + 0.8)} ${f1(x + 15 * s)},${f1(yr - 2.6 * s)} M${f1(x)},${f1(yr - 10 * s)} v${f1(-3 * s)} `;
      let tl = ''; for (let u = -0.8; u <= 0.81; u += 0.2) tl += `M${f1(x)},${f1(yr - 9 * s)} L${f1(x + u * 11 * s)},${f1(yr - 1)} `;
      return { d, tl, top: yr - 13 * s };
    };
    // a seated stone Buddha on a lotus, with dotted head and body halos — the setting sun lands just behind him
    const buddha = (x, y, s) => {
      let d = `M${f1(x - 10 * s)},${f1(y)} h${f1(20 * s)} M${f1(x - 9 * s)},${f1(y - 2.4 * s)} h${f1(18 * s)} `;               // plinth
      for (let i = 0; i < 6; i++) { const px = x - 9 * s + i * 3 * s; d += `M${f1(px)},${f1(y - 2.4 * s)} q${f1(1.5 * s)},${f1(-2.6 * s)} ${f1(3 * s)},0 `; } // lotus petals
      d += `M${f1(x - 8.5 * s)},${f1(y - 4.4 * s)} Q${f1(x)},${f1(y - 9.5 * s)} ${f1(x + 8.5 * s)},${f1(y - 4.4 * s)} `;          // crossed legs
      d += `M${f1(x - 4.2 * s)},${f1(y - 15.5 * s)} Q${f1(x - 6.4 * s)},${f1(y - 11 * s)} ${f1(x - 7.6 * s)},${f1(y - 5.4 * s)} M${f1(x + 4.2 * s)},${f1(y - 15.5 * s)} Q${f1(x + 6.4 * s)},${f1(y - 11 * s)} ${f1(x + 7.6 * s)},${f1(y - 5.4 * s)} `; // body
      d += `M${f1(x - 2.4 * s)},${f1(y - 6.6 * s)} q${f1(2.4 * s)},${f1(1.6 * s)} ${f1(4.8 * s)},0 `;                              // hands in dhyana
      d += `M${f1(x - 3 * s)},${f1(y - 15.4 * s)} q${f1(3 * s)},${f1(1.4 * s)} ${f1(6 * s)},0 `;                                     // robe neckline
      d += `M${f1(x)},${f1(y - 16.6 * s)} m${f1(-2.4 * s)},0 a${f1(2.4 * s)},${f1(2.6 * s)} 0 1,0 ${f1(4.8 * s)},0 a${f1(2.4 * s)},${f1(2.6 * s)} 0 1,0 ${f1(-4.8 * s)},0 `; // head
      d += `M${f1(x - 1.1 * s)},${f1(y - 19.1 * s)} q${f1(1.1 * s)},${f1(-1.6 * s)} ${f1(2.2 * s)},0 `;                              // ushnisha
      d += `M${f1(x - 2.5 * s)},${f1(y - 17.4 * s)} v${f1(1.8 * s)} M${f1(x + 2.5 * s)},${f1(y - 17.4 * s)} v${f1(1.8 * s)} `;      // long ears
      const halo = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)} a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0 a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0 `;
      return { d, tl: halo(x, y - 16.6 * s, 5.4 * s) + halo(x, y - 11 * s, 11.5 * s), top: y - 23 * s };
    };
    const temples = []; let tpl = '', tpt = '', tpe = '';
    const putAt = (x, ridge, fn) => { const y = ridge(x) + 1.5; const t = fn(x, y); tpl += t.d; tpt += t.tl; temples.push({ x, y, top: t.top }); return y; };
    const xR = (R(0.3, 0.45), 0.8 * W);
    if (TP === 'hall') putAt(xR, ridgeR, (x, y) => hall(x, y, tk));
    if (TP === 'pagoda') { putAt(xR + 24 * tk, ridgeR, (x, y) => pagoda(x, y, tk * 0.7, 5)); putAt(xR - 40 * tk, ridgeR, (x, y) => hall(x, y, tk * 0.6)); }   // hall · Buddha · pagoda
    if (TP === 'pavilion') { const xp = br.x0 + (br.x1 - br.x0) * R(0.12, 0.2); putAt(xp, ridgeR, (x, y) => pavilion(x, y, tk * 1.1)); }
    if (TP === 'hill') {
      // a temple tucked up the mountain: hall + pagoda among pines, a gate by the water and a dotted path climbing
      const xm = br.x0 - R(0.04, 0.08) * W, ym = g.farBase - R(0.05, 0.08) * H;
      const hb = hall(xm, ym, tk * 0.85); tpl += hb.d + `M${f1(xm - 20 * tk)},${f1(ym)} h${f1(40 * tk)} `; tpt += hb.tl; temples.push({ x: xm, y: ym, top: hb.top });
      const pg = pagoda(xm + 24 * tk, ym - 4 * tk, tk * 0.75, 4); tpl += pg.d; tpt += pg.tl;
      const xg = xR, yg = ridgeR(xg) + 1.5;
      tpl += `M${f1(xg - 6 * tk)},${f1(yg)} v${f1(-9 * tk)} M${f1(xg + 6 * tk)},${f1(yg)} v${f1(-9 * tk)} M${f1(xg - 9 * tk)},${f1(yg - 9 * tk)} q${f1(9 * tk)},${f1(2 * tk)} ${f1(18 * tk)},0 M${f1(xg - 7 * tk)},${f1(yg - 6.5 * tk)} h${f1(14 * tk)} `;
      let path = `M${f1(xg)},${f1(yg - 1)}`; let px = xg, py = yg - 1; const steps = 7;
      for (let i = 1; i <= steps; i++) { const u = i / steps; const nx = xg + (xm + 6 * tk - xg) * u + (i % 2 ? 1 : -1) * R(8, 18), ny = yg - 1 + (ym - yg + 1) * u; path += ` Q${f1((px + nx) / 2 + R(-6, 6))},${f1((py + ny) / 2)} ${f1(nx)},${f1(ny)}`; px = nx; py = ny; }
      tpe += path + ' ';
      let pines = ''; for (let i = 0; i < 4; i++) { const x = xm + R(-34, 44) * tk, y = ym + R(-2, 3), sc = R(0.8, 1.3) * tk; pines += `M${f1(x)},${f1(y)} v${f1(-14 * sc)} M${f1(x - 6 * sc)},${f1(y - 6 * sc)} l${f1(6 * sc)},${f1(-4 * sc)} l${f1(6 * sc)},${f1(4 * sc)} M${f1(x - 5 * sc)},${f1(y - 10 * sc)} l${f1(5 * sc)},${f1(-4 * sc)} l${f1(5 * sc)},${f1(4 * sc)} M${f1(x - 3.5 * sc)},${f1(y - 14 * sc)} l${f1(3.5 * sc)},${f1(-3 * sc)} l${f1(3.5 * sc)},${f1(3 * sc)} `; }
      tpl += pines;
      // mist band to tuck the hall into the mountain
      let mist = ''; for (let i = 0; i < 3; i++) { const y = ym + 4 + i * 5, x = xm - R(40, 80); mist += `M${f1(x)},${f1(y)} q${f1(R(30, 60))},${f1(-2)} ${f1(R(80, 140))},0 `; }
      add('mid', mist, LT, 0.6, 0.35, 1.2);
    }
    let bud = null;
    if (TP === 'pagoda') {
      // small Buddha icon B20 (60% smaller), on the far bank between the hall and the pagoda — the pagoda stays tallest
      const u = 0.72 * 0.4 * 0.7 * 0.6 * g.k / 1.1, bxx = xR - 8 * tk, byy = ridgeR(xR - 8 * tk) + 1;   // in the middle: the hall on his left, the pagoda on his right
      const T = (d) => d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, x, y) => f1(bxx + (+x - 100) * u) + ',' + f1(byy + (+y - 184) * u));
      const circ = (cx, cy, r) => { const X = bxx + (cx - 100) * u, Y = byy + (cy - 184) * u, rr = r * u; return `M${f1(X - rr)},${f1(Y)} a${f1(rr)},${f1(rr)} 0 1,0 ${f1(2 * rr)},0 a${f1(rr)},${f1(rr)} 0 1,0 ${f1(-2 * rr)},0 Z `; };
      const bodyD = T('M70,150 L70,122 Q70,102 90,100 L110,100 Q130,102 130,122 L130,150 L143,150 C152.4,150 160,157.6 160,167 C160,176.4 152.4,184 143,184 L57,184 C47.6,184 40,176.4 40,167 C40,157.6 47.6,150 57,150 Z');
      const bunD = circ(100, 44, 4.5) + T('M91,60 Q91,49 100,49 Q109,49 109,60 Z');
      const headD = circ(100, 76, 17);
      const cy = byy + (78 - 184) * u;
      Ls.mid.push({ d: circ(100, 78, 56), c: INK, w: 0, o: 1, t: 1.218, bg: true });
      // radiant halo: a ring with rays of uneven length all the way round. Each ray is its own stroke (hero.ts makes them
      // flicker); they sit behind the figure's paper, so his body hides the ones behind it, and the lower ones stop at the ground
      add('mid', circ(100, 78, 60), INK, 0.6, 0.7, 1.219);
      { const cxx = bxx, cyy = byy + (78 - 184) * u, N = 30, ground = (184 - 78 - 2) * u;
        for (let i = 0; i < N; i++) {
          const an = -Math.PI / 2 + 2 * Math.PI * i / N + (i % 2 ? 0.02 : -0.02), r1 = 72 * u;
          let r2 = (i % 3 === 0 ? 128 : i % 3 === 1 ? 108 : 94) * u;
          if (Math.sin(an) > 0.01) r2 = Math.min(r2, ground / Math.sin(an));   // no deeper than his seat
          if (r2 < r1 + 3 * u) continue;
          add('mid', `M${f1(cxx + Math.cos(an) * r1)},${f1(cyy + Math.sin(an) * r1)} L${f1(cxx + Math.cos(an) * r2)},${f1(cyy + Math.sin(an) * r2)}`, INK, 0.8, 0.8, 1.2191);
        } }
      Ls.mid.push({ d: bunD + bodyD + headD, c: INK, w: 0, o: 1, t: 1.2195, bg: true });      // paper behind the figure
      add('mid', bunD, INK, 0.8, 0.85, 1.2196);
      add('mid', bodyD, INK, 0.8, 0.85, 1.2197);
      Ls.mid.push({ d: headD, c: INK, w: 0, o: 1, t: 1.2198, bg: true });
      add('mid', headD + T('M84,150 Q100,160 116,150'), INK, 0.8, 0.85, 1.2199);
      const bxx_ = bxx;
      bud = { x: bxx, y: cy, g: byy };   // g: the ground he sits on
    }
    add('mid', tpl, INK, 0.8, 0.85, 1.22);
    add('mid', tpt, INK, 0.55, 0.42, 1.23);
    if (TP === 'pagoda') {   // the hill covers the feet of the hall and pagoda: paper below the ridge, then the ridge line again on top (no randoms)
      let top = '', bot = '';
      for (let x = xR - 64 * tk; x <= xR + 44 * tk; x += 3) { top += `${top ? ' L' : 'M'}${f1(x)},${f1(ridgeR(x))}`; bot = ` L${f1(x)},${f1(ridgeR(x) + 9)}` + bot; }
      Ls.mid.push({ d: top + bot + ' Z', c: INK, w: 0, o: 1, t: 1.24, bg: true });
      add('mid', top, INK, 1.05, 1, 1.241);
    }
    if (tpe) add('mid', tpe, MID, 0.6, 0.6, 1.24);
    // WATER — natural: broken, gently undulating lines that thin out toward the far shore, tapering at their ends
    const wav = (x, y, len, amp, ph) => { let d = `M${f1(x)},${f1(y)}`; const n = Math.max(3, Math.round(len / 14)); for (let s2 = 1; s2 <= n; s2++) { const u = s2 / n; d += ` L${f1(x + len * u)},${f1(y + Math.sin(u * Math.PI * R(1.5, 3) + ph) * amp * Math.sin(u * Math.PI))}`; } return d + ' '; };
    let wl = '';
    const nW = RI(10, 15);
    for (let i = 0; i < nW; i++) {
      const u = Math.pow(rnd(), 0.8), y = g.w0 + 6 + u * (g.w1 - g.w0 + 0.08 * H), len = (0.03 + u * 0.2) * W * R(0.6, 1.3), x = R(-40, W * 0.9);
      wl += wav(x, y, len, 0.6 + u * 2.2, R(0, 6));
      if (rnd() < 0.5) wl += wav(x + len + R(10, 50), y + R(-1.5, 1.5), len * R(0.2, 0.5), 0.5 + u * 1.5, R(0, 6));
    }
    add('water', wl, MID, 0.6, 0.45, 1.3);
    // the water plane: a soft, broken horizon instead of a ruled line — it fades in and out, slightly uneven
    let hz = ''; { let hx = -20, on = false, next = R(180, 420);
      while (hx <= W + 20) {
        const y = g.w0 + (fbm(hx * 0.0035 + 3) - 0.5) * 5 + (fbm(hx * 0.03 + 11) - 0.5) * 1.4;
        if (hx > next) { on = false; hx += R(4, 14); next = hx + R(180, 460); continue; }
        hz += (on ? ' L' : ' M') + f1(hx) + ',' + f1(y); on = true; hx += 14;
      } hz += ' '; }
    // (the loop above still runs so the randoms stay the same, but its many breaks are replaced:) one long, slightly uneven
    // horizon with at most three small breaks
    { let rs = (seed * 13 + 5) >>> 0; const rr = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
      const gaps = [0.22, 0.5, 0.78].map((f) => { const c = (f + (rr() - 0.5) * 0.1) * W; return [c, c + 14 + rr() * 26]; });
      hz = ''; let on = false;
      for (let hx = -20; hx <= W + 20; hx += 14) {
        const y = g.w0 + (fbm(hx * 0.0035 + 3) - 0.5) * 5 + (fbm(hx * 0.03 + 11) - 0.5) * 1.4;
        if (gaps.some(([a, b]) => hx > a && hx < b)) { on = false; continue; }
        hz += (on ? ' L' : ' M') + f1(hx) + ',' + f1(y); on = true;
      } hz += ' '; }
    { let hz2 = ''; for (let hx = R(0, 60); hx < W; hx += R(90, 240)) { const len = R(40, 160), y = g.w0 + R(3.5, 6); hz2 += `M${f1(hx)},${f1(y)} q${f1(len / 2)},${f1(R(-1, 1))} ${f1(len)},0 `; } add('water', hz2, MID, 0.6, 0.45, 1.255); }
    add('water', hz, MID, 0.7, 0.7, 1.25);
    // little wave flicks 水纹: small solid arcs, denser and larger toward the viewer, sparse in the far water
    let fl = '';
    for (let i = 0; i < 70; i++) {
      const u = Math.pow(rnd(), 0.7), y = g.w0 + 10 + u * (g.w1 - g.w0 + 0.1 * H), x = R(g.rock.x1 * 0.6, W - 20), w2 = (4 + u * 12) * R(0.7, 1.3);
      if (Math.abs(x - g.boat.x) < 70 && Math.abs(y - g.boat.y) < 20) continue;
      fl += `M${f1(x)},${f1(y)} q${f1(w2 * 0.5)},${f1(-w2 * 0.28)} ${f1(w2)},0 `;
      if (rnd() < 0.4) fl += `M${f1(x + w2)},${f1(y)} q${f1(w2 * 0.4)},${f1(-w2 * 0.22)} ${f1(w2 * 0.8)},0 `;
    }
    add('water', fl, MID, 0.7, 0.55, 1.26);
    // reflections: short dotted strokes mirroring the banks and the temple, breaking up with distance from the shore
    let refl = '';
    const mirror = (x0, x1, base, ridge, rows) => { for (let r = 0; r < rows; r++) { const y = base + 4 + r * R(3.5, 5.5); for (let xx = x0 + R(0, 20); xx < x1; xx += R(14, 40)) { const h = ridge ? Math.max(0, base - ridge(xx)) : 10; if (h < 3 + r * 3) continue; refl += `M${f1(xx)},${f1(y)} h${f1(R(6, 26) * (1 - r * 0.15))} `; } } };
    { const a0 = a, n0 = refl.length; mirror(bl.x0, bl.x1 - LEXT, bl.base, ridgeLOld, 4); const a1 = a; refl = refl.slice(0, n0); a = a0;   // same randoms as the shorter bank
      mirror(bl.x0, bl.x1, bl.base, ridgeL, 4); a = a1; }
    { const a0 = a, n0 = refl.length; mirror(br.x0 + REXT, br.x1, br.base, ridgeROld, 4); const a1 = a; refl = refl.slice(0, n0); a = a0;   // same randoms as the shorter bank
      mirror(br.x0, br.x1, br.base, ridgeR, 4); a = a1; }
    temples.forEach((t) => { if (t.y > g.farBase) { const hgt = t.y - t.top; for (let i = 0; i < 6; i++) { const y = t.y + (g.w0 - t.y) + 3 + i * hgt * 0.14; refl += `M${f1(t.x - R(2, 8))},${f1(y)} h${f1(R(4, 14))} `; } } });
    add('water', refl, MID, 0.6, 0.45, 1.27);
    const bx = g.boat.x, by = g.boat.y, s = g.k * R(0.9, 1.15); void bx; void by; void s;   // the ferry itself is drawn live by hero.ts
    let sails = ''; for (let i = 0; i < RI(1, 3); i++) { const x = R(0.55, 0.92) * W, y = R(g.w0, g.w0 + 0.05 * H); sails += `M${f1(x)},${f1(y)} h14 M${f1(x + 6)},${f1(y)} v-12 l7,10 `; }
    void sails;   // no other boats on the water: the sails are still generated (so the randoms stay the same) but not drawn
    // NEAR: rocks after Qiu Ying — rounded masses with solid outlines, dotted folds and creases inside, shrubs and grass
    const ROCK = o.rock || 'boulder';
    const lumps = [], islets = [];
    const L1 = (cx, by, w, h, lean, kind) => lumps.push({ cx, by, w, h, lean: lean || 0, kind: kind || 'land', seed: R(0, 100) });
    const B = H + 14, WL = 0.88 * H;
    if (ROCK === 'boulder') {
      L1(0.02 * W, B, 0.26 * W, 0.25 * H, -0.1); L1(0.19 * W, B, 0.36 * W, 0.31 * H, 0.25); L1(0.08 * W, B + 6, 0.18 * W, 0.11 * H, 0);
      L1(0.33 * W, B, 0.13 * W, 0.12 * H, 0.2); L1(0.37 * W, 0.97 * H, 0.07 * W, 0.06 * H, 0.1);
      L1(0.43 * W, WL + 14, 0.045 * W, 0.035 * H, 0, 'water'); L1(0.47 * W, WL + 26, 0.03 * W, 0.022 * H, 0, 'water');
    } else if (ROCK === 'stack') {
      for (let i = 0; i < 6; i++) { const u = i / 5; L1((0.02 + u * 0.36) * W + R(-10, 10), B - (i % 2) * 10 - u * 0.04 * H, (0.22 - u * 0.1) * W, (0.24 - u * 0.17) * H * R(0.9, 1.1), R(-0.1, 0.25)); }
      L1(0.44 * W, WL + 12, 0.05 * W, 0.04 * H, 0.1, 'water'); L1(0.5 * W, WL + 22, 0.035 * W, 0.025 * H, -0.1, 'water'); L1(0.53 * W, WL + 30, 0.02 * W, 0.014 * H, 0, 'water');
    } else if (ROCK === 'ledge') {
      L1(0.0 * W, B, 0.22 * W, 0.2 * H, 0); L1(0.17 * W, B, 0.3 * W, 0.3 * H, 0.3, 'ledge'); L1(0.3 * W, B + 4, 0.1 * W, 0.08 * H, 0.1);
      L1(0.4 * W, WL + 16, 0.06 * W, 0.045 * H, 0.2, 'water'); L1(0.45 * W, WL + 28, 0.03 * W, 0.02 * H, 0, 'water');
    } else {
      L1(0.16 * W, B, 0.5 * W, 0.11 * H, 0.05); L1(0.1 * W, B - 0.08 * H, 0.14 * W, 0.12 * H, 0.15); L1(0.27 * W, B - 0.06 * H, 0.1 * W, 0.08 * H, -0.1);
      L1(0.04 * W, B - 0.06 * H, 0.08 * W, 0.07 * H, 0);
      for (let i = 0; i < 5; i++) L1((0.4 + i * 0.045 + R(-0.01, 0.01)) * W, WL + R(4, 34), R(0.02, 0.05) * W, R(0.015, 0.04) * H, R(-0.2, 0.2), 'water');
    }
    // draw back-to-front: higher base and smaller first
    lumps.sort((p, q) => (p.kind === 'water') - (q.kind === 'water') || (p.by - p.h * 0.2) - (q.by - q.h * 0.2) || q.h - p.h);
    // faceted outline: a few knots (facet corners) joined by slightly bent edges, flat-ish tops and steep shoulders
    lumps.forEach((L) => {
      const K = L.w > 0.1 * W ? RI(6, 9) : RI(4, 6), ks = [];
      for (let i = 0; i <= K; i++) { const t = i === 0 ? 0 : i === K ? 1 : (i + R(-0.3, 0.3)) / K; const sn = Math.sin(Math.PI * t); ks.push({ t, h: i === 0 || i === K ? 0 : Math.pow(sn, 0.38) * R(0.72, 1.08) }); }
      L.ks = ks;
    });
    const arc = (L, sh) => { // upper outline of a lump; sh shrinks it for inner folds
      const out = [], N = Math.max(14, Math.round(L.w / 7)), ks = L.ks;
      for (let i = 0; i <= N; i++) {
        const t = i / N; let j = 1; while (j < ks.length - 1 && ks[j].t < t) j++;
        const k0 = ks[j - 1], k1 = ks[j], u = (t - k0.t) / Math.max(0.001, k1.t - k0.t);
        const prof = k0.h + (k1.h - k0.h) * (u * u * (3 - 2 * u) * 0.35 + u * 0.65) + Math.sin(u * Math.PI) * 0.04;
        const n2 = (fbm(t * 11 + L.seed * 2) - 0.5);
        let hh = L.h * prof * (1 + n2 * 0.1) * (sh ? sh.h : 1);
        let x = L.cx + (t - 0.5) * L.w * (sh ? sh.w : 1) + L.lean * (hh / L.h) * L.w * 0.32;
        if (L.kind === 'ledge' && t > 0.55) { const v = (t - 0.55) / 0.45; x -= v * v * L.w * 0.55; hh = Math.max(hh, L.h * (1 - v) * 0.9 * (sh ? sh.h : 1)); }
        out.push([x, L.by - hh - (sh ? sh.dy : 0)]);
      }
      return out;
    };
    const P = (a) => 'M' + a.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' L');
    let tops = [];
    let moss = '', shrub = '', grass = '', vine = '', wbase = '';
    lumps.forEach((L, li) => {
      const a = arc(L), t0 = 2.0 + li * 0.01;
      Ls.near.push({ d: P(a) + ` L${f1(a[a.length - 1][0])},${f1(L.by + 2)} L${f1(a[0][0])},${f1(L.by + 2)} Z`, c: INK, w: 0, o: 1, t: +t0.toFixed(2), bg: true });
      add('near', P(a), INK, 1.3, 1, t0 + 0.001);
      // inner folds: two or three shrunk contours, broken, dotted
      let fold = '';
      for (let k = 1; k <= (L.h > 0.08 * H ? 3 : 1); k++) {
        const b = arc(L, { w: 1 - k * 0.16, h: 1 - k * 0.24, dy: -k * 0.03 * L.h }); const i0 = RI(1, Math.floor(b.length * 0.35)), i1 = RI(Math.ceil(b.length * 0.6), b.length - 2);
        fold += P(b.slice(i0, i1).map((p) => [p[0] + R(-2, 2), p[1] + R(-2, 2)])) + ' ';
      }
      // creases: strokes running down the face from the top edge, following the bulge
      let cr = '';
      const nCr = Math.round(L.w / 26);
      for (let i = 0; i < nCr; i++) {
        const j = RI(2, a.length - 3), p = a[j], side = j < a.length / 2 ? -1 : 1, len = R(0.25, 0.75) * (L.by - p[1]);
        if (len < 6) continue;
        cr += `M${f1(p[0])},${f1(p[1] + 3)} q${f1(side * R(3, 10))},${f1(len * 0.5)} ${f1(side * R(-2, 6))},${f1(len)} `;
      }
      L.ks.slice(1, -1).forEach((kn) => { const j = Math.round(kn.t * (a.length - 1)), p = a[j]; const len = (L.by - p[1]) * R(0.5, 0.95), side = kn.t < 0.5 ? -1 : 1; if (len > 8) cr += `M${f1(p[0])},${f1(p[1] + 1)} q${f1(side * R(2, 7))},${f1(len * 0.45)} ${f1(side * R(4, 12))},${f1(len)} `; if (len > 30 && rnd() < 0.6) cr += `M${f1(p[0] + side * 6)},${f1(p[1] + len * 0.5)} q${f1(side * 10)},${f1(4)} ${f1(side * R(14, 30))},${f1(R(2, 8))} `; });
      add('near', fold, INK, 0.6, 0.45, t0 + 0.002);
      add('near', cr, INK, 0.7, 0.55, t0 + 0.003);
      { // snow cap (shown only in heavy snow): a paper-white band over the top, its lower edge a scalloped line.
        // Pure geometry, no random numbers, so the rest of the painting never changes.
        const top = L.by - L.h * 0.5, idx = a.map((p, i) => (p[1] < top ? i : -1)).filter((i) => i >= 0);
        if (idx.length > 3) {
          const i0 = idx[0], i1 = idx[idx.length - 1], sz = Math.min(1, L.h / (0.08 * H));
          const up = [], lo = [];
          for (let i = i0; i <= i1; i++) {
            const u = (i - i0) / (i1 - i0), taper = Math.pow(Math.sin(Math.PI * u), 0.6);
            const th = (4 + sz * (7 + 7 * Math.abs(Math.sin(i * 0.9 + L.seed)))) * taper;   // thick, with soft scallops
            up.push([a[i][0], a[i][1] + 0.9]); lo.push([a[i][0], a[i][1] + 0.9 + th]);
          }
          Ls.near.push({ d: P(up) + ' L' + lo.slice().reverse().map((p) => f1(p[0]) + ',' + f1(p[1])).join(' L') + ' Z', c: INK, w: 0, o: 1, t: +(t0 + 0.004).toFixed(3), bg: true, snow: true });
          Ls.near.push({ d: P(lo), c: INK, w: 0.8, o: 0.8, t: +(t0 + 0.005).toFixed(3), snow: true });
        }
      }
      // moss along the top
      for (let j = 1; j < a.length - 1; j += RI(1, 3)) if (rnd() < 0.5 && a[j][1] < L.by - L.h * 0.5) moss += `M${f1(a[j][0])},${f1(a[j][1] - 1)} l0.6,1.6 `;
      if (L.kind === 'water') { wbase += `M${f1(L.cx - L.w * 0.7)},${f1(L.by + 1)} q${f1(L.w * 0.35)},2 ${f1(L.w * 0.7)},0 t${f1(L.w * 0.7)},0 `; }
      else tops.push(a);
      if (L.kind === 'water') islets.push({ a, by: L.by });   // the little rocks out in the river
      // shrubs and grass tufts on the larger masses
      if (L.kind !== 'water' && L.w > 0.06 * W) {
        const nS = RI(1, 3);
        for (let q = 0; q < nS; q++) {
          const p = a[RI(Math.floor(a.length * 0.25), Math.floor(a.length * 0.85))], r = R(14, 30) * g.k;
          shrub += `M${f1(p[0])},${f1(p[1] + 2)} q${f1(R(-6, 6))},${f1(-r * 0.5)} ${f1(R(-10, 10))},${f1(-r * 0.9)} `;
          for (let m = 0; m < RI(14, 26); m++) { const lx = p[0] + R(-r, r), ly = p[1] - R(0, r * 1.1) + 4; shrub += `M${f1(lx)},${f1(ly)} l${f1(-2.6)},${f1(2.2)} M${f1(lx)},${f1(ly)} l${f1(2.6)},${f1(2.2)} M${f1(lx)},${f1(ly)} l0,${f1(3)} `; }
        }
        for (let q = 0; q < RI(1, 3); q++) { const p = a[RI(1, a.length - 2)]; for (let m = 0; m < RI(4, 7); m++) grass += `M${f1(p[0] + R(-4, 4))},${f1(p[1] + 1)} q${f1(R(-3, 3))},${f1(-R(5, 9))} ${f1(R(-8, 8))},${f1(-R(10, 18))} `; }
        if (L.kind === 'ledge') { const tip = a.reduce((b, p) => (p[0] > b[0] ? p : b), a[0]); for (let v = 0; v < 4; v++) { let vx = tip[0] - v * 14 - 6, vy = tip[1] + 6; vine += `M${f1(vx)},${f1(vy)}`; for (let s3 = 0; s3 < 6; s3++) { vy += R(8, 14); vx += R(-4, 4); vine += ` L${f1(vx)},${f1(vy)}`; shrub += `M${f1(vx)},${f1(vy)} l-2.4,2 M${f1(vx)},${f1(vy)} l2.4,2 `; } vine += ' '; } }
      }
    });
    { // lingzhi 灵芝: two or three ruyi-shaped caps on short stems, on the shoulder of the biggest land rock
      const big = lumps.filter((L) => L.kind !== 'water').sort((p, q) => q.w * q.h - p.w * p.h)[0];
      if (big) {
        const a = arc(big), p = a[Math.round(a.length * 0.72)], zs = 1.15 * g.k; let cap = '', ring = '', bgc = '';
        [[0, 0, 1], [-15, 5, 0.75], [12, 7, 0.6]].forEach(([dx, dy, sc]) => {
          const x = p[0] + dx * zs, y = p[1] - 3 + dy * zs, s4 = zs * sc * 1.25, cx = x + R(-3, 3), cy = y - 14 * s4;
          const c = `M${f1(cx - 9 * s4)},${f1(cy + 2 * s4)} Q${f1(cx - 11 * s4)},${f1(cy - 6 * s4)} ${f1(cx - 3 * s4)},${f1(cy - 6.5 * s4)} Q${f1(cx)},${f1(cy - 9 * s4)} ${f1(cx + 3 * s4)},${f1(cy - 6.5 * s4)} Q${f1(cx + 11 * s4)},${f1(cy - 6 * s4)} ${f1(cx + 9 * s4)},${f1(cy + 2 * s4)} Q${f1(cx + 4 * s4)},${f1(cy)} ${f1(cx)},${f1(cy + 2.4 * s4)} Q${f1(cx - 4 * s4)},${f1(cy)} ${f1(cx - 9 * s4)},${f1(cy + 2 * s4)} Z`;
          bgc += c + ' '; cap += c + ` M${f1(cx)},${f1(cy + 2.4 * s4)} Q${f1(cx + 2 * s4)},${f1(cy + 8 * s4)} ${f1(x)},${f1(y)} `;
          for (let r = 1; r <= 2; r++) ring += `M${f1(cx - (9 - r * 2.6) * s4)},${f1(cy + (1 - r * 1.6) * s4)} Q${f1(cx)},${f1(cy - (8 - r * 2.2) * s4)} ${f1(cx + (9 - r * 2.6) * s4)},${f1(cy + (1 - r * 1.6) * s4)} `;
        });
        Ls.near.push({ d: bgc, c: INK, w: 0, o: 1, t: 2.34, bg: true });
        add('near', cap, INK, 1.0, 1, 2.35); add('near', ring, INK, 0.6, 0.45, 2.36);
      }
    }
    add('near', moss, INK, 1.9, 0.9, 2.31);
    add('near', vine, INK, 0.75, 0.85, 2.32);
    add('near', grass, INK, 0.75, 0.85, 2.33);
    add('near', shrub, INK, 0.9, 0.9, 2.95);
    add('water', wbase, MID, 0.6, 0.45, 1.29);
    // a sampled skyline of the land rocks, for planting trees
    const pts = []; let xMax = -20; tops.forEach((a) => a.forEach((p) => { xMax = Math.max(xMax, p[0]); }));
    for (let xx = -20; xx <= xMax; xx += 6) { let y = H + 20; tops.forEach((a) => { for (let i = 1; i < a.length; i++) { const p0 = a[i - 1], p1 = a[i]; if ((xx - p0[0]) * (xx - p1[0]) <= 0 && p0[0] !== p1[0]) { const yy = p0[1] + (p1[1] - p0[1]) * (xx - p0[0]) / (p1[0] - p0[0]); if (yy < y) y = yy; } } }); pts.push([xx, y]); }
    const rTopAt = (x) => { let best = pts[0]; pts.forEach((p) => { if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p; }); return best[1]; };
    const rk = { x0: -20, x1: Math.min(xMax, 0.36 * W) };
    // TREES
    const types = ['dot', 'ge', 'circle', 'pine', 'dot', 'ge'];
    const foliage = (x, y, type, sc) => {
      let d = ''; const r = R(10, 19) * g.k * sc, n = Math.floor(RI(9, 15) * sc);
      for (let i = 0; i < n; i++) {
        const px = x + R(-r, r), py = y + R(-r * 0.75, r * 0.45); st.marks++;
        if (type === 'dot') d += `M${f1(px)},${f1(py)} q2.2,-2.2 4.4,0 `;
        else if (type === 'ge') d += `M${f1(px)},${f1(py)} l-3,4 M${f1(px)},${f1(py)} l0,5 M${f1(px)},${f1(py)} l3,4 `;
        else if (type === 'circle') d += `M${f1(px - 2.6)},${f1(py)} a2.6,2.6 0 1,0 5.2,0 a2.6,2.6 0 1,0 -5.2,0 `;
        else { for (let q = -2; q <= 2; q++) { const an = -Math.PI / 2 + q * 0.35; d += `M${f1(px)},${f1(py)} l${f1(Math.cos(an) * 6)},${f1(Math.sin(an) * 6 + 3)} `; } }
      }
      return d;
    };
    const tree = (x, y, h, type, lean) => {
      // trunk: every line of the tree, as before. Split for drawing: edge (the two sides of each thick segment), fill (the
      // paper between them) and other (bark marks, thin twigs, the roots). hero.ts draws the edges twice as thick, then the
      // paper over them, then the rest: the paper hides the inner half of each edge and every edge that runs inside
      // another branch, so the whole tree shows one outline, with nothing behind it (or inside it) showing through
      let trunk = '', leaves = '', fill = '', edge = '', other = '';
      const seg = (x, y, ang, len, wid, depth) => {
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, bend = R(-0.22, 0.22) * len;
        const mx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * bend;
        if (wid > 1.8) {
          const nx = Math.cos(ang + Math.PI / 2) * wid / 2, ny = Math.sin(ang + Math.PI / 2) * wid / 2;
          const sides = `M${f1(x + nx)},${f1(y + ny)} Q${f1(mx + nx)},${f1(my + ny)} ${f1(ex + nx * 0.62)},${f1(ey + ny * 0.62)} M${f1(x - nx)},${f1(y - ny)} Q${f1(mx - nx)},${f1(my - ny)} ${f1(ex - nx * 0.62)},${f1(ey - ny * 0.62)} `;
          trunk += sides; edge += sides;
          // (no randoms used for the paper)
          fill += `M${f1(x + nx)},${f1(y + ny)} Q${f1(mx + nx)},${f1(my + ny)} ${f1(ex + nx * 0.62)},${f1(ey + ny * 0.62)} L${f1(ex - nx * 0.62)},${f1(ey - ny * 0.62)} Q${f1(mx - nx)},${f1(my - ny)} ${f1(x - nx)},${f1(y - ny)} Z `;
          if (rnd() < 0.45) { const bark = `M${f1(mx + nx * 0.3)},${f1(my)} q${f1(R(-2, 2))},-3 0,-6 `; trunk += bark; other += bark; }
        } else { const twig = `M${f1(x)},${f1(y)} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)} `; trunk += twig; other += twig; }
        if (depth <= 0 || len < 9) { leaves += foliage(ex, ey, type, 1); return; }
        const n = depth >= 3 ? 2 : (rnd() < 0.55 ? 2 : 3);
        for (let i = 0; i < n; i++) { const da = (i - (n - 1) / 2) * R(0.38, 0.62) + R(-0.14, 0.14); seg(ex, ey, ang + da, len * R(0.6, 0.78), wid * 0.6, depth - 1); }
        if (depth <= 2 && rnd() < 0.5) leaves += foliage((x + ex) / 2, (y + ey) / 2, type, 0.6);
      };
      const wid = h * R(0.02, 0.028) + 3;
      seg(x, y, -Math.PI / 2 + lean, h * R(0.36, 0.44), wid, 4);
      const roots = `M${f1(x - wid)},${f1(y + 1)} q-6,2 -11,7 M${f1(x + wid)},${f1(y + 1)} q6,2 11,7 `;
      trunk += roots; other += roots;
      st.trees++; return { trunk, leaves, fill, edge, other };
    };
    const nT = RI(3, 5); const tx0 = rk.x0 + 0.05 * W + 20, tx1 = rk.x1 - 0.06 * W;
    // always one tree in the middle: with an even count, the left one of the middle pair is grown (so the randoms, and every
    // other tree's shape, stay the same) but not planted
    const skip = nT % 2 === 0 ? nT / 2 - 1 : -1, nK = skip < 0 ? nT : nT - 1;
    for (let i = 0; i < nT; i++) {
      const rk0 = skip >= 0 && i > skip ? i - 1 : i;   // its place among the planted trees
      R(0.1, 0.9);   // (the old random spot: still drawn so the randoms stay the same)
      // a close, evenly spaced group around the middle of the rock
      const x = (tx0 + tx1) / 2 + (rk0 - (nK - 1) / 2) * 0.075 * W, y = rTopAt(x) + 2, hr = R(g.treeH[0], g.treeH[1]);   // (drawn so the randoms, and so every tree's shape, stay the same)
      // the middle tree is the tallest (20% more), the outer ones a little shorter — each tree is only scaled, never reshaped
      const rank = rk0, dm = nK > 1 ? Math.abs(rank - (nK - 1) / 2) / ((nK - 1) / 2) : 0;
      const h = 0.4 * H * (1 - 0.14 * dm) * (dm === 0 ? 1.2 : 1);
      const lean = i === nT - 1 ? R(0.3, 0.55) : R(-0.18, 0.18);
      const tr = tree(x, y, h, types[RI(0, types.length - 1)], lean);
      if (i !== skip) TR.push({ d: tr.trunk, l: tr.leaves, f: tr.fill, e: tr.edge, o: tr.other, r: (i * 0.618 + 0.13) % 1 });
    }
    // reeds
    const rd = g.reed; let reeds = ''; const rb = ['', '', '', '']; const band = (x) => Math.max(0, Math.min(3, Math.floor((x - (rd.x0 - 0.12 * W)) / ((rd.x1 - rd.x0 + 0.12 * W) / 4))));
    // reed clumps after Qiu Ying: dense tufts of thin blades from one root, leaning both ways, the long ones arching over
    { const nR = RI(16, 28); for (let i = 0; i < nR; i++) { R(0, 1); R(0, 1); R(0, 1); R(0, 1); if (rnd() < 0.5) { R(0, 1); R(0, 1); } } } // keep the rest of the painting's random sequence unchanged
    { let rs = (Math.floor(rd.x0 * 7 + rd.y * 13) >>> 0) || 7; const rr = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; }; const RR = (lo, hi) => lo + (hi - lo) * rr();
      // scattered single blades (one by one), drawn like Qiu Ying's reeds: thin, gently leaning either way, long ones drooping at the tip
      const nB = 28 + Math.floor(rr() * 10);
      for (let k = 0; k < nB; k++) {
        const x0 = RR(rd.x0 - 0.12 * W, rd.x1), cy = rd.y + RR(-30, 16), dir = rr() < 0.5 ? -1 : 1;
        const long = rr() < 0.3, h = (long ? RR(0.75, 1.15) : RR(0.3, 0.7)) * rd.h[1] * H;
        const lean = dir * h * (long ? RR(0.12, 0.3) : RR(0.05, 0.28));
        const tipX = x0 + lean, tipY = cy - h * (long ? RR(0.8, 0.92) : RR(0.9, 1));
        let bl = ''; bl += `M${f1(x0)},${f1(cy)} C${f1(x0 + lean * 0.05)},${f1(cy - h * 0.5)} ${f1(x0 + lean * 0.55)},${f1(cy - h * 0.95)} ${f1(tipX)},${f1(tipY)} `;
        if (long && rr() < 0.7) bl += `M${f1(tipX)},${f1(tipY)} q${f1(dir * RR(3, 6))},${f1(RR(0, 2))} ${f1(dir * RR(5, 9))},${f1(RR(4, 9))} `;   // drooping tip
        if (rr() < 0.25) { const b = RR(0.25, 0.5); bl += `M${f1(x0 + lean * b * b)},${f1(cy - h * b)} q${f1(-dir * RR(4, 8))},${f1(-RR(6, 12))} ${f1(-dir * RR(8, 14))},${f1(-RR(8, 16))} `; } // a short side blade
        rb[band(x0)] += bl;
      }
    }
    for (let i = 0; i < 3; i++) reeds += `M${f1(rd.x0 - R(10, 40))},${f1(rd.y + 8 + i * 5)} h${f1(R(40, 90))} `;
    add('near', reeds, INK, 0.7, 0.8, 3.0); rb.forEach((d, i) => { if (d) RD.push({ d, r: (i * 0.37 + 0.21) % 1 }); });
    // (the small pale hill behind the right-hand tree is no longer drawn)
    const budX = bud ? bud.x : 0.75 * W, budY = bud ? bud.y : g.farBase;
    return {
      layers: [{ depth: 0.12, paths: Ls.far }, { depth: 0.35, paths: Ls.mid }, { depth: 0.55, paths: Ls.water }, { depth: 1, paths: Ls.near }],
      stats: `${st.trees} trees · ${st.marks} leaf marks · ${st.moss} moss dots`, trees: TR, reeds: RD,
      // the other shore: the little Buddha by the pagoda (the sun sets into his halo)
      far: { x: budX, y: budY },
      geo: { w0: g.w0, rkx: rk.x1, rky: rTopAt(rk.x1), rocks: pts, islets: islets.map((q) => ({ top: q.a.map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]), by: q.by })), k: g.k, S: [rk.x1 + 70, 0.8 * H], E: [budX - 40, br.base + 22], bud: [budX, budY], budG: bud ? bud.g : budY, peakY: g.main.top }
    };
  },


  // a quiet shore for the bottom of the page (colours use the --s* tokens)
  buildNight(seed) {
    let a = seed >>> 0;
    const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = (lo, hi) => lo + (hi - lo) * rnd();
    const RI = (lo, hi) => Math.floor(R(lo, hi + 1));
    const tbl = Array.from({ length: 512 }, () => rnd());
    const vn = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return tbl[((i % 512) + 512) % 512] * (1 - u) + tbl[(((i + 1) % 512) + 512) % 512] * u; };
    const fbm = (x) => vn(x) * 0.55 + vn(x * 2.1 + 17) * 0.27 + vn(x * 4.3 + 41) * 0.13 + vn(x * 9.1 + 7) * 0.05;
    const f1 = (n) => n.toFixed(1);
    const INK = 'sink', MID = 'smid', LT = 'slt';
    const st = { trees: 0, marks: 0, moss: 0 };
    const add = (arr, d, c, w, o, r) => { if (d && d.length > 4) arr.push({ d, c, w, o, cls: 'draw r' + Math.max(1, Math.min(6, r)) }); };
    const shape = (t) => t >= 1 ? 0 : Math.pow(1 - Math.pow(t, 1.25), 1.7);
    const range = (arr, W, peaks, base, x0, x1, col, n, r, opt) => {
      const off = R(0, 200);
      const hgt = (x) => { let h = 0; peaks.forEach((p) => { h = Math.max(h, (base - p.top) * shape(Math.abs(x - p.c) / p.w)); }); return h * (0.86 + 0.24 * fbm(x * 0.012 + off)) + (h > 2 ? (fbm(x * 0.09 + off) - 0.5) * 5 : 0); };
      const ridge = (x) => base - hgt(x);
      const xs0 = Math.max(-10, x0), xs1 = Math.min(W + 10, x1);
      for (let k = 0; k < n; k++) {
        const f = 1 - k / (n + 0.6); let d = '', on = false;
        for (let x = xs0; x <= xs1; x += 5) { const h = hgt(x); if (h < 1.5 + k * 2) { on = false; continue; } const y = base - h * f + k * 1.4 + (k ? (fbm(x * 0.06 + k * 13) - 0.5) * 4 : 0); d += (on ? ' L' : ' M') + f1(x) + ',' + f1(y); on = true; }
        add(arr, d, col, k ? 0.6 : (opt.bw || 1.05), k ? Math.max(0.2, 0.6 - k * 0.07) : 1, r + (k > 3 ? 1 : 0));
      }
      let cun = ''; const nC = Math.floor((xs1 - xs0) / 7 * (opt.cun || 1));
      for (let i = 0; i < nC; i++) { const x = R(xs0, xs1), h = hgt(x); if (h < 12) continue; const pk = peaks.reduce((b, p) => Math.abs(x - p.c) < Math.abs(x - b.c) ? p : b, peaks[0]); const sg = x < pk.c ? -1 : 1, y = ridge(x) + R(3, Math.min(30, h * 0.5)), len = R(10, Math.min(60, h * 0.7)); cun += `M${f1(x)},${f1(y)} q${f1(sg * R(2, 6))},${f1(len * 0.5)} ${f1(sg * R(5, 14))},${f1(len)} `; }
      add(arr, cun, col, 0.55, 0.42, r + 1);
      if (opt.moss) { let m = ''; for (let x = xs0 + R(0, 20); x < xs1; x += R(6, 24)) { const h = hgt(x); if (h < 8) continue; const y = ridge(x) - 1; m += `M${f1(x)},${f1(y)} l0.6,1.6 `; st.moss++; if (rnd() < 0.35) m += `M${f1(x + 2.5)},${f1(y + 1)} l0.5,1.4 `; } add(arr, m, INK, 1.9, 0.9, r + 2); }
      if (opt.tiny) { let tr = ''; for (let i = 0; i < opt.tiny; i++) { const x = R(xs0 + 10, xs1 - 10), h = hgt(x); if (h < 4) continue; const y = ridge(x) + 1, s = R(0.6, 1.2); tr += `M${f1(x)},${f1(y)} v${f1(-7 * s)} M${f1(x - 4 * s)},${f1(y - 6 * s)} l${f1(4 * s)},${f1(-5 * s)} l${f1(4 * s)},${f1(5 * s)} M${f1(x - 3 * s)},${f1(y - 10 * s)} l${f1(3 * s)},${f1(-4 * s)} l${f1(3 * s)},${f1(4 * s)} `; } add(arr, tr, INK, 0.8, 0.85, r + 2); }
      return ridge;
    };
    const water = (arr, W, y0, y1, n, r) => { let wl = ''; for (let i = 0; i < n; i++) { const y = R(y0, y1), x = R(-20, W * 0.85), len = R(0.05, 0.22) * W; let d = `M${f1(x)},${f1(y)}`; for (let s = 1; s <= 8; s++) d += ` L${f1(x + len * s / 8)},${f1(y + Math.sin(s * 1.3 + i) * 1.2)}`; wl += d + ' '; } add(arr, wl, MID, 0.6, 0.45, r); };
    // HERO 1440 x 620
    const hero = []; const HW = 1440;
    const main = { c: R(0.55, 0.78) * HW, top: R(60, 120), w: R(0.13, 0.19) * HW };
    range(hero, HW, [{ c: R(0.15, 0.4) * HW, top: 360, w: 0.09 * HW }, { c: R(0.82, 1) * HW, top: 350, w: 0.08 * HW }], 575, -10, HW + 10, LT, 3, 1, { cun: 0.3 });
    range(hero, HW, [{ c: R(0.35, 0.5) * HW, top: R(260, 300), w: R(0.12, 0.16) * HW }, { c: R(0.88, 1) * HW, top: R(250, 290), w: R(0.12, 0.16) * HW }], 565, -10, HW + 10, MID, 5, 1, { cun: 0.8, moss: true });
    range(hero, HW, [main, { c: main.c + main.w * R(0.35, 0.55) * (rnd() < 0.5 ? -1 : 1), top: main.top + R(40, 70), w: main.w * 0.55 }], 565, -10, HW + 10, INK, 7, 2, { cun: 1.4, moss: true, bw: 1.2 });
    const blx = R(0.32, 0.46) * HW; range(hero, HW, [{ c: blx * 0.45, top: 582, w: blx * 0.55 }, { c: blx * 0.8, top: 592, w: blx * 0.3 }], 620, -20, blx, INK, 3, 3, { cun: 0.5, moss: true, tiny: RI(6, 12) });
    const brx = R(0.74, 0.84) * HW; range(hero, HW, [{ c: brx + (HW - brx) * 0.5, top: 596, w: (HW - brx) * 0.6 }], 622, brx, HW + 20, INK, 3, 3, { cun: 0.4, moss: true, tiny: RI(3, 7) });
    let birds = ''; for (let i = 0; i < RI(2, 5); i++) { const x = R(0.12, 0.5) * HW, y = R(40, 160); birds += `M${f1(x)},${f1(y)} q3,-3 6,0 q3,-3 6,0 `; } add(hero, birds, INK, 0.9, 0.75, 4);
    // RIVER 1440 x 420
    const river = []; water(river, HW, 30, 400, RI(7, 11), 1);
    let rp = ''; for (let i = 0; i < 4; i++) { const x = R(0.02, 0.2) * HW; rp += `M${f1(x)},${f1(10 + i * 6)} h${f1(R(40, 110))} `; } add(river, rp, MID, 0.6, 0.5, 1);
    const bx = R(0.58, 0.78) * HW, by = R(230, 320), s = 1.3;
    add(river, `M${f1(bx - 34 * s)},${f1(by - 3 * s)} Q${f1(bx)},${f1(by + 7 * s)} ${f1(bx + 34 * s)},${f1(by - 4 * s)} M${f1(bx - 30 * s)},${f1(by - 2 * s)} L${f1(bx + 30 * s)},${f1(by - 3 * s)} M${f1(bx - 18 * s)},${f1(by - 2 * s)} v${f1(-9 * s)} h${f1(16 * s)} v${f1(9 * s)} M${f1(bx - 20 * s)},${f1(by - 11 * s)} q${f1(10 * s)},${f1(-4 * s)} ${f1(20 * s)},0 M${f1(bx + 18 * s)},${f1(by - 3 * s)} v${f1(-13 * s)} M${f1(bx + 18 * s)},${f1(by - 18 * s)} a2.4,2.4 0 1,0 0.1,0 M${f1(bx + 18 * s)},${f1(by - 13 * s)} l${f1(22 * s)},${f1(26 * s)} M${f1(bx - 40 * s)},${f1(by + 4 * s)} h${f1(18 * s)} M${f1(bx + 26 * s)},${f1(by + 5 * s)} h${f1(30 * s)} M${f1(bx - 10 * s)},${f1(by + 10 * s)} h${f1(40 * s)}`, INK, 1, 1, 3);
    let sails = ''; for (let i = 0; i < RI(1, 3); i++) { const x = R(0.82, 0.96) * HW, y = R(40, 120); sails += `M${f1(x)},${f1(y)} h14 M${f1(x + 6)},${f1(y)} v-12 l7,10 `; } add(river, sails, MID, 0.8, 0.8, 2);
    // GROVE 700 x 1000
    const grove = []; const GW = 700, GH = 1000;
    const rk = { x0: -20, x1: R(0.74, 0.88) * GW, top: R(0.74, 0.79) * GH };
    const pts = []; for (let x = rk.x0; x <= rk.x1; x += 6) { const u = (x - rk.x0) / (rk.x1 - rk.x0); const y = rk.top + u * u * 0.08 * GH - (1 - u) * 0.02 * GH + (fbm(x * 0.03 + 9) - 0.5) * 18; pts.push([x, y]); }
    const rTopAt = (x) => { let b = pts[0]; pts.forEach((p) => { if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p; }); return b[1]; };
    add(grove, 'M' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' L') + ` Q${f1(rk.x1 + 18)},${f1(pts[pts.length - 1][1] + 10)} ${f1(rk.x1 + 26)},${GH + 10}`, INK, 1.3, 1, 1);
    let inner = ''; for (let k = 1; k <= 2; k++) inner += 'M' + pts.filter((_, i) => i % 2 === 0).map((p) => f1(p[0]) + ',' + f1(p[1] + k * 12 + R(-3, 3))).join(' L') + ' '; add(grove, inner, INK, 0.6, 0.45, 2);
    let axe = ''; for (let i = 0; i < 46; i++) { const x = R(rk.x0 + 10, rk.x1), y = rTopAt(x) + R(8, GH - rTopAt(x)); if (y > GH) continue; axe += `M${f1(x)},${f1(y)} l${f1(R(6, 16))},${f1(R(3, 9))} `; } add(grove, axe, INK, 0.7, 0.55, 2);
    let stones = ''; for (let i = 0; i < RI(2, 4); i++) { const x = Math.min(GW - 30, rk.x1 + R(10, 50)), y = rTopAt(rk.x1) + R(30, 90); stones += `M${f1(x)},${f1(y)} q${f1(R(6, 10))},${f1(-R(6, 10))} ${f1(R(14, 22))},0 `; } add(grove, stones, INK, 0.9, 0.9, 3);
    let gw = ''; for (let i = 0; i < 4; i++) { const y = rTopAt(rk.x1) + 40 + i * 12; gw += `M${f1(rk.x1 + 30)},${f1(y)} h${f1(R(30, 80))} `; } add(grove, gw, MID, 0.6, 0.5, 3);
    const foliage = (x, y, type, sc) => { let d = ''; const r = R(12, 22) * sc, n = Math.floor(RI(10, 16) * sc); for (let i = 0; i < n; i++) { const px = x + R(-r, r), py = y + R(-r * 0.75, r * 0.45); st.marks++; if (type === 'dot') d += `M${f1(px)},${f1(py)} q2.4,-2.4 4.8,0 `; else if (type === 'ge') d += `M${f1(px)},${f1(py)} l-3.4,4.4 M${f1(px)},${f1(py)} l0,5.4 M${f1(px)},${f1(py)} l3.4,4.4 `; else if (type === 'circle') d += `M${f1(px - 2.8)},${f1(py)} a2.8,2.8 0 1,0 5.6,0 a2.8,2.8 0 1,0 -5.6,0 `; else { for (let q = -2; q <= 2; q++) { const an = -Math.PI / 2 + q * 0.35; d += `M${f1(px)},${f1(py)} l${f1(Math.cos(an) * 6.5)},${f1(Math.sin(an) * 6.5 + 3)} `; } } } return d; };
    const tree = (x, y, h, type, lean) => { let trunk = '', leaves = ''; const seg = (x, y, ang, len, wid, depth) => { const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, bend = R(-0.22, 0.22) * len; const mx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * bend; if (wid > 1.8) { const nx = Math.cos(ang + Math.PI / 2) * wid / 2, ny = Math.sin(ang + Math.PI / 2) * wid / 2; trunk += `M${f1(x + nx)},${f1(y + ny)} Q${f1(mx + nx)},${f1(my + ny)} ${f1(ex + nx * 0.62)},${f1(ey + ny * 0.62)} M${f1(x - nx)},${f1(y - ny)} Q${f1(mx - nx)},${f1(my - ny)} ${f1(ex - nx * 0.62)},${f1(ey - ny * 0.62)} `; if (rnd() < 0.45) trunk += `M${f1(mx + nx * 0.3)},${f1(my)} q${f1(R(-2, 2))},-3 0,-6 `; } else trunk += `M${f1(x)},${f1(y)} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)} `; if (depth <= 0 || len < 9) { leaves += foliage(ex, ey, type, 1); return; } const n = depth >= 3 ? 2 : (rnd() < 0.55 ? 2 : 3); for (let i = 0; i < n; i++) { const da = (i - (n - 1) / 2) * R(0.38, 0.62) + R(-0.14, 0.14); seg(ex, ey, ang + da, len * R(0.6, 0.78), wid * 0.6, depth - 1); } if (depth <= 2 && rnd() < 0.5) leaves += foliage((x + ex) / 2, (y + ey) / 2, type, 0.6); }; const wid = h * R(0.02, 0.028) + 3; seg(x, y, -Math.PI / 2 + lean, h * R(0.36, 0.44), wid, 4); trunk += `M${f1(x - wid)},${f1(y + 1)} q-6,2 -11,7 M${f1(x + wid)},${f1(y + 1)} q6,2 11,7 `; st.trees++; return { trunk, leaves }; };
    const types = ['dot', 'ge', 'circle', 'pine', 'dot', 'ge'];
    const nT = RI(3, 5), tx0 = 60, tx1 = rk.x1 - 70;
    for (let i = 0; i < nT; i++) { const x = tx0 + (tx1 - tx0) * (i + R(0.1, 0.9)) / nT, y = rTopAt(x) + 2, h = R(0.6, 0.76) * GH; const lean = i === nT - 1 ? R(0.3, 0.5) : R(-0.18, 0.18); const tr = tree(x, y, h, types[RI(0, types.length - 1)], lean); add(grove, tr.trunk, INK, 1.05, 1, 2 + i); add(grove, tr.leaves, INK, 0.9, 0.9, 3 + i); }
    let fig = ''; for (let i = 0; i < RI(1, 2); i++) { const x = R(tx0, rk.x1 - 20), y = rTopAt(x) - 1, s2 = 1.5; fig += `M${f1(x)},${f1(y - 13 * s2)} a2.2,2.2 0 1,0 0.1,0 M${f1(x)},${f1(y - 11 * s2)} l${f1(-3.5 * s2)},${f1(11 * s2)} h${f1(7 * s2)} Z M${f1(x + 2 * s2)},${f1(y - 9 * s2)} l${f1(6 * s2)},${f1(-4 * s2)} `; } add(grove, fig, INK, 0.9, 1, 6);
    // SHORE 1440 x 260
    const shore = []; let reeds = '';
    for (let i = 0; i < RI(22, 34); i++) { const x = R(0.62, 0.99) * HW, yb = 250 + R(-14, 6), h = R(70, 170), dx = R(-14, 14); reeds += `M${f1(x)},${f1(yb)} q${f1(dx * 0.3)},${f1(-h / 2)} ${f1(dx)},${f1(-h)} `; if (rnd() < 0.5) reeds += `M${f1(x + dx * 0.15)},${f1(yb - h * 0.35)} q${f1(R(6, 10))},${f1(-R(3, 6))} ${f1(R(12, 18))},${f1(R(0, 4))} `; }
    void reeds;   // (the old curved reeds: still generated above so the water lines keep their shapes, but not drawn)
    // the reeds match the hero's: scattered single blades after Qiu Ying — thin, leaning either way, long ones drooping
    // at the tip, now and then a short side blade — with a few ground lines at their feet
    { let rs = (seed * 31 + 17) >>> 0; const rr = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; }; const RR = (lo, hi) => lo + (hi - lo) * rr();
      const x0s = 0.6 * HW, x1s = HW - 10, yb = 246, H0 = 120; let bl = '';
      const nB = 34 + Math.floor(rr() * 10);
      for (let k = 0; k < nB; k++) {
        const x0 = RR(x0s, x1s), cy = yb + RR(-10, 8), dir = rr() < 0.5 ? -1 : 1;
        const long = rr() < 0.3, h = (long ? RR(0.75, 1.15) : RR(0.3, 0.7)) * H0;
        const lean = dir * h * (long ? RR(0.12, 0.3) : RR(0.05, 0.28));
        const tipX = x0 + lean, tipY = cy - h * (long ? RR(0.8, 0.92) : RR(0.9, 1));
        bl += `M${f1(x0)},${f1(cy)} C${f1(x0 + lean * 0.05)},${f1(cy - h * 0.5)} ${f1(x0 + lean * 0.55)},${f1(cy - h * 0.95)} ${f1(tipX)},${f1(tipY)} `;
        if (long && rr() < 0.7) bl += `M${f1(tipX)},${f1(tipY)} q${f1(dir * RR(3, 6))},${f1(RR(0, 2))} ${f1(dir * RR(5, 9))},${f1(RR(4, 9))} `;   // drooping tip
        if (rr() < 0.25) { const b = RR(0.25, 0.5); bl += `M${f1(x0 + lean * b * b)},${f1(cy - h * b)} q${f1(-dir * RR(4, 8))},${f1(-RR(6, 12))} ${f1(-dir * RR(8, 14))},${f1(-RR(8, 16))} `; } // a short side blade
      }
      for (let i = 0; i < 3; i++) bl += `M${f1(x0s - RR(10, 40))},${f1(yb + 6 + i * 4)} h${f1(RR(40, 90))} `;   // ground lines
      add(shore, bl, INK, 0.7, 0.8, 2);
    }
    water(shore, HW, 150, 255, RI(6, 9), 1);
    return { hero, river, grove, shore, stats: `${st.trees} trees · ${st.marks} leaf marks · ${st.moss} moss dots` };
  }
};
