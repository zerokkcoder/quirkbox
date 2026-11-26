import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("tool page exposes localized what/how copy", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("QR Code Generator");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  await expect(page.getByText("Type text or paste a URL", { exact: false }).first()).toBeVisible();

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("scannable QR codes");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/qr-code-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("QR 碼產生器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("qr-input-heading")).toHaveText("內容");
});

test("typing content renders a live QR preview", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  const canvas = page.getByTestId("qr-preview-canvas");
  await expect(canvas).toBeVisible();

  await page.getByTestId("qr-text").fill("https://example.com/signup");
  await expect(canvas).toBeVisible();
  const painted = await canvas.evaluate((node) => {
    const context = (node as HTMLCanvasElement).getContext("2d");
    if (!context) return false;
    const data = context.getImageData(0, 0, (node as HTMLCanvasElement).width, (node as HTMLCanvasElement).height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128) return true;
    }
    return false;
  });
  expect(painted).toBe(true);
});

test("changing style never triggers a render-phase Router update", async ({ page }) => {
  const renderErrors: string[] = [];
  const isRenderWarning = (text: string) =>
    /Cannot update a component|setstate-in-render/i.test(text);
  page.on("console", (message) => {
    if (message.type() === "error" && isRenderWarning(message.text())) renderErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (isRenderWarning(error.message)) renderErrors.push(error.message);
  });

  await page.goto("/tools/qr-code-generator");
  await page.getByTestId("qr-level-H").click();
  await expect(page.getByTestId("qr-level-H")).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/ec=H/);
  expect(renderErrors).toEqual([]);
});

test("URL parameters restore the exact settings", async ({ page }) => {
  await page.goto("/tools/qr-code-generator?ec=Q&size=256&dots=rounded&alpha=1");
  await expect(page.getByTestId("qr-level-Q")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("qr-size-256")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("qr-dots-rounded")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("qr-transparent-on")).toHaveAttribute("aria-pressed", "true");
});

test("downloads a real PNG and a standalone SVG", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await page.getByTestId("qr-text").fill("https://starrudder.cc");

  const pngDownload = page.waitForEvent("download");
  await page.getByTestId("qr-download-png").click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  const pngBytes = await readFile(await png.path());
  expect(pngBytes.subarray(1, 4).toString()).toBe("PNG");

  const svgDownload = page.waitForEvent("download");
  await page.getByTestId("qr-download-svg").click();
  const svg = await svgDownload;
  expect(svg.suggestedFilename()).toMatch(/\.svg$/);
  const svgText = await readFile(await svg.path(), "utf8");
  expect(svgText).toContain("<svg");
  expect(svgText).toContain("xmlns");
});

test("warns on low contrast and over-capacity content", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await page.getByTestId("qr-foreground-hex").fill("#ffffff");
  await expect(page.getByTestId("qr-warning")).toContainText("Low contrast");

  await page.getByTestId("qr-text").fill("x".repeat(3000));
  await expect(page.getByTestId("qr-warning")).toContainText("too long");
});

test("share link keeps the entered text after a reload", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await page.getByTestId("qr-text").fill("星舵工坊 航海");
  await expect(page).toHaveURL(/text=/);
  const url = page.url();
  await page.goto(url);
  await expect(page.getByTestId("qr-text")).toHaveValue("星舵工坊 航海");
});

test("works with all external requests blocked", async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
    return route.abort();
  });

  await page.goto("/tools/qr-code-generator");
  await page.getByTestId("qr-text").fill("offline");
  await expect(page.getByTestId("qr-preview-canvas")).toBeVisible();
});
