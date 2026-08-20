'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MapPin,
  MessageSquare,
} from 'lucide-react';

import FavoriteButton from './FavoriteButton';
import ProductLikeButton from './ProductLikeButton';
import { isRemoteMediaUrl } from '@/lib/media';
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
    };
    product_images?: Array<{ image_url: string }>;
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
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
  if (minutes < 60) return `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;

  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;

  return `منذ ${Math.floor(months / 12)} سنة`;
}

function isTruthy(value: string | boolean | undefined) {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return ['true', '1', 'yes', 'نعم'].includes(value.toLowerCase());
}

export default function ProductCard({
  product,
  onFavoriteToggle,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const images = (Array.isArray(product.product_images)
    ? product.product_images
        .map((image) => image.image_url)
        .filter(isRemoteMediaUrl)
    : []).filter((image) => !failedImages.includes(image));
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
    ? 'from-[#218c38] to-[#43b953]'
    : isLikeNew
      ? 'from-[#008f83] to-[#22a99d]'
      : 'from-[#4f6971] to-[#6e858c]';
  const acceptsExchange = isTruthy(product.specifications?.accepts_exchange);

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
    <article className="app-product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#e7e9ec] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#cfe9da] dark:border-[#343434] dark:bg-[#1f1f1f] dark:hover:border-[#315d43]">
      <div className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3">
        <FavoriteButton
          productId={product.id}
          onToggle={onFavoriteToggle}
          className="!h-9 !w-9 !border-white/25 !bg-black/10 !shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_5px_14px_rgba(0,0,0,0.08)] sm:!h-11 sm:!w-11"
        />
      </div>

      <div className="absolute left-2 top-2 z-30 sm:left-3 sm:top-3">
        <span className={`inline-flex items-center gap-1 rounded-lg bg-gradient-to-r ${conditionClass} px-2.5 py-1 text-[9px] font-black text-white shadow-md`}>
          {isLikeNew ? '✦' : isNew ? '★' : '◷'}
          {condition}
        </span>
      </div>

      <Link href={href} className="block">
        <div
          className="relative aspect-[1/1.08] w-full overflow-hidden bg-[#f2f3f2] dark:bg-[#121212]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCurrentImageIndex(0)}
        >
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[currentImageIndex] ?? images[0]}
                alt={`${title} ${condition} للبيع في ${product.location}`}
                loading="lazy"
                onError={() => {
                  const failed = images[currentImageIndex] ?? images[0];
                  if (failed) setFailedImages((current) => [...new Set([...current, failed])]);
                }}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/8" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-[#aab0b4]">📱</div>
          )}

          {product.is_sold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55">
              <span className="-rotate-6 rounded-xl border-[3px] border-[#ff1744] px-5 py-2 text-xl font-black text-[#ff1744]">
                تم البيع
              </span>
            </div>
          )}

          {timeAgo && (
            <span suppressHydrationWarning className="absolute bottom-0 right-0 z-20 rounded-tl-lg bg-black/62 px-2.5 py-1.5 text-[9px] font-black text-white backdrop-blur-sm">
              {timeAgo}
            </span>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
              {images.slice(0, 6).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-full border border-white/40 transition-all ${index === currentImageIndex ? 'h-2.5 w-2.5 bg-white' : 'h-2 w-2 bg-white/65'}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3 sm:px-3.5 sm:pb-3 sm:pt-3.5 md:px-4">
        <Link href={href} className="block">
          <h3 className="truncate text-[13px] font-black leading-6 text-[#242628] transition group-hover:text-[#078d45] dark:text-[#f1f1f1] md:text-[15px]">
            {title}
          </h3>

          <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[16px] font-black leading-none text-[#079447] dark:text-[#53d889] md:text-[18px]">
              {product.price > 0
                ? `${product.price.toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')} ${isSaudi ? 'ر.س' : 'ج.م'}`
                : 'السعر عند التواصل'}
            </p>
            {product.is_negotiable && product.price > 0 && (
              <span className="shrink-0 rounded-full bg-[#ffe68a] px-2 py-1 text-[8px] font-black text-[#5a4300]">
                قابل للتفاوض
              </span>
            )}
          </div>

          {acceptsExchange && (
            <span className="mt-1.5 inline-flex rounded-md bg-[#edf9f1] px-2 py-0.5 text-[8px] font-black text-[#087d3d] dark:bg-[#153221] dark:text-[#57d98c]">
              يقبل البدل
            </span>
          )}

          <div className="mt-2.5 flex min-w-0 items-center gap-1.5 text-[#5f6368] dark:text-[#c7c7c7]">
            <MapPin className="h-4 w-4 shrink-0 fill-current" />
            <span className="truncate text-[10px] font-bold md:text-[11px]">
              {product.location}
            </span>
          </div>
        </Link>

        <div className="product-card-footer mt-auto flex items-center justify-between gap-1.5 pt-3 sm:gap-2">
          <div className="product-card-stats flex items-center gap-1.5 text-[#5f6368] dark:text-[#c8c8c8] sm:gap-3">
            <span className="flex items-center gap-1 text-[10px] font-black">
              <Eye className="h-4 w-4" />
              {product.views_count ?? 0}
            </span>
          </div>

          <div className="product-card-actions flex items-center gap-1.5 sm:gap-2">
            <Link href={`${href}#comments`} aria-label="التعليقات" className="app-action-shadow relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#35383b] transition hover:text-[#079447] dark:bg-[#282828] dark:text-white sm:h-10 sm:w-10 sm:rounded-[14px]">
              <MessageSquare className="h-5 w-5" />
              {(product.comments_count ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1877f2] px-1 text-[7px] font-black text-white">
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
              className="!h-9 !min-w-9 !rounded-xl !px-1.5 sm:!h-10 sm:!min-w-10 sm:!rounded-[14px] sm:!px-2"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
