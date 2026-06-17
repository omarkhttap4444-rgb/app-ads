import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import ProfileHeader from '@/components/ProfileHeader';

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => {
              const brand = product.specifications?.brand || '';
              const model = product.specifications?.model || '';
              const images = product.product_images?.map((i: any) => i.image_url) || [];
              const mainImg = images[0] || '/placeholder-mobile.png';

              return (
                <div key={product.id} className="relative group">
                  {/* Heart icon button in top left corner */}
                  <div className="absolute top-4 left-4 z-20">
                    <FavoriteButton productId={product.id} />
                  </div>

                  <Link 
                    href={`/mobiles/${product.slug}`} 
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden group flex flex-col"
                  >
                    <div className="aspect-square relative bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-6 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={mainImg} 
                        alt={product.name} 
                        className="object-contain w-full h-full max-h-[180px] group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 right-4 bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-900/50 shadow-sm">
                        {product.condition}
                      </span>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-900/40">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base line-clamp-1 mb-2.5 group-hover:text-teal-600 dark:group-hover:text-teal-450 transition-colors">
                        {brand || model ? `${brand} ${model}`.trim() : product.name}
                      </h3>
                      
                      <div className="text-teal-600 dark:text-teal-400 font-black text-xl mb-4 flex items-baseline gap-1">
                        {product.price.toLocaleString('ar-EG')} 
                        <span className="text-xs font-semibold text-slate-400">جنيه</span>
                      </div>
                      
                      <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.location}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
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
