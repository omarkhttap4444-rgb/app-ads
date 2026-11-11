'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * مكون الكشف التلقائي عن الدولة حسب الـ IP:
 * - إذا كان الزائر يفتح الموقع لأول مرة (بدون ملف كوكيز محدد وبدون ?country=).
 * - يفحص الدولة تلقائياً عبر عنوان الـ IP من السيرفر ومزود الخدمة.
 * - إذا كان في السعودية: يتم تفعيل وضع السعودية وتحديث الصفحة تلقائياً لعرض منتجات ومتاجر السعودية.
 * - إذا اختار المستخدم دولة يدوياً: يتم احترام اختياره دائماً وعدم تغييره.
 */
export default function AutoCountryDetector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. إذا كان الكوكيز موجوداً بالفعل، احترم اختيار المستخدم
    const match = document.cookie.match(/user_country=(EG|SA)/i);
    if (match) return;

    // 2. إذا كان الرابط يحتوي على معيار دولة صريح
    const params = new URLSearchParams(window.location.search);
    if (params.has('country')) return;

    let cancelled = false;

    const detect = async () => {
      try {
        const res = await fetch('/api/country', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data.country === 'SA') {
          document.cookie = 'user_country=SA; path=/; max-age=31536000; SameSite=Lax';
          // إعادة التحديث فورا لعرض المنتجات السعودية
          router.refresh();
        } else if (data.country === 'EG') {
          document.cookie = 'user_country=EG; path=/; max-age=31536000; SameSite=Lax';
        }
      } catch {
        // Non-blocking
      }
    };

    void detect();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return null;
}

