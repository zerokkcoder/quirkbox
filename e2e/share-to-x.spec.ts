import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

/** Minimum PNG byte size that proves the canvas actually painted pixels. */
const drawnBytesThreshold = 1000;

const expectedFeedback = "Opened X — finish your post there.";

/** Records the payload the page hands to `navigator.share`, shaped for easy assertions. */
type RecordedShareCall = {
  files: { name: string; type: string; size: number }[];
  text: string;
  url: string;
};

async function readCanvasPngBytes(canvas: Locator) {
  return canvas.evaluate(
    (element: HTMLCanvasElement) =>
      new Promise<number>((resolve) => {
        element.toBlob((blob) => resolve(blob ? blob.size : 0), "image/png");
      })
  );
}

async function expectCanvasDrawn(canvas: Locator, minBytes = drawnBytesThreshold) {
  await expect.poll(() => readCanvasPngBytes(canvas), { timeout: 10000 }).toBeGreaterThan(minBytes);
}

async function openEmojiWallpaper(page: Page) {
  await page.goto("/tools/emoji-wallpaper");
  await expectCanvasDrawn(page.locator("canvas"));
}

/** The popup really targets x.com; stub the response so the test never depends on the network. */
async function stubXPage(context: BrowserContext) {
  await context.route("https://x.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>X</title>" })
  );
}

test("share opens the X composer with the tool blurb and link", async ({ page, context }) => {
  await stubXPage(context);
  await openEmojiWallpaper(page);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Share to X" }).click();

  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("https://x.com/intent/tweet");

  const popupParams = new URL(popup.url()).searchParams;
  expect(popupParams.get("text")).toContain("Emoji Wallpaper Maker");
  expect(popupParams.get("url")).toContain("/tools/emoji-wallpaper");

  await expect(page.getByRole("status")).toHaveText(expectedFeedback);
});

test("share opens the X composer even when the browser offers a system share sheet", async ({
  page,
  context,
}) => {
  await stubXPage(context);

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: ShareData) => {
        (window as unknown as { __shareCall?: unknown }).__shareCall = {
          files: (data.files ?? []).map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
          text: data.text,
          url: data.url,
        };
        return Promise.resolve();
      },
    });
  });

  await openEmojiWallpaper(page);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Share to X" }).click();

  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toContain("https://x.com/intent/tweet");

  const shareCall = await page.evaluate(
    () => (window as unknown as { __shareCall?: RecordedShareCall }).__shareCall
  );
  expect(shareCall).toBeUndefined();

  await expect(page.getByRole("status")).toHaveText(expectedFeedback);
});

test("a blocked composer surfaces the failure message and keeps the button usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.open = () => {
      throw new Error("popup blocked");
    };
  });

  await openEmojiWallpaper(page);

  const shareButton = page.getByRole("button", { name: "Share to X" });
  await shareButton.click();

  await expect(page.getByRole("status")).toHaveText("Couldn't open X. Please try again.");
  await expect(shareButton).toBeEnabled();
});

test("every tool page and the desktop window expose the share entry", async ({ page }) => {
  await page.goto("/tools/random-name");
  await expect(page.getByRole("button", { name: "Another name" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share to X" })).toBeVisible();

  await page.goto("/tools/pixel-avatar");
  await expectCanvasDrawn(page.locator("canvas"));
  await expect(page.getByRole("button", { name: "Share to X" })).toBeVisible();

  await openEmojiWallpaper(page);
  await expect(page.getByRole("button", { name: "Share to X" })).toBeVisible();

  // The desktop window hosts the same tool, so its share button has to be reachable there too.
  await page.goto("/");
  await page.getByRole("button", { name: "Pixel Avatar Maker" }).first().click();
  await expect(page.getByRole("button", { name: "Share to X" }).first()).toBeVisible();
});
