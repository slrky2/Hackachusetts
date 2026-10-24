/**
 * Job photo parsing. The browser shrinks the photo and re-encodes it as JPEG
 * before upload (which also strips EXIF data such as GPS location), then
 * sends it as a base64 data URL. The server trusts none of that: it decodes
 * the bytes and checks the file signature itself.
 */

/** Largest decoded photo the server accepts. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
/** Matching data URL length (base64 is 4/3 the size) plus room for the prefix. */
export const MAX_IMAGE_DATA_URL_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64;

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export interface StoredImage {
  bytes: Uint8Array<ArrayBuffer>;
  contentType: ImageType;
}

const DATA_URL = /^data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/]+={0,2})$/;

/** Identify the format from its first bytes; SVG and anything else is rejected. */
function sniff(bytes: Uint8Array): ImageType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export type ParsedImage = { ok: true; image: StoredImage } | { ok: false; message: string };

export function parseImageDataUrl(dataUrl: string): ParsedImage {
  const match = DATA_URL.exec(dataUrl);
  if (!match) return { ok: false, message: "That photo couldn't be read. Try a JPEG or PNG." };

  const bytes = new Uint8Array(Buffer.from(match[1], "base64"));
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, message: "That photo is too large (2 MB max)." };

  const contentType = sniff(bytes);
  if (!contentType) return { ok: false, message: "Photos must be JPEG, PNG or WebP." };
  return { ok: true, image: { bytes, contentType } };
}
