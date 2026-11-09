// For search engines: everything may be read; the site map lists every page.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://www.siman.li')).href.replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
