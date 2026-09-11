import type { SupabaseClient } from '@supabase/supabase-js';

import {
  deleteR2Keys,
  R2UploadError,
  uploadProductImagesToR2,
} from '@/lib/r2-upload';

export type PublicationProduct = {
  name: string;
  description: string;
  price: number;
  category_id: string;
  specifications: Record<string, unknown>;
  is_negotiable: boolean;
  condition: string;
  location: string;
};

export type PendingPublication = {
  version: 1;
  userId: string;
  productId: string;
  product: PublicationProduct;
  // Legacy Supabase flow: storage object paths (`products/<uid>/<pid>-<i>.<ext>`).
  // R2 flow: R2 object keys in the same layout (used for cleanup) plus the
  // public CDN URLs committed to `product_images.image_url`.
  imagePaths: string[];
  // 'supabase' for the legacy flow; 'r2' for Cloudflare R2 uploads.
  // Absent on old receipts => treated as 'supabase'.
  kind?: 'supabase' | 'r2';
  imageUrls?: string[];
  attempted?: boolean;
};

export type PublicationResult = { id: string; slug: string | null; image_count: number };
type Journal = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const key = (userId: string) => `souqphone:pending-publication:v1:${userId}`;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

export class PublicationError extends Error {
  constructor(message: string, public readonly uncertain = false) {
    super(message);
    this.name = 'PublicationError';
  }
}

