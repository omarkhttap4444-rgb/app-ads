'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Check } from 'lucide-react';

export default function CountryBanner({ country }: { country: 'EG' | 'SA' }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSaudi = country === 'SA';

  const switchCountry = (target: 'EG' | 'SA') => {
    if (target === country) return;
    document.cookie = `user_country=${target}; path=/; max-age=31536000; SameSite=Lax`;
    const params = new URLSearchParams(window.location.search);
    if (target === 'SA') params.set('country', 'SA');
    else params.delete('country');
    const newQuery = params.toString();
    router.push(`${pathname}${newQuery ? `?${newQuery}` : ''}`);
    router.refresh();
  };

  return (
    <aside aria-label="تحديد دولة السوق" className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/60 p-3.5 shadow-sm dark:border-emerald-500/25 dark:from-[#0d1e16] dark:via-[#14261d] dark:to-[#0d1e16]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-xl shadow-xs">
          {isSaudi ? '🇸🇦' : '🇪🇬'}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#202326] dark:text-white md:text-sm">
              أنت تتصفح: {isSaudi ? 'سوق فون السعودية 🇸🇦' : 'سوق فون مصر 🇪🇬'}
            </span>
            <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[9.5px] font-black text-[#047857] dark:text-[#6ee7b7]">
              السوق النشط
            </span>
          </div>
          <p className="mt-0.5 text-[10.5px] font-bold text-[#60676c] dark:text-[#a0a8ad]">
            {isSaudi
              ? 'المنتجات والمتاجر والأسعار الحالية خاصة بالسوق السعودي (بالريال السعودي ر.س)'
              : 'المنتجات والمتاجر والأسعار الحالية خاصة بالسوق المصري (بالجنيه المصري ج.م)'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <span className="text-[11px] font-bold text-[#71787d] dark:text-[#a5acaf] hidden sm:inline">
          تغيير الدولة:
        </span>
        <button
          type="button"
          onClick={() => switchCountry('EG')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            !isSaudi
              ? 'bg-[#079447] text-white shadow-sm'
              : 'bg-white text-[#50555a] border border-[#dfe3e1] hover:bg-[#eff7f2] dark:bg-[#1f1f1f] dark:border-[#353535] dark:text-[#d3d3d3]'
          }`}
        >
          <span>🇪🇬 مصر</span>
          {!isSaudi && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>
        <button
          type="button"
          onClick={() => switchCountry('SA')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            isSaudi
              ? 'bg-[#079447] text-white shadow-sm'
              : 'bg-white text-[#50555a] border border-[#dfe3e1] hover:bg-[#eff7f2] dark:bg-[#1f1f1f] dark:border-[#353535] dark:text-[#d3d3d3]'
          }`}
        >
          <span>🇸🇦 السعودية</span>
          {isSaudi && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>
      </div>
    </aside>
  );
}

