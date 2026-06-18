'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Eye, ChevronLeft } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

export type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    location: string;
    condition: string;
    slug: string;
    views_count?: number;
    is_negotiable?: boolean;
    specifications?: {
      brand?: string;
      model?: string;
      storage?: string;
      ram?: string;
      battery_health?: string;
      color?: string;
      accepts_exchange?: string | boolean;
    };
    product_images?: Array<{ image_url: string }> | { image_url: string }[];
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
};

export default function ProductCard({ product, onFavoriteToggle }: ProductCardProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const brand = product.specifications?.brand || '';
  const model = product.specifications?.model || '';
  const storage = product.specifications?.storage || '';
  const ram = product.specifications?.ram || '';
  const battery = product.specifications?.battery_health || '';
  const acceptsExchange = product.specifications?.accepts_exchange === true || product.specifications?.accepts_exchange === 'true' || product.specifications?.accepts_exchange === 'نعم' || product.specifications?.accepts_exchange === '1';

  const displayTitle = brand || model 
    ? `${brand} ${model}`.trim() 
    : product.name;

  const images = Array.isArray(product.product_images) 
    ? product.product_images.map((i: any) => i.image_url) 
    : [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const sectionWidth = width / images.length;
    let index = Math.floor(x / sectionWidth);
    if (index < 0) index = 0;
    if (index >= images.length) index = images.length - 1;
    // Reverse index for RTL layouts
    index = (images.length - 1) - index;
    if (index !== currentImgIndex) setCurrentImgIndex(index);
  };

  const handleMouseLeave = () => setCurrentImgIndex(0);

  // Premium condition badge styling
  const conditionStyles: Record<string, string> = {
    'جديد': 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_10px_rgba(16,185,129,0.2)] border-none',
    'كسر زيرو': 'bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow-[0_4px_10px_rgba(59,130,246,0.2)] border-none',
    'مستعمل': 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-[0_4px_10px_rgba(245,158,11,0.2)] border-none',
  };
  const conditionClass = conditionStyles[product.condition] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden flex flex-col relative group h-full shadow-sm hover:shadow-2xl hover:shadow-ocean-500/10 transition-all duration-300 hover:-translate-y-1.5">
      
      {/* Favorite Button */}
      <div className="absolute top-2.5 left-2.5 z-20 transition-transform duration-200 hover:scale-110 active:scale-95">
        <FavoriteButton 
          productId={product.id} 
          onToggle={onFavoriteToggle}
        />
      </div>

      {/* Condition Badge */}
      <div className="absolute top-2.5 right-2.5 z-20">
        <span className={`noon-badge ${conditionClass}`}>
          {product.condition}
        </span>
      </div>

      <Link href={`/mobiles/${product.slug}`} className="flex flex-col flex-1 h-full">
        
        {/* Product Image */}
        <div 
          className="product-image-container aspect-square w-full relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-900/40"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full flex items-center justify-center p-4 md:p-5">
            {images.length > 0 ? (
              <>
                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={images[currentImgIndex] || images[0]} 
                  alt={`${product.name}`} 
                  className={`object-contain h-full w-auto max-w-full transition-all duration-550 ease-out group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={() => setImgLoaded(true)}
                />
              </>
            ) : (
              <div className="text-4xl opacity-30 animate-pulse">📱</div>
            )}
          </div>

          {/* Image Pagination Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-white/70 dark:bg-slate-950/65 px-2 py-1 rounded-full backdrop-blur-xs">
              {images.map((_, idx) => (
                <span 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentImgIndex 
                      ? 'bg-ocean-500 w-3' 
                      : 'bg-slate-300 dark:bg-slate-605 w-1'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3 md:p-4 flex flex-col flex-1 gap-2">
          
          {/* Brand Prefix & Title */}
          <div>
            {brand && (
              <span className="text-[10px] font-extrabold text-ocean-600 dark:text-ocean-400 tracking-wide uppercase mb-0.5 block">
                {brand}
              </span>
            )}
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm line-clamp-2 leading-relaxed min-h-[2.5rem] group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
              {displayTitle}
            </h3>
          </div>

          {/* Spec Tags */}
          {(storage || ram || battery) && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {storage && (
                <span className="text-[9px] font-bold bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  {storage}
                </span>
              )}
              {ram && (
                <span className="text-[9px] font-bold bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  {ram} رام
                </span>
              )}
              {battery && (
                <span className="text-[9px] font-bold bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  🔋 {battery}%
                </span>
              )}
            </div>
          )}

          {/* Price & Negotiability */}
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-baseline">
                <span className="text-ocean-600 dark:text-ocean-400 font-black text-base md:text-lg leading-none">
                  {product.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mr-1">جنيه</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {product.is_negotiable && (
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-450 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/20">
                    قابل للتفاوض
                  </span>
                )}
                {acceptsExchange && (
                  <span className="text-[9px] font-bold bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                    يقبل البدل
                  </span>
                )}
              </div>
            </div>
            
            {/* Location & Views */}
            <div className="mt-2.5 pt-2 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <div className="flex items-center gap-1 truncate max-w-[70%]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{product.location}</span>
              </div>
              
              {product.views_count !== undefined && product.views_count > 0 && (
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>{product.views_count}</span>
                </div>
              )}
            </div>

            {/* Desktop Slide-up Button */}
            <div className="hidden md:block overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-12 group-hover:mt-2 opacity-0 group-hover:opacity-100">
              <div className="w-full bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white font-extrabold text-xs py-2.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all shadow-[0_4px_10px_rgba(14,165,233,0.3)]">
                <span>عرض التفاصيل</span>
                <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              </div>
            </div>

          </div>
        </div>
      </Link>
    </div>
  );
}
