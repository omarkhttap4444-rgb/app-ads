export type ParsedSmartSearchQuery = {
  rawQuery: string;
  coreQuery: string;
  detectedBrand: string | null;
  detectedCondition: string | null;
  detectedLocation: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  detectedStorage: string | null;
  detectedRam: string | null;
  wantsHotDeals: boolean;
  hasStructuredFilters: boolean;
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const BRAND_ALIASES: Record<string, string[]> = {
  'آبل': ['ايفون', 'آيفون', 'أيفون', 'ايفوون', 'iphone', 'apple', 'ابل', 'آبل', 'أبل', 'ايباد', 'ipad'],
  'سامسونج': ['سامسونج', 'سامسونغ', 'جالاكسي', 'جلاكسي', 'جالكسي', 'samsung', 'galaxy'],
  'شاومي': ['شاومي', 'شومي', 'ريدمي', 'بوكو', 'xiaomi', 'redmi', 'poco'],
  'أوبو': ['اوبو', 'أوبو', 'oppo'],
  'ريلمي': ['ريلمي', 'realme'],
  'هونر': ['هونر', 'honor'],
  'هواوي': ['هواوي', 'هواوى', 'huawei'],
  'إنفينيكس': ['انفنكس', 'انفينكس', 'انفينيكس', 'إنفينيكس', 'infinix'],
  'فيفو': ['فيفو', 'vivo'],
  'تكنو': ['تكنو', 'tecno'],
  'نوكيا': ['نوكيا', 'nokia'],
  'ون بلس': ['وان بلس', 'ون بلس', 'oneplus', 'one plus'],
  'موتورولا': ['موتورولا', 'motorola', 'moto'],
  'جوجل': ['بيكسل', 'pixel', 'google'],
};

const LOCATION_ALIASES: Record<string, string[]> = {
  'القاهرة': ['القاهرة', 'القاهره', 'قاهره', 'قاهرة', 'مدينة نصر', 'مدينه نصر', 'المعادي', 'المعادى', 'التجمع', 'مصر الجديدة', 'مصر الجديده', 'شبرا', 'حلوان', 'عين شمس', 'cairo'],
  'الجيزة': ['الجيزة', 'الجيزه', 'جيزه', 'جيزة', 'اكتوبر', 'أكتوبر', '6 اكتوبر', 'الشيخ زايد', 'زايد', 'الهرم', 'فيصل', 'الدقي', 'الدقى', 'المهندسين', 'giza'],
  'الإسكندرية': ['الإسكندرية', 'الاسكندرية', 'الاسكندريه', 'اسكندرية', 'اسكندريه', 'اسكندريا', 'alexandria', 'alex'],
  'الدقهلية': ['الدقهلية', 'الدقهليه', 'المنصورة', 'المنصوره', 'ميت غمر', 'السنبلاوين'],
  'الشرقية': ['الشرقية', 'الشرقيه', 'الزقازيق', 'العاشر من رمضان', 'بلبيس', 'فاقوس'],
  'القليوبية': ['القليوبية', 'القليوبيه', 'بنها', 'شبرا الخيمة', 'العبور'],
  'الغربية': ['الغربية', 'الغربيه', 'طنطا', 'المحلة', 'المحله'],
  'المنوفية': ['المنوفية', 'المنوفيه', 'شبين الكوم', 'السادات', 'منوف'],
  'البحيرة': ['البحيرة', 'البحيره', 'دمنهور', 'كفر الدوار'],
  'كفر الشيخ': ['كفر الشيخ', 'كفرالشيخ', 'دسوق'],
  'دمياط': ['دمياط', 'رأس البر'],
  'بورسعيد': ['بورسعيد', 'بور سعيد'],
  'الإسماعيلية': ['الإسماعيلية', 'الاسماعيلية', 'الاسماعيليه', 'اسماعيلية', 'اسماعيليه'],
  'السويس': ['السويس'],
  'الفيوم': ['الفيوم'],
  'بني سويف': ['بني سويف', 'بنى سويف'],
  'المنيا': ['المنيا', 'ملوي'],
  'أسيوط': ['أسيوط', 'اسيوط'],
  'سوهاج': ['سوهاج', 'جرجا'],
  'قنا': ['قنا', 'نجع حمادي'],
  'الأقصر': ['الأقصر', 'الاقصر', 'اقصر'],
  'أسوان': ['أسوان', 'اسوان'],
  'البحر الأحمر': ['البحر الأحمر', 'البحر الاحمر', 'الغردقة', 'الغردقه'],
  'مطروح': ['مطروح', 'مرسى مطروح'],
  // Saudi Arabia
  'الرياض': ['الرياض', 'riyadh'],
  'جدة': ['جدة', 'جده', 'jeddah'],
  'مكة المكرمة': ['مكة المكرمة', 'مكة', 'مكه', 'makkah'],
  'المدينة المنورة': ['المدينة المنورة', 'المدينة', 'المدينه', 'madinah'],
  'الدمام': ['الدمام', 'dammam'],
  'الخبر': ['الخبر', 'khobar'],
  'القصيم': ['القصيم', 'بريدة', 'بريده'],
  'عسير': ['عسير', 'أبها', 'ابها', 'خميس مشيط'],
  'تبوك': ['تبوك'],
  'الطائف': ['الطائف', 'الطايف'],
};

const SORTED_LOCATION_ENTRIES: Array<[string, string]> = Object.entries(LOCATION_ALIASES)
  .flatMap(([canonical, aliases]) => aliases.map((alias) => [canonical, alias] as [string, string]))
  .sort((a, b) => b[1].length - a[1].length);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumerals(input: string): string {
  let s = String(input ?? '').trim();
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(ARABIC_DIGITS[i], String(i));
    s = s.replaceAll(PERSIAN_DIGITS[i], String(i));
  }
  return s.replace(/[\u064B-\u0652]/g, '').replace(/\s+/g, ' ').trim();
}

