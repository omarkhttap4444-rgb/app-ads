import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { isSaudiMarketLocation } from '@/lib/market-config';
import { isRemoteMediaUrl } from '@/lib/media';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export const BATCH_SIZE = 45000;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

type ProductRow = {
  id: string;
  slug: string | null;
  location: string | null;
  last_updated: string | null;
  updated_at: string | null;
  created_at: string | null;
  product_images: Array<{ image_url: string | null }> | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Support /sitemaps/products/0.xml where id may be "0.xml"
  const raw = id.replace(/\.xml$/i, '').trim();
  const batchId = Number.parseInt(raw, 10);

  if (!Number.isFinite(batchId) || batchId < 0) {
    return new Response('Invalid batch id', { status: 404 });
  }

  const from = batchId * BATCH_SIZE;
  const to = from + BATCH_SIZE - 1;

  // Fetch eligible products deterministically: is_sold=false, valid slug, ordered by last_updated desc
  // Then filter Egypt only and dedupe. Use range for non-overlapping batches.
  const { data, error } = await supabase
    .from('products')
    .select('id,slug,location,last_updated,updated_at,created_at,product_images(image_url)')
    .eq('is_sold', false)
    .not('slug', 'is', null)
    .neq('slug', '')
    .order('last_updated', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[products sitemap] fetch failed', error);
    return new Response('Internal Server Error', { status: 500 });
  }

  const rows = (data ?? []) as ProductRow[];

  // Filter Egypt only, valid non-empty slug, dedupe by slug
  const seen = new Set<string>();
  const eligible: Array<{ loc: string; lastmod: string; image: string | null }> = [];

  for (const row of rows) {
    const slug = row.slug?.trim();
    if (!slug) continue;
    if (isSaudiMarketLocation(row.location)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const lastmodRaw = row.last_updated || row.updated_at || row.created_at || new Date().toISOString();
    let lastmod: string;
    try {
      lastmod = new Date(lastmodRaw).toISOString();
    } catch {
      lastmod = new Date().toISOString();
    }

    const imageCandidate = (row.product_images ?? [])
      .map((img) => img.image_url)
      .find((url) => isRemoteMediaUrl(url)) as string | undefined;

    eligible.push({
      loc: `${SITE_URL}/mobiles/${encodeURIComponent(slug)}`,
      lastmod,
      image: imageCandidate ?? null,
    });
  }

  // If batch is entirely out of range, return 404 so index won't list empty
  if (rows.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const xmlEntries = eligible
    .map((entry) => {
      const imageTag = entry.image
        ? `\n    <image:image><image:loc>${escapeXml(entry.image)}</image:loc></image:image>`
        : '';
      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>${imageTag}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
