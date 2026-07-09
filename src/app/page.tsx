import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, Flame, Sparkles, TrendingUp, ChevronLeft, Eye, ArrowLeft, Smartphone } from 'lucide-react';
import BannerCarousel from '@/components/BannerCarousel';
import SmartSearchInput from '@/components/SmartSearchInput';
import ProductCard from '@/components/ProductCard';
import CountdownBanner from '@/components/CountdownBanner';
import BrandSlider from '@/components/BrandSlider';
import TrustBadges from '@/components/TrustBadges';
import { cookies } from 'next/headers';

const filterByCountry = (query: any, country: string) => {
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
  const isSA = country === 'SA';
  const countrySuffix = isSA ? 'في السعودية' : 'في مصر';
  const countryLabel = isSA ? 'سوق موبايلات السعودية' : 'سوق موبايلات مصر';
  
  return {
    title: `سوق فون | بيع وشراء الهواتف المستعملة والجديدة ${countrySuffix}`,
    description: `سوق فون هو منصة عربية موثوقة لبيع وشراء الهواتف المستعملة والجديدة ${countrySuffix}. ابحث عن الهواتف، تواصل مع البائعين مباشرة، وابدأ بيع أو شراء هاتفك بسهولة.`,
    keywords: ['سوق فون', 'بيع هواتف مستعملة', 'شراء هواتف مستعملة', countryLabel, 'هواتف مستعملة', 'بيع وشراء الهواتف'],
    alternates: {
      canonical: 'https://souqphone.com/',
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `سوق فون | بيع وشراء الهواتف المستعملة والجديدة ${countrySuffix}`,
      description: `منصة سهلة وآمنة لبيع وشراء الهواتف المستعملة والجديدة ${countrySuffix} مع تواصل مباشر مع البائعين.`,
      url: 'https://souqphone.com/',
      siteName: 'سوق فون',
      locale: isSA ? 'ar_SA' : 'ar_EG',
      type: 'website',
      images: [{ url: '/logo.png', width: 512, height: 512, alt: 'سوق فون' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `سوق فون | بيع وشراء الهواتف المستعملة والجديدة ${countrySuffix}`,
      description: `منصة عربية موثوقة لبيع وشراء الهواتف المستعملة والجديدة ${countrySuffix}.`,
      images: ['/logo.png'],
    },
  };
}

export const dynamic = 'force-dynamic';

const getCategoryImageUrl = (name: string) => {
  switch (name.trim()) {
    case 'هواتف': return '/categories/phone.jpg';
    case 'إكسسوارات': case 'اكسسوارات': return '/categories/x.jpg';
    case 'أجهزة لوحية': case 'تابلت': case 'تابليت': return '/categories/t.jpg';
    case 'ساعات ذكية': case 'ساعات ذكيه': return '/categories/s.jpg';
    case 'سماعات': return '/categories/sm.jpg';
    case 'لابتوبات': return '/categories/L.jpg';
    case 'محلات الجديد': return '/categories/mt.jpg';
    case 'الكل': return '/categories/kl.jpg';
    default: return '/categories/tf.jpg';
  }
};

export default async function Home() {
  const cookieStore = await cookies();
  const country = cookieStore.get('selected_country')?.value || 'EG';

  let latestQuery = supabase
    .from('products')
    .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications');
  latestQuery = filterByCountry(latestQuery, country);
  const { data: latestProducts } = await latestQuery.order('created_at', { ascending: false }).limit(20);

  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: dbBanners } = await supabase
    .from('app_banners')
    .select('*')
    .eq('is_active', true)
    .eq('placement', 'home_top')
    .order('sort_order', { ascending: true });

  // Get most viewed products
  let trendingQuery = supabase
    .from('products')
    .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications');
  trendingQuery = filterByCountry(trendingQuery, country);
  const { data: trendingProducts } = await trendingQuery.order('views_count', { ascending: false }).limit(10);

  const quickBrands = [
    { name: 'آيفون', brand: 'آبل', emoji: '🍏' },
    { name: 'سامسونج', brand: 'سامسونج', emoji: '📱' },
    { name: 'شاومي', brand: 'شاومي', emoji: '⚡' },
    { name: 'ريلمي', brand: 'ريلمي', emoji: '🔋' },
    { name: 'أوبو', brand: 'أوبو', emoji: '📸' },
    { name: 'إنفينيكس', brand: 'إنفينيكس', emoji: '🚀' },
    { name: 'هونر', brand: 'هونر', emoji: '👑' },
    { name: 'فيفو', brand: 'فيفو', emoji: '💎' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] transition-colors">
      <section className="bg-gradient-to-r from-ocean-700 via-ocean-600 to-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-8 md:py-12">
          <div className="max-w-4xl">
            <p className="text-[11px] md:text-xs font-black uppercase tracking-[0.35em] text-ocean-100">سوق موبايلات موثوق</p>
            <h1 className="mt-3 text-2xl md:text-4xl font-black leading-tight">
              بيع وشراء الهواتف المستعملة والجديدة {country === 'SA' ? 'في السعودية' : 'في مصر'} بسهولة وأمان
            </h1>
            <p className="mt-4 text-sm md:text-base leading-8 text-ocean-50 max-w-3xl">
              سوق فون يساعدك على اكتشاف أحدث عروض الهواتف، التواصل مباشرة مع البائعين، وبيع هاتفك القديم أو الجديد في دقائق. سواء كنت تبحث عن آيفون أو سامسونج أو أي علامة أخرى، فهنا تجد ما يناسبك بأسعار مناسبة {country === 'SA' ? 'في المملكة العربية السعودية' : 'في جمهورية مصر العربية'}.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3 text-sm text-ocean-50">
              <li className="rounded-full bg-white/10 px-3 py-1">أحدث الإعلانات</li>
              <li className="rounded-full bg-white/10 px-3 py-1">تواصل مباشر مع البائعين</li>
              <li className="rounded-full bg-white/10 px-3 py-1">أسعار تنافسية</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══════ PROMO TOP BAR ══════ */}
      <div className="bg-ocean-600 dark:bg-ocean-800 text-white text-center py-2 px-4">
        <p className="text-[11px] md:text-xs font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          بيع واشتري موبايلك بضغطة زر — بدون أي عمولة!
          <Link href="/mobiles/add" className="underline underline-offset-2 mr-1 hover:text-ocean-100 transition-colors">أضف إعلانك الآن</Link>
        </p>
      </div>

      {/* ══════ SEARCH BAR (noon-style) ══════ */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-4 md:py-5 sticky top-[65px] z-30 transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <form method="GET" action="/mobiles" className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus-within:border-ocean-500 focus-within:ring-2 focus-within:ring-ocean-500/10 transition-all">
              <Search className="text-slate-400 w-5 h-5 shrink-0" />
              <SmartSearchInput 
                placeholder="ابحث عن موبايل... (مثال: آيفون 15 برو)" 
                className="w-full bg-transparent px-3 py-0.5 outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
              />
            </div>
            <button 
              type="submit" 
              className="bg-ocean-600 hover:bg-ocean-500 active:bg-ocean-700 text-white px-6 md:px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm shadow-ocean-600/20 shrink-0"
            >
              بحث
            </button>
          </form>

          {/* ══════ ELEGANT HORIZONTAL APP DOWNLOAD BANNER ══════ */}
          <div className="max-w-4xl mx-auto mt-4 animate-fadeIn">
            <Link 
              href="https://play.google.com/store/apps/details?id=com.souqphone.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-ocean-50/80 to-blue-50/20 dark:from-ocean-950/30 dark:to-transparent border border-ocean-100/80 dark:border-ocean-900/40 hover:border-ocean-300 dark:hover:border-ocean-800 rounded-xl px-5 py-3 transition-all duration-300 cursor-pointer shadow-xs gap-3 group"
            >
              <div className="flex items-center gap-3 text-right">
                <div className="w-10 h-10 rounded-xl bg-ocean-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-ocean-600/15 group-hover:scale-105 transition-transform duration-300">
                  <Smartphone className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>حمّل تطبيق سوق فون الآن مجاناً</span>
                    <span className="bg-ocean-100 dark:bg-ocean-950/50 text-ocean-700 dark:text-ocean-400 text-[9px] px-2 py-0.5 rounded-full font-bold">نسخة الأندرويد</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تصفح أسرع، تواصل مباشر مع البائعين، وإشعارات فورية بكل جديد!
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-ocean-600 hover:bg-ocean-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm shadow-ocean-600/20 cursor-pointer group-hover:shadow-md group-hover:shadow-ocean-600/25 shrink-0">
                <svg viewBox="0 0 512 512" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1L375 137.4l97.2 55.7c21.8 12.5 21.8 35 0 47.5zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
                </svg>
                <span>تثبيت التطبيق السريع</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl">

        {/* ══════ BANNERS ══════ */}
        <section className="mt-4 md:mt-6">
          <BannerCarousel banners={dbBanners || []} />
        </section>

        {/* ══════ COUNTDOWN BANNER ══════ */}
        <CountdownBanner />

        {/* ══════ QUICK BRANDS ══════ */}
        <section className="mt-5">
          <div className="flex items-center gap-2 overflow-x-auto scroll-hide pb-1">
            {quickBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/mobiles?brand=${brand.brand}`}
                className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 hover:border-ocean-300 dark:hover:border-ocean-700 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-all"
              >
                <span>{brand.emoji}</span>
                <span>{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════ CATEGORIES ══════ */}
        <section className="mt-6 md:mt-8">
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-ocean-500 rounded-full"></span>
              تصفح حسب القسم
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-4 md:gap-5">
              {dbCategories?.map((cat: any, index: number) => (
                <Link
                  key={cat.id}
                  href={`/mobiles?category=${encodeURIComponent(cat.name)}`}
                  className={`flex flex-col items-center gap-2 group cursor-pointer animate-fadeInUp stagger-${Math.min(index + 1, 8)}`}
                  style={{ opacity: 0 }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-2.5 flex items-center justify-center group-hover:scale-110 group-hover:border-ocean-200 dark:group-hover:border-ocean-800 group-hover:shadow-md transition-all duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getCategoryImageUrl(cat.name)} 
                      alt={cat.name} 
                      className="object-contain w-full h-full" 
                    />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors text-center truncate w-full">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ LATEST PRODUCTS ══════ */}
        <section className="mt-8 md:mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Flame className="text-orange-500 w-4 h-4" />
              </div>
              وصل حديثاً
            </h2>
            <Link 
              href="/mobiles" 
              className="text-ocean-600 dark:text-ocean-400 font-bold text-xs hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors flex items-center gap-1 bg-ocean-50 dark:bg-ocean-950/30 px-4 py-2 rounded-xl border border-ocean-100 dark:border-ocean-900/40"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {latestProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {(!latestProducts || latestProducts.length === 0) && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-4xl mb-3 block">📱</span>
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">لا توجد إعلانات حالياً</p>
              <p className="text-xs text-slate-400 mt-1">يرجى المحاولة مرة أخرى لاحقاً</p>
            </div>
          )}
        </section>

        {/* ══════ TRENDING / MOST VIEWED ══════ */}
        {trendingProducts && trendingProducts.length > 0 && (
          <section className="mt-8 md:mt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <TrendingUp className="text-blue-500 w-4 h-4" />
                </div>
                الأكثر مشاهدة
              </h2>
              <Link 
                href="/mobiles?sort=views" 
                className="text-ocean-600 dark:text-ocean-400 font-bold text-xs hover:text-ocean-700 transition-colors flex items-center gap-1 bg-ocean-50 dark:bg-ocean-950/30 px-4 py-2 rounded-xl border border-ocean-100 dark:border-ocean-900/40"
              >
                عرض الكل
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ══════ POPULAR BRANDS ══════ */}
        <BrandSlider />

        {/* ══════ TRUST BADGES ══════ */}
        <TrustBadges />

        {/* ══════ APP DOWNLOAD BANNER (compact) ══════ */}
        <section className="mt-8 md:mt-10 mb-8">
          <div className="bg-gradient-to-l from-ocean-700 via-ocean-600 to-ocean-500 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
            
            <div className="flex-1 text-white text-center md:text-right relative z-10">
              <h3 className="text-xl md:text-2xl font-black mb-2">حمّل تطبيق سوق فون</h3>
              <p className="text-ocean-100 text-sm font-medium">إشعارات فورية • تواصل مباشر • تجربة أسرع</p>
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=com.souqphone.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 text-ocean-700 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shrink-0 relative z-10 text-sm"
            >
              <svg viewBox="0 0 512 512" className="w-5 h-5 fill-ocean-700" xmlns="http://www.w3.org/2000/svg">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1L375 137.4l97.2 55.7c21.8 12.5 21.8 35 0 47.5zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
              </svg>
              تحميل من Google Play
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
