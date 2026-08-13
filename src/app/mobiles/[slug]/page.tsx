import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BatteryCharging,
  ChevronLeft,
  CircleCheck,
  Cpu,
  MapPin,
  MessageSquare,
  Package,
  Palette,
  Phone,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';

import ContactSellerButton from '@/components/ContactSellerButton';
import FavoriteButton from '@/components/FavoriteButton';
import JsonLd from '@/components/JsonLd';
import MobileContactBar from '@/components/MobileContactBar';
import ProductCard from '@/components/ProductCard';
import ProductComments from '@/components/ProductComments';
import ProductGallery from '@/components/ProductGallery';
import ProductLikeButton from '@/components/ProductLikeButton';
import ProductViewCounter from '@/components/ProductViewCounter';
import ShareProductButton from '@/components/ShareProductButton';
import { isRemoteMediaUrl } from '@/lib/media';
import { absoluteUrl, productConditionUrl } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const saudiPattern = /الرياض|جدة|مكة|الدمام|الخبر|السعودية|riyadh|jeddah|dammam|khobar|saudi/i;
const isSaudiLocation = (location?: string | null) => saudiPattern.test(location ?? '');

const getImages = (rows: Array<{ image_url?: string | null }> | null | undefined) =>
  (rows ?? []).map((image) => image.image_url).filter(isRemoteMediaUrl);

const textValue = (value: unknown, fallback = 'غير محدد') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const truthy = (value: unknown) =>
  value === true || ['true', '1', 'yes', 'نعم'].includes(String(value ?? '').toLowerCase());

