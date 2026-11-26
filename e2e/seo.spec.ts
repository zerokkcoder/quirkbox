import { expect, test } from "@playwright/test";

test("unknown top-level routes return a real English-only 404", async ({ request }) => {
  for (const path of ["/sitemap", "/sitemap_index.xml", "/nope"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");

    const body = await response.text();
    expect(body).toContain("Page not found");
    expect(body).not.toContain("找不到頁面");
    expect(body).toContain('<html lang="en">');
  }
});

test("unknown locale-prefixed routes return a real Traditional-Chinese-only 404", async ({ request }) => {
  for (const path of ["/zh-Hant/nope", "/zh-Hant/tools/nope"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");

    const body = await response.text();
    expect(body).toContain("找不到頁面");
    expect(body).not.toContain("Page not found");
    expect(body).not.toContain("Back to home");
    expect(body).toContain('<html lang="zh-Hant">');
  }
});

test("tool pages expose what/how copy and a keyword-rich meta description", async ({ page }) => {
  const cases = [
    { path: "/tools/random-name", title: "Random Name Generator", hint: "Choose a language" },
    { path: "/tools/pixel-avatar", title: "Pixel Avatar Maker", hint: "Pick a style and palette" },
    { path: "/tools/emoji-wallpaper", title: "Emoji Wallpaper Maker", hint: "Choose an emoji set" },
    { path: "/tools/travel-footprint", title: "Travel Footprint", hint: "Set home" },
    { path: "/tools/color-palette-generator", title: "Color Palette Generator", hint: "Start from a style preset" },
    { path: "/tools/image-converter", title: "Image Converter", hint: "Drop or paste images" },
    { path: "/tools/qr-code-generator", title: "QR Code Generator", hint: "Type text or paste a URL" },
    { path: "/tools/gradient-wallpaper-generator", title: "Gradient Wallpaper Generator", hint: "Color stops" },
  ];

  for (const item of cases) {
    await page.goto(item.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.title);
    await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
    await expect(page.getByText(item.hint, { exact: false }).first()).toBeVisible();

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0, item.path).toBeGreaterThan(70);
  }
});

test("sitemap.xml is stable XML with the same lastmod on every request", async ({ request }) => {
  const first = await request.get("/sitemap.xml");
  expect(first.status()).toBe(200);
  expect(first.headers()["content-type"]).toContain("xml");

  const firstBody = await first.text();
  expect(firstBody).toContain("<urlset");
  const lastmod = firstBody.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  expect(lastmod).toBeTruthy();

  const second = await request.get("/sitemap.xml");
  expect((await second.text()).match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]).toBe(lastmod);
});

test("/en redirects to the unprefixed default locale", async ({ request }) => {
  const response = await request.get("/en");
  expect(response.status()).toBe(200);
  expect(new URL(response.url()).pathname).toBe("/");
});
