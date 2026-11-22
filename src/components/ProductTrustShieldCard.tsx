import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ListingTrustReport } from '@/lib/trust-safety-analyzer';

export default function ProductTrustShieldCard({
  report,
}: {
  report: ListingTrustReport;
}) {
  const palette =
    report.level === 'verified_high'
      ? {
          wrap: 'border-emerald-500/30 bg-[#ecfdf5] dark:border-emerald-500/30 dark:bg-[#0d231a]',
          badge: 'bg-emerald-600 text-white',
          icon: ShieldCheck,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          label: 'إعلان موثوق جداً',
        }
      : report.level === 'good'
        ? {
            wrap: 'border-sky-500/30 bg-[#f0f9ff] dark:border-sky-500/30 dark:bg-[#0e1d2b]',
            badge: 'bg-sky-600 text-white',
            icon: ShieldCheck,
            iconColor: 'text-sky-600 dark:text-sky-400',
            label: 'مؤشر أمان جيد',
          }
        : report.level === 'caution'
          ? {
              wrap: 'border-amber-500/30 bg-[#fffbeb] dark:border-amber-500/30 dark:bg-[#261b0d]',
              badge: 'bg-amber-600 text-white',
              icon: AlertTriangle,
              iconColor: 'text-amber-600 dark:text-amber-400',
              label: 'تحقق من التفاصيل قبل الشراء',
            }
          : {
              wrap: 'border-rose-500/40 bg-[#fef2f2] dark:border-rose-500/40 dark:bg-[#2b1114]',
              badge: 'bg-rose-600 text-white',
              icon: ShieldAlert,
              iconColor: 'text-rose-600 dark:text-rose-400',
              label: 'تنبيه أمان هام — توخَّ الحذر',
            };

  const Icon = palette.icon;

  return (
    <section
      className={`rounded-[24px] border p-5 ${palette.wrap}`}
      aria-label="درع الأمان الذكي للإعلان"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-6 w-6 shrink-0 ${palette.iconColor}`} />
          <div>
            <p className={`text-[10px] font-black ${palette.iconColor}`}>درع الأمان الذكي</p>
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white">
              {palette.label}
            </h2>
          </div>
        </div>
        <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${palette.badge}`}>
          {report.score}/100
        </span>
      </div>

      {report.warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {report.warnings.map((w) => (
            <div
              key={w.code}
              className="rounded-2xl border border-rose-500/30 bg-white/90 p-3 dark:bg-black/25"
            >
              <p className="text-xs font-black text-rose-700 dark:text-rose-300">{w.title}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-[#334155] dark:text-[#cbd5e1]">
                {w.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {report.positiveSignals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {report.positiveSignals.map((signal) => (
            <span
              key={signal}
              className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-bold text-[#1e293b] shadow-xs dark:bg-white/10 dark:text-white"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${palette.iconColor}`} />
              {signal}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
