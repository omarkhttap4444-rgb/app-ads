'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Building2, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Suggestion {
  text: string;
  type: 'category' | 'brand' | 'product';
}

export default function SmartSearchInput({ 
  defaultValue = '', 
  onSearchSubmit,
  placeholder = 'ابحث عن موبايل (مثال: آيفون 13 برو ماكس)...',
  className = 'w-full bg-transparent px-3 py-1 outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-650 text-sm'
}: { 
  defaultValue?: string; 
  onSearchSubmit?: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync with defaultValue
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const getCountryFromCookie = () => {
          if (typeof window === 'undefined') return 'SA';
          const match = document.cookie.match(/(^|;)\s*selected_country\s*=\s*([^;]+)/);
          return match ? match[2] : 'SA';
        };

        const country = getCountryFromCookie();
        let dbQuery = supabase
          .from('products')
          .select('name, category, specifications');

        if (country === 'SA') {
          const saudiRegions = ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'];
          const orConditions = saudiRegions.map(region => `location.ilike.${region}%`).join(',');
          dbQuery = dbQuery.or(orConditions);
        } else {
          const egyptGovernorates = [
            'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
            'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
            'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
            'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
            'مطروح', 'شمال سيناء', 'جنوب سيناء'
          ];
          const orConditions = egyptGovernorates.map(gov => `location.ilike.${gov}%`).join(',');
          dbQuery = dbQuery.or(orConditions);
        }

        dbQuery = dbQuery.or(`name.ilike.%${query}%,category.ilike.%${query}%,specifications->>brand.ilike.%${query}%`);

        const { data, error } = await dbQuery.limit(15);

        if (!error && data) {
          const uniqueSuggestions: Suggestion[] = [];
          const seen = new Set<string>();

          data.forEach(item => {
            const brand = item.specifications?.brand;
            const category = item.category;

            // Check brand match
            if (brand && brand.toLowerCase().includes(query.toLowerCase())) {
              const brandText = brand.trim();
              if (!seen.has(`brand:${brandText.toLowerCase()}`)) {
                seen.add(`brand:${brandText.toLowerCase()}`);
                uniqueSuggestions.push({ text: brandText, type: 'brand' });
              }
            }

            // Check category match
            if (category && category.toLowerCase().includes(query.toLowerCase())) {
              const catText = category.trim();
              if (!seen.has(`category:${catText.toLowerCase()}`)) {
                seen.add(`category:${catText.toLowerCase()}`);
                uniqueSuggestions.push({ text: catText, type: 'category' });
              }
            }

            // Check product name match
            const prodName = item.name.trim();
            if (prodName.toLowerCase().includes(query.toLowerCase())) {
              if (!seen.has(`product:${prodName.toLowerCase()}`)) {
                seen.add(`product:${prodName.toLowerCase()}`);
                uniqueSuggestions.push({ text: prodName, type: 'product' });
              }
            }
          });

          // Limit and sort: categories first, then brands, then products
          const sorted = uniqueSuggestions
            .sort((a, b) => {
              const order = { category: 1, brand: 2, product: 3 };
              return order[a.type] - order[b.type];
            })
            .slice(0, 6);

          setSuggestions(sorted);
        }
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      router.push(`/mobiles?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setQuery(suggestionText);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(suggestionText);
    } else {
      router.push(`/mobiles?q=${encodeURIComponent(suggestionText)}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 w-full">
      <div className="flex-1 flex items-center bg-transparent w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={className}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
        {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin ml-2 shrink-0" />}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute right-0 left-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 text-right">
          {suggestions.map((suggestion, idx) => {
            const Icon = suggestion.type === 'category' 
              ? Tag 
              : suggestion.type === 'brand' 
                ? Building2 
                : Smartphone;
            const typeLabel = suggestion.type === 'category' 
              ? 'فئة' 
              : suggestion.type === 'brand' 
                ? 'علامة' 
                : 'منتج';
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-right cursor-pointer border-none bg-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{suggestion.text}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md">
                  {typeLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
