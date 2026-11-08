// All works on the homepage. Order = reading order in each column (colours interleaved on purpose).
// Media live in public/work/<project>/ (art: public/art/<project>/): cover.* is the homepage image, 01, 02… are the detail-page images (see gallery.ts).
// Original, unoptimised materials are in _source/ (not deployed, not in git).

export const MEDIA_DIR = '/work';
export const ART_MEDIA_DIR = '/art';

export interface ImageMedia { kind: 'image'; src: string; w: number; h: number }
/** A looping, silent video standing in for a GIF (much lighter). */
export interface VideoMedia { kind: 'video'; video: string; poster: string; w: number; h: number }
export type Media = ImageMedia | VideoMedia;

export interface Work {
  /** shown before the title, e.g. 'W.01' */
  n: string;
  title: string;
  cat: string;
  /** its detail page (/work/<slug>) */
  href: string;
  /** the live site or an outside page about it (shown on the detail page as VISIT) */
  live?: string;
  media: Media;
  /** shrink or grow this one image (1 = normal), e.g. 0.7 for a tall picture */
  size?: number;
}

export interface Body {
  /** the short about, may contain <em> */
  intro: string;
  /** small typewriter list beside the about (optional) */
  cv?: string;
  /** awards, listed under the CV; href links to the award page (optional) */
  awards?: { award: string; work: string; year: number; href?: string }[];
  left: Work[];
  right: Work[];
}

const img = (slug: string, w: number, h: number, dir = MEDIA_DIR): ImageMedia => ({ kind: 'image', src: `${dir}/${slug}/cover.webp`, w, h });
const artImg = (slug: string, w: number, h: number): ImageMedia => img(slug, w, h, ART_MEDIA_DIR);
const vid = (slug: string, w: number, h: number): VideoMedia => ({ kind: 'video', video: `${MEDIA_DIR}/${slug}/cover.mp4`, poster: `${MEDIA_DIR}/${slug}/cover.jpg`, w, h });

/** a still for places that can't play video (the Index hover) */
export const still = (m: Media): string => (m.kind === 'video' ? m.poster : m.src);

