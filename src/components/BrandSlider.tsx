import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { buildMobilesLandingPath, SEO_BRANDS } from '@/lib/seo-content';

export default function BrandSlider() {
  return (
    <section className="mt-7 overflow-hidden rounded-[26px] border border-[#e7e9ec] bg-white px-3 py-5 shadow-[0_12px_34px_-28px_rgba(16,24,40,0.32)] dark:border-[#343434] dark:bg-[#1a1a1a] md:px-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-[#12b95f]" />
            <h2 className="text-sm font-black text-[#242628] dark:text-white md:text-base">
              أشهر الماركات
            </h2>
          </div>
          <p className="mr-3 mt-1 text-[9px] font-bold text-[#92989c] md:text-[10px]">
            اختار ماركتك المفضلة
          </p>
        </div>
        <Link href="/mobiles" className="flex items-center gap-1 text-[10px] font-black text-[#079447] md:text-xs">
          عرض الكل
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="scroll-hide flex gap-3 overflow-x-auto pb-1">
        {SEO_BRANDS.map((brand) => (
          <Link key={brand.name} href={buildMobilesLandingPath({ brand: brand.name })} className="group flex h-[86px] w-[94px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[#eceeed] bg-[#f8f9f8] p-3 transition hover:-translate-y-0.5 hover:border-[#9ce5ba] hover:bg-[#f2fff6] dark:border-[#343434] dark:bg-[#242424] dark:hover:border-[#315d43] dark:hover:bg-[#1d3024] md:h-[96px] md:w-[108px]">
            <span className="flex h-9 w-14 items-center justify-center rounded-xl bg-white px-2 shadow-sm dark:bg-[#eeeeee]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/brands/${brand.logo}`} alt={brand.name} className="max-h-6 max-w-full object-contain" />
            </span>
            <span className="text-[10px] font-black text-[#4f555a] transition group-hover:text-[#078d45] dark:text-[#d3d3d3]">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
