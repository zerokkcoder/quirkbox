import { expect, test } from "@playwright/test";

const swatches = (page: import("@playwright/test").Page) =>
  page.locator('[data-testid^="palette-swatch-"]');

test("palette studio generates and restyles swatches", async ({ page }) => {
  await page.goto("/tools/palette-studio");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Palette Studio");
  await expect(swatches(page)).toHaveCount(5);

  const initial = await swatches(page).first().getAttribute("style");

  await page.getByTestId("palette-seed-input").fill("#ff0000");
  await expect(swatches(page).first()).not.toHaveAttribute("style", initial ?? "");

  const afterSeed = await swatches(page).first().getAttribute("style");
  await page.getByTestId("palette-harmony-complementary").click();
  await expect(swatches(page).first()).not.toHaveAttribute("style", afterSeed ?? "");

  await page.getByTestId("palette-count").press("Home");
  await expect(swatches(page)).toHaveCount(3);
});

test("color-blind simulation changes the preview without changing state", async ({ page }) => {
  await page.goto("/tools/palette-studio?color=ff0000&harmony=triadic&count=4");

  const before = await swatches(page).first().getAttribute("style");
  await page.getByTestId("palette-simulation-deuteranopia").click();
  await expect(swatches(page).first()).not.toHaveAttribute("style", before ?? "");

  await expect(page).toHaveURL(/color=ff0000/);
  await expect(page).toHaveURL(/harmony=triadic/);
});

test("copy and share actions report feedback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/palette-studio");

  await page.getByRole("button", { name: "Copy CSS" }).click();
  await expect(page.getByTestId("palette-feedback")).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("--palette-1:");

  await page.getByRole("button", { name: "Copy link" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("palette-studio?color=");
});

test("URL state reproduces an exact palette", async ({ page }) => {
  await page.goto("/tools/palette-studio?color=ff00ff&harmony=mono&count=6");

  await expect(page.getByTestId("palette-seed-input")).toHaveValue("#ff00ff");
  await expect(swatches(page)).toHaveCount(6);

  const first = await swatches(page).first().getAttribute("style");
  await page.reload();
  await expect(swatches(page).first()).toHaveAttribute("style", first ?? "");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/palette-studio");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("配色方案生成器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("palette-seed-input")).toBeVisible();
  await expect(page.getByText("決定其他顏色與種子色的關係。", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "複製 CSS" })).toBeVisible();
});

test("style presets apply instantly and survive a reload", async ({ page }) => {
  await page.goto("/tools/palette-studio");

  await page.getByTestId("palette-preset-tech").click();
  await expect(page.getByTestId("palette-feedback")).toHaveText("Applied: Tech");
  await expect(page).toHaveURL(/preset=tech/);

  await expect(swatches(page).first()).toHaveCSS("background-color", "rgb(37, 99, 235)");

  await page.reload();
  await expect(swatches(page).first()).toHaveCSS("background-color", "rgb(37, 99, 235)");
});

test("fine-tuning a preset falls back to generated colors", async ({ page }) => {
  await page.goto("/tools/palette-studio?preset=tech");

  const before = await swatches(page).first().getAttribute("style");
  await page.getByTestId("palette-harmony-mono").click();

  await expect(swatches(page).first()).not.toHaveAttribute("style", before ?? "");
  await expect(page).not.toHaveURL(/preset=/);
});

test("copy all hex values takes one click", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/palette-studio");

  await page.getByRole("button", { name: "Copy all hex" }).click();
  await expect(page.getByTestId("palette-feedback")).toHaveText("Copied");

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.split("\n")).toHaveLength(5);
  expect(copied).toMatch(/^#[0-9a-f]{6}/);
});

test("preset labels are localized on the Traditional Chinese route", async ({ page }) => {
  await page.goto("/zh-Hant/tools/palette-studio");

  await expect(page.getByRole("button", { name: "科技風" })).toBeVisible();
  await page.getByRole("button", { name: "科技風" }).click();
  await expect(page.getByTestId("palette-feedback")).toHaveText("已套用：科技風");
});
