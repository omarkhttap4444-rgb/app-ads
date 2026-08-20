export const SEO_BRANDS = [
  { name: 'آبل', logo: 'apple.png' },
  { name: 'سامسونج', logo: 'samsung.png' },
  { name: 'شاومي', logo: 'xiaomi.png' },
  { name: 'ريلمي', logo: 'realme.png' },
  { name: 'أوبو', logo: 'oppo.png' },
  { name: 'إنفينيكس', logo: 'infinix.png' },
  { name: 'هونر', logo: 'honor.png' },
  { name: 'فيفو', logo: 'vivo.png' },
  { name: 'هواوي', logo: 'huawei.png' },
  { name: 'نوكيا', logo: 'nokia.png' },
] as const;

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
] as const;

export const SAUDI_REGIONS = [
  'الرياض',
  'مكة المكرمة',
  'المدينة المنورة',
  'المنطقة الشرقية',
  'القصيم',
  'عسير',
  'تبوك',
  'حائل',
  'الحدود الشمالية',
  'جازان',
  'نجران',
  'الباحة',
  'الجوف',
] as const;

type LandingPathOptions = {
  country?: string;
  category?: string;
  brand?: string;
  location?: string;
  page?: number;
};

export function buildMobilesLandingPath({
  country = 'EG',
  category = '',
  brand = '',
  location = '',
  page = 1,
}: LandingPathOptions = {}) {
  const params = new URLSearchParams();
  if (country === 'SA') params.set('country', 'SA');
  if (category) params.set('category', category);
  if (brand) params.set('brand', brand);
  if (location) params.set('location', location);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/mobiles${query ? `?${query}` : ''}`;
}

export function isKnownSeoBrand(value: string) {
  return SEO_BRANDS.some((brand) => brand.name === value);
}

export function isKnownSeoLocation(value: string, country: string) {
  const locations = country === 'SA' ? SAUDI_REGIONS : EGYPT_GOVERNORATES;
  return locations.some((location) => location === value);
}
