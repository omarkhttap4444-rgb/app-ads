import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { HomeCustomSection } from '@/lib/home-data';

const THEME_STYLES: Record<
  HomeCustomSection['themeColor'],
  {
    wrapper: string;
    accentBar: string;
    badge: string;
  }
> = {
  emerald: {
    wrapper:
      'border-emerald-500/20 bg-gradient-to-br from-[#f2fbf6] via-white to-[#f7fcf9] dark:border-emerald-500/25 dark:from-[#0c1f17] dark:via-[#11261d] dark:to-[#16291e]',
    accentBar: 'bg-emerald-500',
    badge: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300',
  },
  amber: {
    wrapper:
      'border-amber-500/25 bg-gradient-to-br from-[#fffbeb] via-white to-[#fef9e7] dark:border-amber-500/25 dark:from-[#211a0c] dark:via-[#1b160d] dark:to-[#17130d]',
    accentBar: 'bg-amber-500',
    badge: 'bg-amber-500/20 text-amber-900 dark:text-amber-300',
  },
  rose: {
    wrapper:
      'border-rose-500/20 bg-gradient-to-br from-[#fff1f2] via-white to-[#fff5f6] dark:border-rose-500/25 dark:from-[#231015] dark:via-[#1c1114] dark:to-[#181013]',
    accentBar: 'bg-rose-500',
    badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
  },
  sky: {
    wrapper:
      'border-sky-500/20 bg-gradient-to-br from-[#f0f9ff] via-white to-[#f5fbff] dark:border-sky-500/25 dark:from-[#0d1c27] dark:via-[#111e28] dark:to-[#111c24]',
    accentBar: 'bg-sky-500',
    badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  },
  violet: {
    wrapper:
      'border-violet-500/20 bg-gradient-to-br from-[#f5f3ff] via-white to-[#faf8ff] dark:border-violet-500/25 dark:from-[#191229] dark:via-[#171323] dark:to-[#14111f]',
    accentBar: 'bg-violet-500',
    badge: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  },
};

function isAllowedBannerImage(url: string): boolean {
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

export default function HomeCustomSectionRail({
  section,
}: {
  section: HomeCustomSection;
}) {
  if (!section.products.length) return null;
  const theme = THEME_STYLES[section.themeColor] ?? THEME_STYLES.emerald;
  const hasSafeBanner = section.imageUrl && isAllowedBannerImage(section.imageUrl);

  return (
    <section
      className={`mt-6 overflow-hidden rounded-[26px] border p-4 shadow-[0_12px_28px_-20px_rgba(16,24,40,0.2)] md:p-6 ${theme.wrapper}`}
    >
      {hasSafeBanner && (
        <div className="relative mb-4 aspect-[16/5] w-full overflow-hidden rounded-2xl bg-black/5 sm:aspect-[22/5]">
          <Image
            src={section.imageUrl}
            alt={section.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`h-6 w-1.5 rounded-full ${theme.accentBar}`} />
          <h2 className="text-base font-black text-[#18201c] dark:text-white md:text-xl">
            {section.title}
          </h2>
          {section.badgeText && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${theme.badge}`}
            >
              <Sparkles className="h-3 w-3" />
              {section.badgeText}
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold text-[#6b7280] dark:text-[#9ca3af]">
          {section.products.length} عرض
        </span>
      </div>

      <div className="scroll-hide flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2">
        {section.products.map((product) => (
          <div
            key={`${section.id}-${product.id}`}
            className="w-[calc(50%-7px)] min-w-[168px] shrink-0 snap-start sm:w-[215px] md:w-[235px]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
