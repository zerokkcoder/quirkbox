import { expect, test } from "@playwright/test";

const path = "/tools/unix-timestamp-converter";
const toolUrl = "https://starrudder.cc/tools/unix-timestamp-converter";

// navigator.clipboard.writeText needs an explicit grant in headless Chromium.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("shows a result on load and copies it in one click", async ({ page }) => {
  await page.goto(path);

  // The value is filled inside an effect (client-only), never from SSR.
  await expect(page.getByTestId("ts-input")).not.toHaveValue("");
  const seconds = page.getByTestId("ts-value-seconds");
  await expect(seconds).toBeVisible();
  await expect(seconds).not.toHaveText("");

  // Zero-decision design: there is no "Convert" button to press first.
  await expect(page.getByRole("button", { name: /convert/i })).toHaveCount(0);

  await page.getByTestId("ts-copy-seconds").click();
  await expect(page.getByTestId("ts-feedback")).toContainText("Copied to clipboard.");
});

test("exposes SEO copy and localises to Traditional Chinese", async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unix Timestamp Converter");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description?.length ?? 0).toBeGreaterThan(70);

  await page.goto("/zh-Hant/tools/unix-timestamp-converter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unix 時間戳轉換器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("ts-input")).not.toHaveValue("");
});

test("detects all four units and lets the user override detection", async ({ page }) => {
  await page.goto(path);
  const input = page.getByTestId("ts-input");
  const detected = page.getByTestId("ts-detected");

  await input.fill("1800000000");
  await expect(detected).toContainText("Seconds");
  await expect(page.getByTestId("ts-value-iso")).toHaveText("2027-01-15T08:00:00Z");

  await input.fill("1800000000000");
  await expect(detected).toContainText("Milliseconds");

  await input.fill("1800000000000000");
  await expect(detected).toContainText("Microseconds");

  await input.fill("1800000000000000000");
  await expect(detected).toContainText("Nanoseconds");

  // A manual override changes the interpretation, not only the label.
  await input.fill("1800000000");
  await expect(page.getByTestId("ts-unit-hint")).toBeVisible();
  await page.getByTestId("ts-unit").selectOption("milliseconds");
  await expect(detected).toContainText("Milliseconds");
  await expect(page.getByTestId("ts-value-seconds")).toHaveText("1800000");
  await expect(page.getByTestId("ts-unit-hint")).toHaveCount(0);
});

test("parses offset-bearing ISO dates and rejects ambiguous input", async ({ page }) => {
  await page.goto(path);
  const input = page.getByTestId("ts-input");

  await input.fill("2026-01-01T00:00:00Z");
  await expect(page.getByTestId("ts-detected")).toContainText("ISO 8601");
  await expect(page.getByTestId("ts-value-iso")).toHaveText("2026-01-01T00:00:00Z");

  await input.fill("2026-01-01T00:00:00+08:00");
  await expect(page.getByTestId("ts-value-iso")).toHaveText("2025-12-31T16:00:00Z");

  for (const bad of [
    "2026-01-01 09:00",
    "01/02/2026",
    "2026-01-01T00:00:00",
    "not-a-date",
  ]) {
    await input.fill(bad);
    await expect(page.getByTestId("ts-error")).toContainText("not a Unix timestamp");
    await expect(page.getByTestId("ts-value-iso")).toHaveCount(0);
  }

  await input.fill("");
  await expect(page.getByTestId("ts-error")).toContainText("Paste a Unix timestamp");
});

test("handles negative timestamps, the 2038 boundary and out-of-range values", async ({ page }) => {
  await page.goto(path);
  const input = page.getByTestId("ts-input");

  await input.fill("-2208988800");
  await expect(page.getByTestId("ts-value-iso")).toHaveText("1900-01-01T00:00:00Z");
  await expect(page.getByTestId("ts-negative-hint")).toContainText("before 1970");
  await expect(page.getByTestId("ts-negative-hint")).toBeVisible();

  await input.fill("2147483647");
  await expect(page.getByTestId("ts-2038-hint")).toContainText("2038-01-19");

  await input.fill("100000000000000000000");
  await expect(page.getByTestId("ts-error")).toContainText("outside the supported range");
  await expect(page.getByTestId("ts-value-iso")).toHaveCount(0);
});

