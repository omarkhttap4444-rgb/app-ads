import { isSaudiMarketLocation } from '@/lib/market-config';

export type DealTier = 'hot_deal' | 'fair_price' | 'above_market' | 'suspiciously_low';

export type MarketBenchmark = {
  modelKey: string;
  conditionBucket: 'new' | 'used';
  sampleCount: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  p25Price?: number | null;
  p75Price?: number | null;
  officialNewPrice?: number | null;
};

export type DealAssessment = {
  tier: DealTier;
  productPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  officialNewPrice?: number | null;
  sampleCount: number;
  /** Positive = cheaper than market median, negative = above median */
  savingsPercent: number;
  savingsAmount: number;
  /** 0.04..0.96 position on visual market price gauge */
  meterPosition: number;
};

export type PricedProductLike = {
  id: string;
  name: string;
  price: number;
  seller_id?: string | null;
  condition?: string | null;
  location?: string | null;
  is_sold?: boolean | null;
  created_at?: string | null;
  specifications?: Record<string, unknown> | null;
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const MODEL_REPLACEMENTS: Array<[string, string]> = [
  ['ايفون', 'iphone'],
  ['ابل', 'apple'],
  ['سامسونج', 'samsung'],
  ['سامسونغ', 'samsung'],
  ['جالاكسي', 'galaxy'],
  ['جلاكسي', 'galaxy'],
  ['شاومي', 'xiaomi'],
  ['شومي', 'xiaomi'],
  ['ريدمي', 'redmi'],
  ['بوكو', 'poco'],
  ['اوبو', 'oppo'],
  ['ريلمي', 'realme'],
  ['هواوي', 'huawei'],
  ['هونر', 'honor'],
  ['انفنكس', 'infinix'],
  ['انفينيكس', 'infinix'],
  ['فيفو', 'vivo'],
  ['تكنو', 'tecno'],
  ['نوكيا', 'nokia'],
  ['موتورولا', 'motorola'],
  ['وان بلس', 'oneplus'],
  ['ون بلس', 'oneplus'],
  ['برو ماكس', 'pro max'],
  ['بروماكس', 'pro max'],
  ['promax', 'pro max'],
  ['الترا', 'ultra'],
  ['بلس', 'plus'],
  ['ميني', 'mini'],
  ['نوت', 'note'],
  ['لايت', 'lite'],
];

export function normalizeMarketModelKey(raw: string): string {
  let s = String(raw ?? '').trim().toLowerCase();
  if (!s) return '';

  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(ARABIC_DIGITS[i], String(i));
    s = s.replaceAll(PERSIAN_DIGITS[i], String(i));
  }

  s = s
    .replaceAll('أ', 'ا')
    .replaceAll('إ', 'ا')
    .replaceAll('آ', 'ا')
    .replaceAll('ى', 'ي')
    .replaceAll('ؤ', 'و')
    .replaceAll('ئ', 'ي')
    .replaceAll('ة', 'ه')
    .replace(/[\u064B-\u0652]/g, '');

  s = s
    .replace(/(?:^|\s)\d+\s*(?:gb|g|tb|جيجا|تيرا|ترا|رام|ram)(?=\s|$)/giu, ' ')
    .replace(/(?:^|\s)(?:رام|ram)\s*\d+(?=\s|$)/giu, ' ')
    .replace(/\b(?:5g|4g|lte|dual sim)\b/gi, ' ');

  for (const [from, to] of MODEL_REPLACEMENTS) {
    s = s.replaceAll(from, to);
  }

  s = s
    .replace(/(?:^|\s)برو(?=\s|$)/g, ' pro')
    .replace(/[^\w\u0600-\u06FF\s+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (s.startsWith('apple iphone')) {
    s = s.replace(/^apple\s+/, '').trim();
  }
  if (s.startsWith('samsung galaxy ')) {
    s = s.replace(/^samsung galaxy\s+/, 'samsung ').trim();
  }

  return s;
}

export function getConditionBucket(rawCondition?: string | null): 'new' | 'used' {
  const c = String(rawCondition ?? '').trim().toLowerCase();
  if (c.includes('جديد') && !c.includes('كسر') && !c.includes('كالجديد')) {
    return 'new';
  }
  if (c === 'new' || c.includes('brand new') || c.includes('sealed')) {
    return 'new';
  }
  return 'used';
}

const INVALID_MODEL_VALUES = new Set(['', 'اخرى', 'أخرى', 'other', 'غير محدد', 'null']);

export function extractProductModelKey(product: PricedProductLike): string {
  const specs = (product.specifications ?? {}) as Record<string, unknown>;
  const rawModel = String(specs.model ?? '').trim();
  const rawBrand = String(specs.brand ?? '').trim();

  if (!INVALID_MODEL_VALUES.has(rawModel.toLowerCase())) {
    const combined =
      !INVALID_MODEL_VALUES.has(rawBrand.toLowerCase()) &&
      !rawModel.toLowerCase().includes(rawBrand.toLowerCase())
        ? `${rawBrand} ${rawModel}`
        : rawModel;
    const normalized = normalizeMarketModelKey(combined);
    if (normalized.length >= 3) return normalized;
  }

  return normalizeMarketModelKey(product.name);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return Math.round(sorted[0]);
  const idx = p * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return Math.round(sorted[lower]);
  const weight = idx - lower;
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

export function buildBenchmarksFromProducts(
  products: PricedProductLike[],
  isSaudi: boolean,
  officialPricesByModelKey?: Map<string, number>,
): Map<string, MarketBenchmark> {
  const grouped = new Map<string, number[]>();
  const minValid = isSaudi ? 150 : 800;
  const maxValid = isSaudi ? 20000 : 250000;

  for (const p of products) {
    const price = Number(p.price ?? 0);
    if (p.is_sold || !Number.isFinite(price) || price < minValid || price > maxValid) continue;
    if (isSaudiMarketLocation(p.location) !== isSaudi) continue;
    const modelKey = extractProductModelKey(p);
    if (modelKey.length < 3) continue;
    const bucket = getConditionBucket(p.condition);
    const key = `${modelKey}|${bucket}`;
    const list = grouped.get(key) ?? [];
    list.push(price);
    grouped.set(key, list);
  }

  const benchmarks = new Map<string, MarketBenchmark>();
  for (const [compositeKey, prices] of grouped.entries()) {
    if (prices.length < 2) continue;
    prices.sort((a, b) => a - b);
    const roughMedian = percentile(prices, 0.5);
    if (roughMedian <= 0) continue;

    const clean = prices.filter((v) => v >= roughMedian * 0.25 && v <= roughMedian * 2.5);
    const effective = clean.length >= 2 ? clean : prices;
    const [modelKey, bucket] = compositeKey.split('|') as [string, 'new' | 'used'];

    benchmarks.set(compositeKey, {
      modelKey,
      conditionBucket: bucket,
      sampleCount: effective.length,
      medianPrice: percentile(effective, 0.5),
      p25Price: percentile(effective, 0.25),
      p75Price: percentile(effective, 0.75),
      minPrice: Math.round(effective[0]),
      maxPrice: Math.round(effective[effective.length - 1]),
      officialNewPrice: officialPricesByModelKey?.get(modelKey) ?? null,
    });
  }

  return benchmarks;
}

export function evaluatePriceAgainstBenchmark(
  productPrice: number,
  benchmark: MarketBenchmark,
): DealAssessment | null {
  if (!Number.isFinite(productPrice) || productPrice <= 0) return null;
  if (!benchmark || benchmark.medianPrice <= 0 || benchmark.sampleCount < 2) return null;

  const median = benchmark.medianPrice;
  const rawSavingsPct = ((median - productPrice) / median) * 100;
  const savingsPercent = Math.round(rawSavingsPct);

  let tier: DealTier;
  if (rawSavingsPct >= 45) {
    tier = 'suspiciously_low';
  } else if (rawSavingsPct >= 10) {
    tier = 'hot_deal';
  } else if (rawSavingsPct >= -10) {
    tier = 'fair_price';
  } else {
    tier = 'above_market';
  }

  const gaugeMin = Math.min(benchmark.minPrice, median * 0.7);
  const gaugeMax = Math.max(benchmark.maxPrice, median * 1.3);
  const span = Math.max(1, gaugeMax - gaugeMin);
  const meterPosition = Math.min(0.96, Math.max(0.04, (productPrice - gaugeMin) / span));

  return {
    tier,
    productPrice: Math.round(productPrice),
    medianPrice: Math.round(median),
    minPrice: Math.round(benchmark.minPrice),
    maxPrice: Math.round(benchmark.maxPrice),
    officialNewPrice: benchmark.officialNewPrice ?? null,
    sampleCount: benchmark.sampleCount,
    savingsPercent,
    savingsAmount: Math.max(0, Math.round(median - productPrice)),
    meterPosition,
  };
}

export function assessProductDeal(
  product: PricedProductLike,
  benchmarks: Map<string, MarketBenchmark>,
): DealAssessment | null {
  const price = Number(product.price ?? 0);
  if (product.is_sold || !Number.isFinite(price) || price <= 0) return null;
  const modelKey = extractProductModelKey(product);
  if (modelKey.length < 3) return null;
  const bucket = getConditionBucket(product.condition);
  const bm = benchmarks.get(`${modelKey}|${bucket}`);
  if (!bm) return null;
  return evaluatePriceAgainstBenchmark(price, bm);
}

function getDailyKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dailyDeterministicHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) & 0x7fffffff;
  }
  return h % 1000;
}

