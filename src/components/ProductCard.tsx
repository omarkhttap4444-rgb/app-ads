'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
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
    };
    product_images?: Array<{ image_url: string }> | { image_url: string }[];
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
};

export default function ProductCard({ product, onFavoriteToggle }: ProductCardProps) {
  const brand = product.specifications?.brand || '';
  const model = product.specifications?.model || '';
  const storage = product.specifications?.storage || '';
  
  // Format title: "Brand Model (Storage)" or fallback to product.name
  const displayTitle = brand || model 
    ? `${brand} ${model}${storage ? ` • ${storage}` : ''}`.trim() 
    : product.name;

  const images = Array.isArray(product.product_images) 
    ? product.product_images.map((i: any) => i.image_url) 
    : [];
  const mainImg = images[0] || '/placeholder-mobile.png';

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex flex-col relative group">
      {/* Heart / Favorite Button */}
      <div className="absolute top-2 left-2 z-10">
        <FavoriteButton 
          productId={product.id} 
          onToggle={onFavoriteToggle}
        />
      </div>

      <Link href={`/mobiles/${product.slug}`} className="flex flex-col flex-1">
        {/* Product Image Area */}
        <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center p-3.5 md:p-4 overflow-hidden border-b border-slate-50 dark:border-slate-850/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mainImg} 
            alt={product.name} 
            className="object-contain h-full w-auto max-w-full group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
            loading="lazy"
          />
          {/* Condition Badge (Floating Bottom Right) */}
          <span className={`absolute bottom-2 right-2 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-md ${conditionClass}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Card Details */}
        <div className="p-3 md:p-4 flex flex-col flex-1 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/10 dark:to-slate-900/10">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-[11px] md:text-sm line-clamp-2 leading-tight mb-2.5 min-h-[2.2rem] md:min-h-[2.5rem] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {displayTitle}
          </h3>

          <div className="mt-auto pt-2.5 border-t border-slate-100/60 dark:border-slate-800/60 flex flex-col">
            {/* Price section */}
            <div className="text-teal-600 dark:text-teal-400 font-black text-[13px] md:text-lg flex items-baseline gap-0.5">
              {product.price.toLocaleString('ar-EG')}
              <span className="text-[9px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-550">جنيه</span>
            </div>
            
            {/* Location row */}
            <div className="mt-1.5 flex items-center gap-1 text-[9px] md:text-[11px] text-slate-400 dark:text-slate-500">
              <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="truncate">{product.location}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
