import { expect, test, type Locator } from "@playwright/test";

async function expectNoScroll(element: Locator) {
  const metrics = await element.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
}

test("tool page exposes localized what/how copy", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ASCII Art Generator");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  await expect(page.getByTestId("ascii-input-heading")).toBeVisible();

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("ASCII art");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/ascii-art-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ASCII 藝術產生器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("ascii-font")).toBeVisible();
  await expect(page.getByText("字型風格", { exact: true }).first()).toBeVisible();
});

test("renders a live ASCII preview with the default text", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");
  const preview = page.getByTestId("ascii-preview");
  await expect(preview).toBeVisible();
  await expect(preview.locator("pre")).toContainText("#");
  await expectNoScroll(preview);
});

test("typing text updates the preview and the URL", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");
  await page.getByTestId("ascii-text").fill("WORLD");
  await expect(page.getByTestId("ascii-preview").locator("pre")).toContainText("#");
  await expect(page).toHaveURL(/text=/);
});

test("changing font, spacing, alignment and background updates the result", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");

  await page.getByTestId("ascii-font-big").click();
  await expect(page).toHaveURL(/font=big/);

  await page.getByTestId("ascii-gap-3").click();
  await expect(page).toHaveURL(/gap=3/);

  await page.getByTestId("ascii-align-center").click();
  await expect(page).toHaveURL(/align=center/);

  const preview = page.getByTestId("ascii-preview");
  await expect(preview).toHaveAttribute("data-preview-background", "transparent");
  await page.getByTestId("ascii-background-space").click();
  await expect(page).toHaveURL(/bg=space/);
  await expect(preview).toHaveAttribute("data-preview-background", "space");
  await expect(preview).toHaveCSS("background-color", "rgb(15, 23, 41)");
});

test("unsupported characters are replaced with a question mark", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");
  await page.getByTestId("ascii-text").fill("中文");
  await expect(page.getByTestId("ascii-unsupported")).toContainText("中");
});

test("share link reproduces the exact art", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator?text=U1RBUlM&font=digital&gap=2&align=right&bg=mist");
  await expect(page.getByTestId("ascii-text")).toHaveValue("STARS");
  await expect(page.getByTestId("ascii-font-digital")).toHaveAttribute("data-state", "on");
  await expect(page.getByTestId("ascii-background-mist")).toHaveAttribute("data-state", "on");
});

test("copies plain text and downloads a PNG", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/ascii-art-generator?text=U1RBUlM");

  await page.getByTestId("ascii-copy").click();
  await expect(page.getByTestId("ascii-feedback")).toContainText("copied");

  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByTestId("ascii-download").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("starrudder-ascii-art-standard.png");
});

test("image mode converts a local image and exposes image controls", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator");
  await page.getByTestId("ascii-mode-image").click();
  await expect(page).toHaveURL(/mode=image/);

  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.fillStyle = "#000000";
    context.fillRect(0, 0, 8, 8);
    return canvas.toDataURL("image/png");
  });
  await page.getByTestId("ascii-image-input").setInputFiles({
    name: "ascii-pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1] ?? "", "base64"),
  });

  await expect(page.getByTestId("ascii-image-name")).toContainText("ascii-pixel.png");
  const preview = page.getByTestId("ascii-preview");
  await expect(preview.locator("pre")).toContainText("@");
  await expectNoScroll(preview);
  await expect(page.getByTestId("ascii-ramp")).toBeVisible();

  await page.getByTestId("ascii-ramp-braille").click();
  await expect(page.getByTestId("ascii-preview").locator("pre")).toContainText("⣿");

  await expect(page.getByTestId("ascii-color")).toHaveCount(0);
  const coloredChar = page.getByTestId("ascii-preview").locator("span[style]").first();
  await expect(coloredChar).toBeVisible();
  await expect(coloredChar).toHaveCSS("color", /rgb\(/);
  await expect(page.getByTestId("ascii-image-url")).toHaveCount(0);
});

test("supports Isometric2 font with vertical spacing and flip", async ({ page }) => {
  await page.goto("/tools/ascii-art-generator?text=U0FSUw&font=isometric2&vgap=2&flip=1");
  await expect(page.getByTestId("ascii-font-isometric2")).toHaveAttribute("data-state", "on");
  await expect(page.getByTestId("ascii-vgap-2")).toHaveAttribute("data-state", "on");
  await expect(page.getByTestId("ascii-flip")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("ascii-preview").locator("pre")).toContainText("/");
});

test("Traditional Chinese image mode stays localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/ascii-art-generator?mode=image");
  await expect(page.getByTestId("ascii-image-upload")).toContainText("選擇圖片");
  await expect(page.getByTestId("ascii-width")).toBeVisible();
  await expect(page.getByTestId("ascii-ramp-braille")).toContainText("點字");
});
