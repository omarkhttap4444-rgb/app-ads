'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Mail,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mapStorefrontAuthError } from '@/lib/password-policy';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const cleanEmail = email.trim().toLowerCase();
  const isValidEmail = EMAIL_REGEX.test(cleanEmail);

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || loading) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const siteUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://souqphone.com';

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${siteUrl}/reset-password`,
        },
      );

      if (resetErr) {
        const mapped = mapStorefrontAuthError(resetErr, 'recovery');
        if (mapped.includes('محاولات كثيرة') || mapped.includes('تعذر الاتصال')) {
          setError(mapped);
          setLoading(false);
          return;
        }
      }

      // Always transition with a neutral anti-enumeration message
      setStep('otp');
      setOtp(Array(6).fill(''));
      setSuccess(
        'إذا كان البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.',
      );
      startCountdown();
    } catch (err: unknown) {
      setError(mapStorefrontAuthError(err, 'recovery'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = cleanVal;
    setOtp(next);
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (digits.length > 0) {
      const next = [...otp];
      for (let i = 0; i < 6; i += 1) {
        if (digits[i] !== undefined) next[i] = digits[i];
      }
      setOtp(next);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'recovery',
      });

      if (verifyErr) {
        setError(mapStorefrontAuthError(verifyErr, 'otp'));
        setLoading(false);
        return;
      }

      setSuccess('تم التحقق من الرمز بنجاح! جاري تحويلك لتعيين كلمة المرور الجديدة...');
      router.replace('/reset-password');
    } catch (err: unknown) {
      setError(mapStorefrontAuthError(err, 'otp'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const siteUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://souqphone.com';

      const { error: resendErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${siteUrl}/reset-password`,
        },
      );

      if (resendErr) {
        const mapped = mapStorefrontAuthError(resendErr, 'recovery');
        if (mapped.includes('محاولات كثيرة') || mapped.includes('تعذر الاتصال')) {
          setError(mapped);
          setLoading(false);
          return;
        }
      }

      setOtp(Array(6).fill(''));
      setSuccess(
        'إذا كان البريد الإلكتروني مسجلاً لدينا، فقد تم إعادة إرسال رمز الاستعادة.',
      );
      startCountdown();
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
              استعادة كلمة المرور
            </h1>
            <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">
              {step === 'email'
                ? 'أدخل بريدك الإلكتروني لإرسال رمز التحقق'
                : 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني'}
            </p>
          </div>

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

          {step === 'email' ? (
            <form onSubmit={handleSendRecovery} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  البريد الإلكتروني
                </label>
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

              <button
                type="submit"
                disabled={loading || !isValidEmail}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز الاستعادة'}
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setSuccess(null);
                }}
                className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline mb-5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تعديل البريد الإلكتروني</span>
              </button>

              <div className="mb-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  البريد الإلكتروني:{' '}
                </span>
                <div
                  className="font-bold text-slate-800 dark:text-white mt-1 break-all"
                  dir="ltr"
                >
                  {cleanEmail}
                </div>
              </div>

              <div className="mb-5">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 py-2.5 px-4 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-xs font-bold">
                    <Timer className="w-4 h-4 animate-pulse" />
                    <span>يمكنك طلب رمز جديد بعد {countdown} ثانية</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 py-2.5 px-4 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>بإمكانك إعادة إرسال الرمز الآن</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex justify-between gap-2" dir="ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-14 text-center text-xl font-black rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                      required
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'جاري التحقق...' : 'تحقق ومتابعة'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  إعادة إرسال الرمز
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            تذكرت كلمة المرور؟{' '}
            <Link
              href="/login"
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
