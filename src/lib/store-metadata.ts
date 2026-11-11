export type StoreProfileMetadata = {
  detailed_address?: string;
  working_hours?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  maps_url?: string;
  is_open_manual?: boolean | null;
  promo_banner?: string;
  store_images?: string[];
  is_cart_enabled?: boolean | null;
  open_time?: string | null;
  close_time?: string | null;
  work_days_mode?: string | null;
  off_days?: number[];
};

const STORE_META_REGEX = /<!--STORE_META:([\s\S]*?)-->/;

/**
 * إرجاع نص النبذة النظيف بدون وسم بيانات المتجر الفنية
 */
export function cleanBio(rawBio?: string | null): string {
  if (!rawBio) return '';
  return rawBio.replace(STORE_META_REGEX, '').trim();
}

/**
 * استخراج بيانات المتجر الفنية المهيكلة من النبذة
 */
export function extractStoreMetadata(rawBio?: string | null): StoreProfileMetadata {
  if (!rawBio || !rawBio.trim()) return {};
  const match = rawBio.match(STORE_META_REGEX);
  if (!match || !match[1]) return {};

  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        detailed_address: parsed.detailed_address || parsed.detailedAddress || '',
        working_hours: parsed.working_hours || parsed.workingHours || '',
        latitude: typeof parsed.latitude === 'number' ? parsed.latitude : null,
        longitude: typeof parsed.longitude === 'number' ? parsed.longitude : null,
        website_url: parsed.website_url || parsed.websiteUrl || '',
        facebook_url: parsed.facebook_url || parsed.facebookUrl || '',
        instagram_url: parsed.instagram_url || parsed.instagramUrl || '',
        tiktok_url: parsed.tiktok_url || parsed.tiktokUrl || '',
        maps_url: parsed.maps_url || parsed.mapsUrl || '',
        is_open_manual: typeof parsed.is_open_manual === 'boolean' ? parsed.is_open_manual : null,
        promo_banner: parsed.promo_banner || parsed.promoBanner || '',
        store_images: Array.isArray(parsed.store_images) ? parsed.store_images : [],
        is_cart_enabled: typeof parsed.is_cart_enabled === 'boolean' ? parsed.is_cart_enabled : null,
        open_time: parsed.open_time || parsed.openTime || null,
        close_time: parsed.close_time || parsed.closeTime || null,
        work_days_mode: parsed.work_days_mode || parsed.workDaysMode || null,
        off_days: Array.isArray(parsed.off_days) ? parsed.off_days : [],
      };
    }
  } catch {
    // ignore parse error
  }
  return {};
}

/**
 * دمج نص النبذة النظيف مع بيانات المتجر المهيكلة
 */
export function mergeBio(cleanBioText: string, metadata: StoreProfileMetadata): string {
  const clean = cleanBio(cleanBioText);
  const hasData =
    Boolean(metadata.detailed_address) ||
    Boolean(metadata.working_hours) ||
    Boolean(metadata.latitude) ||
    Boolean(metadata.facebook_url) ||
    Boolean(metadata.promo_banner) ||
    Boolean(metadata.open_time);

  if (!hasData) return clean;
  const jsonStr = JSON.stringify(metadata);
  return clean ? `${clean}\n<!--STORE_META:${jsonStr}-->` : `<!--STORE_META:${jsonStr}-->`;
}

/**
 * توليد رابط خرائط جوجل الفعلي
 */
export function getEffectiveMapsUrl(metadata: StoreProfileMetadata): string {
  if (metadata.maps_url && metadata.maps_url.startsWith('http')) {
    return metadata.maps_url;
  }
  if (
    typeof metadata.latitude === 'number' &&
    typeof metadata.longitude === 'number' &&
    Math.abs(metadata.latitude) <= 90 &&
    Math.abs(metadata.longitude) <= 180
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${metadata.latitude},${metadata.longitude}`;
  }
  if (metadata.detailed_address && metadata.detailed_address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      metadata.detailed_address.trim(),
    )}`;
  }
  return '';
}

/**
 * فحص ما إذا كان المتجر مفتوحاً الآن طبقاً لمواعيد العمل
 */
export function isStoreOpenNow(metadata: StoreProfileMetadata): boolean {
  if (metadata.is_open_manual !== null && metadata.is_open_manual !== undefined) {
    return metadata.is_open_manual;
  }
  if (metadata.work_days_mode === 'always_open' || metadata.working_hours?.trim() === '24 ساعة') {
    return true;
  }
  if (!metadata.working_hours && (!metadata.open_time || !metadata.close_time)) {
    return false;
  }

  const now = new Date();
  const currentWeekday = now.getDay(); // 0 = Sunday, 5 = Friday

  if (metadata.work_days_mode === 'except_friday' && currentWeekday === 5) {
    return false;
  }

  if (metadata.open_time && metadata.close_time) {
    const [openH, openM] = metadata.open_time.split(':').map(Number);
    const [closeH, closeM] = metadata.close_time.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + (openM || 0);
    let closeMinutes = closeH * 60 + (closeM || 0);

    if (closeMinutes < openMinutes) {
      // Over midnight
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return true;
}
