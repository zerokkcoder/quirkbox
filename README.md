# QuirkBox

QuirkBox is a playful tool collection site built with Next.js 16, TypeScript, Tailwind CSS v4, and shadcn/ui.

The launch version includes:

- `Random Name Generator`: generates culture-aware foreign name suggestions using curated name libraries and rule-based scoring.
- `Pixel Avatar Maker`: generates deterministic pixel portraits in the browser and exports PNG files.
- `English + Traditional Chinese`: English is the default route, while Traditional Chinese is available under `/zh-Hant`.

## Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run test:e2e
```

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

Set `NEXT_PUBLIC_SITE_URL` before production deploys so metadata and sitemap URLs are correct.
