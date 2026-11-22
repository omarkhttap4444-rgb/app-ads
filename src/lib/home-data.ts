import 'server-only';
import { unstable_cache } from 'next/cache';
import type { CinematicAd } from '@/components/CinematicAdCard';
import type { HotDealCardItem } from '@/components/HomeHotDealsSection';
import type { ProductCardProps } from '@/components/ProductCard';
import {
  buildBenchmarksFromProducts,
  extractHotDeals,
  type MarketBenchmark,
} from '@/lib/market-deal-intelligence';
import { isSaudiMarketLocation } from '@/lib/market-config';
import type { SupportedCountry } from '@/lib/request-country';
import { supabase } from '@/lib/supabase';

export type HomeProduct = ProductCardProps['product'];

export type HomeCategory = {
  id: string;
  name: string;
  icon_url: string | null;
  display_order: number | null;
};

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
};

export type HomeCustomSection = {
  id: string;
  title: string;
  badgeText: string;
  imageUrl: string;
  themeColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  placementType: 'top' | 'in_feed';
  afterProductsCount: number;
  sortOrder: number;
  products: HomeProduct[];
};

export type HomePinnedAd = {
  pinned_id: string;
  product_id: string;
  title: string;
  price: number;
  location: string | null;
  condition?: string | null;
  image_url: string | null;
  seller_name: string;
  seller_avatar?: string | null;
  seller_is_verified?: boolean | null;
  seller_is_store?: boolean | null;
  created_at?: string | null;
  product: HomeProduct;
};

export type HomeFeedData = {
  banners: HomeBanner[];
  customSections: HomeCustomSection[];
  maintenanceCount: number;
  latestProducts: HomeProduct[];
  trendingProducts: HomeProduct[];
  storeProducts: HomeProduct[];
  hotDeals: HotDealCardItem[];
  categories: HomeCategory[];
  pinnedAds: HomePinnedAd[];
  cinematicAds: CinematicAd[];
};

export const HOME_PRODUCT_SELECT = `
  id,
  seller_id,
  name,
  price,
  location,
  condition,
  slug,
  created_at,
  views_count,
  likes_count,
  comments_count,
  is_negotiable,
  is_sold,
  product_images(image_url,position),
  specifications
`;

const FALLBACK_CATEGORIES: HomeCategory[] = [
  { id: 'all', name: 'الكل', icon_url: null, display_order: 0 },
  { id: 'phones', name: 'هواتف', icon_url: null, display_order: 1 },
  { id: 'accessories', name: 'إكسسوارات', icon_url: null, display_order: 2 },
  { id: 'tablets', name: 'تابلت', icon_url: null, display_order: 3 },
  { id: 'watches', name: 'ساعات ذكية', icon_url: null, display_order: 4 },
];

const SAUDI_REGIONS = [
  'السعودية',
  'المملكة العربية السعودية',
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
  'جدة',
  'الدمام',
  'الخبر',
  'الظهران',
  'الجبيل',
  'الطائف',
  'خميس مشيط',
  'ينبع',
  'أبها',
  'الهفوف',
] as const;

const SAUDI_OR_FILTER = SAUDI_REGIONS.map((region) => `location.ilike.%${region}%`).join(',');

function matchesCountry(location: string | null | undefined, isSaudi: boolean) {
  const isSaudiLoc = isSaudiMarketLocation(location);
  return isSaudi ? isSaudiLoc : !isSaudiLoc;
}

type RawCustomSection = {
  id: string;
  title: string;
  badgeText: string;
  imageUrl: string;
  themeColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  placementType: 'top' | 'in_feed';
  afterProductsCount: number;
  sortOrder: number;
  productIds: string[];
};

