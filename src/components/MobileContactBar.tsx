'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Phone, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

type Props = {
  sellerId: string;
  sellerName: string;
  sellerPhone: string | null;
  productId: string;
  productSlug: string;
  productName: string;
};

export default function MobileContactBar({
  sellerId,
  sellerName,
  sellerPhone,
  productId,
  productSlug,
  productName
}: Props) {
  const router = useRouter();
  const [loadingChat, setLoadingChat] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : '';
  // Ensure Egyptian phone numbers are formatted correctly for wa.me
  // Egyptian numbers usually start with 01 (e.g., 0123456789), wa.me needs country code (e.g. 20123456789)
  const whatsappPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('1') ? `20${cleanPhone}` : cleanPhone;

  const handleChat = async () => {
    setLoadingChat(true);
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/login?redirectTo=/mobiles/${encodeURIComponent(productSlug)}`);
        return;
      }

      if (session.user.id === sellerId) {
        setErrorMsg('هذا إعلانك الخاص');
        setLoadingChat(false);
        return;
      }

      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_other_user_id: sellerId,
        p_product_id: productId || null
      });

      if (error) throw error;

      if (conversationId) {
        router.push(`/chat?id=${conversationId}`);
      } else {
        throw new Error('فشل الحصول على معرّف المحادثة');
      }
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      setErrorMsg(err.message || 'فشل بدء المحادثة مع البائع.');
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3.5 flex flex-col gap-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
      
      {errorMsg && (
        <div className="text-[10px] text-rose-500 font-bold flex items-center justify-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex gap-2.5 w-full">
        {/* WhatsApp Button */}
        {cleanPhone && (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`مرحباً ${sellerName}، أنا مهتم بشراء جهازك المعروض في سوق فون: ${productName}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            {/* Simple WhatsApp SVG Icon */}
            <svg viewBox="0 0 448 512" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
            <span>واتساب</span>
          </a>
        )}

        {/* Chat Button */}
        <button
          onClick={handleChat}
          disabled={loadingChat}
          className="flex-1 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-md shadow-teal-600/10 cursor-pointer disabled:opacity-60"
        >
          {loadingChat ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
          <span>{loadingChat ? 'جاري الفتح...' : 'دردشة فورية'}</span>
        </button>

        {/* Call Button */}
        {cleanPhone && (
          <a
            href={`tel:${cleanPhone}`}
            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>اتصال هاتفي</span>
          </a>
        )}
      </div>
    </div>
  );
}
