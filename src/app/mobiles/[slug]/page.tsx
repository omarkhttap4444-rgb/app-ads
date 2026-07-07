import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ContactSellerButton from '@/components/ContactSellerButton';
import MobileContactBar from '@/components/MobileContactBar';
import { 
  MapPin, Eye, Sparkles, Smartphone, ShieldCheck, ChevronLeft, 
  Cpu, Palette, BatteryCharging, Wrench, Scale, RefreshCw, Package, Share2 
} from 'lucide-react';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  const { data: product } = await supabase
    .from('products')
    .select('name, price, condition, location, description, specifications, product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (!product) return { title: 'المنتج غير موجود | سوق فون' };

  const brand = product.specifications?.brand || '';
  const model = product.specifications?.model || '';
  let mainImage = '/placeholder-mobile.png';
  if (product.product_images && product.product_images.length > 0) mainImage = product.product_images[0].image_url;

  const isSaudi = (() => {
    if (!product.location) return false;
    const firstPart = product.location.split(' - ')[0].trim();
    const saudiRegions = ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'];
    const loc = product.location.toLowerCase();
    return saudiRegions.includes(firstPart) || loc.includes('riyadh') || loc.includes('dammam') || loc.includes('saudi') || loc.includes('khobar') || loc.includes('jeddah');
  })();
  const currency = isSaudi ? 'ريال' : 'جنيه';
  const locale = isSaudi ? 'ar-SA' : 'ar-EG';

  const title = `${brand} ${model} - ${product.price.toLocaleString(locale)} ${currency} | سوق فون`;
  const description = `${product.condition} - ${product.location} - ${product.description}`;

  return {
    title, description,
    openGraph: { title, description, images: [mainImage], type: 'website', locale: isSaudi ? 'ar_SA' : 'ar_EG', siteName: 'سوق فون' },
    twitter: { card: 'summary_large_image', title, description, images: [mainImage] },
  };
}

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (!product) notFound();

  const { data: seller } = await supabase
    .from('users')
    .select('phone, contact_phone, is_contact_phone_visible, contact_whatsapp, is_contact_whatsapp_visible, name, profile_image_url, is_verified, seller_rating, followers_count')
    .eq('id', product.seller_id)
    .single();

  // Similar products
  const { data: similarProducts } = await supabase
    .from('products')
    .select('id, name, price, location, condition, slug, views_count, product_images(image_url), specifications')
    .neq('id', product.id)
    .eq('category', product.category)
    .order('created_at', { ascending: false })
    .limit(5);

  const sellerPhone = seller?.is_contact_phone_visible ? (seller.contact_phone || seller.phone || null) : (seller?.phone || null);
  const sellerWhatsapp = seller?.is_contact_whatsapp_visible ? (seller.contact_whatsapp || null) : null;

  const cleanPhoneForWhatsapp = sellerWhatsapp || sellerPhone || '';
  const formatWhatsappForPage = (phone: string | null) => {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    while (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.startsWith('20') && clean.length > 10) return clean;
    if (clean.startsWith('966') && clean.length > 8) return clean;
    if (clean.startsWith('1') && clean.length === 10) return `20${clean}`;
    if (clean.startsWith('5') && clean.length === 9) return `966${clean}`;
    
    const saudiRegions = ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'];
    const isSaudi = saudiRegions.some(r => product.location.includes(r)) || 
                    product.location.toLowerCase().includes('riyadh') || 
                    product.location.toLowerCase().includes('saudi') ||
                    product.location.toLowerCase().includes('jeddah') ||
                    product.location.toLowerCase().includes('dammam');
    return isSaudi ? `966${clean}` : `20${clean}`;
  };
  const whatsappPhone = cleanPhoneForWhatsapp ? formatWhatsappForPage(cleanPhoneForWhatsapp) : '';
  const specs = product.specifications || {};
  const brand = specs.brand || 'غير محدد';
  const model = specs.model || 'غير محدد';
  const storage = specs.storage || 'غير محدد';
  const ram = specs.ram || 'غير محدد';
  const color = specs.color || 'غير محدد';
  const isOpened = specs.is_opened || 'غير محدد';
  const ntraTax = specs.ntra_tax || 'غير محدد';
  const batteryHealth = specs.battery_health ? `${specs.battery_health}%` : null;
  const warranty = specs.warranty || 'غير محدد';
  const acceptsExchange = specs.accepts_exchange === true || specs.accepts_exchange === 'true' || specs.accepts_exchange === 'نعم' || specs.accepts_exchange === '1';
  const accessories = specs.accessories || null;
  const images: string[] = product.product_images?.map((img: any) => img.image_url) || [];

  const isSaudi = (() => {
    if (!product.location) return false;
    const firstPart = product.location.split(' - ')[0].trim();
    const saudiRegions = ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'];
    const loc = product.location.toLowerCase();
    return saudiRegions.includes(firstPart) || loc.includes('riyadh') || loc.includes('dammam') || loc.includes('saudi') || loc.includes('khobar') || loc.includes('jeddah');
  })();

  const currency = isSaudi ? 'ريال' : 'جنيه';
  const locale = isSaudi ? 'ar-SA' : 'ar-EG';

  const specItems = [
    { icon: Smartphone, label: 'المساحة', value: storage },
    { icon: Cpu, label: 'الرام', value: ram },
    { icon: Palette, label: 'اللون', value: color },
    ...(batteryHealth ? [{ icon: BatteryCharging, label: 'صحة البطارية', value: batteryHealth }] : []),
    { icon: Wrench, label: 'هل تم فتحه؟', value: isOpened },
    ...(!isSaudi ? [{ icon: Scale, label: 'مسجل / جمارك', value: ntraTax }] : []),
    { icon: ShieldCheck, label: 'الضمان', value: warranty },
    ...(acceptsExchange ? [{ icon: RefreshCw, label: 'يقبل البدل', value: 'نعم' }] : []),
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] pt-4 pb-28 md:py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-4">
          <Link href="/" className="hover:text-ocean-600 transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link href="/mobiles" className="hover:text-ocean-600 transition-colors">الهواتف</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{brand !== 'غير محدد' || model !== 'غير محدد' ? `${brand} ${model}`.trim() : product.name}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 p-5 md:p-8">
            
            {/* Images */}
            <div className="lg:col-span-5 relative">
              <div className="absolute top-2 left-2 z-20 flex gap-2">
                <FavoriteButton productId={product.id} />
              </div>
              <ProductGallery images={images} productName={product.name} />
            </div>

            {/* Details */}
            <div className="lg:col-span-7 flex flex-col space-y-5 mt-5 lg:mt-0">
              
              {/* Title & Price */}
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                  {brand !== 'غير محدد' || model !== 'غير محدد' ? `${brand} ${model}`.trim() : product.name}
                </h1>
                
                <div className="mt-3 inline-flex items-baseline gap-1.5 bg-ocean-50 dark:bg-ocean-950/40 text-ocean-700 dark:text-ocean-400 px-4 py-2.5 rounded-xl border border-ocean-100 dark:border-ocean-900/40">
                  <span className="text-2xl font-black">{product.price.toLocaleString(locale)}</span>
                  <span className="text-xs font-bold">{currency}</span>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold border-b border-slate-100 dark:border-slate-800 pb-5">
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {product.location}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  {product.condition}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {product.views_count || 0} مشاهدة
                </span>
              </div>

              {/* Specifications Table */}
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-ocean-500 rounded-full"></span>
                  المواصفات الفنية
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {specItems.map((spec) => (
                    <div key={spec.label} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl flex items-center gap-2.5 border border-slate-100/50 dark:border-slate-700/30">
                      <div className="w-8 h-8 rounded-lg bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                        <spec.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">{spec.label}</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-[11px] truncate">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                  {accessories && (
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl flex items-center gap-2.5 border border-slate-100/50 dark:border-slate-700/30">
                      <div className="w-8 h-8 rounded-lg bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-slate-400 font-bold">الملحقات</p>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 text-[11px]">{accessories}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-ocean-500 rounded-full"></span>
                  وصف الإعلان
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100/50 dark:border-slate-700/30">
                  {product.description || 'لا يوجد وصف.'}
                </p>
              </div>

              {/* Seller Card */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-[11px] font-bold text-slate-400 mb-3">معلومات البائع</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/30 p-4 rounded-xl">
                  <div className="w-11 h-11 bg-ocean-100 dark:bg-ocean-950 rounded-xl flex items-center justify-center text-ocean-700 dark:text-ocean-400 font-extrabold text-base overflow-hidden shrink-0">
                    {seller?.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={seller.profile_image_url} alt={seller.name || 'البائع'} className="object-cover w-full h-full" />
                    ) : (
                      seller?.name?.charAt(0) || 'م'
                    )}
                  </div>
                  <div className="text-center sm:text-right flex-1">
                    <Link href={`/store/${product.seller_id}`} className="font-extrabold text-slate-800 dark:text-white hover:text-ocean-600 text-sm transition-colors flex items-center gap-1 justify-center sm:justify-start">
                      {seller?.name || 'بائع سوق فون'}
                      {seller?.is_verified && <ShieldCheck className="w-4 h-4 text-ocean-500" />}
                    </Link>
                    <p className="text-[10px] text-slate-400 mt-0.5">عضو في سوق فون</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {whatsappPhone && (
                      <a
                        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`مرحباً ${seller?.name || 'بائع سوق فون'}، أنا مهتم بشراء جهازك المعروض في سوق فون: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-3 rounded-xl font-bold shadow-md shadow-emerald-250/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-500/10"
                        title="تواصل عبر الواتساب"
                      >
                        <svg viewBox="0 0 448 512" className="w-4.5 h-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                      </a>
                    )}
                    <ContactSellerButton 
                      sellerId={product.seller_id}
                      sellerName={seller?.name || 'بائع سوق فون'}
                      sellerAvatar={seller?.profile_image_url || undefined}
                      productId={product.id}
                      productSlug={product.slug}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-ocean-500 rounded-full"></span>
              منتجات مشابهة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      
      <MobileContactBar 
        sellerId={product.seller_id}
        sellerName={product.seller_name}
        sellerPhone={sellerPhone}
        sellerWhatsapp={sellerWhatsapp}
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        location={product.location}
      />
    </main>
  );
}
