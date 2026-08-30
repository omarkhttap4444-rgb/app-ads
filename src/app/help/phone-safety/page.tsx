import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;
const canonicalPath = '/help/phone-safety';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: 'نصائح الأمان عند شراء وبيع موبايل مستعمل',
  description: 'نصائح أمان لمقابلة البائع، الفحص قبل الدفع، تجنب الدفع المقدم المشبوه، حماية OTP وكلمات المرور، والتبليغ عن الإعلانات المخالفة.',
  alternates: { canonical: canonicalPath },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'نصائح الأمان عند شراء وبيع موبايل مستعمل',
    description: 'كيف تحافظ على أمانك عند الشراء والبيع في سوق الموبايلات.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1733, height: 909 }],
  },
  twitter: { card: 'summary_large_image', title: 'نصائح الأمان عند شراء وبيع موبايل مستعمل', description: 'أمان المقابلة والدفع والتواصل.', images: ['/og.png'] },
};

export default function SafetyPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'نصائح الأمان', item: canonicalUrl },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'نصائح الأمان عند شراء وبيع موبايل مستعمل',
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
        <nav className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#7c858a]"><Link href="/" className="hover:text-[#078b43]">الرئيسية</Link><ChevronLeft className="h-3.5 w-3.5" /><span className="text-[#242628] dark:text-white">نصائح الأمان</span></nav>
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-8">
          <h1 className="text-2xl font-black text-[#242628] dark:text-white">نصائح الأمان عند شراء وبيع موبايل مستعمل</h1>
          <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">هدفنا أن تتم الصفقة بهدوء وأمان. هذه نقاط عملية تساعدك تتجنب المواقف المزعجة.</p>

          <div className="mt-6 rounded-2xl bg-[#fff3f3] p-4 dark:bg-[#2b1d1d] border border-[#ffd1d1] dark:border-[#5a2a2a]">
            <p className="text-sm font-black text-[#9a2a2a] dark:text-[#ffb4b4] flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> لا تشارك رمز OTP أو كلمة مرور مع أي شخص، ولا تدفع مقدمًا قبل المعاينة.</p>
          </div>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">أثناء الترتيب للمقابلة</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>اختر مكانًا عامًا ومزدحمًا نهارًا، ويفضل وجود كاميرات.</li>
            <li>أخبر شخصًا تثق به بمكان ووقت المقابلة.</li>
            <li>لا تكشف بيانات شخصية غير ضرورية.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">الدفع والتواصل</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>افحص الجهاز أولًا، ثم ادفع. تجنب التحويل المسبق لشخص لا تعرفه.</li>
            <li>احذر رسائل تأكيد دفع مزيفة أو لقطات شاشة معدلة.</li>
            <li>استخدم التواصل داخل التطبيق عند الإمكان، واحتفظ بالمحادثات.</li>
            <li>لا تضغط روابط مشبوهة يدعي مرسلها أنها لتأكيد الدفع.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">حماية حسابك وبياناتك</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>لا تشارك كلمة مرور بريدك أو حساب الجهاز.</li>
            <li>عند البيع، احذف حسابك من الجهاز ثم اعمل إعادة ضبط مصنع.</li>
            <li>احذف الصور والملفات الحساسة قبل التسليم.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">ماذا تفعل إذا شككت؟</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>أوقف التواصل إذا شعرت بضغط للاستعجال أو طلب دفع غريب.</li>
            <li>بلّغ عن الإعلان أو المستخدم عبر أدوات الإبلاغ داخل التطبيق.</li>
            <li>احتفظ بالأدلة (محادثات، صور) إن احتجت للمراجعة.</li>
          </ul>

          <div className="mt-8 rounded-2xl bg-[#f0faf4] p-4 dark:bg-[#12261b]">
            <p className="text-xs font-bold text-[#078b43] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> قائمة أمان سريعة: مكان عام، فحص قبل دفع، لا OTP، لا روابط مشبوهة، إبلاغ عند الشك.</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/help/check-used-phone" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">كيف تفحص الجهاز</Link>
            <Link href="/help/buying-used-phone" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">دليل الشراء</Link>
            <Link href="/mobiles" className="rounded-full bg-[#078b43] px-4 py-2 text-xs font-black text-white">تصفح الموبايلات</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
