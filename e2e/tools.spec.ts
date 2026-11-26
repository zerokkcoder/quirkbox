import { expect, test } from "@playwright/test";

test("tools page groups tools by work domain with coming-soon placeholders", async ({ page }) => {
  await page.goto("/tools");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The tools");
  await expect(page.getByRole("navigation", { name: "Browse by category" })).toBeVisible();

  const designSection = page.locator("#category-design");
  await expect(designSection.getByRole("heading", { level: 2 })).toHaveText("Design");
  await expect(
    designSection.getByRole("link", { name: /Color Palette Generator/ }).first()
  ).toBeVisible();
  await expect(designSection.getByRole("link", { name: /Pixel Avatar Maker/ }).first()).toBeVisible();
  await expect(
    designSection.getByRole("link", { name: /Image Converter/ }).first()
  ).toBeVisible();

  const travelSection = page.locator("#category-travel");
  await expect(travelSection.getByRole("heading", { level: 2 })).toHaveText("Travel & tourism");
  await expect(travelSection.getByRole("link", { name: /Travel Footprint/ }).first()).toBeVisible();

  const pendingSection = page.locator("#category-development");
  await expect(pendingSection.getByRole("heading", { level: 2 })).toHaveText("Development");
  await expect(pendingSection.getByText("Coming soon").first()).toBeVisible();
  await expect(pendingSection.getByRole("link")).toHaveCount(0);
});

test("traditional Chinese tools page uses localized work-domain labels", async ({ page }) => {
  await page.goto("/zh-Hant/tools");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("工具清單");
  await expect(page.getByRole("navigation", { name: "依分類瀏覽" })).toBeVisible();
  await expect(page.locator("#category-design").getByRole("heading", { level: 2 })).toHaveText(
    "設計"
  );
  await expect(page.locator("#category-development").getByRole("heading", { level: 2 })).toHaveText(
    "開發"
  );
  await expect(page.locator("#category-development").getByText("待開發").first()).toBeVisible();
});
