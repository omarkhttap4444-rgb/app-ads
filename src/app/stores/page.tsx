import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Store,
  ShieldCheck,
  Star,
  MapPin,
  Users,
  ChevronLeft,
  Sparkles,
  ShoppingBag,
  BadgeCheck,
} from 'lucide-react';
import { cache } from 'react';
import ProductCard from '@/components/ProductCard';
import PlayStoreLink from '@/components/PlayStoreLink';
import { getRequestCountry } from '@/lib/request-country';
import { isSaudiMarketLocation } from '@/lib/market-config';
import { cleanBio } from '@/lib/store-metadata';
import { supabase } from '@/lib/supabase';
import { INDEXABLE_ROBOTS } from '@/lib/seo';

export const revalidate = 60;

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

const filterByCountry = <T,>(query: CountryFilterable<T>, country: string): T => {
  if (country === 'SA') {
    const saudiRegions = [
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
    ];
    return query.or(saudiRegions.map((r) => `location.ilike.%${r}%`).join(','));
  }

  const egyptGovernorates = [
    'مصر',
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
  return query.or(egyptGovernorates.map((g) => `location.ilike.%${g}%`).join(','));
};

const getActiveStores = cache(async (country: string) => {
  try {
    const query = supabase
      .from('public_profiles')
      .select(
        'id, user_id, name, profile_image_url, cover_image_url, bio, governorate, is_verified, is_store, has_active_store_subscription, followers_count, seller_rating, seller_ratings_count, created_at',
      )
      .or('has_active_store_subscription.eq.true,is_store.eq.true')
      .order('followers_count', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) {
      console.error('[stores] Error fetching active stores:', error.message);
      return [];
    }

    const isSaudi = country === 'SA';
    return (data ?? []).filter((store) => {
      const isSaudiLoc = isSaudiMarketLocation(store.governorate);
      return isSaudi ? isSaudiLoc : !isSaudiLoc;
    });
  } catch (err) {
    console.error('[stores] Unexpected error:', err);
    return [];
  }
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'المتاجر المعتمدة | سوق فون' },
    description:
      'تصفح المتاجر المعتمدة ومحلات الهواتف والإلكترونيات الموثوقة على سوق فون. ضمان معتمد وأسعار منافسة وتواصل مباشر.',
    alternates: { canonical: 'https://souqphone.com/stores' },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      title: 'المتاجر المعتمدة | سوق فون',
      description: 'أفضل متاجر ومحلات الهواتف الموثوقة مع ضمان معتمد وعروض حصرية.',
      url: 'https://souqphone.com/stores',
      siteName: 'سوق فون',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedCountry = typeof params.country === 'string' ? params.country.toUpperCase() : '';
  const country = await getRequestCountry(requestedCountry);
  const selectedCategory = typeof params.category === 'string' ? params.category.trim() : 'الكل';
  const isSaudi = country === 'SA';

  const stores = await getActiveStores(country);

  // Fetch store products
  let productsQuery = supabase
    .from('products')
    .select(productSelection)
    .eq('is_sold', false);

  productsQuery = filterByCountry(productsQuery, country);

  // Filter products that belong to stores or are store products
  productsQuery = productsQuery.or(
    'specifications->>is_store_product.eq.true,specifications->>seller_is_store.eq.true,specifications->>enable_cart.eq.true,category.eq.متاجر',
  );

  if (selectedCategory && selectedCategory !== 'الكل') {
    productsQuery = productsQuery.eq('category', selectedCategory);
  }

  const { data: storeProductsRaw, error: prodErr } = await productsQuery
    .order('created_at', { ascending: false })
    .limit(40);

  if (prodErr) {
    console.error('[stores] Error loading store products:', prodErr.message);
  }

  const storeProducts = (storeProductsRaw ?? []).filter((p) => {
    const isSaudiLoc = isSaudiMarketLocation(p.location);
    return isSaudi ? isSaudiLoc : !isSaudiLoc;
  });

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'phones', name: 'هواتف' },
    { id: 'accessories', name: 'إكسسوارات' },
    { id: 'tablets', name: 'تابلت' },
    { id: 'smartWatches', name: 'ساعات ذكية' },
    { id: 'headphones', name: 'سماعات' },
    { id: 'laptops', name: 'لابتوبات' },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-12 dark:bg-[#0d0d0d]">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 pt-4 text-xs font-bold text-[#6a7175] dark:text-[#a5acaf]">
          <Link href="/" className="hover:text-[#079447]">الرئيسية</Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="text-[#202326] dark:text-white">المتاجر المعتمدة</span>
        </nav>

        {/* Hero Header */}
        <section className="mt-4 overflow-hidden rounded-[28px] border border-amber-400/30 bg-gradient-to-br from-[#0c2417] via-[#103020] to-[#1a2c14] p-6 text-white shadow-[0_16px_36px_-18px_rgba(3,152,85,0.4)] md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ffd700] to-[#ff9800] px-3 py-1 text-xs font-black text-[#1c1400]">
                  <Sparkles className="h-3.5 w-3.5 fill-[#1c1400]" />
                  متاجر موثوقة رسمياً
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md">
                  {stores.length} متجر معتمد
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black md:text-4xl">
                دليل المتاجر المعتمدة {isSaudi ? 'في السعودية' : 'في مصر'}
              </h1>
              <p className="mt-2 text-xs font-medium text-white/85 sm:text-sm md:text-base leading-relaxed">
                تصفح أفضل محلات الهواتف والأجهزة التقنية. منتجات أصلية، فحص دقيق، ضمانات معتمدة، وتواصل مباشر بدون وسطاء.
              </p>
            </div>

            <div className="shrink-0">
              <PlayStoreLink
                placement="stores_hero"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-[#ff8a22] to-[#ff6d34] px-5 py-3.5 text-xs font-black text-white shadow-lg transition hover:brightness-110 md:text-sm"
              >
                <Store className="h-4 w-4" />
                افتح متجرك الآن عبر التطبيق
              </PlayStoreLink>
            </div>
          </div>
        </section>

        {/* Section 1: Stores Directory (بطاقات المتاجر) */}
        {stores.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-[#d4af37]" />
                  <h2 className="text-base font-black text-[#242628] dark:text-white md:text-xl">
                    المتاجر المعتمدة
                  </h2>
                </div>
                <p className="mr-3.5 mt-0.5 text-[10px] font-bold text-[#8d9498] md:text-xs">
                  تجار موثوقون وحسابات تجارية مفعلة
                </p>
              </div>
            </div>

            <div className="scroll-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="group relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_8px_24px_-16px_rgba(16,24,40,0.12)] transition duration-300 hover:-translate-y-1 hover:border-amber-400/50 dark:border-[#2d3339] dark:bg-[#181d20] sm:w-[280px]"
                >
                  {/* Cover */}
                  <div className="relative h-24 w-full bg-gradient-to-r from-[#00a86b]/20 to-[#d4af37]/20 overflow-hidden">
                    {store.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={store.cover_image_url}
                        alt={store.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-l from-[#078d45] to-[#12b95f] opacity-80" />
                    )}
                  </div>

                  {/* Logo / Info */}
                  <div className="relative flex flex-1 flex-col p-4 pt-0">
                    <div className="-mt-8 flex items-end justify-between">
                      <div className="relative flex h-16 w-16 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md dark:border-[#181d20] dark:bg-[#20262a]">
                        {store.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={store.profile_image_url}
                            alt={store.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#079447]">
                            {store.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-black text-[#b45309] dark:text-[#ffd54f]">
                        <ShieldCheck className="h-3 w-3" />
                        موثوق
                      </span>
                    </div>

                    <Link href={`/store/${store.id}`} className="mt-3 block">
                      <h3 className="truncate text-sm font-black text-[#202326] transition group-hover:text-[#079447] dark:text-white">
                        {store.name}
                      </h3>
                      {store.governorate && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#666d71] dark:text-[#a0a8ad]">
                          <MapPin className="h-3 w-3 text-[#079447]" />
                          {store.governorate}
                        </p>
                      )}
                    </Link>

                    {cleanBio(store.bio) && (
                      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#757b7f] dark:text-[#a3abae]">
                        {cleanBio(store.bio)}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-[#edf0ee] pt-3 dark:border-[#282e33]">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#eab308]">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {Number(store.seller_rating ?? 0) > 0
                          ? Number(store.seller_rating).toFixed(1)
                          : 'جديد'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#868d92] dark:text-[#a2aab0]">
                        <Users className="h-3 w-3" />
                        {store.followers_count ?? 0} متابع
                      </span>
                    </div>

                    <Link
                      href={`/store/${store.id}`}
                      className="mt-3 block w-full rounded-xl bg-[#eef7f1] py-2 text-center text-xs font-black text-[#078d45] transition hover:bg-[#078d45] hover:text-white dark:bg-[#1a2d22] dark:text-[#4ade80] dark:hover:bg-[#078d45] dark:hover:text-white"
                    >
                      زيارة المتجر
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Store Products (أجهزة معتمدة من المتاجر) */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center px-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full bg-[#12b95f]" />
                <h2 className="text-base font-black text-[#242628] dark:text-white md:text-xl">
                  منتجات وأجهزة المتاجر المعتمدة
                </h2>
              </div>
              <p className="mr-3.5 mt-0.5 text-[10px] font-bold text-[#8d9498] md:text-xs">
                أجهزة مفحوصة ومضمونة جاهزة للشراء والتوصيل
              </p>
            </div>

            {/* Category tabs */}
            <div className="scroll-hide flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name || (selectedCategory === 'الكل' && cat.name === 'الكل');
                return (
                  <Link
                    key={cat.id}
                    href={cat.name === 'الكل' ? '/stores' : `/stores?category=${encodeURIComponent(cat.name)}`}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                      isActive
                        ? 'bg-[#079447] text-white shadow-sm'
                        : 'bg-white text-[#555a5f] hover:bg-[#ecefed] dark:bg-[#202020] dark:text-[#d0d0d0]'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {storeProducts.length > 0 ? (
            <div className="product-card-grid">
              {storeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#e7e9ec] bg-white py-16 text-center dark:border-[#343434] dark:bg-[#1f1f1f]">
              <span className="text-5xl">🏪</span>
              <p className="mt-3 text-sm font-black text-[#50555a] dark:text-[#d3d3d3]">
                لا توجد منتجات متاحة حالياً في هذا القسم من المتاجر
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

