'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Image as ImageIcon, X, AlertCircle, Sparkles, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import { EGYPT_GOVERNORATES, EGYPT_CENTERS, SAUDI_REGIONS, SAUDI_CITIES } from '@/lib/locations';
import {
  fetchPhoneCatalog,
  getModelGroupsForBrand,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
  PHONE_COLORS,
  ACCESSORIES_OPTIONS,
  type PhoneCatalog,
} from '@/lib/phone-data';
import { compressImage } from '@/lib/image-compress';

// Same limit as the Flutter app (regular user: max 4 images)
const MAX_IMAGES = 4;

// App visual identity (lib/config/brand_colors.dart)
const GREEN_PRIMARY = '#00C853';
const GREEN_DARK = '#00A344';

export default function AddProductPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('مستعمل');
  const [location, setLocation] = useState(EGYPT_GOVERNORATES[0]);
  const [center, setCenter] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('EG'); // Default to EG

  useEffect(() => {
    const country = document.cookie.match(/(^|;)\s*selected_country\s*=\s*([^;]+)/)?.[2] || localStorage.getItem('selected_country') || 'EG';
    setSelectedCountry(SAUDI_MARKET_ENABLED && country === 'SA' ? 'SA' : 'EG');
  }, []);

  useEffect(() => {
    const list = selectedCountry === 'SA' ? SAUDI_REGIONS : EGYPT_GOVERNORATES;
    setLocation(list[0]);
    setCenter('');
  }, [selectedCountry]);
  
  // Mobiles Specifications (catalog loaded from the same Supabase tables as the app)
  const [catalog, setCatalog] = useState<PhoneCatalog>({ brands: [], modelsByBrand: {} });
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [storage, setStorage] = useState('128'); // Default 128GB
  const [ram, setRam] = useState('6'); // Default 6GB
  const [color, setColor] = useState('');
  const [batteryHealth, setBatteryHealth] = useState(100);
  const [isDeviceOpened, setIsDeviceOpened] = useState('لا');
  const [ntraTax, setNtraTax] = useState('لا');
  const [selectedAccessory, setSelectedAccessory] = useState<string | null>(null);
  
  // Optional Specifications (Accordion)
  const [showOptional, setShowOptional] = useState(false);
  const [cpu, setCpu] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [warranty, setWarranty] = useState('لا');
  const [acceptsExchange, setAcceptsExchange] = useState('لا');

  // Image files uploading state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Honesty Modal State
  const [showHonestyModal, setShowHonestyModal] = useState(false);

  // 1. Auth check & Fetch Categories
  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/mobiles/add');
        return;
      }
      setUser(session.user);

      // Fetch user profile name/avatar & subscription status
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (userProfile) setProfile(userProfile);

      // Fetch active categories
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!catErr && cats) {
        setCategories(cats);
        // Pre-select first category ID
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      }

      // Fetch phone brands/models from the same tables the app uses
      const phoneCatalog = await fetchPhoneCatalog();
      setCatalog(phoneCatalog);
      setBrand((prev) => prev || phoneCatalog.brands[0] || '');
      setLoadingConfig(false);
    };

    initPage();
  }, [router]);

  // Set default model on brand changes (from dynamic catalog)
  useEffect(() => {
    if (!brand) return;
    const models = catalog.modelsByBrand[brand] ?? [];
    setModel(models.length > 0 ? models[0] : 'أخرى');
  }, [brand, catalog]);

  // Handle local file preview (with client-side compression like the app)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Limit to 4 images (same as the Flutter app); accept only what fits
      const remaining = MAX_IMAGES - imageFiles.length;
      if (remaining <= 0) {
        setErrorMsg('الحد الأقصى المسموح به هو 4 صور فقط.');
        return;
      }
      const accepted = filesArray.slice(0, remaining);
      if (accepted.length < filesArray.length) {
        setErrorMsg('الحد الأقصى المسموح به هو 4 صور فقط.');
      } else {
        setErrorMsg(null);
      }

      // Compress before adding (resize + JPEG quality) to save storage
      const compressed = await Promise.all(accepted.map((f) => compressImage(f)));
      setImageFiles((prev) => [...prev, ...compressed]);

      const previews = compressed.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  // Remove local file preview
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Accessories: single-select chips (same behavior as the app)
  const handleAccessoryChange = (label: string) => {
    setSelectedAccessory((prev) => (prev === label ? null : label));
  };

  // Click Submit - Validation and trigger Honesty Modal
  const onSubmitPress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const centersOptions = selectedCountry === 'SA'
      ? (SAUDI_CITIES[location] ?? [])
      : (EGYPT_CENTERS[location] ?? []);

    // Location validation: district must belong to the selected governorate
    if (!centersOptions.includes(center.trim())) {
      setErrorMsg('يرجى اختيار مركز صحيح تابع للمحافظة المحددة');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Image check
    if (imageFiles.length === 0) {
      setErrorMsg('الرجاء إضافة صورة واحدة على الأقل لجهازك.');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Title validation for non-mobiles
    const selectedCat = categories.find((c) => c.id === categoryId);
    const isMobiles = selectedCat?.name === 'هواتف';

    // Phone specs validation (same order & messages as the app's honesty dialog)
    if (isMobiles) {
      if (!brand || brand.trim().length === 0) {
        setErrorMsg('يرجى اختيار ماركة الهاتف');
        return;
      }
      if (brand !== 'أخرى' && (!model || model.length === 0)) {
        setErrorMsg('يرجى اختيار موديل الهاتف');
        return;
      }
      if ((brand === 'أخرى' || model === 'أخرى') && customModel.trim().length === 0) {
        setErrorMsg('يرجى كتابة اسم موديل الهاتف يدوياً');
        return;
      }
    } else if (name.trim().length < 3) {
      setErrorMsg('يرجى كتابة عنوان واضح للإعلان (3 أحرف على الأقل).');
      return;
    }

    // Description validation
    if (description.trim().length < 10) {
      setErrorMsg('يرجى كتابة وصف تفصيلي للمنتج (10 أحرف على الأقل).');
      return;
    }

    // Trigger Honesty Modal
    setShowHonestyModal(true);
  };

  // Real Submit Listing after Honesty Confirmation
  const confirmAndPublish = async () => {
    setShowHonestyModal(false);
    if (loading) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const isMobiles = selectedCategory?.name === 'هواتف';
      
      const resolvedModelName = (brand === 'أخرى' || model === 'أخرى') ? customModel.trim() : model;

      // 72-hour duplicate model posting cooldown check for normal users
      const isSubscribed = profile?.is_subscribed || false;
      if (!isSubscribed && isMobiles && resolvedModelName) {
        const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        
        const { data: recentProducts, error: recentErr } = await supabase
          .from('products')
          .select('id, created_at, specifications')
          .eq('seller_id', user.id)
          .eq('category', 'هواتف')
          .gt('created_at', seventyTwoHoursAgo);
          
        if (!recentErr && recentProducts) {
          const duplicate = recentProducts.find((p: any) => {
            const productModel = p.specifications?.model || '';
            return productModel.trim().toLowerCase() === resolvedModelName.trim().toLowerCase();
          });
          
          if (duplicate) {
            const createdDate = new Date(duplicate.created_at);
            const hoursPassed = Math.floor((Date.now() - createdDate.getTime()) / (60 * 60 * 1000));
            const hoursRemaining = 72 - hoursPassed;
            setErrorMsg(`عذراً، لا يمكنك تكرار نشر نفس الموديل (${resolvedModelName}) إلا بعد مرور 72 ساعة. المتبقي: ${hoursRemaining} ساعة تقريباً.`);
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }

      // Build specifications JSON
      const specifications: Record<string, any> = {
        category_id: categoryId,
        category_name: selectedCategory?.name || 'هواتف',
        classification: selectedCategory?.name || 'هواتف',
        category: selectedCategory?.name || 'هواتف',
        delivery: hasDelivery,
        hasDelivery: hasDelivery
      };

      if (isMobiles) {
        // Same specification keys/values the Flutter app submits
        specifications.brand = brand;
        specifications.model = resolvedModelName || 'غير محدد';
        specifications.model_is_custom = brand === 'أخرى' || model === 'أخرى';
        specifications.ram = ram;           // raw value e.g. '6' (app parity)
        specifications.storage = storage;   // raw value e.g. '128' | '1 تيرا'
        specifications.color = color.trim() || 'غير محدد';
        specifications.accessories = selectedAccessory ?? 'بدون ملحقات';
        specifications.is_opened = isDeviceOpened;
        if (selectedCountry === 'EG') {
          specifications.ntra_tax = ntraTax;
        }

        if (brand === 'آبل') {
          specifications.battery_health = Math.round(batteryHealth);
        }

        // Optional technical specs
        if (cpu.trim()) specifications.cpu = cpu.trim();
        if (batteryCapacity.trim()) specifications.battery_capacity = batteryCapacity.trim();
        specifications.warranty = warranty;
        specifications.accepts_exchange = acceptsExchange;
      }

      // Build automatic phone title
      const finalTitle = isMobiles 
        ? `${brand} رام ${ram} ${resolvedModelName}`.trim()
        : name.trim();

      // 1. Insert product listing
      const { data: newProduct, error: productErr } = await supabase
        .from('products')
        .insert({
          name: finalTitle,
          description: description.trim(),
          price: price ? parseFloat(price) : 0,
          category: selectedCategory?.name || 'هواتف',
          category_id: categoryId,
          specifications,
          seller_id: user.id,
          seller_name: profile?.name || user.email,
          seller_avatar: profile?.profile_image_url || null,
          is_negotiable: isNegotiable,
          condition,
          location: center.trim() ? `${location} - ${center.trim()}` : location
        })
        .select()
        .single();

      if (productErr || !newProduct) {
        console.error('Product insertion error:', productErr);
        setErrorMsg(productErr?.message || 'فشل إدراج الإعلان في قاعدة البيانات.');
        setLoading(false);
        return;
      }

      // 2. Upload images to Supabase Storage bucket 'product-images'
      const imageUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${newProduct.id}-${i}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `products/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error uploading image ${i}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: pubData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (pubData?.publicUrl) {
          imageUrls.push(pubData.publicUrl);
          
          // Insert into public.product_images database table
          await supabase
            .from('product_images')
            .insert({
              product_id: newProduct.id,
              user_id: user.id,
              image_url: pubData.publicUrl
            });
        }
      }

      setSuccessMsg('تم نشر إعلانك بنجاح! جاري التوجيه لتصفح الإعلانات...');
      
      // Redirect to listing page
      setTimeout(() => {
        router.push('/mobiles');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء إضافة الإعلان.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        جاري تهيئة الصفحة...
      </div>
    );
  }

  const selectedCat = categories.find((c) => c.id === categoryId);
  const isMobiles = selectedCat?.name === 'هواتف';

  return (
    <main className="min-h-[calc(100vh-68px)] bg-slate-50 dark:bg-slate-950 py-8 md:py-12 transition-colors duration-200" dir="rtl">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header Title */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6 flex items-center justify-between transition-colors">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#00A344] dark:text-[#2EE06F] bg-[#E8F5E9] dark:bg-[#0B3D22]/40 p-1 rounded-lg" />
              إضافة إعلان جديد
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">اعرض جهازك للبيع مجاناً بدون عمولات في سوق فون</p>
          </div>
        </div>

        <form onSubmit={onSubmitPress} className="space-y-6">
          
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/50 font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#E8F5E9] dark:bg-[#0B3D22]/30 text-[#00A344] dark:text-[#2EE06F] p-4 rounded-2xl text-sm border border-[#C8E6C9] dark:border-[#1B5E20]/50 font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0 animate-spin" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Images */}
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
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {imageFiles.length < MAX_IMAGES && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#00C853] dark:hover:border-[#00C853] bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 dark:text-slate-500 gap-1.5">
                  <ImageIcon className="w-6 h-6 stroke-[1.5px]" />
                  <span className="text-[10px] font-bold">أضف صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Section 2: General Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">تفاصيل الإعلان الأساسية</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">القسم / الفئة</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">حالة الجهاز</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                >
                  <option value="جديد">جديد</option>
                  <option value="كسر زيرو">كسر زيرو</option>
                  <option value="مستعمل">مستعمل</option>
                </select>
              </div>

              {/* Title (Only shown for non-mobiles) */}
              {!isMobiles && (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">عنوان الإعلان (مثال: جراب آيفون 13 سيليكون)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سماعات ايربودز الجيل الثالث"
                    required={!isMobiles}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Section 3: Technical Specifications (Only shown if Category is "هواتف") */}
          {isMobiles && (
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

                {/* Device Opened? */}
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
                          onClick={() => handleAccessoryChange(acc)}
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
          )}

          {/* Section 4: Finance, Location & Delivery */}
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

          {/* Section 5: Description */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">وصف الإعلان</h2>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">تفاصيل إضافية (أذكر الملحقات، العيوب، الخدوش وحالة الجهاز بوضوح)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أذكر هنا تفاصيل إضافية للمشتري حول الهاتف، الملحقات المرفقة معه، أو حالة البطارية..."
                required
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#00C853] focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655 resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00C853] to-[#00A344] hover:from-[#00A344] hover:to-[#008C39] text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-[#00A344]/20 hover:shadow-lg text-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'جاري نشر إعلانك...' : 'نشر الإعلان الآن'}
          </button>
        </form>

      </div>

      {/* ========================================================================= */}
      {/* Honesty Dialog Modal Overlay (كن صادقا في تجارتك تتيسر حياتك) */}
      {/* ========================================================================= */}
      {showHonestyModal && (
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
                onClick={() => setShowHonestyModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmAndPublish}
                className="flex-1 bg-gradient-to-r from-[#00C853] to-[#00A344] hover:from-[#00A344] hover:to-[#008C39] text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-md shadow-[#00A344]/20 hover:shadow-lg cursor-pointer"
              >
                أوافق وأنشر
              </button>
            </div>
            
          </div>
        </div>
      )}
    </main>
  );
}
