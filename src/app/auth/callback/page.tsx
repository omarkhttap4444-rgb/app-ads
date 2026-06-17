'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase handles the OAuth code exchange automatically via the URL hash/params.
    // We just need to listen for the session and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Ensure the user row exists in public.users (trigger should handle this,
          // but we do a safe upsert in case it didn't run yet)
          const { user } = session;
          await supabase.from('users').upsert(
            {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم',
              profile_image_url: user.user_metadata?.avatar_url || null,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
          router.replace('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 text-white" dir="rtl">
      {/* Animated logo */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-600/30 animate-pulse">
          <span className="text-2xl font-black">س</span>
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-teal-500/30 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-white">جاري تسجيل دخولك...</p>
        <p className="text-sm text-slate-400 mt-1">سيتم توجيهك تلقائياً خلال لحظات</p>
      </div>
      {/* Spinner */}
      <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
    </main>
  );
}
