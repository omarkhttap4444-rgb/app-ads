import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Mail,
  ArrowRight,
  Scale,
} from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, INDEXABLE_ROBOTS } from '@/lib/seo';

export const revalidate = 3600;

const canonicalPath = '/terms';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: {
    absolute: 'الشروط والأحكام | سوق فون',
    default: 'الشروط والأحكام | سوق فون',
  },
  description:
    'شروط وأحكام استخدام منصة سوق فون لبيع وشراء الهواتف والإلكترونيات، قواعد نشر الإعلانات، وضوابط المعاملات الآمنة وتجنب الاحتيال.',
  alternates: { canonical: canonicalPath },
  robots: INDEXABLE_ROBOTS,
  openGraph: {
    title: 'الشروط والأحكام | سوق فون',
    description: 'شروط وأحكام استخدام منصة سوق فون وضوابط التداول الآمن.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'الشروط والأحكام - سوق فون' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'الشروط والأحكام | سوق فون',
    description: 'شروط وأحكام استخدام منصة سوق فون وضوابط التداول الآمن.',
    images: ['/og.png'],
  },
};

export default function TermsPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'الشروط والأحكام', item: canonicalUrl },
    ],
  };

  const termsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'الشروط والأحكام | سوق فون',
    url: canonicalUrl,
    inLanguage: 'ar-EG',
    description: metadata.description as string,
    publisher: {
      '@type': 'Organization',
      name: 'سوق فون',
      url: absoluteUrl('/'),
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] py-8 dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={termsJsonLd} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-2 text-xs font-bold text-[#7c858a]"
          aria-label="مسار الصفحة"
        >
          <Link href="/" className="hover:text-[#078b43] transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span aria-current="page" className="text-[#242628] dark:text-white">
            الشروط والأحكام
          </span>
        </nav>

        {/* Content Card */}
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-10">
          {/* Header */}
          <div className="border-b border-[#eceeed] pb-6 dark:border-[#2e2e2e]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3.5 py-1.5 text-xs font-black text-[#078b43] dark:bg-[#132c1e] dark:text-[#52d688]">
              <Scale className="h-4 w-4" />
              <span>اتفاقية الاستخدام والضوابط القانونية</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#242628] dark:text-white sm:text-3xl">
              شروط وأحكام استخدام سوق فون
            </h1>
            <p className="mt-2 text-xs text-[#7c858a] dark:text-[#9ea3a7]">
              آخر تحديث: 24 أكتوبر 2026 – تنطبق هذه الاتفاقية على جميع مستخدمي موقع souqphone.com وتطبيق سوق فون للهواتف.
            </p>
          </div>

          {/* 1. مقدمة */}
          <section className="mt-8">
            <h2 className="text-lg font-black text-[#242628] dark:text-white sm:text-xl">
              1. مقدمة عن المنصة
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              مرحباً بكم في منصة <strong className="text-[#242628] dark:text-white">&quot;سوق فون&quot;</strong>. سوق فون هي منصة إعلانات مبوبة مجانية تهدف إلى تيسير التواصل المباشر بين بائعي ومشتري الهواتف الذكية والإلكترونيات وملحقاتها في مصر دون أي عمولات أو رسوم وساطة.
            </p>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يعد استخدامك للموقع أو التطبيق أو تسجيل حساب جديد بمثابة موافقة كاملة وصريحة منك على جميع الشروط والأحكام الموضحة في هذه الوثيقة، والتزاماً تاماً بالقوانين واللوائح السارية.
            </p>
          </section>

          {/* 2. تحذير التعامل خارج المنصة والاحتيال - قسم بارز */}
          <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20 sm:p-6">
            <div className="flex items-center gap-2 text-base font-black text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h2>2. إرشادات الأمان والتحذير من الاحتيال (هام جداً)</h2>
            </div>
            <p className="mt-2 text-xs leading-6 text-rose-900 dark:text-rose-300 font-semibold">
              سوق فون هي منصة إعلانات لربط الأطراف وليست طرفاً في أي معاملة مالية أو تجارية، ولا تقدم خدمة الدفع الإلكتروني أو الضمان المالي أو الشحن. حفاظاً على أموالك وأمانك، يرجى الالتزام الصارم بالإرشادات التالية:
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-rose-800 dark:text-rose-300">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>حظر التحويل المسبق للأموال:</strong> إياك وتحويل أي مبالغ مالية مسبقاً (سواء كعربون، أو مصاريف شحن، أو حجز سلعة) عبر فودافون كاش، إنستاباي، أو أي محفظة إلكترونية قبل معاينة الهاتف واستلامه شخصياً باليد.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>المعاينة والفحص الشخصي:</strong> احرص دائماً على فحص الجهاز بدقة (الشاشة، البطارية، الكاميرا، الأزرار، والشبكة)، ومطابقة الرقم التسلسلي (IMEI) مع العلبة والفاتورة الأصلية إن وجدت.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>اللقاء في أماكن عامة ومؤمّنة:</strong> لا تقابل البائعين أو المشترين في أماكن نائية أو خاصة. اختر مكاناً عاماً ومزدحماً (مثل محلات صيانة موثوقة، مولات تجارية، أو مقاهي نهاراً).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>العروض غير المنطقية:</strong> كن حذراً من الأسعار المنخفضة للغاية عن سعر السوق؛ فغالباً ما تكون محاولات احتيال أو هواتف مقلدة أو معيوبة.
                </div>
              </li>
            </ul>
          </section>

          {/* 3. ضوابط نشر الإعلانات */}
          <section className="mt-8">
            <h2 className="text-base font-black text-[#242628] dark:text-white sm:text-lg">
              3. ضوابط نشر الإعلانات والمحتوى
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يلتزم المستخدم بنشر إعلانات صحيحة ودقيقة تعكس الواقع الفعلي للسلعة، ويحظر تماماً نشر:
            </p>
            <ul className="mt-3 space-y-2 pr-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong>الأجهزة المقلدة أو مجهولة المصدر:</strong> يمنع عرض أجهزة غير أصلية أو مسروقة أو غير مرخصة.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong>الصور المضللة:</strong> يجب استخدام صور حقيقية حديثة للمنتج نفسه، ويمنع استخدام صور ترويجية من الإنترنت دون توضيح.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong>الإفصاح عن العيوب:</strong> يجب توضيح حالة الجهاز بدقة (جديد، مستعمل، كسر زيرو) وأي صيانة سابقة أو عيوب فنية بشفافية.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong>تكرار الإعلانات:</strong> يمنع نشر نفس السلعة أكثر من مرة لإغراق صفحات البحث.
                </div>
              </li>
            </ul>
          </section>

          {/* 4. إخلاء المسؤولية القانونية */}
          <section className="mt-8">
            <h2 className="text-base font-black text-[#242628] dark:text-white sm:text-lg">
              4. إخلاء المسؤولية القانونية
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              سوق فون تقدم منصة تقنية لعرض الإعلانات فقط:
            </p>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li>لا تضمن المنصة صحة أو دقة الإعلانات المنشورة من قبل المستخدمين أو جودة وسلامة الأجهزة المعروضة.</li>
              <li>لا تتحمل المنصة أي مسؤولية قانونية أو مدنية عن أي أضرار أو خسائر مادية أو نزاعات تنشأ بين البائع والمشتري جراء المعاملات المباشرة بينهما.</li>
              <li>يتحمل البائع المسؤولية القانونية الكاملة عن ملكية وسلامة الجهاز المعروض للبيع.</li>
            </ul>
          </section>

          {/* 5. إدارة الحسابات وحظر المخالفين */}
          <section className="mt-8">
            <h2 className="text-base font-black text-[#242628] dark:text-white sm:text-lg">
              5. إدارة الحسابات وحظر المخالفين
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              تحتفظ إدارة سوق فون بالحق الكامل، دون الحاجة لإنذار مسبق، في:
            </p>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li>حذف أو تعديل أي إعلان يخالف سياسات الاستخدام أو يتبين أنه مضلل أو احتيالي.</li>
              <li>حظر أو إيقاف أي حساب يثبت تورطه في محاولات احتيال، إزعاج، أو مخالفة للقوانين.</li>
              <li>التعاون مع الجهات الأمنية والقضائية المختصة عند طلب معلومات قانونية رسمية بخصوص حالات نصب أو سرقة.</li>
            </ul>
          </section>

          {/* 6. التواصل والإبلاغ عن المخالفات */}
          <section className="mt-8 border-t border-[#eceeed] pt-6 dark:border-[#2e2e2e]">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Mail className="h-5 w-5 text-[#078b43]" />
              <span>6. التواصل والإبلاغ عن المخالفات</span>
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              إذا واجهت أي إعلان مشبوه أو سلوك يخالف هذه الشروط، يرجى إبلاغنا فوراً عبر البريد الإلكتروني الرسمي:
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href="mailto:suoqphone@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl bg-[#078b43] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#06783a]"
              >
                <Mail className="h-4 w-4" />
                <span dir="ltr">suoqphone@gmail.com</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2.5 text-xs font-bold text-[#4f555a] transition hover:bg-[#f5f7f6] dark:border-[#353535] dark:bg-[#202020] dark:text-[#d0d0d0]"
              >
                <span>صفحة اتصل بنا</span>
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
