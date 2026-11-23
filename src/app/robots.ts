import type { MetadataRoute } from 'next';

import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/chat',
          '/favorites',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/profile$',
          '/notifications',
          '/mobiles/add',
          '/mobiles?*q=*',
          '/mobiles?*sort=*',
          ...(SAUDI_MARKET_ENABLED ? [] : ['/mobiles?*country=SA*']),
        ],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