export const WEB: Body = {
  intro: 'I code <em>award-winning</em> websites for Squarespace, Björk, Zendaya, Rick Rubin and others — in React, TypeScript, WebGL etc.',
  cv: 'Creative Developer ........ Squarespace\nDesign Resident ........... WIX\nInteraction Designer ...... IDEO',
  // add each award's page as href to link it
  awards: [
    // each linked to its award page (checked Nov 2026)
    { award: 'Webby People’s Voice Winner', work: 'Squarespace Collection: Jeff Koons', year: 2025, href: 'https://winners.webbyawards.com/2025/advertising-media-pr/pr-campaigns/best-b2b-campaign/327927/squarespace-collection-jeff-koons' },
    { award: 'Webby Honoree', work: 'jeffkoons.com', year: 2025, href: 'https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/architecture-art-design/327922/jeffkoonscom' },   // Siman worked on the site (not named on the page)
    { award: 'Webby People’s Voice Winner', work: 'Backstage with Adam Driver', year: 2024, href: 'https://winners.webbyawards.com/2024/video-film/branded-entertainment/viral-experimental-weird-branded/276817/backstage-with-adam-driver' },
    { award: 'Webby Honoree', work: 'The Singularity Website', year: 2024, href: 'https://winners.webbyawards.com/2024/websites-and-mobile-sites/features-design/best-user-interface/276818/the-singularity-website' },
    { award: 'One Show Gold Pencil', work: 'The Singularity', year: 2023, href: 'https://www.oneclub.org/awards/theoneshow/-award/48614/the-singularity' },
    { award: 'One Show Silver Pencil', work: 'The Singularity', year: 2023, href: 'https://www.oneclub.org/awards/theoneshow/-award/48319/the-singularity/' },
    { award: 'ADC Gold Cube', work: 'Squarespace Icons: Björk', year: 2023, href: 'https://www.oneclub.org/awards/adcawards/-award/47096/squarespace-icons-bjrk' },
    { award: 'ADC Silver Cube', work: 'The Singularity, website', year: 2023, href: 'https://www.oneclub.org/awards/adcawards/-award/47287/the-singularity/' },
    { award: 'ADC Silver Cube', work: 'The Singularity, film', year: 2023, href: 'https://www.oneclub.org/awards/adcawards/-award/46860/the-singularity' },
    { award: 'ADC Bronze Cube', work: 'The Singularity BTS', year: 2023, href: 'https://www.oneclub.org/awards/adcawards/-award/46906/the-singularity-bts/' },
    { award: 'One Show Merit', work: 'The Singularity BTS', year: 2023, href: 'https://www.oneclub.org/awards/theoneshow/-award/48856/the-singularity-bts' },
    { award: 'Webby Awards Nominee', work: 'fossora | Björk', year: 2023, href: 'https://winners.webbyawards.com/2023/websites-and-mobile-sites/features-design/best-visual-design-aesthetic/239169/fossora--bjrk' },
    { award: 'CSS Design Awards — Special Kudos, UI, UX, Innovation', work: 'Squarespace: Browser History', year: 2022, href: 'https://www.cssdesignawards.com/sites/squarespace-browser-history-2022/40487/' },
    { award: 'Awwwards Honorable Mention', work: 'Squarespace: Browser History', year: 2022, href: 'https://www.awwwards.com/sites/squarespace-browser-history-1' },
  ],
  // order (Index, and Images reading left/right): Squarespace Collection · Squarespace Browser History · Björk × Squarespace · Rick Rubin: Tetragrammaton · Zendaya.com · Emma Stone: Unavailable · Mory Sacko: Mosuke · Coming Out to a New World · So Fun Garden
  left: [
    { n: 'W.01', title: 'Squarespace Collection', cat: 'Web development', href: '/work/squarespace-collection', media: vid('squarespace-collection', 1600, 1090) },
    { n: 'W.03', title: 'Björk × Squarespace', cat: 'Web development', href: '/work/squarespace-collection-bjork', media: { kind: 'image', src: `${MEDIA_DIR}/squarespace-collection-bjork/cover.jpg`, w: 1896, h: 1068 } },   // the link is the team's case study (credits: Creative Developer — Siman Li)
    { n: 'W.05', title: 'Zendaya.com', cat: 'Web development', href: '/work/zendaya', media: vid('zendaya', 1600, 1088) },
    { n: 'W.07', title: 'Mory Sacko: Mosuke', cat: 'Web development', href: '/work/mosuke', live: 'https://www.mosuke-restaurant.com/', media: vid('mosuke', 480, 328) },
    { n: 'W.09', title: 'So Fun Garden', cat: 'Web design, Web development', href: '/work/so-fun-garden', media: vid('so-fun-garden', 600, 336) },
  ],
  right: [
    { n: 'W.02', title: 'Squarespace Browser History', cat: 'Web development', href: '/work/browser-history', live: 'https://browserhistory.squarespace.com/', media: { kind: 'video', video: `${MEDIA_DIR}/browser-history/2022/cover.mp4`, poster: `${MEDIA_DIR}/browser-history/2022/cover.jpg`, w: 1200, h: 840 } },
    { n: 'W.04', title: 'Rick Rubin: Tetragrammaton', cat: 'Web development', href: '/work/tetragrammaton', media: { kind: 'image', src: `${MEDIA_DIR}/tetragrammaton/cover.jpg`, w: 1782, h: 1228 } },
    { n: 'W.06', title: 'Emma Stone: Unavailable', cat: 'Web development', href: '/work/emma-stone-unavailable', media: vid('emma-stone-unavailable', 1600, 1122) },   // Squarespace's Super Bowl LX campaign (2026)
    { n: 'W.08', title: 'Coming Out to a New World', cat: 'Web development', href: '/work/coming-out-to-a-new-world', media: vid('coming-out-to-a-new-world', 1600, 1088) },
  ],
};

export const ART: Body = {
  intro: 'I make <em>media art</em> between the ancient and the future — meaningful interactions drawn from my heritage, everyday fantasies and contemplation.',
  // (Fortune on Hand's Maker Faire Editor’s Choice shows on its own page, under Recognition — not here)
  // order (Index, and Images reading left/right): Windloom · Fortune on Hand · The Crossings · Sea and Mulberry Field · Quick Hand Gallery · Drifter
  left: [
    { n: 'A.01', title: 'Windloom', cat: 'Installation, NIME, Creative Coding', href: '/work/windloom', media: artImg('windloom', 500, 647), size: 0.7 },   // tall: drawn 30% smaller
    { n: 'A.03', title: 'The Crossings', cat: 'Projection mapping, Installation', href: '/work/the-crossings', media: artImg('the-crossings', 1600, 730) },
    { n: 'A.06', title: 'Drifter', cat: '3D animation film', href: '/work/drifter', media: artImg('drifter', 1600, 900) },
  ],
  right: [
    { n: 'A.02', title: 'Fortune on Hand', cat: 'Installation, Creative Coding', href: '/work/fortune-on-hand', media: artImg('fortune-on-hand', 1600, 900) },
    { n: 'A.04', title: 'Sea and Mulberry Field', cat: 'Installation', href: '/work/sea-and-mulberry-field', media: artImg('sea-and-mulberry-field', 1600, 900) },
    // hidden for now — uncomment to bring it back:
    // { n: 'A.07', title: 'Mother River', cat: 'Installation, in progress', href: '#', media: artImg('mother-river', 1600, 1000) },
    { n: 'A.05', title: 'Quick Hand Gallery', cat: '3D, VR', href: '/work/quick-hand-gallery', media: artImg('quick-hand-gallery', 1600, 856) },
  ],
};

/** image widths (%) cycle like siman.li's staggered columns */
export const LEFT_W = [86, 74, 58, 70] as const;
export const RIGHT_W = [64, 92, 80, 72] as const;
