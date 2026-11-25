import { expect, test } from "@playwright/test";

test("unknown top-level routes return a real 404", async ({ request }) => {
  for (const path of ["/sitemap", "/sitemap_index.xml", "/nope"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text()).toContain("Page not found");
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
