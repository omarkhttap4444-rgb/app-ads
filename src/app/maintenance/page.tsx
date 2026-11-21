import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import {
  getCachedMaintenanceDirectory,
  normalizeEgyptWhatsApp,
  PERK_LABELS_AR,
} from '@/lib/maintenance-data';
import { absoluteUrl, INDEXABLE_ROBOTS, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 180;

type SearchParams = Promise<{
  area?: string;
  specialty?: string;
  q?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const areaFilter = (params.area ?? '').trim();
  const hasDynamicQuery = Boolean((params.q ?? '').trim() || (params.specialty ?? '').trim());

  const title = areaFilter
    ? `مراكز صيانة موبايلات في ${areaFilter} - القاهرة | دليل ${SITE_NAME}`
    : `دليل مراكز صيانة الموبايلات المعتمدة في القاهرة | ${SITE_NAME}`;
  const description = areaFilter
    ? `تصفح أفضل مراكز صيانة الهواتف المعتمدة في ${areaFilter} بالقاهرة. تغيير شاشات، بوردة، بطاريات أصلية، ضمان حقيقي وتواصل مباشر بدون وسيط.`
    : 'أكبر دليل موثق لمراكز صيانة الموبايلات في القاهرة (شارع عبد العزيز، مدينة نصر، المعادي، مصر الجديدة وغيرها). قارن التقييمات والضمان وتواصل مباشرة.';

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: areaFilter
        ? `/maintenance?area=${encodeURIComponent(areaFilter)}`
        : '/maintenance',
    },
    robots: hasDynamicQuery ? { index: false, follow: true } : INDEXABLE_ROBOTS,
    openGraph: {
      title,
      description,
      url: absoluteUrl('/maintenance'),
      siteName: SITE_NAME,
      locale: 'ar_EG',
      type: 'website',
      images: [{ url: '/og.png', width: 1731, height: 909, alt: title }],
    },
  };
}

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

