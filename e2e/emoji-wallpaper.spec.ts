import { expect, test, type Locator, type Page } from "@playwright/test";

/** Minimum PNG byte size that proves the canvas actually painted pixels. */
const drawnBytesThreshold = 1000;
/** Flat single-colour silhouettes compress much smaller, so accept a lower floor. */
const monoDrawnBytesThreshold = 500;

async function readCanvasPngBytes(canvas: Locator) {
  return canvas.evaluate(
    (element: HTMLCanvasElement) =>
      new Promise<number>((resolve) => {
        element.toBlob((blob) => resolve(blob ? blob.size : 0), "image/png");
      })
  );
}

async function expectCanvasDrawn(canvas: Locator, minBytes = drawnBytesThreshold) {
  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(minBytes);
}

/** Palette, colour mode, density, format and seed all live behind the advanced toggle. */
async function openAdvancedOptions(page: Page) {
  const trigger = page.getByRole("button", { name: "Advanced options" });

  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
}

test("renders an emoji wallpaper on the canvas", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");

  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(1000);
});

test("redraws after changing the arrangement and the ratio", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");

  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(1000);
  const initialBytes = await readCanvasPngBytes(canvas);
  const initialAspect = await canvas.evaluate((element: HTMLCanvasElement) => element.width / element.height);

  // Switching the arrangement triggers a repaint; the pixel content should change.
  await page.getByRole("button", { name: "Scatter" }).click();
  await expect
    .poll(async () => (await readCanvasPngBytes(canvas)) !== initialBytes, { timeout: 10000 })
    .toBe(true);
  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(1000);

  // Switching the aspect ratio resizes the canvas and repaints.
  await page.getByRole("button", { name: "9:19.5" }).click();
  await expect
    .poll(
      async () => {
        const aspect = await canvas.evaluate((element: HTMLCanvasElement) => element.width / element.height);
        return Math.abs(aspect - initialAspect) > 1e-2;
      },
      { timeout: 10000 }
    )
    .toBe(true);
  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(1000);
});

test("downloads a png wallpaper", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^quirkbox-emoji-wallpaper-9x16-.+\.png$/);
});

test("draws content for every arrangement", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");
  await expectCanvasDrawn(canvas);

  for (const arrangement of ["Grid", "Brick", "Wave", "Scatter"]) {
    await page.getByRole("button", { name: arrangement, exact: true }).click();
    await expectCanvasDrawn(canvas);
  }
});

test("draws content for every aspect ratio", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");
  await expectCanvasDrawn(canvas);

  for (const ratio of ["9:16", "9:19.5", "9:20", "16:9 landscape"]) {
    await page.getByRole("button", { name: ratio, exact: true }).click();
    await expectCanvasDrawn(canvas);
  }

  // Restore the default ratio so the canvas ends where a fresh page would start.
  await page.getByRole("button", { name: "9:16", exact: true }).click();
  await expectCanvasDrawn(canvas);
});

test("draws content for every emoji color mode", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");
  await expectCanvasDrawn(canvas);

  await openAdvancedOptions(page);

  await page.getByRole("button", { name: "Colorful", exact: true }).click();
  await expectCanvasDrawn(canvas);

  await page.getByRole("button", { name: "Single color", exact: true }).click();
  await expectCanvasDrawn(canvas, monoDrawnBytesThreshold);
});

test("picking emoji overrides the themed set", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");
  await expectCanvasDrawn(canvas);
  const initialBytes = await readCanvasPngBytes(canvas);

  await page.getByRole("button", { name: "Browse emoji" }).click();

  const library = page.getByTestId("emoji-library");
  await expect(library).toBeVisible();

  // The picker renders a hidden row to measure row height, so skip invisible cells.
  const firstEmoji = library.locator("button:visible").first();
  await firstEmoji.click();

  const clearButton = page.getByRole("button", { name: "Clear" });
  await expect(clearButton).toBeVisible();

  await expect
    .poll(
      async () => {
        const bytes = await readCanvasPngBytes(canvas);
        return bytes > drawnBytesThreshold && bytes !== initialBytes;
      },
      { timeout: 10000 }
    )
    .toBe(true);

  // Clearing the custom picks falls back to the themed set and repaints again.
  await clearButton.click();
  await expect(clearButton).toBeHidden();
  await expectCanvasDrawn(canvas);
});

test("keeps the preview on screen while the page scrolls", async ({ page }) => {
  await page.goto("/tools/emoji-wallpaper");

  const canvas = page.locator("canvas");
  await expectCanvasDrawn(canvas);

  const viewportHeight = page.viewportSize()!.height;
  const initialTop = (await canvas.boundingBox())!.y;

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // The preview docks under the sticky header instead of scrolling off the top of the page.
  await expect
    .poll(
      async () => {
        const box = await canvas.boundingBox();
        return box ? box.y > 0 && box.y + box.height <= viewportHeight : false;
      },
      { timeout: 10000 }
    )
    .toBe(true);

  // The page really did scroll past where the preview started.
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(initialTop);
});
