import { expect, test } from "@playwright/test";

for (const path of ["/tools/travel-footprint", "/zh-Hant/tools/travel-footprint"]) {
  test(`${path} shows a full-width map above the controls`, async ({ page }) => {
    await page.goto(path);

    const map = page.getByTestId("travel-footprint-map");
    await expect(map).toBeVisible();
    await expect(page.locator('[data-testid="travel-footprint-map-error"]')).toHaveCount(0);

    const mapBox = (await map.boundingBox())!;
    expect(mapBox.width).toBeGreaterThan(600);
    expect(mapBox.height).toBeGreaterThan(300);

    // The first control panel must start below the map, not beside it.
    const firstPanel = page.locator("main section:not([data-testid='tool-how-to'])").first();
    const panelBox = (await firstPanel.boundingBox())!;
    expect(panelBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height);
  });
}

test("desktop keeps the three settings panels together when footprints grow", async ({ page }) => {
  await page.addInitScript(() => {
    const spots = Array.from({ length: 8 }, (_unused, index) => ({
      id: `s${index}`,
      name: `Place ${index + 1}`,
      longitude: 100 + index * 5,
      latitude: 20 + index * 2,
    }));
    localStorage.setItem(
      "starrudder:travel-footprint:v1",
      JSON.stringify({
        home: { id: "home", name: "Home", longitude: 121.47, latitude: 31.23 },
        spots,
        lineStyle: "solid",
        lineColor: "ocean",
        lineWidth: 3,
        animation: "none",
        lineShape: "arc",
        connectMode: "star",
      })
    );
  });
  await page.goto("/tools/travel-footprint");

  const panel = (title: string) =>
    page.locator("main section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });

  const home = (await panel("Home").boundingBox())!;
  const style = (await panel("Line style").boundingBox())!;
  const data = (await panel("Save & export").boundingBox())!;
  const footprints = (await panel("Your footprints").boundingBox())!;

  expect(Math.abs(home.x - style.x)).toBeLessThan(2);
  expect(Math.abs(home.x - data.x)).toBeLessThan(2);
  expect(footprints.x).toBeGreaterThan(home.x + 300);
  expect(style.y).toBeGreaterThan(home.y);
  expect(data.y).toBeGreaterThan(style.y);
});

test("legacy footprint data is migrated to the StarRudder storage key", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "quirkbox:travel-footprint:v1",
      JSON.stringify({
        home: { id: "home", name: "Old Home", longitude: 121.47, latitude: 31.23 },
        spots: [{ id: "s1", name: "Kyoto", longitude: 135.76, latitude: 35.01 }],
        lineStyle: "dashed",
        lineColor: "coral",
      })
    );
  });
  await page.goto("/tools/travel-footprint");

  await expect(page.getByRole("textbox", { name: "Home name" })).toHaveValue("Old Home");
  await expect(page.getByRole("textbox", { name: "Name", exact: true }).first()).toHaveValue("Kyoto");

  const stored = await page.evaluate(() => ({
    current: localStorage.getItem("starrudder:travel-footprint:v1"),
    legacy: localStorage.getItem("quirkbox:travel-footprint:v1"),
  }));
  expect(stored.current).not.toBeNull();
  expect(JSON.parse(stored.current!).spots).toHaveLength(1);
  // The legacy key must survive as a rollback backup.
  expect(stored.legacy).not.toBeNull();
});

test("map loads without the external worker CDN", async ({ page }) => {
  await page.route("https://unpkg.com/**", (route) => route.abort());
  // Keep the test independent of a third-party basemap being reachable.
  await page.route("https://basemaps.cartocdn.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#0b1020" } }],
      }),
    })
  );
  await page.goto("/tools/travel-footprint");

  await expect(page.getByTestId("travel-footprint-map")).toBeVisible();
  await expect(page.locator('[data-testid="travel-footprint-map-error"]')).toHaveCount(0);
  await page.waitForTimeout(2000);
  await expect(page.locator('[data-testid="travel-footprint-map-error"]')).toHaveCount(0);
});
