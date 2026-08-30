import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;
const canonicalPath = '/help/check-used-phone';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: 'كيف تفحص موبايل مستعمل قبل الشراء | فحص عملي',
  description: 'فحص عملي لموبايل مستعمل: الشاشة والكاميرات والبطارية والشحن والشبكة والحساسات والتخزين وIMEI وأقفال الحساب.',
  alternates: { canonical: canonicalPath },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'كيف تفحص موبايل مستعمل قبل الشراء',
    description: 'قائمة فحص عملية خطوة بخطوة قبل دفع أي مبلغ.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1733, height: 909 }],
  },
  twitter: { card: 'summary_large_image', title: 'كيف تفحص موبايل مستعمل قبل الشراء', description: 'قائمة فحص عملية.', images: ['/og.png'] },
};

export default function CheckPhonePage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'فحص الموبايل', item: canonicalUrl },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'كيف تفحص موبايل مستعمل قبل الشراء',
    description: metadata.description as string,
    inLanguage: 'ar-EG',
    author: { '@type': 'Organization', name: 'سوق فون', url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: 'سوق فون', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } },
    mainEntityOfPage: canonicalUrl,
  };
  const checks = [
    { title: 'الهيكل الخارجي', points: ['افحص الفريم والظهر والعدسات لأي كسر أو فك.', 'تأكد أن الأزرار ثابتة وغير غائرة.'] },
    { title: 'الشاشة واللمس', points: ['افتح صفحة بيضاء وراقب أي بقع أو خطوط.', 'جرّب الكتابة والسحب في كل الزوايا.'] },
    { title: 'الكاميرات', points: ['صوّر بالخلفية والأمامية في إضاءة مختلفة.', 'جرّب الفيديو والتركيز التلقائي.'] },
    { title: 'البطارية', points: ['لاحظ نسبة البطارية قبل وبعد استخدام 10 دقائق.', 'لا تعتمد على رقم صحة البطارية وحده.'] },
    { title: 'الشحن', points: ['جرّب كابل وشاحن مختلفين، وتأكد أن الشحن يزيد بثبات.'] },
    { title: 'المكالمات والشبكة', points: ['ضع شريحتك وجرّب مكالمة وبيانات.', 'اختبر Wi-Fi وBluetooth.'] },
    { title: 'الحساسات والبصمة', points: ['جرّب بصمة الإصبع و Face ID بحسابك أنت.', 'اختبر حساس القرب أثناء المكالمة.'] },
    { title: 'التخزين', points: ['راجع المساحة المتاحة وتأكد أنها مطابقة للإعلان.'] },
    { title: 'الرقم التسلسلي و IMEI', points: ['قارن IMEI في الإعدادات مع العلبة إن وجدت.', 'تأكد من عدم وجود قفل تنشيط بحساب سابق.'] },
    { title: 'الملحقات والفاتورة', points: ['اسأل عن العلبة والشاحن الأصلي والفاتورة إن وجدت.'] },
  ];
  return (
    <main className="min-h-screen bg-[#f7f8f8] dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#7c858a]"><Link href="/" className="hover:text-[#078b43]">الرئيسية</Link><ChevronLeft className="h-3.5 w-3.5" /><span className="text-[#242628] dark:text-white">فحص الموبايل</span></nav>
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-8">
          <h1 className="text-2xl font-black text-[#242628] dark:text-white">كيف تفحص موبايل مستعمل قبل الشراء</h1>
          <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">خذ 10-15 دقيقة للفحص الهادئ. لا يوجد اختبار واحد يضمن كل شيء، لكن هذه القائمة تقلل المفاجآت.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((sec) => (
              <section key={sec.title} className="rounded-2xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
                <h2 className="text-sm font-black text-[#242628] dark:text-white">{sec.title}</h2>
                <ul className="mt-2 list-disc pr-5 text-sm leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  {sec.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-[#f0faf4] p-4 dark:bg-[#12261b]">
            <p className="text-sm font-black text-[#078b43] flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> تذكير: لا تحاول تجاوز قفل الجهاز. الجهاز المقفل قد لا يعمل معك.</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/help/buying-used-phone" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">دليل الشراء</Link>
            <Link href="/help/phone-safety" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">نصائح الأمان</Link>
            <Link href="/mobiles" className="rounded-full bg-[#078b43] px-4 py-2 text-xs font-black text-white">تصفح الموبايلات</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
