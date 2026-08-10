import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { X } from 'lucide-react';
import MobilesFiltersWrapper from '@/components/MobilesFiltersWrapper';
import ProductCard, { type ProductCardProps } from '@/components/ProductCard';

import { cookies } from 'next/headers';

const productSelection = 'id, name, price, location, condition, slug, created_at, views_count, likes_count, comments_count, is_negotiable, is_sold, product_images(image_url), specifications';

type Product = ProductCardProps['product'];
type SmartSearchRow = { id: string };
type CountryFilterable<T> = { or: (filters: string) => T };

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

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const country = cookieStore.get('selected_country')?.value || 'EG';
  const countrySuffix = country === 'SA' ? 'في السعودية' : 'في مصر';
  
  return {
    title: `تصفح كل الهواتف | سوق فون ${countrySuffix}`,
    description: `ابحث وتصفح أحدث الهواتف المعروضة للبيع بأسعار ممتازة ومن بائعين موثوقين ${countrySuffix}.`,
  };
}

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MobilesPage(props: Props) {
  const cookieStore = await cookies();
  const selectedCountry = cookieStore.get('selected_country')?.value || 'EG';

  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  const condition = typeof searchParams.condition === 'string' ? searchParams.condition : '';
  const location = typeof searchParams.location === 'string' ? searchParams.location : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const brand = typeof searchParams.brand === 'string' ? searchParams.brand : '';

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  let products: Product[] = [];

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
  } else {
    let query = supabase
      .from('products')
      .select(productSelection);
    query = filterByCountry(query, selectedCountry);
    if (category) query = query.ilike('category', `%${category}%`);
    if (condition) query = query.eq('condition', condition);
    if (location) query = query.ilike('location', `%${location}%`);
    if (brand) query = query.eq('specifications->>brand', brand);
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data } = await query;
    products = (data || []) as Product[];
  }

  const hasFilters = q || condition || location || sort || category || brand;

  return (
    <main className="min-h-screen bg-[#f7f8f8] transition-colors dark:bg-[#0d0d0d]">
      <div className="container mx-auto px-4 max-w-7xl py-6 md:py-8">
        
        {/* Search & Filters Card */}
        <div className="mb-5 rounded-[26px] border border-[#e7e9ec] bg-white p-5 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.4)] transition-colors dark:border-[#343434] dark:bg-[#1f1f1f] md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black text-[#242628] dark:text-white md:text-xl">تصفح المنتجات</h1>
              <p className="mt-0.5 text-[11px] font-bold text-[#92989c]">البحث الذكي يقرب لك النتائج حتى في حالة الأخطاء الإملائية</p>
            </div>
            {hasFilters && (
              <Link href="/mobiles" className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors">
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
            <span className="text-slate-400 font-medium self-center mr-1">{products.length} نتيجة</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
      </div>
    </main>
  );
}
