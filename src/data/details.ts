// Detail pages for the works (/work/<slug>). Each is optional: a work without one links straight out.
// Media for a page live in public/work/<slug>/ next to the cover: highlight clips and gallery images named below.
// Text marked DRAFT is a first draft from what is known about the project — rewrite it in your own words.

export interface DetailMedia { src: string; poster?: string; w: number; h: number; kind: 'video' | 'image'; alt?: string }
/** a picture in a gallery row */
export type GalleryItem = DetailMedia & { /** show it cropped (from the centre) to this shape, e.g. '2 / 1' */ ratio?: string; /** where a cropped one is anchored, as CSS object-position (e.g. '50% 100%': keep the bottom) */ pos?: string; /** draw it smaller inside its columns, centred (0.6 = 60% as wide) */ scale?: number; /** a CSS filter for its look, e.g. 'contrast(1.2) saturate(1.3)' */ filter?: string; /** wider than the page's measure: out to the site's side margins (on a narrowed page) */ bleed?: boolean; caption?: string; fill?: boolean; /** a background behind a transparent picture (e.g. a logo) */ bg?: string; /** a little one (a small animation): two columns wide, in a black square */ small?: boolean; /** where a small (or narrower) one starts, on the 12 columns */ at?: number; /** a picture made of three side by side (a triptych): shown as three, with the grid's gutter between them */ split?: 3; /** a narrower picture: how many of the 12 columns it takes */ span?: number };
/** a film (YouTube or Vimeo): a still and a play button until clicked */
export interface Film { heading: string; note?: string; /** a YouTube id, or… */ youtube?: string; /** …a Vimeo id */ vimeo?: string; title: string; /** the still before it plays (YouTube has its own) */ poster?: string }
export interface Detail {
  slug: string;
  /** must match the work's number and title on the homepage */
  n: string; title: string; cat: string;
  /** the part of the title set in italic on the page, e.g. 'Collection' */
  titleItalic?: string;
  /** the introduction: a paragraph or two — what it is, then what you did */
  lede: string | (string | { heading: string; text: string })[];
  meta: { role: string; /** the people you made it with, each a row: e.g. Design, PM */ credits?: { role: string; name: string; href?: string }[]; client?: string; year: string; stack?: string; team?: string; recognition?: { label: string; href?: string }[]; press?: { label: string; title?: string; href?: string }[]; /** where it was shown, newest first, at the foot of the page */ exhibitions?: { label: string; href?: string }[]; /** more to watch, linked out from the facts (e.g. a talk about the work, a making-of) */ watch?: { label: string; href: string }[]; live?: { label: string; href: string } };
  /** the main screen recording, shown in a browser frame */
  hero: DetailMedia & { url: string; /** a small label over it, e.g. a year */ label?: string; /** false: a plain picture, not in a browser window */ frame?: boolean; /** true: after the pictures, not first */ last?: boolean; /** true: not shown on the page (e.g. used as the film's still instead) */ hidden?: boolean };
  /** a few paragraphs: the context, and what you did */
  story: { heading: string; body: string[] }[];
  /** a list of parts, set like the résumé: name (ink), detail (grey), year (right), optional link */
  list?: { heading: string; rows: { name: string; detail: string; year?: string; href?: string }[] };
  /** short clips, each with a line: the interactions, transitions, details worth a closer look */
  highlights: { media?: DetailMedia; caption: string }[];
  /** a film (YouTube) after the main recording: a still and a play button until clicked */
  film?: Film;
  /** a making-of film, before the main one and a little smaller */
  making?: Film;
  /** a gallery after the main recording: rows of one (full width) or two (side by side) pictures, each with an optional caption */
  gallery?: { heading: string; note?: string; /** how many of the rows come before the film (right under the recording) */ lead?: number; /** screens shown one at a time, in a slideshow, before the rows */ slides?: DetailMedia[]; /** in a pair, `fill` marks the picture cropped to the other one's height (by default the second) */ rows: GalleryItem[][]; /** chapters: a small heading, with room above it, before the row at that position in `rows` (from 0) */ chapters?: { row: number; title: string; /** a line under the heading */ note?: string }[]; /** rows shown after the film, the same kind as `rows` */ after?: GalleryItem[][]; /** the pictures (and film) on a slightly narrower measure */ narrow?: boolean; /** a heading over the rows after the film */ afterTitle?: string; /** a line under that heading */ afterNote?: string };
  /** desktop and phone, side by side */
  screens?: { desktop?: DetailMedia; mobile?: DetailMedia };
  /** an artwork's page (Art, A.01…): set on pure black */
  art?: boolean;
  /** pictures shot on black: the page on a narrower measure, and the top picture drawn smaller, centred */
  onBlack?: boolean;
  /** a small picture beside the introduction, on its left (e.g. the painting a work comes from) */
  introFigure?: DetailMedia & { caption?: string };
  /** in memory of someone: a portrait in an oval and a few lines under it, at the end of the page (before the press) */
  memorial?: DetailMedia & { lines: string[]; /** a few words about her, under the dates: one string per paragraph */ note?: string[] };
  next?: { title: string; href: string };
  prev?: { title: string; href: string };
}

import { WEB, ART, type Work } from './projects';

const W = '/work';

