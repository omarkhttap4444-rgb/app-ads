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

  // Public indexable static URLs only — no auth/chat/admin/private
  // Note: /maintenance is emitted in /sitemaps/maintenance.xml
  const staticEntries: Array<{ path: string; changefreq: string; priority: string }> = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/mobiles', changefreq: 'hourly', priority: '0.95' },
    { path: '/stores', changefreq: 'daily', priority: '0.9' },
    { path: '/help/buying-used-phone', changefreq: 'weekly', priority: '0.8' },
    { path: '/help/selling-used-phone', changefreq: 'weekly', priority: '0.8' },
    { path: '/help/check-used-phone', changefreq: 'weekly', priority: '0.8' },
    { path: '/help/phone-safety', changefreq: 'weekly', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.5' },
    { path: '/contact', changefreq: 'monthly', priority: '0.5' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
    { path: '/terms', changefreq: 'monthly', priority: '0.3' },
  ];

  const urls = staticEntries.map((entry) => ({
    loc: `${SITE_URL}${entry.path}`,
    changefreq: entry.changefreq,
    priority: entry.priority,
  }));

  const xmlEntries = urls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
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
