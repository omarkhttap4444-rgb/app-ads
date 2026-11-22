'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import {
  BatteryCharging,
  Camera,
  Eye,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';

import FavoriteButton from './FavoriteButton';
import ProductLikeButton from './ProductLikeButton';
import { productImageUrls } from '@/lib/product-images';
import { isSaudiMarketLocation, SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import type { DealAssessment } from '@/lib/market-deal-intelligence';

type ColorVariant = {
  name?: string;
  color_name?: string;
  hex?: string;
  color_hex?: string;
};

export type ProductCardProps = {
  product: {
    id: string;
    seller_id?: string | null;
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
      battery_health?: string | number;
      color?: string;
      old_price?: string | number;
      original_price?: string | number;
      accepts_exchange?: string | boolean;
      has_delivery?: string | boolean;
      warranty?: string;
      is_store_product?: string | boolean;
      enable_cart?: string | boolean;
      seller_is_store?: string | boolean;
      store_name?: string;
      color_variants?: ColorVariant[];
      colorVariants?: ColorVariant[];
      [key: string]: unknown;
    };
    product_images?: Array<{ image_url: string; position?: number | null }>;
  };
  onFavoriteToggle?: (isFavorited: boolean) => void;
  priority?: boolean;
  dealAssessment?: DealAssessment | null;
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

function parsePositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeColorHex(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) return trimmed;
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed}`;
  return null;
}

export default function ProductCard({
  product,
  onFavoriteToggle,
  priority = false,
  dealAssessment = null,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const images = productImageUrls(
    Array.isArray(product.product_images) ? product.product_images : [],
  ).filter((image) => !failedImages.includes(image));

  const specs = product.specifications ?? {};
  const href = `/mobiles/${product.slug}`;
  const title =
    [specs.brand, specs.model].filter(Boolean).join(' ').trim() || product.name;
  const isSaudi = isSaudiMarketLocation(product.location);
  const timeAgo = getTimeAgo(product.created_at);
  const condition = product.condition?.trim() || 'مستعمل';
  const isNew = condition.includes('جديد') || /new/i.test(condition);
  const isLikeNew = condition.includes('كسر') || /like new/i.test(condition);
  const conditionClass = isNew
    ? 'bg-emerald-600/95'
    : isLikeNew
      ? 'bg-teal-600/95'
      : 'bg-slate-700/90';

  const acceptsExchange = isTruthy(specs.accepts_exchange);
  const hasDelivery = isTruthy(specs.has_delivery);
  const isStore =
    isTruthy(specs.is_store_product) ||
    isTruthy(specs.seller_is_store) ||
    isTruthy(specs.enable_cart);
  const isCart = isTruthy(specs.enable_cart);

  const price = Number(product.price ?? 0);
  const oldPrice = parsePositiveNumber(specs.old_price ?? specs.original_price);
  const discountPercent =
    oldPrice && price > 0 && oldPrice > price
      ? Math.min(90, Math.round(((oldPrice - price) / oldPrice) * 100))
      : null;

  const storage = specs.storage ? String(specs.storage).trim() : '';
  const ram = specs.ram ? String(specs.ram).trim() : '';
  const batteryRaw = parsePositiveNumber(specs.battery_health);
  const batteryHealth =
    batteryRaw && batteryRaw <= 100 ? `${Math.round(batteryRaw)}%` : '';

  const rawVariants = Array.isArray(specs.color_variants)
    ? specs.color_variants
    : Array.isArray(specs.colorVariants)
      ? specs.colorVariants
      : [];
  const colorSwatches = rawVariants
    .map((v) => ({
      hex: normalizeColorHex(v.hex ?? v.color_hex),
      name: (v.name ?? v.color_name ?? '').trim(),
    }))
    .filter((v): v is { hex: string; name: string } => Boolean(v.hex))
    .slice(0, 4);

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

  // Build up to 3 high-signal spec micro-pills (zero visual clutter)
  const specPills: Array<{ label: string; tone: 'neutral' | 'emerald' | 'sky'; icon?: 'battery' | 'truck' }> = [];
  if (storage) specPills.push({ label: storage, tone: 'neutral' });
  if (ram && specPills.length < 3) {
    specPills.push({
      label: /رام|ram/i.test(ram) ? ram : `${ram} رام`,
      tone: 'neutral',
    });
  }
  if (batteryHealth && specPills.length < 3) {
    specPills.push({ label: batteryHealth, tone: 'emerald', icon: 'battery' });
  }
  if (acceptsExchange && specPills.length < 3) {
    specPills.push({ label: 'يقبل البدل', tone: 'emerald' });
  }
  if (hasDelivery && specPills.length < 3) {
    specPills.push({ label: 'توصيل', tone: 'sky', icon: 'truck' });
  }

  return (
    <article className="app-product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#e9eeeb] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#86efac] hover:shadow-[0_18px_36px_-14px_rgba(7,148,71,0.2)] dark:border-[#262c31] dark:bg-[#171b1f] dark:hover:border-[#079447]/60 dark:hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.65)]">
      {/* Top Right: Favorite Button */}
      <div className="absolute right-2 top-2 z-30 sm:right-2.5 sm:top-2.5">
        <FavoriteButton
          productId={product.id}
          onToggle={onFavoriteToggle}
          className="!h-8 !w-8 !border-white/35 !bg-black/30 !backdrop-blur-md !shadow-sm transition hover:scale-110 sm:!h-9 sm:!w-9"
        />
      </div>

      {/* Top Left: Single Clean Condition Badge + Optional Discount */}
      <div className="absolute left-2 top-2 z-30 flex flex-col items-start gap-1 sm:left-2.5 sm:top-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-lg ${conditionClass} px-2 py-0.5 text-[9.5px] font-black text-white shadow-sm backdrop-blur-sm`}
        >
          {condition}
        </span>
        {discountPercent && (
          <span className="inline-flex items-center rounded-lg bg-rose-600 px-2 py-0.5 text-[9.5px] font-black text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
        {dealAssessment?.tier === 'hot_deal' && (
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-l from-[#059669] to-[#10b981] px-2 py-0.5 text-[9.5px] font-black text-white shadow-sm">
            🔥 لقطة -{dealAssessment.savingsPercent}%
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link href={href} className="block overflow-hidden">
        <div
          className="relative aspect-[1/1] w-full overflow-hidden bg-[#f4f6f5] dark:bg-[#101316]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCurrentImageIndex(0)}
        >
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex] ?? images[0]}
                alt={`${title} ${condition} للبيع في ${product.location} - ${price > 0 ? `${price.toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')} ${isSaudi ? 'ر.س' : 'ج.م'}` : 'سعر عند التواصل'}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                priority={priority}
                onError={() => {
                  const failed = images[currentImageIndex] ?? images[0];
                  if (failed) setFailedImages((current) => [...new Set([...current, failed])]);
                }}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-[#aab0b4]">📱</div>
          )}

          {/* Sold Out Overlay */}
          {product.is_sold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <span className="-rotate-6 rounded-xl border-[3px] border-[#ff1744] bg-[#ff1744]/15 px-5 py-2 text-lg font-black text-[#ff1744] shadow-lg">
                تم البيع
              </span>
            </div>
          )}

          {/* Bottom Right: Time Ago */}
          {timeAgo && (
            <span
              suppressHydrationWarning
              className="absolute bottom-2 right-2 z-20 rounded-md bg-black/55 px-1.5 py-0.5 text-[8.5px] font-bold text-white/95 backdrop-blur-md"
            >
              {timeAgo}
            </span>
          )}

          {/* Bottom Left: Photo Count Indicator (clear on mobile & desktop) */}
          {images.length > 1 && (
            <span className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[8.5px] font-bold text-white/95 backdrop-blur-md">
              <Camera className="h-2.5 w-2.5" />
              {images.length}
            </span>
          )}

          {/* Hover Image Progress Dots */}
          {images.length > 1 && (
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-md sm:flex">
              {images.slice(0, 5).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'h-1.5 w-3 bg-white'
                      : 'h-1.5 w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <Link href={href} className="block flex-1">
          {/* Unified Store Trust Line (never duplicated) */}
          {isStore && (
            <div className="mb-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-black text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                متجر معتمد
              </span>
              {isCart && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <ShoppingCart className="h-2.5 w-2.5" />
                  طلب مباشر
                </span>
              )}
            </div>
          )}

          {/* Title (Uniform 2-line rhythm) */}
          <h3 className="min-h-[2.6em] line-clamp-2 text-[12.5px] font-black leading-snug text-[#1c2125] transition group-hover:text-[#079447] dark:text-[#f3f4f6] sm:text-[13.5px]">
            {title}
          </h3>

          {/* Price + Old Price + Negotiable */}
          <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <p className="truncate text-[16px] font-black tracking-tight text-[#079447] dark:text-[#4ade80] sm:text-[18px]">
                {price > 0
                  ? `${price.toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')} ${isSaudi ? 'ر.س' : 'ج.م'}`
                  : 'السعر عند التواصل'}
              </p>
              {oldPrice && price > 0 && oldPrice > price && (
                <span className="text-[10px] font-bold text-[#9ca3af] line-through">
                  {oldPrice.toLocaleString(isSaudi ? 'ar-SA' : 'ar-EG')}
                </span>
              )}
            </div>
            {product.is_negotiable && price > 0 && (
              <span className="shrink-0 rounded-full bg-amber-100/90 px-2 py-0.5 text-[8px] font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                تفاوض
              </span>
            )}
          </div>

          {/* Spec Micro-Pills (Storage / RAM / Battery / Exchange / Delivery) */}
          {specPills.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {specPills.map((pill, idx) => (
                <span
                  key={`${pill.label}-${idx}`}
                  className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold ${
                    pill.tone === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : pill.tone === 'sky'
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'bg-[#f1f4f3] text-[#4b5563] dark:bg-[#23292e] dark:text-[#cbd5e1]'
                  }`}
                >
                  {pill.icon === 'battery' && <BatteryCharging className="h-2.5 w-2.5" />}
                  {pill.icon === 'truck' && <Truck className="h-2.5 w-2.5" />}
                  {pill.label}
                </span>
              ))}
            </div>
          )}

          {/* Store Color Swatches */}
          {colorSwatches.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              {colorSwatches.map((swatch, idx) => (
                <span
                  key={`${swatch.hex}-${idx}`}
                  title={swatch.name || swatch.hex}
                  className="h-3 w-3 rounded-full border border-black/15 shadow-xs dark:border-white/25"
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
              {rawVariants.length > 4 && (
                <span className="text-[8.5px] font-bold text-[#6b7280] dark:text-[#9ca3af]">
                  +{rawVariants.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Location */}
          <div className="mt-2 flex min-w-0 items-center gap-1 text-[#6b7280] dark:text-[#9ca3af]">
            <MapPin className="h-3 w-3 shrink-0 text-[#079447]" />
            <span className="truncate text-[10px] font-bold sm:text-[10.5px]">
              {product.location}
            </span>
          </div>
        </Link>

        {/* Card Footer: Views, Comments, Likes */}
        <div className="product-card-footer mt-2.5 flex items-center justify-between border-t border-[#f0f3f1] pt-2 dark:border-[#242a2f]">
          <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#9ca3af]">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black">{product.views_count ?? 0}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`${href}#comments`}
              aria-label="التعليقات"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#f4f7f5] text-[#4b5563] transition hover:bg-[#e7eeea] hover:text-[#079447] dark:bg-[#22282d] dark:text-[#d1d5db] dark:hover:bg-[#2b3339]"
            >
              <MessageSquare className="h-3.5 w-3.5" />
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
              className="!h-8 !min-w-8 !rounded-xl !bg-[#f4f7f5] !px-1.5 dark:!bg-[#22282d]"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
