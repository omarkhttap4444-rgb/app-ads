'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Tag, Smartphone } from 'lucide-react';
import SmartSearchInput from './SmartSearchInput';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
  'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

const SAUDI_REGIONS = [
  'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم',
  'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'
];

interface Category { id: string; name: string; }

interface MobilesFiltersWrapperProps {
  categories: Category[];
  initialQ: string;
  initialCategory: string;
  initialLocation: string;
  initialCondition: string;
  initialSort: string;
  selectedCountry?: string; // 👈 New prop!
}

export default function MobilesFiltersWrapper({
  categories, initialQ, initialCategory, initialLocation, initialCondition, initialSort, selectedCountry = 'SA'
}: MobilesFiltersWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUpdateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/mobiles?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (q: string) => handleUpdateFilter('q', q);

  const selectClass = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/10 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer appearance-none";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus-within:border-ocean-500 focus-within:ring-2 focus-within:ring-ocean-500/10 transition-all">
          <Search className="text-slate-400 w-4.5 h-4.5 shrink-0" />
          <SmartSearchInput 
            defaultValue={initialQ}
            onSearchSubmit={handleSearchSubmit}
            placeholder="ابحث بالاسم أو الماركة..."
            className="w-full bg-transparent px-3 py-0.5 outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          />
        </div>
        <button 
          onClick={() => handleSearchSubmit(initialQ)}
          className="bg-ocean-600 hover:bg-ocean-500 active:bg-ocean-700 text-white px-6 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm shadow-ocean-600/15 shrink-0"
        >
          بحث ذكي
        </button>
      </div>

      {/* ══════ ELEGANT HORIZONTAL APP DOWNLOAD BANNER ══════ */}
      <div className="animate-fadeIn">
        <Link 
          href="https://play.google.com/store/apps/details?id=com.souqphone.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-ocean-50/80 to-blue-50/20 dark:from-ocean-950/30 dark:to-transparent border border-ocean-100/80 dark:border-ocean-900/40 hover:border-ocean-300 dark:hover:border-ocean-800 rounded-xl px-5 py-3 transition-all duration-300 cursor-pointer shadow-xs gap-3 group"
        >
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-ocean-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-ocean-600/15 group-hover:scale-105 transition-transform duration-300">
              <Smartphone className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>حمّل تطبيق سوق فون الآن مجاناً</span>
                <span className="bg-ocean-100 dark:bg-ocean-950/50 text-ocean-700 dark:text-ocean-400 text-[9px] px-2 py-0.5 rounded-full font-bold">نسخة الأندرويد</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                تصفح أسرع، تواصل مباشر مع البائعين، وإشعارات فورية بكل جديد!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-ocean-600 hover:bg-ocean-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm shadow-ocean-600/20 cursor-pointer group-hover:shadow-md group-hover:shadow-ocean-600/25 shrink-0">
            <svg viewBox="0 0 512 512" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1L375 137.4l97.2 55.7c21.8 12.5 21.8 35 0 47.5zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
            </svg>
            <span>تثبيت التطبيق السريع</span>
          </div>
        </Link>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3" /> القسم
          </span>
          <select value={initialCategory} onChange={(e) => handleUpdateFilter('category', e.target.value)} className={selectClass}>
            <option value="">كل الأقسام</option>
            {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {selectedCountry === 'SA' ? 'المنطقة' : 'المحافظة'}
          </span>
          <select value={initialLocation} onChange={(e) => handleUpdateFilter('location', e.target.value)} className={selectClass}>
            <option value="">{selectedCountry === 'SA' ? 'كل المناطق' : 'كل المحافظات'}</option>
            {(selectedCountry === 'SA' ? SAUDI_REGIONS : GOVERNORATES).map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> الحالة
          </span>
          <select value={initialCondition} onChange={(e) => handleUpdateFilter('condition', e.target.value)} className={selectClass}>
            <option value="">كل الحالات</option>
            <option value="جديد">جديد</option>
            <option value="كسر زيرو">كسر زيرو</option>
            <option value="مستعمل">مستعمل</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> الترتيب
          </span>
          <select value={initialSort} onChange={(e) => handleUpdateFilter('sort', e.target.value)} className={selectClass}>
            <option value="">الأحدث</option>
            <option value="price_asc">السعر: الأقل أولاً</option>
            <option value="price_desc">السعر: الأعلى أولاً</option>
          </select>
        </div>
      </div>
    </div>
  );
}
