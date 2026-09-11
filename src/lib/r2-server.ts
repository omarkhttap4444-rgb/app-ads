import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Server-only R2 access (S3-compatible API). Never import this module from
// client components — it reads secret credentials from server env vars.
import 'server-only';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

// Server-side public base; falls back to the public env var (same value).
export const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  ''
).replace(/\/$/, '');

export const R2_ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Same 10MB ceiling as the legacy Supabase web-publication flow.
export const R2_MAX_FILE_SIZE = 10 * 1024 * 1024;

// Object keys are immutable/unique; long public cache is safe. A replaced
// image must always get a NEW key, never overwrite an existing one.
export const R2_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET_NAME && R2_PUBLIC_BASE,
  );
}

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    // R2 needs path-style addressing through the account endpoint.
    forcePathStyle: true,
  });
  return cachedClient;
}

export function buildR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_BASE}/${key}`;
}

// Key layout: products/{userId}/{productId}-{index}.{ext}
// userId + productId bind the object to its owner at presign time, so the
// delete route can authorize by key prefix without a DB lookup.
export function buildProductImageKey(
  userId: string,
  productId: string,
  index: number,
  extension: string,
): string {
  return `products/${userId}/${productId}-${index}.${extension}`;
}

export function isOwnedProductKey(key: string, userId: string): boolean {
  if (!UUID_RE.test(userId)) return false;
  const match = /^products\/([^/]+)\/([0-9a-f-]{36})-([0-3])\.(jpg|png|webp|gif)$/i.exec(
    key,
  );
  if (!match) return false;
  return match[1] === userId && UUID_RE.test(match[2]);
}

export type PresignedProductUpload = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
};

export async function presignProductImageUpload(args: {
  userId: string;
  productId: string;
  index: number;
  contentType: string;
  sizeBytes: number;
}): Promise<PresignedProductUpload> {
  const { userId, productId, index, contentType, sizeBytes } = args;
  const extension = R2_ALLOWED_MIME[contentType];
  if (!UUID_RE.test(userId)) throw new Error('Invalid user');
  if (!UUID_RE.test(productId)) throw new Error('Invalid product id');
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error('Invalid image index');
  }
  if (!extension) throw new Error('Unsupported image type');
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > R2_MAX_FILE_SIZE
  ) {
    throw new Error('Invalid file size');
  }
  if (!isR2Configured()) throw new Error('R2 storage is not configured');

  const key = buildProductImageKey(userId, productId, index, extension);
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
      CacheControl: R2_CACHE_CONTROL,
    }),
    // Short-lived: the browser PUT must happen promptly.
    { expiresIn: 300 },
  );
  return { key, uploadUrl, publicUrl: buildR2PublicUrl(key), contentType };
}

// Best-effort batch delete. Returns per-key outcome; callers must not fail
// the product deletion itself when R2 cleanup fails (orphans can be swept
// later, a broken delete flow cannot).
export async function deleteR2Objects(
  userId: string,
  keys: string[],
): Promise<{ deleted: string[]; failed: string[] }> {
  const owned = [...new Set(keys)].filter((key) =>
    isOwnedProductKey(key, userId),
  );
  const deleted: string[] = [];
  const failed: string[] = [];
  if (owned.length === 0 || !isR2Configured()) {
    return { deleted, failed: [...new Set(keys)] };
  }
  try {
    await getR2Client().send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: owned.map((Key) => ({ Key })), Quiet: false },
      }),
    );
    deleted.push(...owned);
  } catch {
    failed.push(...owned);
  }
  return { deleted, failed };
}
