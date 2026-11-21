import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Smartphone,
  Star,
  Wrench,
} from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import {
  getCachedMaintenanceCenterById,
  normalizeEgyptWhatsApp,
  PERK_LABELS_AR,
} from '@/lib/maintenance-data';
import { absoluteUrl, INDEXABLE_ROBOTS, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 180;

type Props = { params: Promise<{ id: string }> };

function isAllowedImageUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'images.souqphone.com' ||
        parsed.hostname.endsWith('.supabase.co') ||
        parsed.hostname.endsWith('.supabase.in'))
    );
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const center = await getCachedMaintenanceCenterById(decodeURIComponent(id));
  if (!center) {
    return { title: 'مركز الصيانة غير موجود', robots: { index: false, follow: false } };
  }

  const area = center.area_name_ar || center.governorate;
  const title = `${center.name} — صيانة موبايلات في ${area} | ${SITE_NAME}`;
  const description = [
    `${center.name} لصيانة الهواتف في ${area}.`,
    center.warranty_text && center.warranty_text !== 'بدون ضمان' ? center.warranty_text : null,
    center.specialty_titles.length > 0
      ? `التخصصات: ${center.specialty_titles.slice(0, 4).join('، ')}.`
      : null,
    center.detailed_address,
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 160);

  const ogImage = center.cover_url || center.gallery_images[0] || absoluteUrl('/og.png');
  const canonical = `/maintenance/${encodeURIComponent(center.id)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: SITE_NAME,
      locale: 'ar_EG',
      type: 'website',
      images: [{ url: ogImage, alt: center.name }],
    },
  };
}

export default async function MaintenanceCenterDetailPage({ params }: Props) {
  const { id } = await params;
  const center = await getCachedMaintenanceCenterById(decodeURIComponent(id));
  if (!center) notFound();

  const coverSrc = isAllowedImageUrl(center.cover_url)
    ? center.cover_url!
    : isAllowedImageUrl(center.gallery_images[0])
      ? center.gallery_images[0]
      : null;
  const logoSrc = isAllowedImageUrl(center.logo_url) ? center.logo_url! : null;
  const gallery = center.gallery_images.filter((url) => isAllowedImageUrl(url));
  const wa = normalizeEgyptWhatsApp(center.whatsapp_number || center.primary_phone);
  const mapsUrl =
    center.latitude !== null && center.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${center.name} ${center.detailed_address} ${center.governorate}`,
        )}`;

  const centerUrl = `${SITE_URL}/maintenance/${encodeURIComponent(center.id)}`;
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'دليل مراكز الصيانة', item: `${SITE_URL}/maintenance` },
          { '@type': 'ListItem', position: 3, name: center.name, item: centerUrl },
        ],
      },
      {
        '@type': ['LocalBusiness', 'MobilePhoneRepair'],
        '@id': `${centerUrl}#business`,
        name: center.name,
        url: centerUrl,
        description: center.center_bio || `مركز صيانة هواتف معتمد في ${center.area_name_ar || center.governorate}`,
        image: [coverSrc, ...gallery].filter(Boolean),
        telephone: center.primary_phone || undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: center.detailed_address,
          addressLocality: center.area_name_ar || center.governorate,
          addressRegion: center.governorate,
          addressCountry: 'EG',
        },
        ...(center.latitude !== null && center.longitude !== null
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: center.latitude,
                longitude: center.longitude,
              },
            }
          : {}),
        ...(center.average_rating > 0 && center.reviews_count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(center.average_rating.toFixed(1)),
                reviewCount: center.reviews_count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-20 dark:bg-[#0d0d0d]" dir="rtl">
      <JsonLd data={localBusinessSchema} />

      <div className="mx-auto max-w-5xl px-3 pt-4 sm:px-5">
        <nav aria-label="التنقل" className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#6b7280] dark:text-[#9ca3af]">
          <Link href="/" className="hover:text-[#079447]">الرئيسية</Link>
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          <Link href="/maintenance" className="hover:text-[#079447]">دليل الصيانة</Link>
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          <span className="truncate text-[#1f2937] dark:text-white">{center.name}</span>
        </nav>

        {/* Hero Cover Card */}
        <article className="overflow-hidden rounded-[26px] border border-[#e7ece9] bg-white shadow-sm dark:border-[#262c31] dark:bg-[#171b1f]">
          <div className="relative h-56 w-full bg-gradient-to-br from-[#063c24] to-[#0f7447] sm:h-72">
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt={center.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Wrench className="h-16 w-16 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {logoSrc && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg">
                    <Image src={logoSrc} alt={`شعار ${center.name}`} fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-black sm:text-2xl">{center.name}</h1>
                    {center.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black">
                        <CheckCircle2 className="h-3 w-3" />
                        مركز موثق
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-100">
                    <MapPin className="h-3.5 w-3.5 text-amber-300" />
                    {[center.area_name_ar, center.landmark_or_mall, center.governorate]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              </div>

              {center.average_rating > 0 && (
                <div className="hidden shrink-0 items-center gap-1.5 rounded-2xl bg-black/55 px-3 py-2 text-amber-300 backdrop-blur-md sm:flex">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black">{center.average_rating.toFixed(1)}</span>
                  <span className="text-[11px] font-bold text-white/80">({center.reviews_count})</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {/* Direct Contact CTA Row */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {center.primary_phone && (
                <a
                  href={`tel:${center.primary_phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#079447] px-4 py-3 text-sm font-black text-white shadow transition hover:bg-[#067c3b]"
                >
                  <Phone className="h-4 w-4" />
                  اتصال مباشر: {center.primary_phone}
                </a>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow transition hover:brightness-105"
                >
                  <MessageCircle className="h-4 w-4" />
                  تواصل واتساب
                </a>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dfe6e2] bg-[#f8faf9] px-4 py-3 text-sm font-black text-[#1f2937] transition hover:border-[#079447] hover:text-[#079447] dark:border-[#32383e] dark:bg-[#22282d] dark:text-white"
              >
                <Navigation className="h-4 w-4 text-[#079447]" />
                الاتجاهات على الخريطة
              </a>
            </div>

            {/* Info Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#edf1ee] bg-[#fafcfb] p-4 dark:border-[#262c31] dark:bg-[#1e2328]">
                <h2 className="flex items-center gap-2 text-sm font-black text-[#18201c] dark:text-white">
                  <MapPin className="h-4 w-4 text-[#079447]" />
                  العنوان ومواعيد العمل
                </h2>
                <p className="mt-2 text-xs font-bold leading-6 text-[#4b5563] dark:text-[#d1d5db]">
                  {center.detailed_address}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#079447] dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                  {center.working_hours_text}
                </p>
              </div>

              <div className="rounded-2xl border border-[#edf1ee] bg-[#fafcfb] p-4 dark:border-[#262c31] dark:bg-[#1e2328]">
                <h2 className="flex items-center gap-2 text-sm font-black text-[#18201c] dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-[#079447]" />
                  الضمان ومزايا الخدمة
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {center.warranty_text && (
                    <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {center.warranty_text}
                    </span>
                  )}
                  {center.service_perks.map((perk) => (
                    <span
                      key={perk}
                      className="rounded-xl bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                    >
                      {PERK_LABELS_AR[perk] ?? perk}
                    </span>
                  ))}
                  {!center.warranty_text && center.service_perks.length === 0 && (
                    <span className="text-xs font-semibold text-[#6b7280]">
                      تواصل مع المركز للتفاصيل والضمان المتاح
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {center.center_bio && (
              <section className="mt-6">
                <h2 className="text-sm font-black text-[#18201c] dark:text-white">نبذة عن المركز</h2>
                <p className="mt-2 whitespace-pre-line text-xs font-medium leading-7 text-[#4b5563] dark:text-[#cbd5e1] sm:text-sm">
                  {center.center_bio}
                </p>
              </section>
            )}

            {/* Specialties & Supported Brands */}
            {(center.specialty_titles.length > 0 || center.all_brands || center.supported_brands.length > 0) && (
              <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {center.specialty_titles.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-black text-[#18201c] dark:text-white">
                      <Wrench className="h-4 w-4 text-[#079447]" />
                      التخصصات والخدمات
                    </h2>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {center.specialty_titles.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-xl bg-[#f1f5f3] px-3 py-1.5 text-xs font-bold text-[#374151] dark:bg-[#23292e] dark:text-[#e5e7eb]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(center.all_brands || center.supported_brands.length > 0) && (
                  <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-black text-[#18201c] dark:text-white">
                      <Smartphone className="h-4 w-4 text-[#079447]" />
                      الماركات المدعومة
                    </h2>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {center.all_brands ? (
                        <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          جميع الماركات والموديلات
                        </span>
                      ) : (
                        center.supported_brands.map((brand) => (
                          <span
                            key={brand}
                            className="rounded-xl bg-[#f1f5f3] px-3 py-1.5 text-xs font-bold text-[#374151] dark:bg-[#23292e] dark:text-[#e5e7eb]"
                          >
                            {brand}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-black text-[#18201c] dark:text-white">معرض صور المركز</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {gallery.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#e7ece9] bg-[#f3f5f4] dark:border-[#262c31] dark:bg-[#111518]"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${center.name} - صورة ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
