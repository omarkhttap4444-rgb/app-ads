import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export const BATCH_SIZE = 45000;

export async function GET() {
  const now = new Date().toISOString();

  // Dynamic product count — is_sold=false, valid slug, Egypt only
  let total = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_sold', false)
      .not('slug', 'is', null)
      .neq('slug', '');

    const saudiExcludes = [
      'السعودية%',
      'الرياض%',
      'جدة%',
      'مكة%',
      'المدينة المنورة%',
      'المنطقة الشرقية%',
      'القصيم%',
      'عسير%',
      'تبوك%',
      'حائل%',
      'الحدود الشمالية%',
      'جازان%',
      'نجران%',
      'الباحة%',
      'الجوف%',
      'الدمام%',
      'الخبر%',
    ];
    for (const pattern of saudiExcludes) {
      query = query.not('location', 'ilike', pattern);
    }

    const { count, error } = (await query) as { count: number | null; error: unknown };
    if (error) throw error;
    total = count ?? 0;
  } catch (e) {
    console.error('[sitemap index] count failed', e);
  }

  const batchCount = Math.ceil(total / BATCH_SIZE);

  const sitemaps: string[] = [
    `${SITE_URL}/sitemaps/static.xml`,
    `${SITE_URL}/sitemaps/collections.xml`,
  ];

  // Only list product sitemaps if there are eligible products — no empty entries
  for (let i = 0; i < batchCount; i++) {
    sitemaps.push(`${SITE_URL}/sitemaps/products/${i}.xml`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
