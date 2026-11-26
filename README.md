# StarRudder · 星舵工坊

StarRudder is a collection of free tools that run entirely in your browser, built with Next.js 16, TypeScript, Tailwind CSS v4, and shadcn/ui. No account, no uploads, no stored data — [starrudder.cc](https://starrudder.cc).

星舵工坊是一组完全在浏览器中执行的免费工具。免注册、不上传、不保存任何用户数据，打开即可使用。

See [docs/brand.md](docs/brand.md) for the full brand guide (中文 / English).

The launch version includes:

- `Random Name Generator`: culture-aware name suggestions with browser pronunciation.
- `Pixel Avatar Maker`: deterministic pixel portraits with PNG export.
- `Emoji Wallpaper Maker`: tiled emoji wallpapers at 4K, in any aspect ratio.
- `Travel Footprint`: map your home and footprints, style the routes, export PNG/JSON.
- `Color Palette Generator`: generate a palette from one seed color, with WCAG contrast checks, color-blind previews and CSS/Tailwind/PNG export.
- `Image Converter`: batch-convert images between PNG, JPG, WebP, AVIF, GIF, BMP and ICO with resizing and ZIP download — all in the browser.
- `QR Code Generator`: create scannable QR codes with custom colors, dot styles and an optional center logo, then export PNG or SVG — nothing uploaded.
- `English + Traditional Chinese`: English is the default route; Traditional Chinese lives under `/zh-Hant`.

## Scripts

The dev and production servers listen on port **4000** (`http://localhost:4000`).

```bash
npm run dev
npm run lint
npm test
npm run build
npm run test:e2e
npm run seo:audit
npm run seo:audit:baseline
```

## SSR SEO gate

A two-stage SEO audit guards every commit that touches rendered HTML (see
`docs/seo-audit.md`, adapted from
[this DEV article](https://dev.to/tarotfortunecards/how-i-built-a-pre-merge-ssr-seo-audit-gate-for-nextjs-16-content-pages-271i)):

- **Static repo check** — sitemap route coverage, template sentence overlap
  (`>= 15%` fails), inbound links, WebP/60 KB primary visuals, and protected
  title/description/h1 snapshots in `scripts/seo-baseline.json`.
- **Raw SSR HTML check** — the production build is served locally and every
  sitemap URL is fetched without a browser: HTTP 200, exact canonical, no
  `noindex`, one `<h1>` with no skipped levels, server-rendered FAQ headings,
  valid JSON-LD, and expected above-the-fold image attributes.

`npm install` points git at the committed hook in `.githooks/`; CI runs the
same gate via `npm run seo:audit -- --skip-build`. To audit a deployed preview
instead of a local build, use `SEO_AUDIT_URL=https://… npm run seo:audit -- --skip-build`.
Intentional SEO copy changes need `npm run seo:audit:baseline` to refresh the
protected snapshot. Add `--strict` to turn length/word-count warnings into errors.

`src/proxy.ts` rejects unsupported first path segments before rendering, so paths
like `/sitemap` or `/nope` return a real HTTP 404 (and `/en` redirects to `/`);
without it, `notFound()` after streaming starts would keep a 200 status.
`src/app/sitemap.ts` uses a fixed `lastModified` instead of `new Date()` so the
output stays stable across crawls — bump that constant when content changes.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base-nova)
- MDX for landing content snippets
- Vitest + Playwright

## Deployment

The project includes:

- `Dockerfile`
- `docker-compose.yml`
- `deploy/nginx.conf`
- `.github/workflows/ci.yml`

Set `NEXT_PUBLIC_SITE_URL` before production deploys so metadata and sitemap URLs are correct (defaults to `https://starrudder.cc`).
