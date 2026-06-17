import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, Flame, MapPin, Sparkles, Smartphone, Download, ShieldCheck, Star, Bell, Zap, MessageSquare, Heart } from 'lucide-react';
import BannerCarousel from '@/components/BannerCarousel';
import FavoriteButton from '@/components/FavoriteButton';
import SmartSearchInput from '@/components/SmartSearchInput';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = {
  title: 'سوق فون | المنصة الأولى لبيع وشراء الهواتف في مصر',
  description: 'سوق فون هو وجهتك الأولى لبيع وشراء الهواتف الذكية في مصر. تواصل مع البائع مباشرة، بدون عمولات، وتصفح آلاف الإعلانات يومياً.',
};

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

const getCategoryIcon = (name: string) => {
  switch (name) {
    case 'هواتف':
      return '📱';
    case 'إكسسوارات':
      return '🎧';
    case 'أجهزة لوحية':
      return '💻';
    case 'ساعات ذكية':
      return '⌚';
    case 'سماعات':
      return '🎵';
    case 'شواحن وكابلات':
      return '🔌';
    case 'حافظات وجرابات':
      return '🛡️';
    case 'إلكترونيات':
      return '📺';
    default:
      return '➕';
  }
};

const getCategoryImageUrl = (name: string) => {
  switch (name.trim()) {
    case 'هواتف':
      return '/categories/phone.jpg';
    case 'إكسسوارات':
    case 'اكسسوارات':
      return '/categories/x.jpg';
    case 'أجهزة لوحية':
    case 'تابلت':
    case 'تابليت':
      return '/categories/t.jpg';
    case 'ساعات ذكية':
    case 'ساعات ذكيه':
      return '/categories/s.jpg';
    case 'سماعات':
      return '/categories/sm.jpg';
    case 'لابتوبات':
      return '/categories/L.jpg';
    case 'محلات الجديد':
      return '/categories/mt.jpg';
    case 'الكل':
      return '/categories/kl.jpg';
    case 'أخرى':
    default:
      return '/categories/tf.jpg';
  }
};

