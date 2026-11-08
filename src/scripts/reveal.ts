// Scroll reveal, everywhere on the site: each block fades up a little the first time it comes into view, and blocks
// arriving together come in one after another. Only with JS and without reduced motion. The home page's painting, a
// work's title and top picture are left alone (they travel between pages in the page transition).
const SEL = [
  // home: the section heads and words, every work (index row or card), awards, About and the résumé lines
  '.works-head', '.works .about', '.works .cv', '.awards li', '.ix', '.card',
  '.ferry-main > p', '.ferry-big', '.bio > p', '.facts-row', '.shore',
  // a work's page: the words and facts, every picture and film, the chapter heads, the shows and press, the way on
  '.d-lede > *', '.d-meta', '.d-intro-figure', '.d-row > figure', '.d-chapter', '.d-chapter-note', '.d-gallery-note',
  '.d-film .d-yt', '.d-press-row', '.d-pager .d-next',
].join(', ');

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    let k = 0;   // items arriving together come in one after another
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.style.transitionDelay = `${Math.min(k++, 8) * 70}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
      // once it has arrived, drop the reveal classes so the normal hover styles (dimming, etc.) take over again
      setTimeout(() => { el.style.transitionDelay = ''; el.classList.remove('reveal', 'is-in'); }, 1600);
    });
  }, { rootMargin: '0px', threshold: 0.08 });   // no inset: things at the very bottom of the page still get revealed
  document.querySelectorAll<HTMLElement>(SEL).forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

export {};   // (a module: its names stay its own)
