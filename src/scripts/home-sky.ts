// Home: the page opens on New York's sky and closes on Shijiazhuang's (石家庄), the other shore.
// Across the top of the About section: the real sun or moon (with its phase) and the real stars as
// they stand over Shijiazhuang right now, drawn like the painting at the top (facing south: east on the left, west on
// the right, altitude upward). Beside it, a line with the local time and weather there.
import { Painting } from './painting';
import { starPositions } from './stars';
import { moonLines } from './moon';
import { SITE } from '../data/site';

const H = SITE.home;
const NS = 'http://www.w3.org/2000/svg';
const deg = 180 / Math.PI;
// the sky spans the top of the section down to the contact links, in real pixels (W×Hs, set by fit()): the horizon at
// its foot, the zenith near the top; east on the left, west on the right
let W = 1440, Hs = 900, moonTop = 200, bodyFloor = 400, labelMid = 120, title = { l: 0, r: 0, t: 0, b: 0 };   // moonTop: the moon never rises above this (just under the III. About label); bodyFloor: the sun and moon never sink below this (above the words); labelMid: the label's line
const ALT_TOP = 70;
const place = (alt: number, az: number): [number, number] => {
  const top = 40, horizon = Hs - 20;
  return [W / 2 + (az / (Math.PI / 2)) * W * 0.44, horizon - (alt * deg / ALT_TOP) * (horizon - top)];
};
const f1 = (n: number): string => n.toFixed(1);

const moonName = (ph: number): string => (ph < 0.03 || ph > 0.97 ? 'new moon' : ph < 0.22 ? 'waxing crescent' : ph < 0.28 ? 'first quarter' : ph < 0.47 ? 'waxing gibbous'
  : ph < 0.53 ? 'full moon' : ph < 0.72 ? 'waning gibbous' : ph < 0.78 ? 'last quarter' : 'waning crescent');
/** WMO weather code → a few words */
const wxName = (c: number): string => (c === 0 ? 'clear' : c <= 2 ? 'partly cloudy' : c === 3 ? 'overcast' : c <= 48 ? 'fog' : c <= 57 ? 'drizzle'
  : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow showers' : 'thunderstorm');

/** the moon as the painting at the top draws it: in line only, its shape the phase (moon.ts) */
function moonDisc(ph: number, cx: number, cy: number, up: boolean): string {
  return `<g transform="translate(${f1(cx)},${f1(cy)})" opacity="${up ? 1 : 0.45}">${moonLines(ph, 22, 1.3)}</g>`;
}

let code: number | null = null, tempC: number | null = null;
// preview (like the hero's ?wx): ?homewx=clear|cloudy|rain|snow|fog forces the weather, ?homeh=5 moves the clock 5 hours on
const params = new URLSearchParams(location.search);
const PREVIEW: Record<string, number> = { clear: 0, cloudy: 3, rain: 61, snow: 73, fog: 45 };
const shift = Number(params.get('homeh') ?? 0) * 3_600_000 || 0;
const clock = (): number => Date.now() + shift;

function draw(g: SVGGElement, label: HTMLElement | null): void {
  const now = clock(), A = Painting.astro(now, H.lat, H.lng);
  const sunAlt = A.sun.alt * deg, night = Math.max(0, Math.min(1, (-sunAlt - 4) / 8));   // 0 by day … 1 once it is properly dark
  let html = '';
  // the stars as they stand over Shijiazhuang, sized by brightness
  if (night > 0) {   // whatever the weather: the stars are always shown (it is the painting of home, not a forecast)
    let dots = '';
    starPositions(now, H.lat, H.lng).forEach((p, name) => {
      if (p.alt <= 0.03) return;
      const [x, y] = place(p.alt, p.az);
      if (x < -10 || x > W + 10 || y < 6) return;
      const w = Math.max(1.6, Math.min(4.2, 3 - p.mag * 0.8)), o = Math.max(0.45, Math.min(1, 1 - p.mag * 0.14));
      // about half the stars now and then dim very slowly and come back (.twinkle in works.css); each its own long
      // rhythm, fixed per star and running on the clock, so the minutely redraw never restarts it
      const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const tw = h % 2 === 0, dur = 9 + (h % 97) / 97 * 10, dl = -((now / 1000 + (h % 53)) % dur);
      dots += `<path d="M${f1(x)},${f1(y)}h0.01" stroke-width="${w.toFixed(2)}"${tw ? ` class="twinkle" style="--o:${o.toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:${dl.toFixed(1)}s"` : ''} opacity="${o.toFixed(2)}"></path>`;
    });
    html += `<g class="home-stars" opacity="${(night * 0.85).toFixed(2)}">${dots}</g>`;
  }
  // the sun by day, the moon (in its phase) by night, whichever is up
  const body = sunAlt > -2 ? 'sun' : 'moon', pos = body === 'sun' ? A.sun : A.moon;
  // by night the moon is always there: where it really is, or, while it is below the horizon, resting up to the right, just
  // under the III. About label, a little faint (as the painting at the top does)
  if (pos.alt > 0 || body === 'moon') {
    const up = pos.alt > 0, [x0] = up ? place(pos.alt, pos.az) : [title.r + 110];
    let cx = Math.max(W * 0.14, Math.min(W * 0.86, x0));
    // the sun and the moon keep to the sky above the words: their height (the real altitude) is drawn between just under
    // the label and just above the photo and the text, so they never sit on a line of the paragraphs
    const band = Math.max(0, bodyFloor - moonTop);
    let y = up ? bodyFloor - Math.min(1, pos.alt * deg / ALT_TOP) * band : moonTop;
    // never over the title: step aside to whichever side of it is nearer; where it fills the width (a phone), up to the
    // right of the label instead
    if (y + 30 > title.t && y - 30 < title.b && cx + 30 > title.l && cx - 30 < title.r) {
      const right = title.r + 70 <= W - 30, left = title.l - 70 >= 30;
      if (right || left) cx = (cx > (title.l + title.r) / 2 && right) || !left ? title.r + 70 : title.l - 70;
      else { cx = W - 40; y = labelMid; }
    }
    if (body === 'sun') {
      html += `<g transform="translate(${f1(cx)},${f1(y)})" opacity="0.9"><circle r="11" stroke-width="1"></circle><circle class="home-sun-halo" r="19" stroke-width="0.5" opacity="0.5"></circle></g>`;
    } else {
      html += moonDisc(A.phase, cx, y, up);
    }
  }
  g.innerHTML = html;

  // the line of text, if the page has one: home, the time there, its weather, the moon
  if (!label) return;
  // the line under the shore: home, the time there, its weather, the moon
  const time = new Intl.DateTimeFormat('en-US', { timeZone: H.tz, hour: 'numeric', minute: '2-digit' }).format(now).toLowerCase();
  const bits = [`${time}`];
  if (code !== null && tempC !== null) bits.push(`${wxName(code)}, ${Math.round(tempC)}°C`);
  if (body === 'moon') bits.push(moonName(A.phase));
  label.innerHTML = `<span class="home-name">Home — ${H.name} <span lang="zh">${H.zh}</span></span> · ${bits.join(' · ')}`;
}

async function pull(): Promise<void> {
  const wx = params.get('homewx');
  if (wx && wx in PREVIEW) { code = PREVIEW[wx]; tempC = Number(params.get('hometemp') ?? 8); return; }
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${H.lat}&longitude=${H.lng}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(H.tz)}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { current?: { temperature_2m: number; weather_code: number } };
    if (j.current) { code = j.current.weather_code; tempC = j.current.temperature_2m; }
  } catch { /* no weather: the sky and the time still show */ }
}

