import type { SupabaseClient } from '@supabase/supabase-js';

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
  imagePaths: string[];
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
  if (item.version !== 1 || item.userId !== userId || !uuid.test(item.productId) ||
      !item.product || !Array.isArray(item.imagePaths) ||
      item.imagePaths.length < 1 || item.imagePaths.length > 4 ||
      item.imagePaths.some((path) => typeof path !== 'string' ||
        !new RegExp(`^products/${userId}/${item.productId}-[0-3]\\.(jpg|png|webp|gif)$`).test(path))) {
    throw new PublicationError('تعذر قراءة محاولة النشر السابقة. راجع إعلاناتك قبل بدء إعلان آخر.', true);
  }
  return item;
}

async function cleanUploads(client: SupabaseClient, paths: string[]) {
  // Only called BEFORE a commit, or after an explicit database rejection.
  // Never delete images when the commit outcome is unknown.
  try {
    const { error } = await client.storage.from('product-images').remove(paths);
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
    await cleanUploads(client, imagePaths);
    throw new PublicationError('لم يُنشر الإعلان: تعذر تجهيز جميع الصور أو حفظ بيانات إعادة المحاولة. تحقق من الاتصال وسماح المتصفح بالتخزين ثم أعد المحاولة.');
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
  let response;
  try {
    response = await client.rpc('publish_web_product', {
      p_product_id: pending.productId, p_product: pending.product, p_image_paths: pending.imagePaths,
    });
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
  if (!result || result.id !== pending.productId || result.image_count !== pending.imagePaths.length) {
    throw new PublicationError('لم يصل تأكيد كامل لحفظ الإعلان وصوره. أعد التحقق من نفس المحاولة.', true);
  }
  // Retaining the receipt on a storage failure is safe: retry returns the same ad.
  try { journal.removeItem(key(pending.userId)); } catch { /* no effect on committed data */ }
  return result;
}
