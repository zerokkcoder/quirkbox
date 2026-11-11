export type ShareStatus = "opened" | "failed";

export const shareTextMaxLength = 200;

export const xIntentEndpoint = "https://x.com/intent/tweet";

export function buildShareText({
  title,
  description,
}: {
  title: string;
  description: string;
}): string {
  const text = `${title} — ${description}`;

  if (text.length <= shareTextMaxLength) {
    return text;
  }

  return `${text.slice(0, shareTextMaxLength - 1).trimEnd()}…`;
}

export function buildXIntentUrl({ text, url }: { text: string; url: string }): string {
  return `${xIntentEndpoint}?${new URLSearchParams({ text, url }).toString()}`;
}

// X's compose intent cannot attach media, so sharing just opens the composer
// with the tool's blurb and link. Staying synchronous keeps the click's user
// activation alive for window.open.
export function deliverShare({ text, url }: { text: string; url: string }): ShareStatus {
  try {
    window.open(buildXIntentUrl({ text, url }), "_blank", "noopener,noreferrer");
    return "opened";
  } catch {
    return "failed";
  }
}
