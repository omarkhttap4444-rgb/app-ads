'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  productId: string;
  className?: string;
};

export default function FavoriteButton({ productId, className = '' }: Props) {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Fetch user session & check favorite status
  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Query if this item is favorited
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
          .maybeSingle();
          
        if (!error && data) {
          setIsFavorited(true);
        }
      }
    };
    checkFavorite();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation if inside a Link component
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if unauthenticated
      router.push('/login');
      return;
    }

    if (loading) return;
    setLoading(true);

    const targetState = !isFavorited;
    setIsFavorited(targetState); // Optimistic update

    try {
      if (targetState) {
        // Insert favorite row
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          });
        if (error) {
          setIsFavorited(false); // Rollback on error
          console.error(error);
        }
      } else {
        // Delete favorite row
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) {
          setIsFavorited(true); // Rollback on error
          console.error(error);
        }
      }
    } catch (err) {
      console.error(err);
      setIsFavorited(!targetState); // Rollback
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className={`p-2 rounded-full bg-white/95 border border-slate-100 hover:bg-white shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Heart 
        className={`w-4 h-4 transition-colors ${
          isFavorited 
            ? 'fill-rose-500 text-rose-500 stroke-[2.5px]' 
            : 'text-slate-400 hover:text-slate-600 stroke-[1.8px]'
        }`} 
      />
    </button>
  );
}
