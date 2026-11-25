import { describe, expect, it } from "vitest";
import { fallbackAudioUrl, findVoice } from "./speech";

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name } as SpeechSynthesisVoice;
}

describe("findVoice", () => {
  it("prefers an exact language-region match", () => {
    const voices = [voice("en-GB"), voice("en-US"), voice("en")];
    expect(findVoice(voices, "en-US")?.name).toBe("en-US");
  });

  it("falls back to the same language with a different region", () => {
    const voices = [voice("fr-CA"), voice("de-DE")];
    expect(findVoice(voices, "fr-FR")?.name).toBe("fr-CA");
  });

  it("treats underscores as hyphens", () => {
    const voices = [voice("zh-CN")];
    expect(findVoice(voices, "zh_CN")?.name).toBe("zh-CN");
  });

  it("returns undefined when no voice shares the language", () => {
    const voices = [voice("zh-CN"), voice("ja-JP")];
    expect(findVoice(voices, "en-US")).toBeUndefined();
  });
});

describe("fallbackAudioUrl", () => {
  it("encodes the name and uses a mainland-reachable endpoint", () => {
    const url = new URL(fallbackAudioUrl("Seamus Renner"));
    expect(url.origin + url.pathname).toBe("https://dict.youdao.com/dictvoice");
    expect(url.searchParams.get("audio")).toBe("Seamus Renner");
    expect(url.searchParams.get("type")).toBe("2");
  });
});
