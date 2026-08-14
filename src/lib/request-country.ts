import 'server-only';

import { headers } from 'next/headers';
import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';

export type SupportedCountry = 'EG' | 'SA';

export async function getRequestCountry(
  explicitCountry?: string | null,
): Promise<SupportedCountry> {
  if (!SAUDI_MARKET_ENABLED) return 'EG';

  const requested = explicitCountry?.trim().toUpperCase();
  if (requested === 'EG' || requested === 'SA') return requested;

  const requestHeaders = await headers();
  const detectedCountry = [
    requestHeaders.get('x-vercel-ip-country'),
    requestHeaders.get('cf-ipcountry'),
    requestHeaders.get('cloudfront-viewer-country'),
    requestHeaders.get('x-country-code'),
  ]
    .find(Boolean)
    ?.trim()
    .toUpperCase();

  return detectedCountry === 'SA' ? 'SA' : 'EG';
}
