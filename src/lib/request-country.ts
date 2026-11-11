import 'server-only';

import { headers, cookies } from 'next/headers';
import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';

export type SupportedCountry = 'EG' | 'SA';

export async function getRequestCountry(
  explicitCountry?: string | null,
): Promise<SupportedCountry> {
  if (!SAUDI_MARKET_ENABLED) return 'EG';

  // 1. Explicit parameter takes highest priority
  const requested = explicitCountry?.trim().toUpperCase();
  if (requested === 'EG' || requested === 'SA') return requested;

  // 2. User preference saved in cookie
  try {
    const cookieStore = await cookies();
    const cookieCountry = cookieStore.get('user_country')?.value?.trim().toUpperCase();
    if (cookieCountry === 'EG' || cookieCountry === 'SA') {
      return cookieCountry;
    }
  } catch {
    // Non-blocking in static generation
  }

  // 3. IP geolocation headers from CDN / hosting
  try {
    const requestHeaders = await headers();
    const detectedCountry = [
      requestHeaders.get('x-vercel-ip-country'),
      requestHeaders.get('cf-ipcountry'),
      requestHeaders.get('cloudfront-viewer-country'),
      requestHeaders.get('x-country-code'),
      requestHeaders.get('geo-country'),
      requestHeaders.get('x-client-geo-country'),
    ]
      .find(Boolean)
      ?.trim()
      .toUpperCase();

    if (detectedCountry === 'SA') return 'SA';
  } catch {
    // Non-blocking
  }

  return 'EG';
}