export default async function MaintenanceDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const areaQuery = (params.area ?? '').trim();
  const specialtyQuery = (params.specialty ?? '').trim();
  const textQuery = (params.q ?? '').trim().toLowerCase();

  const { centers, areas, specialties } = await getCachedMaintenanceDirectory();

  const filtered = centers.filter((c) => {
    if (areaQuery) {
      const areaHit =
        (c.area_name_ar ?? '').includes(areaQuery) ||
        c.detailed_address.includes(areaQuery) ||
        (c.landmark_or_mall ?? '').includes(areaQuery);
      if (!areaHit) return false;
    }
    if (specialtyQuery) {
      const specHit =
        c.specialty_ids.includes(specialtyQuery) ||
        c.specialty_titles.some((t) => t.includes(specialtyQuery));
      if (!specHit) return false;
    }
    if (textQuery) {
      const haystack = [
        c.name,
        c.area_name_ar ?? '',
        c.landmark_or_mall ?? '',
        c.detailed_address,
        c.center_bio ?? '',
        ...c.specialty_titles,
        ...c.supported_brands,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(textQuery)) return false;
    }
    return true;
  });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'دليل مراكز الصيانة في القاهرة', item: `${SITE_URL}/maintenance` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'دليل مراكز صيانة الموبايلات في القاهرة',
        numberOfItems: filtered.length,
        itemListElement: filtered.slice(0, 24).map((center, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/maintenance/${encodeURIComponent(center.id)}`,
          name: center.name,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f8f8] pb-14 dark:bg-[#0d0d0d]" dir="rtl">
      <JsonLd data={itemListSchema} />

      <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-5 lg:px-6">
        {/* Hero Header */}
        <section className="overflow-hidden rounded-[26px] border border-emerald-500/25 bg-gradient-to-l from-[#053b24] via-[#0a5c39] to-[#0f7a4c] p-5 text-white shadow-lg md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-black text-amber-200">
                <Wrench className="h-3.5 w-3.5" />
                دليل الصيانة المعتمد — القاهرة
              </span>
              <h1 className="mt-2.5 text-xl font-black sm:text-2xl md:text-3xl">
                {areaQuery
                  ? `مراكز صيانة الموبايلات في ${areaQuery}`
                  : 'دليل مراكز صيانة الموبايلات المعتمدة في القاهرة'}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs font-semibold text-emerald-50/90 sm:text-sm">
                ابحث عن أقرب مركز صيانة موثق لتغيير الشاشات، البوردة، البطاريات الأصلية وصيانة آبل وسامسونج وشاومي بتواصل مباشر وضمان واضح.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm">
                <p className="text-xl font-black text-amber-300">{filtered.length}</p>
                <p className="text-[10px] font-bold text-emerald-100">مركز متاح</p>
              </div>
            </div>
          </div>

          {/* Filter Form (GET URL-driven for SEO & shareability) */}
          <form
            action="/maintenance"
            method="GET"
            className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-12"
          >
            <div className="relative sm:col-span-5">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ''}
                placeholder="ابحث باسم المركز، الموديل، أو نوع العطل..."
                className="w-full rounded-xl bg-white py-2.5 pl-3 pr-10 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <select
              name="area"
              defaultValue={areaQuery}
              aria-label="المنطقة"
              className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:col-span-3"
            >
              <option value="">كل مناطق القاهرة</option>
              {areas.map((a) => (
                <option key={a.id} value={a.name_ar}>
                  {a.name_ar}
                </option>
              ))}
            </select>

            <select
              name="specialty"
              defaultValue={specialtyQuery}
              aria-label="التخصص"
              className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:col-span-2"
            >
              <option value="">كل التخصصات</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.title_ar}>
                  {s.title_ar}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-[#1a1400] shadow transition hover:bg-amber-300 sm:col-span-2"
            >
              بحث وتصفية
            </button>
          </form>
        </section>

        {/* Quick Area Pills for SEO Internal Linking */}
        {areas.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/maintenance"
              className={`rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                !areaQuery
                  ? 'bg-[#079447] text-white shadow-sm'
                  : 'border border-[#dfe6e2] bg-white text-[#4b5563] hover:border-[#079447] dark:border-[#32383e] dark:bg-[#1a1e22] dark:text-[#d1d5db]'
              }`}
            >
              الكل ({centers.length})
            </Link>
            {areas.slice(0, 12).map((a) => (
              <Link
                key={a.id}
                href={`/maintenance?area=${encodeURIComponent(a.name_ar)}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  areaQuery === a.name_ar
                    ? 'bg-[#079447] text-white shadow-sm'
                    : 'border border-[#dfe6e2] bg-white text-[#4b5563] hover:border-[#079447] dark:border-[#32383e] dark:bg-[#1a1e22] dark:text-[#d1d5db]'
                }`}
              >
                {a.name_ar}
              </Link>
            ))}
          </div>
        )}

        {/* Centers Grid */}
        {filtered.length > 0 ? (
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((center) => {
              const coverSrc = isAllowedImageUrl(center.cover_url)
                ? center.cover_url!
                : isAllowedImageUrl(center.gallery_images[0])
                  ? center.gallery_images[0]
                  : null;
              const logoSrc = isAllowedImageUrl(center.logo_url) ? center.logo_url! : null;
              const wa = normalizeEgyptWhatsApp(center.whatsapp_number || center.primary_phone);

              return (
                <article
                  key={center.id}
                  className="group flex flex-col overflow-hidden rounded-[22px] border border-[#e7ece9] bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-lg dark:border-[#262c31] dark:bg-[#171b1f]"
                >
                  <Link href={`/maintenance/${encodeURIComponent(center.id)}`} className="block">
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#073d25] to-[#126941]">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={`مركز صيانة ${center.name}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Wrench className="h-12 w-12 text-white/35" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
                        {center.is_featured_active && (
                          <span className="rounded-lg bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-[#1a1400] shadow">
                            ★ مميز
                          </span>
                        )}
                        {center.is_verified && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-black text-white shadow">
                            <CheckCircle2 className="h-3 w-3" />
                            موثق
                          </span>
                        )}
                      </div>

                      {center.average_rating > 0 && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-black text-amber-300 backdrop-blur-md">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {center.average_rating.toFixed(1)}
                          {center.reviews_count > 0 && (
                            <span className="text-[9.5px] font-bold text-white/80">
                              ({center.reviews_count})
                            </span>
                          )}
                        </span>
                      )}

                      {/* Center Logo + Name Overlay */}
                      <div className="absolute bottom-3 right-3 left-3 flex items-center gap-2.5">
                        {logoSrc && (
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-white/80 bg-white shadow">
                            <Image
                              src={logoSrc}
                              alt={`شعار ${center.name}`}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 text-white">
                          <h2 className="truncate text-sm font-black drop-shadow-sm sm:text-base">
                            {center.name}
                          </h2>
                          <p className="flex items-center gap-1 truncate text-[11px] font-bold text-emerald-100">
                            <MapPin className="h-3 w-3 shrink-0 text-amber-300" />
                            {[center.area_name_ar, center.landmark_or_mall]
                              .filter(Boolean)
                              .join(' • ') || center.governorate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    {/* Warranty & Perks */}
                    <div className="flex flex-wrap gap-1.5">
                      {center.warranty_text && center.warranty_text !== 'بدون ضمان' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" />
                          {center.warranty_text}
                        </span>
                      )}
                      {center.service_perks.slice(0, 2).map((perk) => (
                        <span
                          key={perk}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          {PERK_LABELS_AR[perk] ?? perk}
                        </span>
                      ))}
                    </div>

                    {/* Specialties */}
                    {center.specialty_titles.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {center.specialty_titles.slice(0, 3).map((spec) => (
                          <span
                            key={spec}
                            className="rounded-md bg-[#f2f5f3] px-2 py-0.5 text-[10px] font-bold text-[#4b5563] dark:bg-[#23292e] dark:text-[#cbd5e1]"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#6b7280] dark:text-[#9ca3af]">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#079447]" />
                      <span className="truncate">{center.working_hours_text}</span>
                    </p>

                    <div className="mt-4 flex items-center gap-2 border-t border-[#f0f3f1] pt-3 dark:border-[#242a2f]">
                      <Link
                        href={`/maintenance/${encodeURIComponent(center.id)}`}
                        className="flex-1 rounded-xl bg-[#079447] py-2 text-center text-xs font-black text-white transition hover:bg-[#067c3b]"
                      >
                        عرض التفاصيل
                      </Link>
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          واتساب
                        </a>
                      )}
                      {center.primary_phone && (
                        <a
                          href={`tel:${center.primary_phone}`}
                          aria-label={`اتصال بـ ${center.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3e7e5] text-[#4b5563] transition hover:border-[#079447] hover:text-[#079447] dark:border-[#32383e] dark:text-[#d1d5db]"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="mt-8 rounded-3xl border border-[#e7ece9] bg-white py-16 text-center dark:border-[#262c31] dark:bg-[#171b1f]">
            <Wrench className="mx-auto h-12 w-12 text-[#9ca3af]" />
            <h2 className="mt-3 text-base font-black text-[#1f2937] dark:text-white">
              لا توجد مراكز مطابقة للبحث الحالي
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af]">
              جرّب اختيار منطقة أخرى أو مسح فلاتر البحث
            </p>
            <Link
              href="/maintenance"
              className="mt-4 inline-flex rounded-xl bg-[#079447] px-5 py-2.5 text-xs font-black text-white"
            >
              عرض جميع المراكز
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
