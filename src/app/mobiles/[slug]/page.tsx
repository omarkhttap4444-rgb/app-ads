import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ContactSellerButton from '@/components/ContactSellerButton';
import MobileContactBar from '@/components/MobileContactBar';
import { 
  MapPin, 
  Eye, 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  ChevronLeft, 
  Cpu, 
  Palette, 
  BatteryCharging, 
  Wrench, 
  Scale, 
  RefreshCw, 
  Package 
} from 'lucide-react';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import ProductGallery from '@/components/ProductGallery';

// Revalidate every 60 seconds
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

// 1. Dynamic SEO Meta Tags
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  const { data: product } = await supabase
    .from('products')
    .select('name, price, condition, location, description, specifications, product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (!product) {
    return {
      title: 'المنتج غير موجود | سوق فون',
      description: 'هذا المنتج لم يعد متاحاً أو تم حذفه.',
    };
  }

  const brand = product.specifications?.brand || '';
  const model = product.specifications?.model || '';
  
  let mainImage = '/placeholder-mobile.png';
  if (product.product_images && product.product_images.length > 0) {
    mainImage = product.product_images[0].image_url;
  }

  const title = `${brand} ${model} - ${product.price.toLocaleString('ar-EG')} جنيه | سوق فون`;
  const description = `${product.condition} - ${product.location} - ${product.description}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [mainImage],
      type: 'website',
      locale: 'ar_EG',
      siteName: 'سوق فون - Souq Phone',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
  };
}

// 2. Product Page UI
export default async function ProductPage(props: Props) {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  // Fetch product data and its images
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (!product) {
    notFound();
  }

  // Fetch seller details (phone number) from users table
  const { data: seller } = await supabase
    .from('users')
    .select('phone, name, profile_image_url')
    .eq('id', product.seller_id)
    .single();

  const sellerPhone = seller?.phone || null;

  const specifications = product.specifications || {};
  const brand = specifications.brand || 'غير محدد';
  const model = specifications.model || 'غير محدد';
  const storage = specifications.storage || 'غير محدد';
  const ram = specifications.ram || 'غير محدد';
  const color = specifications.color || 'غير محدد';
  
  const isOpened = specifications.is_opened || 'غير محدد';
  const ntraTax = specifications.ntra_tax || 'غير محدد';
  const batteryHealth = specifications.battery_health ? `${specifications.battery_health}%` : null;
  const cpu = specifications.cpu || null;
  const batteryCapacity = specifications.battery_capacity ? `${specifications.battery_capacity} mAh` : null;
  const warranty = specifications.warranty || 'غير محدد';
  const acceptsExchange = specifications.accepts_exchange || 'غير محدد';
  const accessories = specifications.accessories || null;
  
  const images: string[] = product.product_images?.map((img: any) => img.image_url) || [];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-28 md:py-12 transition-colors duration-200">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-550 font-medium mb-6">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link href="/mobiles" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">الهواتف</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-350 truncate max-w-[200px]">{brand || model ? `${brand} ${model}`.trim() : product.name}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10">
            
            {/* Right Column: Images (5 Cols) */}
            <div className="lg:col-span-5 relative">
              {/* Heart Icon Button overlay */}
              <div className="absolute top-4 left-4 z-20">
                <FavoriteButton productId={product.id} />
              </div>
              <ProductGallery images={images} productName={product.name} />
            </div>

            {/* Left Column: Product Details (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                    {brand || model ? `${brand} ${model}`.trim() : product.name}
                  </h1>
                  
                  <div className="mt-4 inline-flex items-baseline gap-1 bg-teal-50 dark:bg-teal-950/45 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-sm">
                    <span className="text-2xl font-black">{product.price.toLocaleString('ar-EG')}</span>
                    <span className="text-xs font-semibold">جنيه مصري</span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850 pb-6">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {product.location}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    حالة الجهاز: {product.condition}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {product.views_count || 0} مشاهدة
                  </span>
                </div>

                {/* Specifications Grid */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-805 dark:text-white">المواصفات الفنية</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {/* Storage */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">المساحة</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{storage}</p>
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Cpu className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">الرام (RAM)</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{ram}</p>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Palette className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">الون</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{color}</p>
                      </div>
                    </div>

                    {/* Battery Health (Apple only) */}
                    {batteryHealth && (
                      <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <BatteryCharging className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">صحة البطارية</p>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{batteryHealth}</p>
                        </div>
                      </div>
                    )}

                    {/* Device Opened / Serviced */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">هل تم فتحه؟</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{isOpened}</p>
                      </div>
                    </div>

                    {/* NTRA Customs Tax Paid */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Scale className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">مسجل شبكة / جمارك</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{ntraTax}</p>
                      </div>
                    </div>

                    {/* Warranty */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">الضمان</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{warranty}</p>
                      </div>
                    </div>

                    {/* Accepts Exchange */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">يقبل البدل</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{acceptsExchange}</p>
                      </div>
                    </div>

                    {/* CPU (optional) */}
                    {cpu && (
                      <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Cpu className="w-4.5 h-4.5 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">المعالج</p>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{cpu}</p>
                        </div>
                      </div>
                    )}

                    {/* Battery Capacity (optional) */}
                    {batteryCapacity && (
                      <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <BatteryCharging className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">سعة البطارية</p>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{batteryCapacity}</p>
                        </div>
                      </div>
                    )}

                    {/* Accessories (optional) */}
                    {accessories && (
                      <div className="col-span-2 sm:col-span-3 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850/60 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Package className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">الملحقات المرفقة</p>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-xs truncate">{accessories}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3.5">
                  <h3 className="text-base font-bold text-slate-805 dark:text-white">وصف الإعلان</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950/25 p-5 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                    {product.description || 'لا يوجد وصف مضاف لهذا الجهاز.'}
                  </p>
                </div>
              </div>

              {/* Seller Card */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3.5">معلومات البائع</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-tr from-teal-105 to-cyan-50 dark:from-teal-900 dark:to-cyan-950 rounded-xl flex items-center justify-center text-teal-700 dark:text-teal-400 font-extrabold text-lg overflow-hidden shrink-0 border border-teal-100 dark:border-teal-850 shadow-inner">
                    {product.seller_avatar ? (
                       /* eslint-disable-next-line @next/next/no-img-element */
                       <img src={product.seller_avatar} alt={product.seller_name} className="object-cover w-full h-full" />
                    ) : (
                      product.seller_name?.charAt(0) || 'م'
                    )}
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <Link href={`/store/${product.seller_id}`} className="font-extrabold text-slate-800 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 text-base transition-colors flex items-center gap-1 justify-center sm:justify-start">
                      {product.seller_name}
                      <ShieldCheck className="w-4 h-4 text-teal-500 fill-teal-50 dark:fill-teal-900/30" />
                    </Link>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      عضو موثق في سوق فون
                    </p>
                  </div>
                  
                  {/* Client-side contact handler */}
                  <ContactSellerButton 
                    sellerId={product.seller_id}
                    sellerName={product.seller_name}
                    sellerAvatar={product.seller_avatar || undefined}
                    productId={product.id}
                    productSlug={product.slug}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Bottom Contact Bar (Call, WhatsApp, Chat) for Mobile Devices */}
      <MobileContactBar 
        sellerId={product.seller_id}
        sellerName={product.seller_name}
        sellerPhone={sellerPhone}
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
      />
    </main>
  );
}