export function extractHotDeals<T extends PricedProductLike>(
  products: T[],
  benchmarks: Map<string, MarketBenchmark>,
  limit = 10,
  now: Date = new Date(),
): Array<{ product: T; assessment: DealAssessment }> {
  const dayKey = getDailyKey(now);
  const nowMs = now.getTime();
  const scored: Array<{ product: T; assessment: DealAssessment; score: number; modelKey: string }> = [];

  for (const product of products) {
    const assessment = assessProductDeal(product, benchmarks);
    if (!assessment || assessment.tier !== 'hot_deal') continue;

    const createdMs = product.created_at ? new Date(product.created_at).getTime() : nowMs;
    const ageDays = Number.isFinite(createdMs)
      ? Math.max(0, Math.floor((nowMs - createdMs) / 86_400_000))
      : 7;

    const freshnessBonus =
      ageDays <= 2 ? 24 : ageDays <= 7 ? 16 : ageDays <= 14 ? 8 : ageDays <= 30 ? 0 : -14;
    const dailyRotation = (dailyDeterministicHash(`${product.id}|${dayKey}`) / 1000) * 22;
    const score = assessment.savingsPercent * 1.15 + freshnessBonus + dailyRotation;

    scored.push({
      product,
      assessment,
      score,
      modelKey: extractProductModelKey(product),
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // Diversity Pass 1: max 1 listing per seller AND max 1 per model
  const selected: Array<{ product: T; assessment: DealAssessment }> = [];
  const usedSellers = new Set<string>();
  const usedModels = new Set<string>();
  const overflow: typeof scored = [];

  for (const item of scored) {
    const seller = String(item.product.seller_id ?? '').trim();
    const model = item.modelKey;
    const sellerOk = !seller || !usedSellers.has(seller);
    const modelOk = !model || !usedModels.has(model);
    if (sellerOk && modelOk) {
      selected.push({ product: item.product, assessment: item.assessment });
      if (seller) usedSellers.add(seller);
      if (model) usedModels.add(model);
      if (selected.length >= limit) break;
    } else {
      overflow.push(item);
    }
  }

  // Diversity Pass 2 (only if <3 items): allow same model from distinct sellers
  const minFill = Math.min(3, limit);
  if (selected.length < minFill) {
    for (const item of overflow) {
      const seller = String(item.product.seller_id ?? '').trim();
      if (seller && usedSellers.has(seller)) continue;
      selected.push({ product: item.product, assessment: item.assessment });
      if (seller) usedSellers.add(seller);
      if (selected.length >= minFill) break;
    }
  }

  return selected;
}
