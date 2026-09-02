import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Camera, Tag } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;
const canonicalPath = '/help/selling-used-phone';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: 'دليل بيع موبايل مستعمل في مصر | صور ووصف وسعر',
  description: 'كيف تبيع موبايلك المستعمل بسرعة وأمان: عنوان صادق، صور واضحة، وصف دقيق للعيوب، سعر واقعي، وتجهيز الجهاز وحماية بياناتك قبل التسليم.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: 'دليل بيع موبايل مستعمل في مصر',
    description: 'خطوات عملية لعرض موبايلك للبيع بشكل صادق وآمن.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1733, height: 909 }],
  },
  twitter: { card: 'summary_large_image', title: 'دليل بيع موبايل مستعمل في مصر', description: 'كيف تبيع موبايلك بسرعة وأمان.', images: ['/og.png'] },
};

export default function SellingGuidePage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'دليل البيع', item: canonicalUrl },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'دليل بيع موبايل مستعمل في مصر',
    description: metadata.description as string,
    inLanguage: 'ar-EG',
    author: { '@type': 'Organization', name: 'سوق فون', url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: 'سوق فون', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } },
    mainEntityOfPage: canonicalUrl,
  };
  return (
    <main className="min-h-screen bg-[#f7f8f8] dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#7c858a]"><Link href="/" className="hover:text-[#078b43]">الرئيسية</Link><ChevronLeft className="h-3.5 w-3.5" /><span className="text-[#242628] dark:text-white">دليل البيع</span></nav>
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-8">
          <h1 className="text-2xl font-black text-[#242628] dark:text-white">دليل بيع موبايل مستعمل في مصر</h1>
          <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">إعلان صادق وصور واضحة وسعر واقعي يختصر وقت البيع ويقلل النقاش. هذه خطوات عملية مجرّبة.</p>

          <h2 className="mt-8 flex items-center gap-2 text-base font-black text-[#242628] dark:text-white"><Tag className="h-4 w-4 text-[#078b43]" /> العنوان والوصف</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>اكتب الماركة والموديل والمساحة وحالة الجهاز في العنوان.</li>
            <li>اذكر العيوب بوضوح: خدوش، بطارية، كاميرا، أو أي صيانة سابقة.</li>
            <li>حدد الملحقات: علبة، شاحن، جراب، فاتورة إن وجدت.</li>
          </ul>

          <h2 className="mt-8 flex items-center gap-2 text-base font-black text-[#242628] dark:text-white"><Camera className="h-4 w-4 text-[#078b43]" /> الصور</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>صوّر في إضاءة جيدة، 3-4 صور: أمام، خلف، جوانب، والشاشة وهي مضاءة.</li>
            <li>أظهر أي خدش بوضوح بدل إخفائه.</li>
            <li>تجنب الفلاتر التي تغير لون الجهاز.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">التسعير والموقع والتواصل</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>قارن إعلانات مشابهة في نفس المحافظة وحدد سعرًا واقعيًا.</li>
            <li>اذكر محافظتك والمركز، وحدد هل تقبل البدل أو الشحن.</li>
            <li>رد بسرعة على الرسائل وكن واضحًا بخصوص التفاوض.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">قبل التسليم — حماية بياناتك</h2>
          <div className="mt-3 rounded-2xl border border-[#f0dfaa] bg-[#fffbef] p-4 dark:border-[#56491f] dark:bg-[#2b281d]">
            <ul className="list-disc pr-5 text-sm leading-7 text-[#6b5310] dark:text-[#ffe08a]">
              <li>انسخ صورك وجهات اتصالك إلى مكان آمن.</li>
              <li>احذف حساباتك (مثل حساب الجهاز) قبل إعادة الضبط.</li>
              <li>اعمل إعادة ضبط مصنع بعد إزالة الحسابات.</li>
              <li>لا تشارك رمز OTP أو كلمة مرور مع أي شخص.</li>
            </ul>
          </div>

          <div className="mt-6 rounded-2xl bg-[#f0faf4] p-4 dark:bg-[#12261b]">
            <p className="text-xs font-bold text-[#078b43] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> لا ترسل الجهاز أو الملحقات قبل استلام المقابل، وتجنب مشاركة بيانات حساسة.</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/mobiles/add" className="rounded-full bg-[#078b43] px-4 py-2 text-xs font-black text-white">انشر إعلانك الآن</Link>
            <Link href="/help/phone-safety" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">نصائح الأمان</Link>
            <Link href="/mobiles" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">تصفح الطلبات</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
