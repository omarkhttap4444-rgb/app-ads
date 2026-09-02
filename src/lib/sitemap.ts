import { saudiLocationPattern } from '@/lib/market-config';

// Stay below the API row limit; index and route must use identical batches.
export const PRODUCT_SITEMAP_BATCH_SIZE = 500;

// Apply the product page's market policy before pagination, retaining null locations.
export const PRODUCT_SITEMAP_MARKET_FILTER = `location.is.null,and(${saudiLocationPattern.source
  .split('|')
  .map((name) => `location.not.ilike.%${name}%`)
  .join(',')})`;

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
