'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Google OAuth ──────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const siteUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://souqphone.com';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      setError('فشل تسجيل الدخول بجوجل. حاول مرة أخرى.');
      setGoogleLoading(false);
    }
    // If successful, browser redirects — no need to reset loading
  };

  // ── Email / Password ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg =
        error.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : error.message;
      setError(msg);
    } else {
      setSuccess('تم تسجيل الدخول بنجاح! جاري توجيهك...');
      setTimeout(() => { window.location.href = redirectTo; }, 1200);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md" dir="rtl">
      {/* Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="سوق فون" className="w-10 h-10 rounded-xl object-contain shadow-md" />
            <span className="text-2xl font-black text-teal-600 group-hover:text-teal-700 transition-colors">
              سوق<span className="text-slate-800 dark:text-white">فون</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">تسجيل الدخول</h1>
          <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">مرحباً بك مجدداً في سوق فون</p>
        </div>

        {/* ── Google Button (Temporarily Hidden) ── */}
        {/*
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60 mb-5"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="text-sm">{googleLoading ? 'جاري التوجيه...' : 'المتابعة بحساب Google'}</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-xs text-slate-400 font-medium">أو</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </div>
        */}

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/40 font-medium mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-4 rounded-2xl text-sm border border-teal-100 dark:border-teal-900/40 font-bold mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                dir="ltr"
                className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الدخول...
              </span>
            ) : 'تسجيل الدخول بالبريد'}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          ليس لديك حساب؟{' '}
          <Link href="/signup" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-500 text-sm">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
