import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  Key,
  Mail,
  Smartphone,
  Users,
  Camera,
  Database,
  Trash2,
  ExternalLink,
  MapPin,
  Bell,
  CheckCircle2,
  FileText,
  Radio,
  ArrowRight,
} from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, INDEXABLE_ROBOTS } from '@/lib/seo';

export const revalidate = 3600;
const canonicalPath = '/privacy';
const canonicalUrl = absoluteUrl(canonicalPath);

export const metadata: Metadata = {
  title: {
    absolute: 'سياسة الخصوصية | سوق فون',
    default: 'سياسة الخصوصية | سوق فون',
  },
  description:
    'سياسة الخصوصية لتطبيق سوق فون (com.souqphone.app) وموقع souqphone.com. نوضح البيانات المجمعة من حساب Google، وأذونات OAuth، وبيانات الاستخدام والأجهزة والموقع، وحماية البيانات، وحقوق المستخدم وحذف الحساب.',
  alternates: { canonical: canonicalPath },
  robots: INDEXABLE_ROBOTS,
  openGraph: {
    title: 'سياسة الخصوصية | سوق فون',
    description:
      'سياسة الخصوصية وحماية البيانات لتطبيق وموقع سوق فون: بيع وشراء الموبايلات.',
    url: canonicalUrl,
    siteName: 'سوق فون',
    locale: 'ar_EG',
    type: 'article',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'سياسة الخصوصية - سوق فون' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سياسة الخصوصية | سوق فون',
    description:
      'سياسة الخصوصية وحماية البيانات لتطبيق وموقع سوق فون: بيع وشراء الموبايلات.',
    images: ['/og.png'],
  },
};

