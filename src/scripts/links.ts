// Text links: wrap each letter in a span so it can float on hover (see styles/links.css).
// Only plain text links — the cards, the index rows, the logo and the painting's own links are left alone.
const SEL = [
  '.nav nav a', '.roles .open', '.awards a', '.ferry-links a', '.facts a',
  '.d-rail nav a', '.d-name', '.d-meta a', '.d-visit', 'a.d-list-name', '.d-press a', '.d-foot a', '.foot a',
].join(', ');

function wrap(a: HTMLAnchorElement): void {
  if (a.dataset.lk || a.querySelector('*:not(br):not(wbr)')) return;   // done already, or has markup inside
  const text = a.textContent ?? '';
  if (!text.trim()) return;
  const cs = getComputedStyle(a);
  // links that used to rest with an underline now rest with a faint, still wave (styles/links.css)
  if (cs.textDecorationLine.includes('underline')) a.classList.add('lk-u');
  a.style.textDecoration = 'none';
  // one unit per word (and per space between words), so a long link can still wrap; letters keep one running index
  const label = text.trim();
  a.textContent = '';
  let i = 0;
  label.split(/(\s+)/).flatMap((w) => (/^\s+$/.test(w) ? [w] : w.split(/(?<=[.-])/))).filter(Boolean).forEach((part) => {   // long urls may break after a dot or a hyphen, like the <wbr>s did
    const unit = document.createElement('span');
    unit.className = /^\s+$/.test(part) ? 'lk-in lk-sp' : 'lk-in';
    unit.setAttribute('aria-hidden', 'true');
    [...part].forEach((c) => {
      const s = document.createElement('span');
      s.className = c === '↗' ? 'ch lk-arr' : 'ch';
      s.style.setProperty('--i', String(i++));
      s.textContent = c;
      unit.appendChild(s);
    });
    a.appendChild(unit);
  });
  if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', label);
  a.classList.add('lk-w');
  a.dataset.lk = '1';
}

// keep the wave continuous from one word to the next: each unit starts the wave (one swell per em) where the last stopped
const phase = (): void => document.querySelectorAll<HTMLElement>('.lk-w').forEach((a) => {
  const x0 = a.getBoundingClientRect().left, em = parseFloat(getComputedStyle(a).fontSize) || 16;
  const us = [...a.querySelectorAll<HTMLElement>('.lk-in')];
  us.forEach((u, k) => {
    const r = u.getBoundingClientRect();
    u.style.setProperty('--lk-x', `${-((r.left - x0) % em)}px`);
    // a space that ends a line (the link wraps there) draws no line under it
    const nx = us[k + 1];
    u.classList.toggle('lk-eol', u.classList.contains('lk-sp') && (!nx || nx.getBoundingClientRect().top > r.top + 2));
  });
});
const run = (): void => { document.querySelectorAll<HTMLAnchorElement>(SEL).forEach(wrap); phase(); };
addEventListener('resize', phase);
document.fonts?.ready.then(phase);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
