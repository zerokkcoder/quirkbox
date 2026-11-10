import { expect, test } from "@playwright/test";

test("home page shows launch tools", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /QuirkBox turns tiny weird ideas/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Home/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Random Name Generator/i })).toBeVisible();
});
