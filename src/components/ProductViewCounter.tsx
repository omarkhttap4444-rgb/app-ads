'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

import { supabase } from '@/lib/supabase';

const recentViews = new Map<string, number>();

export default function ProductViewCounter({
  productId,
  initialCount = 0,
}: {
  productId: string;
  initialCount?: number;
}) {
  const [count, setCount] = useState(Math.max(0, initialCount));

  useEffect(() => {
    let active = true;
    const now = Date.now();
    const lastView = recentViews.get(productId) ?? 0;
    if (now - lastView < 2_000) return;
    recentViews.set(productId, now);

    const recordView = async () => {
      let viewerKey = `web-${crypto.randomUUID()}`;
      try {
        viewerKey = localStorage.getItem('souq_phone_viewer_key') || viewerKey;
        localStorage.setItem('souq_phone_viewer_key', viewerKey);
      } catch {
        // Storage can be unavailable in strict private-browsing modes.
      }

      const { error } = await supabase.rpc('increment_product_views', {
        p_product_id: productId,
        p_viewer_key: viewerKey,
      });

      if (error) {
        console.error('[views] Could not record product view:', error.message);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('views_count')
        .eq('id', productId)
        .single();
      if (active && typeof data?.views_count === 'number') setCount(data.views_count);
    };

    void recordView();
    return () => { active = false; };
  }, [productId]);

  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-[#666c70] dark:text-[#c8c8c8]">
      <Eye className="h-4 w-4" />
      {count.toLocaleString('ar-EG')} مشاهدة
    </span>
  );
}
