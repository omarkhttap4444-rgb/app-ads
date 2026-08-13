const normalizeArabic = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/\s+/g, ' ');

export function getCategoryImageUrl(name: string, iconUrl?: string | null) {
  if (iconUrl?.startsWith('https://') || iconUrl?.startsWith('http://')) {
    return iconUrl;
  }

  const normalized = normalizeArabic(name);

  if (/هواتف|هاتف|موبايلات|موبايل/.test(normalized)) return '/categories/phone.jpg';
  if (/لابتوبات|لابتوب|لاب توب|حاسوب/.test(normalized)) return '/categories/L.jpg';
  if (/تابليت|تابلت|لوحي|الواحي/.test(normalized)) return '/categories/t.jpg';
  if (/ساعات|ساعه/.test(normalized)) return '/categories/s.jpg';
  if (/سماعات|سماعه|ايربودز/.test(normalized)) return '/categories/sm.jpg';
  if (/اكسسوارات|اكسسوار|جرابات|حافظات|شواحن|كابلات/.test(normalized)) {
    return '/categories/x.jpg';
  }
  if (/محلات|متاجر|محل|متجر/.test(normalized)) return '/categories/mt.jpg';
  if (/الكل|جميع/.test(normalized)) return '/categories/kl.jpg';
  return '/categories/tf.jpg';
}
