import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

// Revalidate the sitemap every hour to include new products
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://souqphone.com';

  // Base pages
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/mobiles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Fetch all product slugs from Supabase
    // Using a high limit to ensure we get products, in production you might paginate if > 10,000
    const { data: products } = await supabase
      .from('products')
      .select('slug, last_updated')
      .order('last_updated', { ascending: false })
      .limit(5000);

    if (products) {
      const productRoutes = products.map((product) => ({
        url: `${baseUrl}/mobiles/${product.slug}`,
        lastModified: new Date(product.last_updated),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));

      return [...routes, ...productRoutes];
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
