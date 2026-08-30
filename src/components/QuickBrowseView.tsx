import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Eye, Grid2X2, History, MapPin, Star } from 'lucide-react';

import type { ProductCardProps } from './ProductCard';

type Product = ProductCardProps['product'];

type Props = {
  products: Product[];
  totalProducts: number;
  quickHref: string;
  detailedHref: string;
  newHref: string;
  usedHref: string;
  activeCondition: string;
};

const formatPrice = (price: number) =>
  price > 0 ? `${price.toLocaleString('ar-EG')} ج.م` : 'السعر عند التواصل';

const groupName = (product: Product) =>
  product.specifications?.brand?.trim() || product.name.split(' ')[0] || 'منتجات متنوعة';

export default function QuickBrowseView({
  products,
  totalProducts,
  quickHref,
  detailedHref,
  newHref,
  usedHref,
  activeCondition,
}: Props) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = groupName(product);
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }

  return (
    <section aria-labelledby="quick-browse-title" className="pb-4">
      <div className="mb-4 rounded-[24px] border border-[#dbe8df] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.45)] dark:border-[#343434] dark:bg-[#1f1f1f] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-[#ff8a22] to-[#ff6437] text-white shadow-[0_8px_18px_-10px_rgba(255,100,55,.8)]">
              <Grid2X2 className="h-5 w-5" />
            </span>
            <div>
              <h1 id="quick-browse-title" className="text-base font-black text-[#252a27] dark:text-white">تصفح سريع</h1>
              <p className="text-[10px] font-bold text-[#7b8580] dark:text-[#aeb4b7]">بطاقات مختصرة لتقارن العروض بسرعة</p>
            </div>
          </div>
          <Link href={detailedHref} className="shrink-0 rounded-xl bg-[#eef7f1] px-3 py-2 text-[10px] font-black text-[#087d3d] transition hover:bg-[#dff3e6] dark:bg-[#173323] dark:text-[#71df9e]">
            عرض تفصيلي
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-[1.45fr_1fr_1fr] gap-2" aria-label="فلترة التصفح السريع">
          <Link href={quickHref} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-[#1d82d2] to-[#399ee8] px-2 text-[10px] font-black text-white shadow-[0_8px_16px_-12px_rgba(29,130,210,.9)]">
            <Grid2X2 className="h-4 w-4" />
            تصفح سريع
          </Link>
          <Link href={newHref} aria-current={activeCondition === 'جديد' ? 'page' : undefined} className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black transition ${activeCondition === 'جديد' ? 'bg-[#218c38] text-white shadow-sm' : 'bg-[#eef0ef] text-[#59635d] dark:bg-[#292929] dark:text-[#d4d4d4]'}`}>
            <Star className="h-3.5 w-3.5" />
            جديد
          </Link>
          <Link href={usedHref} aria-current={activeCondition === 'مستعمل' ? 'page' : undefined} className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black transition ${activeCondition === 'مستعمل' ? 'bg-[#536d76] text-white shadow-sm' : 'bg-[#eef0ef] text-[#59635d] dark:bg-[#292929] dark:text-[#d4d4d4]'}`}>
            <History className="h-3.5 w-3.5" />
            مستعمل
          </Link>
        </div>
      </div>

      <p className="mb-3 px-1 text-[11px] font-bold text-[#7b8580] dark:text-[#aeb4b7]">{totalProducts} إعلان متاح</p>

      {Array.from(groups.entries()).map(([brand, brandProducts]) => (
        <section key={brand} className="mb-5" aria-label={`إعلانات ${brand}`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-[#303632] dark:text-white">{brand}</h2>
            <span className="text-[10px] font-bold text-[#8a938e]">{brandProducts.length} عروض</span>
          </div>
          <div className="scroll-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" dir="rtl">
            {brandProducts.map((product) => {
              const image = product.product_images?.[0]?.image_url;
              const title = [product.specifications?.brand, product.specifications?.model].filter(Boolean).join(' ') || product.name;
              return (
                <Link key={product.id} href={`/mobiles/${product.slug}`} className="group flex w-[min(92vw,430px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e2e7e4] bg-white shadow-[0_9px_22px_-18px_rgba(16,24,40,.55)] transition hover:border-[#98dcb1] dark:border-[#353535] dark:bg-[#1f1f1f]">
                  <div className="relative h-[104px] w-[104px] shrink-0 bg-[#f0f2f1] dark:bg-[#151515]">
                    {image ? <Image src={image} alt="" fill sizes="104px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-3xl">📱</div>}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-2.5 text-right" dir="rtl">
                    <div>
                      <p className="truncate text-xs font-black text-[#2b312e] dark:text-white">{title}</p>
                      <p className="mt-1 truncate text-[10px] font-bold text-[#7a837e] dark:text-[#b1b7b3]">{[product.specifications?.ram, product.specifications?.storage].filter(Boolean).join(' • ') || product.condition}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#087d3d] dark:text-[#65d995]">{formatPrice(product.price)}</span>
                      <span className="rounded-md bg-[#eff8f2] px-1.5 py-0.5 text-[9px] font-black text-[#277849] dark:bg-[#193324] dark:text-[#7ddd9e]">{product.condition || 'مستعمل'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#8a938e]">
                      <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{product.location || 'مصر'}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{product.views_count ?? 0}<ChevronLeft className="h-3.5 w-3.5" /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {products.length === 0 && <div className="rounded-2xl border border-dashed border-[#dbe2de] bg-white py-16 text-center text-sm font-black text-[#747d78] dark:border-[#3a3a3a] dark:bg-[#1f1f1f] dark:text-[#c5c5c5]">لا توجد إعلانات مطابقة حالياً</div>}
    </section>
  );
}
