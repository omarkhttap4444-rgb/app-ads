import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import ProfileHeader from '@/components/ProfileHeader';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { data: store } = await supabase
    .from('users')
    .select('name, bio, governorate, profile_image_url')
    .eq('id', params.id)
    .single();

  if (!store) return { title: 'البائع غير موجود | سوق فون' };

  const title = `متجر ${store.name} | سوق فون`;
  const description = store.bio || `تصفح الهواتف المعروضة للبيع من ${store.name} في ${store.governorate || 'مصر'}.`;
  return {
    title, description,
    openGraph: { title, description, images: [store.profile_image_url || '/logo.png'] },
  };
}

export default async function StoreProfilePage(props: Props) {
  const params = await props.params;
  
  const { data: store } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!store) notFound();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, location, condition, slug, views_count, is_negotiable, product_images(image_url), specifications')
    .eq('seller_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] pb-20 transition-colors">
      <ProfileHeader store={store} productsCount={products?.length || 0} />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="mt-10">
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-ocean-500 rounded-full"></span>
            إعلانات البائع النَشِطة
            {products && products.length > 0 && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{products.length}</span>
            )}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
