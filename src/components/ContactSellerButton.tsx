'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MessageSquare, AlertCircle } from 'lucide-react';

type Props = {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  productId: string;
  productSlug: string;
};

export default function ContactSellerButton({
  sellerId,
  sellerName,
  sellerAvatar,
  productId,
  productSlug
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleContact = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login page and redirect back here after login
        router.push(`/login?redirectTo=/mobiles/${encodeURIComponent(productSlug)}`);
        return;
      }

      const currentUserId = session.user.id;

      // 2. Prevent messaging oneself
      if (currentUserId === sellerId) {
        setErrorMsg('لا يمكنك بدء محادثة مع نفسك (أنت صاحب هذا الإعلان)');
        setLoading(false);
        return;
      }

      // 3. Get or create conversation via RPC
      // Function signature: get_or_create_conversation(p_other_user_id, p_product_id?)
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_other_user_id: sellerId,
        p_product_id: productId || null
      });

      if (error) {
        console.error('RPC Error starting conversation:', error);
        setErrorMsg('فشل بدء المحادثة مع البائع. يرجى المحاولة لاحقاً.');
        setLoading(false);
        return;
      }

      if (conversationId) {
        // Redirect to chat room
        router.push(`/chat?id=${conversationId}`);
      } else {
        setErrorMsg('فشل الحصول على رقم المحادثة.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMsg('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mr-auto">
      <button 
        onClick={handleContact}
        disabled={loading}
        className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-70 transition-all text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-teal-200 hover:shadow-lg flex items-center gap-2 cursor-pointer text-sm"
      >
        <MessageSquare className="w-4 h-4" />
        {loading ? 'جاري الاتصال...' : 'تواصل مع البائع'}
      </button>

      {errorMsg && (
        <div className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1 max-w-[250px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
