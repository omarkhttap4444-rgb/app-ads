'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  getModelGroupsForBrand,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
  PHONE_COLORS,
  ACCESSORIES_OPTIONS,
  type PhoneCatalog,
} from '@/lib/phone-data';

export interface PhoneSpecsSectionProps {
  catalog: PhoneCatalog;
  brand: string;
  setBrand: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  customModel: string;
  setCustomModel: (val: string) => void;
  storage: string;
  setStorage: (val: string) => void;
  ram: string;
  setRam: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  batteryHealth: number;
  setBatteryHealth: (val: number) => void;
  condition: string;
  isDeviceOpened: string;
  setIsDeviceOpened: (val: string) => void;
  selectedCountry: string;
  ntraTax: string;
  setNtraTax: (val: string) => void;
  selectedAccessory: string | null;
  onAccessoryChange: (label: string) => void;
  showOptional: boolean;
  setShowOptional: (val: boolean) => void;
  cpu: string;
  setCpu: (val: string) => void;
  batteryCapacity: string;
  setBatteryCapacity: (val: string) => void;
  warranty: string;
  setWarranty: (val: string) => void;
  acceptsExchange: string;
  setAcceptsExchange: (val: string) => void;
}

export function PhoneSpecsSection({
  catalog,
  brand,
  setBrand,
  model,
  setModel,
  customModel,
  setCustomModel,
  storage,
  setStorage,
  ram,
  setRam,
  color,
  setColor,
  batteryHealth,
  setBatteryHealth,
  condition,
  isDeviceOpened,
  setIsDeviceOpened,
  selectedCountry,
  ntraTax,
  setNtraTax,
  selectedAccessory,
  onAccessoryChange,
  showOptional,
  setShowOptional,
  cpu,
  setCpu,
  batteryCapacity,
  setBatteryCapacity,
  warranty,
  setWarranty,
  acceptsExchange,
  setAcceptsExchange,
}: PhoneSpecsSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      <h2 className="text-base font-extrabold text-slate-800 dark:text-white">المواصفات الفنية للهاتف</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Brand */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الماركة (المصنع)</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
          >
            {catalog.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Model - grouped by series, same grouping as the app */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الموديل</label>
          {brand !== 'أخرى' ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
            >
              {getModelGroupsForBrand(brand, catalog.modelsByBrand[brand] ?? []).map((group) => (
                <optgroup key={group.title} label={group.title}>
                  {group.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="أخرى">أخرى</option>
            </select>
          ) : (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="أدخل موديل الهاتف يدوياً"
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          )}
        </div>

        {/* Show custom model input if 'أخرى' is chosen */}
        {brand !== 'أخرى' && model === 'أخرى' && (
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">اسم الموديل المخصص</label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="مثال: جالاكسي نوت 10 بلس"
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        )}

        {/* Storage */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">حجم الذاكرة (Storage)</label>
          <select
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
          >
            {STORAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '1 تيرا' ? '1 تيرا' : `${opt} جيجا`}
              </option>
            ))}
          </select>
        </div>

        {/* RAM */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">حجم الرام (RAM)</label>
          <select
            value={ram}
            onChange={(e) => setRam(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
          >
            {RAM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} جيجا
              </option>
            ))}
          </select>
        </div>

        {/* Color - swatches with the same fixed list as the app */}
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">لون الهاتف</label>
          <div className="flex flex-wrap gap-2.5">
            {PHONE_COLORS.map((c) => {
              const isSelected = color === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(isSelected ? '' : c.name)}
                  title={c.name}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00C853]/10 border-[#00C853] text-[#00A344]'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/15"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Battery Health (Shown only for Apple devices) */}
        {brand === 'آبل' && (
          <div className="space-y-1.5 flex flex-col justify-center">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>نسبة صحة البطارية</span>
              <span className="text-[#00A344] dark:text-[#2EE06F] font-extrabold">{batteryHealth}%</span>
            </label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="range"
                min="40"
                max="100"
                value={batteryHealth}
                onChange={(e) => setBatteryHealth(Number(e.target.value))}
                className="w-full accent-[#00C853] h-2 bg-slate-100 dark:bg-slate-850 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Device Opened? (Shown only for non-new condition) */}
        {condition !== 'جديد' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل الجهاز مفتوح أو تم صيانته؟</label>
            <select
              value={isDeviceOpened}
              onChange={(e) => setIsDeviceOpened(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
            >
              <option value="لا">لا (بحالة المصنع الأصلي)</option>
              <option value="نعم">نعم (تم فتحه أو عمل صيانة)</option>
            </select>
          </div>
        )}

        {/* NTRA Customs Tax Paid? */}
        {selectedCountry === 'EG' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل الهاتف مسجل / مدفوع ضريبة الجمارك NTRA؟</label>
            <select
              value={ntraTax}
              onChange={(e) => setNtraTax(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
            >
              <option value="لا">لا (غير مسجل بالشبكة المصرية / دولي)</option>
              <option value="نعم">نعم (مسجل / محلي مدفوع الضريبة)</option>
            </select>
          </div>
        )}

        {/* Accessories Checklist */}
        <div className="sm:col-span-2 space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الملحقات المتوفرة مع الهاتف</label>
          <div className="flex flex-wrap gap-2.5">
            {ACCESSORIES_OPTIONS.map((acc) => {
              const isSelected = selectedAccessory === acc;
              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => onAccessoryChange(acc)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00C853]/10 border-[#00C853] text-[#00A344]'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {acc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optional Tech Specs Accordion Toggle */}
      <div className="pt-4 border-t border-slate-50 dark:border-slate-850">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center justify-between w-full py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-[#00A344] dark:hover:text-[#2EE06F] transition-colors"
        >
          <span>مواصفات إضافية اختيارية (المعالج، سعة البطارية، الضمان، البدل...)</span>
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptional && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800 animate-fadeIn">
            {/* CPU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">المعالج / CPU (اختياري)</label>
              <input
                type="text"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                placeholder="مثال: Apple A16 Bionic / Snapdragon 8 Gen 2"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650"
              />
            </div>

            {/* Battery Capacity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">سعة البطارية (mAh) (اختياري)</label>
              <input
                type="number"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(e.target.value)}
                placeholder="مثال: 5000"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655"
              />
            </div>

            {/* Warranty */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل الهاتف في فترة الضمان؟</label>
              <select
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
              >
                <option value="لا">لا</option>
                <option value="نعم">نعم (الضمان لا يزال ساري)</option>
              </select>
            </div>

            {/* Exchange Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل تقبل البدل بجهاز آخر؟</label>
              <select
                value={acceptsExchange}
                onChange={(e) => setAcceptsExchange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
              >
                <option value="لا">لا (بيع فقط)</option>
                <option value="نعم">نعم (مستعد للمناقشة للبدل)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
