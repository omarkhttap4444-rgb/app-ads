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

interface Category {
  id: string;
  name: string;
}

interface MobilesFiltersWrapperProps {
  categories: Category[];
  initialQ: string;
  initialCategory: string;
  initialLocation: string;
  initialCondition: string;
  initialSort: string;
}

export default function MobilesFiltersWrapper({
  categories,
  initialQ,
  initialCategory,
  initialLocation,
  initialCondition,
  initialSort
}: MobilesFiltersWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUpdateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/mobiles?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (q: string) => {
    handleUpdateFilter('q', q);
  };

  return (
    <div className="space-y-4">
      {/* Top row: Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3.5 rounded-2xl focus-within:border-teal-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
          <Search className="text-slate-400 w-5 h-5 shrink-0" />
          <SmartSearchInput 
            defaultValue={initialQ}
            onSearchSubmit={handleSearchSubmit}
            placeholder="ابحث بالاسم أو الماركة (مثال: ايفون، سامسونج، كابل، شاحن)..."
            className="w-full bg-transparent px-3 py-1 outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
          />
        </div>
        <button 
          onClick={() => handleSearchSubmit(initialQ)}
          className="bg-teal-650 hover:bg-teal-700 active:bg-teal-850 transition-all text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-teal-600/10 cursor-pointer shrink-0"
        >
          بحث ذكي
        </button>
      </div>

      {/* Bottom row: Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        
        {/* Category Select */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> القسم / الفئة
          </span>
          <select 
            value={initialCategory}
            onChange={(e) => handleUpdateFilter('category', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">كل الأقسام</option>
            {categories?.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Location Select */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> المحافظة
          </span>
          <select 
            value={initialLocation}
            onChange={(e) => handleUpdateFilter('location', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">كل المحافظات</option>
            {GOVERNORATES.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>

        {/* Condition Select */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> الحالة
          </span>
          <select 
            value={initialCondition}
            onChange={(e) => handleUpdateFilter('condition', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">كل الحالات</option>
            <option value="جديد">جديد</option>
            <option value="كسر زيرو">كسر زيرو</option>
            <option value="مستعمل">مستعمل</option>
          </select>
        </div>

        {/* Sort Select */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> الترتيب
          </span>
          <select 
            value={initialSort}
            onChange={(e) => handleUpdateFilter('sort', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">المطابقة والصلة (الأحدث)</option>
            <option value="price_asc">السعر: من الأقل للأعلى</option>
            <option value="price_desc">السعر: من الأعلى للأقل</option>
          </select>
        </div>

      </div>
    </div>
  );
}
