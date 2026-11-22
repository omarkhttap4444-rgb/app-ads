'use client';

import type React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { EGYPT_GOVERNORATES, EGYPT_CENTERS, SAUDI_REGIONS, SAUDI_CITIES } from '@/lib/locations';

export interface ImagesUploadSectionProps {
  imagePreviews: string[];
  imageCount: number;
  maxImages: number;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export function ImagesUploadSection({
  imagePreviews,
  imageCount,
  maxImages,
  onImageChange,
  onRemoveImage,
}: ImagesUploadSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      <h2 className="text-base font-extrabold text-slate-800 dark:text-white">صور الهاتف (4 صور كحد أقصى)</h2>
      <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">إضافة صور حقيقية واضحة تزيد من فرصة بيع موبايلك بسرعة</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {imagePreviews.map((preview, index) => (
          <div key={index} className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="معاينة" className="object-cover w-full h-full" />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {imageCount < maxImages && (
          <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#00C853] dark:hover:border-[#00C853] bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 dark:text-slate-500 gap-1.5">
            <ImageIcon className="w-6 h-6 stroke-[1.5px]" />
            <span className="text-[10px] font-bold">أضف صورة</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={onImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

export interface FinanceLocationSectionProps {
  selectedCountry: string;
  price: string;
  setPrice: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  center: string;
  setCenter: (val: string) => void;
  isNegotiable: boolean;
  setIsNegotiable: (val: boolean) => void;
  hasDelivery: boolean;
  setHasDelivery: (val: boolean) => void;
}

export function FinanceLocationSection({
  selectedCountry,
  price,
  setPrice,
  location,
  setLocation,
  center,
  setCenter,
  isNegotiable,
  setIsNegotiable,
  hasDelivery,
  setHasDelivery,
}: FinanceLocationSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      <h2 className="text-base font-extrabold text-slate-800 dark:text-white">الموقع، السعر وتفاصيل الشحن</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">السعر المطلوب ({selectedCountry === 'SA' ? 'ريال' : 'جنيه'})</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="مثال: 12500"
            required
            min={1}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655"
          />
        </div>

        {/* Location Governorate */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCountry === 'SA' ? 'المنطقة' : 'المحافظة'}</label>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setCenter('');
            }}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
          >
            {(selectedCountry === 'SA' ? SAUDI_REGIONS : EGYPT_GOVERNORATES).map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>

        {/* Location Center/District - dropdown bound to the selected governorate (same lists as the app) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCountry === 'SA' ? 'المدينة / الحي' : 'المركز / الحي (المدينة)'}</label>
          <select
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
          >
            <option value="" disabled>
              {selectedCountry === 'SA' ? 'اختر المدينة / الحي' : 'اختر المركز / الحي'}
            </option>
            {(selectedCountry === 'SA'
              ? (SAUDI_CITIES[location] ?? [])
              : (EGYPT_CENTERS[location] ?? [])
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Price Negotiable Option */}
        <div className="flex items-center gap-2 py-3.5">
          <input
            type="checkbox"
            id="negotiable"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className="w-4 h-4 text-[#00A344] focus:ring-[#00C853] dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
          />
          <label htmlFor="negotiable" className="text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer">
            السعر قابل للتفاوض البسيط
          </label>
        </div>

        {/* Delivery Option */}
        <div className="flex items-center gap-2 py-1 sm:col-span-2">
          <input
            type="checkbox"
            id="delivery"
            checked={hasDelivery}
            onChange={(e) => setHasDelivery(e.target.checked)}
            className="w-4 h-4 text-[#00A344] focus:ring-[#00C853] dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
          />
          <label htmlFor="delivery" className="text-xs font-bold text-slate-655 dark:text-slate-350 cursor-pointer">
            يتوفر الشحن أو التوصيل للمحافظات
          </label>
        </div>
      </div>
    </div>
  );
}

export interface HonestyModalProps {
  loading: boolean;
  preparingImages: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function HonestyModal({
  loading,
  preparingImages,
  onCancel,
  onConfirm,
}: HonestyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-center transform scale-100 transition-all duration-300">
        {/* Flower icon and title */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl animate-pulse select-none">🌸</span>
          <h3 className="text-xl font-black text-slate-800 dark:text-white pt-2">تذكير أخلاقي</h3>
        </div>

        {/* Honesty Sentence */}
        <div className="py-2.5 px-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
          <p className="text-lg font-black text-amber-700 dark:text-amber-450 leading-relaxed">
            كن صادقاً في تجارتك تتيسر حياتك
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          يرجى التعهد التام بأن كافة المواصفات المذكورة، والصور المرفقة، وحالة المكونات حقيقية وتعبر بدقة عن حالة الهاتف المعروض للبيع دون تستر على أي عيوب.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || preparingImages}
            className="flex-1 bg-gradient-to-r from-[#00C853] to-[#00A344] hover:from-[#00A344] hover:to-[#008C39] text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-md shadow-[#00A344]/20 hover:shadow-lg cursor-pointer"
          >
            أوافق وأنشر
          </button>
        </div>
      </div>
    </div>
  );
}