export function startHomeSky(): void {
  const room = document.querySelector<HTMLElement>('.about-room'), label = document.querySelector<HTMLElement>('.home-line');
  if (!room) return;   // the line of text (time, weather) is optional
  // a band of sky across the top of the section, behind the text
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'home-sky-band'); svg.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(NS, 'g') as SVGGElement;
  g.setAttribute('class', 'home-sky');
  svg.appendChild(g); room.insertBefore(svg, room.firstChild);
  // the sky reaches from the top of the section down to the contact links (email · résumé · linkedin)
  const links = room.querySelector<HTMLElement>('.ferry-links');
  const fit = (): void => {
    const top = room.getBoundingClientRect().top;
    W = room.clientWidth; Hs = Math.max(320, Math.round((links ? links.getBoundingClientRect().bottom - top : 900) + 24));
    const tag = room.querySelector<HTMLElement>('.ferry-main > .caps');
    if (tag) { const tr = tag.getBoundingClientRect(); moonTop = Math.round(tr.bottom - top + 50); labelMid = Math.round((tr.top + tr.bottom) / 2 - top); }
    const words = room.querySelector<HTMLElement>('.ferry .about-row');   // the photo and the paragraphs
    bodyFloor = words ? Math.max(moonTop, Math.round(words.getBoundingClientRect().top - top - 34)) : Hs - 20;
    // the title's ink (its box is wider than the words): measured with a range over its contents, the waving figure included
    const tEl = room.querySelector<HTMLElement>('.ferry-big'), left = room.getBoundingClientRect().left;
    if (tEl) { const rg = document.createRange(); rg.selectNodeContents(tEl); const tb = rg.getBoundingClientRect(); title = { l: tb.left - left, r: tb.right - left, t: tb.top - top, b: tb.bottom - top }; }
    svg.setAttribute('viewBox', `0 0 ${W} ${Hs}`); svg.style.height = `${Hs}px`;
  };
  const run = (): void => { fit(); draw(g, label); };
  run();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(run, 150); });
  if (links) new ResizeObserver(() => { clearTimeout(rt); rt = window.setTimeout(run, 150); }).observe(room);
  void pull().then(run);
  setInterval(run, 60_000);
  setInterval(() => void pull().then(run), SITE.weatherEveryMin * 60_000);
}
