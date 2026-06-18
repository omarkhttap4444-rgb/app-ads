import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import MobilesFiltersWrapper from '@/components/MobilesFiltersWrapper';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = {
  title: 'تصفح كل الهواتف | سوق فون',
  description: 'ابحث وتصفح أحدث الهواتف المعروضة للبيع بأسعار ممتازة ومن بائعين موثوقين.',
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MobilesPage(props: Props) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  const condition = typeof searchParams.condition === 'string' ? searchParams.condition : '';
  const location = typeof searchParams.location === 'string' ? searchParams.location : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  let products: any[] = [];

  if (q) {
    const { data: searchData, error: searchError } = await supabase.rpc('search_products_smart', {
      p_query: q,
      p_category: category || null,
      p_condition: condition || null,
      p_limit: 50
    });

    if (!searchError && searchData && searchData.length > 0) {
      const productIds = searchData.map((item: any) => item.id);
      let dbQuery = supabase
        .from('products')
        .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications')
        .in('id', productIds);
      if (location) dbQuery = dbQuery.ilike('location', `%${location}%`);
      const { data: fullProducts } = await dbQuery;
      if (fullProducts) {
        products = searchData
          .map((item: any) => fullProducts.find((p: any) => p.id === item.id))
          .filter((p: any) => p !== undefined);
        if (sort === 'price_asc') products.sort((a: any, b: any) => a.price - b.price);
        else if (sort === 'price_desc') products.sort((a: any, b: any) => b.price - a.price);
      }
    } else {
      const searchFields = `name.ilike.%${q}%,description.ilike.%${q}%,specifications->>brand.ilike.%${q}%,specifications->>model.ilike.%${q}%`;
      let fallbackQuery = supabase
        .from('products')
        .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications')
        .or(searchFields);
      if (category) fallbackQuery = fallbackQuery.ilike('category', `%${category}%`);
      if (condition) fallbackQuery = fallbackQuery.eq('condition', condition);
      if (location) fallbackQuery = fallbackQuery.ilike('location', `%${location}%`);
      if (sort === 'price_asc') fallbackQuery = fallbackQuery.order('price', { ascending: true });
      else if (sort === 'price_desc') fallbackQuery = fallbackQuery.order('price', { ascending: false });
      else fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const { data: fallbackData } = await fallbackQuery.limit(50);
      products = fallbackData || [];
    }
  } else {
    let query = supabase
      .from('products')
      .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications');
    if (category) query = query.ilike('category', `%${category}%`);
    if (condition) query = query.eq('condition', condition);
    if (location) query = query.ilike('location', `%${location}%`);
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data } = await query;
    products = data || [];
  }

  const hasFilters = q || condition || location || sort || category;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] transition-colors">
      <div className="container mx-auto px-4 max-w-7xl py-6 md:py-8">
        
        {/* Search & Filters Card */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs mb-5 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">تصفح الهواتف</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">البحث الذكي يقرب لك النتائج حتى في حالة الأخطاء الإملائية</p>
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
            <span className="text-slate-400 font-medium self-center mr-1">{products.length} نتيجة</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-base font-bold text-slate-600 dark:text-slate-300 mb-1">لم نجد أي نتائج</p>
            <p className="text-xs text-slate-400">حاول استخدام كلمات بحث أخرى أو إعادة تعيين الفلاتر</p>
          </div>
        )}
      </div>
    </main>
  );
}
