'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { safeInternalRedirect } from '@/lib/safe-redirect';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let completed = false;

    const finalizeSignIn = async (session: Session, targetPath: string) => {
      if (completed || !mounted) return;
      completed = true;

      try {
        await supabase.rpc('ensure_user_row');
      } catch {
        // Fallback to direct safe upsert below
      }

      const { user } = session;
      try {
        await supabase.from('users').upsert(
          {
            id: user.id,
            email: user.email,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'مستخدم',
            profile_image_url: user.user_metadata?.avatar_url || null,
          },
          { onConflict: 'id', ignoreDuplicates: true },
        );
      } catch {
        // Non-blocking if row already exists
      }

      if (mounted) {
        router.replace(targetPath);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error') || params.get('error_description');
    const code = params.get('code');
    const targetPath = safeInternalRedirect(
      params.get('next') ?? params.get('redirectTo'),
    );

    if (oauthError) {
      completed = true;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (oauthError) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        if (mounted && !completed) {
          completed = true;
          router.replace('/reset-password');
        }
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        await finalizeSignIn(session, targetPath);
      }
    });

    (async () => {
      try {
        if (oauthError) {
          if (mounted) {
            setErrorMsg('تعذر إتمام تسجيل الدخول. يرجى المحاولة مرة أخرى.');
          }
          return;
        }
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!mounted) return;
          if (error) {
            setErrorMsg('رابط تسجيل الدخول غير صالح أو منتهي الصلاحية.');
            return;
          }
          if (data.session) {
            await finalizeSignIn(data.session, targetPath);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          await finalizeSignIn(data.session, targetPath);
        }
      } catch {
        if (mounted) {
          setErrorMsg('تعذر التحقق من جلسة الدخول. يرجى المحاولة مرة أخرى.');
        }
      }
    })();

    const timeoutId = setTimeout(() => {
      if (mounted && !completed) {
        setErrorMsg('انتهت مهلة التحقق من الجلسة. يرجى تسجيل الدخول مرة أخرى.');
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 text-white p-4"
      dir="rtl"
    >
      {errorMsg ? (
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-4">
          <p className="text-base font-bold text-rose-400">{errorMsg}</p>
          <Link
            href="/login"
            className="inline-block w-full rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 text-sm transition-colors"
          >
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-600/30 animate-pulse">
              <span className="text-2xl font-black">س</span>
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-teal-500/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">جاري تسجيل دخولك...</p>
            <p className="text-sm text-slate-400 mt-1">
              سيتم توجيهك تلقائياً خلال لحظات
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </>
      )}
    </main>
  );
}