export default async function Home() {
  // 1. Fetch latest 12 products
  const { data: latestProducts } = await supabase
    .from('products')
    .select('id, name, price, location, condition, slug, product_images(image_url), specifications')
    .order('created_at', { ascending: false })
    .limit(30);

  // 2. Fetch categories from public.categories
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // 3. Fetch active banners from public.app_banners
  const { data: dbBanners } = await supabase
    .from('app_banners')
    .select('*')
    .eq('is_active', true)
    .eq('placement', 'home_top')
    .order('sort_order', { ascending: true });
  const quickBrands = [
    { name: 'آيفون', query: 'iphone', icon: '🍏' },
    { name: 'سامسونج', query: 'samsung', icon: '📱' },
    { name: 'شاومي', query: 'xiaomi', icon: '⚡' },
    { name: 'ريلمي', query: 'realme', icon: '🔋' },
    { name: 'أوبو', query: 'oppo', icon: '📸' },
    { name: 'إنفينيكس', query: 'infinix', icon: '🚀' },
    { name: 'هونر', query: 'honor', icon: '👑' },
    { name: 'فيفو', query: 'vivo', icon: '💎' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-850 via-teal-955 to-slate-900 text-white py-12 md:py-20 text-center relative overflow-hidden">
        {/* Background Decorative Blur Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 px-4 py-1.5 rounded-full text-xs font-bold mb-4 md:mb-6 backdrop-blur-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            بيع واشتري موبايلك بضغطة زر وبدون عمولة!
          </span>
          
          <h1 className="text-3xl md:text-6xl font-black mb-4 md:mb-6 leading-tight drop-shadow-md">
            سوق فون - سوق الموبايلات الأول في مصر
          </h1>
          <p className="text-sm md:text-2xl text-slate-350 dark:text-slate-300 mb-8 md:mb-12 drop-shadow-sm font-light max-w-2xl mx-auto max-md:hidden">
            تصفح آلاف الهواتف المستعملة والجديدة، وتواصل مع البائعين بشكل مباشر وآمن.
          </p>
          
          {/* Functional Search Bar */}
          <form 
            method="GET" 
            action="/mobiles" 
            className="bg-white dark:bg-slate-900 p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row max-w-3xl mx-auto border border-white/10 dark:border-slate-800"
          >
            <div className="flex-1 flex items-center px-4">
              <Search className="text-slate-400 w-5 h-5 shrink-0" />
              <SmartSearchInput 
                placeholder="ابحث عن موبايل (مثال: آيفون 13 برو ماكس)..." 
                className="w-full bg-transparent px-4 py-3.5 text-slate-850 dark:text-white outline-none text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-650"
              />
            </div>
            <button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 transition-all text-white px-10 py-3.5 rounded-xl md:rounded-full font-bold text-base shadow-lg shadow-teal-600/30 cursor-pointer"
            >
              ابحث الآن
            </button>
          </form>

          {/* Download App Button in Hero */}
          <div className="mt-8 flex justify-center max-md:hidden">
            <a 
              href="https://play.google.com/store/apps/details?id=com.souqphone.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/90 hover:bg-slate-900 border border-white/10 hover:border-teal-700/50 text-white px-8 py-4 rounded-2xl flex items-center gap-5 transition-all shadow-2xl shadow-black/40 group cursor-pointer backdrop-blur-sm"
            >
              <svg viewBox="0 0 512 512" className="w-9 h-9 fill-white shrink-0 group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1L375 137.4l97.2 55.7c21.8 12.5 21.8 35 0 47.5zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
              </svg>
              <div className="text-right leading-tight">
                <p className="text-[11px] text-slate-400 font-semibold">حمّل التطبيق الرسمي مجاناً من</p>
                <p className="text-xl font-black text-white tracking-tight">Google Play</p>
                <p className="text-[10px] text-teal-400 font-bold mt-0.5">+١٠٠,٠٠٠ مستخدم نشط</p>
              </div>
            </a>
          </div>

          {/* Quick Search Tags (Visible on Desktop) */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-2 text-xs md:text-sm text-slate-300 max-md:hidden">
            <span className="font-semibold text-slate-400">بحث سريع:</span>
            {quickBrands.map((cat) => (
              <Link
                key={cat.name}
                href={`/mobiles?q=${cat.query}`}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-teal-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Scrollable Chips (Mirroring App Circular Chips on mobile) */}
      <section className="mt-8 container mx-auto px-4 max-w-7xl">
        <h2 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-teal-500 rounded-full"></span>
          أشهر الماركات
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {quickBrands.map((brand) => (
            <Link
              key={brand.name}
              href={`/mobiles?q=${brand.query}`}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-2xl group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                {brand.icon}
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Banners & Google Play sidebar Section */}
      <section className="mt-6 md:mt-8 container mx-auto px-0 md:px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Banner Carousel (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2">
            <BannerCarousel banners={dbBanners || []} />
          </div>
          
          {/* Premium App Download Widget */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-900/40 p-6 rounded-3xl shadow-xl flex flex-col mx-4 md:mx-0 min-h-[280px]">
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col flex-1">
              {/* App header */}
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sp.jpeg" alt="سوق فون" className="w-14 h-14 rounded-2xl border border-teal-700/40 shadow-lg shadow-teal-900/50 object-contain bg-white/5 shrink-0" />
                <div>
                  <p className="font-black text-white text-base leading-tight">سوق فون</p>
                  <p className="text-teal-400 text-xs font-semibold">التطبيق الرسمي</p>
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[9px] text-slate-500 mr-1">+١٠٠٠ تقييم</span>
                  </div>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-2 mb-4">
                {([
                  { icon: Bell, text: 'إشعارات فورية بالرسائل والعروض' },
                  { icon: MessageSquare, text: 'تواصل مباشر وآمن مع البائعين' },
                  { icon: Heart, text: 'احفظ مفضلاتك وتابع الأسعار' },
                  { icon: Zap, text: 'بيع جهازك في أسرع وقت ممكن' },
                ] as const).map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-teal-900/60 border border-teal-800/50 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium leading-tight">{text}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 text-center">
                  <p className="text-teal-300 font-black text-base">+١٠٠ك</p>
                  <p className="text-slate-500 text-[10px] font-medium">تحميل</p>
                </div>
                <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 text-center">
                  <p className="text-amber-300 font-black text-base">٤.٩ ★</p>
                  <p className="text-slate-500 text-[10px] font-medium">تقييم</p>
                </div>
              </div>

              {/* Download Button */}
              <a 
                href="https://play.google.com/store/apps/details?id=com.souqphone.app"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg shadow-teal-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تحميل مجاناً من Google Play
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section (Redesigned with circular app icons Noon/Amazon style) */}
      <section className="mt-8 container mx-auto px-4 max-w-7xl">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h2 className="text-base font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-teal-500 rounded-full"></span>
            تصفح حسب القسم
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-6 justify-center">
            {dbCategories?.map((cat: any) => {
              const imgUrl = getCategoryImageUrl(cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/mobiles?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center justify-center text-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-800/80 p-3 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imgUrl} 
                      alt={cat.name} 
                      className="object-contain w-full h-full" 
                    />
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-350 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate w-full">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-850 dark:text-white flex items-center gap-2">
                <Flame className="text-orange-500 w-8 h-8 fill-orange-500 animate-pulse" />
                أحدث الإعلانات المضافة
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-base">تصفح أحدث الهواتف المعروضة للبيع مؤخراً من قبل المستخدمين</p>
            </div>
            <Link 
              href="/mobiles" 
              className="text-teal-650 dark:text-teal-450 font-bold hover:text-teal-750 transition-colors flex items-center gap-1 bg-teal-50 dark:bg-teal-950/40 px-5 py-2.5 rounded-2xl text-sm border border-teal-100 dark:border-teal-900/40"
            >
              عرض كل الإعلانات &larr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {latestProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {(!latestProducts || latestProducts.length === 0) && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-5xl mb-4 block">📱</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">لا توجد إعلانات حالياً</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">يرجى المحاولة مرة أخرى لاحقاً</p>
            </div>
          )}

          <div className="mt-12 flex justify-center md:hidden">
            <Link 
              href="/mobiles" 
              className="text-teal-700 dark:text-teal-450 font-bold hover:bg-teal-100 transition-all items-center justify-center gap-2 bg-teal-50 dark:bg-teal-950/40 px-8 py-3.5 rounded-2xl w-full text-center border border-teal-100 dark:border-teal-900/40"
            >
              عرض كل الهواتف المعروضة
            </Link>
          </div>
        </div>
      </section>

      {/* App Promotion Section */}
      <section className="py-16 bg-gradient-to-br from-teal-50 dark:from-teal-950/20 to-cyan-50 dark:to-cyan-950/20 border-t border-b border-teal-100/50 dark:border-teal-900/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 transition-colors">
            
            {/* App Screen Mockup Image */}
            <div className="w-24 md:w-28 shrink-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 shadow-lg relative bg-white dark:bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sp.jpeg" alt="سوق فون التطبيق" className="w-full h-full object-contain" />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-right">
              <span className="bg-teal-100 dark:bg-teal-950 text-teal-750 dark:text-teal-400 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-900/40">التطبيق الرسمي</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white pt-2">احصل على تجربة سوق فون الكاملة على هاتفك!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                تصفح أسرع، استلم إشعارات فورية بالرسائل والإعجابات والمتابعات فور حدوثها، وتواصل بسهولة أكبر من خلال تطبيق الهاتف المخصص.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 shrink-0">
              <a 
                href="https://play.google.com/store/apps/details?id=com.souqphone.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-black dark:bg-slate-950 dark:hover:bg-slate-990 border border-slate-700/50 dark:border-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3.5 transition-all shadow-lg shadow-slate-900/10 cursor-pointer"
              >
                <Download className="w-5 h-5 text-teal-400 animate-bounce" />
                <div className="text-right leading-tight">
                  <p className="text-[9px] text-slate-400 font-semibold font-sans">AVAILABLE ON</p>
                  <p className="text-sm font-black text-white font-sans">Google Play</p>
                </div>
              </a>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>آمن 100% ورسمي</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="border-t border-slate-105 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 py-12 text-center mt-20 text-sm font-medium transition-colors">
        <p className="text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} سوق فون. جميع الحقوق محفوظة.</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">شراء وبيع الهواتف بأمان وبدون عمولات في مصر</p>
      </footer>
    </main>
  );
}
