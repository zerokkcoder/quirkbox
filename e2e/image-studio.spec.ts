import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

/** Build a tiny PNG in the browser so the fixture stays dependency-free. */
async function addPngFixture(page: Page, name = "sample.png", expectedCount = 1) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.fillStyle = "#3E5C9E";
    context.fillRect(0, 0, 16, 16);
    return canvas.toDataURL("image/png").split(",")[1];
  });

  await page.getByTestId("image-file-input").setInputFiles({
    name,
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await expect(page.getByTestId("image-job")).toHaveCount(expectedCount);
}

test("tool page exposes localized what/how copy", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Image Studio");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  await expect(page.getByText("Drop or paste images", { exact: false }).first()).toBeVisible();

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("Convert images");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/image-studio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("圖片格式轉換器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByText("把圖片拖到這裡", { exact: true })).toBeVisible();
  await expect(page.getByText("全部轉換", { exact: true })).toBeVisible();
});

test("changing the target format never triggers a render-phase Router update", async ({ page }) => {
  const renderErrors: string[] = [];
  const isRenderWarning = (text: string) =>
    /Cannot update a component|setstate-in-render/i.test(text);
  page.on("console", (message) => {
    if (message.type() === "error" && isRenderWarning(message.text())) renderErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (isRenderWarning(error.message)) renderErrors.push(error.message);
  });

  await page.goto("/tools/image-studio");
  await page.getByTestId("image-format-jpeg").click();

  // Wait for the click's state + URL sync to commit before inspecting console output.
  await expect(page.getByTestId("image-format-jpeg")).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/format=jpeg/);
  expect(renderErrors).toEqual([]);
});

test("URL parameters restore the exact settings", async ({ page }) => {
  await page.goto("/tools/image-studio?format=jpeg&quality=70");
  await expect(page.getByTestId("image-format-jpeg")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("image-quality")).toHaveValue("70");

  await page.reload();
  await expect(page.getByTestId("image-format-jpeg")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("image-quality")).toHaveValue("70");
});

test("the preview converts on its own, without pressing Convert all", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await addPngFixture(page);

  await expect(page.getByTestId("image-preview")).toBeVisible();
  await expect(page.getByTestId("image-job")).toContainText("Done");
  await expect(page.getByTestId("image-preview-download")).toBeEnabled();

  // Changing the format re-runs the preview for the selected image.
  await page.getByTestId("image-format-png").click();
  await expect(page.getByTestId("image-job")).toContainText("Done");
  await expect(page.getByTestId("image-preview-download")).toBeEnabled();
});

test("converts a PNG to WebP with a valid RIFF/WEBP header", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await addPngFixture(page);
  await page.getByTestId("image-format-webp").click();
  await page.getByTestId("image-convert-all").click();

  await expect(page.getByTestId("image-job")).toContainText("Done");
  const download = page.waitForEvent("download");
  await page.getByTestId("image-job").getByRole("button", { name: "Download" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("sample-webp.webp");

  const bytes = await readFile(await file.path());
  expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
});

test("batch conversion produces a ZIP containing every result", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await addPngFixture(page, "one.png");
  await addPngFixture(page, "two.png", 2);
  await addPngFixture(page, "three.png", 3);
  await expect(page.getByTestId("image-job")).toHaveCount(3);

  await page.getByTestId("image-convert-all").click();
  await expect(page.getByTestId("image-job")).toHaveCount(3);
  await expect(page.getByTestId("image-download-all")).toBeEnabled();

  const download = page.waitForEvent("download");
  await page.getByTestId("image-download-all").click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("starrudder-images-3.zip");

  const bytes = await readFile(await file.path());
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  expect(bytes.includes(Buffer.from("one-webp.webp"))).toBe(true);
  expect(bytes.includes(Buffer.from("three-webp.webp"))).toBe(true);
});

test("works with all external requests blocked", async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
    return route.abort();
  });

  await page.goto("/tools/image-studio");
  await addPngFixture(page);
  await page.getByTestId("image-convert-all").click();
  await expect(page.getByTestId("image-job")).toContainText("Done");
});

test("returning to an already converted image keeps its preview alive", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await addPngFixture(page, "one.png");
  await addPngFixture(page, "two.png", 2);
  await page.getByTestId("image-convert-all").click();
  await expect(page.getByTestId("image-job").first()).toContainText("Done");

  // Hop between jobs: each switch used to revoke the previous job's blob URL,
  // so clicking back rendered a broken image inside the preview panel.
  await page.getByRole("button", { name: "Preview two.png" }).click();
  await page.getByRole("button", { name: "Preview one.png" }).click();

  const imageLoaded = await page
    .getByTestId("image-preview")
    .evaluate((node) => {
      const image = node as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    });
  expect(imageLoaded).toBe(true);
});

test("the add-more tile matches the height of an image card", async ({ page }) => {
  await page.goto("/tools/image-studio");
  await addPngFixture(page);

  // Measure the grid items (the <li>s), not the button inside the tile: the
  // tile's 2px dashed border would otherwise read as a 4px shortfall.
  const heights = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="image-job"]');
    const tile = document.querySelector('[data-testid="image-add-more"]')?.closest("li");
    if (!card || !tile) return null;
    return { card: card.getBoundingClientRect().height, tile: tile.getBoundingClientRect().height };
  });

  expect(heights).not.toBeNull();
  expect(Math.abs((heights?.tile ?? 0) - (heights?.card ?? 0))).toBeLessThanOrEqual(1);
});
