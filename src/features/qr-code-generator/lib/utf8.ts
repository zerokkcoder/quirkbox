/** UTF-8 encode/decode helpers shared by the matrix builder and URL state. */

export function utf8Bytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      const low = text.charCodeAt(i + 1) || 0;
      code = 0x10000 + (((code & 0x3ff) << 10) | (low & 0x3ff));
      i += 1;
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

export function utf8Decode(bytes: number[]): string {
  let result = "";
  for (let i = 0; i < bytes.length; ) {
    const first = bytes[i];
    if (first < 0x80) {
      result += String.fromCharCode(first);
      i += 1;
    } else if (first < 0xe0) {
      result += String.fromCharCode(((first & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (first < 0xf0) {
      result += String.fromCharCode(
        ((first & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      );
      i += 3;
    } else {
      const code =
        ((first & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      const offset = code - 0x10000;
      result += String.fromCharCode(0xd800 | (offset >> 10), 0xdc00 | (offset & 0x3ff));
      i += 4;
    }
  }
  return result;
}