export const DETAILS: Detail[] = [
  {
    slug: 'squarespace-collection',
    n: 'W.01', title: 'Squarespace Collection', cat: 'Web development', titleItalic: 'Collection',
    // Project info: after the Collection site's own words ("The world’s most creative minds partnering with the world’s most
    // innovative website platform. Explore inspired signature designs…")
    lede: [
      { heading: 'Project info', text: 'The world’s most creative minds, partnering with the world’s most innovative website platform. Each edition becomes a signature design anyone can start their own site from. In 2026, every edition came together in one new home.' },
      { heading: 'What I did', text: 'As the sole developer, I built the site from scratch in TypeScript, bringing the design team’s layouts and motion to life across screen sizes. I created reusable components with accessibility in mind, integrated TrustArc for privacy, and shipped the site in six languages with Smartling.' },
    ],
    meta: {
      role: 'Creative Developer',
      credits: [
        { role: 'Creative Director', name: 'Serene Wong' },
        { role: 'Senior Designer', name: 'Zoonzin Lee', href: 'https://www.linkedin.com/in/zoonzin/' },
        { role: 'Senior Motion Designer', name: 'Marlon Morina' },
        { role: 'Creative Producer', name: 'Dianne Kim', href: 'https://www.linkedin.com/in/kimdianne/' },
      ],
      year: '2026',
      team: 'Squarespace Brand team',
      // coverage of the Collection and its editions (newest first)
      press: [
        { label: 'Fast Company', title: 'Jeff Koons’ entire catalog is on a website for the first time', href: 'https://www.fastcompany.com/91204997/jeff-koons-squarespace-template-artwork' },
        { label: 'Adweek', title: 'Squarespace’s latest artistic collab is with Jeff Koons', href: 'https://www.adweek.com/creativity/squarespaces-latest-artistic-collab-is-with-jeff-koons/' },
        { label: 'Artnet', title: 'Jeff Koons and Squarespace', href: 'https://news.artnet.com/art-world/jeff-koons-squarespace-2551663' },
        { label: 'LBB Online', title: 'Squarespace and Jeff Koons make art more accessible', href: 'https://lbbonline.com/news/squarespace-and-jeff-koons-make-art-more-accessible' },
        { label: 'Mumbrella', title: 'Jeff Koons and Squarespace are helping Aussies design breathtaking websites', href: 'https://mumbrella.com.au/jeff-koons-and-squarespace-are-helping-aussies-design-breathtaking-websites-851814' },
        { label: 'LBB Online', title: 'Squarespace launches 3rd Collection edition with legendary music producer Rick Rubin', href: 'https://lbb.lbbonline.com/news/squarespace-launches-3rd-collection-edition-with-legendary-music-producer-rick-rubin' },
        { label: 'B&T', title: 'Squarespace launches Collection with Rick Rubin', href: 'https://www.bandt.com.au/squarespace-launches-collection-with-rick-rubin/' },
        { label: 'Paris Select Book', title: 'Mory Sacko takes gastronomy into a new era with Collection by Squarespace', href: 'https://www.parisselectbook.com/en/?p=197775' },
      ],
      live: { label: 'collection.squarespace.com', href: 'https://collection.squarespace.com/' },
    },
    hero: { kind: 'video', src: `${W}/squarespace-collection/hero.mp4`, poster: `${W}/squarespace-collection/hero.jpg`, w: 2532, h: 1736, url: 'collection.squarespace.com' },   // the full-resolution cover (the homepage keeps the lighter 1600px cover.mp4)
    story: [],
    highlights: [],
    // the Jeff Koons edition (2024): the site, the phones, the posters in the subway
    gallery: {
      heading: '',
      lead: 1,   // the poster in the subway (the 16:9 film cropped to the picture it replaced, 4:5) and the site on a laptop (cropped to the same height), side by side, right under the recording
      rows: [
        [{ kind: 'video', src: `${W}/squarespace-collection/jk-subway-poster.mp4`, w: 1080, h: 1350, ratio: '4 / 5', alt: 'A Jeff Koons poster in the New York subway, a train passing' },
         { kind: 'image', src: `${W}/squarespace-collection/jk-laptop-studio.jpg`, w: 2500, h: 1667, alt: 'jeffkoons.com on a laptop in the studio' }],
        [{ kind: 'video', src: `${W}/squarespace-collection/jk-subway-trio.mp4`, w: 1920, h: 1080, alt: 'Three campaign posters in a subway station' }],
      ],
    },
  },
  {
    slug: 'browser-history',
    n: 'W.02', title: 'Squarespace Browser History', cat: 'Web development', titleItalic: 'Browser History',
    // Project info: after Squarespace's own words for the 2021 edition (the 2020 one had no theme name either)
    lede: [
      { heading: 'Project info', text: 'Browser History is Squarespace’s annual look back at the year online, told through the customers who made it.\n\n2021: We shopped online to stay in, to go out, and to feel normal. This edition was about what those purchases say about us, and the website itself was entirely shoppable.\n\n2022: Dark Mode. Embrace your dark side — the year’s darker moods, from putting a stop to overwork to eating your feelings, each one a customer’s product, in a site that scrolls through it all in black.' },
      { heading: 'What I did', text: 'I developed both editions, matching the design team’s layouts and motion pixel for pixel, on every screen size.' },
    ],
    meta: {
      role: 'Creative Developer',
      year: '2021 – 2022',
      credits: [
        { role: 'Creative', name: 'Clare Anderson' },
        { role: 'Creative', name: 'Gina Kim' },
        { role: 'Creative', name: 'Iwona Usakiewicz' },
        { role: 'Designer', name: 'Ryan Carrel' },
        { role: 'Designer', name: 'Milo Milosevic' },
        { role: 'Producer', name: 'Kim Santella' },
      ],
      // the 2021 edition's awards (given in January 2022); the 2020 portraits campaign and its D&AD / Cannes entries were not Siman's
      recognition: [
        { label: '2021 · Awwwards Honorable Mention', href: 'https://www.awwwards.com/sites/squarespace-browser-history-1' },
        { label: '2021 · CSS Design Awards Special Kudos', href: 'https://www.cssdesignawards.com/sites/squarespace-browser-history-2022/40487/' },
      ],
      live: { label: 'browserhistory.squarespace.com', href: 'https://browserhistory.squarespace.com/' },   // the site is back online on Monday
    },
    hero: { kind: 'video', src: `${W}/browser-history/2022/hero.mp4`, poster: `${W}/browser-history/2022/hero.jpg`, w: 2576, h: 1760,   label: '2022',   // the 2022 edition (Dark Mode), full resolution, 1.3× speed
      url: 'browserhistory.squarespace.com' },   // the homepage cover for now: replace with a sharp recording (hero.mp4) when it is in
    story: [],
    // the site, screen by screen: the title, then each of the four trends (its card and its story), the products, the index, and the shop windows
    highlights: [],
    // 2021: a few screens of the site, one at a time (the opening, the four trends, the index), then the shop windows
    gallery: {
      heading: '2021',
      rows: [
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-43.jpg`, w: 2000, h: 1250, alt: 'The opening screen' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-37.jpg`, w: 2000, h: 1250, alt: 'Big Nesting Energy' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-50.jpg`, w: 2000, h: 1250, alt: 'A Lot on Our Plates' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-51.jpg`, w: 2000, h: 1250, alt: 'Me Time, All the Time' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-55.jpg`, w: 2000, h: 1250, alt: 'Brave New Necessities' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-54.jpg`, w: 2000, h: 1250, alt: 'The index of products' }],
        [{ kind: 'image', src: `${W}/browser-history/2021/bh-62.jpg`, w: 1605, h: 2000 }, { kind: 'image', src: `${W}/browser-history/2021/bh-65.jpg`, w: 1605, h: 2000 }],
      ],
    },
  },
  {
    slug: 'emma-stone-unavailable',
    n: 'W.06', title: 'Emma Stone: Unavailable', cat: 'Web development', titleItalic: 'Unavailable',
    lede: [
      { heading: 'Project info', text: 'Squarespace’s Super Bowl LX campaign, a film by Yorgos Lanthimos: Emma Stone can’t get emmastone.com, because someone else already has it. When she finally did, the site went live with a message from her, and a nudge for everyone else: get your domain before you lose it.' },
      { heading: 'What I did', text: 'I prototyped the animation and design options to help the designers find the best direction, then developed the site, with the domain promotion built in.' },
    ],
    meta: {
      role: 'Creative Developer',
      year: '2026',
      // the Squarespace in-house team, from the credits on shots.net (which list Siman as Creative Developer)
      credits: [
        { role: 'Chief Creative Officer', name: 'David Lee' },
        { role: 'Group Creative Director', name: 'Mathieu Zarbatany' },
        { role: 'Senior Design Director', name: 'Satu Pelkonen' },
        { role: 'Principal Creative Writer', name: 'Pepe Hernandez' },
        { role: 'Art Director', name: 'Alex Thompson' },
        { role: 'Copywriter', name: 'Garrick Sheldon' },
        { role: 'Design Lead', name: 'Albert Chang' },
        { role: 'Senior Designer', name: 'Ryan Carrel' },
        { role: 'Senior Designer', name: 'Ryan Dutch' },
        { role: 'Senior Motion Designer', name: 'Videl Torres' },
        { role: 'Senior Motion Designer', name: 'Marlon Morina' },
        { role: 'Designer', name: 'Jaycee Masucci' },
        { role: 'Head of Production', name: 'Erica Kung' },
        { role: 'Digital Producer', name: 'Dianne Kim', href: 'https://www.linkedin.com/in/kimdianne/' },
      ],
      press: [
        { label: 'Adweek', href: 'https://www.adweek.com/brand-marketing/emma-stone-film-noir-squarespace-super-bowl-60-ad/' },
        { label: 'The Hollywood Reporter', href: 'https://www.hollywoodreporter.com/tv/tv-news/emma-stone-super-bowl-ad-squarespace-yorgos-lanthimos-2026-1236485546/' },
        { label: 'shots', href: 'https://shots.net/news/view/emma-stones-site-for-sore-eyes' },
        { label: 'Muse by Clios', href: 'https://musebyclios.com/super-bowl/dont-cry-emma-stone-youre-in-a-squarespace-super-bowl-ad/' },
        { label: 'Squarespace Newsroom', href: 'https://www.squarespace.com/press-releases/2026/2/4/squarespace-and-emma-stone-confront-the-stakes-of-domain-ownership-in-super-bowl-lx-campaign' },
      ],
      // no link: the site is down (the recording and the film show it as it was)
    },
    hero: { kind: 'video', src: `${W}/emma-stone-unavailable/hero.mp4`, poster: `${W}/emma-stone-unavailable/hero.jpg`, w: 2538, h: 1780, url: 'emmastone.com' },
    story: [],
    highlights: [],
    // the campaign's posters, in motion: one set of three, the full width, split into its three posters
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'video', src: `${W}/emma-stone-unavailable/es-posters-2.mp4`, w: 1920, h: 1080, split: 3, alt: 'Three Unavailable posters in motion: an eye, Emma Stone, laptops on fire' }],
      ],
    },
    // the Super Bowl LX spot, directed by Yorgos Lanthimos — last on the page
    film: { heading: '', youtube: '2cLNMXUNzxY', title: 'Squarespace: Unavailable, with Emma Stone' },
  },
  {
    slug: 'squarespace-collection-bjork',
    n: 'W.03', title: 'Björk × Squarespace', cat: 'Web development', titleItalic: 'Björk',
    // Project info: in the Collection site's own words for this edition
    lede: [
      { heading: 'Project info', text: 'The groundbreaking Icelandic artist partnered with Squarespace to create an immersive website for her album Fossora — its pages grow like the underground networks of fungi, from atopos to ovule to ancestress. Then it became a limited-edition template, Mycelium, so anyone could start their own site from her creative choices.' },
      { heading: 'What I did', text: 'I developed fossora.com, bringing the design team’s layouts and motion to life on every screen size, and built the Collection page that introduced it.' },
    ],
    meta: {
      role: 'Creative Developer',
      year: '2022',
      credits: [
        { role: 'Chief Creative Officer', name: 'David Lee' },
        { role: 'Creative Director', name: 'Mathieu Zarbatany' },
        { role: 'Creative Director', name: 'Satu Pelkonen' },
        { role: 'Executive Producer', name: 'Erica Kung' },
        { role: 'Senior Producer', name: 'Sion Prys' },
        { role: 'Senior Producer', name: 'Rebecca Patrick' },
        { role: 'Senior Art Director', name: 'Gina Kim' },
        { role: 'Senior Copywriter', name: 'Niamh Grunfeld' },
        { role: 'Design Manager', name: 'Albert Chang' },
        { role: 'Senior Designer', name: 'Zoonzin Lee', href: 'https://www.linkedin.com/in/zoonzin/' },
        { role: 'Designer', name: 'Mikki Janower' },
      ],
      // both award pages credit Siman
      recognition: [
        { label: 'ADC Gold Cube, 2023', href: 'https://www.oneclub.org/awards/adcawards/-award/47096/squarespace-icons-bjrk' },
        { label: 'Webby Nominee, 2023', href: 'https://winners.webbyawards.com/2023/websites-and-mobile-sites/features-design/best-visual-design-aesthetic/239169/fossora--bjrk' },
      ],
      // no link: fossora.com has since changed, and the screenshots and the film show the site as it was
    },
    hero: { kind: 'video', src: `${W}/squarespace-collection-bjork/hero.mp4`, poster: `${W}/squarespace-collection-bjork/hero.jpg`, w: 1920, h: 1076, url: 'fossora.com' },   // the whole site, scrolled through (2.2× speed, 9 Mbps)
    story: [],
    highlights: [],
    // the film that launched it (Squarespace Icons 01: Björk), right under the site
    film: { heading: '', youtube: 'vGgikzXgvmk', title: 'Squarespace Icons 01: Björk' },
    // the Collection page, the phones and the template
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/squarespace-collection-bjork/bj-co-home.webp`, w: 2500, h: 1406, alt: 'The Collection page for Björk' }],
        [{ kind: 'image', src: `${W}/squarespace-collection-bjork/bj-co-mobile.webp`, w: 2500, h: 1406, alt: 'On the phone, and the Mycelium template' }],
        [{ kind: 'image', src: `${W}/squarespace-collection-bjork/bj-template.jpg`, w: 1500, h: 844, alt: 'The Mycelium template' }],
        [{ kind: 'image', src: `${W}/squarespace-collection-bjork/bj-co-bjork.webp`, w: 2500, h: 1406, alt: 'Co_Björk' }],
      ],
    },
  },
  {
    slug: 'tetragrammaton',
    n: 'W.04', title: 'Rick Rubin: Tetragrammaton', cat: 'Web development', titleItalic: 'Tetragrammaton',
    // Project info: after the team's case study (albertchangdesign.com/sqspcollection-rickrubin)
    lede: [
      { heading: 'Project info', text: 'A collaboration with the legendary producer, author and creative force Rick Rubin to build Tetragrammaton — an ever-evolving online world of curated materials to read, watch, look at and listen to. Alongside tetragrammaton.com came a refreshed visual identity, a short film about the process, and a new website template.' },
      { heading: 'What I did', text: 'I developed tetragrammaton.com, matching the design pixel for pixel on every screen size, and wrote custom JavaScript and CSS for features like the gallery and the blog, taking them beyond what the platform does out of the box.' },
    ],
    meta: {
      role: 'Creative Developer',
      year: '2024',
      // no link: tetragrammaton.com has since been rebuilt (the version Siman built launched in October 2024)
      credits: [
        { role: 'Chief Creative Officer', name: 'David Lee' },
        { role: 'Creative Director', name: 'Gui Borchert' },
        { role: 'Creative Director', name: 'Ben Hodgin' },
        { role: 'Executive Producer', name: 'Marisa Wasser' },
        { role: 'Senior Producer', name: 'Kim Santella' },
        { role: 'Senior Producer', name: 'Sion Prys' },
        { role: 'Motion Design Manager', name: 'Videl Torres' },
        { role: 'Senior Motion Designer', name: 'Christina Lu' },
        { role: 'Senior Copywriter', name: 'Daniele Cheesman' },
        { role: 'Design Manager', name: 'Albert Chang' },
        { role: 'Designer', name: 'Mikki Janower' },
        { role: 'Designer', name: 'Zoonzin Lee', href: 'https://www.linkedin.com/in/zoonzin/' },
        { role: 'Designer', name: 'Jaycee Masucci' },
        { role: 'Staff Photographer', name: 'Craig Reynolds' },
        { role: 'Photographer', name: 'Spencer Blake' },
        { role: 'Staff Editor', name: 'Ken Rosenberg' },
      ],
    },
    // the site is quiet and still, so a single frame of it in the browser window (the last frame of the recording);
    // its address shown, not linked (tetragrammaton.com has since been rebuilt)
    hero: { kind: 'image', src: `${W}/tetragrammaton/tg-site-home.jpg`, w: 2790, h: 1786, url: 'tetragrammaton.com', alt: 'The tetragrammaton.com home page' },
    story: [],
    highlights: [],
    // Rick Rubin in the studio, the identity (the logo, how it was drawn, on the wall), the site (laptop, desktop, phones), then the posters
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-hero.jpg`, w: 2500, h: 1406, alt: 'Rick Rubin in the studio' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-logo.gif`, w: 1920, h: 1080, alt: 'The tetragrammaton logo' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-logo-progress.jpg`, w: 2500, h: 1406, alt: 'Drawing the t.' }, { kind: 'image', src: `${W}/tetragrammaton/tg-logo-wall.jpg`, w: 1920, h: 1080, alt: 'The logo on the studio wall' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-site-laptop.webp`, w: 1920, h: 1080, alt: 'tetragrammaton.com in the studio' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-site.webp`, w: 1920, h: 1080, alt: 'tetragrammaton.com' }, { kind: 'image', src: `${W}/tetragrammaton/tg-site-mobile.webp`, w: 1920, h: 1080, alt: 'On the phone' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-poster.gif`, w: 2000, h: 1333, alt: 'The poster', fill: true }, { kind: 'image', src: `${W}/tetragrammaton/tg-phone.webp`, w: 1200, h: 1080, alt: 'The t. on a phone' }],
        [{ kind: 'image', src: `${W}/tetragrammaton/tg-poster-outdoor.jpg`, w: 1920, h: 1080, alt: 'The poster, outdoors' }],
      ],
    },
  },
  {
    slug: 'zendaya',
    n: 'W.05', title: 'Zendaya.com', cat: 'Web development', titleItalic: 'Zendaya',
    lede: [
      { heading: 'Project info', text: 'Zendaya’s personal website, made with Squarespace for its 2022 Super Bowl spot — the classic tongue twister of Sally selling seashells by the seashore, starring Zendaya and narrated by André 3000. The site gathers her film and television work, from Euphoria to Dune, her press and her story, set in bold type on a warm, quiet page.' },
      { heading: 'What I did', text: 'I developed zendaya.com, pixel-perfect on every screen, and built its custom interactions, from hover reveals to the press carousel.' },
    ],
    meta: {
      role: 'Creative Developer',
      live: { label: 'zendaya.com', href: 'https://www.zendaya.com/' },   // still the version Siman built
      year: '2022',
      // credits from the designer's case study (angelamilosevic.com/zendaya-squarespace-website)
      credits: [
        { role: 'Creative Director', name: 'Ben Hughes' },
        { role: 'Design Manager', name: 'Satu Pelkonen' },
        { role: 'Producer', name: 'Marisa Wasser' },
        { role: 'Senior Designer', name: 'Angela Milosevic' },
      ],
      // coverage of the 2022 Super Bowl campaign with Zendaya
      press: [
        { label: 'Adweek', href: 'https://www.adweek.com/brand-marketing/zendayas-seashell-sales-skyrocket-in-squarespaces-smoothly-spoken-super-bowl-spot/' },
        { label: 'Billboard', href: 'https://www.billboard.com/culture/tv-film/zendaya-andre-3000-super-bowl-ad-video-1235029168' },
        { label: 'Uproxx', href: 'https://uproxx.com/tv/zendaya-squarespace-super-bowl-ad' },
        { label: 'Squarespace Newsroom', href: 'https://www.squarespace.com/press-releases/2022/2/9/squarespace-teams-up-with-zendaya-for-2022-super-bowl-campaign' },
      ],
    },
    // the whole site, scrolled through (2.2× speed, 9 Mbps)
    hero: { kind: 'video', src: `${W}/zendaya/hero.mp4`, poster: `${W}/zendaya/hero.jpg`, w: 1920, h: 1280, url: 'zendaya.com' },
    story: [],
    highlights: [],
    // the 2022 Super Bowl spot, Sally’s Seashells (directed by Edgar Wright)
    film: { heading: '', youtube: 'AmTtjrQeNqk', title: 'Squarespace: Sally’s Seashells, with Zendaya' },
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/zendaya/zd-mobile-1.png`, w: 534, h: 1155, alt: 'Home, on the phone' }, { kind: 'image', src: `${W}/zendaya/zd-mobile-2.png`, w: 534, h: 1155, alt: 'Press, on the phone' }, { kind: 'image', src: `${W}/zendaya/zd-mobile-3.png`, w: 534, h: 1155, alt: 'About, on the phone' }],
      ],
    },
  },
  {
    slug: 'mosuke',
    n: 'W.07', title: 'Mory Sacko: Mosuke', cat: 'Web development', titleItalic: 'Mosuke',
    lede: [
      { heading: 'Project info', text: 'Squarespace Collection partners with leading cultural figures to create signature website templates. For this edition, Squarespace worked with French chef Mory Sacko on HÉRON, a template inspired by the website of his acclaimed Paris restaurant, Mosuke.' },
      { heading: 'What I did', text: 'I developed mosuke-restaurant.com, the site behind the HÉRON template: I built its animations, matched the design on every screen size, and brought in live local time and weather from Paris, so the page shifts with the day outside the restaurant.' },
    ],
    meta: {
      role: 'Creative Developer',
      year: '2025',
      // the site's designer, then the campaign film and photography (as Further's case study names them)
      credits: [
        { role: 'Designer', name: 'Yangyifan Dong' },
        { role: 'Film Director', name: 'Stephan Wever' },
        { role: 'Film Production', name: 'Iconoclast' },
        { role: 'Film Agency', name: 'Further', href: 'https://www.further.group/work/squarespace-collection-mory-sacko' },
        { role: 'Photographer', name: 'Craig Reynolds' },
      ],
      live: { label: 'mosuke-restaurant.com', href: 'https://www.mosuke-restaurant.com/' },
    },
    // the recording, 2.4× (source in _source/mosuke)
    hero: { kind: 'video', src: `${W}/mosuke/hero.mp4`, poster: `${W}/mosuke/hero.jpg`, w: 1920, h: 1260, url: 'mosuke-restaurant.com' },
    story: [],
    highlights: [],
    // two stills from the campaign film (from Further's case study)
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/mosuke/ms-heron.jpg`, w: 2400, h: 1350, alt: 'A heron, painted' }, { kind: 'image', src: `${W}/mosuke/ms-flight.jpg`, w: 2400, h: 1350, alt: 'A heron over a Paris street' }],
      ],
    },
    // the Squarespace Collection film, shot on 35mm by Stephan Wever — last on the page
    film: { heading: '', youtube: '1Qj8ka5vDcc', title: 'Squarespace Collection: Mory Sacko' },
  },
  {
    slug: 'coming-out-to-a-new-world',
    n: 'W.08', title: 'Coming Out to a New World', cat: 'Web development', titleItalic: 'New World',
    lede: [
      { heading: 'Project info', text: 'Squarespace’s virtual celebration of Pride 2021, exploring self-expression in a changed world through 3D-rendered “future fashion” and AR filters. It featured four LGBTQIA+ Squarespace customers: Lydia Hudgens, Gossamer Rozen, Briana King and Masami Hosono.' },
      { heading: 'What I did', text: 'I developed the microsite: the 3D looks and their motion, a countdown to each new release, the scrolling menu, and a page for every customer, on every screen size.' },
    ],
    meta: {
      role: 'Freelance Developer',
      year: '2021',
      // the credits on Angela Milosevic's case study (angelamilosevic.com/coming-out-new-world)
      credits: [
        { role: 'Creative Director', name: 'Ben Hughes' },
        { role: 'Design Manager', name: 'Satu Pelkonen' },
        { role: 'Design Manager', name: 'Lucia Orlandi' },
        { role: 'Senior Producer', name: 'Katie Flynn' },
        { role: 'Staff Art Director', name: 'Leilanni Todd' },
        { role: 'Senior Designer', name: 'Angela Milosevic', href: 'https://www.angelamilosevic.com/coming-out-new-world' },
        { role: 'Senior Designer', name: 'Pei Liew' },
        { role: 'Copywriter', name: 'Niamh Grunfeld' },
        { role: 'Senior Motion Designer', name: 'Videl Torres' },
        { role: 'Senior Motion Designer', name: 'Christina Lu' },
        { role: 'Senior Video Editor', name: 'Sarah Harvey' },
        { role: '3D Studio', name: 'Future Deluxe' },
      ],
      // no link: the site is still up, but six years on it no longer runs as smoothly as it did; the URL shows in the frame
    },
    hero: { kind: 'video', src: `${W}/coming-out-to-a-new-world/cover.mp4`, poster: `${W}/coming-out-to-a-new-world/cover.jpg`, w: 1600, h: 1088, url: 'pride.squarespace.com', last: true },   // the site playing, after the pictures
    story: [],
    highlights: [],
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/coming-out-to-a-new-world/co-looks.png`, w: 2000, h: 1862, alt: 'The four 3D-rendered looks' }],
        [{ kind: 'image', src: `${W}/coming-out-to-a-new-world/co-mobile.png`, w: 1830, h: 868, alt: 'Four looks on the phone, two of them counting down to release' }],
        [{ kind: 'image', src: `${W}/coming-out-to-a-new-world/co-ar.png`, w: 1805, h: 715, alt: 'The AR filters' }],
      ],
    },
  },
  {
    slug: 'so-fun-garden',
    n: 'W.09', title: 'So Fun Garden', cat: 'Web design, Web development', titleItalic: 'Garden',
    lede: [
      { heading: 'Project info', text: 'So Fun Garden (真趣园) is a new media art project started in New York in 2019 by visual artist Miao Jing: a virtual temple, absurd and full of metaphor, made with artists, musicians and designers in New York, Seattle, Los Angeles and Chengdu. Its website brought together the music videos, a gallery and a map of the garden.' },
      { heading: 'What I did', text: 'I designed and developed the website: the music-video windows that open and close, the scrolling marquees, the gallery and the map.' },
    ],
    meta: {
      role: 'Developer, Web Designer',
      year: '2020',
      // the collaborators, as the site listed them (from its archived home page, web.archive.org, Sept 2020)
      credits: [
        { role: 'Visual Artist, Initiator', name: 'Miao Jing', href: 'https://www.instagram.com/hibanana_miao/' },
        { role: 'Artist, Designer', name: 'Chengtao Yi', href: 'https://www.behance.net/YiDesign' },
        { role: 'Musician', name: 'W.Y. Huang', href: 'https://soundcloud.com/wyhuangofficial' },
        { role: 'New Media Artists', name: 'Jing Yan + Mengyu Chen', href: 'https://www.theuniqueeye.com/studio' },
        { role: 'Screen-print Studio', name: 'Happy Town' },
      ],
      press: [
        { label: 'NOWNESS', href: 'https://www.nowness.cn/picks/so-fun-garden-miaojing' },
      ],
      // no link: the site is gone (sofungarden.com is now a parked domain); the URL shows in the frame
    },
    // the recording, 1.5× (made from the site's own code, github.com/Lisiman/sofungarden; source in _source/so-fun-garden)
    hero: { kind: 'video', src: `${W}/so-fun-garden/hero.mp4`, poster: `${W}/so-fun-garden/hero.jpg`, w: 1920, h: 1160, url: 'sofungarden.com' },
    story: [],
    highlights: [],
    // stills from the music videos, then the posters and two framed works
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: `${W}/so-fun-garden/sfg-still-1.jpg`, w: 1920, h: 1080, alt: 'A temple shrine, from the music videos' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-still-2.jpg`, w: 1920, h: 1080, alt: 'The altar, from the music videos' }],
        [{ kind: 'image', src: `${W}/so-fun-garden/sfg-still-3.jpg`, w: 1920, h: 1080, alt: 'Flames and clouds, from the music videos' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-still-4.jpg`, w: 1920, h: 1080, alt: 'A figure in a halo of fire, from the music videos' }],
        [{ kind: 'image', src: `${W}/so-fun-garden/sfg-still-5.jpg`, w: 1920, h: 1072, alt: 'A hall of golden figures, from the music videos' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-still-6.jpg`, w: 1920, h: 1080, alt: 'A spirit in the fire, from the music videos' }],
        [{ kind: 'image', src: `${W}/so-fun-garden/sfg-poster-1.jpg`, w: 600, h: 776, alt: 'A figure on stilts' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-poster-2.jpg`, w: 600, h: 776, alt: '开光 poster' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-poster-3.jpg`, w: 600, h: 849, alt: 'A jade figure' }],
        [{ kind: 'image', src: `${W}/so-fun-garden/sfg-card-1.jpg`, w: 1200, h: 1403, alt: 'A golden face, framed in the project’s signs' }, { kind: 'image', src: `${W}/so-fun-garden/sfg-card-2.jpg`, w: 1200, h: 1200, alt: 'A crane in the temple, framed in the project’s signs' }],
      ],
    },
  },
];

export const detailFor = (slug: string): Detail | undefined => DETAILS.find((d) => d.slug === slug);

// ---------- every work gets a page ----------
// The works in reading order (Web W.01…, then Art A.01…). A work whose page is written above uses it; any other gets a
// first page made from what the home page knows — its title, number, category and cover — with DRAFT text to fill in.
// Each page links to the one before and after it.
const inOrder = (b: { left: Work[]; right: Work[] }): Work[] => [...b.left, ...b.right].sort((a, z) => a.n.localeCompare(z.n));
export const WORKS: Work[] = [...inOrder(WEB), ...inOrder(ART)];
export const slugOf = (w: Work): string => w.href.replace(/^\/work\//, '');
const host = (u: string): string => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

// awards to show on pages that are not written yet (each credits Siman by name)
const AWARDS: Record<string, { label: string; href?: string }[]> = {
  'fortune-on-hand': [{ label: 'Maker Faire Editor’s Choice, 2017', href: 'https://tisch.nyu.edu/itp/news/fall-2017/itp-at-world-maker-faire-2017' }],
};

// a bigger picture for the top of a page that is not written yet (the homepage keeps its lighter cover)
const HEROES: Record<string, DetailMedia & { hidden?: boolean }> = {
  'windloom': { kind: 'image', src: '/art/windloom/hero.webp', w: 2000, h: 1420, alt: 'Windloom' },
  'fortune-on-hand': { kind: 'image', src: '/art/fortune-on-hand/hero.webp', w: 2000, h: 1125, alt: 'Fortune on Hand' },
  'the-crossings': { kind: 'image', src: '/art/the-crossings/hero.webp', w: 2000, h: 1125, alt: 'The Crossings, in blue light' },
  'sea-and-mulberry-field': { kind: 'image', src: '/art/sea-and-mulberry-field/hero.webp', w: 2000, h: 1125, alt: 'Sea and Mulberry Field: a round window of light in a dark room' },
  'quick-hand-gallery': { kind: 'image', src: '/art/quick-hand-gallery/hero.webp', w: 2000, h: 1070, alt: 'The Quick Hand Gallery, its entrance' },
  'drifter': { kind: 'image', src: '/art/drifter/hero.webp', w: 1920, h: 1080, alt: 'Drifter: a doll’s face in the sand', hidden: true },   // shown as the film's still instead
};

// the introduction for a page that is not written yet (replaces the DRAFT lines)
const LEDES: Record<string, Detail['lede']> = {
  'windloom': [
    { heading: 'Project info', text: 'Windloom is an interactive installation and a NIME — a new interface for musical expression — made from two objects that held my grandmother’s days: the wind box that fed the kitchen fire, and the loom she worked late into the night. She lived almost her whole life in a village in Hebei, in northern China.' },
    { heading: 'About the work', text: 'Mornings there began with a rooster’s crow and the wind box heaving — her, cooking. Nights ended with the loom, singing in rhythm under her hands. She had lived through the three years of famine, when even tree bark was food. Feeding the fire and working the loom were the labor of survival, carried on by hand through hard years, and both had a music of their own. Long after she was gone, I rebuilt these two sounds as one instrument. Pull the bellows, touch the threads, weave: through physical computing and Max/MSP, each gesture wakes another layer of her story.' },
  ],
  'fortune-on-hand': [
    { heading: 'Project info', text: 'Using a webcam, Arduino and JavaScript, Fortune on Hand is an installation that generates a poem about one’s fortune based on their own unique palm lines. The machine has a transparent acrylic platform for users to put their right hand on. When the button is pressed, a picture of the palm is taken by the hidden webcam under the platform. After the analysis by JavaScript, a generated poem is printed out that tells the ‘fortune’.' },
    { heading: 'About the work', text: 'It is inspired by the great Chinese novel Dream of the Red Chamber, written in the Qing Dynasty, in which the main character Baoyu has a dream about a book in a sky palace called the “Great Void”, where everyone’s fate is written in poetry. I wonder if the development of technology makes people less superstitious, or if technology itself has become a form of superstition.' },
  ],
  'the-crossings': [
    { heading: 'Project info', text: 'The Crossings 渡 is a 3D projection mapping project on a concrete landscape sculpture that merges my whole body, with a projection of season-changing animation that represents the changes that happen in life.' },
    { heading: 'About the work', text: 'Inspired by the ancient Chinese landscape painting style, this work is a visual, aural and olfactory interpretation of the Buddhist concept of pain and relief in the journey of life. Using the technique of 3D scanning, my own body was captured, broken down and deformed into the shape of the landscape. The 3D model was used to generate physical simulation animations representing the four seasons, using different colors, forms and dynamics to stimulate the audience’s imagination in a way that is abstract, ancient, futuristic and poetic.\n\nThis work is a continuation of my own exploration of traditional Chinese aesthetics and philosophy: extracting, exploring and extending its core elements within a contemporary discourse, without being bound by the formal restraints of tradition.' },
  ],
  'sea-and-mulberry-field': [
    { heading: 'Project info', text: 'Sea and Mulberry Field is a light installation that shows the changes of nature in a cycle. It is inspired by the Chinese idiom ‘sea and mulberry field’ (沧海桑田), which describes the inexorable change of natural events, and how transient human life is in comparison to the machinations of the universe.' },
  ],
  'quick-hand-gallery': [
    { heading: 'Project info', text: 'Quick Hand Gallery is a VR piece that features a gallery environment displaying bizarre and humorous videos of laborers from rural China, from the popular TikTok-esque app Kwai (快手). Though often considered lowbrow or kitschy by people in China’s first-tier cities, the app is used in this piece to elevate the everyday to the level of performance art, which in turn questions its meaning.' },
    { heading: 'About the work', text: 'This piece was on view in 女 Nǚ: Other Half of the Sky, a group show at B4BEL4B, from January 18 to March 7, 2020.' },
  ],
  'drifter': [
    { heading: 'Project info', text: 'Drifter is a short animated film made with Cinema 4D for the 120-foot-long video wall at the IAC Building in Chelsea, New York. It is a collaboration with Yanlin Ma, with original music by Lu Wang.' },
    { heading: 'About the work', text: 'Why do we dream? What do we dream about? Is a dream a song to the shiny memory, or the elegy of the loss?' },
  ],
};

// facts for a page that is not written yet: the year (replaces DRAFT), the tools ("Built with")…
const META: Record<string, Partial<Detail['meta']>> = {
  'windloom': {
    year: '2017', stack: 'Woodworking and fabrication, 3D modeling (Rhino), Max/MSP, Arduino',
    // from the résumé (newest first)
    exhibitions: [
      { label: 'Whitebox Gallery, New York, 2018' },
      { label: 'NIME, Littlefield, New York, 2017' },
      { label: 'ITP Winter Show, New York, 2017', href: 'https://itp.nyu.edu/shows/winter2017/windloom/' },
    ],
    press: [
      { label: 'Radio Magazine', title: 'Female Artist Uses Loom to Weave the Music of Nostalgia' },
      { label: 'DFRobot', title: 'Making Windloom', href: 'https://www.dfrobot.com/blog-1154.html' },
      { label: 'Hebei Education', title: 'Weave the Music of Nostalgia and Childhood' },
    ],
  },
  'fortune-on-hand': {
    year: '2016', stack: 'JavaScript, MadMapper, Arduino, OpenCV',
    // from the résumé (newest first)
    exhibitions: [
      { label: 'Processing Foundation Day, Shanghai, 2019' },
      { label: 'CSPACE, Beijing, 2018' },
      { label: 'Jiangsu Television, Nanjing, 2017' },
      { label: 'Maker Faire New York, 2017', href: 'https://makerfaire.com/maker/entry/63331' },
      { label: 'ITP Winter Show, New York, 2016', href: 'https://itp.nyu.edu/shows/winter2016/fortune-on-hand/' },
    ],
    press: [
      { label: 'SinoVision', title: 'This Machine Will Tell Your Fortune by Coding' },
      { label: 'The Creators Project, VICE', title: 'Siman Li’s New Fortune Telling Machine' },
      { label: 'DFRobot', title: 'Tell the Fortune in a Scientific Way' },
      { label: 'Jiangsu Television', title: 'Jiangsu Television Feature' },
    ],
  },
  'the-crossings': {
    year: '2018', stack: '3D scanning, physical simulation, projection mapping',
    watch: [
      { label: 'Making of', href: 'https://vimeo.com/272123431' },
      { label: 'Thesis presentation', href: 'https://vimeo.com/270191416' },   // ITP Thesis Week 2018
    ],
  },
  'sea-and-mulberry-field': { year: '2017', stack: 'Fabrication, CAD (Rhino), Arduino' },
  'quick-hand-gallery': {
    year: '2019', stack: 'Unity, Rhino (3D modeling), Oculus Quest (VR)',
    exhibitions: [
      { label: '女 Nǚ: Other Half of the Sky, B4BEL4B, Oakland, 2020' },
    ],
    press: [
      { label: 'RADII China', title: 'Art Show “女 Nǚ: Other Half of the Sky” Exposes the Human Dimension of Bay Area Tech Culture', href: 'https://radii.co/article/art-%e5%a5%b3-nu-other-half-of-the-sky-bay-area' },
    ],
  },
  'drifter': {
    year: '2017', stack: 'Cinema 4D',
    watch: [{ label: 'Full film', href: 'https://vimeo.com/248622382' }],
    credits: [
      { role: 'Collaboration', name: 'Yanlin Ma' },
      { role: 'Original music', name: 'Lu Wang' },
    ],
    // from the résumé (newest first)
    exhibitions: [
      { label: 'Made in NY Media Center, New York, 2018' },
      { label: 'IAC Big Screens Show, New York, 2017' },
    ],
  },
};

// the pictures and film for a page that is not written yet
const MEDIA: Record<string, Pick<Detail, 'gallery' | 'film' | 'making' | 'onBlack' | 'introFigure' | 'memorial'>> = {
  'windloom': {
    // the end of the page: my grandmother, whose loom and wind box the work is made from
    memorial: { kind: 'image', src: '/art/windloom/grandmother.jpg', w: 960, h: 1280, alt: 'My grandmother, Fengling Zhao, as a young woman',
      lines: ['In forever memory of', 'my loving Grandmother,', 'Fengling Zhao', '赵风龄', 'May 16, 1935 – June 13, 2006'],
      note: ['Poverty and hardship meant that my grandmother received only a few years of formal education, but she always made sure I had the opportunity to learn. Through the hungry years of the great famine, she sewed clothes and worked the bellows at the stove to cook for her big family, doing everything she could to care for them. Even when she had very little, she always found a way to share what she had with families who had less.',
        'She taught me to keep learning, to love, and to be generous.'] },
    gallery: {
      heading: '',
      rows: [
        // making: where it comes from, the drawing and the workshop, then the work and its parts
        [{ kind: 'image', src: '/art/windloom/loom.webp', w: 709, h: 436, alt: 'A traditional weaving loom', ratio: '2 / 1', caption: 'The loom' }, { kind: 'image', src: '/art/windloom/windbox.webp', w: 709, h: 436, alt: 'A wind box beside a village stove', ratio: '2 / 1', caption: 'The wind box' }, { kind: 'image', src: '/art/windloom/drawing.webp', w: 1200, h: 738, alt: 'Windloom, a line drawing', ratio: '2 / 1', caption: 'Drawing' }],
        [{ kind: 'image', src: '/art/windloom/process-1.webp', w: 488, h: 300, alt: 'The circuit: an Arduino and its wires', ratio: '2 / 1', caption: 'The circuit' }, { kind: 'image', src: '/art/windloom/process-2.webp', w: 488, h: 300, alt: 'Cutting the parts on the CNC router', ratio: '2 / 1', caption: 'CNC cutting' }, { kind: 'image', src: '/art/windloom/process-4.webp', w: 488, h: 300, alt: 'Routing a part in the workshop', ratio: '2 / 1', caption: 'In the workshop' }],
        [{ kind: 'image', src: '/art/windloom/installation.webp', w: 1600, h: 900, alt: 'Windloom, lit, in the dark', ratio: '3 / 2', caption: 'Windloom' }, { kind: 'image', src: '/art/windloom/detail-bells.webp', w: 1600, h: 1067, alt: 'The bells', ratio: '3 / 2', caption: 'The bells' }],
        [{ kind: 'image', src: '/art/windloom/detail-wheels.webp', w: 1600, h: 1067, alt: 'The wheels', ratio: '3 / 2', caption: 'The wheels' }, { kind: 'image', src: '/art/windloom/detail-threads.webp', w: 1600, h: 1067, alt: 'The threads', ratio: '3 / 2', caption: 'The threads' }],
        // performance: rehearsal and backstage, one still, then the film
        [{ kind: 'image', src: '/art/windloom/show-play.webp', w: 1600, h: 1066, alt: 'Rehearsing with Windloom', caption: 'Rehearsal', ratio: '16 / 9' }, { kind: 'image', src: '/art/windloom/backstage.webp', w: 1600, h: 1067, alt: 'Backstage, Windloom in the mirror', caption: 'Backstage', ratio: '16 / 9' }],
        [{ kind: 'image', src: '/art/windloom/perform-4.webp', w: 1600, h: 900, alt: 'Performing Windloom', ratio: '16 / 9', caption: 'NIME 2017, Littlefield, New York' }, { kind: 'image', src: '/art/windloom/weaving.webp', w: 1600, h: 913, alt: 'Hands weaving the threads', ratio: '16 / 9', caption: 'NIME 2017, Littlefield, New York' }],
      ],
      chapters: [
        { row: 0, title: 'Making', note: 'From my grandmother’s loom and wind box to a drawing, a circuit, and a workshop full of cut wood.' },
        { row: 4, title: 'Performance', note: 'Played live: pulling, touching, weaving.' },
      ],
      after: [
        [{ kind: 'image', src: '/art/windloom/show-listen.webp', w: 1000, h: 668, alt: 'A visitor listening to Windloom at Whitebox Gallery', at: 3, span: 8, caption: 'Whitebox Gallery, New York, 2018' }],
      ],
    },
    film: { heading: '', vimeo: '249369215', title: 'Windloom 织风, NIME 2017', poster: '/art/windloom/film.webp' },
  },
  'fortune-on-hand': {
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: '/art/fortune-on-hand/hand.webp', w: 1500, h: 844, alt: 'The hand', ratio: '16 / 9' }, { kind: 'image', src: '/art/fortune-on-hand/chart.webp', w: 1600, h: 900, alt: 'The birthday chart', ratio: '16 / 9' }],
        [{ kind: 'image', src: '/art/fortune-on-hand/printer.webp', w: 1600, h: 900, alt: 'A fortune, printed', ratio: '16 / 9' }, { kind: 'image', src: '/art/fortune-on-hand/palm-drawing.webp', w: 842, h: 656, alt: 'A drawing printed with a fortune', ratio: '16 / 9' }],
        [{ kind: 'image', src: '/art/fortune-on-hand/red-diagonal.webp', w: 1600, h: 900, alt: 'The hand, in red light', ratio: '16 / 9' }, { kind: 'image', src: '/art/fortune-on-hand/red-side.webp', w: 1600, h: 1067, alt: 'The side of the box', ratio: '16 / 9' }],
        [{ kind: 'image', src: '/art/fortune-on-hand/lantern.webp', w: 1000, h: 1778, alt: 'A red lantern over the palm chart', at: 5, span: 4 }],
        [{ kind: 'image', src: '/art/fortune-on-hand/show-1.webp', w: 908, h: 605, alt: 'Visitors at the show' }, { kind: 'image', src: '/art/fortune-on-hand/show-2.webp', w: 908, h: 605, alt: 'A visitor reading the palm' }],
      ],
    },
    film: { heading: '', vimeo: '199421539', title: 'Fortune on Hand', poster: '/art/fortune-on-hand/film.webp' },
  },
  'the-crossings': {
    onBlack: true,
    introFigure: { kind: 'image', src: '/art/the-crossings/painting.webp', w: 433, h: 1024, alt: 'Sheng Mao, Waiting for the Ferry on the Autumn River', caption: 'Sheng Mao, Waiting for the Ferry on the Autumn River, Yuan dynasty' },
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: '/art/the-crossings/scan.webp', w: 1080, h: 607, alt: 'My body, 3D scanned', caption: 'My body, 3D scanned', at: 3, span: 8, scale: 0.6 }],
        [{ kind: 'image', src: '/art/the-crossings/sculpture.webp', w: 1500, h: 938, alt: 'The concrete landscape', caption: 'The concrete landscape', at: 3, span: 8 }],
        [{ kind: 'image', src: '/art/the-crossings/spring.webp', w: 1600, h: 900, alt: 'Spring rain', ratio: '16 / 9', caption: 'Spring rain' }, { kind: 'image', src: '/art/the-crossings/summer.webp', w: 1600, h: 900, alt: 'Summer flower', ratio: '16 / 9', caption: 'Summer flower' }],
        [{ kind: 'image', src: '/art/the-crossings/fall.webp', w: 1600, h: 900, alt: 'Fall river', ratio: '16 / 9', caption: 'Fall river' }, { kind: 'image', src: '/art/the-crossings/winter.webp', w: 1600, h: 900, alt: 'Winter snow', ratio: '16 / 9', caption: 'Winter snow' }],
        [{ kind: 'video', src: '/art/the-crossings/motion-2.mp4', poster: '/art/the-crossings/motion-2.webp', w: 1280, h: 720, alt: 'The projection, moving', filter: 'contrast(1.15) saturate(1.22) brightness(0.96)', bleed: true }],
      ],
    },
    film: { heading: '', vimeo: '265459837', title: 'The Crossings 渡', poster: '/art/the-crossings/hero.webp' },
  },
  'sea-and-mulberry-field': {
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: '/art/sea-and-mulberry-field/cycle.webp', w: 1400, h: 1356, alt: 'The cycle: mountains, sea, a village, a gate', ratio: '1 / 1', at: 5, span: 4 }],
        [{ kind: 'image', src: '/art/sea-and-mulberry-field/phase-2.webp', w: 1600, h: 900, alt: 'The window, another moment' }, { kind: 'image', src: '/art/sea-and-mulberry-field/phase-4.webp', w: 1600, h: 900, alt: 'The window, another moment' }],
        [{ kind: 'image', src: '/art/sea-and-mulberry-field/gate.webp', w: 1600, h: 900, alt: 'The gate, through the window', ratio: '16 / 9' }, { kind: 'image', src: '/art/sea-and-mulberry-field/waves.webp', w: 1600, h: 900, alt: 'Waves, close', ratio: '16 / 9' }],
      ],
      after: [
        [{ kind: 'image', src: '/art/sea-and-mulberry-field/inside.webp', w: 1600, h: 900, alt: 'Inside: the layers that cast the shadows' }],
      ],
    },
    film: { heading: '', vimeo: '218737675', title: 'Sea and Mulberry Field', poster: '/art/sea-and-mulberry-field/film.webp' },
  },
  'quick-hand-gallery': {
    introFigure: { kind: 'image', src: '/art/quick-hand-gallery/logo.webp', w: 568, h: 567, alt: 'The Quick Hand Gallery 快手博物馆' },
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: '/art/quick-hand-gallery/hall.webp', w: 1600, h: 856, alt: 'The gallery hall', ratio: '16 / 9' }, { kind: 'image', src: '/art/quick-hand-gallery/portraits.webp', w: 1600, h: 856, alt: 'Portraits on the walls', ratio: '16 / 9' }],
        [{ kind: 'image', src: '/art/quick-hand-gallery/maker.webp', w: 1600, h: 1328, alt: 'Geng Shuai, the maker', caption: 'Geng Shuai, the maker' }, { kind: 'image', src: '/art/quick-hand-gallery/cement.webp', w: 1600, h: 1328, alt: 'Hua Ge, the cement guy', caption: 'Hua Ge, the cement guy' }, { kind: 'image', src: '/art/quick-hand-gallery/brick.webp', w: 1600, h: 1328, alt: 'Kun Ge, the brick guy', caption: 'Kun Ge, the brick guy' }],
        [{ kind: 'image', src: '/art/quick-hand-gallery/firecrackers.webp', w: 1600, h: 1058, alt: 'Red firecrackers', ratio: '16 / 9' }, { kind: 'image', src: '/art/quick-hand-gallery/workers.webp', w: 1600, h: 975, alt: 'Builders, on video', ratio: '16 / 9' }],
      ],
    },
  },
  'drifter': {
    gallery: {
      heading: '',
      rows: [
        [{ kind: 'image', src: '/art/drifter/scene-hand.webp', w: 2000, h: 188, alt: 'A still from the film: a hand’s shadow over the sand' }],
        [{ kind: 'image', src: '/art/drifter/scene-mirror.webp', w: 2000, h: 188, alt: 'A still from the film: a mirror in the dunes' }],
        [{ kind: 'image', src: '/art/drifter/scene-bottles.webp', w: 2000, h: 187, alt: 'A still from the film: fallen bottles' }],
        [{ kind: 'image', src: '/art/drifter/scene-rug.webp', w: 2000, h: 188, alt: 'A still from the film: a crate and a zebra rug' }],
        [{ kind: 'image', src: '/art/drifter/scene-light.webp', w: 2000, h: 188, alt: 'A still from the film: a figure in the light' }],
        [{ kind: 'image', src: '/art/drifter/wire-1.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }, { kind: 'image', src: '/art/drifter/wire-2.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }, { kind: 'image', src: '/art/drifter/wire-3.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }],
        [{ kind: 'image', src: '/art/drifter/wire-4.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }, { kind: 'image', src: '/art/drifter/wire-5.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }, { kind: 'image', src: '/art/drifter/wire-6.webp', w: 512, h: 256, alt: 'A scene, modeled in Cinema 4D' }],
        [{ kind: 'image', src: '/art/drifter/iac-1.webp', w: 1500, h: 844, alt: 'Drifter on the IAC video wall', caption: 'IAC Big Screens, New York, 2017', ratio: '3 / 2' }, { kind: 'image', src: '/art/drifter/iac-2.webp', w: 1500, h: 844, alt: 'Drifter on the IAC video wall', caption: 'IAC Big Screens, New York, 2017', ratio: '3 / 2' }, { kind: 'image', src: '/art/drifter/iac-audience.webp', w: 1500, h: 1000, alt: 'The audience at the IAC Building', caption: 'IAC Big Screens, New York, 2017', ratio: '3 / 2' }],
      ],
    },
  },
};

function firstDraft(w: Work): Detail {
  const art = w.n.startsWith('A');
  const m = w.media;
  return {
    slug: slugOf(w), n: w.n, title: w.title, cat: w.cat, art,
    lede: LEDES[slugOf(w)] ?? [
      { heading: 'Project info', text: 'DRAFT — What it is, in a sentence or two.' },
      { heading: art ? 'About the work' : 'What I did', text: art ? 'DRAFT — How it works, where it was shown.' : 'DRAFT — What you built, and with what.' },
    ],
    meta: {
      role: art ? 'Media Artist' : slugOf(w) === 'so-fun-garden' ? 'Developer, Web Designer' : 'Creative Developer',
      year: 'DRAFT',
      ...(AWARDS[slugOf(w)] ? { recognition: AWARDS[slugOf(w)] } : {}),
      ...(w.live ? { live: { label: host(w.live), href: w.live } } : {}),
      ...META[slugOf(w)],
    },
    // a website plays in a browser window; an artwork is shown as itself, no window around it
    hero: HEROES[slugOf(w)]
      ? { ...HEROES[slugOf(w)], url: w.live ? host(w.live) : '', ...(art ? { frame: false } : {}) }
      : m.kind === 'video'
      ? { kind: 'video', src: m.video, poster: m.poster, w: m.w, h: m.h, url: w.live ? host(w.live) : '', ...(art ? { frame: false } : {}) }
      : { kind: 'image', src: m.src, w: m.w, h: m.h, url: w.live ? host(w.live) : '', ...(art ? { frame: false } : {}) },
    story: [], highlights: [],
    ...MEDIA[slugOf(w)],
  };
}

export const PAGES: Detail[] = WORKS.map((w, i) => {
  const d = detailFor(slugOf(w)) ?? firstDraft(w);
  const before = WORKS[i - 1], after = WORKS[i + 1];
  return {
    ...d,
    meta: { ...d.meta, live: d.meta.live ?? (w.live ? { label: host(w.live), href: w.live } : undefined) },
    prev: before ? { title: before.title, href: before.href } : undefined,
    next: after ? { title: after.title, href: after.href } : undefined,
  };
});
