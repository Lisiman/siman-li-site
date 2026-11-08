// A share image for each work's page (og:image), cropped to 1200 × 630 — an artwork's top picture; for a website, its
// home-page cover (a video's still), since a recording's first frame is rarely the best of it. The shape
// LinkedIn, iMessage, Slack and the rest show. Made at build time, so a new work gets one by itself.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { PAGES, WORKS, slugOf } from '../../data/details';

// where a cover video's first frame is not the one to show, a picture chosen by hand
const CHOSEN: Record<string, string> = {
  'zendaya': '/work/zendaya/zd-landing.jpg',
  'squarespace-collection': '/work/squarespace-collection/jk-laptop-studio.jpg',
};

export const getStaticPaths: GetStaticPaths = () =>
  PAGES.map((d) => {
    const cover = WORKS.find((w) => slugOf(w) === d.slug)?.media;
    const src = CHOSEN[d.slug] ?? (!d.art && cover
      ? (cover.kind === 'video' ? cover.poster : cover.src)
      : (d.hero.kind === 'video' ? d.hero.poster ?? d.hero.src : d.hero.src));
    return { params: { slug: d.slug }, props: { src } };
  });

export const GET: APIRoute = async ({ props }) => {
  const file = `public${decodeURI(props.src as string)}`;   // (the build runs from the project's root)
  const jpg = await sharp(file).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
