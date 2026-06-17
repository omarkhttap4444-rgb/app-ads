import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import MobilesFiltersWrapper from '@/components/MobilesFiltersWrapper';

export const metadata: Metadata = {
  title: 'تصفح كل الهواتف | سوق فون',
  description: 'ابحث وتصفح أحدث الهواتف المعروضة للبيع بأسعار ممتازة ومن بائعين موثوقين.',
};

export const revalidate = 60; // Revalidate every minute

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
  'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

export default async function MobilesPage(props: Props) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  const condition = typeof searchParams.condition === 'string' ? searchParams.condition : '';
  const location = typeof searchParams.location === 'string' ? searchParams.location : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';

  // Fetch active categories for dropdown filter
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  let products: any[] = [];

  if (q) {
    // 1. Try RPC Smart Search first (trigram fuzzy matching via pg_trgm)
    const { data: searchData, error: searchError } = await supabase.rpc('search_products_smart', {
      p_query: q,
      p_category: category || null,
      p_condition: condition || null,
      p_limit: 50
    });

    if (!searchError && searchData && searchData.length > 0) {
      // RPC succeeded — fetch full product data for matched IDs
      const productIds = searchData.map((item: any) => item.id);

      let dbQuery = supabase
        .from('products')
        .select('id, name, price, location, condition, slug, product_images(image_url), specifications')
        .in('id', productIds);

      if (location) {
        dbQuery = dbQuery.ilike('location', `%${location}%`);
      }

      const { data: fullProducts } = await dbQuery;

      if (fullProducts) {
        // Keep results in relevance order returned by RPC
        products = searchData
          .map((item: any) => fullProducts.find((p: any) => p.id === item.id))
          .filter((p: any) => p !== undefined);

        if (sort === 'price_asc') {
          products.sort((a: any, b: any) => a.price - b.price);
        } else if (sort === 'price_desc') {
          products.sort((a: any, b: any) => b.price - a.price);
        }
      }
    } else {
      // 2. Fallback: ilike search across name, description and JSONB specs (brand/model)
      const searchFields = `name.ilike.%${q}%,description.ilike.%${q}%,specifications->>brand.ilike.%${q}%,specifications->>model.ilike.%${q}%`;
      let fallbackQuery = supabase
        .from('products')
        .select('id, name, price, location, condition, slug, product_images(image_url), specifications')
        .or(searchFields);

      if (category) {
        fallbackQuery = fallbackQuery.ilike('category', `%${category}%`);
      }
      if (condition) {
        fallbackQuery = fallbackQuery.eq('condition', condition);
      }
      if (location) {
        fallbackQuery = fallbackQuery.ilike('location', `%${location}%`);
      }

      if (sort === 'price_asc') {
        fallbackQuery = fallbackQuery.order('price', { ascending: true });
      } else if (sort === 'price_desc') {
        fallbackQuery = fallbackQuery.order('price', { ascending: false });
      } else {
        fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      }

      const { data: fallbackData } = await fallbackQuery.limit(50);
      products = fallbackData || [];
    }
  } else {
    // No search query — fetch products with active filters
    let query = supabase
      .from('products')
      .select('id, name, price, location, condition, slug, product_images(image_url), specifications');

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }
    if (condition) {
      query = query.eq('condition', condition);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    products = data || [];
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 py-8 md:py-12">
      {/* Header & Advanced Search Filters Panel */}
      <div className="container mx-auto px-4 max-w-7xl mb-10">
        
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 transition-colors">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">تصفح الهواتف والمعروضات</h1>
            <p className="text-slate-400 dark:text-slate-400 text-xs mt-1">البحث الذكي يقرب لك النتائج حتى في حالة الأخطاء الإملائية</p>
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

        {/* Results Info */}
        {(q || condition || location || sort || category) && (
          <div className="mb-6 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold items-center bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <span>تصفية نشطة:</span>
            {q && <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">كلمة: "{q}"</span>}
            {category && <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">قسم: {category}</span>}
            {location && <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">محافظة: {location}</span>}
            {condition && <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">حالة: {condition}</span>}
            {sort && <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-lg border border-teal-100 dark:border-teal-900/40">
              ترتيب: {sort === 'price_asc' ? 'السعر تصاعدياً' : 'السعر تنازلياً'}
            </span>}
            <Link href="/mobiles" className="text-rose-500 dark:text-rose-400 hover:underline mr-auto text-[10px] font-bold">إعادة تعيين الكل</Link>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => {
            const brand = product.specifications?.brand || '';
            const model = product.specifications?.model || '';
            const images = product.product_images?.map((i: any) => i.image_url) || [];
            const mainImg = images[0] || '/placeholder-mobile.png';
            const conditionBadge =
              product.condition === 'جديد'
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40'
                : product.condition === 'كسر زيرو'
                ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/40'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40';

            return (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-teal-500/8 hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-800 hover:border-teal-200/70 dark:hover:border-teal-800/50 overflow-hidden group flex flex-col relative"
              >
                {/* Favorite Button */}
                <div className="absolute top-3 right-3 z-20">
                  <FavoriteButton productId={product.id} />
                </div>

                <Link href={`/mobiles/${product.slug}`} className="flex flex-col flex-1">
                  {/* Image Area */}
                  <div className="relative h-[220px] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800/70 dark:via-slate-800/40 dark:to-slate-900/80 flex items-center justify-center overflow-hidden px-4 pt-5 pb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={mainImg} 
                      alt={product.name} 
                      className="object-contain h-full w-auto max-w-full group-hover:scale-110 transition-transform duration-500 drop-shadow-lg"
                    />
                    {/* Condition badge */}
                    <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${conditionBadge}`}>
                      {product.condition}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 mb-3 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors min-h-[2.5rem]">
                      {brand || model ? `${brand} ${model}`.trim() : product.name}
                    </h3>

                    <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/80">
                      <div className="text-teal-600 dark:text-teal-400 font-black text-lg flex items-baseline gap-1">
                        {product.price.toLocaleString('ar-EG')}
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">جنيه</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{product.location}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mt-6">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-1">لم نجد أي نتائج</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">حاول استخدام كلمات بحث أخرى، أو إعادة تعيين الفلاتر الفعالة</p>
          </div>
        )}
      </div>
    </main>
  );
}
