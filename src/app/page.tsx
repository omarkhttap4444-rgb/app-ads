import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BadgeCheck,
  ChevronLeft,
  Flame,
  Grid2X2,
  History,
  Plus,
  Sparkles,
} from 'lucide-react';

import BrandSlider from '@/components/BrandSlider';
import HomeAccountPrompt from '@/components/HomeAccountPrompt';
import PlayStoreLink from '@/components/PlayStoreLink';
import ProductCard from '@/components/ProductCard';
import { cache } from 'react';
import { getCategoryImageUrl } from '@/lib/category-images';
import { getRequestCountry } from '@/lib/request-country';
import { supabase } from '@/lib/supabase';
import { INDEXABLE_ROBOTS } from '@/lib/seo';
import { buildMobilesLandingPath, EGYPT_GOVERNORATES } from '@/lib/seo-content';

const getCachedCategories = cache(() =>
  supabase
    .from('categories')
    .select('id, name, icon_url, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true }),
);


const productSelection = `
  id,
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

type CountryFilterable<T> = {
  or: (filters: string) => T;
};

const filterByCountry = <T,>(
  query: CountryFilterable<T>,
  country: string,
): T => {
  if (country === 'SA') {
    const regions = [
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
    ];
    return query.or(
      regions.map((region) => `location.ilike.${region}%`).join(','),
    );
  }

  const governorates = [
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
  ];

  return query.or(
    governorates
      .map((governorate) => `location.ilike.${governorate}%`)
      .join(','),
  );
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'سوق فون مصر | بيع وشراء الموبايلات والإلكترونيات' },
    description: 'بيع واشتري الموبايلات والإلكترونيات الجديدة والمستعملة في مصر. إعلانات حقيقية، بحث ذكي وتواصل مباشر مع البائع بدون عمولة.',
    alternates: { canonical: 'https://souqphone.com/' },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      title: `سوق فون | كل السوق في إيدك`,
      description: 'بيع واشتري الموبايلات والإلكترونيات مباشرة وبدون عمولة في مصر.',
      url: 'https://souqphone.com/',
      siteName: 'سوق فون',
      locale: 'ar_EG',
      type: 'website',
      images: [
        { url: '/og.png', width: 1731, height: 909, alt: 'سوق فون - كل السوق في إيدك' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'سوق فون | كل السوق في إيدك',
      description: 'بيع واشتري الموبايلات والإلكترونيات في مصر.',
      images: ['/og.png'],
    },
  };
}

export const revalidate = 60;

export default async function Home() {
  const country = await getRequestCountry();
  const mobilesHref = (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (country === 'SA') params.set('country', 'SA');
    for (const [key, value] of Object.entries(filters)) params.set(key, value);
    const query = params.toString();
    return `/mobiles${query ? `?${query}` : ''}`;
  };

  let latestQuery = supabase.from('products').select(productSelection);
  latestQuery = filterByCountry(latestQuery, country);

  let trendingQuery = supabase.from('products').select(productSelection);
  trendingQuery = filterByCountry(trendingQuery, country);

  const [
    latestResult,
    trendingResult,
    categoriesResult,
    pinnedAdsResult,
  ] = await Promise.all([
    latestQuery.eq('is_sold', false).order('created_at', { ascending: false }).order('position', { referencedTable: 'product_images', ascending: true }).limit(20),
    trendingQuery.eq('is_sold', false).order('views_count', { ascending: false }).order('position', { referencedTable: 'product_images', ascending: true }).limit(10),
    getCachedCategories(),
    supabase.rpc('get_active_pinned_ads', { p_limit: 10 }),
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

  const latestProducts = latestResult.data ?? [];
  const trendingProducts = trendingResult.data ?? [];
  const rawPinnedAds =
    (pinnedAdsResult.data as Array<{
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
    }> | null) ?? [];

  const pinnedFullProductsMap = new Map<string, (typeof latestProducts)[number]>();
  if (rawPinnedAds.length > 0) {
    const pinnedProductIds = Array.from(
      new Set(rawPinnedAds.map((a) => a.product_id).filter(Boolean)),
    );
    const { data: pinnedProductRows } = await supabase
      .from('products')
      .select(productSelection)
      .in('id', pinnedProductIds);
    for (const row of pinnedProductRows ?? []) {
      if (row?.id) {
        pinnedFullProductsMap.set(row.id, row);
      }
    }
  }

  const pinnedAds = rawPinnedAds.map((ad) => {
    const full = pinnedFullProductsMap.get(ad.product_id);
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
        specifications: {},
      },
    };
  });
  const categories =
    categoriesResult.data && categoriesResult.data.length > 0
      ? categoriesResult.data
      : [
          { id: 'all', name: 'الكل', icon_url: null, display_order: 0 },
          { id: 'phones', name: 'هواتف', icon_url: null, display_order: 1 },
          { id: 'accessories', name: 'إكسسوارات', icon_url: null, display_order: 2 },
          { id: 'tablets', name: 'تابلت', icon_url: null, display_order: 3 },
          { id: 'watches', name: 'ساعات ذكية', icon_url: null, display_order: 4 },
        ];

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-6 dark:bg-[#0d0d0d]">
      <h1 className="sr-only">
        سوق فون لبيع وشراء الهواتف والأجهزة التقنية بدون عمولة
      </h1>

      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        {/* Download app CTA */}
        <div className="pt-3 md:pt-5">
          <PlayStoreLink
            placement="home_banner"
            className="group flex w-full items-center justify-between gap-3 rounded-[24px] bg-gradient-to-l from-[#087d3d] to-[#10ad58] px-5 py-4 text-white shadow-[0_14px_30px_-18px_rgba(3,152,85,0.9)] transition hover:brightness-105 md:py-5"
          >
            <span className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M3.6 2.3c-.36.37-.6.95-.6 1.7v16c0 .75.24 1.33.62 1.68l.09.08L12.7 13v-.02L3.69 2.22l-.09.08Zm10.4 9.38L12.7 13l-8.98 8.98c.25.26.65.29 1.11.03l10.17-5.79-1.4-2.2Zm3.35-1.9-2.05-1.17-1.55 1.39 1.72 1.72 1.88-1.07c.6-.34.6-.9 0-1.24v-.63ZM3.72 2.02c.25-.13.58-.1.93.1l10.15 5.78-1.75 1.75L3.72 2.02Z"/>
              </svg>
              <span>
                <span className="block text-[10px] font-bold text-white/85">حمّل تطبيق سوق فون</span>
                <span className="block text-sm font-black md:text-base">متاح الآن على Google Play</span>
              </span>
            </span>
            <span className="rounded-xl bg-white/15 px-3 py-2 text-[10px] font-black transition group-hover:bg-white/25 md:text-xs">
              تحميل
            </span>
          </PlayStoreLink>
        </div>

        <HomeAccountPrompt />

        <nav className="mt-4 grid grid-cols-[1fr_1fr_1.55fr] gap-2.5 md:mx-auto md:max-w-3xl md:gap-4" aria-label="تصفية سريعة">
          <Link href={mobilesHref({ condition: 'مستعمل' })} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#eef0ef] px-3 text-xs font-black text-[#5f6368] transition hover:bg-[#e6e9e7] dark:bg-[#252525] dark:text-[#d3d3d3] dark:hover:bg-[#2d2d2d] md:text-sm">
            <History className="h-5 w-5" />
            مستعمل
          </Link>
          <Link href={mobilesHref({ condition: 'جديد' })} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#eef0ef] px-3 text-xs font-black text-[#5f6368] transition hover:bg-[#e6e9e7] dark:bg-[#252525] dark:text-[#d3d3d3] dark:hover:bg-[#2d2d2d] md:text-sm">
            <BadgeCheck className="h-5 w-5 fill-current" />
            جديد
          </Link>
          <Link href={mobilesHref()} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#ff8a22] to-[#ff6d34] px-3 text-xs font-black text-white shadow-[0_12px_24px_-14px_rgba(255,109,52,0.8)] transition hover:brightness-105 md:text-sm">
            <Sparkles className="h-5 w-5" />
            تصفح سريع
            <Grid2X2 className="h-5 w-5 fill-white" />
          </Link>
        </nav>

        <section className="mt-5 overflow-hidden rounded-[24px] bg-white px-3 py-4 shadow-[0_10px_30px_-26px_rgba(16,24,40,0.32)] dark:bg-[#1a1a1a] md:px-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-[#242628] dark:text-white md:text-base">
                تصفح الأقسام
              </h2>
              <p className="mt-0.5 text-[9px] font-bold text-[#959b9f] md:text-[10px]">
                اختار القسم ووصل لإعلانك بسرعة
              </p>
            </div>
            <Link href={mobilesHref()} className="flex items-center gap-1 text-[10px] font-black text-[#079447] md:text-xs">
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="scroll-hide flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link key={category.id} href={mobilesHref({ category: category.name })} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 md:w-[92px]">
                <span className="h-[66px] w-[66px] overflow-hidden rounded-full border-2 border-[#e7e9ec] bg-[#f3f5f4] p-1 transition group-hover:border-[#61cf8f] dark:border-[#343434] dark:bg-[#242424] md:h-[76px] md:w-[76px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getCategoryImageUrl(category.name, category.icon_url)} alt={category.name} className="h-full w-full rounded-full object-cover" />
                </span>
                <span className="line-clamp-1 text-center text-[9px] font-black text-[#50555a] dark:text-[#d3d3d3] md:text-[10px]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {pinnedAds.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-[26px] border border-amber-500/20 bg-gradient-to-br from-[#f6fbf8] via-white to-[#fcfbf5] p-4 shadow-[0_12px_28px_-20px_rgba(16,24,40,0.16)] dark:border-amber-400/20 dark:from-[#0e2019] dark:via-[#13261e] dark:to-[#192016] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] via-[#ffa000] to-[#00a86b] text-xl text-white shadow-[0_6px_14px_rgba(255,179,0,0.28)]">
                  👑
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black text-[#0e291b] dark:text-white md:text-xl">
                      إعلانات مثبتة VIP
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ffd54f] to-[#ff8f00] px-2.5 py-0.5 text-[10px] font-black text-[#1f1600] shadow-sm">
                      📌 صدارة السوق
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-bold text-[#066940] dark:text-[#ffe082] md:text-xs">
                    عروض موثقة ومختارة بعناية في قمة سوق فون
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-2xl border border-amber-500/25 bg-emerald-600/10 px-3 py-1.5 text-[11px] font-black text-[#047857] dark:bg-white/10 dark:text-[#ffd54f]">
                {pinnedAds.length} مميز
              </span>
            </div>

            <div className="scroll-hide flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2">
              {pinnedAds.map((ad, index) => (
                <div
                  key={ad.pinned_id}
                  className="relative flex w-[calc(50%-7px)] min-w-[168px] shrink-0 snap-start flex-col rounded-[24px] border border-amber-400/30 bg-white p-[1px] shadow-[0_8px_22px_-14px_rgba(16,24,40,0.18)] transition duration-300 hover:-translate-y-1 hover:border-amber-400/50 dark:border-amber-400/25 dark:bg-[#1f1f1f] sm:w-[215px] md:w-[235px]"
                >
                  <div className="flex flex-1 flex-col overflow-hidden rounded-[23px] bg-white dark:bg-[#1f1f1f]">
                    <div className="flex-1 [&_.app-product-card]:!rounded-b-none [&_.app-product-card]:!border-0 [&_.app-product-card]:hover:!translate-y-0">
                      <ProductCard product={ad.product} priority={index < 4} />
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 bg-gradient-to-l from-[#f6fbf8] to-[#fffbf0] px-3 py-2 dark:from-[#1b2a22] dark:to-[#232015]">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[11px] font-black text-[#1f2937] dark:text-[#f5e6b8]">
                          {ad.seller_name}
                        </span>
                        {(ad.seller_is_verified || ad.seller_is_store) && (
                          <span className="text-xs text-[#1da1f2]" title="موثق">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[9px] font-black text-[#8b6508] dark:text-[#ffd54f]">
                        {ad.seller_is_store ? 'متجر مميز' : 'إعلان موثق'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-[#12b95f]" />
                <h2 className="text-base font-black text-[#242628] dark:text-white md:text-xl">
                  أحدث الإعلانات
                </h2>
              </div>
              <p className="mr-3 mt-1 text-[9px] font-bold text-[#92989c] md:text-xs">
                إعلانات جديدة من مستخدمين حقيقيين
              </p>
            </div>
            <Link href={mobilesHref()} className="flex items-center gap-1 text-[10px] font-black text-[#079447] md:text-xs">
              عرض المزيد
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="product-card-grid">
            {latestProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>

          {latestProducts.length === 0 && (
            <div className="rounded-[24px] border border-[#e7e9ec] bg-white py-16 text-center dark:border-[#343434] dark:bg-[#1f1f1f]">
              <span className="text-5xl">📱</span>
              <p className="mt-3 text-sm font-black text-[#50555a] dark:text-[#d3d3d3]">
                لا توجد إعلانات متاحة الآن
              </p>
            </div>
          )}
        </section>

        <BrandSlider />

        {trendingProducts.length > 0 && (
          <section className="mt-6 rounded-[28px] bg-gradient-to-b from-[#f0fff5] to-transparent p-3 dark:from-[#12271b] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e8] text-[#ff6d34] dark:bg-[#3b241a]">
                  <Flame className="h-5 w-5 fill-current" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-[#242628] dark:text-white md:text-lg">
                    الأكثر مشاهدة
                  </h2>
                  <p className="text-[9px] font-bold text-[#92989c] md:text-[10px]">
                    منتجات عليها اهتمام كبير الآن
                  </p>
                </div>
              </div>
              <Link href={mobilesHref({ sort: 'popular' })} className="flex items-center gap-1 text-[10px] font-black text-[#079447] md:text-xs">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="product-card-grid">
              {trendingProducts.slice(0, 10).map((product) => (
                <ProductCard key={`trending-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-7 rounded-[28px] border border-[#e3e8e5] bg-white p-5 shadow-[0_14px_34px_-30px_rgba(16,24,40,0.4)] dark:border-[#343434] dark:bg-[#1a1a1a] md:p-7" aria-labelledby="seo-guide-title">
          <h2 id="seo-guide-title" className="text-base font-black text-[#242628] dark:text-white md:text-xl">
            سوق الموبايلات الجديدة والمستعملة في مصر
          </h2>
          <p className="mt-2 max-w-4xl text-xs font-medium leading-7 text-[#697075] dark:text-[#b7babc] md:text-sm">
            يساعدك سوق فون على مقارنة إعلانات الهواتف والإلكترونيات حسب الماركة والحالة والمحافظة. راجع صور الجهاز ومواصفاته وسعره، ثم تواصل مباشرة مع البائع لإتمام الاتفاق بدون عمولة من المنصة.
          </p>
          <h3 className="mt-5 text-sm font-black text-[#303532] dark:text-white">موبايلات للبيع حسب المحافظة</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {EGYPT_GOVERNORATES.slice(0, 14).map((governorate) => (
              <Link
                key={governorate}
                href={buildMobilesLandingPath({ location: governorate })}
                className="rounded-full border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-[10px] font-black text-[#56605b] transition hover:border-[#8dd9ac] hover:bg-[#effcf4] hover:text-[#078b43] dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-[#d0d0d0]"
              >
                موبايلات في {governorate}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-[28px] bg-gradient-to-l from-[#087d3d] to-[#10ad58] p-6 text-white shadow-[0_18px_36px_-22px_rgba(3,152,85,0.8)] md:flex md:items-center md:justify-between md:px-9">
          <div>
            <p className="text-lg font-black md:text-2xl">عندك منتج عايز تبيعه؟</p>
            <p className="mt-1 text-xs font-bold text-white/80 md:text-sm">
              انشر إعلانك مجانًا وتواصل مع المشترين مباشرة
            </p>
          </div>
          <Link href="/mobiles/add" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-[#087d3d] shadow-lg md:mt-0 md:text-sm">
            <Plus className="h-5 w-5" />
            انشر إعلانك الآن
          </Link>
        </section>
      </div>
    </main>
  );
}
