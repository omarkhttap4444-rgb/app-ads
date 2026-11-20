'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { safeInternalRedirect } from '@/lib/safe-redirect';

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'recovery',
  'email',
  'invite',
  'email_change',
]);

export default function AuthConfirmPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const rawType = params.get('type') as EmailOtpType | null;
        const code = params.get('code');
        const nextPath = safeInternalRedirect(params.get('next'));

        if (tokenHash && rawType && ALLOWED_OTP_TYPES.has(rawType)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: rawType,
          });
          if (!mounted) return;
          if (error) {
            setErrorMsg('رابط التحقق غير صالح أو منتهي الصلاحية.');
            return;
          }
          if (rawType === 'recovery') {
            router.replace('/reset-password');
          } else {
            router.replace(nextPath);
          }
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!mounted) return;
          if (error) {
            setErrorMsg('رابط التحقق غير صالح أو منتهي الصلاحية.');
            return;
          }
          if (rawType === 'recovery') {
            router.replace('/reset-password');
          } else {
            router.replace(nextPath);
          }
          return;
        }

        setErrorMsg('رابط التحقق غير مكتمل أو منتهي الصلاحية.');
      } catch {
        if (mounted) {
          setErrorMsg('تعذر التحقق من الرابط. يرجى طلب رابط أو رمز جديد.');
        }
      }
    })();

    return () => {
      mounted = false;
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
          <div className="flex flex-col gap-2">
            <Link
              href="/forgot-password"
              className="inline-block w-full rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 text-sm transition-colors"
            >
              طلب رمز استعادة جديد
            </Link>
            <Link
              href="/login"
              className="inline-block w-full rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold py-3 text-sm transition-colors"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-base font-bold text-white">جاري التحقق من الرابط...</p>
        </>
      )}
    </main>
  );
}
