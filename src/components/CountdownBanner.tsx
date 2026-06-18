'use client';

import { useState, useEffect } from 'react';
import { Timer, ArrowLeft, Flame } from 'lucide-react';
import Link from 'next/link';

export default function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 32,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 6 hours when finished
          return { hours: 6, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 dark:from-amber-600 dark:via-orange-600 dark:to-rose-600 rounded-2xl p-4 md:p-6 text-white shadow-md relative overflow-hidden my-6 transition-all duration-300 hover:shadow-lg">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3 text-center md:text-right flex-col md:flex-row">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center animate-pulse shrink-0">
            <Flame className="w-6 h-6 text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black flex items-center gap-1.5 justify-center md:justify-start">
              عروض اليوم السريعة
              <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                لفترة محدودة
              </span>
            </h3>
            <p className="text-[11px] md:text-xs text-orange-50 font-medium">
              تصفح الهواتف الأكثر طلباً بأفضل الأسعار مباشرة من ملاكها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-orange-100 animate-spin-slow" />
            <span className="text-xs font-bold text-orange-100">ينتهي العرض خلال:</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[38px]">
              <span className="text-sm font-black font-mono leading-none">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-[8px] text-orange-100 mt-1">ساعة</span>
            </div>
            <span className="font-bold">:</span>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[38px]">
              <span className="text-sm font-black font-mono leading-none">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-[8px] text-orange-100 mt-1">دقيقة</span>
            </div>
            <span className="font-bold">:</span>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[38px]">
              <span className="text-sm font-black font-mono leading-none">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-[8px] text-orange-100 mt-1">ثانية</span>
            </div>
          </div>

          <Link
            href="/mobiles?sort=price_asc"
            className="bg-white hover:bg-slate-50 text-orange-600 dark:text-orange-700 font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all text-xs shrink-0 shadow-md hover:scale-105"
          >
            تصفح العروض
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