function parseAmount(rawNum: string, unit?: string): number {
  const n = Number.parseFloat(rawNum.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  const u = (unit ?? '').trim().toLowerCase();
  if (u && (u.includes('الف') || u.includes('ألف') || u.includes('الاف') || u.includes('آلاف') || u === 'k')) {
    return n < 500 ? Math.round(n * 1000) : Math.round(n);
  }
  return Math.round(n);
}

export function parseSmartSearchQuery(rawQuery: string): ParsedSmartSearchQuery {
  const normalized = normalizeNumerals(rawQuery);
  if (!normalized) {
    return {
      rawQuery: '',
      coreQuery: '',
      detectedBrand: null,
      detectedCondition: null,
      detectedLocation: null,
      minPrice: null,
      maxPrice: null,
      detectedStorage: null,
      detectedRam: null,
      wantsHotDeals: false,
      hasStructuredFilters: false,
    };
  }

  let working = normalized;
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let detectedCondition: string | null = null;
  let detectedLocation: string | null = null;
  let detectedBrand: string | null = null;
  let detectedStorage: string | null = null;
  let detectedRam: string | null = null;
  let wantsHotDeals = false;

  // 1. Price range: "من 10 لـ 20 الف" / "بين 10 و 20 الف" / "from 10k to 20k"
  const rangeRe =
    /(?:من|بين|from|between)\s*(\d+(?:[.,]\d+)?)\s*(الاف|آلاف|ألف|الف|k)?\s*(?:الى|إلى|لـ|ل|حتى|و|-|to|and)\s*(\d+(?:[.,]\d+)?)\s*(الاف|آلاف|ألف|الف|k)?(?:\s*(?:جنيه|ج\.م|ريال|ر\.س|egp|sar))?/iu;
  const rangeMatch = working.match(rangeRe);
  if (rangeMatch) {
    const sharedUnit = rangeMatch[4] ?? rangeMatch[2];
    const v1 = parseAmount(rangeMatch[1], rangeMatch[2] ?? sharedUnit);
    const v2 = parseAmount(rangeMatch[3], rangeMatch[4] ?? sharedUnit);
    if (v1 > 0 && v2 > 0) {
      minPrice = Math.min(v1, v2);
      maxPrice = Math.max(v1, v2);
      working = working.replace(rangeMatch[0], ' ');
    }
  }

  // 2. Max price: "تحت 25 الف" / "اقل من 15000" / "under 15k"
  if (maxPrice === null) {
    const maxRe =
      /(?:تحت|أقل من|اقل من|بحد اقصى|بحد أقصى|لحد|حتى|ماكس|لا يزيد عن|under|below|max|<=)\s*(\d+(?:[.,]\d+)?)\s*(الاف|آلاف|ألف|الف|k)?(?:\s*(?:جنيه|ج\.م|ريال|ر\.س|egp|sar))?/iu;
    const m = working.match(maxRe);
    if (m) {
      const v = parseAmount(m[1], m[2]);
      if (v >= 200) {
        maxPrice = v;
        working = working.replace(m[0], ' ');
      }
    }
  }

  // 3. Min price: "فوق 10 الف" / "اكثر من 10000" / "above 10k"
  if (minPrice === null) {
    const minRe =
      /(?:فوق|أكثر من|اكثر من|اعلى من|أعلى من|بداية من|يبدأ من|above|over|min|>=)\s*(\d+(?:[.,]\d+)?)\s*(الاف|آلاف|ألف|الف|k)?(?:\s*(?:جنيه|ج\.م|ريال|ر\.س|egp|sar))?/iu;
    const m = working.match(minRe);
    if (m) {
      const v = parseAmount(m[1], m[2]);
      if (v >= 200) {
        minPrice = v;
        working = working.replace(m[0], ' ');
      }
    }
  }

  // 4. Around price: "في حدود 20 الف" / "حوالي 15 الف"
  if (minPrice === null && maxPrice === null) {
    const aroundRe =
      /(?:في حدود|فى حدود|حوالي|حوالى|بحوالي|بـ|ب)\s*(\d+(?:[.,]\d+)?)\s*(الاف|آلاف|ألف|الف|k)(?:\s*(?:جنيه|ج\.م|ريال|ر\.س|egp|sar))?/iu;
    const m = working.match(aroundRe);
    if (m) {
      const v = parseAmount(m[1], m[2]);
      if (v >= 200) {
        minPrice = Math.round(v * 0.8);
        maxPrice = Math.round(v * 1.2);
        working = working.replace(m[0], ' ');
      }
    }
  }

  // 5. Hot deals intent
  const dealRe = /(?:^|\s)(?:لقطه|لقطة|لقطات|صفقه|صفقة|عروض لقطة|hot deals?)(?=\s|$)/giu;
  if (dealRe.test(working)) {
    wantsHotDeals = true;
    working = working.replace(dealRe, ' ');
  }

  // 6. Condition
  const likeNewRe = /(?:^|\s)(?:كسر\s*زيرو|كالجديد|شبه\s*جديد|like\s*new)(?=\s|$)/giu;
  const usedRe = /(?:^|\s)(?:مستعمل|مستعملة|مستعمله|استعمال|used)(?=\s|$)/giu;
  const newRe = /(?:^|\s)(?:جديد|جديدة|جديده|متبرشم|زيرو|brand\s*new|sealed|new)(?=\s|$)/giu;

  if (likeNewRe.test(working)) {
    detectedCondition = 'كسر زيرو';
    working = working.replace(likeNewRe, ' ');
  } else if (usedRe.test(working)) {
    detectedCondition = 'مستعمل';
    working = working.replace(usedRe, ' ');
  } else if (newRe.test(working)) {
    detectedCondition = 'جديد';
    working = working.replace(newRe, ' ');
  }

  // 7. Location
  for (const [canonical, alias] of SORTED_LOCATION_ENTRIES) {
    const locRe = new RegExp(
      `(?:^|\\s)(?:في|فى|بـ|ب)?\\s*${escapeRegex(alias)}(?=\\s|$)`,
      'iu',
    );
    if (locRe.test(working)) {
      detectedLocation = canonical;
      working = working.replace(locRe, ' ');
      break;
    }
  }

  // 8. RAM & Storage
  const ramMatch = working.match(
    /(?:(?:رام|رامات|ram)\s*(\d{1,2})|(\d{1,2})\s*(?:جيجا|gb)?\s*(?:رام|رامات|ram))/iu,
  );
  if (ramMatch) {
    detectedRam = `${ramMatch[1] ?? ramMatch[2]} GB`;
  }

  const storageMatch = working.match(/(?:^|\s)(64|128|256|512)\s*(?:جيجا|gb|g)?(?=\s|$)/iu);
  if (storageMatch) {
    detectedStorage = `${storageMatch[1]} GB`;
  } else if (/(?:^|\s)1\s*(?:تيرا|ترا|tb)(?=\s|$)/iu.test(working)) {
    detectedStorage = '1 TB';
  }

  // 9. Brand
  const workingLower = working.toLowerCase();
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some((a) => workingLower.includes(a.toLowerCase()))) {
      detectedBrand = canonical;
      break;
    }
  }

  // 10. Strip filler words
  const coreQuery = working
    .replace(/(?:^|\s)(?:في|فى|بسعر|سعر|للبيع|موبايل|هاتف|تليفون|جوال)(?=\s|$)/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasStructuredFilters = Boolean(
    detectedCondition ||
      detectedLocation ||
      minPrice !== null ||
      maxPrice !== null ||
      detectedStorage ||
      detectedRam ||
      wantsHotDeals,
  );

  return {
    rawQuery: rawQuery.trim(),
    coreQuery,
    detectedBrand,
    detectedCondition,
    detectedLocation,
    minPrice,
    maxPrice,
    detectedStorage,
    detectedRam,
    wantsHotDeals,
    hasStructuredFilters,
  };
}

