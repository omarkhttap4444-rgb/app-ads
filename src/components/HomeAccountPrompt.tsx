'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export default function HomeAccountPrompt() {
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsGuest(!data.session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsGuest(!session?.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isGuest) return null;

  return (
    <section className="mt-4 rounded-[28px] border-2 border-[#b8efcf] bg-white/94 p-4 shadow-[0_12px_35px_-24px_rgba(3,152,85,0.45)] dark:border-[#28543a] dark:bg-[#1f1f1f] md:mx-auto md:max-w-3xl md:p-5">
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <Link href="/login" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-[3px] border-[#078b43] bg-white px-3 text-sm font-black text-[#078b43] transition hover:bg-[#f3fff7] dark:bg-[#1f1f1f] dark:hover:bg-[#173323] md:text-base">
          <LogIn className="h-5 w-5" />
          تسجيل الدخول
        </Link>
        <Link href="/signup" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#078b43] px-3 text-sm font-black text-white shadow-[0_12px_24px_-12px_rgba(3,152,85,0.8)] transition hover:bg-[#06783a] md:text-base">
          <UserPlus className="h-5 w-5" />
          إنشاء حساب
        </Link>
      </div>
    </section>
  );
}
