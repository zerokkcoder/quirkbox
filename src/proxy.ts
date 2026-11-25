import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/config/site";

// These are real first-level routes that must never be treated as a bad locale.
const publicRoots = new Set([
  "about",
  "api",
  "emoji-data",
  "favicon.ico",
  "opengraph-image",
  "robots.txt",
  "sitemap.xml",
  "tools",
  "_next",
]);

const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>404 — Page not found | ${siteConfig.name}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: #090d1c; color: #e8ecf7; font-family: system-ui, sans-serif; }
  main { max-width: 34rem; padding: 3rem 1.5rem; text-align: center; }
  p.eyebrow { color: #e6bf6a; letter-spacing: .2em; font-size: .75rem; text-transform: uppercase; }
  h1 { font-size: clamp(2rem, 6vw, 3rem); margin: .6rem 0 1rem; }
  p { color: #a7b0ca; line-height: 1.7; }
  a { display: inline-block; margin-top: 1.5rem; padding: .7rem 1.3rem; border-radius: .75rem;
      background: #e6bf6a; color: #090d1c; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">404 · ${siteConfig.nameZh}</p>
  <h1>航线未找到 / Page not found</h1>
  <p>这个地址不在星图上。This address is not on our chart.</p>
  <a href="/">返回首页 / Back home</a>
</main>
</body>
</html>`;

/**
 * `[locale]` is a dynamic segment. Under Cache Components, calling notFound()
 * inside a page happens after streaming starts, so Next.js keeps HTTP 200.
 * Reject unsupported locale-like first segments before rendering instead.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];

  if (!segment) return NextResponse.next();

  // Any path that looks like a static file (e.g. /emoji-data/en/data.json)
  // is never a locale candidate.
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  // English is the unprefixed default locale; keep /en out of the index.
  if (segment === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (
    publicRoots.has(segment) ||
    siteConfig.locales.includes(segment as (typeof siteConfig.locales)[number])
  ) {
    return NextResponse.next();
  }

  return new Response(notFoundHtml, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
