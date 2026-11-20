'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  mapStorefrontAuthError,
  validateStrongPassword,
} from '@/lib/password-policy';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const stripUrlTokens = () => {
      try {
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, '/reset-password');
        }
      } catch {
        // Ignore history restrictions
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        stripUrlTokens();
        setReady(true);
        setChecking(false);
      }
    });

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error: codeErr } =
            await supabase.auth.exchangeCodeForSession(code);
          if (!mounted) return;
          if (!codeErr) {
            stripUrlTokens();
            setReady(true);
            setChecking(false);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          stripUrlTokens();
          setReady(true);
        }
      } catch {
        // Stay not-ready and display invalid link prompt
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setSuccess(null);

    const policyErr = validateStrongPassword(password);
    if (policyErr) {
      setError(policyErr);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(mapStorefrontAuthError(updateErr, 'recovery'));
        setLoading(false);
        return;
      }

      // Invalidate any other sessions and force a clean sign-in with the new password
      await supabase.auth.signOut({ scope: 'others' }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});

      setSuccess('تم تحديث كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...');
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (err: unknown) {
      setError(mapStorefrontAuthError(err, 'recovery'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-center p-4 py-12"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="سوق فون"
                className="w-10 h-10 rounded-xl object-contain shadow-md"
              />
              <span className="text-2xl font-black text-teal-600 group-hover:text-teal-700 transition-colors">
                سوق <span className="text-slate-800 dark:text-white">فون</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              تعيين كلمة مرور جديدة
            </h1>
            <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">
              اختر كلمة مرور قوية لحماية حسابك
            </p>
          </div>

          {checking ? (
            <div className="text-center text-sm text-slate-500 py-6">
              جاري التحقق من جلسة الاستعادة...
            </div>
          ) : !ready ? (
            <div className="space-y-4 text-center">
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/40 font-medium">
                جلسة إعادة تعيين كلمة المرور غير صالحة أو منتهية الصلاحية. يرجى طلب رمز استعادة جديد.
              </div>
              <Link
                href="/forgot-password"
                className="block w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm"
              >
                طلب رمز استعادة جديد
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/40 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-4 rounded-2xl text-sm border border-teal-100 dark:border-teal-900/40 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (8 أحرف على الأقل — حروف وأرقام/رموز)"
                    required
                    dir="ltr"
                    className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    required
                    dir="ltr"
                    className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
              >
                {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور الجديدة'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