export function buildSmartSearchChips(
  parsed: ParsedSmartSearchQuery,
  isSaudi = false,
): string[] {
  const currency = isSaudi ? 'ر.س' : 'ج.م';
  const locale = isSaudi ? 'ar-SA' : 'ar-EG';
  const chips: string[] = [];
  if (parsed.coreQuery) chips.push(`🔍 ${parsed.coreQuery}`);
  if (parsed.detectedCondition) chips.push(`🏷️ ${parsed.detectedCondition}`);
  if (parsed.minPrice !== null && parsed.maxPrice !== null) {
    chips.push(
      `💰 ${parsed.minPrice.toLocaleString(locale)} - ${parsed.maxPrice.toLocaleString(locale)} ${currency}`,
    );
  } else if (parsed.maxPrice !== null) {
    chips.push(`💰 حتى ${parsed.maxPrice.toLocaleString(locale)} ${currency}`);
  } else if (parsed.minPrice !== null) {
    chips.push(`💰 من ${parsed.minPrice.toLocaleString(locale)} ${currency}`);
  }
  if (parsed.detectedLocation) chips.push(`📍 ${parsed.detectedLocation}`);
  if (parsed.detectedStorage) chips.push(`💾 ${parsed.detectedStorage}`);
  if (parsed.detectedRam) chips.push(`⚡ رام ${parsed.detectedRam}`);
  if (parsed.wantsHotDeals) chips.push('🔥 لقطات');
  return chips;
}
