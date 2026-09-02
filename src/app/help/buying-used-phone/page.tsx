import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Search, BatteryCharging, Smartphone } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

const canonicalPath = '/help/buying-used-phone';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: 'دليل شراء موبايل مستعمل في مصر | نصائح قبل الدفع',
  description:
    'دليل عملي لشراء موبايل مستعمل في مصر: كيف تفحص الشاشة والبطارية والشحن والسماعات والشبكة، وتنتبه لقفل الحساب وIMEI، وتقارن السعر وتتجنب الدفع المقدم.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: 'دليل شراء موبايل مستعمل في مصر',
    description: 'خطوات عملية لفحص الموبايل المستعمل قبل الشراء وتجنب المشاكل الشائعة.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1733, height: 909 }],
  },
  twitter: { card: 'summary_large_image', title: 'دليل شراء موبايل مستعمل في مصر', description: 'خطوات عملية لفحص الموبايل المستعمل قبل الشراء.', images: ['/og.png'] },
};

export default function BuyingUsedPhonePage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'دليل الشراء', item: canonicalUrl },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'دليل شراء موبايل مستعمل في مصر',
    description: metadata.description as string,
    inLanguage: 'ar-EG',
    author: { '@type': 'Organization', name: 'سوق فون', url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: 'سوق فون', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={articleJsonLd} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#7c858a]" aria-label="مسار الصفحة">
          <Link href="/" className="hover:text-[#078b43]">الرئيسية</Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span aria-current="page" className="text-[#242628] dark:text-white">دليل الشراء</span>
        </nav>

        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-8">
          <h1 className="text-2xl font-black leading-8 text-[#242628] dark:text-white">دليل شراء موبايل مستعمل في مصر</h1>
          <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            شراء موبايل مستعمل يوفر كثير، لكنه يحتاج فحص هادئ قبل الدفع. هذا الدليل يلخص أهم النقاط التي تساعدك تأخذ قرار مطمئن، بدون وعود مبالغ فيها.
          </p>

          <div className="mt-6 rounded-2xl bg-[#f0faf4] p-4 dark:bg-[#12261b]">
            <p className="text-xs font-bold text-[#078b43] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> القاعدة الذهبية: افحص الجهاز بنفسك قبل تحويل أي مبلغ، وقارن السعر بالحالة الفعلية.</p>
          </div>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">قبل ما تقابل البائع</h2>
          <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>حدد ميزانيتك واحتياجاتك: مساحة، بطارية، كاميرا، أو أداء للألعاب.</li>
            <li>قارن إعلانات مشابهة على <Link href="/mobiles" className="font-bold text-[#078b43] underline">سوق الموبايلات</Link> حسب الماركة والحالة والمحافظة.</li>
            <li>اسأل البائع بوضوح: هل الجهاز مفتوح سابقًا؟ هل يوجد عيوب؟ ما الملحقات المتاحة؟</li>
            <li>اتفق على مكان عام وآمن للمقابلة، ووقت نهاري مناسب.</li>
          </ul>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">أثناء الفحص — خطوة بخطوة</h2>
          <div className="mt-4 space-y-4">
            <section className="rounded-2xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#242628] dark:text-white"><Smartphone className="h-4 w-4 text-[#078b43]" /> الجسم والشاشة والأزرار</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
                <li>راجع الفريم والظهر لأي انحناء أو فك.</li>
                <li>اختبر اللمس في كل أطراف الشاشة، والكتابة والسحب.</li>
                <li>جرب أزرار الصوت والباور والبصمة إن وجدت.</li>
              </ul>
            </section>
            <section className="rounded-2xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#242628] dark:text-white"><BatteryCharging className="h-4 w-4 text-[#078b43]" /> البطارية والشحن</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
                <li>جرّب الشحن بكابل وشاحن مختلفين وتأكد أن النسبة تزيد بثبات.</li>
                <li>لاحظ حرارة الجهاز أثناء الشحن والاستخدام الخفيف.</li>
                <li>اسأل عن صحة البطارية إن كانت متاحة في الإعدادات، ولا تعتبرها وحدها دليلاً كاملاً.</li>
              </ul>
            </section>
            <section className="rounded-2xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
              <h3 className="text-sm font-black text-[#242628] dark:text-white">الصوت والشبكة والاتصال</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
                <li>شغّل سماعة المكالمات والسماعة الخارجية والميكروفون.</li>
                <li>جرّب شريحة واتصال بيانات، واختبر Wi-Fi وBluetooth.</li>
                <li>اختبر البصمة و Face ID إن وجدا، وتأكد أنهما يعملان بحسابك أنت بعد الفحص.</li>
              </ul>
            </section>
            <section className="rounded-2xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
              <h3 className="text-sm font-black text-[#242628] dark:text-white">الحسابات والأقفال و IMEI</h3>
              <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
                <li>تأكد أن الجهاز غير مرتبط بحساب المالك السابق (مثل قفل التنشيط). اطلب من البائع إزالة حسابه أمامك.</li>
                <li>اعرف مكان رقم IMEI في الإعدادات وعلى العلبة إن وجدت، وتأكد من تطابقهما.</li>
                <li>لا تحاول تجاوز أي قفل؛ الجهاز المقفل قد يكون غير قابل للاستخدام.</li>
              </ul>
            </section>
          </div>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">السعر والدفع</h2>
          <ul className="mt-3 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
            <li>قارن السعر بنفس الموديل والحالة والمساحة في محافظتك.</li>
            <li>لا تدفع عربون قبل المعاينة، وتجنب التحويل المسبق لشخص لا تعرفه.</li>
            <li>احذر رسائل تأكيد دفع مزيفة؛ تأكد من وصول المبلغ فعليًا إن كنت البائع.</li>
          </ul>

          <div className="mt-8 rounded-2xl bg-[#fffbef] p-4 dark:bg-[#2b281d] border border-[#f0dfaa] dark:border-[#56491f]">
            <h3 className="text-sm font-black text-[#6b5310] dark:text-[#ffe08a] flex items-center gap-2"><Search className="h-4 w-4" /> قائمة تحقق سريعة</h3>
            <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-[#75632d] dark:text-[#e6d696] sm:grid-cols-2">
              {['الشاشة واللمس', 'الكاميرات', 'البطارية والشحن', 'السماعات والمايك', 'الشريحة والشبكة', 'Wi-Fi/Bluetooth', 'البصمة/الوجه', 'IMEI والحساب', 'العلبة والملحقات', 'الفاتورة إن وجدت'].map((i) => (
                <li key={i} className="flex items-center gap-2"> <span className="h-1.5 w-1.5 rounded-full bg-[#d39b00]" /> {i}</li>
              ))}
            </ul>
          </div>

          <h2 className="mt-8 text-base font-black text-[#242628] dark:text-white">أسئلة شائعة</h2>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-[#f8faf9] p-4 dark:bg-[#242424]">
              <p className="text-sm font-black text-[#242628] dark:text-white">هل صحة البطارية وحدها تكفي للحكم؟</p>
              <p className="mt-1 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">لا. هي مؤشر فقط. جرّب الاستخدام والشحن الفعلي ولاحظ الأداء والحرارة.</p>
            </div>
            <div className="rounded-xl bg-[#f8faf9] p-4 dark:bg-[#242424]">
              <p className="text-sm font-black text-[#242628] dark:text-white">ماذا لو طلب البائع دفع عربون؟</p>
              <p className="mt-1 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">يفضل عدم الدفع قبل المعاينة في مكان آمن. إذا كان لا بد، فليكن مبلغًا رمزيًا عبر وسيلة موثوقة فقط بعد التأكد.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/mobiles" className="rounded-full bg-[#078b43] px-4 py-2 text-xs font-black text-white">تصفح الموبايلات</Link>
            <Link href="/help/check-used-phone" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">كيف تفحص الجهاز بالتفصيل</Link>
            <Link href="/help/phone-safety" className="rounded-full border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-black text-[#4f555a] dark:bg-[#242424] dark:text-[#d0d0d0]">نصائح الأمان</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
