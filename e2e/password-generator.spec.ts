import { expect, test } from "@playwright/test";

const path = "/tools/password-generator";

// navigator.clipboard.writeText needs an explicit grant in headless Chromium.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("renders a secret on load and copies it in one click", async ({ page }) => {
  await page.goto(path);

  const first = page.getByTestId("pw-result-0");
  await expect(first).toBeVisible();
  await expect(first).not.toHaveText("");

  await page.getByTestId("pw-copy-0").click();
  await expect(page.getByRole("status").first()).toContainText("Copied");
});

test("localises to Traditional Chinese", async ({ page }) => {
  await page.goto("/zh-Hant/tools/password-generator");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("密碼產生器");
  await expect(page.getByTestId("pw-result-0")).toBeVisible();
});

test("switches the memorable preset and keeps it in the URL", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("pw-preset-memorable").click();

  await expect(page.getByTestId("pw-preset-memorable")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pw-result-0")).toContainText("-");
  await expect(page).toHaveURL(/p=memorable/);
});

test("restores settings from the URL", async ({ page }) => {
  await page.goto(`${path}?p=strong`);

  await expect(page.getByTestId("pw-preset-strong")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("pw-result-0")).toHaveText(/^.{32}$/);
});

test("regenerates a different secret with the same settings", async ({ page }) => {
  await page.goto(path);

  const before = await page.getByTestId("pw-result-0").textContent();
  await page.getByTestId("pw-regenerate").click();
  await expect(page.getByTestId("pw-result-0")).not.toHaveText(before ?? "");
});

test("never writes the secret into the URL", async ({ page }) => {
  await page.goto(path);

  const secret = (await page.getByTestId("pw-result-0").textContent()) ?? "";
  expect(secret.length).toBeGreaterThan(8);
  expect(page.url()).not.toContain(secret);
  await expect(page).not.toHaveURL(/len=/);
});

test("keeps the PIN preset numeric without a weak hint", async ({ page }) => {
  await page.goto(`${path}?p=pin`);

  await expect(page.getByTestId("pw-result-0")).toHaveText(/^[0-9]{6}$/);
  await expect(page.getByTestId("pw-weak-hint")).toHaveCount(0);
});

test("expands the custom panel and grows the batch", async ({ page }) => {
  await page.goto(path);
  await page.getByTestId("pw-custom-toggle").click();

  await page.getByTestId("pw-mode-passphrase").click();
  await expect(page.getByTestId("pw-result-0")).toContainText("-");

  const batch = page.getByTestId("pw-batch");
  await batch.focus();
  await batch.press("ArrowRight");
  await batch.press("ArrowRight");

  await expect(page.getByTestId("pw-result-2")).toBeVisible();
});

test("offers a share button for the tool itself", async ({ page }) => {
  await page.goto(`${path}?p=strong`);

  await expect(page.getByRole("button", { name: "Share to X" })).toBeVisible();
});
