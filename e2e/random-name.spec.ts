import { expect, test } from "@playwright/test";

type SpyWindow = Window & { __spoken: string[] };

test("pronunciation speaks through the browser even without a matching voice", async ({ page }) => {
  await page.addInitScript(() => {
    // Simulate a machine that only has Chinese voices installed, and block the
    // old Google TTS endpoint so neither path can silently depend on the network.
    const voices = [{ lang: "zh-CN", name: "Chinese", localService: true }] as SpeechSynthesisVoice[];
    Object.defineProperty(window.speechSynthesis, "getVoices", {
      configurable: true,
      value: () => voices,
    });
    (window as unknown as SpyWindow).__spoken = [];
    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (utterance) => {
      (window as unknown as SpyWindow).__spoken.push(
        `${utterance.lang}:${utterance.voice?.name ?? "default"}:${utterance.text}`
      );
      return originalSpeak(utterance);
    };
  });
  await page.route("https://translate.google.com/**", (route) => route.abort());

  await page.goto("/tools/random-name");
  await page.getByRole("button", { name: "Play pronunciation" }).click();

  const spoken = await page.evaluate(() => (window as unknown as SpyWindow).__spoken);
  expect(spoken).toHaveLength(1);
  expect(spoken[0]).toMatch(/^en-US:default:.+/);
  await expect(page.getByTestId("pronunciation-error")).toHaveCount(0);
});
