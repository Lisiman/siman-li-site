# siman.li

Siman Li's portfolio. Astro + TypeScript, static output, deployed on Cloudflare Pages.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # type-check everything (astro check)
```

Preview any season or weather with URL params:

```
http://localhost:4321/?season=winter&wx=snow&wind=30&temp=25
http://localhost:4321/?season=spring&wx=clear&wind=4&temp=62
http://localhost:4321/?season=autumn&wx=rain&wind=22&temp=47
```

`season` = spring | summer | autumn | winter, `wx` = clear | cloudy | rain | snow | fog, `wind` in mph, `temp` in °F.

## Where things live

| File | What it does |
|---|---|
| `src/data/site.ts` | Birthday (day 0 = 25 Dec 1993), lifespan for the ferry, city, painting seed |
| `src/data/projects.ts` | **All works** (title, number, category, link, image/video) and the Web / Art abouts |
| `public/work/<project>/` | `cover.*` = homepage image; `01`, `02`… = detail-page images. WebP stills, GIFs as small looping MP4 + poster |
| `src/data/gallery.ts` | Detail-page image list per project |
| `_source/` | Original materials (deduped above). Local only: not deployed, not in git |
| `src/components/Works.astro` | A body of work: about + Images / Index views |
| `src/components/Ferry.astro` | III. The ferry (contact, colophon), the shore, footer |
| `src/components/Hero.astro` | Section 1 markup |
| `src/scripts/painting-types.ts` | Types for the painting: strokes, landscape geometry, sky, weather |
| `src/scripts/painting.ts` | The landscape generator, sun & moon astronomy, weather marks. Don't need to touch. |
| `src/scripts/hero.ts` | Everything live: sky, dark mode, season, weather, wind, water, ferry, clicks, logo morph |
| `src/scripts/works.ts` | Images / Index switch; pauses off-screen videos |
| `src/styles/global.css` | Colour tokens (light / dark), base type |
| `src/styles/hero.css` | Hero layout and all the animations |

## What the hero does

- **Painting No. / days**: days since 25 Dec 1993 on the New York calendar.
- **The landscape is fixed** (`seed`). Only these change:
  - **Sky**: real sun and moon position over New York, real moon phase, stars at night.
  - **Dark mode**: automatic after New York sunset. Clicking the sun or moon flips it for the session; the icon itself stays.
  - **Season** (New York): spring blossoms, full summer leaves, autumn leaves thinning and falling, bare winter trees and snow-pale hills.
  - **Weather** (Open-Meteo, free, no key, every 15 min): rain, snow, fog and cloud marks. Rain rings on the water, wind waves, ice below freezing.
  - **Wind**: trees sway, reeds bend, the boat rocks; falling leaves drift with it.
  - **The ferry**: crosses age / 100 of the river while the ferryman rows. A faint path climbs from the landing to the Buddha in the saddle beyond the mountains.
- **Click**: the water makes ripples, the sky sends up birds, the ferryman jumps.
- **Logo**: SIMAN LI scatters into particles and regathers as 李思曼.
- `prefers-reduced-motion` gets a still painting.

## Adding or changing a work

1. Make a folder `public/work/<project>/` and put `cover.webp` in it (WebP or JPG, ~1600px wide). For a GIF, convert it to MP4 so it loads fast:
   `ffmpeg -i in.gif -movflags +faststart -pix_fmt yuv420p -vf "scale='min(1200,iw)':-2" -c:v libx264 -crf 24 -an out.mp4` plus a poster `ffmpeg -i in.gif -vframes 1 out.jpg`.
2. Add a line to `left` or `right` in `src/data/projects.ts` (TypeScript flags a missing field). If your media live somewhere other than `public/work/`, change `MEDIA_DIR` at the top of that file.

`preview.html` is a quick look without npm (open it in a browser). The real site is `npm run dev`.

## Deploy on Cloudflare Pages

1. Push this folder to a GitHub repo.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, then pick the repo.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. Add the custom domain `www.siman.li` under **Custom domains**.

Every push to `main` redeploys.
