/**
 * Pure helpers for the pre-merge SSR SEO audit.
 * No dependencies on Next.js internals: everything works on raw HTML strings.
 */

export const SEO_RULES = {
  // Locale-aware ranges for tool pages (the DEV article's 30-60/120-160 is for
  // long-form content pages; CJK copy is naturally much denser).
  titleLength: { en: [15, 70], "zh-Hant": [10, 45] },
  descriptionLength: { en: [40, 170], "zh-Hant": [12, 120] },
  minVisibleWords: { en: 40, "zh-Hant": 30 },
  overlapThreshold: 0.15,
  heroImageMaxBytes: 60 * 1024,
};

const entities = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&#39;": "'",
  "&#x27;": "'",
};

export function decodeEntities(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/g, (match) => entities[match] ?? match);
}

function collapse(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseAttributes(attributeString) {
  const attributes = {};
  for (const match of attributeString.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g)) {
    attributes[match[1]] = decodeEntities(match[2]);
  }
  return attributes;
}

/** Text a crawler sees before hydration, excluding shared chrome. */
export function proseText(html) {
  return collapse(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, (entity) => decodeEntities(entity))
  );
}

/** All visible-ish text, used for the minimum content check. */
export function visibleText(html) {
  return collapse(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, (entity) => decodeEntities(entity))
  );
}

export function contentLength(text, locale) {
  if (locale === "zh-Hant") {
    return (text.match(/[\p{Script=Han}a-z0-9]/giu) ?? []).length;
  }
  return (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
}

export function localeFromPath(pathname) {
  return pathname.startsWith("/zh-Hant") ? "zh-Hant" : "en";
}

export function normalizeSentences(text, locale) {
  const sentences = new Set();
  for (const raw of text.split(/[.!?。！？]+/)) {
    if (locale === "zh-Hant") {
      const cleaned = raw.replace(/[^\p{Script=Han}a-z0-9]/gi, "");
      if (cleaned.length >= 12) sentences.add(cleaned);
    } else {
      const cleaned = raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (cleaned.split(" ").length >= 6) sentences.add(cleaned);
    }
  }
  return sentences;
}

/** Jaccard overlap between every pair of pages; >= threshold is a failure. */
export function pairwiseOverlap(pages, threshold = SEO_RULES.overlapThreshold) {
  const sets = Object.fromEntries(
    Object.entries(pages).map(([key, { text, locale }]) => [key, normalizeSentences(text, locale)])
  );
  const failures = [];
  const keys = Object.keys(sets);
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const a = sets[keys[i]];
      const b = sets[keys[j]];
      if (a.size === 0 || b.size === 0) continue;
      const union = new Set([...a, ...b]);
      const overlap = (a.size + b.size - union.size) / union.size;
      if (overlap >= threshold) {
        failures.push({ a: keys[i], b: keys[j], overlap: Math.round(overlap * 1000) / 10 });
      }
    }
  }
  return failures;
}

export function checkHeadingHierarchy(headings) {
  const errors = [];
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count !== 1) errors.push(`expected exactly one <h1>, found ${h1Count}`);
  let previous = 0;
  for (const heading of headings) {
    if (previous && heading.level > previous + 1) {
      errors.push(`heading level jumps from h${previous} to h${heading.level}: "${heading.text}"`);
    }
    previous = heading.level;
  }
  return errors;
}

/** Extract the SEO signals that matter from an unhydrated HTML response. */
export function extractSeoSignals(html, { url }) {
  const pathname = new URL(url).pathname;
  const locale = localeFromPath(pathname);
  const titleContent = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title = titleContent ? decodeEntities(collapse(titleContent)) : null;
  let description = null;
  let canonical = null;
  let robots = null;

  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1]);
    const name = (attrs.name ?? attrs.property ?? "").toLowerCase();
    if (name === "description" && attrs.content) description = attrs.content;
    if (name === "robots" && attrs.content) robots = attrs.content;
  }
  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1]);
    if ((attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical") && attrs.href) {
      canonical = attrs.href;
    }
  }

  const headings = [];
  for (const match of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = collapse(match[2].replace(/<[^>]+>/g, " "));
    if (text) headings.push({ level: Number(match[1]), text: decodeEntities(text) });
  }

  const jsonLd = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/application\/ld\+json/i.test(match[1])) continue;
    try {
      const parsed = JSON.parse(decodeEntities(match[2].trim()));
      const nodes = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
      const types = nodes.flatMap((node) => {
        const value = node?.["@type"];
        return Array.isArray(value) ? value : value ? [value] : [];
      });
      jsonLd.push({ valid: true, types, data: parsed });
    } catch (error) {
      jsonLd.push({ valid: false, error: error.message, data: null });
    }
  }

  const images = [];
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    images.push(parseAttributes(match[1]));
  }
  const links = [];
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1]);
    if (attrs.href) links.push(attrs.href);
  }

  const text = visibleText(html);
  return {
    url,
    pathname,
    locale,
    title: title ? decodeEntities(collapse(title)) : null,
    description,
    canonical,
    robots,
    headings,
    jsonLd,
    images,
    links,
    prose: proseText(html),
    wordCount: contentLength(text, locale),
    hasFaq: /<details\b/i.test(html),
  };
}
