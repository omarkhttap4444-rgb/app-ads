'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MapPin, Smartphone } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

export default function FavoritesPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Check user auth
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/favorites');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  // 2. Fetch favorited products
  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products (
            id,
            name,
            price,
            location,
            condition,
            slug,
            specifications,
            product_images (image_url)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else if (data) {
        // Map data to extract product records
        const resolvedProducts = data
          .map((item: any) => item.products)
          .filter((p: any) => p !== null);
        setProducts(resolvedProducts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Handle local removal from lists
  const handleRemove = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        جاري تحميل المفضلة...
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 py-8 md:py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Title */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex items-center justify-between transition-colors">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500 dark:fill-rose-950/20 stroke-[2px] animate-pulse" />
              قائمة المفضلة
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">الهواتف والإعلانات التي قمت بحفظها للرجوع إليها لاحقاً</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const brand = product.specifications?.brand || '';
            const model = product.specifications?.model || '';
            const images = product.product_images?.map((i: any) => i.image_url) || [];
            const mainImg = images[0] || '/placeholder-mobile.png';

            return (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden group flex flex-col relative"
              >
                {/* Custom FavoriteButton wrapper that listens for updates */}
                <div onClick={() => handleRemove(product.id)} className="absolute top-4 left-4 z-20">
                  <FavoriteButton productId={product.id} />
                </div>

                <Link href={`/mobiles/${product.slug}`} className="flex flex-col flex-1">
                  {/* Image */}
                  <div className="aspect-square relative bg-white dark:bg-slate-950 border-b border-slate-50/50 dark:border-slate-850/50 p-6 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={mainImg} 
                      alt={product.name} 
                      className="object-contain w-full h-full max-h-[180px] group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 right-4 bg-teal-55 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-900/50 shadow-sm">
                      {product.condition}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/20 dark:to-slate-900/20">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base line-clamp-1 mb-2.5 group-hover:text-teal-600 dark:group-hover:text-teal-450 transition-colors">
                      {brand || model ? `${brand} ${model}`.trim() : product.name}
                    </h3>
                    
                    <div className="text-teal-600 dark:text-teal-400 font-black text-xl mb-4 flex items-baseline gap-1">
                      {product.price.toLocaleString('ar-EG')} 
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">جنيه</span>
                    </div>
                    
                    <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{product.location}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-slate-400 transition-colors">
            <span className="text-5xl block mb-4">❤️</span>
            <p className="text-lg font-bold text-slate-755 dark:text-slate-300">قائمة المفضلة فارغة</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">تصفح الهواتف وأضف الإعلانات التي تعجبك لتظهر هنا</p>
            <Link 
              href="/mobiles" 
              className="inline-block mt-6 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md shadow-teal-600/10 transition-all"
            >
              تصفح الهواتف الآن
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
