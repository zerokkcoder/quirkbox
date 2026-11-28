import { NextResponse, type NextRequest } from "next/server";
import { siteConfig, type Locale } from "@/config/site";

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

// Root-level files served from /public that must reach the asset handler.
const publicFiles = new Set([
  "wechat-pay.jpg",
  "allipay.jpg",
  "ko-fi-logo.png",
]);

const toolSlugs = new Set([
  "emoji-wallpaper",
  "image-converter",
  "color-palette-generator",
  "pixel-avatar",
  "random-name",
  "travel-footprint",
  "qr-code-generator",
  "gradient-wallpaper-generator",
  "ascii-art-generator",
  "json-toolkit",
  "password-generator",
  "unix-timestamp-converter",
]);

type NotFoundCopy = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

const notFoundCopy: Record<Locale, NotFoundCopy> = {
  en: {
    eyebrow: `404 · ${siteConfig.name}`,
    title: "Page not found",
    body: "This address isn't on the map. Head back to the tools.",
    cta: "Back to home",
  },
  "zh-Hant": {
    eyebrow: `404 · ${siteConfig.nameZh}`,
    title: "找不到頁面",
    body: "這個網址不存在。回到首頁，繼續使用瀏覽器工具。",
    cta: "返回首頁",
  },
};

function notFoundHtml(locale: Locale) {
  const copy = notFoundCopy[locale];

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${copy.title} | ${locale === "zh-Hant" ? siteConfig.nameZh : siteConfig.name}</title>
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
  <p class="eyebrow">${copy.eyebrow}</p>
  <h1>${copy.title}</h1>
  <p>${copy.body}</p>
  <a href="/">${copy.cta}</a>
</main>
</body>
</html>`;
}

function notFoundResponse(locale: Locale) {
  return new Response(notFoundHtml(locale), {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

/** Only real locale-prefixed routes may continue to the App Router. */
function isKnownPrefixedPath(segments: string[]) {
  if (segments.length === 1) return true;

  const [, second, third] = segments;
  if (second === "about") return segments.length === 2;
  if (second === "tools") {
    if (segments.length === 2) return true;
    return segments.length === 3 && toolSlugs.has(third);
  }

  return false;
}

/**
 * `[locale]` is a dynamic segment. Under Cache Components, calling notFound()
 * inside a page happens after streaming starts, so Next.js keeps HTTP 200.
 * Reject unsupported locale-like paths before rendering instead.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const segment = segments[0];

  if (!segment) return NextResponse.next();

  // Known static-file roots continue; unknown dotted paths still get a real
  // single-language 404 instead of Next's streaming fallback.
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    if (publicRoots.has(segment) || publicFiles.has(segment)) return NextResponse.next();
    return notFoundResponse(
      siteConfig.locales.includes(segment as Locale) ? (segment as Locale) : "en"
    );
  }

  // English is the unprefixed default locale; keep /en out of the index.
  if (segment === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (publicRoots.has(segment)) return NextResponse.next();

  if (siteConfig.locales.includes(segment as Locale)) {
    if (!isKnownPrefixedPath(segments)) {
      return notFoundResponse(segment as Locale);
    }
    return NextResponse.next();
  }

  return notFoundResponse("en");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
