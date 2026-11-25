import { describe, expect, it } from "vitest";
import { sanitizeSvg } from "./decode";

describe("SVG sanitization", () => {
  it("removes scripts, handlers and remote references", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <script>alert(1)</script>
      <image href="https://example.com/track.png" />
      <rect width="10" height="10" fill="red" onclick="alert(2)" />
    </svg>`;
    const clean = sanitizeSvg(source);

    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("https://example.com");
    expect(clean).toContain("<rect");
    expect(clean).toContain("fill=\"red\"");
  });

  it("keeps inline shapes intact", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg"><circle r="4" /></svg>`;
    expect(sanitizeSvg(source)).toBe(source);
  });
});
