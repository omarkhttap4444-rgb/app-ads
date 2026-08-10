'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Props = {
  productId: string;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
};

export default function FavoriteButton({ productId, className = '', onToggle }: Props) {
  const router = useRouter();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/18 text-[#ff1744] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/28 active:scale-90 ${className}`}
      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Heart 
        className={`h-6 w-6 stroke-[2.6px] transition-all ${animating ? 'animate-heartBeat' : ''} ${
          isFavorited 
            ? 'fill-[#ff1744] text-[#ff1744]'
            : 'text-[#ff1744] hover:fill-[#ff1744]/10'
        }`} 
      />
    </button>
  );
}
