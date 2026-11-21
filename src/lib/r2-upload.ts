import type { SupabaseClient } from '@supabase/supabase-js';
import { compressImage, type ImageCompressPreset } from './image-compress';

export const R2_PUBLIC_ORIGIN = 'https://images.souqphone.com';

export type R2UploadPurpose = 'product' | 'profile' | 'cover';

const MAX_RAW_INPUT_BYTES = 15 * 1024 * 1024; // 15MB before client compression
const MAX_UPLOAD_BYTES: Record<R2UploadPurpose, number> = {
  product: 900 * 1024,
  profile: 500 * 1024,
  cover: 900 * 1024,
};

const ALLOWED_MIMES = new Set(['image/webp', 'image/jpeg', 'image/png']);
const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export function extractR2Key(
  urlOrKey: string | null | undefined,
  allowedPrefixes: readonly string[] = ['products', 'profiles', 'covers'],
): string | null {
  const raw = (urlOrKey ?? '').trim();
  if (!raw || raw.includes('..') || raw.toLowerCase().includes('%2e%2e')) {
    return null;
  }

  let key = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.origin !== R2_PUBLIC_ORIGIN) return null;
      key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
      return null;
    }
  } else {
    key = key.replace(/^\/+/, '');
  }

  const prefixPattern = allowedPrefixes.join('|');
  const keyRe = new RegExp(
    `^(${prefixPattern})/${UUID_RE}/${UUID_RE}\\.(webp|jpe?g|png)$`,
    'i',
  );
  return keyRe.test(key) ? key : null;
}

export async function uploadImageToR2(
  client: SupabaseClient,
  selected: File,
  purpose: R2UploadPurpose,
  fetchImpl: typeof fetch = fetch,
): Promise<{ objectKey: string; publicUrl: string; sizeBytes: number; contentType: string }> {
  if (!selected || selected.size <= 0 || selected.size > MAX_RAW_INPUT_BYTES) {
    throw new Error('حجم الصورة الأصلي يجب ألا يتجاوز 15 ميجابايت.');
  }

  const preset: ImageCompressPreset = purpose;
  const compressed = await compressImage(selected, preset);

  const normalizedType =
    (compressed.type || '').toLowerCase() === 'image/jpg'
      ? 'image/jpeg'
      : (compressed.type || '').toLowerCase();

  if (!ALLOWED_MIMES.has(normalizedType)) {
    throw new Error('صيغة الصورة غير مدعومة. استخدم WebP أو JPG أو PNG.');
  }

  const maxBytes = MAX_UPLOAD_BYTES[purpose];
  if (compressed.size <= 0 || compressed.size > maxBytes) {
    const kb = Math.round(maxBytes / 1024);
    throw new Error(`حجم الصورة بعد الضغط يتجاوز الحد المسموح (${kb}KB). اختر صورة أصغر.`);
  }

  // 1) Request server-signed presigned PUT URL
  const { data: signData, error: signErr } = await client.functions.invoke('r2-upload-sign', {
    body: {
      action: 'sign',
      purpose,
      contentType: normalizedType,
      contentLength: compressed.size,
    },
  });

  if (signErr || !signData?.ok || !signData.uploadUrl || !signData.objectKey || !signData.publicUrl) {
    const serverMsg = typeof signData?.error === 'string' ? signData.error : '';
    throw new Error(serverMsg ? `فشل تجهيز الرفع إلى R2: ${serverMsg}` : 'فشل تجهيز رابط الرفع إلى R2.');
  }

  const objectKey = String(signData.objectKey);
  const publicUrl = String(signData.publicUrl);
  const uploadUrl = String(signData.uploadUrl);
  const requiredHeaders = (signData.requiredHeaders ?? {}) as Record<string, unknown>;
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(requiredHeaders)) {
    headers[k] = String(v);
  }

  // 2) Direct PUT to Cloudflare R2
  const putRes = await fetchImpl(uploadUrl, {
    method: 'PUT',
    headers,
    body: compressed,
  });
  if (!putRes.ok) {
    throw new Error(`فشل رفع الصورة إلى R2 (HTTP ${putRes.status}).`);
  }

  // 3) Server-side HEAD verification before accepting the URL
  const { data: verifyData, error: verifyErr } = await client.functions.invoke('r2-upload-sign', {
    body: {
      action: 'verify',
      purpose,
      objectKey,
    },
  });

  if (verifyErr || !verifyData?.ok || verifyData.verified !== true) {
    await deleteR2Image(client, objectKey);
    throw new Error('فشل التحقق من الصورة بعد رفعها إلى R2.');
  }

  return {
    objectKey,
    publicUrl,
    sizeBytes: compressed.size,
    contentType: normalizedType,
  };
}

export async function deleteR2Image(
  client: SupabaseClient,
  keyOrUrl: string | null | undefined,
): Promise<boolean> {
  const objectKey = extractR2Key(keyOrUrl);
  if (!objectKey) return false;
  try {
    const { data, error } = await client.functions.invoke('r2-upload-sign', {
      body: { action: 'delete', objectKey },
    });
    return !error && data?.ok === true;
  } catch {
    return false;
  }
}

function extractLegacySupabaseBucketPath(
  publicUrl: string,
  buckets: readonly string[],
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(publicUrl);
    for (const bucket of buckets) {
      const marker = `/storage/v1/object/public/${bucket}/`;
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        if (path && !path.includes('..')) {
          return { bucket, path };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function purgeReplacedWebMedia(
  client: SupabaseClient,
  previousUrl: string | null | undefined,
  kind: 'profile' | 'cover',
): Promise<void> {
  const clean = (previousUrl ?? '').trim();
  if (!clean) return;

  // 1) Cloudflare R2 cleanup
  const r2Key = extractR2Key(clean, ['profiles', 'covers']);
  if (r2Key) {
    await deleteR2Image(client, r2Key);
    return;
  }

  // 2) Legacy Supabase Storage cleanup
  const legacyBuckets =
    kind === 'cover'
      ? ['cover-images', 'profile-images']
      : ['profile-images', 'avatars'];
  const legacy = extractLegacySupabaseBucketPath(clean, legacyBuckets);
  if (legacy) {
    try {
      await client.storage.from(legacy.bucket).remove([legacy.path]);
    } catch {
      // Best-effort cleanup for pre-R2 legacy objects
    }
  }
}
