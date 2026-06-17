'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

export type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    location: string;
    condition: string;
    slug: string;
    specifications?: {
      brand?: string;
      model?: string;
      storage?: string;
      ram?: string;
      battery_health?: string;
      color?: string;
    };
    product_images?: Array<{ image_url: string }> | { image_url: string }[];
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
};

export default function ProductCard({ product, onFavoriteToggle }: ProductCardProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const brand = product.specifications?.brand || '';
  const model = product.specifications?.model || '';
  const storage = product.specifications?.storage || '';
  const ram = product.specifications?.ram || '';
  const battery = product.specifications?.battery_health || '';
  const color = product.specifications?.color || '';

  // Format title: e.g. "iPhone 13 Pro" or fallback to product.name
  const displayTitle = brand || model 
    ? `${brand} ${model}`.trim() 
    : product.name;

  const images = Array.isArray(product.product_images) 
    ? product.product_images.map((i: any) => i.image_url) 
    : [];
  const mainImg = images[currentImgIndex] || '/placeholder-mobile.png';

  // Handle Carousel Next
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    }
  };

  // Handle Carousel Prev
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Native App styling for product condition badges
  let conditionClass = '';
  switch (product.condition) {
    case 'جديد':
      conditionClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      break;
    case 'كسر زيرو':
      conditionClass = 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40';
      break;
    case 'مستعمل':
    default:
      conditionClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-405 border border-amber-100 dark:border-amber-900/40';
      break;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 flex flex-col relative group">
      
      {/* Heart / Favorite Button */}
      <div className="absolute top-2 left-2 z-20">
        <FavoriteButton 
          productId={product.id} 
          onToggle={onFavoriteToggle}
        />
      </div>

      <Link href={`/mobiles/${product.slug}`} className="flex flex-col flex-1">
        
        {/* Product Image Area / Mini Carousel */}
        <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center p-3.5 md:p-4 overflow-hidden border-b border-slate-50 dark:border-slate-855/50">
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mainImg} 
            alt={product.name} 
            className="object-contain h-full w-auto max-w-full transition-transform duration-500 drop-shadow-md"
            loading="lazy"
          />

          {/* Slider Navigation Arrows (Visible always on multi-image products) */}
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm active:scale-90 transition-all z-10 hover:bg-white dark:hover:bg-slate-700"
                title="الصورة السابقة"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm active:scale-90 transition-all z-10 hover:bg-white dark:hover:bg-slate-700"
                title="الصورة التالية"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Carousel Pagination Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <span 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImgIndex 
                      ? 'bg-teal-500 w-3' 
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Condition Badge (Floating Bottom Right) */}
          <span className={`absolute bottom-2 right-2 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm ${conditionClass}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Card Details */}
        <div className="p-3 md:p-4 flex flex-col flex-1 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/10 dark:to-slate-900/10">
          
          {/* Product Title */}
          <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-[11px] md:text-sm line-clamp-1 leading-tight mb-2 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
            {displayTitle}
          </h3>

          {/* Specifications Chips (Like App Specs badges) */}
          <div className="flex flex-wrap gap-1 mb-3">
            {storage && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {storage}
              </span>
            )}
            {ram && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                رام {ram}
              </span>
            )}
            {battery && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                بطارية {battery}%
              </span>
            )}
            {color && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-[60px]">
                {color}
              </span>
            )}
          </div>

          <div className="mt-auto pt-2.5 border-t border-slate-100/60 dark:border-slate-800/60 flex flex-col">
            
            {/* Price section */}
            <div className="text-teal-500 dark:text-teal-400 font-black text-sm md:text-lg flex items-baseline gap-0.5">
              {product.price.toLocaleString('ar-EG')}
              <span className="text-[9px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-500">جنيه</span>
            </div>
            
            {/* Location row */}
            <div className="mt-1.5 flex items-center gap-1 text-[9px] md:text-[11px] text-slate-400 dark:text-slate-500">
              <MapPin className="w-3 h-3 text-slate-450 dark:text-slate-500 shrink-0" />
              <span className="truncate">{product.location}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
