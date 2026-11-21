import Link from 'next/link';
import { ChevronLeft, MapPin, ShieldCheck, Wrench } from 'lucide-react';

export default function HomeMaintenanceBanner({
  centersCount = 0,
}: {
  centersCount?: number;
}) {
  return (
    <section
      aria-label="دليل مراكز الصيانة في القاهرة"
      className="mt-5 overflow-hidden rounded-[24px] border border-amber-400/35 bg-gradient-to-l from-[#053b24] via-[#0a5c39] to-[#107a4c] text-white shadow-[0_16px_34px_-18px_rgba(4,46,28,0.65)]"
    >
      <Link
        href="/maintenance"
        className="group relative flex flex-col justify-between gap-4 p-4 transition hover:brightness-105 sm:flex-row sm:items-center sm:p-5 md:px-7"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/45 bg-white/12 shadow-inner">
            <Wrench className="h-7 w-7 text-amber-100" />
            <span className="absolute -bottom-2 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 px-2 py-0.5 text-[8.5px] font-black text-white shadow">
              معتمد ✓
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black sm:text-base md:text-lg">
                دليل مراكز الصيانة المعتمدة في القاهرة
              </h2>
              {centersCount > 0 && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black text-amber-200">
                  +{centersCount} مركز
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-emerald-50/90 sm:text-xs">
              تغيير شاشات، بوردة، بطاريات أصلية وصيانة فورية — قارن الضمان والتقييمات وتواصل مباشرة
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-emerald-100">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5">
                <MapPin className="h-3 w-3 text-amber-300" />
                شارع عبد العزيز • مدينة نصر • المعادي • مصر الجديدة
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-300" />
                تواصل مباشر بدون وسيط
              </span>
            </div>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 self-end rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-[#1a1400] shadow-md transition group-hover:bg-amber-300 sm:self-center">
          تصفح الدليل
          <ChevronLeft className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
