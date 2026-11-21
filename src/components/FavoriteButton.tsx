'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserInteractions } from '@/lib/user-interactions-context';

type Props = {
  productId: string;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
};

export default function FavoriteButton({ productId, className = '', onToggle }: Props) {
  const router = useRouter();
  const { user, isFavorited: checkFavorited, setFavoriteLocal } = useUserInteractions();
  const isFavorited = checkFavorited(productId);

  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirectTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (loading) return;
    setLoading(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    const targetState = !isFavorited;
    setFavoriteLocal(productId, targetState);
    if (onToggle) onToggle(targetState);

    try {
      if (targetState) {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) {
          setFavoriteLocal(productId, false);
          console.error(error);
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) {
          setFavoriteLocal(productId, true);
          console.error(error);
        }
      }
    } catch (err) {
      console.error(err);
      setFavoriteLocal(productId, !targetState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/18 text-[#ff1744] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/28 active:scale-90 disabled:opacity-70 ${className}`}
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
