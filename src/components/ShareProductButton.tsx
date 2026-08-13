'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export default function ShareProductButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const data = { title, text: `شاهد ${title} على سوق فون`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1_500);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('[share] Could not share product:', error);
    }
  };

  return (
    <button type="button" onClick={share} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e3e7e5] px-4 py-2.5 text-xs font-black text-[#4f555a] transition hover:text-[#078b43] active:scale-95 dark:border-[#3a3a3a] dark:text-[#d0d0d0]">
      {copied ? <Check className="h-5 w-5 text-[#078b43]" /> : <Share2 className="h-5 w-5" />}
      {copied ? 'تم النسخ' : 'مشاركة'}
    </button>
  );
}
