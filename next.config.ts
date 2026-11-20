import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  },
];

const authNoStoreHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, private',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'images.souqphone.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/login',
        headers: authNoStoreHeaders,
      },
      {
        source: '/signup',
        headers: authNoStoreHeaders,
      },
      {
        source: '/forgot-password',
        headers: authNoStoreHeaders,
      },
      {
        source: '/reset-password',
        headers: authNoStoreHeaders,
      },
      {
        source: '/auth/:path*',
        headers: authNoStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
