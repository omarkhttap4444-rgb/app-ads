// Client-side image compression before upload (mirrors the app's
// flutter_image_compress usage): resize to max side + JPEG quality,
// so storage/bandwidth stay low without visible quality loss.

const MAX_SIDE = 1600;
const QUALITY = 0.72;

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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', QUALITY),
    );
    if (!blob) return file;

    // Only swap when it actually saves space
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file; // never block publishing on compression failure
  }
}
