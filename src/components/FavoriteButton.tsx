'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  productId: string;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
};

export default function FavoriteButton({ productId, className = '', onToggle }: Props) {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
          .maybeSingle();
        if (!error && data) setIsFavorited(true);
      }
    };
    checkFavorite();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (loading) return;
    setLoading(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    const targetState = !isFavorited;
    setIsFavorited(targetState);
    if (onToggle) onToggle(targetState);

    try {
      if (targetState) {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) { setIsFavorited(false); console.error(error); }
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) { setIsFavorited(true); console.error(error); }
      }
    } catch (err) {
      console.error(err);
      setIsFavorited(!targetState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className={`w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:shadow-md border border-slate-100/50 dark:border-slate-700/50 active:scale-90 transition-all cursor-pointer ${className}`}
      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Heart 
        className={`w-4 h-4 transition-all ${animating ? 'animate-heartBeat' : ''} ${
          isFavorited 
            ? 'fill-rose-500 text-rose-500' 
            : 'text-slate-400 dark:text-slate-500 hover:text-rose-400'
        }`} 
      />
    </button>
  );
}
