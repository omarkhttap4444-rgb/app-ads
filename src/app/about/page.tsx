import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Smartphone, Users } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;
const canonicalPath = '/about';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: 'عن سوق فون | منصة بيع وشراء الموبايلات في مصر',
  description: 'سوق فون منصة مصرية لعرض وبيع وشراء الموبايلات الجديدة والمستعملة. المستخدمون يتواصلون مباشرة بدون عمولة، مع التركيز على الشفافية والأمان.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: 'عن سوق فون',
    description: 'منصة مصرية لبيع وشراء الموبايلات بتواصل مباشر.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909 }],
  },
  twitter: { card: 'summary_large_image', title: 'عن سوق فون', description: 'منصة مصرية للموبايلات.', images: ['/og.png'] },
};

export default function AboutPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'عن سوق فون', item: canonicalUrl },
    ],
  };
  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'عن سوق فون',
    url: canonicalUrl,
    inLanguage: 'ar-EG',
    description: metadata.description as string,
    isPartOf: { '@type': 'WebSite', name: 'سوق فون', url: absoluteUrl('/') },
  };
  return (
    <main className="min-h-screen bg-[#f7f8f8] dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={webpage} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#7c858a]"><Link href="/" className="hover:text-[#078b43]">الرئيسية</Link><ChevronLeft className="h-3.5 w-3.5" /><span className="text-[#242628] dark:text-white">عن سوق فون</span></nav>
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-8">
          <h1 className="text-2xl font-black text-[#242628] dark:text-white">عن سوق فون</h1>
          <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">سوق فون منصة إلكترونية تهدف لمساعدة المستخدمين في مصر على عرض وبيع وشراء الموبايلات والإلكترونيات الجديدة والمستعملة بطريقة مباشرة وشفافة.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e7e9ec] p-4 text-center dark:border-[#343434]">
              <Smartphone className="mx-auto h-6 w-6 text-[#078b43]" />
              <p className="mt-2 text-sm font-black text-[#242628] dark:text-white">سوق للموبايلات</p>
              <p className="mt-1 text-xs leading-6 text-[#6b7175] dark:text-[#aeb4b7]">إعلانات من مستخدمين حقيقيين مع صور ومواصفات واضحة.</p>
            </div>
            <div className="rounded-2xl border border-[#e7e9ec] p-4 text-center dark:border-[#343434]">
              <Users className="mx-auto h-6 w-6 text-[#078b43]" />
              <p className="mt-2 text-sm font-black text-[#242628] dark:text-white">تواصل مباشر</p>
              <p className="mt-1 text-xs leading-6 text-[#6b7175] dark:text-[#aeb4b7]">البائع والمشتري يتواصلان مباشرة بدون وسيط أو عمولة من المنصة.</p>
            </div>
            <div className="rounded-2xl border border-[#e7e9ec] p-4 text-center dark:border-[#343434]">
              <ShieldCheck className="mx-auto h-6 w-6 text-[#078b43]" />
              <p className="mt-2 text-sm font-black text-[#242628] dark:text-white">تركيز على الأمان</p>
              <p className="mt-1 text-xs leading-6 text-[#6b7175] dark:text-[#aeb4b7]">نصائح واضحة للفحص والمقابلة والدفع، مع إمكانية الإبلاغ.</p>
            </div>
          </div>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">ماذا يقدم سوق فون؟</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>تصفح الموبايلات حسب الماركة والحالة والمحافظة في مصر.</li>
            <li>بحث ذكي وتصفية حسب السعر والمواصفات.</li>
            <li>تواصل مباشر عبر الهاتف أو الرسائل داخل التطبيق حسب توفر البيانات.</li>
            <li>أدلة مساعدة بالعربية لفحص الجهاز وتجنب الاحتيال.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">مبادئنا</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>الشفافية: نشجع البائع على ذكر الحالة والعيوب بوضوح.</li>
            <li>الخصوصية: لا نطلب مشاركة كلمات مرور أو رموز OTP، وننصح بحماية بياناتك.</li>
            <li>المسؤولية: القرار النهائي للشراء والبيع يعود للمستخدم بعد الفحص.</li>
          </ul>

          <p className="mt-6 rounded-2xl bg-[#f0faf4] p-4 text-xs leading-7 text-[#2d5a3f] dark:bg-[#12261b] dark:text-[#a7d8b9]">سوق فون يركز حاليًا على السوق المصري. لا ندعي أرقامًا غير موثقة عن عدد المستخدمين أو المبيعات، ولا نعرض شراكات أو جوائز غير موجودة.</p>

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
