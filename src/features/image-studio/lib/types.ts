export const formatIds = ["png", "jpeg", "webp", "avif", "gif", "bmp", "ico"] as const;

export type FormatId = (typeof formatIds)[number];

/** SVG is accepted as an input only — bitmap-to-SVG is not a real vector conversion. */
export const sourceFormatIds = [...formatIds, "svg"] as const;
export type SourceFormatId = (typeof sourceFormatIds)[number];

export const maxDimension = 8192;
export const icoMaxDimension = 256;
export const defaultFormat: FormatId = "webp";
export const defaultQuality = 80;
export const defaultBackground = "ffffff";
export const defaultSuffix = true;

export type ImageStudioState = {
  format: FormatId;
  quality: number;
  width: number;
  height: number;
  /** Six-digit hex without `#`; used to flatten transparency. */
  background: string;
  /** Append the target format to the file stem. */
  suffix: boolean;
};

export type JobStatus = "queued" | "decoding" | "converting" | "done" | "error";

export type ConversionResult = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  filename: string;
};

export type ImageJob = {
  id: string;
  name: string;
  size: number;
  sourceFormat: SourceFormatId | null;
  previewUrl: string;
  status: JobStatus;
  error?: string;
  result?: ConversionResult;
};