test("changing the time zone only changes the displayed local row", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("ts-input").fill("1800000000");

  const utcBefore = await page.getByTestId("ts-value-utc").textContent();
  const isoBefore = await page.getByTestId("ts-value-iso").textContent();
  const localBefore = await page.getByTestId("ts-value-local").textContent();

  // The full, searchable, area-grouped picker replaces the short dropdown and
  // the manual IANA input entirely.
  await expect(page.getByTestId("ts-zone-custom")).toHaveCount(0);
  await expect(page.getByTestId("ts-zone-apply")).toHaveCount(0);
  await page.getByTestId("ts-zone-search").click();
  await expect(page.getByRole("group", { name: "Asia" })).toBeVisible();

  await page.getByTestId("ts-zone-search").fill("Tokyo");
  await expect(page.getByRole("option", { name: "Asia/Tokyo" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Europe/London" })).toHaveCount(0);
  await page.getByRole("option", { name: "Asia/Tokyo" }).click();

  await expect(page.getByTestId("ts-value-local")).toContainText("Asia/Tokyo");
  await expect(page.getByTestId("ts-value-local")).not.toHaveText(localBefore ?? "");
  await expect(page.getByTestId("ts-value-utc")).toHaveText(utcBefore ?? "");
  await expect(page.getByTestId("ts-value-iso")).toHaveText(isoBefore ?? "");
});

test("copies rows independently and expands more formats", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("ts-input").fill("1800000000");

  await expect(page.getByTestId("ts-row-rfc")).toBeHidden();
  await page.getByTestId("ts-more-toggle").click();
  await expect(page.getByTestId("ts-row-rfc")).toBeVisible();
  await expect(page.getByTestId("ts-value-microseconds")).toHaveText("1800000000000000");
  await expect(page.getByTestId("ts-value-nanoseconds")).toHaveText("1800000000000000000");

  await page.getByTestId("ts-copy-rfc").click();
  await expect(page.getByTestId("ts-feedback")).toContainText("Copied to clipboard.");

  // Every control keeps the stable ts- prefix.
  await expect(page.getByTestId("ts-input")).toBeVisible();
  await expect(page.getByTestId("ts-unit")).toBeVisible();
  await expect(page.getByTestId("ts-zone")).toBeVisible();
});

test("keeps the input in a shareable hash fragment, never a query", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("ts-input").fill("1800000000");

  await expect(page).toHaveURL(/#v=1800000000$/);
  expect(new URL(page.url()).search).toBe("");

  await page.reload();
  await expect(page.getByTestId("ts-input")).toHaveValue("1800000000");

  // Capture the X intent without opening a real network tab.
  await page.evaluate(() => {
    const holder = window as unknown as Record<string, unknown>;
    holder.__opened = [];
    holder.open = (target?: string | URL) => {
      (holder.__opened as string[]).push(String(target ?? ""));
      return null;
    };
  });

  await page.getByRole("button", { name: "Share to X" }).click();

  const opened = await page.evaluate(() => {
    const holder = window as unknown as Record<string, unknown>;
    return Array.isArray(holder.__opened) ? (holder.__opened as string[]) : [];
  });
  expect(opened).toHaveLength(1);
  expect(new URL(opened[0]).searchParams.get("url")).toBe(toolUrl);
  expect(new URL(opened[0]).searchParams.get("url")).not.toContain("#");
});

test("serves the Traditional Chinese route without hydration warnings", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    const text = message.text();
    if (
      /hydrat|did not match|server rendered|setstate-in-render|text content does not match/i.test(
        text
      )
    ) {
      problems.push(text);
    }
  });
  page.on("pageerror", (error) => problems.push(error.message));

  const response = await page.goto("/zh-Hant/tools/unix-timestamp-converter");
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("ts-input")).not.toHaveValue("");
  expect(problems).toEqual([]);
});
