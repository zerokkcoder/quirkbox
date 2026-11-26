import { maxLogoRatio, quietZone, type DotStyle, type QrMatrix } from "./types";

export type SvgOptions = {
  foreground: string;
  background: string;
  dots: DotStyle;
  transparent: boolean;
  /** Optional data URL for a centered logo. */
  logoDataUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return map[char] ?? char;
  });
}

/** Serialize a matrix to a standalone SVG string — no fonts, no external assets. */
export function matrixToSvg(matrix: QrMatrix, options: SvgOptions): string {
  const total = matrix.count + quietZone * 2;
  const foreground = `#${options.foreground.replace(/^#/, "")}`;
  const background = `#${options.background.replace(/^#/, "")}`;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
  ];

  if (!options.transparent) {
    parts.push(`<rect width="${total}" height="${total}" fill="${background}"/>`);
  }

  const shapes: string[] = [];
  for (let row = 0; row < matrix.count; row += 1) {
    for (let col = 0; col < matrix.count; col += 1) {
      if (!matrix.cells[row][col]) continue;
      const x = col + quietZone;
      const y = row + quietZone;
      if (options.dots === "dots") {
        shapes.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5" fill="${foreground}"/>`);
      } else if (options.dots === "rounded") {
        shapes.push(
          `<rect x="${x}" y="${y}" width="1" height="1" rx="0.35" fill="${foreground}"/>`
        );
      } else {
        shapes.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${foreground}"/>`);
      }
    }
  }
  parts.push(`<g fill="${foreground}">${shapes.join("")}</g>`);

  if (options.logoDataUrl && options.logoWidth && options.logoHeight) {
    const width = total * maxLogoRatio;
    const height = width / (options.logoWidth / options.logoHeight || 1);
    const x = (total - width) / 2;
    const y = (total - height) / 2;
    const plate = Math.max(quietZone / 2, 0.5);
    parts.push(
      `<rect x="${x - plate}" y="${y - plate}" width="${width + plate * 2}" height="${height + plate * 2}" rx="${plate}" fill="${options.transparent ? "#ffffff" : background}"/>`
    );
    parts.push(
      `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" href="${escapeXml(options.logoDataUrl)}" xlink:href="${escapeXml(options.logoDataUrl)}"/>`
    );
  }

  parts.push("</svg>");
  return parts.join("");
}
