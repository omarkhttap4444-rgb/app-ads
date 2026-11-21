// Adaptive multi-pass client-side image compression before R2 upload.
// Converts photos to WebP (with JPEG fallback on older browsers) and tunes
// quality/dimensions so storage & bandwidth stay tiny without visible quality loss.

export type ImageCompressPreset = 'product' | 'profile' | 'cover';

type PresetConfig = {
  maxWidth: number;
  maxHeight: number;
  targetBytes: number;
  maxBytes: number;
  qualities: number[];
  scales: number[];
};

const PRESETS: Record<ImageCompressPreset, PresetConfig> = {
  product: {
    maxWidth: 1400,
    maxHeight: 1400,
    targetBytes: 240 * 1024, // ~240KB crisp WebP
    maxBytes: 880 * 1024, // safely below R2 900KB cap
    qualities: [0.80, 0.72, 0.64, 0.54, 0.44],
    scales: [1, 0.85, 0.72, 0.58],
  },
  profile: {
    maxWidth: 600,
    maxHeight: 600,
    targetBytes: 120 * 1024, // ~120KB crisp avatar
    maxBytes: 480 * 1024, // safely below R2 500KB cap
    qualities: [0.82, 0.74, 0.64, 0.54],
    scales: [1, 0.82, 0.66],
  },
  cover: {
    maxWidth: 1600,
    maxHeight: 900,
    targetBytes: 280 * 1024, // ~280KB crisp banner/cover
    maxBytes: 880 * 1024, // safely below R2 900KB cap
    qualities: [0.80, 0.72, 0.64, 0.54, 0.44],
    scales: [1, 0.85, 0.70],
  },
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: 'image/webp' | 'image/jpeg',
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), mime, quality);
    } catch {
      resolve(null);
    }
  });
}

async function encodePreferred(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') {
    return webp;
  }
  return canvasToBlob(canvas, 'image/jpeg', quality);
}

export async function compressImage(
  file: File,
  preset: ImageCompressPreset = 'product',
): Promise<File> {
  // Server/test environments without DOM/Canvas APIs return file as-is
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof createImageBitmap !== 'function'
  ) {
    return file;
  }

  if (!file.type.startsWith('image/')) {
    return file;
  }

  const config = PRESETS[preset] ?? PRESETS.product;

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const baseScale = Math.min(
        1,
        config.maxWidth / bitmap.width,
        config.maxHeight / bitmap.height,
      );

      // Fast path: already small WebP/JPEG within bounds
      const alreadyOptimizedType =
        file.type === 'image/webp' || file.type === 'image/jpeg';
      if (
        alreadyOptimizedType &&
        baseScale >= 1 &&
        file.size > 0 &&
        file.size <= config.targetBytes
      ) {
        return file;
      }

      let best: Blob | null = null;

      for (const extraScale of config.scales) {
        const width = Math.max(1, Math.round(bitmap.width * baseScale * extraScale));
        const height = Math.max(1, Math.round(bitmap.height * baseScale * extraScale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) break;

        // Clean white backdrop prevents black artifacts if source PNG had transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);

        for (const quality of config.qualities) {
          const candidate = await encodePreferred(canvas, quality);
          if (!candidate || candidate.size <= 0) continue;
          if (!best || candidate.size < best.size) {
            best = candidate;
          }
          if (candidate.size <= config.targetBytes) {
            best = candidate;
            break;
          }
        }

        if (best && best.size <= config.targetBytes) {
          break;
        }
      }

      if (!best) return file;

      // Keep original only if it is already an allowed format, smaller, and under maxBytes
      const isAllowedOriginal =
        file.type === 'image/webp' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png';
      if (
        isAllowedOriginal &&
        file.size <= config.maxBytes &&
        best.size >= file.size
      ) {
        return file;
      }

      const outType = best.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      const ext = outType === 'image/webp' ? 'webp' : 'jpg';
      const stem = file.name.replace(/\.[^.]+$/, '') || 'image';

      return new File([best], `${stem}.${ext}`, {
        type: outType,
        lastModified: Date.now(),
      });
    } finally {
      bitmap.close?.();
    }
  } catch {
    return file;
  }
}
