'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';

const BRANDS = [
  { name: 'آبل', query: 'apple', logo: '🍏', color: 'hover:bg-slate-100 hover:text-black dark:hover:bg-slate-800' },
  { name: 'سامسونج', query: 'samsung', logo: '📱', color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40' },
  { name: 'شاومي', query: 'xiaomi', logo: '⚡', color: 'hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/40' },
  { name: 'ريلمي', query: 'realme', logo: '🔋', color: 'hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950/40' },
  { name: 'أوبو', query: 'oppo', logo: '📸', color: 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/40' },
  { name: 'إنفينيكس', query: 'infinix', logo: '🚀', color: 'hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/40' },
  { name: 'هونر', query: 'honor', logo: '👑', color: 'hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40' },
  { name: 'فيفو', query: 'vivo', logo: '💎', color: 'hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40' },
  { name: 'هواوي', query: 'huawei', logo: '🌸', color: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40' },
  { name: 'وان بلس', query: 'oneplus', logo: '🔴', color: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40' },
];

export default function BrandSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    let scrollSpeed = 0.5; // slow scroll speed

    const startAutoScroll = () => {
      if (!el) return;
      el.scrollLeft -= scrollSpeed; // scroll RTL
      if (Math.abs(el.scrollLeft) >= (el.scrollWidth - el.clientWidth) - 1) {
        el.scrollLeft = 0; // Reset
      }
      animationId = requestAnimationFrame(startAutoScroll);
    };

    animationId = requestAnimationFrame(startAutoScroll);

    // Pause on hover
    const onMouseEnter = () => cancelAnimationFrame(animationId);
    const onMouseLeave = () => {
      animationId = requestAnimationFrame(startAutoScroll);
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      if (el) {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs my-8 transition-colors overflow-hidden">
      <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-ocean-500 rounded-full"></span>
        تصفح الماركات الشهيرة
      </h3>
      <div 
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto whitespace-nowrap scroll-hide dir-rtl py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Render twice for continuous loop effect */}
        {[...BRANDS, ...BRANDS].map((brand, idx) => (
          <Link
            key={`${brand.query}-${idx}`}
            href={`/mobiles?brand=${brand.name}`}
            className={`inline-flex flex-col items-center justify-center min-w-[100px] p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${brand.color}`}
          >
            <span className="text-3xl mb-2 filter drop-shadow-sm">{brand.logo}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{brand.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