export function readPendingPublication(journal: Journal, userId: string): PendingPublication | null {
  const raw = journal.getItem(key(userId));
  if (!raw) return null;
  const item = JSON.parse(raw) as PendingPublication;
  const kind = item.kind ?? 'supabase';
  if (kind !== 'supabase' && kind !== 'r2') {
    throw new PublicationError('تعذر قراءة محاولة النشر السابقة. راجع إعلاناتك قبل بدء إعلان آخر.', true);
  }
  const pathPattern = new RegExp(`^products/${userId}/${item.productId}-[0-3]\\.(jpg|png|webp|gif)$`);
  const pathsValid =
    Array.isArray(item.imagePaths) &&
    item.imagePaths.length >= 1 && item.imagePaths.length <= 4 &&
    item.imagePaths.every((path) => typeof path === 'string' && pathPattern.test(path));
  // R2 receipts additionally carry the public URLs committed to product_images.
  const urlsValid =
    kind === 'supabase' ||
    (Array.isArray(item.imageUrls) &&
      item.imageUrls.length === item.imagePaths.length &&
      item.imageUrls.every((url) => typeof url === 'string' && /^https:\/\//.test(url)));
  if (item.version !== 1 || item.userId !== userId || !uuid.test(item.productId) ||
      !item.product || !pathsValid || !urlsValid) {
    throw new PublicationError('تعذر قراءة محاولة النشر السابقة. راجع إعلاناتك قبل بدء إعلان آخر.', true);
  }
  return { ...item, kind };
}

async function cleanUploads(
  client: SupabaseClient,
  pending: Pick<PendingPublication, 'kind' | 'imagePaths'>,
) {
  // Only called BEFORE a commit, or after an explicit database rejection.
  // Never delete images when the commit outcome is unknown.
  // Cleanup is best-effort: its failure must not block the user.
  if ((pending.kind ?? 'supabase') === 'r2') {
    await deleteR2Keys(client, pending.imagePaths);
    return;
  }
  try {
    const { error } = await client.storage.from('product-images').remove(pending.imagePaths);
    if (error) console.warn('Publication upload cleanup failed', error.name);
  } catch {
    console.warn('Publication upload cleanup unavailable');
  }
}

export async function preparePublication(
  client: SupabaseClient, journal: Journal, userId: string,
  product: PublicationProduct, files: File[],
): Promise<PendingPublication> {
  if (!uuid.test(userId) || files.length < 1 || files.length > 4 ||
      files.some((file) => !extensions[file.type] || file.size === 0 || file.size > 10 * 1024 * 1024)) {
    throw new PublicationError('أضف من صورة إلى 4 صور بصيغة JPG أو PNG أو WebP أو GIF، بحد أقصى 10 ميجابايت للصورة.');
  }
  // Refuse to overwrite a receipt for a possibly committed publication.
  if (journal.getItem(key(userId))) {
    throw new PublicationError('توجد محاولة نشر سابقة. تحقق من نتيجتها أولًا.', true);
  }
  const productId = crypto.randomUUID();
  const imagePaths = files.map((file, i) => `products/${userId}/${productId}-${i}.${extensions[file.type]}`);
  const pending: PendingPublication = {
    version: 1, userId, productId, product: structuredClone(product), imagePaths,
    kind: 'supabase',
  };
  try {
    for (let i = 0; i < files.length; i++) {
      const { error } = await client.storage.from('product-images').upload(imagePaths[i], files[i], {
        contentType: files[i].type, upsert: false,
      });
      if (error) throw error;
    }
    // Persist BEFORE the RPC: a reload/disconnection must not lose its identity.
    journal.setItem(key(userId), JSON.stringify(pending));
    if (!journal.getItem(key(userId))) throw new Error('Receipt not persisted');
    return pending;
  } catch {
    await cleanUploads(client, pending);
    throw new PublicationError('لم يُنشر الإعلان: تعذر تجهيز جميع الصور أو حفظ بيانات إعادة المحاولة. تحقق من الاتصال وسماح المتصفح بالتخزين ثم أعد المحاولة.');
  }
}

// R2 variant of preparePublication: files are compressed client-side, then
// uploaded straight to Cloudflare R2 through short-lived presigned URLs
// (no R2 credentials in the browser). The returned receipt carries the R2
// object keys (for cleanup) and the public CDN URLs committed to the DB.
// Same 1–4 images / 10MB limits as the legacy flow.
export async function preparePublicationR2(
  client: SupabaseClient, journal: Journal, userId: string,
  product: PublicationProduct, files: File[],
): Promise<PendingPublication> {
  if (!uuid.test(userId) || files.length < 1 || files.length > 4 ||
      files.some((file) => !extensions[file.type] || file.size === 0 || file.size > 10 * 1024 * 1024)) {
    throw new PublicationError('أضف من صورة إلى 4 صور بصيغة JPG أو PNG أو WebP أو GIF، بحد أقصى 10 ميجابايت للصورة.');
  }
  if (journal.getItem(key(userId))) {
    throw new PublicationError('توجد محاولة نشر سابقة. تحقق من نتيجتها أولًا.', true);
  }
  const productId = crypto.randomUUID();
  let uploaded: { keys: string[]; urls: string[] };
  try {
    uploaded = await uploadProductImagesToR2(client, files, productId);
  } catch (err) {
    // Propagate R2UploadError unwrapped so the caller can fall back to the
    // legacy Supabase upload path when R2 infra (not the user's input) fails.
    if (err instanceof R2UploadError) throw err;
    throw new PublicationError('لم يُنشر الإعلان: تعذر رفع الصور. تحقق من الاتصال ثم أعد المحاولة.');
  }
  const pending: PendingPublication = {
    version: 1, userId, productId, product: structuredClone(product),
    imagePaths: uploaded.keys, kind: 'r2', imageUrls: uploaded.urls,
  };
  try {
    // Persist BEFORE the RPC: a reload/disconnection must not lose its identity.
    journal.setItem(key(userId), JSON.stringify(pending));
    if (!journal.getItem(key(userId))) throw new Error('Receipt not persisted');
    return pending;
  } catch {
    await cleanUploads(client, pending);
    throw new PublicationError('لم يُنشر الإعلان: تعذر حفظ بيانات إعادة المحاولة. تحقق من سماح المتصفح بالتخزين ثم أعد المحاولة.');
  }
}

export async function commitPublication(
  client: SupabaseClient, journal: Journal, pending: PendingPublication,
): Promise<PublicationResult> {
  const wasAttempted = pending.attempted === true;
  // Persist the attempt marker before sending; explicit errors on a later retry
  // must not discard the receipt of an earlier, possibly committed request.
  try {
    pending.attempted = true;
    journal.setItem(key(pending.userId), JSON.stringify(pending));
  } catch {
    throw new PublicationError('تعذر حفظ سجل المحاولة بأمان. اسمح بتخزين الموقع ثم أعد التحقق.', true);
  }
  const kind = pending.kind ?? 'supabase';
  // R2 receipts commit public CDN URLs directly (same image_url column —
  // no schema change); legacy receipts keep the storage-path flow.
  const rpcName = kind === 'r2' ? 'publish_web_product_with_urls' : 'publish_web_product';
  const rpcArgs = kind === 'r2'
    ? { p_product_id: pending.productId, p_product: pending.product, p_image_urls: pending.imageUrls }
    : { p_product_id: pending.productId, p_product: pending.product, p_image_paths: pending.imagePaths };
  let response;
  try {
    response = await client.rpc(rpcName, rpcArgs);
  } catch {
    throw new PublicationError('لم يصل تأكيد النشر. اضغط «التحقق وإعادة المحاولة» لاستكمال نفس الإعلان دون تكراره.', true);
  }
  if (response.error) {
    const code: string = response.error.code ?? '';
    // SQLSTATE / PostgREST errors are explicit rejections; fetch failures are not.
    if (!wasAttempted && (/^[0-9A-Z]{5}$/.test(code) || /^PGRST\d{3}$/.test(code))) {
      try { journal.removeItem(key(pending.userId)); } catch {
        throw new PublicationError('تعذر تحديث سجل المحاولة. أعد التحقق من نفس الإعلان.', true);
      }
      // Existing manifests must not be removed on a retry mismatch/authorization change.
      // Retain uploaded objects on rejection; a later audited orphan-cleanup can remove them.
      throw new PublicationError(code === 'PGRST202'
        ? 'خدمة النشر الآمن غير مفعّلة بعد. لم يتم نشر الإعلان؛ يرجى المحاولة بعد اكتمال تحديث الموقع.'
        : 'لم يُعتمد النشر. تحقق من بيانات الإعلان والصور وصلاحية تسجيل الدخول ثم أعد المحاولة.');
    }
    throw new PublicationError('تعذر تأكيد نتيجة المحاولة السابقة. أعد التحقق بعد استعادة الاتصال وتسجيل الدخول؛ إذا استمر الرفض فراجع إعلاناتك أو تواصل مع الدعم قبل إنشاء إعلان آخر.', true);
  }
  const result = response.data as PublicationResult | null;
  const expectedImages = kind === 'r2'
    ? (pending.imageUrls?.length ?? 0)
    : pending.imagePaths.length;
  if (!result || result.id !== pending.productId || result.image_count !== expectedImages) {
    throw new PublicationError('لم يصل تأكيد كامل لحفظ الإعلان وصوره. أعد التحقق من نفس المحاولة.', true);
  }
  // Retaining the receipt on a storage failure is safe: retry returns the same ad.
  try { journal.removeItem(key(pending.userId)); } catch { /* no effect on committed data */ }
  return result;
}
