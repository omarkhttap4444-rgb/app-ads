'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';
import SmartSearchInput from './SmartSearchInput';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
  'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

interface Category { id: string; name: string; }

interface MobilesFiltersWrapperProps {
  categories: Category[];
  initialQ: string;
  initialCategory: string;
  initialLocation: string;
  initialCondition: string;
  initialSort: string;
}

export default function MobilesFiltersWrapper({
  categories, initialQ, initialCategory, initialLocation, initialCondition, initialSort
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
            <MapPin className="w-3 h-3" /> المحافظة
          </span>
          <select value={initialLocation} onChange={(e) => handleUpdateFilter('location', e.target.value)} className={selectClass}>
            <option value="">كل المحافظات</option>
            {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
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
