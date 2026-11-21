import { SITE_URL } from '@/lib/seo';
import { escapeXml } from '@/lib/sitemap';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('maintenance_centers_public')
    .select('id, updated_at')
    .order('is_featured_active', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('[maintenance sitemap] failed:', error.message);
  }

  const rows = (data ?? []) as Array<{ id: string; updated_at?: string | null }>;
  const urls = [
    `  <url>\n    <loc>${escapeXml(`${SITE_URL}/maintenance`)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ...rows
      .filter((r) => Boolean(r.id))
      .map((r) => {
        const loc = `${SITE_URL}/maintenance/${encodeURIComponent(r.id)}`;
        const lastmod = r.updated_at ? `\n    <lastmod>${escapeXml(new Date(r.updated_at).toISOString())}</lastmod>` : '';
        return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
