import { expect, test } from "@playwright/test";

const toolNames = [
  "Random Name Generator",
  "Pixel Avatar Maker",
  "Emoji Wallpaper Maker",
  "Travel Footprint",
  "Color Palette Generator",
  "Image Converter",
  "QR Code Generator",
  "Gradient Wallpaper Generator",
];

test("home page renders the official landing page, not a desktop shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tools that stay in your browser.");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("toolbar", { name: "Dock" })).toHaveCount(0);

  for (const name of toolNames) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Pick a tool and start" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Private by design" })).toBeVisible();
  await expect(page.getByText("no uploads, no data saved", { exact: false })).toBeVisible();
});

test("home tool cards link to their own pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Travel Footprint/ }).first().click();

  // The dev server compiles this route on first navigation and can exceed the
  // default 5s assertion timeout on a cold cache.
  await expect(page).toHaveURL(/\/tools\/travel-footprint$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Travel Footprint");
});

test("home FAQ can be expanded", async ({ page }) => {
  await page.goto("/");

  const question = page.getByText("Do I need an account?");
  const answer = page.getByText("No. Open any tool and use it immediately", { exact: false });
  await expect(answer).toBeHidden();

  await question.click();
  await expect(answer).toBeVisible();
});
