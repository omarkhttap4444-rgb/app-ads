'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Smartphone } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] md:aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm gap-2">
        <Smartphone className="w-8 h-8 text-slate-350 dark:text-slate-700" />
        <span>لا توجد صور متوفرة</span>
      </div>
    );
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Viewport */}
      <div className="aspect-[4/5] md:aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800 flex items-center justify-center group shadow-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${productName} - صورة ${activeIndex + 1}`}
          className="object-contain w-full h-full p-4 select-none transition-all duration-300"
        />

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full dir-ltr">
            {activeIndex + 1} / {images.length}
          </span>
        )}

        {/* Slide Controls */}
        {images.length > 1 && (
          <>
            {/* Prev (Left in RTL, but we do next/prev absolute matching browser directions) */}
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              title="الصورة السابقة"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next (Right) */}
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              title="الصورة التالية"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Navigation */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`aspect-square rounded-xl bg-slate-50 dark:bg-slate-950 relative overflow-hidden border cursor-pointer transition-all ${
                activeIndex === idx
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`مصغرة ${idx + 1}`} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
