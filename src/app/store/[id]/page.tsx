import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { MapPin, Calendar, CheckCircle, Star, Users, Briefcase } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

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

  const coverImage = store.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80';
  const profileImage = store.profile_image_url || '';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      {/* Store Header / Cover */}
      <div className="h-60 md:h-72 w-full relative bg-slate-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      {/* Profile Info Container */}
      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-8 transition-colors duration-200">
          
          {/* Avatar */}
          <div 
            className="w-32 h-32 md:w-36 md:h-36 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-black text-5xl flex items-center justify-center overflow-hidden shrink-0 bg-cover bg-center" 
            style={profileImage ? { backgroundImage: `url(${profileImage})` } : {}}
          >
            {!profileImage && store.name.charAt(0)}
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-right pt-2 md:pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
                  {store.name}
                  {store.is_verified && (
                    <span title="بائع موثق">
                      <CheckCircle className="w-6 h-6 text-teal-500 fill-teal-500" />
                    </span>
                  )}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm text-slate-400 font-medium">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                    <Briefcase className="w-3.5 h-3.5" />
                    {store.is_store ? 'متجر معتمد' : 'بائع مستقل'}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    عضو منذ {new Date(store.created_at).getFullYear()}
                  </span>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="flex gap-6 justify-center md:justify-end bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">{products?.length || 0}</div>
                  <div className="text-xs text-slate-400 font-semibold">إعلان</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">{store.followers_count || 0}</div>
                  <div className="text-xs text-slate-400 font-semibold">متابع</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-lg font-black text-amber-500 flex items-center gap-1 justify-center">
                    {store.seller_rating > 0 ? store.seller_rating : 'جديد'} 
                    <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">التقييم</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-w-3xl border-t border-slate-50 dark:border-slate-800 pt-6">
              {store.bio || 'لا يوجد نبذة تعريفية عن هذا البائع حتى الآن.'}
            </p>
          </div>
        </div>

        {/* Products Grid */}
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
