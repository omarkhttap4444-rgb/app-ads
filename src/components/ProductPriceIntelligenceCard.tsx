import { Flame, ShieldAlert, TrendingUp, BadgeCheck } from 'lucide-react';
import type { DealAssessment } from '@/lib/market-deal-intelligence';

export default function ProductPriceIntelligenceCard({
  assessment,
  isSaudi,
}: {
  assessment: DealAssessment;
  isSaudi: boolean;
}) {
  const locale = isSaudi ? 'ar-SA' : 'ar-EG';
  const currency = isSaudi ? 'ر.س' : 'ج.م';

  const config =
    assessment.tier === 'hot_deal'
      ? {
          icon: Flame,
          wrapper:
            'border-emerald-500/30 bg-[#ecfdf5] dark:border-emerald-500/35 dark:bg-[#0e241b]',
          iconBg: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
          pinBorder: 'border-emerald-600',
          accentText: 'text-emerald-700 dark:text-emerald-300',
          headline: `سعر لقطة — أرخص بـ ${assessment.savingsPercent}% من متوسط السوق`,
          subline: `توفير يُقدّر بـ ${assessment.savingsAmount.toLocaleString(locale)} ${currency} مقارنة بـ ${assessment.sampleCount} إعلان مشابه في سوق فون.`,
        }
      : assessment.tier === 'fair_price'
        ? {
            icon: BadgeCheck,
            wrapper: 'border-sky-500/30 bg-[#f0f9ff] dark:border-sky-500/35 dark:bg-[#0f1f2c]',
            iconBg: 'bg-sky-600/15 text-sky-700 dark:text-sky-300',
            pinBorder: 'border-sky-600',
            accentText: 'text-sky-700 dark:text-sky-300',
            headline: 'سعر عادل ومناسب للسوق',
            subline: `قريب جداً من متوسط السوق (${assessment.medianPrice.toLocaleString(locale)} ${currency}) بناءً على ${assessment.sampleCount} إعلان مشابه.`,
          }
        : assessment.tier === 'above_market'
          ? {
              icon: TrendingUp,
              wrapper:
                'border-amber-500/30 bg-[#fffbeb] dark:border-amber-500/35 dark:bg-[#261b0d]',
              iconBg: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
              pinBorder: 'border-amber-600',
              accentText: 'text-amber-700 dark:text-amber-300',
              headline: `أعلى من متوسط السوق بـ ${Math.abs(assessment.savingsPercent)}%`,
              subline: `متوسط نفس الموديل حالياً ${assessment.medianPrice.toLocaleString(locale)} ${currency} — قد يعكس حالة ممتازة أو مجالاً للتفاوض.`,
            }
          : {
              icon: ShieldAlert,
              wrapper:
                'border-rose-500/35 bg-[#fef2f2] dark:border-rose-500/40 dark:bg-[#2b1114]',
              iconBg: 'bg-rose-600/15 text-rose-700 dark:text-rose-300',
              pinBorder: 'border-rose-600',
              accentText: 'text-rose-700 dark:text-rose-300',
              headline: `تنبيه: سعر أقل بكثير من السوق (-${assessment.savingsPercent}%)`,
              subline: `متوسط نفس الموديل ${assessment.medianPrice.toLocaleString(locale)} ${currency}. لا تحوّل أي عربون قبل المعاينة الشخصية.`,
            };

  const Icon = config.icon;
  const pinLeftPct = `${Math.round(assessment.meterPosition * 100)}%`;

  return (
    <section
      className={`mt-4 rounded-2xl border p-4 transition-colors ${config.wrapper}`}
      aria-label="مؤشر عدالة السعر"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-black text-[#0f172a] dark:text-white sm:text-sm">
            {config.headline}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold leading-5 text-[#475569] dark:text-[#cbd5e1]">
            {config.subline}
          </p>
        </div>
      </div>

      {/* Visual Market Gauge (LTR numeric axis) */}
      <div dir="ltr" className="relative mt-4 flex h-5 items-center">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 via-60% to-rose-500" />
        <span
          style={{ left: pinLeftPct }}
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white shadow-md ${config.pinBorder}`}
        />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8]">أقل سعر</p>
          <p className="text-[11px] font-black text-[#1e293b] dark:text-white">
            {assessment.minPrice.toLocaleString(locale)} {currency}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8]">متوسط السوق</p>
          <p className={`text-xs font-black ${config.accentText}`}>
            {assessment.medianPrice.toLocaleString(locale)} {currency}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8]">أعلى سعر</p>
          <p className="text-[11px] font-black text-[#1e293b] dark:text-white">
            {assessment.maxPrice.toLocaleString(locale)} {currency}
          </p>
        </div>
      </div>

      {assessment.officialNewPrice && assessment.officialNewPrice > 0 && (
        <p className="mt-2.5 rounded-xl bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#334155] dark:bg-white/5 dark:text-[#cbd5e1]">
          سعر الجهاز جديداً في السوق:{' '}
          <strong className="font-black">
            {assessment.officialNewPrice.toLocaleString(locale)} {currency}
          </strong>
        </p>
      )}
    </section>
  );
}
