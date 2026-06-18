'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Download, PlusCircle } from 'lucide-react';

type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
};

type Props = { banners: Banner[] };

export default function BannerCarousel({ banners }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fallbackBanners: Banner[] = [
    {
      id: 'fallback-1',
      title: 'تطبيق سوق فون الرسمي الآن',
      subtitle: 'استقبل رسائل المشترين فوراً وتصفح بدون عمولة',
      image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=80',
      link_url: 'https://play.google.com/store/apps/details?id=com.souqphone.app',
    },
    {
      id: 'fallback-2',
      title: 'بيع موبايلك القديم بأفضل سعر',
      subtitle: 'اعرض جهازك للبيع مجاناً ودع آلاف المشترين يتواصلون معك',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
      link_url: '/mobiles/add',
    }
  ];

  const activeBanners = banners.length > 0 ? banners : fallbackBanners;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered, goNext]);

  return (
    <div 
      className="relative w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[380px] bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-2xl group shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      <div 
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(${currentIndex * 100}%)` }}
      >
        {activeBanners.map((banner) => {
          const isInternalLink = banner.link_url && !banner.link_url.startsWith('http');

          const slideContent = (
            <div className="relative w-full h-full flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={banner.image_url} 
                alt={banner.title || 'سوق فون'} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-12 text-right max-w-xl text-white">
                {banner.title && (
                  <h3 className="text-base md:text-2xl lg:text-3xl font-black leading-tight drop-shadow-md">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="text-[10px] md:text-sm text-slate-200 mt-2 font-medium max-w-md drop-shadow-sm leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <div className="mt-3 md:mt-5">
                    {isInternalLink ? (
                      <Link href={banner.link_url} className="inline-flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-500 text-white text-[10px] md:text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer">
                        <PlusCircle className="w-3.5 h-3.5" />
                        اعرض جهازك الآن
                      </Link>
                    ) : (
                      <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-4 py-2 rounded-lg border border-white/20 transition-all cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        تحميل التطبيق
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <div key={banner.id} className="w-full h-full flex-shrink-0">
              {banner.link_url ? (
                isInternalLink ? <Link href={banner.link_url}>{slideContent}</Link> : <a href={banner.link_url} target="_blank" rel="noopener noreferrer">{slideContent}</a>
              ) : slideContent}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-30">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Progress Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === index ? 'w-6 bg-ocean-400' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          {!isHovered && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
              <div key={currentIndex} className="h-full bg-ocean-400 carousel-progress" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
