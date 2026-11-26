import { expect, test } from "@playwright/test";

test("starts in the mist-white light theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
});

test("cycles light, dark and system, and remembers the choice", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByTestId("theme-toggle");

  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");

  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await toggle.click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("localizes the theme control label", async ({ page }) => {
  await page.goto("/zh-Hant/tools");
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute("aria-label", /主題/);
});
