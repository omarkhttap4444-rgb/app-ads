import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { isRemoteMediaUrl } from '@/lib/media';
import { escapeXml, PRODUCT_SITEMAP_BATCH_SIZE, PRODUCT_SITEMAP_MARKET_FILTER } from '@/lib/sitemap';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const match = /^(0|[1-9]\d*)(?:\.xml)?$/.exec(id);
  const batchId = match ? Number(match[1]) : NaN;
  const from = batchId * PRODUCT_SITEMAP_BATCH_SIZE;
  const to = from + PRODUCT_SITEMAP_BATCH_SIZE - 1;
  if (!Number.isSafeInteger(to) || batchId < 0) {
    return new Response('Not found', { status: 404 });
  }

  const { data, error } = await supabase
    .from('products')
    .select('id,slug,last_updated,created_at,product_images(image_url)')
    .eq('is_sold', false)
    .not('slug', 'is', null)
    .neq('slug', '')
    .or(PRODUCT_SITEMAP_MARKET_FILTER)
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[products sitemap] fetch failed', error);
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }
  if (!data?.length) return new Response('Not found', { status: 404 });

  const seen = new Set<string>();
  const entries = data.flatMap((row) => {
    const slug = row.slug?.trim();
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    const modified = row.last_updated || row.created_at;
    const timestamp = modified ? Date.parse(modified) : NaN;
    const lastmod = Number.isFinite(timestamp)
      ? `\n    <lastmod>${new Date(timestamp).toISOString()}</lastmod>` : '';
    const images = [...new Set((row.product_images ?? [])
      .map((image) => image.image_url).filter(isRemoteMediaUrl).map((url) => url.trim()))]
      .slice(0, 1000);
    const imageTags = images.map((url) =>
      `\n    <image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join('');
    return [`  <url>\n    <loc>${escapeXml(`${SITE_URL}/mobiles/${encodeURIComponent(slug)}`)}</loc>${lastmod}${imageTags}\n  </url>`];
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
