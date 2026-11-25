#!/usr/bin/env node
/**
 * Two-stage SSR SEO gate adapted from:
 * https://dev.to/tarotfortunecards/how-i-built-a-pre-merge-ssr-seo-audit-gate-for-nextjs-16-content-pages-271i
 *
 * Stage 1 (static repo): sitemap route coverage, protected title/description/h1
 * snapshot, template overlap, above-the-fold asset rules.
 * Stage 2 (raw SSR HTML): served HTML from a local production build (or a
 * preview URL via --url) is checked before React hydration.
 *
 * Usage:
 *   node scripts/seo-audit.mjs [--url https://preview.example] [--skip-build]
 *                              [--strict] [--update-baseline] [--port 4100]
 */

import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_RULES,
  checkHeadingHierarchy,
  extractSeoSignals,
  pairwiseOverlap,
} from "./seo-audit-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "scripts", "seo-baseline.json");

function readArgs(argv) {
  const args = { url: null, port: Number(process.env.SEO_AUDIT_PORT ?? 4100) };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].split("=", 2);
    if (flag === "--url") args.url = inline ?? argv[++i];
    if (flag === "--port") args.port = Number(inline ?? argv[++i]);
    if (flag === "--skip-build") args.skipBuild = true;
    if (flag === "--strict") args.strict = true;
    if (flag === "--update-baseline") args.updateBaseline = true;
  }
  if (process.env.SEO_AUDIT_SKIP_BUILD === "1") args.skipBuild = true;
  if (process.env.SEO_AUDIT_URL) args.url = process.env.SEO_AUDIT_URL;
  return args;
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: root,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      env: process.env,
    });
    let output = "";
    if (options.capture) {
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
    }
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolvePromise(output) : reject(new Error(`${command} exited with ${code}\n${output}`))
    );
  });
}

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function pathOf(value) {
  try {
    return new URL(value).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return value;
  }
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 45_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`next start exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/robots.txt`);
      if (response.ok) return;
      lastError = new Error(`robots.txt returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((done) => setTimeout(done, 400));
  }
  throw new Error(`server at ${baseUrl} did not become ready: ${lastError?.message}`);
}

async function expectedRoutes() {
  const [sitemapSource, siteSource] = await Promise.all([
    readFile(join(root, "src/app/sitemap.ts"), "utf8"),
    readFile(join(root, "src/config/site.ts"), "utf8"),
  ]);
  const routesBlock = sitemapSource.match(/const routes = \[([\s\S]*?)\];/)?.[1] ?? "";
  const routes = [...routesBlock.matchAll(/"(\/[^"]*)"/g)].map((match) => match[1]);
  const localesBlock = siteSource.match(/locales:\s*\[([^\]]+)\]/)?.[1] ?? "";
  const locales = [...localesBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  return { routes, locales };
}

async function collect() {
  const args = readArgs(process.argv.slice(2));
  const errors = [];
  const warnings = [];
  let server = null;
  let baseUrl = args.url;

  try {
    if (!args.skipBuild && !args.url) {
      console.log("→ Building production bundle for the SSR audit…");
      await run(process.execPath, ["node_modules/next/dist/bin/next", "build"]);
    }

    if (!baseUrl) {
      baseUrl = `http://127.0.0.1:${args.port}`;
      server = spawn(
        process.execPath,
        ["node_modules/next/dist/bin/next", "start", "-p", String(args.port)],
        { cwd: root, env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] }
      );
      server.stderr.on("data", (chunk) => process.stderr.write(chunk));
      await waitForServer(baseUrl, server);
    }

    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    if (!sitemapResponse.ok) {
      errors.push(`sitemap.xml returned HTTP ${sitemapResponse.status}`);
      return { args, errors, warnings, pages: [] };
    }
    const sitemapXml = await sitemapResponse.text();
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) =>
      normalizeUrl(match[1])
    );
    if (sitemapUrls.length === 0) errors.push("sitemap.xml contains no <loc> entries");

    const sitemapSet = new Set(sitemapUrls);
    const { routes, locales } = await expectedRoutes();
    const siteSource = await readFile(join(root, "src/config/site.ts"), "utf8");
    const siteUrl = siteSource.match(/url:\s*process\.env\.NEXT_PUBLIC_SITE_URL\s*\?\?\s*"([^"]+)"/)?.[1];
    if (!siteUrl) {
      errors.push("could not resolve canonical site URL from src/config/site.ts");
    } else {
      for (const route of routes) {
        for (const locale of locales) {
          const pathname = locale === "en" ? route : `/${locale}${route === "/" ? "" : route}`;
          const expected = normalizeUrl(new URL(pathname, siteUrl).toString());
          if (!sitemapSet.has(expected)) errors.push(`missing sitemap entry: ${expected}`);
        }
      }
    }

    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    const robotsTxt = robotsResponse.ok ? await robotsResponse.text() : "";
    if (!robotsResponse.ok) errors.push(`robots.txt returned HTTP ${robotsResponse.status}`);
    if (!/^Sitemap:\s*\S+/im.test(robotsTxt)) errors.push("robots.txt does not declare a Sitemap URL");
    if (/^Disallow:\s*\/\s*$/im.test(robotsTxt)) errors.push("robots.txt disallows the whole site");

    const pages = [];
    for (const canonicalUrl of sitemapUrls) {
      const fetchUrl = new URL(pathOf(canonicalUrl), baseUrl).toString();
      const response = await fetch(fetchUrl, { redirect: "follow" });
      const html = await response.text();
      const signals = extractSeoSignals(html, { url: canonicalUrl });
      if (response.status !== 200) errors.push(`${canonicalUrl}: HTTP ${response.status}`);
      if (!/StarRudder|星舵工坊/.test(html)) {
        errors.push(`${canonicalUrl}: SSR HTML does not contain the expected site name`);
      }
      pages.push({ ...signals, html });
    }

    // --- Stage 2: raw SSR head/body checks ---------------------------------
    const titles = new Map();
    const descriptions = new Map();
    for (const page of pages) {
      const label = page.pathname;
      if (!page.title) errors.push(`${label}: missing <title>`);
      if (!page.description) errors.push(`${label}: missing meta description`);
      if (!page.canonical) {
        errors.push(`${label}: missing rel="canonical"`);
      } else if (normalizeUrl(page.canonical) !== normalizeUrl(page.url)) {
        errors.push(`${label}: canonical ${page.canonical} does not match ${page.url}`);
      }
      if (/\bnoindex\b/i.test(page.robots ?? "")) errors.push(`${label}: robots meta contains noindex`);

      if (page.title) {
        const [min, max] = SEO_RULES.titleLength[page.locale];
        if (page.title.length < min || page.title.length > max) {
          warnings.push(`${label}: title length ${page.title.length} outside ${min}-${max}`);
        }
        if (titles.has(page.title)) errors.push(`${label}: duplicate title with ${titles.get(page.title)}`);
        else titles.set(page.title, label);
      }
      if (page.description) {
        const [min, max] = SEO_RULES.descriptionLength[page.locale];
        if (page.description.length < min || page.description.length > max) {
          warnings.push(`${label}: description length ${page.description.length} outside ${min}-${max}`);
        }
        if (descriptions.has(page.description)) {
          errors.push(`${label}: duplicate description with ${descriptions.get(page.description)}`);
        } else descriptions.set(page.description, label);
      }

      for (const problem of checkHeadingHierarchy(page.headings)) errors.push(`${label}: ${problem}`);

      const minimum = SEO_RULES.minVisibleWords[page.locale];
      if (page.wordCount < minimum) {
        warnings.push(`${label}: only ${page.wordCount} visible words (minimum ${minimum})`);
      }

      if (page.jsonLd.some((block) => !block.valid)) {
        errors.push(`${label}: invalid JSON-LD (${page.jsonLd.find((block) => !block.valid).error})`);
      }
      if (page.jsonLd.length === 0) errors.push(`${label}: no JSON-LD block in SSR HTML`);
      if (page.hasFaq && !page.jsonLd.some((block) => block.types?.includes("FAQPage"))) {
        errors.push(`${label}: FAQ markup present but no FAQPage JSON-LD`);
      }

      for (const image of page.images) {
        if (image.loading === "lazy") errors.push(`${label}: above-the-fold image uses loading="lazy"`);
        if (!image.width || !image.height) errors.push(`${label}: image ${image.src ?? ""} lacks width/height`);
      }
    }

    // --- Stage 1: static repo checks ---------------------------------------
    const overlap = pairwiseOverlap(
      Object.fromEntries(pages.map((page) => [page.pathname, { text: page.prose, locale: page.locale }]))
    );
    for (const item of overlap) {
      errors.push(`template overlap ${item.a} ↔ ${item.b}: ${item.overlap}% >= 15%`);
    }

    const inboundTargets = pages.filter((page) => page.pathname !== "/");
    for (const target of inboundTargets) {
      const hasInbound = pages.some(
        (source) =>
          source.pathname !== target.pathname &&
          source.links.some((href) => {
            try {
              return normalizeUrl(new URL(href, source.url).toString()) === normalizeUrl(target.url);
            } catch {
              return false;
            }
          })
      );
      if (!hasInbound) errors.push(`${target.pathname}: no inbound link from another page`);
    }

    for (const page of pages) {
      for (const image of page.images) {
        if (!image.src || !image.src.startsWith("/")) continue;
        const file = join(root, "public", decodeURIComponent(image.src.split("?")[0]));
        if (!existsSync(file)) {
          errors.push(`${page.pathname}: referenced local image does not exist: ${image.src}`);
          continue;
        }
        const bytes = (await stat(file)).size;
        if (!/\.webp$/i.test(file)) errors.push(`${image.src}: primary visual must be WebP`);
        if (bytes > SEO_RULES.heroImageMaxBytes) {
          errors.push(`${image.src}: ${Math.round(bytes / 1024)} KB exceeds 60 KB cap`);
        }
      }
    }

    const snapshot = Object.fromEntries(
      pages.map((page) => [
        normalizeUrl(page.url),
        { title: page.title, description: page.description, h1: page.headings.filter((h) => h.level === 1).map((h) => h.text) },
      ])
    );
    if (args.updateBaseline) {
      await writeFile(baselinePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
      console.log(`→ Baseline updated: ${baselinePath}`);
    } else if (existsSync(baselinePath)) {
      const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
      for (const [url, current] of Object.entries(snapshot)) {
        const previous = baseline[url];
        if (!previous) {
          warnings.push(`${url}: not in SEO baseline (run --update-baseline to protect it)`);
          continue;
        }
        for (const field of ["title", "description"]) {
          if (previous[field] !== current[field]) {
            errors.push(`${url}: protected ${field} changed: "${previous[field]}" → "${current[field]}"`);
          }
        }
        if (JSON.stringify(previous.h1) !== JSON.stringify(current.h1)) {
          errors.push(`${url}: protected <h1> changed: "${previous.h1}" → "${current.h1}"`);
        }
      }
    } else {
      warnings.push("no SEO baseline found; run npm run seo:audit:baseline to create one");
    }

    return { args, errors, warnings, pages };
  } catch (error) {
    errors.push(process.env.SEO_AUDIT_DEBUG === "1" ? error.stack : error.message);
    return { args, errors, warnings, pages: [] };
  } finally {
    if (server && server.exitCode === null) server.kill("SIGTERM");
  }
}

const result = await collect();
const failed = result.errors.length > 0 || (result.args.strict && result.warnings.length > 0);
console.log(`\nSSR SEO audit: ${result.pages.length} routes checked`);
for (const warning of result.warnings) console.log(`  WARN  ${warning}`);
for (const error of result.errors) console.log(`  FAIL  ${error}`);
console.log(
  failed
    ? `\n✗ SEO gate failed (${result.errors.length} errors, ${result.warnings.length} warnings)`
    : `\n✓ SEO gate passed (${result.warnings.length} warnings)`
);
process.exit(failed ? 1 : 0);
