'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Download, PlusCircle } from 'lucide-react';

type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
};

type Props = {
  banners: Banner[];
};

export default function BannerCarousel({ banners }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback banners if none are configured in database
  const fallbackBanners: Banner[] = [
    {
      id: 'fallback-1',
      title: 'تطبيق سوق فون على هاتف ذكي',
      subtitle: 'استقبل رسائل المشترين فوراً وتصفح بدون عمولة',
      image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=80',
      link_url: 'https://play.google.com/store/apps/details?id=com.souqphone.app',
    },
    {
      id: 'fallback-2',
      title: 'بيع موبايلك القديم بأفضل سعر',
      subtitle: 'اعرض جهازك للبيع مجاناً ودع آلاف المشترين يتواصلون معك مباشرة',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
      link_url: '/mobiles/add',
    }
  ];

  const activeBanners = banners.length > 0 ? banners : fallbackBanners;

  // Auto scroll
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <div className="relative w-full h-[200px] sm:h-[260px] md:h-[340px] lg:h-[384px] xl:h-[403px] bg-slate-900 overflow-hidden rounded-none md:rounded-3xl group shadow-md border-y md:border border-slate-200/10 dark:border-slate-800/40">
      
      {/* Slides wrapper */}
      <div 
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(${currentIndex * 100}%)` }} // RTL support: translate positively
      >
        {activeBanners.map((banner, index) => {
          const isAppDownload = banner.link_url?.includes('play.google.com');
          const isInternalLink = banner.link_url && !banner.link_url.startsWith('http');

          const slideContent = (
            <div className="relative w-full h-full flex-shrink-0 select-none">
              {/* Slide Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={banner.image_url} 
                alt={banner.title || 'سوق فون'} 
                className="w-full h-full object-cover opacity-95 pointer-events-none" 
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/25 to-transparent"></div>

              {/* Slide Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 text-right max-w-2xl text-white">
                {banner.id.startsWith('fallback-1') && (
                  <span className="bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">جديد</span>
                )}
                {banner.id.startsWith('fallback-2') && (
                  <span className="bg-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">بيع الآن</span>
                )}
                
                {banner.title && (
                  <h3 className="text-lg md:text-3xl font-black leading-tight drop-shadow-md">
                    {banner.id.startsWith('fallback-1') ? 'تطبيق سوق فون الرسمي الآن' : banner.title}
                  </h3>
                )}
                
                {banner.subtitle && (
                  <p className="text-[11px] md:text-sm text-slate-200 mt-2 font-semibold max-w-md drop-shadow-sm leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}

                {/* Call To Action Button inside slide */}
                {banner.link_url && (
                  <div className="mt-4 md:mt-6">
                    {isInternalLink ? (
                      <Link 
                        href={banner.link_url}
                        className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        اعرض جهازك الآن
                      </Link>
                    ) : (
                      <a 
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-950 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-2xl border border-slate-700/50 transition-all shadow-md shadow-slate-950/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-teal-400" />
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
                isInternalLink ? (
                  <Link href={banner.link_url}>{slideContent}</Link>
                ) : (
                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer">{slideContent}</a>
                )
              ) : (
                slideContent
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (RTL mapped) */}
      {activeBanners.length > 1 && (
        <>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === index ? 'w-5 bg-teal-500' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
