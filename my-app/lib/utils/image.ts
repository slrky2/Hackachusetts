/**
 * Shrink a photo in the browser and return it as a JPEG data URL.
 * Keeps uploads small (phone photos are often 3–10 MB) and strips metadata
 * like GPS EXIF, since only the pixels are redrawn.
 */
export async function photoToJpegDataUrl(file: File, maxSide = 1280, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
