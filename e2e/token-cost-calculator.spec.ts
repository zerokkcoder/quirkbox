import { expect, test } from "@playwright/test";

const path = "/tools/token-cost-calculator";

test("shows all models with a default selection and a lowest-price highlight", async ({ page }) => {
  await page.goto(path);

  await expect(page.getByTestId("tcc-model-list")).toBeVisible();
  await expect(page.locator('[data-testid^="tcc-check-"]')).toHaveCount(20);
  await expect(page.getByTestId("tcc-card")).toHaveCount(6);
  await expect(page.getByTestId("tcc-lowest")).toBeVisible();
  await expect(page.getByTestId("tcc-lowest")).toContainText("$");
});

test("multi-select updates the comparison", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("tcc-clear").click();
  await expect(page.getByTestId("tcc-card")).toHaveCount(0);
  await expect(page.getByTestId("tcc-empty")).toBeVisible();

  await page.locator('[data-testid^="tcc-check-"]').first().check();
  await expect(page.getByTestId("tcc-card")).toHaveCount(1);

  await page.getByTestId("tcc-select-all").click();
  await expect(page.getByTestId("tcc-card")).toHaveCount(20);
});

test("exchange rate re-ranks CNY models against USD models", async ({ page }) => {
  await page.goto(path);
  // Prices load client-side; wait for the ranking before interacting.
  await expect(page.getByTestId("tcc-lowest")).toBeVisible();
  await page.getByTestId("tcc-clear").click();

  await page.locator('[data-testid^="tcc-check-"]').first().check();
  await page.locator('[data-testid^="tcc-check-"]').nth(15).check();

  const before = await page.getByTestId("tcc-lowest").textContent();
  await page.getByTestId("tcc-rate").fill("3");
  const after = await page.getByTestId("tcc-lowest").textContent();

  expect(after).not.toBe(before);
});

test("loads model prices from the same-origin rate file", async ({ page }) => {
  const rateRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/data/rates.json")) rateRequests.push(request.url());
  });

  await page.goto(path);
  await expect(page.getByTestId("tcc-updated")).toContainText("2026-11-28");

  expect(rateRequests.length).toBeGreaterThan(0);
  for (const url of rateRequests) {
    expect(new URL(url).origin).toBe(new URL(page.url()).origin);
  }
});

test("does not refetch prices on a second visit the same day", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/data/rates.json")) requests += 1;
  });

  await page.goto(path);
  await expect(page.getByTestId("tcc-updated")).toContainText("2026-11-28");
  const afterFirst = requests;

  await page.goto(path);
  await expect(page.getByTestId("tcc-updated")).toContainText("2026-11-28");
  expect(requests).toBe(afterFirst);
});

test("localises to Traditional Chinese", async ({ page }) => {
  await page.goto("/zh-Hant/tools/token-cost-calculator");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("模型價格比較器");
  await expect(page.getByTestId("tcc-model-list")).toBeVisible();
});

test("tool page ships server-rendered SEO copy", async ({ page }) => {
  const response = await page.goto(path);

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description?.length ?? 0).toBeGreaterThan(70);
});
