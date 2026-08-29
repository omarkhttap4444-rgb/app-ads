import type { MetadataRoute } from 'next';

import { getCategoryImageUrl } from '@/lib/category-images';
import { isRemoteMediaUrl } from '@/lib/media';
import { SITE_URL } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { isSaudiMarketLocation, SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import {
  buildMobilesLandingPath,
  EGYPT_GOVERNORATES,
  isKnownSeoBrand,
  SAUDI_REGIONS,
  SEO_BRANDS,
} from '@/lib/seo-content';

export const revalidate = 3600;

type ProductSitemapRow = {
  slug: string;
  seller_id: string;
  last_updated: string | null;
  location: string | null;
  specifications: { brand?: string | null } | null;
  product_images: Array<{ image_url: string | null }> | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/mobiles`, changeFrequency: 'hourly', priority: 0.95 },
    ...(SAUDI_MARKET_ENABLED
      ? [{ url: `${SITE_URL}/mobiles?country=SA`, changeFrequency: 'hourly' as const, priority: 0.85 }]
      : []),
  ];

  for (const brand of SEO_BRANDS) {
    routes.push({
      url: `${SITE_URL}${buildMobilesLandingPath({ brand: brand.name })}`,
      changeFrequency: 'daily',
      priority: 0.88,
      images: [`${SITE_URL}/brands/${brand.logo}`],
    });
    if (SAUDI_MARKET_ENABLED) {
      routes.push({
        url: `${SITE_URL}${buildMobilesLandingPath({ country: 'SA', brand: brand.name })}`,
        changeFrequency: 'daily',
        priority: 0.78,
        images: [`${SITE_URL}/brands/${brand.logo}`],
      });
    }
  }

  for (const location of EGYPT_GOVERNORATES) {
    routes.push({
      url: `${SITE_URL}${buildMobilesLandingPath({ location })}`,
      changeFrequency: 'daily',
      priority: 0.82,
    });
  }
  if (SAUDI_MARKET_ENABLED) {
    for (const location of SAUDI_REGIONS) {
      routes.push({
        url: `${SITE_URL}${buildMobilesLandingPath({ country: 'SA', location })}`,
        changeFrequency: 'daily',
        priority: 0.72,
      });
    }
  }

  try {
    const [{ data: categories }, products] = await Promise.all([
      supabase
        .from('categories')
        .select('name,icon_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      loadAllProducts(),
    ]);

    for (const category of categories ?? []) {
      const categoryImage = category.icon_url?.startsWith('http')
        ? category.icon_url
        : `${SITE_URL}${getCategoryImageUrl(category.name)}`;
      routes.push({
          url: `${SITE_URL}${buildMobilesLandingPath({ category: category.name })}`,
          changeFrequency: 'daily',
          priority: 0.88,
          images: [categoryImage],
        });
      if (SAUDI_MARKET_ENABLED) {
        routes.push({
          url: `${SITE_URL}${buildMobilesLandingPath({ country: 'SA', category: category.name })}`,
          changeFrequency: 'daily',
          priority: 0.78,
          images: [categoryImage],
        });
      }
    }

    const sellerIds = new Set<string>();
    for (const product of products) {
      if (!product.slug) continue;
      if (!SAUDI_MARKET_ENABLED && isSaudiMarketLocation(product.location)) continue;
      sellerIds.add(product.seller_id);
      routes.push({
        url: `${SITE_URL}/mobiles/${encodeURIComponent(product.slug)}`,
        lastModified: product.last_updated ? new Date(product.last_updated) : undefined,
        changeFrequency: 'daily',
        priority: 0.8,
        images: (product.product_images ?? [])
          .map((image) => image.image_url)
          .filter(isRemoteMediaUrl),
      });
    }

    for (const sellerId of sellerIds) {
      routes.push({
        url: `${SITE_URL}/store/${sellerId}`,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }

    // Phase 3: Brand+Location — only qualifying >=3, single aggregation (no N+1)
    const brandLocationCounts = new Map<string, number>();
    for (const p of products) {
      const b = (p.specifications as any)?.brand as string | undefined;
      if (!b || !isKnownSeoBrand(b)) continue;
      const locMatch = EGYPT_GOVERNORATES.find((gov) => p.location?.startsWith(gov));
      if (!locMatch) continue;
      const key = `${b}||${locMatch}`;
      brandLocationCounts.set(key, (brandLocationCounts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of brandLocationCounts) {
      if (count >= 3) {
        const [brand, location] = key.split('||');
        routes.push({
          url: `${SITE_URL}${buildMobilesLandingPath({ brand, location })}`,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap] Could not load all public URLs:', error);
  }

  return routes.slice(0, 50_000);
}

async function loadAllProducts() {
  const pageSize = 1_000;
  const maximumProducts = 45_000;
  const products: ProductSitemapRow[] = [];

  for (let from = 0; from < maximumProducts; from += pageSize) {
    const { data, error } = await supabase
      .from('products')
      .select('slug,seller_id,last_updated,location,specifications,product_images(image_url)')
      .eq('is_sold', false)
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('last_updated', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as ProductSitemapRow[];
    products.push(...page);
    if (page.length < pageSize) break;
  }

  return products;
}
