// Client-side image preparation before upload: resize to a web-suitable
// max side + lossy compression. Allowed operations only — resize,
// compression, format conversion, orientation handling. No AI enhancement:
// scratches or damage on used phones must never be hidden or altered.
// Redrawing through <canvas> also drops EXIF/metadata (privacy) while
// createImageBitmap applies the EXIF orientation, so output pixels stay
// upright without extra handling.

const MAX_SIDE = 1600;
// Web original for product photos: detailed enough for the gallery view,
// small enough for cards. Never upscale small images.
const WEBP_QUALITY = 0.8;
const JPEG_FALLBACK_QUALITY = 0.8;

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

export async function compressImage(file: File): Promise<File> {
  try {
    // Never touch non-images or GIFs (animation would be lost)
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // Prefer WebP (smaller at equal detail); fall back to JPEG where
    // the browser cannot encode WebP. Keep the original when encoding
    // fails or does not actually save space.
    let blob = await encodeCanvas(canvas, 'image/webp', WEBP_QUALITY);
    let outType = 'image/webp';
    let outExt = 'webp';
    if (!blob) {
      blob = await encodeCanvas(canvas, 'image/jpeg', JPEG_FALLBACK_QUALITY);
      outType = 'image/jpeg';
      outExt = 'jpg';
    }
    if (!blob) return file;

    // Only swap when it actually saves space
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    // Never reuse the user's raw filename as the storage key — the upload
    // route assigns `products/{userId}/{productId}-{i}.{ext}`. The name here
    // is local-only; sanitize it to a safe slug.
    const safeBase = baseName
      .normalize('NFKD')
      .replace(/[^\w\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'image';
    return new File([blob], `${safeBase}.${outExt}`, { type: outType });
  } catch {
    return file; // never block publishing on compression failure
  }
}
