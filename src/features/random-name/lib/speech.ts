/**
 * Voice selection and fallback audio for the pronunciation button.
 *
 * The browser's SpeechSynthesis is the primary path: it works offline and can
 * read text even when no voice matches the requested language exactly (the
 * browser falls back to its default voice). A matched voice is preferred when
 * available, since it gives the correct accent.
 */

/** Find a voice for a BCP-47 tag, preferring an exact match over a language match. */
export function findVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string,
): SpeechSynthesisVoice | undefined {
  const target = langCode.replace("_", "-").toLowerCase();

  return (
    voices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === target) ??
    voices.find((voice) =>
      voice.lang.replace("_", "-").toLowerCase().startsWith(target.slice(0, 2)),
    )
  );
}

/**
 * Last-resort remote audio, used only when SpeechSynthesis is unavailable.
 * Google's translate_tts endpoint is unreachable in mainland China; Youdao's
 * dictvoice endpoint is reachable there and serves real audio for English and
 * several European languages.
 */
export function fallbackAudioUrl(name: string): string {
  const query = new URLSearchParams({ audio: name, type: "2" });
  return `https://dict.youdao.com/dictvoice?${query.toString()}`;
}
