'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MapPin, Smartphone } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import ProductCard from '@/components/ProductCard';

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
            is_negotiable,
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onFavoriteToggle={(isFavorited) => {
                if (!isFavorited) {
                  handleRemove(product.id);
                }
              }}
            />
          ))}
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
