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

  const title = `${brand} ${model} - ${product.price.toLocaleString('ar-EG')} جنيه | سوق فون`;
  const description = `${product.condition} - ${product.location} - ${product.description}`;

  return {
    title, description,
    openGraph: { title, description, images: [mainImage], type: 'website', locale: 'ar_EG', siteName: 'سوق فون' },
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
    .select('phone, name, profile_image_url, is_verified, seller_rating, followers_count')
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

  const sellerPhone = seller?.phone || null;
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
  const acceptsExchange = specs.accepts_exchange || 'غير محدد';
  const accessories = specs.accessories || null;
  const images: string[] = product.product_images?.map((img: any) => img.image_url) || [];

  const specItems = [
    { icon: Smartphone, label: 'المساحة', value: storage },
    { icon: Cpu, label: 'الرام', value: ram },
    { icon: Palette, label: 'اللون', value: color },
    ...(batteryHealth ? [{ icon: BatteryCharging, label: 'صحة البطارية', value: batteryHealth }] : []),
    { icon: Wrench, label: 'هل تم فتحه؟', value: isOpened },
    { icon: Scale, label: 'مسجل / جمارك', value: ntraTax },
    { icon: ShieldCheck, label: 'الضمان', value: warranty },
    { icon: RefreshCw, label: 'يقبل البدل', value: acceptsExchange },
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
                  <span className="text-2xl font-black">{product.price.toLocaleString('ar-EG')}</span>
                  <span className="text-xs font-bold">جنيه</span>
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
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
      />
    </main>
  );
}
