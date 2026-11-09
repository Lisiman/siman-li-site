// The site map for search engines: the home page and every work's page, at the addresses they answer at
// (www, no trailing slash). Made at build time from the same list as the pages, so a new work joins it by itself.
import type { APIRoute } from 'astro';
import { PAGES } from '../data/details';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://www.siman.li')).href.replace(/\/$/, '');
  const urls = ['/', ...PAGES.map((d) => `/work/${d.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
