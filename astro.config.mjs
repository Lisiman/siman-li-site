// @ts-check
import { defineConfig } from 'astro/config';

// Static site — Cloudflare Pages serves the `dist` folder as-is.
export default defineConfig({
  site: 'https://www.siman.li',
  // old addresses that moved, so links to them still land somewhere
  redirects: {
    '/work/dark-mode': '/work/browser-history',
    '/work/browser-history-2021': '/work/browser-history',
    '/work/browser-history-2020': '/work/browser-history',
  },
});
