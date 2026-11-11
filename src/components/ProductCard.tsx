'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

import FavoriteButton from './FavoriteButton';
import ProductLikeButton from './ProductLikeButton';
import { productImageUrls } from '@/lib/product-images';
import { isSaudiMarketLocation, SAUDI_MARKET_ENABLED } from '@/lib/market-config';

export type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    location: string;
    condition: string;
    slug: string;
    created_at?: string;
    views_count?: number;
    likes_count?: number;
    comments_count?: number;
    is_negotiable?: boolean;
    is_sold?: boolean;
    specifications?: {
      brand?: string;
      model?: string;
      storage?: string;
      ram?: string;
      battery_health?: string;
      color?: string;
      accepts_exchange?: string | boolean;
      has_delivery?: string | boolean;
      is_store_product?: string | boolean;
      enable_cart?: string | boolean;
      seller_is_store?: string | boolean;
      store_name?: string;
      [key: string]: unknown;
    };
    product_images?: Array<{ image_url: string; position?: number | null }>;
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
  priority?: boolean;
};

function getTimeAgo(dateValue?: string) {
  if (!dateValue) return '';

  const createdAt = new Date(dateValue);
  if (Number.isNaN(createdAt.getTime())) return '';

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60_000),
  );

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} ي`;

  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} ش`;

  return `منذ ${Math.floor(months / 12)} سنة`;
}

function isTruthy(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return ['true', '1', 'yes', 'نعم'].includes(String(value).toLowerCase().trim());
}

