import { expect, test } from "@playwright/test";

test("tool page exposes localized what/how copy", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gradient Wallpaper Generator");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  await expect(page.getByText("Color stops", { exact: false }).first()).toBeVisible();

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("gradient wallpaper");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await page.goto("/zh-Hant/tools/gradient-wallpaper-generator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("漸層壁紙產生器");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("gradient-type")).toBeVisible();
  await expect(page.getByText("色標", { exact: true }).first()).toBeVisible();
});

test("renders a live gradient preview and CSS", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator");
  const canvas = page.getByTestId("gradient-preview");
  await expect(canvas).toBeVisible();

  const painted = await canvas.evaluate((node) => {
    const context = (node as HTMLCanvasElement).getContext("2d");
    if (!context) return false;
    const sample = context.getImageData(20, 20, 1, 1).data;
    return sample[0] + sample[1] + sample[2] > 0;
  });
  expect(painted).toBe(true);

  await expect(page.getByTestId("gradient-css")).toContainText("linear-gradient(");
});

test("editing a color stop updates the CSS and the URL", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator");

  await page.getByTestId("gradient-stop-hex").fill("#ff0000");
  await expect(page.getByTestId("gradient-css")).toContainText("#ff0000");
  await expect(page).toHaveURL(/stops=/);

  const before = await page.getByTestId("gradient-css").textContent();
  await page.getByTestId("gradient-type").getByRole("button", { name: "Radial" }).click();
  await expect(page.getByTestId("gradient-css")).toContainText("radial-gradient(");
  expect(await page.getByTestId("gradient-css").textContent()).not.toBe(before);
});

test("changing angle, center and ratio updates the result", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator");

  await page.getByTestId("gradient-angle").fill("210");
  await expect(page.getByTestId("gradient-css")).toContainText("210deg");

  await page.getByTestId("gradient-type").getByRole("button", { name: "Radial" }).click();
  await page.getByTestId("gradient-center").getByRole("button", { name: "Top left" }).click();
  await expect(page.getByTestId("gradient-css")).toContainText("at 0% 0%");

  await page.getByTestId("gradient-ratio").getByRole("button", { name: "Desktop 16:9" }).click();
  await expect(page).toHaveURL(/ratio=16%3A9/);
});

test("shuffle regenerates colors from the seed", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator");
  const before = await page.getByTestId("gradient-css").textContent();

  await page.getByRole("button", { name: "Shuffle colors" }).click();

  await expect(page.getByTestId("gradient-css")).not.toHaveText(before ?? "");
  await expect(page).toHaveURL(/seed=/);
});

test("share link reproduces the exact gradient", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator?type=conic&angle=60&center=top-left&ratio=16%3A9&text=1&seed=abc&stops=ff0000%400%2C0000ff%40100");
  await expect(page.getByTestId("gradient-css")).toContainText("conic-gradient(from 60deg at 0% 0%");
  await expect(page.getByTestId("gradient-css")).toContainText("#ff0000 0%");
  await expect(page.getByTestId("gradient-css")).toContainText("#0000ff 100%");
});

test("downloads a full-resolution PNG wallpaper", async ({ page }) => {
  await page.goto("/tools/gradient-wallpaper-generator?ratio=16%3A9&seed=download-test");
  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });

  await page.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^starrudder-gradient-16x9-download-test\.png$/);
});
