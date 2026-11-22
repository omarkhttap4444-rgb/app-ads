import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MinusCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { ListingTrustReport, PillarStatus } from '@/lib/trust-safety-analyzer';

function pillarMeta(status: PillarStatus) {
  if (status === 'passed') {
    return {
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20 dark:border-emerald-500/25',
    };
  }
  if (status === 'warning') {
    return {
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/25 dark:border-amber-500/30',
    };
  }
  if (status === 'danger') {
    return {
      icon: XCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/30 dark:border-rose-500/35',
    };
  }
  return {
    icon: MinusCircle,
    iconColor: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-400/20 dark:border-white/10',
  };
}

export default function ProductTrustShieldCard({
  report,
}: {
  report: ListingTrustReport;
}) {
  const palette =
    report.level === 'verified_high'
      ? {
          wrap: 'border-emerald-500/30 bg-gradient-to-bl from-[#ecfdf5] to-[#f7fefa] dark:border-emerald-500/35 dark:from-[#0e241b] dark:to-[#0a1a13]',
          iconBg: 'bg-emerald-600 text-white shadow-emerald-600/25',
          ring: '#059669',
          textAccent: 'text-emerald-600 dark:text-emerald-400',
          icon: ShieldCheck,
          label: 'إعلان موثوق جداً',
        }
      : report.level === 'good'
        ? {
            wrap: 'border-sky-500/30 bg-gradient-to-bl from-[#f0f9ff] to-[#f8fcff] dark:border-sky-500/35 dark:from-[#0f2030] dark:to-[#0b1723]',
            iconBg: 'bg-sky-600 text-white shadow-sky-600/25',
            ring: '#0284c7',
            textAccent: 'text-sky-600 dark:text-sky-400',
            icon: ShieldCheck,
            label: 'مؤشر أمان جيد',
          }
        : report.level === 'caution'
          ? {
              wrap: 'border-amber-500/30 bg-gradient-to-bl from-[#fffbeb] to-[#fffdf5] dark:border-amber-500/35 dark:from-[#281c0d] dark:to-[#1d1409]',
              iconBg: 'bg-amber-600 text-white shadow-amber-600/25',
              ring: '#d97706',
              textAccent: 'text-amber-600 dark:text-amber-400',
              icon: AlertTriangle,
              label: 'راجع التفاصيل بعناية قبل الشراء',
            }
          : {
              wrap: 'border-rose-500/40 bg-gradient-to-bl from-[#fef2f2] to-[#fff8f8] dark:border-rose-500/40 dark:from-[#2d1216] dark:to-[#1f0c0f]',
              iconBg: 'bg-rose-600 text-white shadow-rose-600/25',
              ring: '#dc2626',
              textAccent: 'text-rose-600 dark:text-rose-400',
              icon: ShieldAlert,
              label: 'تنبيه أمان هام — توخَّ الحذر',
            };

  const Icon = palette.icon;
  const clampedRatio = Math.min(96, Math.max(4, report.score));
  const circumference = 2 * Math.PI * 19;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, report.score)) / 100);

  return (
    <section
      className={`rounded-[24px] border p-5 shadow-xs ${palette.wrap}`}
      aria-label="درع الأمان الذكي للإعلان"
    >
      {/* Header + Circular Ring Score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md ${palette.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={`inline-flex items-center gap-1 text-[10.5px] font-black ${palette.textAccent}`}>
              <span>درع الأمان الذكي</span>
              <Sparkles className="h-3 w-3" />
            </p>
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white">
              {palette.label}
            </h2>
          </div>
        </div>

        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg className="-rotate-90 h-12 w-12" viewBox="0 0 46 46" aria-hidden="true">
            <circle
              cx="23"
              cy="23"
              r="19"
              fill="none"
              stroke={palette.ring}
              strokeOpacity="0.18"
              strokeWidth="4"
            />
            <circle
              cx="23"
              cy="23"
              r="19"
              fill="none"
              stroke={palette.ring}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="absolute text-[11px] font-black text-[#0f172a] dark:text-white">
            {report.score}%
          </span>
        </div>
      </div>

      {/* Visual 4-Zone Segmented Trust Gauge */}
      <div className="mt-3.5">
        <div className="relative flex h-4 items-center">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                'linear-gradient(to left, #ef4444 0%, #f59e0b 42%, #0ea5e9 72%, #10b981 100%)',
            }}
          />
          <span
            className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-md"
            style={{
              right: `${clampedRatio}%`,
              transform: 'translateX(50%)',
              border: `3px solid ${palette.ring}`,
            }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[9.5px] font-bold text-[#64748b] dark:text-white/55">
          <span>حذر</span>
          <span>جيد</span>
          <span className="font-black text-emerald-700 dark:text-emerald-300">مرتفع</span>
        </div>
      </div>

      {/* 4-Pillar Mini Diagnostic Grid */}
      {report.pillars.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {report.pillars.map((pillar) => {
            const meta = pillarMeta(pillar.status);
            const PillarIcon = meta.icon;
            return (
              <div
                key={pillar.key}
                className={`flex items-center gap-2 rounded-xl border bg-white/85 px-2.5 py-2 dark:bg-white/5 ${meta.border}`}
              >
                <PillarIcon className={`h-4 w-4 shrink-0 ${meta.iconColor}`} />
                <div className="min-w-0">
                  <p className="truncate text-[9.5px] font-bold text-[#64748b] dark:text-white/60">
                    {pillar.label}
                  </p>
                  <p className="truncate text-[10.5px] font-black text-[#0f172a] dark:text-white">
                    {pillar.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {report.warnings.map((w) => {
            const isHigh = w.severity === 'high';
            return (
              <div
                key={w.code}
                className={`rounded-2xl border p-3 ${
                  isHigh
                    ? 'border-rose-500/35 bg-white/95 dark:bg-rose-950/35'
                    : 'border-amber-500/30 bg-white/90 dark:bg-amber-950/25'
                }`}
              >
                <p
                  className={`text-xs font-black ${
                    isHigh
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {w.title}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-[#334155] dark:text-[#cbd5e1]">
                  {w.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Positive Signals */}
      {report.positiveSignals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {report.positiveSignals.map((signal) => (
            <span
              key={signal}
              className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#1e293b] shadow-xs dark:bg-white/10 dark:text-white"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${palette.textAccent}`} />
              {signal}
            </span>
          ))}
        </div>
      )}

      {/* Transparent AI Approximation Disclaimer */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-black/8 pt-2.5 text-[10px] font-semibold text-[#64748b] dark:border-white/10 dark:text-white/55">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <p>
          بناءً على فحص ذكي تقريبي بالذكاء الاصطناعي — يُنصح دائماً بالمعاينة الشخصية قبل الدفع.
        </p>
      </div>
    </section>
  );
}