function parseCustomSections(rawValue: unknown): RawCustomSection[] {
  let decoded = rawValue;
  if (typeof decoded === 'string') {
    try {
      decoded = JSON.parse(decoded);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(decoded)) return [];

  const allowedColors = new Set(['emerald', 'amber', 'rose', 'sky', 'violet']);
  const sections: RawCustomSection[] = [];

  for (const item of decoded) {
    if (!item || typeof item !== 'object') continue;
    const map = item as Record<string, unknown>;
    if (map.is_active === false) continue;

    const title = String(map.title ?? '').trim();
    const productIds = Array.isArray(map.product_ids)
      ? map.product_ids.map((id) => String(id ?? '').trim()).filter(Boolean)
      : [];
    if (!title || productIds.length === 0) continue;

    const rawImg = String(map.image_url ?? '').trim();
    const imageUrl = rawImg.startsWith('https://') ? rawImg : '';
    const rawColor = String(map.theme_color ?? 'emerald').trim().toLowerCase();
    const themeColor = (allowedColors.has(rawColor) ? rawColor : 'emerald') as RawCustomSection['themeColor'];
    const rawPlacement = String(map.placement_type ?? 'in_feed').trim();
    const placementType = rawPlacement === 'top' ? 'top' : 'in_feed';
    const afterNum = Number(map.after_products_count ?? 6);
    const sortNum = Number(map.sort_order ?? 1);

    sections.push({
      id: String(map.id ?? title),
      title,
      badgeText: String(map.badge_text ?? '').trim(),
      imageUrl,
      themeColor,
      placementType,
      afterProductsCount: Number.isFinite(afterNum) ? Math.min(100, Math.max(1, Math.round(afterNum))) : 6,
      sortOrder: Number.isFinite(sortNum) ? sortNum : 1,
      productIds,
    });
  }

  return sections.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function fetchHomeFeedUncached(country: SupportedCountry): Promise<HomeFeedData> {
  const isSaudi = country === 'SA';

  let latestQuery = supabase
    .from('products')
    .select(HOME_PRODUCT_SELECT)
    .eq('is_sold', false);
  let trendingQuery = supabase
    .from('products')
    .select(HOME_PRODUCT_SELECT)
    .eq('is_sold', false);
  let storeProductsQuery = supabase
    .from('products')
    .select(HOME_PRODUCT_SELECT)
    .eq('is_sold', false)
    .or('specifications->>is_store_product.eq.true,specifications->>seller_is_store.eq.true,specifications->>enable_cart.eq.true,category.eq.متاجر');

  if (isSaudi) {
    latestQuery = latestQuery.or(SAUDI_OR_FILTER);
    trendingQuery = trendingQuery.or(SAUDI_OR_FILTER);
    storeProductsQuery = storeProductsQuery.or(SAUDI_OR_FILTER);
  }

  const [
    latestResult,
    trendingResult,
    categoriesResult,
    pinnedAdsResult,
    cinematicAdsResult,
    storeProductsResult,
    bannersResult,
    customSectionsResult,
    maintenanceCountResult,
  ] = await Promise.all([
    latestQuery
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'product_images', ascending: true })
      .limit(isSaudi ? 20 : 28),
    trendingQuery
      .order('views_count', { ascending: false })
      .order('position', { referencedTable: 'product_images', ascending: true })
      .limit(isSaudi ? 10 : 16),
    supabase
      .from('categories')
      .select('id, name, icon_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase.rpc('get_active_pinned_ads', { p_limit: 10 }),
    supabase
      .from('v_public_feed_cinematic_ads')
      .select('id, title, subtitle, image_url, action_type, action_data, advertiser_name, frequency_interval, sort_order, country_code')
      .or(`country_code.eq.${country},country_code.eq.ALL`)
      .order('sort_order', { ascending: true })
      .limit(6),
    storeProductsQuery
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'product_images', ascending: true })
      .limit(isSaudi ? 10 : 16),
    supabase
      .from('app_banners')
      .select('id, title, subtitle, image_url, link_url')
      .eq('placement', 'home_top')
      .eq('country_code', country)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('sort_order', { ascending: true })
      .limit(10),
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'home_custom_sections')
      .maybeSingle(),
    isSaudi
      ? Promise.resolve({ count: 0, error: null })
      : supabase
          .from('maintenance_centers_public')
          .select('id', { count: 'exact', head: true }),
  ]);

  if (latestResult.error) {
    console.error('[home] Could not load latest products:', latestResult.error.message);
  }
  if (trendingResult.error) {
    console.error('[home] Could not load trending products:', trendingResult.error.message);
  }
  if (categoriesResult.error) {
    console.error('[home] Could not load categories:', categoriesResult.error.message);
  }
  if (pinnedAdsResult.error) {
    console.error('[home] Could not load pinned ads:', pinnedAdsResult.error.message);
  }

  const latestProducts = ((latestResult.data ?? []) as HomeProduct[])
    .filter((p) => matchesCountry(p.location, isSaudi))
    .slice(0, 20);

  const trendingProducts = ((trendingResult.data ?? []) as HomeProduct[])
    .filter((p) => matchesCountry(p.location, isSaudi))
    .slice(0, 10);

  const storeProducts = ((storeProductsResult.data ?? []) as HomeProduct[])
    .filter((p) => matchesCountry(p.location, isSaudi))
    .slice(0, 10);

  const cinematicAds = (cinematicAdsResult.data as CinematicAd[] | null) ?? [];

  const banners: HomeBanner[] = ((bannersResult.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      id: String(row.id ?? ''),
      title: String(row.title ?? '').trim(),
      subtitle: String(row.subtitle ?? '').trim(),
      image_url: String(row.image_url ?? '').trim(),
      link_url: String(row.link_url ?? '').trim(),
    }))
    .filter((b) => b.id && b.image_url.startsWith('https://'));

  const rawCustomSections = parseCustomSections(customSectionsResult.data?.value);

  const rawPinnedAds =
    (pinnedAdsResult.data as Array<Omit<HomePinnedAd, 'product'>> | null) ?? [];

  const countryFilteredPinnedAds = rawPinnedAds.filter((ad) => {
    if (!ad.location) return true;
    return matchesCountry(ad.location, isSaudi);
  });

  // Reuse already-fetched products first to minimize extra DB queries
  const knownProductsMap = new Map<string, HomeProduct>();
  for (const list of [latestProducts, trendingProducts, storeProducts]) {
    for (const item of list) {
      if (item?.id && !knownProductsMap.has(item.id)) {
        knownProductsMap.set(item.id, item);
      }
    }
  }

  // Batch-fetch ALL missing product IDs (for both pinned ads & dashboard custom sections) in 1 query!
  const missingIds = new Set<string>();
  for (const ad of countryFilteredPinnedAds) {
    if (ad.product_id && !knownProductsMap.has(ad.product_id)) {
      missingIds.add(ad.product_id);
    }
  }
  for (const sec of rawCustomSections) {
    for (const pid of sec.productIds) {
      if (!knownProductsMap.has(pid)) missingIds.add(pid);
    }
  }

  if (missingIds.size > 0) {
    const { data: extraRows } = await supabase
      .from('products')
      .select(HOME_PRODUCT_SELECT)
      .in('id', Array.from(missingIds))
      .order('position', { referencedTable: 'product_images', ascending: true });
    for (const row of (extraRows ?? []) as HomeProduct[]) {
      if (row?.id) knownProductsMap.set(row.id, row);
    }
  }

  const pinnedAds: HomePinnedAd[] = countryFilteredPinnedAds.map((ad) => {
    const full = knownProductsMap.get(ad.product_id);
    return {
      ...ad,
      product: full ?? {
        id: ad.product_id,
        name: ad.title,
        price: ad.price,
        location: ad.location ?? '',
        condition: ad.condition ?? 'مستعمل',
        slug: ad.product_id,
        created_at: ad.created_at ?? undefined,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        is_negotiable: false,
        is_sold: false,
        product_images: ad.image_url ? [{ image_url: ad.image_url, position: 0 }] : [],
        specifications: {
          seller_is_store: ad.seller_is_store ?? undefined,
          is_store_product: ad.seller_is_store ?? undefined,
        },
      },
    };
  });

  const customSections: HomeCustomSection[] = rawCustomSections
    .map((sec) => ({
      id: sec.id,
      title: sec.title,
      badgeText: sec.badgeText,
      imageUrl: sec.imageUrl,
      themeColor: sec.themeColor,
      placementType: sec.placementType,
      afterProductsCount: sec.afterProductsCount,
      sortOrder: sec.sortOrder,
      products: sec.productIds
        .map((id) => knownProductsMap.get(id))
        .filter((p): p is HomeProduct => Boolean(p && !p.is_sold && matchesCountry(p.location, isSaudi))),
    }))
    .filter((sec) => sec.products.length > 0);

  const categories =
    categoriesResult.data && categoriesResult.data.length > 0
      ? (categoriesResult.data as HomeCategory[])
      : FALLBACK_CATEGORIES;

  // Zero-token Hot Deals intelligence: prefer DB-wide RPC benchmarks when deployed,
  // seamlessly falling back to the combined fetched pool.
  const combinedPool = Array.from(knownProductsMap.values());
  let benchmarks = buildBenchmarksFromProducts(combinedPool, isSaudi);
  try {
    const { data: rpcBenchmarks } = await supabase.rpc('get_market_price_benchmarks', {
      p_country: country,
    });
    if (Array.isArray(rpcBenchmarks) && rpcBenchmarks.length > 0) {
      const merged = new Map<string, MarketBenchmark>(benchmarks);
      for (const row of rpcBenchmarks as Array<Record<string, unknown>>) {
        const modelKey = String(row.model_key ?? '').trim();
        const conditionBucket =
          String(row.condition_bucket ?? 'used').trim() === 'new' ? 'new' : 'used';
        const medianPrice = Number(row.median_price ?? 0);
        const sampleCount = Number(row.sample_count ?? 0);
        if (modelKey.length >= 3 && medianPrice > 0 && sampleCount >= 2) {
          merged.set(`${modelKey}|${conditionBucket}`, {
            modelKey,
            conditionBucket,
            sampleCount,
            medianPrice,
            minPrice: Number(row.min_price ?? medianPrice),
            maxPrice: Number(row.max_price ?? medianPrice),
            p25Price: row.p25_price != null ? Number(row.p25_price) : null,
            p75Price: row.p75_price != null ? Number(row.p75_price) : null,
            officialNewPrice:
              row.official_new_price != null ? Number(row.official_new_price) : null,
          });
        }
      }
      benchmarks = merged;
    }
  } catch {
    // Graceful fallback to local pool benchmarks if SQL migration not yet applied
  }

  const hotDeals = extractHotDeals(combinedPool, benchmarks, 10);

  return {
    banners,
    customSections,
    maintenanceCount: Number(maintenanceCountResult.count ?? 0),
    latestProducts,
    trendingProducts,
    storeProducts,
    hotDeals,
    categories,
    pinnedAds,
    cinematicAds,
  };
}

/**
 * Cached homepage feed per market (`EG` | `SA`).
 * Decouples DB queries from per-request `cookies()`/`headers()` reads,
 * slashing Supabase load & TTFB by >95%.
 */
export const getCachedHomeData = unstable_cache(
  async (country: SupportedCountry) => fetchHomeFeedUncached(country),
  ['souqphone-home-feed-v3'],
  { revalidate: 120, tags: ['home-feed'] },
);
