import { expect, test } from "@playwright/test";

test("home page renders the desktop shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/QuirkBox/);
  await expect(page.getByRole("navigation", { name: "QuirkBox desktop" })).toBeVisible();
  await expect(page.getByRole("toolbar", { name: "Dock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Random Name Generator" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Pixel Avatar Maker" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Emoji Wallpaper Maker" })).toHaveCount(2);
});

test("tool windows open, drag, minimize, maximize and close", async ({ page }) => {
  await page.goto("/");

  const dock = page.getByRole("toolbar", { name: "Dock" });
  await page.getByRole("button", { name: "Random Name Generator" }).first().click();

  await expect(page.getByRole("button", { name: "Another name" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

  // Drag by the title bar. The move has to stay small enough vertically that the window
  // bounds of the desktop layer do not clamp it back.
  const titleBar = page.locator(".window-drag-handle").first();
  const beforeDrag = await titleBar.boundingBox();
  expect(beforeDrag).not.toBeNull();

  const grabX = beforeDrag!.x + beforeDrag!.width / 2;
  const grabY = beforeDrag!.y + beforeDrag!.height / 2;

  await page.mouse.move(grabX, grabY);
  await page.mouse.down();
  await page.mouse.move(grabX + 120, grabY + 30, { steps: 12 });
  await page.mouse.up();

  const afterDrag = await titleBar.boundingBox();
  expect(afterDrag!.x).toBeGreaterThan(beforeDrag!.x + 80);
  expect(afterDrag!.y).toBeGreaterThan(beforeDrag!.y + 10);

  // Minimize, then restore from the dock.
  await page.getByRole("button", { name: "Minimize" }).click();
  await expect(page.getByRole("button", { name: "Close" })).toBeHidden();
  await dock.getByRole("button", { name: "Random Name Generator" }).click();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

  // Maximize, then restore.
  await page.getByRole("button", { name: "Maximize" }).click();
  await expect(page.getByRole("button", { name: "Restore" })).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByRole("button", { name: "Maximize" })).toBeVisible();

  // Close.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: "Close" })).toBeHidden();
});
