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

import BannerCarousel from '@/components/BannerCarousel';
import BrandSlider from '@/components/BrandSlider';
import HomeAccountPrompt from '@/components/HomeAccountPrompt';
import ProductCard from '@/components/ProductCard';
import { getCategoryImageUrl } from '@/lib/category-images';
import { getRequestCountry } from '@/lib/request-country';
import { supabase } from '@/lib/supabase';

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
  product_images(image_url),
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
    robots: { index: true, follow: true },
    openGraph: {
      title: `سوق فون | كل السوق في إيدك`,
      description: 'بيع واشتري الموبايلات والإلكترونيات مباشرة وبدون عمولة في مصر.',
      url: 'https://souqphone.com/',
      siteName: 'سوق فون',
      locale: 'ar_EG',
      alternateLocale: ['ar_SA'],
      type: 'website',
      images: [
        { url: '/og.png', width: 1733, height: 909, alt: 'سوق فون - كل السوق في إيدك' },
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

export const dynamic = 'force-dynamic';

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
    bannersResult,
  ] = await Promise.all([
    latestQuery.order('created_at', { ascending: false }).limit(20),
    trendingQuery.order('views_count', { ascending: false }).limit(10),
    supabase
      .from('categories')
      .select('id, name, icon_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('app_banners')
      .select('id, title, subtitle, image_url, link_url')
      .eq('is_active', true)
      .eq('placement', 'home_top')
      .order('sort_order', { ascending: true }),
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
  if (bannersResult.error) {
    console.error('[home] Could not load banners:', bannersResult.error.message);
  }

  const latestProducts = latestResult.data ?? [];
  const trendingProducts = trendingResult.data ?? [];
  const categories =
    categoriesResult.data && categoriesResult.data.length > 0
      ? categoriesResult.data
      : [
          { id: 'all', name: 'الكل', icon_url: null, display_order: 0 },
          { id: 'phones', name: 'هواتف', icon_url: null, display_order: 1 },
          { id: 'accessories', name: 'إكسسوارات', icon_url: null, display_order: 2 },
          { id: 'tablets', name: 'أجهزة لوحية', icon_url: null, display_order: 3 },
          { id: 'watches', name: 'ساعات ذكية', icon_url: null, display_order: 4 },
        ];

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-6 dark:bg-[#0d0d0d]">
      <h1 className="sr-only">
        سوق فون لبيع وشراء الهواتف والأجهزة التقنية بدون عمولة
      </h1>

      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        <section className="pt-3 md:pt-5">
          <BannerCarousel banners={bannersResult.data ?? []} />
        </section>

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
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
