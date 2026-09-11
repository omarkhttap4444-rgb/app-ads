import type { SupabaseClient } from '@supabase/supabase-js';

import { getR2ObjectKeyFromUrl } from '@/lib/media';

export class R2UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'R2UploadError';
  }
}

// R2 is used when the public base URL is configured. Otherwise callers fall
// back to the legacy Supabase Storage upload path.
export function isR2UploadEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);
}

type PresignResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
};

async function getAccessToken(client: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await client.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new R2UploadError('انتهت الجلسة. سجّل الدخول مرة أخرى.');
  return token;
}

// Browser flow: validation/compression happens before this (see
// image-compress.ts); here each file gets a short-lived presigned PUT URL
// scoped to products/{userId}/{productId}-{i}.{ext} and is uploaded straight
// to R2. Credentials never touch the client.
export async function uploadProductImagesToR2(
  client: SupabaseClient,
  files: File[],
  productId: string,
): Promise<{ keys: string[]; urls: string[] }> {
  const token = await getAccessToken(client);
  const keys: string[] = [];
  const urls: string[] = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    let presigned: PresignResponse;
    try {
      const response = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          index,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!response.ok) throw new Error(`presign failed: ${response.status}`);
      presigned = (await response.json()) as PresignResponse;
      if (!presigned.uploadUrl || !presigned.publicUrl || !presigned.key) {
        throw new Error('bad presign response');
      }
    } catch {
      // Best-effort cleanup of keys already uploaded in this batch.
      await deleteR2Keys(client, keys).catch(() => undefined);
      throw new R2UploadError(
        'تعذر تجهيز رفع الصور. تحقق من الاتصال وأعد المحاولة.',
      );
    }

    try {
      const put = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: {
          // Must match the signed request exactly (type + cache headers).
          'Content-Type': presigned.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: file,
      });
      if (!put.ok) throw new Error(`r2 put failed: ${put.status}`);
    } catch {
      await deleteR2Keys(client, keys).catch(() => undefined);
      throw new R2UploadError(
        'تعذر رفع الصور إلى التخزين. تحقق من الاتصال وأعد المحاولة.',
      );
    }
    keys.push(presigned.key);
    urls.push(presigned.publicUrl);
  }

  return { keys, urls };
}

// Best-effort R2 cleanup (orphan prevention). Never throws — a failed object
// delete must not break product publishing or deletion UX.
export async function deleteR2Keys(
  client: SupabaseClient,
  keys: string[],
): Promise<void> {
  if (keys.length === 0) return;
  try {
    const {
      data: { session },
    } = await client.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await fetch('/api/uploads/r2-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ keys }),
    });
  } catch {
    // orphan sweep can remove leftovers later
  }
}

export function r2KeysFromUrls(urls: string[]): string[] {
  return urls
    .map((url) => getR2ObjectKeyFromUrl(url))
    .filter((key): key is string => key !== null);
}
