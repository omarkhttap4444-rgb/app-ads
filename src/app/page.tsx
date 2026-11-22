import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  ChevronLeft,
  Flame,
  Grid2X2,
  History,
  Plus,
  Sparkles,
  Store,
} from 'lucide-react';

import BrandSlider from '@/components/BrandSlider';
import HomeAccountPrompt from '@/components/HomeAccountPrompt';
import HomeBannerCarousel from '@/components/HomeBannerCarousel';
import HomeCustomSectionRail from '@/components/HomeCustomSectionRail';
import HomeHotDealsSection from '@/components/HomeHotDealsSection';
import HomeMaintenanceBanner from '@/components/HomeMaintenanceBanner';
import CountryBanner from '@/components/CountryBanner';
import JsonLd from '@/components/JsonLd';
import PlayStoreLink from '@/components/PlayStoreLink';
import ProductCard from '@/components/ProductCard';
import CinematicAdCard from '@/components/CinematicAdCard';
import { getCategoryImageUrl } from '@/lib/category-images';
import { getCachedHomeData } from '@/lib/home-data';
import { getRequestCountry } from '@/lib/request-country';
import { INDEXABLE_ROBOTS, SITE_URL } from '@/lib/seo';
import { buildMobilesLandingPath, EGYPT_GOVERNORATES } from '@/lib/seo-content';

function isNextImageSafeSrc(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const parsed = new URL(src);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'images.souqphone.com' ||
        parsed.hostname.endsWith('.supabase.co') ||
        parsed.hostname.endsWith('.supabase.in'))
    );
  } catch {
    return false;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'سوق فون | بيع وشراء الموبايلات والإلكترونيات' },
    description: 'بيع واشتري الموبايلات والإلكترونيات الجديدة والمستعملة في مصر والسعودية. إعلانات حقيقية، بحث ذكي وتواصل مباشر مع البائع بدون عمولة.',
    alternates: { canonical: 'https://souqphone.com/' },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      title: `سوق فون | كل السوق في إيدك`,
      description: 'بيع واشتري الموبايلات والإلكترونيات مباشرة وبدون عمولة في مصر والسعودية.',
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
      description: 'بيع واشتري الموبايلات والإلكترونيات.',
      images: ['/og.png'],
    },
  };
}

export const revalidate = 120;

