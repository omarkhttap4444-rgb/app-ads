import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const now = new Date().toISOString();

  // Public indexable static URLs only — no auth/chat/admin/private
  const staticPaths: string[] = [
    '/',
    '/mobiles',
    '/help/buying-used-phone',
    '/help/selling-used-phone',
    '/help/check-used-phone',
    '/help/phone-safety',
    '/about',
  ];

  const urls = staticPaths.map((path) => ({
    loc: `${SITE_URL}${path}`,
    lastmod: now,
    changefreq: path === '/' ? 'daily' : 'hourly',
    priority: path === '/' ? '1.0' : '0.95',
  }));

  const xmlEntries = urls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