const formatWhatsAppNumber = (phone: string | null, isSaudi: boolean) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (clean.startsWith('20') || clean.startsWith('966')) return clean;
  if (clean.startsWith('1') && clean.length === 10) return `20${clean}`;
  if (clean.startsWith('5') && clean.length === 9) return `966${clean}`;
  return `${isSaudi ? '966' : '20'}${clean}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: product } = await supabase
    .from('products')
    .select('name,price,condition,location,description,specifications,product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (!product) return { title: 'المنتج غير موجود', robots: { index: false, follow: false } };

  const specs = (product.specifications ?? {}) as Record<string, unknown>;
  const displayName = [specs.brand, specs.model].filter(Boolean).join(' ').trim() || product.name;
  const locale = isSaudiLocation(product.location) ? 'ar-SA' : 'ar-EG';
  const currency = isSaudiLocation(product.location) ? 'ريال' : 'جنيه';
  const title = Number(product.price ?? 0) > 0
    ? `${displayName} للبيع - ${Number(product.price).toLocaleString(locale)} ${currency}`
    : `${displayName} للبيع - تواصل لمعرفة السعر`;
  const description = [
    `${displayName} ${product.condition || ''} للبيع`,
    product.location,
    product.description,
  ].filter(Boolean).join(' - ').slice(0, 165);
  const images = getImages(product.product_images);
  const canonicalPath = `/mobiles/${encodeURIComponent(decodedSlug)}`;

  return {
    title,
    description,
    keywords: [displayName, `${displayName} للبيع`, product.condition, product.location, 'سوق فون'].filter(Boolean) as string[],
    alternates: { canonical: canonicalPath },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      title,
      description,
      images: images.length ? [images[0]] : ['/og.png'],
      url: canonicalPath,
      type: 'website',
      locale: isSaudiLocation(product.location) ? 'ar_SA' : 'ar_EG',
      siteName: 'سوق فون',
    },
    twitter: { card: 'summary_large_image', title, description, images: images.length ? [images[0]] : ['/og.png'] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*,product_images(image_url)')
    .eq('slug', decodedSlug)
    .single();

  if (productError || !product) notFound();

  const [{ data: seller }, { data: similarProducts }] = await Promise.all([
    supabase
      .from('users')
      .select('phone,contact_phone,is_contact_phone_visible,contact_whatsapp,is_contact_whatsapp_visible,name,profile_image_url,is_verified,seller_rating,followers_count,created_at,bio')
      .eq('id', product.seller_id)
      .single(),
    supabase
      .from('products')
      .select('id,name,price,location,condition,slug,created_at,views_count,likes_count,comments_count,is_negotiable,is_sold,product_images(image_url),specifications')
      .neq('id', product.id)
      .eq('category', product.category)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const specs = (product.specifications ?? {}) as Record<string, unknown>;
  const brand = textValue(specs.brand, '');
  const model = textValue(specs.model, '');
  const displayName = [brand, model].filter(Boolean).join(' ').trim() || product.name;
  const images = getImages(product.product_images);
  const isSaudi = isSaudiLocation(product.location);
  const currency = isSaudi ? 'ر.س' : 'ج.م';
  const locale = isSaudi ? 'ar-SA' : 'ar-EG';
  const sellerName = seller?.name || product.seller_name || 'بائع سوق فون';
  const sellerPhone = seller?.is_contact_phone_visible
    ? seller.contact_phone || seller.phone || null
    : null;
  const sellerWhatsapp = seller?.is_contact_whatsapp_visible
    ? seller.contact_whatsapp || null
    : null;
  const acceptsExchange = truthy(specs.accepts_exchange);
  const batteryHealth = specs.battery_health ? `${textValue(specs.battery_health)}%` : null;
  const accessories = textValue(specs.accessories, '');
  const whatsappNumber = formatWhatsAppNumber(sellerWhatsapp || sellerPhone, isSaudi);
  const productPath = `/mobiles/${encodeURIComponent(product.slug)}`;
  const productUrl = absoluteUrl(productPath);

  const additionalProperty = [
    ['المساحة', specs.storage],
    ['الرام', specs.ram],
    ['اللون', specs.color],
    ['صحة البطارية', batteryHealth],
    ['الضمان', specs.warranty],
  ]
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value: String(value) }));

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: displayName,
    description: product.description || `${displayName} ${product.condition || ''} للبيع في ${product.location}.`,
    image: images,
    url: productUrl,
    sku: product.id,
    category: product.category,
    itemCondition: productConditionUrl(product.condition),
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    color: textValue(specs.color, '') || undefined,
    additionalProperty,
    ...(Number(product.price) > 0
      ? {
          offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: isSaudi ? 'SAR' : 'EGP',
            price: Number(product.price),
            availability: product.is_sold
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
            itemCondition: productConditionUrl(product.condition),
            seller: { '@type': 'Person', name: sellerName },
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'المنتجات', item: absoluteUrl('/mobiles') },
      { '@type': 'ListItem', position: 3, name: displayName, item: productUrl },
    ],
  };

  const specItems = [
    { icon: Sparkles, label: 'القسم', value: product.category || 'غير محدد' },
    { icon: Package, label: 'الحالة', value: product.condition || 'غير محدد' },
    { icon: Cpu, label: 'الرام', value: textValue(specs.ram) },
    { icon: Package, label: 'المساحة', value: textValue(specs.storage) },
    { icon: Palette, label: 'اللون', value: textValue(specs.color) },
    ...(batteryHealth ? [{ icon: BatteryCharging, label: 'صحة البطارية', value: batteryHealth }] : []),
    { icon: Wrench, label: 'هل تم فتحه؟', value: textValue(specs.is_opened) },
    ...(!isSaudi ? [{ icon: Scale, label: 'مسجل / جمارك', value: textValue(specs.ntra_tax) }] : []),
    { icon: ShieldCheck, label: 'الضمان', value: textValue(specs.warranty) },
    ...(acceptsExchange ? [{ icon: RefreshCw, label: 'يقبل البدل', value: 'نعم' }] : []),
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-32 dark:bg-[#0d0d0d] md:pb-10">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-5 md:py-6">
        <nav className="mb-3 hidden items-center gap-1.5 text-[11px] font-bold text-[#8b9296] md:flex" aria-label="مسار الصفحة">
          <Link href="/">الرئيسية</Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <Link href="/mobiles">المنتجات</Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="max-w-64 truncate text-[#4f555a] dark:text-[#d0d0d0]">{displayName}</span>
        </nav>

        <article className="overflow-hidden rounded-[24px] border border-[#e7e9ec] bg-white shadow-[0_18px_45px_-34px_rgba(16,24,40,0.5)] dark:border-[#343434] dark:bg-[#1f1f1f]">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-7 lg:p-7">
            <div className="relative lg:col-span-5">
              <div className="absolute right-3 top-3 z-30">
                <FavoriteButton productId={product.id} className="!bg-white/85 !shadow-lg dark:!bg-black/55" />
              </div>
              {product.is_sold && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/45">
                  <span className="-rotate-6 rounded-xl border-[3px] border-[#ff1744] px-6 py-2 text-2xl font-black text-[#ff1744]">تم البيع</span>
                </div>
              )}
              <ProductGallery images={images} productName={displayName} />
            </div>

            <div className="flex flex-col p-4 sm:p-6 lg:col-span-7 lg:p-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black leading-9 text-[#202326] dark:text-white sm:text-2xl">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[#6b7175] dark:text-[#c7c7c7]">
                    <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" />{product.category}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4 fill-current" />{product.location}</span>
                  </div>
                </div>
                <p className="shrink-0 text-2xl font-black text-[#079447] dark:text-[#53d889]">
                  {Number(product.price) > 0 ? `${Number(product.price).toLocaleString(locale)} ${currency}` : 'قابل للتفاوض'}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-[#edf0ee] py-3 dark:border-[#363636]">
                <ProductViewCounter productId={product.id} initialCount={product.views_count ?? 0} />
                <span className="h-5 w-px bg-[#dde2df] dark:bg-[#424242]" />
                <span className="rounded-full bg-[#eef5f1] px-3 py-1 text-[10px] font-black text-[#4f6971] dark:bg-[#29302c] dark:text-[#d3d3d3]">{product.condition || 'مستعمل'}</span>
                {product.is_negotiable && <span className="rounded-full bg-[#ffe68a] px-3 py-1 text-[10px] font-black text-[#5a4300]">قابل للتفاوض</span>}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-l from-[#fafcfb] to-[#f4f7f5] p-2 dark:from-[#272727] dark:to-[#242424]">
                <ProductLikeButton productId={product.id} initialCount={product.likes_count ?? 0} />
                <Link href="#comments" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e3e7e5] px-3 py-2.5 text-xs font-black text-[#4f555a] transition hover:text-[#078b43] dark:border-[#3a3a3a] dark:text-[#d0d0d0]">
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden min-[390px]:inline">تعليقات</span>
                  <span>{product.comments_count ?? 0}</span>
                </Link>
                <ShareProductButton title={displayName} />
              </div>

              <section className="mt-5">
                <h2 className="flex items-center gap-2 text-sm font-black text-[#282c2f] dark:text-white"><span className="h-5 w-1.5 rounded-full bg-[#12b95f]" />الوصف</h2>
                <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f7f9f8] p-4 text-xs leading-7 text-[#565c60] dark:bg-[#272727] dark:text-[#d3d3d3]">{product.description || 'لم يضف البائع وصفًا لهذا الإعلان.'}</p>
              </section>

              <div className="mt-5 hidden grid-cols-3 gap-2 md:grid">
                {whatsappNumber && (
                  <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحبًا ${sellerName}، أنا مهتم بمنتج ${displayName} على سوق فون`)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#18a957] px-3 text-xs font-black text-white"><MessageSquare className="h-5 w-5" />واتساب</a>
                )}
                <ContactSellerButton sellerId={product.seller_id} sellerName={sellerName} sellerAvatar={seller?.profile_image_url || undefined} productId={product.id} productSlug={product.slug} />
                {sellerPhone && <a href={`tel:${sellerPhone.replace(/[^\d+]/g, '')}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#eef1ef] px-3 text-xs font-black text-[#4f555a] dark:bg-[#303030] dark:text-white"><Phone className="h-5 w-5" />اتصال</a>}
              </div>
            </div>
          </div>
        </article>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <section className="rounded-[22px] border border-[#e7e9ec] bg-white p-4 shadow-sm dark:border-[#343434] dark:bg-[#1f1f1f] sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white"><span className="h-5 w-1.5 rounded-full bg-[#12b95f]" />مواصفات المنتج</h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {specItems.map((spec) => (
                  <div key={spec.label} className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#edf0ee] bg-[#f8faf9] p-3 dark:border-[#383838] dark:bg-[#272727]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9f9ef] text-[#078b43] dark:bg-[#173323] dark:text-[#54db8d]"><spec.icon className="h-4 w-4" /></span>
                    <div className="min-w-0"><p className="text-[9px] font-bold text-[#92989c]">{spec.label}</p><p className="truncate text-[11px] font-black text-[#3d4245] dark:text-[#eeeeee]">{spec.value}</p></div>
                  </div>
                ))}
              </div>
              {accessories && <div className="mt-3 rounded-2xl bg-[#f8faf9] p-4 text-xs font-bold text-[#565c60] dark:bg-[#272727] dark:text-[#d3d3d3]"><strong className="text-[#242628] dark:text-white">الملحقات: </strong>{accessories}</div>}
            </section>

            <section className="rounded-[22px] border border-[#f0dfaa] bg-[#fffbef] p-4 dark:border-[#56491f] dark:bg-[#2b281d] sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-black text-[#6b5310] dark:text-[#ffe08a]"><ShieldCheck className="h-5 w-5" />نصائح للتعامل الآمن</h2>
              <div className="mt-3 grid gap-2 text-[11px] font-bold leading-6 text-[#75632d] dark:text-[#e6d696] sm:grid-cols-2">
                {['قابل البائع في مكان عام وآمن.', 'افحص المنتج وجميع وظائفه قبل الدفع.', 'لا تحول أي مبلغ مقدمًا قبل المعاينة.', 'تأكد من بيانات الجهاز والضمان إن وجد.'].map((tip) => <p key={tip} className="flex gap-2"><CircleCheck className="mt-1 h-4 w-4 shrink-0 text-[#d39b00]" />{tip}</p>)}
              </div>
            </section>

            <ProductComments productId={product.id} initialCount={product.comments_count ?? 0} />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <section className="rounded-[22px] border border-[#e7e9ec] bg-white p-5 shadow-sm dark:border-[#343434] dark:bg-[#1f1f1f]">
              <p className="text-[10px] font-bold text-[#959b9f]">معلومات البائع</p>
              <Link href={`/store/${product.seller_id}`} className="mt-3 flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#d9f7e5] text-lg font-black text-[#078b43] dark:bg-[#173323] dark:text-[#54db8d]">
                  {seller?.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={seller.profile_image_url} alt={sellerName} className="h-full w-full object-cover" />
                  ) : sellerName.charAt(0)}
                </span>
                <span className="min-w-0"><span className="flex items-center gap-1 text-sm font-black text-[#292d30] dark:text-white">{sellerName}{seller?.is_verified && <ShieldCheck className="h-4 w-4 text-[#079447]" />}</span><span className="mt-1 block text-[10px] font-bold text-[#91979b]">{seller?.followers_count ?? 0} متابع</span></span>
              </Link>
              {seller?.bio && <p className="mt-3 text-[11px] leading-6 text-[#676d71] dark:text-[#cccccc]">{seller.bio}</p>}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#fff8e8] p-3 dark:bg-[#30291b]"><span className="text-xs font-black text-[#5d4a19] dark:text-[#ffe08a]">تقييم البائع</span><span className="flex items-center gap-1 text-sm font-black text-[#e99b00]"><Star className="h-5 w-5 fill-current" />{Number(seller?.seller_rating ?? 0).toFixed(1)}</span></div>
            </section>

            <section className="rounded-[22px] border border-[#e7e9ec] bg-white p-5 shadow-sm dark:border-[#343434] dark:bg-[#1f1f1f]">
              <h2 className="text-sm font-black text-[#292d30] dark:text-white">موقع المنتج</h2>
              <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf8ef] to-[#f6faf7] p-4 text-center dark:from-[#173323] dark:to-[#252925]"><MapPin className="h-8 w-8 fill-[#079447]/15 text-[#079447]" /><p className="mt-2 text-xs font-black text-[#4f555a] dark:text-[#d3d3d3]">{product.location}</p></div>
            </section>
          </aside>
        </div>

        {similarProducts && similarProducts.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[#242628] dark:text-white"><span className="h-5 w-1.5 rounded-full bg-[#12b95f]" />منتجات مشابهة</h2>
            <div className="product-card-grid">{similarProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </section>
        )}
      </div>

      <MobileContactBar sellerId={product.seller_id} sellerName={sellerName} sellerPhone={sellerPhone} sellerWhatsapp={sellerWhatsapp} productId={product.id} productSlug={product.slug} productName={displayName} location={product.location} />
    </main>
  );
}