export default async function Home() {
  const country = await getRequestCountry();
  const isSaudi = country === 'SA';
  const mobilesHref = (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (isSaudi) params.set('country', 'SA');
    for (const [key, value] of Object.entries(filters)) params.set(key, value);
    const query = params.toString();
    return `/mobiles${query ? `?${query}` : ''}`;
  };

  const {
    banners,
    customSections,
    maintenanceCount,
    latestProducts,
    trendingProducts,
    storeProducts,
    hotDeals,
    categories,
    pinnedAds,
    cinematicAds,
  } = await getCachedHomeData(country);

  const topCustomSections = customSections.filter((s) => s.placementType === 'top');
  const inFeedCustomSections = customSections.filter((s) => s.placementType !== 'top');

  const homeFaqs = isSaudi
    ? [
        {
          q: 'هل يفرض سوق فون عمولة على بيع أو شراء الموبايلات في السعودية؟',
          a: 'لا، البيع والشراء والتواصل المباشر بين البائع والمشتري على سوق فون مجاني تماماً بدون أي عمولة وساطة.',
        },
        {
          q: 'كيف أتحقق من حالة الهاتف المستعمل قبل الشراء؟',
          a: 'راجع الصور الحقيقية وصحة البطارية ومواصفات الجهاز المذكورة في الإعلان، ثم افحص الجهاز بنفسك عند المقابلة قبل الدفع.',
        },
        {
          q: 'هل توجد متاجر معتمدة تقدم ضماناً على الأجهزة؟',
          a: 'نعم، يعرض قسم أجهزة المتاجر المعتمدة إعلانات المحلات الموثقة مع تفاصيل الضمان والتوصيل المتاح.',
        },
      ]
    : [
        {
          q: 'هل يفرض سوق فون عمولة على بيع أو شراء الموبايلات في مصر؟',
          a: 'لا، النشر والتواصل المباشر مع البائع عبر الهاتف أو واتساب أو الشات داخل المنصة مجاني 100% بدون أي عمولة.',
        },
        {
          q: 'كيف أجد مركز صيانة موبايلات موثوق في القاهرة؟',
          a: 'يمكنك تصفح دليل مراكز الصيانة المعتمدة في القاهرة على سوق فون ومقارنة الضمان والتقييمات والتخصصات والتواصل مباشرة مع المركز.',
        },
        {
          q: 'ما الفرق بين إعلانات الأفراد وأجهزة المتاجر المعتمدة؟',
          a: 'أجهزة المتاجر المعتمدة تأتي من محلات موثقة على المنصة وغالباً تتضمن ضماناً واضحاً وألواناً متعددة وخيار التوصيل.',
        },
      ];

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(latestProducts.length > 0
        ? [
            {
              '@type': 'ItemList',
              name: isSaudi ? 'أحدث إعلانات الموبايلات في السعودية' : 'أحدث إعلانات الموبايلات في مصر',
              numberOfItems: Math.min(12, latestProducts.length),
              itemListElement: latestProducts.slice(0, 12).map((p, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${SITE_URL}/mobiles/${encodeURIComponent(p.slug)}`,
                name: p.name,
              })),
            },
          ]
        : []),
      {
        '@type': 'FAQPage',
        mainEntity: homeFaqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-8 dark:bg-[#0d0d0d]">
      <JsonLd data={homeStructuredData} />

      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        {/* Visible SEO Hero Strip */}
        <section className="pt-3 md:pt-4">
          <div className="flex flex-col justify-between gap-3 rounded-[22px] border border-[#e3eae6] bg-white px-4 py-3.5 shadow-[0_8px_24px_-18px_rgba(7,148,71,0.22)] dark:border-[#242a2f] dark:bg-[#161a1e] sm:flex-row sm:items-center sm:px-5">
            <div className="min-w-0">
              <h1 className="text-sm font-black leading-snug text-[#13241b] dark:text-white sm:text-base md:text-lg">
                {isSaudi
                  ? 'سوق فون السعودية — بيع واشتري الموبايلات والإلكترونيات بدون عمولة'
                  : 'سوق فون مصر — بيع واشتري الموبايلات والإلكترونيات بدون عمولة'}
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold text-[#5f6b65] dark:text-[#9ca3af] sm:text-xs">
                إعلانات حقيقية، متاجر معتمدة، وتواصل مباشر مع البائع {isSaudi ? 'في جميع مناطق المملكة' : 'في جميع محافظات مصر'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/mobiles/add"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#079447] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#067c3b]"
              >
                <Plus className="h-4 w-4" />
                أضف إعلانك
              </Link>
              <PlayStoreLink
                placement="home_banner"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6e4dc] bg-[#f4fbf7] px-3 py-2 text-xs font-black text-[#078b43] transition hover:bg-[#e8f7ee] dark:border-[#244333] dark:bg-[#12261b] dark:text-[#6ee7b7]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
                  <path d="M3.6 2.3c-.36.37-.6.95-.6 1.7v16c0 .75.24 1.33.62 1.68l.09.08L12.7 13v-.02L3.69 2.22l-.09.08Zm10.4 9.38L12.7 13l-8.98 8.98c.25.26.65.29 1.11.03l10.17-5.79-1.4-2.2Zm3.35-1.9-2.05-1.17-1.55 1.39 1.72 1.72 1.88-1.07c.6-.34.6-.9 0-1.24v-.63ZM3.72 2.02c.25-.13.58-.1.93.1l10.15 5.78-1.75 1.75L3.72 2.02Z"/>
                </svg>
                التطبيق
              </PlayStoreLink>
            </div>
          </div>
        </section>

        {/* Dynamic Top Hero Banners from Admin Dashboard (R2) */}
        <HomeBannerCarousel banners={banners} />

        <HomeAccountPrompt />

        <CountryBanner country={country as 'EG' | 'SA'} />

        {/* Cairo Maintenance Directory Banner (Egypt Market) */}
        {!isSaudi && <HomeMaintenanceBanner centersCount={maintenanceCount} />}

        {/* Top Dashboard Custom Sections */}
        {topCustomSections.map((section) => (
          <HomeCustomSectionRail key={section.id} section={section} />
        ))}

        {/* 👑 VIP PINNED ADS CAROUSEL (أعلى الرئيسية - صدارة السوق) */}
        {pinnedAds.length > 0 ? (
          <section className="mt-4 overflow-hidden rounded-[26px] border border-amber-500/30 bg-gradient-to-br from-[#f6fbf8] via-white to-[#fcfbf5] p-4 shadow-[0_14px_30px_-18px_rgba(217,119,6,0.22)] dark:border-amber-400/25 dark:from-[#0e2019] dark:via-[#13261e] dark:to-[#192016] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
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
                  className="relative flex w-[calc(50%-7px)] min-w-[168px] shrink-0 snap-start flex-col rounded-[24px] border border-amber-400/35 bg-white p-[1px] shadow-[0_8px_22px_-14px_rgba(16,24,40,0.18)] transition duration-300 hover:-translate-y-1 hover:border-amber-400/60 dark:border-amber-400/30 dark:bg-[#1f1f1f] sm:w-[215px] md:w-[235px]"
                >
                  <div className="flex flex-1 flex-col overflow-hidden rounded-[23px] bg-white dark:bg-[#1f1f1f]">
                    <div className="flex-1 [&_.app-product-card]:!rounded-b-none [&_.app-product-card]:!border-0 [&_.app-product-card]:hover:!translate-y-0">
                      <ProductCard product={ad.product} priority={index < 2} />
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
        ) : (
          /* VIP Pinning Invitation Prompt Banner */
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-[#fffbf0] via-[#fdf8e6] to-[#fff] p-3.5 shadow-sm dark:border-amber-400/20 dark:from-[#211a0c] dark:to-[#17140e] sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffd700] via-[#ffa000] to-[#ff6f00] text-lg text-white shadow-sm">
                👑
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#1f2937] dark:text-[#ffd54f]">صدارة السوق VIP</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[8.5px] font-bold text-[#8b6508] dark:text-amber-300">موصى به</span>
                </div>
                <p className="mt-0.5 text-[10.5px] font-bold text-[#6b7280] dark:text-[#e5e7eb]">
                  ثبّت إعلانك الآن عبر تطبيق سوق فون ليصل لآلاف المشترين فوراً في قمة الصفحة
                </p>
              </div>
            </div>
            <PlayStoreLink placement="pinned_ad_empty" className="self-end shrink-0 rounded-xl bg-gradient-to-l from-[#d97706] to-[#b45309] px-4 py-2 text-[10.5px] font-black text-white shadow-sm transition hover:brightness-110 sm:self-center">
              ثبّت إعلانك الآن عبر التطبيق
            </PlayStoreLink>
          </div>
        )}

        {/* Quick Filter Navigation */}
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

        {/* Categories Section */}
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
            {categories.map((category) => {
              const rawSrc = getCategoryImageUrl(category.name, category.icon_url);
              const safeSrc = isNextImageSafeSrc(rawSrc) ? rawSrc : '/categories/tf.jpg';
              return (
                <Link key={category.id} href={mobilesHref({ category: category.name })} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 md:w-[92px]">
                  <span className="h-[66px] w-[66px] overflow-hidden rounded-full border-2 border-[#e7e9ec] bg-[#f3f5f4] p-1 transition group-hover:border-[#61cf8f] dark:border-[#343434] dark:bg-[#242424] md:h-[76px] md:w-[76px]">
                    <Image
                      src={safeSrc}
                      alt={category.name}
                      width={76}
                      height={76}
                      sizes="76px"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </span>
                  <span className="line-clamp-1 text-center text-[9px] font-black text-[#50555a] dark:text-[#d3d3d3] md:text-[10px]">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 🏪 STORE PRODUCTS SHOWCASE (أجهزة معتمدة من المتاجر) */}
        {storeProducts.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-[#f2fbf6] via-white to-[#f7fcf9] p-4 shadow-[0_12px_28px_-20px_rgba(0,168,107,0.18)] dark:border-emerald-500/25 dark:from-[#0c1f17] dark:via-[#11261d] dark:to-[#16291e] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00a86b] to-[#047857] text-xl text-white shadow-md">
                  <Store className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[#0a2718] dark:text-white md:text-xl">
                      أجهزة معتمدة من المتاجر
                    </h2>
                    <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[9.5px] font-black text-[#065f46] dark:text-[#6ee7b7]">
                      ضمان معتمد 🛡️
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-bold text-[#059669] dark:text-[#a7f3d0] md:text-xs">
                    عروض حصرية وضمانات من متاجر سوق فون الموثوقة
                  </p>
                </div>
              </div>

              <Link
                href="/stores"
                className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-[#079447] shadow-sm transition hover:bg-[#eaf6ef] dark:bg-[#1a3326] dark:text-[#6ee7b7]"
              >
                دليل المتاجر
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="scroll-hide flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2">
              {storeProducts.map((product) => (
                <div
                  key={`store-${product.id}`}
                  className="w-[calc(50%-7px)] min-w-[168px] shrink-0 snap-start sm:w-[215px] md:w-[235px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🎬 1st CINEMATIC AD BANNER (الإعلانات السينمائية) */}
        {cinematicAds.length > 0 && (
          <div className="mt-6">
            <CinematicAdCard ad={cinematicAds[0]} isSaudi={isSaudi} />
          </div>
        )}

        {/* Latest Ads */}
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
              <ProductCard
                key={product.id}
                product={product}
                priority={pinnedAds.length === 0 && index < 2}
              />
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

        {/* 🎬 2nd CINEMATIC AD BANNER (إذا وجد إعلان سينمائي ثانٍ) */}
        {cinematicAds.length > 1 && (
          <div className="mt-6">
            <CinematicAdCard ad={cinematicAds[1]} isSaudi={isSaudi} />
          </div>
        )}

        {/* In-Feed Dashboard Custom Sections */}
        {inFeedCustomSections.map((section) => (
          <HomeCustomSectionRail key={section.id} section={section} />
        ))}

        {/* 🔥 TODAY'S HOT DEALS (لقطات اليوم — داخل الفيد بعيداً عن صدارة VIP والمتاجر) */}
        <HomeHotDealsSection deals={hotDeals} isSaudi={isSaudi} />

        <BrandSlider />

        {/* Trending Section */}
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

        {/* SEO Guide Section */}
        <section className="mt-7 rounded-[28px] border border-[#e3e8e5] bg-white p-5 shadow-[0_14px_34px_-30px_rgba(16,24,40,0.4)] dark:border-[#343434] dark:bg-[#1a1a1a] md:p-7" aria-labelledby="seo-guide-title">
          <h2 id="seo-guide-title" className="text-base font-black text-[#242628] dark:text-white md:text-xl">
            سوق الموبايلات الجديدة والمستعملة {isSaudi ? 'في السعودية' : 'في مصر'}
          </h2>
          <p className="mt-2 max-w-4xl text-xs font-medium leading-7 text-[#697075] dark:text-[#b7babc] md:text-sm">
            يساعدك سوق فون على مقارنة إعلانات الهواتف والإلكترونيات حسب الماركة والحالة والمحافظة. راجع صور الجهاز ومواصفاته وسعره، ثم تواصل مباشرة مع البائع لإتمام الاتفاق بدون عمولة من المنصة.
          </p>
          <h3 className="mt-5 text-sm font-black text-[#303532] dark:text-white">
            {isSaudi ? 'موبايلات للبيع حسب المنطقة' : 'موبايلات للبيع حسب المحافظة'}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(isSaudi
              ? ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'القصيم', 'عسير', 'تبوك']
              : EGYPT_GOVERNORATES.slice(0, 14)
            ).map((region) => (
              <Link
                key={region}
                href={buildMobilesLandingPath({ location: region, country: isSaudi ? 'SA' : 'EG' })}
                className="rounded-full border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-[10px] font-black text-[#56605b] transition hover:border-[#8dd9ac] hover:bg-[#effcf4] hover:text-[#078b43] dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-[#d0d0d0]"
              >
                موبايلات في {region}
              </Link>
            ))}
          </div>

          {/* Visible FAQ Accordion (matched 1:1 with FAQPage JSON-LD) */}
          <div className="mt-6 border-t border-[#ebf0ed] pt-5 dark:border-[#2a2f34]">
            <h3 className="text-sm font-black text-[#242628] dark:text-white">
              أسئلة شائعة حول سوق فون
            </h3>
            <div className="mt-3 space-y-2">
              {homeFaqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-[#e7ece9] bg-[#f9fbfa] px-4 py-3 dark:border-[#2d3339] dark:bg-[#20252a]"
                >
                  <summary className="cursor-pointer list-none text-xs font-black text-[#1f2937] dark:text-white sm:text-sm">
                    {faq.q}
                  </summary>
                  <p className="mt-2 text-xs font-medium leading-6 text-[#5f6b65] dark:text-[#b7babc]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Post Ad CTA Banner */}
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
