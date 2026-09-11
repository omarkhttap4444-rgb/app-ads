import type { NextConfig } from "next";

// R2 public base URL (e.g. https://images.souqphone.com). Read at build time
// so `next/image` can optimize R2 files without a wide-open wildcard.
// Falls back to images.souqphone.com when the env var is not set.
function r2RemotePattern() {
  const raw =
    process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && url.hostname) {
      return { protocol: 'https' as const, hostname: url.hostname };
    }
  } catch {
    // ignore — fall through to the default below
  }
  return { protocol: 'https' as const, hostname: 'images.souqphone.com' };
}

const nextConfig: NextConfig = {
  images: {
    // Tight variant set tuned to the real product-card grid
    // (mobile 2-col ~180px, tablet 3-col ~240px, desktop 4-5 col ~230px).
    // Default Next.js ships 16 widths (8 deviceSizes + 8 imageSizes); every
    // distinct (width, quality) requested per source image counts as a Vercel
    // Image Optimization transformation, so keep this list small.
    // 9 widths total instead of 16.
    deviceSizes: [360, 640, 768, 1024, 1280],
    imageSizes: [96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    // Next 16 coerces any `quality` prop not listed here to the closest
    // entry (default allowlist is [75]). One quality per surface:
    // 70/65/60 cards+thumbs, 75 default, 80 product-detail gallery.
    qualities: [60, 65, 70, 75, 80],
    remotePatterns: [
      // Legacy product images (Supabase Storage) — must keep working.
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      // New product images (Cloudflare R2 via custom domain).
      r2RemotePattern(),
    ],
  },
};

export default nextConfig;
