import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import ProfileHeader from '@/components/ProfileHeader';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

// SEO Metadata for the Store Profile
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  
  const { data: store } = await supabase
    .from('users')
    .select('name, bio, governorate, profile_image_url')
    .eq('id', params.id)
    .single();

  if (!store) {
    return { title: 'البائع غير موجود | سوق فون' };
  }

  const title = `متجر ${store.name} | سوق فون`;
  const description = store.bio || `تصفح الهواتف المعروضة للبيع من قبل ${store.name} في ${store.governorate || 'مصر'}.`;
  const image = store.profile_image_url || '/placeholder-avatar.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
  };
}

export default async function StoreProfilePage(props: Props) {
  const params = await props.params;
  
  // Fetch Store Info
  const { data: store } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!store) {
    notFound();
  }

  // Fetch Store Products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, location, condition, slug, product_images(image_url), specifications')
    .eq('seller_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      <ProfileHeader store={store} productsCount={products?.length || 0} />

      {/* Products Grid */}
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="mt-16">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2">
            <span className="bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 p-2 rounded-xl text-sm font-bold">📱</span> 
            إعلانات البائع النَشِطة
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {(!products || products.length === 0) && (
            <div className="text-center text-slate-400 dark:text-slate-555 py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-305">لا توجد إعلانات نشطة لهذا البائع حالياً</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
