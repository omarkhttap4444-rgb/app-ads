'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HomeBanner } from '@/lib/home-data';

function resolveSafeBannerHref(raw?: string): { href: string; external: boolean } | null {
  const url = (raw ?? '').trim();
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) {
    return { href: url, external: false };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      if (parsed.hostname === 'souqphone.com' || parsed.hostname === 'www.souqphone.com') {
        return { href: `${parsed.pathname}${parsed.search}${parsed.hash}` || '/', external: false };
      }
      return { href: parsed.toString(), external: true };
    }
  } catch {
    return null;
  }
  return null;
}

export default function HomeBannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (media?.matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const current = banners[activeIndex % count] ?? banners[0];
  const safeLink = resolveSafeBannerHref(current.link_url);

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + count) % count);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % count);

  const slideBody = (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[24px] bg-[#0c2618] sm:aspect-[20/7] md:aspect-[24/7]">
      <Image
        src={current.image_url}
        alt={current.title || 'عرض سوق فون'}
        fill
        priority={activeIndex === 0}
        sizes="(max-width: 768px) 100vw, 1280px"
        className="object-cover transition-transform duration-700"
      />
      {(current.title || current.subtitle) && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-white sm:p-6 md:p-8">
          {current.title && (
            <p className="max-w-2xl text-sm font-black drop-shadow-sm sm:text-lg md:text-2xl">
              {current.title}
            </p>
          )}
          {current.subtitle && (
            <p className="mt-1 max-w-xl line-clamp-2 text-[11px] font-semibold text-white/90 sm:text-xs md:text-sm">
              {current.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section
      aria-label="العروض الرئيسية"
      className="relative mt-3 overflow-hidden rounded-[24px] shadow-[0_16px_34px_-18px_rgba(0,0,0,0.28)] md:mt-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {safeLink ? (
        safeLink.external ? (
          <a
            href={safeLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {slideBody}
          </a>
        ) : (
          <Link href={safeLink.href} className="block">
            {slideBody}
          </Link>
        )
      ) : (
        slideBody
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="العرض السابق"
            className="absolute right-2.5 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="العرض التالي"
            className="absolute left-2.5 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">
            {banners.map((banner, idx) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`عرض رقم ${idx + 1}`}
                aria-current={idx === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(idx)}
                className={`rounded-full transition-all ${
                  idx === activeIndex
                    ? 'h-1.5 w-5 bg-white'
                    : 'h-1.5 w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
