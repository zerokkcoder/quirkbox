declare module "gifenc" {
  export type Palette = number[][];

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: { palette?: Palette; repeat?: number; delay?: number }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };

  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette
  ): Uint8Array;
}
