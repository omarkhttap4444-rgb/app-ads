export const SAUDI_MARKET_ENABLED = false;

const saudiLocationPattern =
  /السعودية|الرياض|جدة|مكة|المدينة المنورة|المنطقة الشرقية|القصيم|عسير|تبوك|حائل|الحدود الشمالية|جازان|نجران|الباحة|الجوف|الدمام|الخبر|saudi|riyadh|jeddah|makkah|medina|dammam|khobar/i;

export function isSaudiMarketLocation(location?: string | null) {
  return saudiLocationPattern.test(location ?? '');
}
