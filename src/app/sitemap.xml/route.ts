import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { escapeXml, PRODUCT_SITEMAP_BATCH_SIZE, PRODUCT_SITEMAP_MARKET_FILTER } from '@/lib/sitemap';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_sold', false)
    .not('slug', 'is', null)
    .neq('slug', '')
    .or(PRODUCT_SITEMAP_MARKET_FILTER);

  if (error || count === null) {
    console.error('[sitemap index] count failed', error);
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }

  const sitemaps = [
    `${SITE_URL}/sitemaps/static.xml`,
    `${SITE_URL}/sitemaps/collections.xml`,
    ...Array.from({ length: Math.ceil(count / PRODUCT_SITEMAP_BATCH_SIZE) },
      (_, i) => `${SITE_URL}/sitemaps/products/${i}.xml`),
  ];

  // Request time is not a content modification date.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
