import { expect, test } from "@playwright/test";

async function mockCountry(page: import("@playwright/test").Page, code: string) {
  await page.route("https://ipwho.is/", (route) =>
    route.fulfill({ json: { success: true, country_code: code } })
  );
}

test("English visitors go to Ko-fi", async ({ page }) => {
  await mockCountry(page, "US");
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const trigger = page.getByTestId("support-button").first();
  await expect(trigger).toHaveAttribute("href", "https://ko-fi.com/starrudder");
  await expect(trigger).toHaveAttribute("target", "_blank");
});

test("Chinese locale opens both payment QR codes", async ({ page }) => {
  await mockCountry(page, "US");
  await page.goto("/zh-Hant/tools/qr-code-generator");
  await page.waitForLoadState("networkidle");

  const triggers = page.getByTestId("support-button");
  await expect(triggers).toHaveCount(3); // sticky header + tool page + footer
  await triggers.first().click();

  const dialog = page.getByRole("dialog", { name: "掃碼支持" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: "微信支付" })).toHaveAttribute("src", "/wechat-pay.jpg");
  await expect(dialog.getByRole("img", { name: "支付寶" })).toHaveAttribute("src", "/allipay.jpg");
  // The proxy used to 404 root-level public assets; ensure the bytes really load.
  for (const name of ["微信支付", "支付寶"]) {
    const image = dialog.getByRole("img", { name });
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mainland visitors see QR codes even with an English UI", async ({ page }) => {
  await mockCountry(page, "CN");
  await page.goto("/tools/qr-code-generator");
  await page.waitForLoadState("networkidle");

  const trigger = page.getByTestId("support-button").first();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText("Buy me a coffee");
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Scan to support" })).toBeVisible();
});
