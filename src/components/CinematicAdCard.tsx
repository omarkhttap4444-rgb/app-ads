'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, MessageCircle, Phone, Store, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type CinematicAd = {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  action_type: string; // 'whatsapp' | 'store' | 'url' | 'phone'
  action_data: string;
  advertiser_name?: string | null;
  frequency_interval?: number;
  sort_order?: number;
  country_code?: string;
};

type Props = {
  ad: CinematicAd;
  isSaudi?: boolean;
  className?: string;
};

export default function CinematicAdCard({ ad, isSaudi = false, className = '' }: Props) {
  const [hasRecordedClick, setHasRecordedClick] = useState(false);

  const recordClick = async () => {
    if (hasRecordedClick || !ad.id) return;
    setHasRecordedClick(true);
    try {
      await supabase.rpc('record_cinematic_ad_click', { p_ad_id: ad.id });
    } catch {
      // Non-blocking tracking
    }
  };

  const actionType = (ad.action_type || 'whatsapp').toLowerCase();
  const rawData = (ad.action_data || '').trim();

  let actionHref = '#';
  let isExternal = false;
  let actionLabel = 'تصفح الآن';
  let ActionIcon = ExternalLink;
  let buttonBg = 'bg-gradient-to-r from-[#00a86b] to-[#059669] hover:from-[#008f5b] hover:to-[#047857] text-white';

  if (actionType === 'whatsapp') {
    let clean = rawData.replace(/[^\d]/g, '');
    while (clean.startsWith('0')) clean = clean.substring(1);
    if (!clean.startsWith('20') && !clean.startsWith('966')) {
      clean = clean.startsWith('5') && clean.length === 9 ? `966${clean}` : `20${clean}`;
    }
    const msg = encodeURIComponent(`مرحباً، أنا أتواصل معك بخصوص الإعلان المعروض في سوق فون: ${ad.title}`);
    actionHref = `https://wa.me/${clean}?text=${msg}`;
    isExternal = true;
    actionLabel = 'تواصل عبر واتساب';
    ActionIcon = MessageCircle;
    buttonBg = 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[0_8px_20px_-8px_rgba(37,211,102,0.8)]';
  } else if (actionType === 'store') {
    actionHref = `/store/${encodeURIComponent(rawData)}`;
    actionLabel = 'زيارة المتجر';
    ActionIcon = Store;
    buttonBg = 'bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white shadow-[0_8px_20px_-8px_rgba(217,119,6,0.8)]';
  } else if (actionType === 'phone') {
    const cleanPhone = rawData.replace(/[^\d+]/g, '');
    actionHref = `tel:${cleanPhone}`;
    actionLabel = 'اتصال هاتفي';
    ActionIcon = Phone;
    buttonBg = 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white';
  } else {
    // URL
    let url = rawData;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    actionHref = url || '#';
    isExternal = true;
    actionLabel = 'تصفح العرض';
    ActionIcon = ExternalLink;
    buttonBg = 'bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white';
  }

  const Content = (
    <div
      onClick={recordClick}
      className={`group relative overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white shadow-[0_12px_32px_-16px_rgba(16,24,40,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-14px_rgba(16,24,40,0.24)] dark:border-[#2d3339] dark:bg-[#181d20] ${className}`}
    >
      {/* Aspect banner container */}
      <div className="relative aspect-[21/9] min-h-[170px] w-full overflow-hidden bg-[#0e1614] sm:min-h-[220px] md:min-h-[260px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image_url}
          alt={ad.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-transparent rtl:bg-gradient-to-l" />

        {/* Top Badges */}
        <div className="absolute top-3.5 right-3.5 z-10 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black tracking-wide text-amber-300 backdrop-blur-md border border-amber-400/30">
            <Sparkles className="h-3 w-3 fill-amber-300" />
            إعلان سينمائي مميز
          </span>
          {ad.advertiser_name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              <Store className="h-3 w-3" />
              {ad.advertiser_name}
            </span>
          )}
        </div>

        {/* Bottom Banner Details & CTA */}
        <div className="absolute bottom-3.5 right-3.5 left-3.5 z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h3 className="text-base font-black text-white drop-shadow-md sm:text-lg md:text-2xl">
              {ad.title}
            </h3>
            {ad.subtitle && (
              <p className="mt-1 line-clamp-2 text-xs font-semibold text-white/90 drop-shadow sm:text-sm">
                {ad.subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition duration-200 ${buttonBg} sm:text-sm`}
            >
              <ActionIcon className="h-4 w-4" />
              {actionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={actionHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={recordClick}
      >
        {Content}
      </a>
    );
  }

  return (
    <Link href={actionHref} className="block" onClick={recordClick}>
      {Content}
    </Link>
  );
}

