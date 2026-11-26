import qrcode from "qrcode-generator";
import { maxBytesByLevel, type ErrorLevel, type QrMatrix } from "./types";
import { utf8Bytes } from "./utf8";

/**
 * The library's ESM build does not register its own UTF-8 converter, so without
 * this Chinese text and emoji would be encoded as latin1 and scan back as
 * garbage. Override the factory's byte conversion once.
 */
qrcode.stringToBytes = utf8Bytes;

export class QrTooLongError extends Error {
  constructor() {
    super("QR content exceeds the capacity of the selected error-correction level.");
    this.name = "QrTooLongError";
  }
}

/** Encode text into a QR module matrix. Throws `QrTooLongError` when over capacity. */
export function buildMatrix(text: string, level: ErrorLevel): QrMatrix {
  if (utf8Bytes(text).length > maxBytesByLevel[level]) {
    throw new QrTooLongError();
  }

  const qr = qrcode(0, level);
  qr.addData(text, "Byte");
  qr.make();

  const count = qr.getModuleCount();
  const cells: boolean[][] = [];
  for (let row = 0; row < count; row += 1) {
    const line: boolean[] = [];
    for (let col = 0; col < count; col += 1) {
      line.push(qr.isDark(row, col));
    }
    cells.push(line);
  }
  return { count, cells };
}
