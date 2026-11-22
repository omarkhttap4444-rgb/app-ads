import Link from 'next/link';
import { ChevronLeft, Clock, Flame } from 'lucide-react';
import ProductCard, { type ProductCardProps } from '@/components/ProductCard';
import type { DealAssessment } from '@/lib/market-deal-intelligence';

export type HotDealCardItem = {
  product: ProductCardProps['product'];
  assessment: DealAssessment;
};

export default function HomeHotDealsSection({
  deals,
  isSaudi,
}: {
  deals: HotDealCardItem[];
  isSaudi: boolean;
}) {
  if (deals.length === 0) return null;

  const locale = isSaudi ? 'ar-SA' : 'ar-EG';
  const currency = isSaudi ? 'ر.س' : 'ج.م';
  const now = new Date();
  const hoursLeft = Math.max(1, 24 - now.getUTCHours());

  return (
    <section
      aria-label="لقطات اليوم"
      className="relative mt-7 overflow-hidden rounded-[28px] border border-emerald-400/30 bg-gradient-to-bl from-[#071b13] via-[#0c2a1e] to-[#081912] p-4 shadow-[0_22px_48px_-24px_rgba(5,150,105,0.48)] md:p-6"
    >
      {/* Ambient Luxury Glow Orbs */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/25 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-amber-500/20 blur-3xl"
      />

      {/* Editorial Header */}
      <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-bl from-[#ffb020] via-[#ff6b00] to-[#059669] text-white shadow-[0_10px_22px_-6px_rgba(255,122,0,0.55)]">
            <Flame className="h-6 w-6 fill-current" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-white md:text-xl">
                لقطات اليوم
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-200" />
                تتجدد يومياً
              </span>
              <span className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-amber-200 sm:inline-flex">
                <Clock className="h-3 w-3" />
                تتجدد خلال {hoursLeft} س
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-emerald-100/80 md:text-xs">
              صفقات حقيقية مختارة تلقائياً بأقل من متوسط السوق — بدون تكرار وبحماية كاملة ضد الأسعار الوهمية
            </p>
          </div>
        </div>

        <Link
          href={isSaudi ? '/mobiles?country=SA&sort=price_asc' : '/mobiles?sort=price_asc'}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-400/30 bg-white/10 px-3.5 py-2 text-xs font-black text-emerald-100 backdrop-blur-md transition hover:bg-white/15"
        >
          تصفح كل العروض
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal Luxury Deal Cards */}
      <div className="scroll-hide relative z-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {deals.map(({ product, assessment }) => {
          const barPct = Math.min(100, Math.max(24, Math.round((assessment.savingsPercent / 45) * 100)));
          return (
            <div
              key={`hot-deal-${product.id}`}
              className="flex w-[calc(50%-8px)] min-w-[178px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-emerald-300/25 bg-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-1 dark:bg-[#14231c] sm:w-[220px] md:w-[242px]"
            >
              <div className="flex-1 [&_.app-product-card]:!rounded-b-none [&_.app-product-card]:!border-0 [&_.app-product-card]:hover:!translate-y-0">
                <ProductCard product={product} dealAssessment={assessment} />
              </div>

              {/* Savings Intelligence Strip */}
              <div className="border-t border-emerald-500/15 bg-gradient-to-l from-[#ecfdf5] to-[#f8fffb] px-3 py-2.5 dark:from-[#0e2018] dark:to-[#13261d]">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="rounded-md bg-emerald-600/15 px-1.5 py-0.5 font-black text-[#047857] dark:text-[#6ee7b7]">
                    وفر {assessment.savingsAmount.toLocaleString(locale)} {currency}
                  </span>
                  <span className="font-bold text-[#64748b] line-through dark:text-[#94a3b8]">
                    {assessment.medianPrice.toLocaleString(locale)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-amber-400"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