export default function PrivacyPolicyPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'سياسة الخصوصية', item: canonicalUrl },
    ],
  };

  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'سياسة الخصوصية | سوق فون',
    url: canonicalUrl,
    inLanguage: 'ar-EG',
    description: metadata.description as string,
    publisher: {
      '@type': 'Organization',
      name: 'سوق فون',
      url: absoluteUrl('/'),
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] py-8 dark:bg-[#0d0d0d]">
      <JsonLd data={breadcrumb} />
      <JsonLd data={webpage} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav
          className="mb-6 flex items-center gap-2 text-xs font-bold text-[#7c858a]"
          aria-label="مسار الصفحة"
        >
          <Link href="/" className="hover:text-[#078b43] transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span aria-current="page" className="text-[#242628] dark:text-white">
            سياسة الخصوصية
          </span>
        </nav>

        {/* Main Content Article */}
        <article className="rounded-[24px] border border-[#e7e9ec] bg-white p-6 shadow-sm dark:border-[#343434] dark:bg-[#1a1a1a] sm:p-10">
          {/* Header */}
          <div className="border-b border-[#eceeed] pb-6 dark:border-[#2e2e2e]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3.5 py-1.5 text-xs font-black text-[#078b43] dark:bg-[#132c1e] dark:text-[#52d688]">
              <ShieldCheck className="h-4 w-4" />
              <span>حماية البيانات والخصوصية</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#242628] dark:text-white sm:text-3xl">
              سياسة الخصوصية – سوق فون
            </h1>
            <p className="mt-2 text-xs text-[#7c858a] dark:text-[#9ea3a7]">
              تنطبق هذه السياسة على تطبيق الهواتف الذكية{' '}
              <strong className="text-[#242628] dark:text-white">"سوق فون: بيع وشراء الموبايلات"</strong> (المعرف:{' '}
              <code className="rounded bg-[#f0f2f4] px-1.5 py-0.5 text-[11px] font-mono dark:bg-[#282828]">
                com.souqphone.app
              </code>
              ) والموقع الإلكتروني{' '}
              <strong className="text-[#242628] dark:text-white">souqphone.com</strong>.
            </p>
          </div>

          {/* 1. مقدمة */}
          <section className="mt-8">
            <h2 className="text-lg font-black text-[#242628] dark:text-white sm:text-xl">
              مقدمة
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              توضح هذه الوثيقة أنواع البيانات التي نجمعها من مستخدمي تطبيق وموقع "سوق فون" وخدمات تسجيل الدخول
              عبر Google، والغرض من جمعها، والطريقة التي نحمي بها هذه البيانات، وحقوق المستخدمين في الوصول إلى بياناتهم
              وتعديلها وحذفها.
            </p>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              نلتزم التزاماً صارماً بالامتثال لمتطلبات{' '}
              <strong className="text-[#242628] dark:text-white">Google API Services User Data Policy</strong> وشروط
              التحقق من OAuth (OAuth verification). ينبغي على المستخدم قراءة هذه السياسة قبل استخدام ميزات تسجيل الدخول
              أو نشر الإعلانات والمشاركة عبر المنصة.
            </p>
          </section>

          {/* 2. المعلومات التي نجمعها من حساب Google */}
          <section className="mt-8 rounded-2xl border border-[#e7e9ec] bg-[#fafbfb] p-5 dark:border-[#343434] dark:bg-[#202020] sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Lock className="h-5 w-5 text-[#078b43]" />
              المعلومات التي نجمعها من حساب Google
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              عند اختيارك تسجيل الدخول بواسطة حساب Google ومنح الإذن المطلوب، نقوم بجمع المعلومات الأساسية التالية فقط:
            </p>
            <ul className="mt-3 space-y-2.5 pr-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong className="text-[#242628] dark:text-white">البريد الإلكتروني (email):</strong> لاستخدامه في
                  تعريف الحساب وإدارته، والتواصل وتأكيد العمليات.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong className="text-[#242628] dark:text-white">الاسم الكامل (name):</strong> لعرض اسم المستخدم
                  داخل واجهة التطبيق والموقع وعلى إعلاناته.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078b43]" />
                <div>
                  <strong className="text-[#242628] dark:text-white">صورة الملف الشخصي (profile picture):</strong> لعرض
                  صورة الحساب في الملف الشخصي ولإضفاء طابع شخصي وموثوق.
                </div>
              </li>
            </ul>
            <div className="mt-4 rounded-xl bg-[#f0faf4] p-3.5 text-xs leading-6 text-[#1c683b] dark:bg-[#132c1e] dark:text-[#8ce6b0]">
              <strong>تأكيد هام:</strong> نحن لا نجمع ولا نطلب أي بيانات أو أذونات أخرى من خدمات Google مثل Google Drive
              أو Gmail أو جهات الاتصال (Contacts) أو غيرها على الإطلاق.
            </div>
          </section>

          {/* 3. أذونات Google OAuth المطلوبة */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Key className="h-5 w-5 text-[#078b43]" />
              أذونات Google OAuth المطلوبة
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يطلب تطبيق "سوق فون" وموقع souqphone.com حصرياً الأذونات القياسية الأساسية التالية عبر Google OAuth:
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e7e9ec] bg-white p-3 text-center dark:border-[#343434] dark:bg-[#1a1a1a]">
                <code className="text-xs font-black text-[#078b43] dark:text-[#52d688]">openid</code>
                <p className="mt-1 text-[11px] text-[#7c858a]">رمز الهوية والتحقق الآمن</p>
              </div>
              <div className="rounded-xl border border-[#e7e9ec] bg-white p-3 text-center dark:border-[#343434] dark:bg-[#1a1a1a]">
                <code className="text-xs font-black text-[#078b43] dark:text-[#52d688]">email</code>
                <p className="mt-1 text-[11px] text-[#7c858a]">عنوان البريد الإلكتروني</p>
              </div>
              <div className="rounded-xl border border-[#e7e9ec] bg-white p-3 text-center dark:border-[#343434] dark:bg-[#1a1a1a]">
                <code className="text-xs font-black text-[#078b43] dark:text-[#52d688]">profile</code>
                <p className="mt-1 text-[11px] text-[#7c858a]">الاسم وصورة الملف الشخصي</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              هذه الأذونات تتيح لنا الحصول على رمز الهوية (ID token) وعنوان البريد الإلكتروني والاسم وصورة الملف الشخصي
              فقط لتسجيل الدخول بأمان. لا نستخدم أي أذونات أخرى ولا نصل إلى أي خدمات Google إضافية.
            </p>
          </section>

          {/* 4. بيانات الاستخدام والجهاز والموقع */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Smartphone className="h-5 w-5 text-[#078b43]" />
              بيانات استخدام التطبيق والجهاز والموقع
            </h2>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
                <h3 className="text-sm font-black text-[#242628] dark:text-white">
                  بيانات الاستخدام والأحداث التحليلية
                </h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  مثل فتح الشاشات وعمليات البحث والتصفح والتفاعل مع المنتجات والإعلانات، بهدف قياس أداء المنصة وتحسين
                  تجربة المستخدم وحل المشاكل التقنية.
                </p>
              </div>
              <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
                <h3 className="text-sm font-black text-[#242628] dark:text-white">المعلومات التقنية</h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  مثل نوع الجهاز وطرازه، نظام التشغيل وإصداره، عنوان بروتوكول الإنترنت (IP)، ومعرّفات الجهاز أو
                  الإعلانات المتاحة وفق إعدادات النظام وقوانين الخصوصية.
                </p>
              </div>
              <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-[#242628] dark:text-white">
                  <Bell className="h-4 w-4 text-[#078b43]" />
                  الإشعارات
                </h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  رمز الإشعارات (FCM Token) ومعلومات الجهاز اللازمة لتسليم إشعارات الحساب، والرسائل بين المستخدمين،
                  وتحديثات الإعلانات والمنتجات.
                </p>
              </div>
              <div className="rounded-xl border border-[#e7e9ec] p-4 dark:border-[#343434]">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-[#242628] dark:text-white">
                  <MapPin className="h-4 w-4 text-[#078b43]" />
                  بيانات الموقع
                </h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  المحافظة أو المدينة التي يحددها المستخدم لتخصيص نتائج البحث، والموقع الدقيق فقط عند طلب استخدام ميزة
                  تحديد الموقع بالخريطة ومنح الإذن الصريح اللازم لذلك من خلال نظام التشغيل.
                </p>
              </div>
            </div>
          </section>

          {/* 5. الإعلانات والمنتجات */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <FileText className="h-5 w-5 text-[#078b43]" />
              الإعلانات والمنتجات
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              البيانات والمعلومات التي يختار المستخدم نشرها بإرادته في إعلانات بيع وشراء الهواتف والإلكترونيات (مثل نصوص
              الإعلان، مواصفات الجهاز، الصور المرفقة، السعر المطلوب، وسيلة التواصل كرقم الهاتف أو الرسائل، والمحافظة أو
              المنطقة) تظهر للعامة وللمستخدمين الآخرين داخل المنصة بهدف تسهيل التواصل المباشر وإتمام عمليات البيع
              والشراء دون وسيط.
            </p>
          </section>

          {/* 6. مجتمع سوق فون والمحتوى الذي ينشئه المستخدمون */}
          <section className="mt-8 rounded-2xl border border-[#e7e9ec] bg-[#fafbfb] p-5 dark:border-[#343434] dark:bg-[#202020] sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Users className="h-5 w-5 text-[#078b43]" />
              مجتمع سوق فون والمحتوى الذي ينشئه المستخدمون (UGC)
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يتضمن تطبيق "سوق فون" مساحة "مجتمع سوق فون"، وهي مساحة تفاعلية مخصصة للنقاشات ومشاركة التجارب والتفاعل
              بين المهتمين بسوق الهواتف.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#242628] dark:text-white">
                  1. البيانات والمحتوى المرتبط بالمجتمع
                </h3>
                <ul className="mt-2 list-disc pr-5 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  <li>
                    <strong>المنشورات والنصوص:</strong> المنشورات والتدوينات والاستفسارات التي ينشرها المستخدم.
                  </li>
                  <li>
                    <strong>الصور:</strong> الصور التي يختار المستخدم التقاطها أو رفعها وإرفاقها بمنشوراته.
                  </li>
                  <li>
                    <strong>التعليقات والردود:</strong> التعليقات والآراء التي يضيفها على المنشورات.
                  </li>
                  <li>
                    <strong>التصويتات والتفاعلات:</strong> المشاركة في استطلاعات الرأي والإعجابات والتفاعلات.
                  </li>
                  <li>
                    <strong>معلومات الحساب العامة:</strong> اسم المستخدم وصورة الملف الشخصي المرتبطة بالمحتوى.
                  </li>
                  <li>
                    <strong>البلاغات:</strong> الشكاوى والبلاغات التي يرسلها المستخدمون بشأن أي محتوى مخالف.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#242628] dark:text-white">2. ظهور المحتوى للآخرين</h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  المحتوى المنشور في مجتمع سوق فون مخصص للمشاركة العامة ويكون ظاهرًا للمستخدمين الآخرين للتطبيق، ويظهر
                  معه اسم وصورة الناشر. يُنصح المستخدم بعدم نشر أي بيانات حساسة أو أرقام سرية لا يرغب بمشاركتها علناً.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#242628] dark:text-white">3. استخدام بيانات ومحتوى المجتمع</h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  نستخدم هذا المحتوى لعرض المنشورات والردود، وتشغيل التصويتات، وإدارة التفاعل، واستقبال البلاغات ومكافحة
                  إساءة الاستخدام وحماية سلامة المنصة. نؤكد أن سوق فون لا تبيع المحتوى الشخصي أو بيانات المستخدمين لأي طرف
                  خارجي.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#242628] dark:text-white">4. الإبلاغ والإشراف على المحتوى</h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  يوفر المجتمع أدوات للإبلاغ عن أي محتوى غير لائق أو مخالف للشروط. تقوم إدارة سوق فون بمراجعة البلاغات
                  واتخاذ الإجراءات اللازمة، والتي تشمل إخفاء أو إزالة المحتوى المخالف نهائياً وحظر الحسابات المسيئة.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#242628] dark:text-white">5. التحكم في المحتوى والحذف</h3>
                <p className="mt-1 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
                  يمكن للمستخدم تعديل أو حذف المنشورات والمحتوى الذي قام بإنشائه عبر الخيارات المتاحة بالتطبيق. قد يتم
                  الاحتفاظ ببعض السجلات لفترة محددة عند الضرورة الأمنية أو الامتثال لالتزام قانوني.
                </p>
              </div>
            </div>
          </section>

          {/* 7. استخدام الكاميرا والصور */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Camera className="h-5 w-5 text-[#078b43]" />
              استخدام الكاميرا والصور
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يستخدم تطبيق "سوق فون" الكاميرا ومكتبة الصور فقط عندما يختار المستخدم التقاط أو رفع صور لإرفاقها بإعلاناته
              أو منشوراته في المجتمع.
            </p>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li>لا يتم الوصول إلى الكاميرا أو الصور في الخلفية دون علم المستخدم.</li>
              <li>يتم طلب إذن الوصول صراحة من خلال نظام التشغيل قبل فتح الكاميرا أو معرض الصور.</li>
              <li>لا يقوم التطبيق بالتقاط أو جمع أي صور سراً، ولا تتم مشاركتها خارج نطاق الإعلان أو المنشور المصرح به.</li>
              <li>الصور المرفوعة تكون تحت إدارة المستخدم بالكامل ويمكنه حذفها أو تغييرها في أي وقت.</li>
            </ul>
          </section>

          {/* 8. كيفية استخدام البيانات */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Database className="h-5 w-5 text-[#078b43]" />
              كيفية استخدام البيانات
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              نستخدم بيانات Google وبيانات الحساب المصرح بها للأغراض المشروعة والضرورية التالية فقط:
            </p>
            <ul className="mt-3 space-y-2 pr-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li className="flex items-start gap-2">
                <span className="font-black text-[#078b43]">•</span>
                <div>
                  <strong className="text-[#242628] dark:text-white">المصادقة (Authentication):</strong> التحقق الآمن
                  من هوية المستخدم عبر Firebase Authentication.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[#078b43]">•</span>
                <div>
                  <strong className="text-[#242628] dark:text-white">إنشاء وإدارة الحساب:</strong> إنشاء ملف المستخدم
                  وحفظ إعلاناته ومفضلاته ورسائله داخل أنظمتنا.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[#078b43]">•</span>
                <div>
                  <strong className="text-[#242628] dark:text-white">التخصيص وتحسين التجربة (Personalization):</strong>{' '}
                  عرض اسم المستخدم وصورته الشخصية وتفضيلاته داخل التطبيق والموقع.
                </div>
              </li>
            </ul>
            <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-xs leading-6 text-[#166534] dark:border-[#1e4e30] dark:bg-[#102a1b] dark:text-[#86efac]">
              <strong>سياسة صارمة:</strong> لا نستخدم بيانات مستخدمي Google في الإعلانات المستهدفة، ولا نبيعها ولا نؤجرها
              ولا نشاركها مع أي شبكات أو سماسرة بيانات تحت أي ظرف.
            </div>
          </section>

          {/* 9. تخزين البيانات وأمانها */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Lock className="h-5 w-5 text-[#078b43]" />
              تخزين البيانات وأمانها
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              نولي أمان البيانات أولوية قصوى ونطبق إجراءات أمنية وفنية متقدمة لحماية معلومات المستخدمين:
            </p>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li>
                <strong>تشفير كامل للاتصالات:</strong> يتم نقل جميع البيانات بين التطبيق والمتصفح وخوادمنا والخدمات
                السحابية عبر قنوات مشفرة وآمنة باستخدام بروتوكولات HTTPS/TLS الحديثة.
              </li>
              <li>
                <strong>إدارة آمنة للجلسات:</strong> تتم معالجة بيانات المصادقة ورموز الدخول بواسطة Firebase Authentication
                وفق أحدث معايير الأمان المعتمدة عالمياً.
              </li>
              <li>
                <strong>الحد الأدنى للتخزين:</strong> نقوم بتخزين البيانات الضرورية فقط لتشغيل الحساب والخدمات داخل قواعد
                بيانات محمية ومقيدة الوصول.
              </li>
              <li>
                <strong>سياسات وصول صارمة:</strong> نطبق ضوابط وصول دقيقة تمنع أي وصول غير مصرح به لبيانات المستخدمين.
              </li>
            </ul>
          </section>

          {/* 10. خدمات الطرف الثالث */}
          <section className="mt-8 rounded-2xl border border-[#e7e9ec] p-5 dark:border-[#343434] sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Radio className="h-5 w-5 text-[#078b43]" />
              خدمات الطرف الثالث
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يستخدم سوق فون مجموعة من مزودي الخدمات الموثوقين لتقديم وظائف المصادقة، التخزين السحابي، التحليلات،
              والإشعارات:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Firebase Authentication</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لتسجيل الدخول الآمن وإدارة جلسات المستخدمين بما فيها Google Sign-In.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">
                  Firebase Firestore & Storage
                </strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لتخزين بيانات المستخدمين وتفضيلاتهم والملفات بشكل مؤمن ومقيد الوصول.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Firebase Analytics</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لقياس وتحليل التفاعل مع التطبيق وتحسين استقرار الخدمة وتجربة الاستخدام.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">
                  Firebase Cloud Messaging (FCM)
                </strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لإرسال إشعارات الحساب والرسائل الفورية والتحديثات إلى الجهاز.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Supabase</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لتقديم خدمات قاعدة البيانات والتخزين وواجهات API اللازمة لإدارة الإعلانات والمنصة.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Google AdMob</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لعرض الإعلانات وقياس أدائها وفق معايير الخصوصية، مع إمكانية إدارة وسحب الموافقة من إعدادات التطبيق.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">
                  Google User Messaging Platform (UMP)
                </strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لإدارة وعرض رسائل الموافقة والخيارات الإعلانية وتخزين تفضيلات الخصوصية.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Meta / Facebook App Events</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لقياس أداء التطبيق والأحداث التحليلية وفق معايير الخصوصية المعتمدة.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">
                  خدمات الخرائط (OpenStreetMap)
                </strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لعرض الخرائط التفاعلية وتحديد المواقع الجغرافية بعد موافقة المستخدم.
                </p>
              </div>
              <div className="rounded-xl border border-[#eceeed] p-3.5 dark:border-[#2f2f2f]">
                <strong className="text-xs font-black text-[#242628] dark:text-white">Firebase Cloud Functions</strong>
                <p className="mt-1 text-[11px] leading-5 text-[#6b7175] dark:text-[#aeb4b7]">
                  لمعالجة العمليات السحابية الخلفية المشفرة بأمان ودون تخزين بيانات إضافية.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#565c60] dark:text-[#c7c7c7]">
              تصل هذه الخدمات فقط إلى البيانات الضرورية اللازمة لأداء مهامها وبموجب التزامات حماية بيانات مشددة. لمعرفة
              المزيد حول كيفية معالجة Google للبيانات عبر خدمات شركائها، يرجى مراجعة{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#078b43] underline dark:text-[#52d688]"
              >
                <span>سياسة Google لخدمات الشركاء</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </section>

          {/* 11. مشاركة البيانات */}
          <section className="mt-8">
            <h2 className="text-base font-black text-[#242628] dark:text-white sm:text-lg">مشاركة البيانات</h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              نؤكد المبادئ الثابتة التالية بشأن مشاركة البيانات:
            </p>
            <ul className="mt-2 list-disc pr-5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <li>
                <strong>عدم البيع أو التأجير:</strong> لا نبيع أو نؤجر أو نشارك بيانات مستخدمي Google أو أي بيانات شخصية
                مع أي جهة خارجية لأغراض تجارية أو تسويقية.
              </li>
              <li>
                <strong>مزودو الخدمات المعتمدون:</strong> نشارك بيانات محدودة بالقدر الأدنى فقط مع مزودي البنية التحتية
                الموثوقين (مثل الاستضافة وقواعد البيانات السحابية) بموجب اتفاقيات سرية وحماية بيانات ملزمة قانونياً.
              </li>
              <li>
                <strong>الالتزام القانوني:</strong> لا نكشف عن البيانات إلا عندما نكون ملزمين قانوناً بموجب أمر قضائي
                رسمي أو التزام تنظيمي سارٍ، وضمن أضيق نطاق يسمح به القانون.
              </li>
            </ul>
          </section>

          {/* 12. حقوق المستخدم وحذف البيانات */}
          <section className="mt-8 rounded-2xl border border-[#e7e9ec] bg-[#fdfefe] p-5 dark:border-[#343434] dark:bg-[#1f1f1f] sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Trash2 className="h-5 w-5 text-[#078b43]" />
              حقوق المستخدم وحذف البيانات
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              يتمتع جميع مستخدمي سوق فون بكامل الحقوق القانونية المتعلقة ببياناتهم الشخصية:
            </p>
            <div className="mt-3 space-y-2.5 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#078b43]">1. حق الوصول:</span>
                <span>طلب نسخة من بياناتك الشخصية المسجلة لدينا في أي وقت.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#078b43]">2. حق التصحيح:</span>
                <span>طلب تعديل أو تحديث أي معلومات شخصية غير دقيقة أو غير مكتملة.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#078b43]">3. حق الحذف النهائي:</span>
                <span>
                  طلب إغلاق حسابك وحذف جميع بياناتك وإعلاناتك وصورك نهائياً من خوادمنا وقواعد بياناتنا.
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d6e5dd] bg-[#f4faf6] p-4 dark:border-[#224732] dark:bg-[#12281c]">
              <p className="text-xs font-bold text-[#204930] dark:text-[#a2e8c2]">
                كيفية تقديم طلب الحذف أو ممارسة حقوقك:
              </p>
              <p className="mt-1 text-xs leading-6 text-[#355c45] dark:text-[#c2eed6]">
                لممارسة أي من حقوقك أو لطلب حذف حسابك وبياناتك فوراً، يرجى مراسلتنا عبر البريد الإلكتروني الرسمي:{' '}
                <a
                  href="mailto:suoqphone@gmail.com"
                  className="font-bold text-[#078b43] underline dark:text-[#52d688]"
                >
                  suoqphone@gmail.com
                </a>
                . سنقوم بتأكيد استلام طلبك وشرح خطوات وإطار التنفيذ الزمني لإتمام عملية الحذف بأسرع وقت.
              </p>
            </div>
          </section>

          {/* 13. الامتثال لسياسات Google OAuth والتحقق */}
          <section className="mt-8">
            <h2 className="text-base font-black text-[#242628] dark:text-white sm:text-lg">
              الامتثال لسياسات Google OAuth والتحقق
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              نؤكد أن تطبيق "سوق فون" وموقع souqphone.com يلتزمان بطلب الحد الأدنى من الأذونات والصلاحيات اللازمة لتشغيل
              خدمة تسجيل الدخول الآمن، وأن استخدام أي بيانات يتم الحصول عليها من Google يقتصر بدقة على الأغراض المصرح
              بها والموضحة في هذه السياسة.
            </p>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              هذه الصفحة متاحة دائماً للاطلاع العام وتُعتمد كمرجع رسمي أثناء عمليات المراجعة والتحقق الخاصة بـ Google
              OAuth Verification.
            </p>
          </section>

          {/* 14. معلومات التواصل */}
          <section className="mt-8 border-t border-[#eceeed] pt-6 dark:border-[#2e2e2e]">
            <h2 className="flex items-center gap-2 text-base font-black text-[#242628] dark:text-white sm:text-lg">
              <Mail className="h-5 w-5 text-[#078b43]" />
              معلومات التواصل
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#565c60] dark:text-[#c7c7c7]">
              لأي استفسارات بخصوص سياسة الخصوصية، أو ممارسة حقوقك في البيانات، أو أي استفسار يتعلق بالامتثال والأمان:
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold">
              <a
                href="mailto:suoqphone@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f0faf4] px-4 py-2.5 text-[#078b43] transition-colors hover:bg-[#e2f6eb] dark:bg-[#142c1f] dark:text-[#52d688] dark:hover:bg-[#1a3828]"
              >
                <Mail className="h-4 w-4" />
                <span>suoqphone@gmail.com</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2.5 text-[#4f555a] transition-colors hover:bg-[#f5f7f6] dark:border-[#353535] dark:bg-[#202020] dark:text-[#d0d0d0] dark:hover:bg-[#272727]"
              >
                <span>العودة إلى سوق فون</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </section>

          {/* 15. تاريخ آخر تحديث */}
          <div className="mt-8 border-t border-[#eceeed] pt-4 text-xs text-[#8c9499] dark:border-[#2e2e2e] dark:text-[#80868b]">
            <p>آخر تحديث: 24 سبتمبر 2026</p>
          </div>
        </article>
      </div>
    </main>
  );
}
