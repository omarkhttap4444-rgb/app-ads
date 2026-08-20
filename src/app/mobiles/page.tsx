import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cache } from 'react';
import MobilesFiltersWrapper from '@/components/MobilesFiltersWrapper';
import ProductCard, { type ProductCardProps } from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';
import { getRequestCountry } from '@/lib/request-country';
import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import {
  buildMobilesLandingPath,
  isKnownSeoBrand,
  isKnownSeoLocation,
} from '@/lib/seo-content';

const productSelection = 'id, name, price, location, condition, slug, created_at, views_count, likes_count, comments_count, is_negotiable, is_sold, product_images(image_url), specifications';
const PAGE_SIZE = 24;

const getActiveCategories = cache(() =>
  supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true }),
);

type Product = ProductCardProps['product'];
type SmartSearchRow = { id: string };
type CountryFilterable<T> = { or: (filters: string) => T };
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const getCollectionPath = (category: string, country: string) => {
  return buildMobilesLandingPath({ category, country });
};

const getPageNumber = (value: string | string[] | undefined) => {
  const parsed = Number.parseInt(typeof value === 'string' ? value : '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const filterByCountry = <T,>(query: CountryFilterable<T>, country: string): T => {
  if (country === 'SA') {
    const saudiRegions = ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'];
    const orConditions = saudiRegions.map(region => `location.ilike.${region}%`).join(',');
    return query.or(orConditions);
  } else {
    const egyptGovernorates = [
      'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
      'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
      'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
      'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
      'مطروح', 'شمال سيناء', 'جنوب سيناء'
    ];
    const orConditions = egyptGovernorates.map(gov => `location.ilike.${gov}%`).join(',');
    return query.or(orConditions);
  }
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const requestedCountry = typeof params.country === 'string' ? params.country.toUpperCase() : '';
  const country = await getRequestCountry(requestedCountry);
  const category = typeof params.category === 'string' ? params.category.trim() : '';
  const brand = typeof params.brand === 'string' ? params.brand.trim() : '';
  const location = typeof params.location === 'string' ? params.location.trim() : '';
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const page = getPageNumber(params.page);
  const hasSortingOrCondition = ['sort', 'condition'].some(
    (key) => typeof params[key] === 'string' && params[key],
  );
  const activeLandingFacets = [category, brand, location].filter(Boolean);
  const { data: activeCategories } = category
    ? await getActiveCategories()
    : { data: [] };
  const matchedCategory = !category || (activeCategories ?? []).some((item) => item.name === category);
  const hasValidFacet =
    matchedCategory &&
    (!brand || isKnownSeoBrand(brand)) &&
    (!location || isKnownSeoLocation(location, country));
  const countryName = country === 'SA' ? 'السعودية' : 'مصر';
  const baseTitle = brand
    ? `موبايلات ${brand} للبيع في ${countryName} - جديد ومستعمل`
    : location
      ? `موبايلات للبيع في ${location} - جديد ومستعمل`
      : category
        ? `${category} للبيع في ${countryName} - جديد ومستعمل`
        : `موبايلات وإلكترونيات للبيع في ${countryName}`;
  const title = `${baseTitle}${page > 1 ? ` - صفحة ${page}` : ''}`;
  const description = brand
    ? `قارن أسعار أحدث موبايلات ${brand} الجديدة والمستعملة المعروضة للبيع في ${countryName} وتواصل مباشرة مع البائع بدون عمولة.`
    : location
      ? `اعثر على موبايلات جديدة ومستعملة للبيع في ${location}، قارن الأسعار والحالة وتواصل مباشرة مع البائعين على سوق فون.`
      : category
        ? `تصفح أحدث إعلانات ${category} الجديدة والمستعملة في ${countryName}، قارن الأسعار وتواصل مباشرة مع البائع على سوق فون.`
        : `تصفح الموبايلات والإلكترونيات الجديدة والمستعملة للبيع في ${countryName}. بحث ذكي، أسعار متنوعة وتواصل مباشر مع البائعين.`;
  const indexable = !q && !hasSortingOrCondition && activeLandingFacets.length <= 1 && hasValidFacet;
  const landingOptions = indexable ? { category, brand, location } : {};
  const canonicalPath = buildMobilesLandingPath({ country, ...landingOptions, page: indexable ? page : 1 });
  const egyptPath = buildMobilesLandingPath({ country: 'EG', category, brand, page });
  const saudiPath = buildMobilesLandingPath({ country: 'SA', category, brand, page });
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: location
        ? undefined
        : {
            'ar-EG': egyptPath,
            ...(SAUDI_MARKET_ENABLED ? { 'ar-SA': saudiPath } : {}),
            'x-default': egyptPath,
          },
    },
    robots: {
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      images: ['/og.png'],
      locale: country === 'SA' ? 'ar_SA' : 'ar_EG',
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}

export const dynamic = 'force-dynamic';

export default async function MobilesPage(props: Props) {
  const searchParams = await props.searchParams;
  const requestedCountry = typeof searchParams.country === 'string'
    ? searchParams.country.toUpperCase()
    : '';
  const selectedCountry = await getRequestCountry(requestedCountry);
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  const condition = typeof searchParams.condition === 'string' ? searchParams.condition : '';
  const location = typeof searchParams.location === 'string' ? searchParams.location : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const brand = typeof searchParams.brand === 'string' ? searchParams.brand : '';
  const page = getPageNumber(searchParams.page);

  const { data: categories } = await getActiveCategories();

  let products: Product[] = [];
  let totalProducts = 0;

  if (q) {
    const { data: searchData, error: searchError } = await supabase.rpc('search_products_smart', {
      p_query: q,
      p_category: category || null,
      p_condition: condition || null,
      p_limit: 50
    });

    if (!searchError && searchData && searchData.length > 0) {
      const rankedResults = searchData as SmartSearchRow[];
      const productIds = rankedResults.map((item) => item.id);
      let dbQuery = supabase
        .from('products')
        .select(productSelection)
        .in('id', productIds);
      dbQuery = filterByCountry(dbQuery, selectedCountry);
      if (location) dbQuery = dbQuery.ilike('location', `%${location}%`);
      if (brand) dbQuery = dbQuery.eq('specifications->>brand', brand);
      const { data: fullProducts } = await dbQuery;
      if (fullProducts) {
        const hydratedProducts = fullProducts as Product[];
        products = rankedResults
          .map((item) => hydratedProducts.find((product) => product.id === item.id))
          .filter((product): product is Product => product !== undefined);
        if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
      }
    } else {
      const searchFields = `name.ilike.%${q}%,description.ilike.%${q}%,specifications->>brand.ilike.%${q}%,specifications->>model.ilike.%${q}%`;
      let fallbackQuery = supabase
        .from('products')
        .select(productSelection)
        .or(searchFields);
      fallbackQuery = filterByCountry(fallbackQuery, selectedCountry);
      if (category) fallbackQuery = fallbackQuery.ilike('category', `%${category}%`);
      if (condition) fallbackQuery = fallbackQuery.eq('condition', condition);
      if (location) fallbackQuery = fallbackQuery.ilike('location', `%${location}%`);
      if (brand) fallbackQuery = fallbackQuery.eq('specifications->>brand', brand);
      if (sort === 'price_asc') fallbackQuery = fallbackQuery.order('price', { ascending: true });
      else if (sort === 'price_desc') fallbackQuery = fallbackQuery.order('price', { ascending: false });
      else fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const { data: fallbackData } = await fallbackQuery.limit(50);
      products = (fallbackData || []) as Product[];
    }
    totalProducts = products.length;
    products = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    let query = supabase
      .from('products')
      .select(productSelection, { count: 'exact' });
    query = filterByCountry(query, selectedCountry);
    if (category) query = query.ilike('category', `%${category}%`);
    if (condition) query = query.eq('condition', condition);
    if (location) query = query.ilike('location', `%${location}%`);
    if (brand) query = query.eq('specifications->>brand', brand);
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
    products = (data || []) as Product[];
    totalProducts = count ?? from + products.length;
  }

  const hasFilters = q || condition || location || sort || category || brand;
  const countryName = selectedCountry === 'SA' ? 'السعودية' : 'مصر';
  const collectionName = brand
    ? `موبايلات ${brand} للبيع في ${countryName}`
    : location
      ? `موبايلات للبيع في ${location}`
      : category
        ? `${category} للبيع في ${countryName}`
        : `موبايلات وإلكترونيات للبيع في ${countryName}`;
  const collectionDescription = brand
    ? `قارن بين موبايلات ${brand} الجديدة والمستعملة، وتحقق من السعر والحالة ومكان البائع قبل التواصل المباشر.`
    : location
      ? `إعلانات موبايلات وإلكترونيات من بائعين في ${location}. قارن الأسعار والحالة واختر العرض الأنسب لك.`
      : category
        ? `أحدث إعلانات ${category} الجديدة والمستعملة مع أسعار وصور وتفاصيل تساعدك على المقارنة قبل التواصل.`
        : 'اكتشف أحدث الموبايلات والإلكترونيات الجديدة والمستعملة، وقارن الأسعار وتواصل مع البائع مباشرة بدون عمولة.';
  const isKnownCategory = !category || (categories ?? []).some((item) => item.name === category);
  const activeLandingFacets = [category, brand, location].filter(Boolean);
  const isIndexableCollection = !q && !sort && !condition && activeLandingFacets.length <= 1
    && isKnownCategory && (!brand || isKnownSeoBrand(brand))
    && (!location || isKnownSeoLocation(location, selectedCountry));
  const collectionPath = buildMobilesLandingPath({
    country: selectedCountry,
    ...(isIndexableCollection ? { category, brand, location } : {}),
    page: isIndexableCollection ? page : 1,
  });
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  if (totalProducts > 0 && page > totalPages) notFound();

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === 'page' || typeof value !== 'string' || !value) return;
      params.set(key, value);
    });
    if (targetPage > 1) params.set('page', String(targetPage));
    const query = params.toString();
    return `/mobiles${query ? `?${query}` : ''}`;
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(collectionPath)}#collection`,
    url: absoluteUrl(collectionPath),
    name: collectionName,
    inLanguage: 'ar',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalProducts,
      itemListElement: products.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: (page - 1) * PAGE_SIZE + index + 1,
        name: [product.specifications?.brand, product.specifications?.model]
          .filter(Boolean)
          .join(' ')
          .trim() || product.name,
        url: absoluteUrl(`/mobiles/${encodeURIComponent(product.slug)}`),
      })),
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: collectionName, item: absoluteUrl(collectionPath) },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] transition-colors dark:bg-[#0d0d0d]">
      {isIndexableCollection && <JsonLd data={collectionJsonLd} />}
      {isIndexableCollection && <JsonLd data={breadcrumbJsonLd} />}
      <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <nav className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-[#7c858a]" aria-label="مسار الصفحة">
          <Link href="/" className="transition hover:text-[#078b43]">الرئيسية</Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span aria-current="page">{collectionName}</span>
        </nav>
        
        {/* Search & Filters Card */}
        <div className="mb-5 rounded-[22px] border border-[#e7e9ec] bg-white p-3.5 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.4)] transition-colors dark:border-[#343434] dark:bg-[#1f1f1f] sm:rounded-[26px] sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black text-[#242628] dark:text-white md:text-xl">{collectionName}</h1>
              <p className="mt-1 max-w-3xl text-[11px] font-bold leading-6 text-[#737b80] dark:text-[#aeb4b7]">{collectionDescription}</p>
              <nav className="mt-2 flex items-center gap-1 rounded-full bg-[#f1f4f2] p-1 dark:bg-[#292929]" aria-label="اختيار البلد">
                <Link
                  href={getCollectionPath(category, 'EG')}
                  aria-current={selectedCountry === 'EG' ? 'page' : undefined}
                  className={`rounded-full px-3 py-1 text-[10px] font-black transition ${selectedCountry === 'EG' ? 'bg-[#078b43] text-white shadow-sm' : 'text-[#697075] hover:text-[#078b43] dark:text-[#c7c7c7]'}`}
                >
                  🇪🇬 مصر
                </Link>
                {SAUDI_MARKET_ENABLED && (
                  <Link
                    href={getCollectionPath(category, 'SA')}
                    aria-current={selectedCountry === 'SA' ? 'page' : undefined}
                    className={`rounded-full px-3 py-1 text-[10px] font-black transition ${selectedCountry === 'SA' ? 'bg-[#078b43] text-white shadow-sm' : 'text-[#697075] hover:text-[#078b43] dark:text-[#c7c7c7]'}`}
                  >
                    🇸🇦 السعودية
                  </Link>
                )}
              </nav>
            </div>
            {hasFilters && (
              <Link href={selectedCountry === 'SA' ? '/mobiles?country=SA' : '/mobiles'} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors">
                <X className="w-3 h-3" />
                مسح الفلاتر
              </Link>
            )}
          </div>
          
          <MobilesFiltersWrapper 
            categories={categories || []}
            initialQ={q}
            initialCategory={category}
            initialLocation={location}
            initialCondition={condition}
            initialSort={sort}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="mb-4 flex flex-wrap gap-1.5 text-[11px]">
            {q && (
              <span className="bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-lg font-bold border border-ocean-100 dark:border-ocean-900/40">
                🔍 &ldquo;{q}&rdquo;
              </span>
            )}
            {category && (
              <span className="bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-lg font-bold border border-ocean-100 dark:border-ocean-900/40">
                📂 {category}
              </span>
            )}
            {location && (
              <span className="bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-lg font-bold border border-ocean-100 dark:border-ocean-900/40">
                📍 {location}
              </span>
            )}
            {condition && (
              <span className="bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-lg font-bold border border-ocean-100 dark:border-ocean-900/40">
                ✨ {condition}
              </span>
            )}
            {brand && (
              <span className="bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-lg font-bold border border-ocean-100 dark:border-ocean-900/40">
                🏷️ {brand}
              </span>
            )}
            <span className="text-slate-400 font-medium self-center mr-1">{totalProducts} نتيجة</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="product-card-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="mt-4 rounded-[26px] border border-[#e7e9ec] bg-white py-20 text-center dark:border-[#343434] dark:bg-[#1f1f1f]">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-base font-bold text-slate-600 dark:text-slate-300 mb-1">لم نجد أي نتائج</p>
            <p className="text-xs text-slate-400">حاول استخدام كلمات بحث أخرى أو إعادة تعيين الفلاتر</p>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-7 flex items-center justify-center gap-3" aria-label="صفحات النتائج">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} rel="prev" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#dfe4e1] bg-white px-4 text-xs font-black text-[#3f4743] transition hover:border-[#80d5a3] hover:text-[#078b43] dark:border-[#383838] dark:bg-[#1f1f1f] dark:text-white">
                <ChevronRight className="h-4 w-4" />
                السابق
              </Link>
            ) : <span />}
            <span className="text-xs font-black text-[#697075] dark:text-[#c7c7c7]">صفحة {page} من {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} rel="next" className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[#078b43] px-4 text-xs font-black text-white transition hover:bg-[#06783a]">
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
