import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail,
  ChevronLeft,
  ShieldAlert,
  Clock,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, INDEXABLE_ROBOTS } from '@/lib/seo';

export const revalidate = 3600;

const canonicalPath = '/contact';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: {
    absolute: 'اتصل بنا | سوق فون',
    default: 'اتصل بنا | سوق فون',
  },
  description:
    'تواصل مع فريق دعم منصة سوق فون للاستفسارات، المساعدة التقنية، أو الإبلاغ عن إعلانات مخالفة عبر البريد الإلكتروني الرسمي.',
  alternates: { canonical: canonicalPath },
  robots: INDEXABLE_ROBOTS,
  openGraph: {
    title: 'اتصل بنا | سوق فون',
    description: 'تواصل مع فريق دعم منصة سوق فون للاستفسارات والدعم التقني.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'اتصل بنا - سوق فون' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'اتصل بنا | سوق فون',
    description: 'تواصل مع فريق دعم منصة سوق فون للاستفسارات والدعم التقني.',
    images: ['/og.png'],
  },
};

export default function ContactPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'اتصل بنا', item: canonicalUrl },
    ],
  };

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'اتصل بنا | سوق فون',
    url: canonicalUrl,
    inLanguage: 'ar-EG',
    description: metadata.description as string,
    mainEntity: {
      '@type': 'Organization',
      name: 'سوق فون',
      url: absoluteUrl('/'),
      email: 'suoqphone@gmail.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'suoqphone@gmail.com',
        availableLanguage: ['Arabic', 'English'],
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] py-8 dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={contactJsonLd} />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
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
            اتصل بنا
          </span>
        </nav>

        {/* Header Card */}
        <div className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-10">
          <div className="border-b border-[#eceeed] pb-6 dark:border-[#2e2e2e]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3.5 py-1.5 text-xs font-black text-[#078b43] dark:bg-[#132c1e] dark:text-[#52d688]">
              <Mail className="h-4 w-4" />
              <span>خدمة العملاء والدعم الفني</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#242628] dark:text-white sm:text-3xl">
              تواصل مع فريق سوق فون
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#7c858a] dark:text-[#9ea3a7]">
              نسعد باستقبال استفساراتك، مقترحاتك، أو الإبلاغ عن أي إعلان أو سلوك مخالف عبر البريد الإلكتروني الرسمي المعتمد.
            </p>
          </div>

          {/* Primary Contact Method */}
          <div className="mt-8 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-5 dark:border-[#1e4e30] dark:bg-[#102a1b] sm:p-6">
            <h2 className="text-base font-black text-[#166534] dark:text-[#86efac] flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span>البريد الإلكتروني المعتمد للدعم والتواصل</span>
            </h2>
            <p className="mt-2 text-xs leading-6 text-[#166534] dark:text-[#86efac]">
              للتواصل المباشر مع فريق الدعم الفني أو إدارة المنصة:
            </p>
            <div className="mt-4">
              <a
                href="mailto:suoqphone@gmail.com"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#078b43] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#06783a]"
              >
                <Mail className="h-4 w-4" />
                <span dir="ltr">suoqphone@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Response Time & Inquiries */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434] dark:bg-[#202020]">
              <div className="flex items-center gap-2 text-xs font-black text-[#242628] dark:text-white">
                <Clock className="h-4 w-4 text-[#078b43]" />
                <span>أوقات الاستجابة</span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#565c60] dark:text-[#c7c7c7]">
                يقوم فريق الدعم بالرد على الرسائل الواردة خلال 24 إلى 48 ساعة عمل كحد أقصى.
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434] dark:bg-[#202020]">
              <div className="flex items-center gap-2 text-xs font-black text-[#242628] dark:text-white">
                <HelpCircle className="h-4 w-4 text-[#078b43]" />
                <span>أنواع الاستفسارات</span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#565c60] dark:text-[#c7c7c7]">
                الدعم الفني للحسابات، البلاغات عن إعلانات مضللة، استفسارات الخصوصية، والشراكات.
              </p>
            </div>
          </div>

          {/* Security Alert: Do not deal outside platform blindly */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                  تنبيه أمني هام لحمايتك
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs leading-6 text-amber-800 dark:text-amber-300">
                  <li>• لا تحوّل أي مبالغ مالية مسبقة (عربون، رسوم شحن، تحويلات محافظ إلكترونية) لأي طرف قبل معاينة الهاتف واستلامه يدوياً.</li>
                  <li>• احرص دائماً على مقابلة البائع أو المشتري في أماكن عامة ومأهولة نهاراً لفحص الجهاز بدقة.</li>
                  <li>• إدارة سوق فون لا تطلب منك إطلاقاً كلمات المرور أو رموز التحقق (OTP) أو بيانات بطاقاتك الائتمانية.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#eceeed] pt-6 dark:border-[#2e2e2e]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-bold text-[#4f555a] transition hover:bg-[#f5f7f6] dark:border-[#353535] dark:bg-[#202020] dark:text-[#d0d0d0]"
            >
              <span>العودة للرئيسية</span>
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            </Link>

            <div className="flex items-center gap-3 text-xs">
              <Link href="/terms" className="font-bold text-[#078b43] hover:underline">
                الشروط والأحكام
              </Link>
              <span className="text-[#a0a6aa]">•</span>
              <Link href="/privacy" className="font-bold text-[#078b43] hover:underline">
                سياسة الخصوصية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
