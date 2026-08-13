'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ThumbsUp } from 'lucide-react';

import { supabase } from '@/lib/supabase';

type Props = {
  productId: string;
  initialCount?: number;
  compact?: boolean;
  className?: string;
};

export default function ProductLikeButton({
  productId,
  initialCount = 0,
  compact = false,
  className = '',
}: Props) {
  const router = useRouter();
  const [count, setCount] = useState(Math.max(0, initialCount));
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.user) return;

      const { data } = await supabase
        .from('likes')
        .select('product_id')
        .eq('product_id', productId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (active) setIsLiked(Boolean(data));
    };

    void loadState();
    return () => { active = false; };
  }, [productId]);

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirectTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const nextLiked = !isLiked;
    const previousCount = count;
    setIsLiked(nextLiked);
    setCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setLoading(true);

    const { error } = await supabase.rpc('toggle_like', {
      p_product_id: productId,
      p_is_adding: nextLiked,
    });

    if (error) {
      console.error('[likes] Could not toggle product like:', error.message);
      setIsLiked(!nextLiked);
      setCount(previousCount);
    } else {
      const { data } = await supabase
        .from('products')
        .select('likes_count')
        .eq('id', productId)
        .single();
      if (typeof data?.likes_count === 'number') setCount(data.likes_count);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={isLiked}
      aria-label={isLiked ? 'إلغاء الإعجاب' : 'إعجاب بالمنتج'}
      title={isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
      className={`${compact ? 'app-action-shadow flex h-10 min-w-10 items-center justify-center gap-1 rounded-[14px] bg-white px-2 dark:bg-[#282828]' : 'flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-2.5'} ${isLiked ? 'border-[#b7efcf] bg-[#ecfdf3] text-[#078b43] dark:border-[#235c3a] dark:bg-[#173323] dark:text-[#54db8d]' : 'border-[#e3e7e5] text-[#4f555a] hover:text-[#078b43] dark:border-[#3a3a3a] dark:text-[#d0d0d0]'} cursor-pointer font-black transition active:scale-95 disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
      )}
      <span className={compact ? 'text-[9px]' : 'text-xs'}>{count}</span>
      {!compact && <span className="text-xs">إعجاب</span>}
    </button>
  );
}
