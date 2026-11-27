import { expect, test, type Page } from "@playwright/test";

async function openTool(page: Page, path = "/tools/json-toolkit") {
  await page.goto(path);
  // Controlled textarea + Playwright fill can race hydration; wait for the
  // client bundle before filling in the tests below.
  await page.waitForLoadState("networkidle");
}

test("tool page exposes localized copy and a ready result", async ({ page }) => {
  await openTool(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("JSON Toolkit");
  await expect(page.getByRole("heading", { level: 2, name: "How to use" })).toBeVisible();
  await expect(page.getByTestId("json-output")).toContainText("StarRudder");

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("Format");
});

test("Traditional Chinese route stays fully localized", async ({ page }) => {
  await openTool(page, "/zh-Hant/tools/json-toolkit");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("JSON 工具箱");
  await expect(page.getByRole("heading", { level: 2, name: "怎麼用" })).toBeVisible();
  await expect(page.getByTestId("json-tab-format")).toBeVisible();
  await expect(page.getByTestId("json-output-toggle")).toHaveText("合成一行");
});

test("formats pasted JSON and locates syntax errors", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("json-input").fill('{"b":1,"a":2}');

  await expect(page.getByTestId("json-output")).toContainText('"b": 1');
  await expect(page.getByTestId("json-status")).toContainText("Valid JSON");

  await page.getByTestId("json-input").fill('{\n  "a": 1,\n  x\n}');
  await expect(page.getByTestId("json-status")).toContainText("Line");
  await expect(page.getByTestId("json-output")).toContainText("Fix the input");
});

test("indent, sort and minify update the result and the URL", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("json-input").fill('{"b":1,"a":2}');

  await page.getByTestId("json-indent-4").click();
  await expect(page).toHaveURL(/indent=4/);
  await expect(page.getByTestId("json-output")).toContainText('    "b": 1');

  await page.getByTestId("json-sort").click();
  await expect(page).toHaveURL(/sort=1/);
  await expect(page.getByTestId("json-output")).toContainText('"a": 2');

  await page.getByTestId("json-minify").click();
  await expect(page.getByTestId("json-input")).toHaveValue('{"a":2,"b":1}');
});

test("converts JSON to CSV and back without inferring cell types", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("json-tab-convert").click();
  await expect(page).toHaveURL(/tab=convert/);
  await expect(page.getByTestId("json-output-toggle")).toHaveCount(0);

  await page.getByTestId("json-input").fill('[{"code":"007","name":"A"}]');
  await expect(page.getByTestId("json-output")).toContainText("code,name");
  await expect(page.getByTestId("json-output")).toContainText("007,A");

  await page.getByTestId("json-direction-to-json").click();
  await page.getByTestId("json-input").fill("code,name\n007,A");
  await expect(page.getByTestId("json-output")).toContainText('"007"');
});

test("TSV delimiter works and input text never enters the URL", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("json-tab-convert").click();
  await page.getByTestId("json-delimiter-tsv").click();
  await expect(page).toHaveURL(/delimiter=tsv/);

  await page.getByTestId("json-input").fill('[{"a":1,"b":2}]');
  await expect(page.getByTestId("json-output")).toContainText("a\tb");

  await page.getByTestId("json-input").fill('{"secret":"do-not-share"}');
  await expect(page).not.toHaveURL(/secret|do-not-share/);
  await expect(page.getByRole("button", { name: "Share to X" })).toBeVisible();
});

test("result code block collapses to one line and restores formatting", async ({ page }) => {
  await openTool(page);
  const toggle = page.getByTestId("json-output-toggle");
  const output = page.getByTestId("json-output");

  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(output).toContainText('"name": "StarRudder"');
  expect((await output.textContent()) ?? "").toContain("\n");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(output).toHaveCSS("white-space", "nowrap");
  const compact = (await output.textContent()) ?? "";
  expect(compact).not.toContain("\n");
  expect(compact).toContain('"name":"StarRudder"');

  await toggle.click();
  await expect(output).toHaveCSS("white-space", "pre-wrap");
  expect((await output.textContent()) ?? "").toContain("\n");
});

test("nested values collapse for viewing without changing the exported text", async ({ page }) => {
  await openTool(page);
  const output = page.getByTestId("json-output");
  const status = page.getByTestId("json-status");
  const statusBefore = await status.textContent();

  await expect(output).toContainText('"uploads": 0');
  await page.getByRole("button", { name: "Collapse this value" }).last().click();
  await expect(output).toContainText('"meta": {"uploads":0,"offline":true}');
  await expect(status).toHaveText(statusBefore ?? "");

  await page.getByRole("button", { name: "Expand this value" }).first().click();
  await expect(output).toContainText('"uploads": 0');
});

test("accepts a local JSON file without uploading", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("json-file").setInputFiles({
    name: "sample.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"from":"file"}'),
  });

  await expect(page.getByTestId("json-input")).toHaveValue('{"from":"file"}');
  await expect(page.getByTestId("json-output")).toContainText('"from": "file"');
});

test("works with external requests blocked", async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("http://127.0.0.1:4000") || url.startsWith("data:") || url.startsWith("blob:")) {
      return route.continue();
    }
    return route.abort();
  });

  await openTool(page);
  await page.getByTestId("json-input").fill('{"offline":true}');
  await expect(page.getByTestId("json-output")).toContainText('"offline": true');
});
