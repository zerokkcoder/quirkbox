import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildShareText,
  buildXIntentUrl,
  deliverShare,
  shareTextMaxLength,
  xIntentEndpoint,
} from "@/lib/share/x-share";

describe("buildShareText", () => {
  it("joins the title and description", () => {
    const text = buildShareText({ title: "Quirkbox", description: "Fun little tools" });

    expect(text).toContain("Quirkbox");
    expect(text).toContain("Fun little tools");
    expect(text).toBe("Quirkbox — Fun little tools");
  });

  it("truncates long input to the max length with an ellipsis", () => {
    const text = buildShareText({
      title: "a".repeat(300),
      description: "b".repeat(300),
    });

    expect(text.length).toBeLessThanOrEqual(shareTextMaxLength);
    expect(text.endsWith("…")).toBe(true);
  });
});

describe("buildXIntentUrl", () => {
  it("starts with the intent endpoint", () => {
    const url = buildXIntentUrl({ text: "hello", url: "https://example.com" });

    expect(url.startsWith(`${xIntentEndpoint}?`)).toBe(true);
  });

  it("round-trips the text and url values", () => {
    const url = buildXIntentUrl({ text: "hello world", url: "https://example.com/path" });
    const params = new URL(url).searchParams;

    expect(params.get("text")).toBe("hello world");
    expect(params.get("url")).toBe("https://example.com/path");
  });

  it("preserves special characters and non-ascii text", () => {
    const text = "a b & c = d #e 你好 🎉";
    const link = "https://example.com/a?b=1&c=2#frag";

    const url = buildXIntentUrl({ text, url: link });
    const params = new URL(url).searchParams;

    expect(params.get("text")).toBe(text);
    expect(params.get("url")).toBe(link);
  });
});

describe("deliverShare", () => {
  const text = "Check this out";
  const url = "https://example.com/card";

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens the X composer with the share text and link", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    const status = deliverShare({ text, url });

    expect(status).toBe("opened");
    expect(openSpy).toHaveBeenCalledTimes(1);

    const intentUrl = new URL(String(openSpy.mock.calls[0][0]));
    expect(intentUrl.origin + intentUrl.pathname).toBe(xIntentEndpoint);
    expect(intentUrl.searchParams.get("text")).toBe(text);
    expect(intentUrl.searchParams.get("url")).toBe(url);
  });

  it("never hands off to the system share sheet, even when the browser supports it", () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    vi.stubGlobal("navigator", { canShare: () => true, share });

    const status = deliverShare({ text, url });

    expect(status).toBe("opened");
    expect(share).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(String(openSpy.mock.calls[0][0])).toContain(xIntentEndpoint);
  });

  it("reports failure when opening the X composer throws", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => {
      throw new Error("blocked");
    });

    const status = deliverShare({ text, url });

    expect(status).toBe("failed");
    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});