export default function ProductCard({
  product,
  onFavoriteToggle,
  priority = false,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const images = productImageUrls(
    Array.isArray(product.product_images) ? product.product_images : [],
  ).filter((image) => !failedImages.includes(image));
  const href = `/mobiles/${product.slug}`;
  const title = [
    product.specifications?.brand,
    product.specifications?.model,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || product.name;
  const isSaudi = isSaudiMarketLocation(product.location);
  const timeAgo = getTimeAgo(product.created_at);
  const condition = product.condition?.trim() || 'مستعمل';
  const isNew = condition.includes('جديد') || /new/i.test(condition);
  const isLikeNew = condition.includes('كسر') || /like new/i.test(condition);
  const conditionClass = isNew
    ? 'from-[#059669] to-[#10b981]'
    : isLikeNew
      ? 'from-[#0d9488] to-[#14b8a6]'
      : 'from-[#475569] to-[#64748b]';

  const acceptsExchange = isTruthy(product.specifications?.accepts_exchange);
  const isStore =
    isTruthy(product.specifications?.is_store_product) ||
    isTruthy(product.specifications?.seller_is_store) ||
    isTruthy(product.specifications?.enable_cart);
  const isCart = isTruthy(product.specifications?.enable_cart);

  if (!SAUDI_MARKET_ENABLED && isSaudi) return null;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const visualPosition = (event.clientX - bounds.left) / bounds.width;
    const nextIndex = Math.min(
      images.length - 1,
      Math.max(0, Math.floor((1 - visualPosition) * images.length)),
    );
    if (nextIndex !== currentImageIndex) {
      setCurrentImageIndex(nextIndex);
    }
  };

  return (
    <article className="app-product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#edf0ee] bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#bbf7d0] hover:shadow-[0_16px_34px_-12px_rgba(7,148,71,0.18)] dark:border-[#282e34] dark:bg-[#181d21] dark:hover:border-[#079447]/50 dark:hover:shadow-[0_16px_34px_-12px_rgba(0,0,0,0.5)]">
      {/* Top Right: Favorite Button */}
      <div className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3">
        <FavoriteButton
          productId={product.id}
          onToggle={onFavoriteToggle}
          className="!h-9 !w-9 !border-white/30 !bg-black/20 !backdrop-blur-md !shadow-sm transition hover:scale-110 sm:!h-10 sm:!w-10"
        />
      </div>

      {/* Top Left: Badges Stack */}
      <div className="absolute left-2 top-2 z-30 flex flex-col items-start gap-1 sm:left-3 sm:top-3">
        <span className={`inline-flex items-center gap-1 rounded-xl bg-gradient-to-r ${conditionClass} px-2.5 py-1 text-[9.5px] font-black text-white shadow-md backdrop-blur-sm`}>
          {isLikeNew ? '✦' : isNew ? '★' : '◷'}
          {condition}
        </span>
        {isStore && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
            🏅 موثوق
          </span>
        )}
        {isCart && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-[#00a86b] px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
            🛒 سلة
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link href={href} className="block overflow-hidden">
        <div
          className="relative aspect-[1/1] w-full overflow-hidden bg-[#f4f6f5] dark:bg-[#111417] sm:aspect-[1/1.04]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCurrentImageIndex(0)}
        >
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex] ?? images[0]}
                alt={`${title} ${condition} للبيع في ${product.location} - ${product.price > 0 ? `${product.price.toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')} ${isSaudi ? 'ر.س' : 'ج.م'}` : 'سعر عند التواصل'}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                onError={() => {
                  const failed = images[currentImageIndex] ?? images[0];
                  if (failed) setFailedImages((current) => [...new Set([...current, failed])]);
                }}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ objectFit: 'cover' }}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-[#aab0b4]">📱</div>
          )}

          {/* Sold Out Badge */}
          {product.is_sold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <span className="-rotate-6 rounded-xl border-[3px] border-[#ff1744] bg-[#ff1744]/15 px-5 py-2 text-xl font-black text-[#ff1744] shadow-lg">
                تم البيع
              </span>
            </div>
          )}

          {/* Time Ago Badge */}
          {timeAgo && (
            <span suppressHydrationWarning className="absolute bottom-2 right-2 z-20 rounded-lg bg-black/55 px-2 py-0.5 text-[8.5px] font-black text-white/95 backdrop-blur-md">
              {timeAgo}
            </span>
          )}

          {/* Image Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-md">
              {images.slice(0, 5).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'h-1.5 w-3.5 bg-white'
                      : 'h-1.5 w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5 md:p-4">
        <Link href={href} className="block">
          {/* Title */}
          <h3 className="line-clamp-2 text-[13px] font-black leading-snug text-[#1f2326] transition group-hover:text-[#079447] dark:text-[#f3f4f6] md:text-[14.5px]">
            {title}
          </h3>

          {/* Price & Negotiable */}
          <div className="mt-2 flex min-w-0 items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-[17px] font-black tracking-tight text-[#079447] dark:text-[#4ade80] md:text-[19px]">
              {product.price > 0
                ? `${Number(product.price).toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')} ${isSaudi ? 'ر.س' : 'ج.م'}`
                : 'السعر عند التواصل'}
            </p>
            {product.is_negotiable && product.price > 0 && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                تفاوض
              </span>
            )}
          </div>

          {/* Specifications Pills (Storage / RAM / Exchange) */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isStore && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/40 bg-[#fffbeb] px-2 py-0.5 text-[8.5px] font-black text-[#b45309] dark:border-amber-500/20 dark:bg-[#2c2211] dark:text-[#fcd34d]">
                متجر معتمد
              </span>
            )}
            {product.specifications?.storage && (
              <span className="inline-flex rounded-md bg-[#f1f3f2] px-1.5 py-0.5 text-[8.5px] font-bold text-[#555d61] dark:bg-[#23292e] dark:text-[#c4cbd0]">
                {String(product.specifications.storage)}
              </span>
            )}
            {acceptsExchange && (
              <span className="inline-flex rounded-md bg-[#edf9f1] px-1.5 py-0.5 text-[8.5px] font-black text-[#087d3d] dark:bg-[#153221] dark:text-[#57d98c]">
                يقبل البدل
              </span>
            )}
          </div>

          {/* Location */}
          <div className="mt-2.5 flex min-w-0 items-center gap-1 text-[#6b7280] dark:text-[#9ca3af]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#079447]" />
            <span className="truncate text-[10px] font-bold md:text-[11px]">
              {product.location}
            </span>
          </div>
        </Link>

        {/* Card Footer: Views, Comments, Likes */}
        <div className="product-card-footer mt-auto flex items-center justify-between border-t border-[#f1f3f2] pt-2.5 dark:border-[#262c31] sm:gap-2">
          <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#9ca3af]">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black">{product.views_count ?? 0}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href={`${href}#comments`}
              aria-label="التعليقات"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f7f6] text-[#4b5563] transition hover:bg-[#e8ecea] hover:text-[#079447] dark:bg-[#22282d] dark:text-[#d1d5db] dark:hover:bg-[#2a3238] sm:h-9 sm:w-9"
            >
              <MessageSquare className="h-4 w-4" />
              {(product.comments_count ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1877f2] px-1 text-[7.5px] font-black text-white">
                  {(product.comments_count ?? 0) > 99
                    ? '99+'
                    : product.comments_count}
                </span>
              )}
            </Link>
            <ProductLikeButton
              productId={product.id}
              initialCount={product.likes_count ?? 0}
              compact
              className="!h-8 !min-w-8 !rounded-xl !bg-[#f5f7f6] !px-1.5 dark:!bg-[#22282d] sm:!h-9 sm:!min-w-9"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
