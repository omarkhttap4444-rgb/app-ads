export const SAUDI_MARKET_ENABLED = true;

export const saudiLocationPattern =
  /السعودية|المملكة العربية السعودية|الرياض|جدة|مكة|المدينة المنورة|المنطقة الشرقية|القصيم|عسير|تبوك|حائل|الحدود الشمالية|جازان|نجران|الباحة|الجوف|الدمام|الخبر|الظهران|الجبيل|الطائف|خميس مشيط|ينبع|أبها|الهفوف|saudi|riyadh|jeddah|makkah|medina|dammam|khobar/i;

export function isSaudiMarketLocation(location?: string | null) {
  return saudiLocationPattern.test(location ?? '');
}
