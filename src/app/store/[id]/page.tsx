import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cache } from 'react';
import ProfileHeader from '@/components/ProfileHeader';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

const getStore = cache((id: string) =>
  supabase
    .from('public_profiles')
    .select(
      'id, user_id, name, profile_image_url, cover_image_url, bio, governorate, is_verified, is_store, subscription_type, followers_count, following_count, seller_rating, seller_ratings_count, created_at, glow_mode, updated_at, contact_phone, is_contact_phone_visible, phone, contact_whatsapp, is_contact_whatsapp_visible',
    )
    .eq('id', id)
    .single(),
);

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { data: store } = await getStore(params.id);

  if (!store) return { title: 'البائع غير موجود', robots: { index: false, follow: false } };

  const title = `إعلانات ${store.name}`;
  const description = store.bio || `تصفح الهواتف المعروضة للبيع من ${store.name} في ${store.governorate || 'مصر'}.`;
  const canonicalPath = `/store/${params.id}`;
  return {
    title,
    description: description.slice(0, 165),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'profile',
      images: [store.profile_image_url || '/og.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: [store.profile_image_url || '/og.png'] },
  };
}

export default async function StoreProfilePage(props: Props) {
  const params = await props.params;
  
  const { data: store } = await getStore(params.id);

  if (!store) notFound();

  const [{ data: products }, { data: statsRaw }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, location, condition, slug, created_at, views_count, likes_count, comments_count, is_negotiable, is_sold, product_images(image_url), specifications')
      .eq('seller_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('get_seller_public_stats', { p_user_id: params.id }),
  ]);

  const stats = (statsRaw ?? {}) as Record<string, any>;
  const sellerStats = {
    products: Number(stats.products ?? 0),
    sold_products: Number(stats.sold_products ?? 0),
    views: Number(stats.views ?? 0),
    likes: Number(stats.likes ?? 0),
    seller_rating: Number(stats.seller_rating ?? store.seller_rating ?? 0),
    seller_ratings_count: Number(stats.seller_ratings_count ?? store.seller_ratings_count ?? 0),
    followers: Number(stats.followers ?? store.followers_count ?? 0),
  };

  const storeUrl = absoluteUrl(`/store/${params.id}`);
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${storeUrl}#profile`,
    url: storeUrl,
    name: `إعلانات ${store.name}`,
    description: store.bio || `صفحة البائع ${store.name} على سوق فون.`,
    inLanguage: 'ar',
    mainEntity: {
      '@type': 'Person',
      '@id': `${storeUrl}#seller`,
      name: store.name,
      description: store.bio || undefined,
      image: store.profile_image_url || undefined,
      address: store.governorate
        ? { '@type': 'PostalAddress', addressRegion: store.governorate }
        : undefined,
    },
  };
  const listingsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `إعلانات ${store.name}`,
    numberOfItems: products?.length ?? 0,
    itemListElement: (products ?? []).slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: absoluteUrl(`/mobiles/${encodeURIComponent(product.slug)}`),
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] pb-20 transition-colors">
      <JsonLd data={profileJsonLd} />
      <JsonLd data={listingsJsonLd} />
      <ProfileHeader store={{ ...store, followers_count: sellerStats.followers, seller_rating: sellerStats.seller_rating, seller_ratings_count: sellerStats.seller_ratings_count } as any} productsCount={sellerStats.products} />
      {/* Seller public stats — same definitions as Flutter get_seller_public_stats */}
      <div className="container mx-auto px-4 max-w-7xl -mt-4 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 grid grid-cols-3 md:grid-cols-5 gap-3 text-center">
          <div><div className="text-lg font-black text-slate-800 dark:text-white">{sellerStats.sold_products}</div><div className="text-xs text-slate-400 font-semibold">مبيعاتي</div></div>
          <div><div className="text-lg font-black text-slate-800 dark:text-white">{sellerStats.products}</div><div className="text-xs text-slate-400 font-semibold">إعلاناتي</div></div>
          <div><div className="text-lg font-black text-slate-800 dark:text-white">{sellerStats.views}</div><div className="text-xs text-slate-400 font-semibold">المشاهدات</div></div>
          <div><div className="text-lg font-black text-slate-800 dark:text-white">{sellerStats.likes}</div><div className="text-xs text-slate-400 font-semibold">الإعجابات</div></div>
          <div><div className="text-lg font-black text-slate-800 dark:text-white">{sellerStats.seller_ratings_count > 0 ? `${sellerStats.seller_rating.toFixed(1)} (${sellerStats.seller_ratings_count})` : '0'}</div><div className="text-xs text-slate-400 font-semibold">تقييمي</div></div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="mt-10">
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-ocean-500 rounded-full"></span>
            إعلانات البائع النَشِطة
            {products && products.length > 0 && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{products.length}</span>
            )}
          </h2>

          <div className="product-card-grid">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {(!products || products.length === 0) && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">لا توجد إعلانات نشطة حالياً</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
