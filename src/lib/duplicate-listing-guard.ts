import type { SupabaseClient } from '@supabase/supabase-js';

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  confidence: number;
  method: string;
  reasonAr: string;
  matchedProductId?: string | null;
  matchedTitle?: string | null;
  matchedPrice?: number | null;
  imageFingerprints: string[];
};

/**
 * Pure 64-bit Perceptual dHash from a 9x8 RGBA pixel buffer.
 * Identical algorithm to Flutter's DuplicateListingGuardService.computeDHashFromRgba9x8.
 */
export function computeDHashFromRgba9x8(rgba: Uint8ClampedArray | Uint8Array): string {
  if (rgba.length < 9 * 8 * 4) return '';
  let hex = '';
  let nibble = 0;
  let bitCount = 0;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const lIdx = (y * 9 + x) * 4;
      const rIdx = (y * 9 + x + 1) * 4;
      const lLum = Math.floor(
        (rgba[lIdx] * 299 + rgba[lIdx + 1] * 587 + rgba[lIdx + 2] * 114) / 1000,
      );
      const rLum = Math.floor(
        (rgba[rIdx] * 299 + rgba[rIdx + 1] * 587 + rgba[rIdx + 2] * 114) / 1000,
      );

      nibble = (nibble << 1) | (lLum > rLum ? 1 : 0);
      bitCount++;
      if (bitCount === 4) {
        hex += nibble.toString(16);
        nibble = 0;
        bitCount = 0;
      }
    }
  }
  return hex;
}

export function hammingDistanceHex64(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  let dist = 0;
  for (let i = 0; i < 16; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x > 0) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

async function computeFileDHash(file: File): Promise<string> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return '';
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image_load_failed'));
      el.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data;
    return computeDHashFromRgba9x8(data);
  } catch {
    return '';
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function computeBrowserImageFingerprints(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const file of files.slice(0, 4)) {
    const hash = await computeFileDHash(file);
    if (hash.length === 16 && !out.includes(hash)) {
      out.push(hash);
    }
  }
  return out;
}

export async function checkDuplicateBeforePublish(
  supabase: SupabaseClient,
  input: {
    title: string;
    description: string;
    category: string;
    subCategory: string;
    price: number;
    condition: string;
    brand?: string;
    model?: string;
    storage?: string;
    location: string;
    imageFiles: File[];
  },
): Promise<DuplicateCheckResult> {
  const imageFingerprints = await computeBrowserImageFingerprints(input.imageFiles);

  try {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: {
        action: 'check_duplicate',
        title: input.title,
        description: input.description,
        category: input.category,
        subCategory: input.subCategory,
        price: input.price,
        condition: input.condition,
        brand: input.brand ?? input.subCategory,
        model: input.model ?? '',
        storage: input.storage ?? '',
        location: input.location,
        imageFingerprints,
      },
    });

    if (!error && data && typeof data === 'object') {
      const payload = data as Record<string, unknown>;
      return {
        isDuplicate: payload.isDuplicate === true,
        confidence: typeof payload.confidence === 'number' ? Math.round(payload.confidence) : 0,
        method: String(payload.method ?? 'fast_clear'),
        reasonAr: String(
          payload.reasonAr ?? 'تم رصد إعلان مكرر لنفس الجهاز منشور لديك بالفعل.',
        ),
        matchedProductId: payload.matchedProductId ? String(payload.matchedProductId) : null,
        matchedTitle: payload.matchedTitle ? String(payload.matchedTitle) : null,
        matchedPrice: typeof payload.matchedPrice === 'number' ? payload.matchedPrice : null,
        imageFingerprints,
      };
    }
  } catch {
    // Fail-open on transient edge timeout; DB trigger still protects hard 7-day cooldown.
  }

  return {
    isDuplicate: false,
    confidence: 0,
    method: 'gateway_fallback',
    reasonAr: '',
    imageFingerprints,
  };
}
