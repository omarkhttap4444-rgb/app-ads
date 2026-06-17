'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Key, 
  Timer, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';

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

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification states
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Timer Logic for OTP ──
  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
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

  // ── OTP input interaction handlers ──
  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-focus next box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedText.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (pastedText[i] !== undefined) {
          newOtp[i] = pastedText[i];
        }
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedText.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Focus on the first input box when switching to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // ── Google OAuth ──────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
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
      setError('فشل التسجيل بجوجل. حاول مرة أخرى.');
      setGoogleLoading(false);
    }
  };

  // ── Step 1: Submit signup form & send OTP ─────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate password length manually
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      setLoading(false);
      return;
    }

    try {
      // 1. Check if user already exists in public.users table (Pre-verification check)
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.error('Error pre-checking user email:', checkError);
      }

      if (existingUser) {
        setError('البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر');
        setLoading(false);
        return;
      }

      // 2. Register user using Supabase Auth (which automatically sends an OTP code if email confirmation is enabled)
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (signupError) {
        const msg = signupError.message.toLowerCase();
        if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
          setError('البريد الإلكتروني مسجل بالفعل في النظام. يرجى تسجيل الدخول');
        } else {
          setError(signupError.message);
        }
        setLoading(false);
        return;
      }

      // Check if user already exists (Supabase returns a fake user with empty identities for security)
      if (data?.user?.identities && data.user.identities.length === 0) {
        setError('البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.');
        setLoading(false);
        return;
      }

      // 3. Set OTP verification step
      setStep('verify');
      setSuccess('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: 'signup',
      });

      if (verifyError) {
        const msg = verifyError.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('otp_expired')) {
          setError('رمز التحقق منتهي الصلاحية - يرجى طلب رمز جديد');
        } else if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('incorrect')) {
          setError('رمز التحقق غير صحيح - يرجى التأكد من الرمز');
        } else if (msg.includes('too many')) {
          setError('محاولات كثيرة - يرجى الانتظار قليلاً ثم المحاولة مرة أخرى');
        } else {
          setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Just in case, update the profile name in public.users to match
        const { error: dbError } = await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', data.user.id);

        if (dbError) {
          console.error('Database user profile update error:', dbError);
        }

        setSuccess('تم تأكيد الحساب وتأكيد البريد الإلكتروني بنجاح! جاري توجيهك...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        setError('حدث خطأ غير متوقع أثناء تفعيل الحساب.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء عملية التحقق');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (resendError) {
        setError(resendError.message);
        setLoading(false);
        return;
      }

      setSuccess('تم إعادة إرسال رمز التحقق بنجاح');
      setOtp(Array(6).fill(''));
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إعادة إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-center p-4 py-12" dir="rtl">
      <div className="w-full max-w-lg">
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
            
            {step === 'signup' ? (
              <>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">إنشاء حساب جديد</h1>
                <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">سجل لتتمكن من البيع والشراء والتواصل</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">تأكيد البريد الإلكتروني</h1>
                <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">أدخل الرمز المكون من 6 أرقام المرسل لبريدك الإلكتروني</p>
              </>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/40 font-medium mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-4 rounded-2xl text-sm border border-teal-100 dark:border-teal-900/40 font-bold mb-5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {step === 'signup' ? (
            /* ─── STEP 1: Registration Form ─── */
            <>
              {/* Google Button (Temporarily Hidden) */}
              {/*
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60 mb-5"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm">{googleLoading ? 'جاري التوجيه...' : 'التسجيل السريع بحساب Google'}</span>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-xs text-slate-400 font-medium">أو سجل ببريدك الإلكتروني</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
              */}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">الاسم بالكامل</label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: أحمد محمد"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
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

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (6 أحرف على الأقل)"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                      required
                      dir="ltr"
                      className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري إنشاء الحساب...
                    </span>
                  ) : 'إنشاء حساب جديد'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                  سجل الدخول الآن
                </Link>
              </p>
            </>
          ) : (
            /* ─── STEP 2: OTP Verification Screen ─── */
            <>
              {/* Edit Email / Go back Button */}
              <button
                onClick={() => {
                  setStep('signup');
                  setSuccess(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline mb-6 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة وتعديل البيانات</span>
              </button>

              <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">لقد أرسلنا رمزاً مكوناً من 6 أرقام إلى: </span>
                <div className="font-bold text-slate-800 dark:text-white mt-1 break-all" dir="ltr">{email}</div>
              </div>

              {/* Countdown / Status Info Banner */}
              <div className="mb-6">
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

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                {/* 6 Digit Inputs */}
                <div className="space-y-2">
                  <label className="block text-center text-xs font-bold text-slate-500 dark:text-slate-400">رمز التحقق (OTP)</label>
                  <div className="flex justify-between gap-2.5 md:gap-3" dir="ltr">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className="w-11 h-14 md:w-14 md:h-16 text-center text-2xl font-black rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
                        required
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التحقق...
                    </span>
                  ) : 'تحقق من الرمز'}
                </button>
              </form>

              {/* Resend Action */}
              <div className="mt-8 text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">لم تصلك الرسالة؟ </span>
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                  className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  إعادة إرسال الرمز
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
