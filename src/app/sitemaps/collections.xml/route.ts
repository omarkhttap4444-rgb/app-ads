import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { isSaudiMarketLocation } from '@/lib/market-config';
import {
  buildMobilesLandingPath,
  EGYPT_GOVERNORATES,
  isKnownSeoBrand,
  SEO_BRANDS,
} from '@/lib/seo-content';

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

type ProductBrandLocationRow = {
  location: string | null;
  specifications: { brand?: string | null } | null;
};

export async function GET() {
  const urls: string[] = [];

  const addUrl = (path: string) => {
    const absolute = `${SITE_URL}${path}`;
    // Exclude Saudi URLs — collections.xml is Egypt only
    if (absolute.includes('country=SA') || absolute.includes('%53%41')) return;
    urls.push(absolute);
  };

  // /mobiles (canonical Egypt landing)
  addUrl(buildMobilesLandingPath({}));

  // Valid SEO brands (Egypt only, no Saudi)
  for (const brand of SEO_BRANDS) {
    addUrl(buildMobilesLandingPath({ brand: brand.name }));
  }

  // Valid categories (is_active = true)
  try {
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    for (const cat of categories ?? []) {
      if (!cat.name) continue;
      addUrl(buildMobilesLandingPath({ category: cat.name }));
    }
  } catch (e) {
    console.error('[collections sitemap] categories fetch failed', e);
  }

  // Single Egypt-only aggregation (no N+1):
  // - Governorates only if active unsold count >= 1 (avoids thin 0-product pages)
  // - Brand+Location only if active unsold count >= 3
  try {
    const governorateCounts = new Map<string, number>();
    const brandLocationCounts = new Map<string, number>();

    // Load products to aggregate — max 45000 handled via pagination
    const pageSize = 1000;
    const maxProducts = 45000;
    for (let from = 0; from < maxProducts; from += pageSize) {
      const { data, error } = await supabase
        .from('products')
        .select('location,specifications')
        .eq('is_sold', false)
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const page = (data ?? []) as ProductBrandLocationRow[];
      if (page.length === 0) break;

      for (const p of page) {
        if (isSaudiMarketLocation(p.location)) continue;
        const gov = EGYPT_GOVERNORATES.find((g) => p.location?.startsWith(g));
        if (!gov) continue;
        governorateCounts.set(gov, (governorateCounts.get(gov) ?? 0) + 1);
        const brand = (p.specifications as { brand?: string | null } | null)?.brand ?? null;
        if (!brand || !isKnownSeoBrand(brand)) continue;
        const key = `${brand}||${gov}`;
        brandLocationCounts.set(key, (brandLocationCounts.get(key) ?? 0) + 1);
      }

      if (page.length < pageSize) break;
    }

    // Emit Egypt governorates in canonical order only when they have active listings
    for (const gov of EGYPT_GOVERNORATES) {
      if ((governorateCounts.get(gov) ?? 0) >= 1) {
        addUrl(buildMobilesLandingPath({ location: gov }));
      }
    }

    for (const [key, count] of brandLocationCounts) {
      if (count >= 3) {
        const [brand, location] = key.split('||');
        addUrl(buildMobilesLandingPath({ brand, location }));
      }
    }
  } catch (e) {
    console.error('[collections sitemap] governorate/brand+location aggregation failed', e);
    // Safe fallback to top populated Egypt governorates if aggregation fails
    for (const gov of ['القاهرة', 'الجيزة', 'الإسكندرية']) {
      addUrl(buildMobilesLandingPath({ location: gov }));
    }
  }

  // Deduplicate and exclude invalid / thin combos already handled
  // Also exclude: q, sort, condition, 3-facet, Saudi (already excluded)
  const uniqueUrls = [...new Set(urls)];

  const xmlEntries = uniqueUrls
    .map(
      (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
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
