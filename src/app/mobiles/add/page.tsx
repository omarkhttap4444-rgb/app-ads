'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, AlertCircle, Sparkles } from 'lucide-react';
import { SAUDI_MARKET_ENABLED } from '@/lib/market-config';
import { EGYPT_GOVERNORATES, EGYPT_CENTERS, SAUDI_REGIONS, SAUDI_CITIES } from '@/lib/locations';
import {
  fetchPhoneCatalog,
  type PhoneCatalog,
} from '@/lib/phone-data';
import { compressImage } from '@/lib/image-compress';
import {
  commitPublication, preparePublication, readPendingPublication, PublicationError,
  type PendingPublication,
} from '@/lib/product-publication';
import { checkDuplicateBeforePublish } from '@/lib/duplicate-listing-guard';
import { PhoneSpecsSection } from './PhoneSpecsSection';
import {
  ImagesUploadSection,
  FinanceLocationSection,
  HonestyModal,
} from './LocationAndHonestySections';

// Same limit as the Flutter app (regular user: max 4 images)
const MAX_IMAGES = 4;

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
  const [pendingPublication, setPendingPublication] = useState<PendingPublication | null>(null);
  const [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [preparingImages, setPreparingImages] = useState(false);
  const publishingRef = useRef(false);
  const preparingImagesRef = useRef(false);

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
      try {
        setPendingPublication(readPendingPublication(sessionStorage, session.user.id));
      } catch {
        setRecoveryBlocked(true);
        setErrorMsg('تعذر قراءة سجل النشر في المتصفح. راجع إعلاناتك وسماح المتصفح بالتخزين قبل بدء إعلان آخر.');
      }

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
    if (publishingRef.current || preparingImagesRef.current || pendingPublication || recoveryBlocked) return;
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

      // Compress before adding (adaptive WebP) to minimize R2 storage & bandwidth
      preparingImagesRef.current = true;
      setPreparingImages(true);
      try {
        const compressed = await Promise.all(accepted.map((f) => compressImage(f, 'product')));
        setImageFiles((prev) => [...prev, ...compressed]);
        const previews = compressed.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...previews]);
      } catch {
        setErrorMsg('تعذر تجهيز الصور المختارة. يرجى اختيارها مرة أخرى.');
      } finally {
        preparingImagesRef.current = false;
        setPreparingImages(false);
        e.target.value = '';
      }
    }
  };

  // Remove local file preview
  const removeImage = (index: number) => {
    if (publishingRef.current || preparingImagesRef.current || pendingPublication || recoveryBlocked) return;
    URL.revokeObjectURL(imagePreviews[index]);
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
    if (publishingRef.current || preparingImagesRef.current || pendingPublication || recoveryBlocked || successMsg) return;
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
    if (publishingRef.current || preparingImagesRef.current || recoveryBlocked || successMsg || !user) return;
    publishingRef.current = true;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const completePublication = async (pending: PendingPublication) => {
        const result = await commitPublication(supabase, sessionStorage, pending);
        setPendingPublication(null);
        setSuccessMsg('تم حفظ إعلانك وجميع صوره بنجاح! جاري فتح الإعلان...');
        setTimeout(() => {
          router.push(result.slug ? `/mobiles/${encodeURIComponent(result.slug)}` : '/mobiles');
          router.refresh();
        }, 1200);
      };
      // Retry the immutable request BEFORE validation/cooldown; it may already be saved.
      if (pendingPublication) {
        await completePublication(pendingPublication);
        return;
      }
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const isMobiles = selectedCategory?.name === 'هواتف';

      const resolvedModelName = (brand === 'أخرى' || model === 'أخرى') ? customModel.trim() : model;

      // Subscribed stores daily limit: max 3 new products per rolling 24 hours
      const subType = String(profile?.subscription_type ?? 'free').toLowerCase();
      const subEndMs = profile?.subscription_end_date ? new Date(profile.subscription_end_date).getTime() : 0;
      const isSubscribed =
        Boolean(profile?.is_subscribed) ||
        subType === 'commission' ||
        (subType !== 'free' && subType !== '' && (!profile?.subscription_end_date || subEndMs > Date.now()));

      if (isSubscribed) {
        const since24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: dailyEvents, error: dailyErr } = await supabase
          .from('user_publish_events')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', since24hIso)
          .order('created_at', { ascending: false })
          .limit(5);

        if (dailyErr) {
          throw new PublicationError('تعذر التحقق من حد النشر اليومي للمتجر. تحقق من الاتصال وأعد المحاولة.');
        }

        if ((dailyEvents?.length ?? 0) >= 3) {
          const oldestOfThree = dailyEvents![2]?.created_at
            ? new Date(dailyEvents![2].created_at).getTime()
            : Date.now();
          const remainingHours = Math.max(
            1,
            Math.ceil((oldestOfThree + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000)),
          );
          setErrorMsg(
            `بلغت الحد اليومي المسموح للمتاجر المشتركة (3 منتجات يومياً فقط). يمكنك نشر منتج جديد بعد ${remainingHours} ساعة تقريباً.`,
          );
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // 72-hour duplicate model posting cooldown check for normal users
      if (!isSubscribed && isMobiles && resolvedModelName) {
        const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

        const { data: recentProducts, error: recentErr } = await supabase
          .from('products')
          .select('id, created_at, specifications')
          .eq('seller_id', user.id)
          .eq('category', 'هواتف')
          .gt('created_at', seventyTwoHoursAgo);
        if (recentErr) {
          throw new PublicationError('تعذر التحقق من الإعلانات السابقة. لم يتم النشر؛ تحقق من الاتصال وأعد المحاولة.');
        }

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
        hasDelivery: hasDelivery,
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
        specifications.is_opened = condition === 'جديد' ? 'لا' : isDeviceOpened;
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

      // Build automatic phone title - لا تستخدم 'أخرى' كجزء من العنوان (تصنيف فقط)
      const effectiveBrand = brand.trim() === 'أخرى' ? '' : brand;
      const finalTitle = isMobiles
        ? [effectiveBrand, ram ? `رام ${ram}` : '', resolvedModelName].filter((s) => s && s.trim().length > 0).join(' ').trim()
        : name.trim();

      // Real pre-publish AI + perceptual image-fingerprint duplicate guard (before R2 upload)
      const duplicateCheck = await checkDuplicateBeforePublish(supabase, {
        title: finalTitle,
        description: description.trim(),
        category: selectedCategory?.name || 'هواتف',
        subCategory: effectiveBrand || selectedCategory?.name || 'هواتف',
        price: price ? parseFloat(price) : 0,
        condition,
        brand: effectiveBrand,
        model: resolvedModelName,
        storage,
        location: center.trim() ? `${location} - ${center.trim()}` : location,
        imageFiles,
      });

      if (duplicateCheck.isDuplicate) {
        const matchedSuffix = duplicateCheck.matchedTitle
          ? ` (الإعلان السابق: ${duplicateCheck.matchedTitle})`
          : '';
        setErrorMsg(`${duplicateCheck.reasonAr}${matchedSuffix}`);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (duplicateCheck.imageFingerprints.length > 0) {
        specifications._img_fps = duplicateCheck.imageFingerprints;
      }

      // Upload all images first, then atomically save the product AND image links.
      const pending = await preparePublication(supabase, sessionStorage, user.id, {
        name: finalTitle,
        description: description.trim(),
        price: price ? parseFloat(price) : 0,
        category_id: categoryId,
        specifications,
        is_negotiable: isNegotiable,
        condition,
        location: center.trim() ? `${location} - ${center.trim()}` : location,
      }, imageFiles);
      setPendingPublication(pending);
      await completePublication(pending);
    } catch (err: unknown) {
      if (err instanceof PublicationError && !err.uncertain) setPendingPublication(null);
      setErrorMsg(err instanceof PublicationError ? err.message : 'تعذر إكمال النشر. تحقق من الاتصال ثم أعد المحاولة.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      publishingRef.current = false;
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
            <div role="alert" className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 p-4 rounded-2xl text-sm border border-rose-100 dark:border-rose-900/50 font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className="bg-[#E8F5E9] dark:bg-[#0B3D22]/30 text-[#00A344] dark:text-[#2EE06F] p-4 rounded-2xl text-sm border border-[#C8E6C9] dark:border-[#1B5E20]/50 font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0 animate-spin" />
              <span>{successMsg}</span>
            </div>
          )}

          {pendingPublication && !successMsg && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3 text-sm text-amber-900">
              <p>توجد محاولة نشر محفوظة: {pendingPublication.product.name}. سنتحقق منها بنفس المعرّف دون تكرار الإعلان. لا تبدأ إعلانًا آخر حتى تتأكد من النتيجة.</p>
              <button type="button" onClick={confirmAndPublish} disabled={loading}
                className="rounded-xl bg-amber-900 px-4 py-2 font-bold text-white disabled:opacity-50">
                {loading ? 'جاري التحقق...' : 'التحقق وإعادة المحاولة'}
              </button>
            </div>
          )}
          {(pendingPublication || recoveryBlocked) && (
            <Link href="/profile" className="inline-block text-sm font-bold text-[#008C39] dark:text-[#2EE06F] underline">
              مراجعة إعلاناتي قبل بدء محاولة جديدة
            </Link>
          )}
          <fieldset disabled={loading || preparingImages || !!pendingPublication || recoveryBlocked || !!successMsg}
            className="space-y-6 min-w-0" aria-busy={loading || preparingImages}>
            <legend className="sr-only">تفاصيل الإعلان وصوره</legend>

            {/* Section 1: Images */}
            <ImagesUploadSection
              imagePreviews={imagePreviews}
              imageCount={imageFiles.length}
              maxImages={MAX_IMAGES}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
            />

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
                    onChange={(e) => {
                      const val = e.target.value;
                      setCondition(val);
                      if (val === 'جديد') {
                        setIsDeviceOpened('لا');
                      }
                    }}
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
              <PhoneSpecsSection
                catalog={catalog}
                brand={brand}
                setBrand={setBrand}
                model={model}
                setModel={setModel}
                customModel={customModel}
                setCustomModel={setCustomModel}
                storage={storage}
                setStorage={setStorage}
                ram={ram}
                setRam={setRam}
                color={color}
                setColor={setColor}
                batteryHealth={batteryHealth}
                setBatteryHealth={setBatteryHealth}
                condition={condition}
                isDeviceOpened={isDeviceOpened}
                setIsDeviceOpened={setIsDeviceOpened}
                selectedCountry={selectedCountry}
                ntraTax={ntraTax}
                setNtraTax={setNtraTax}
                selectedAccessory={selectedAccessory}
                onAccessoryChange={handleAccessoryChange}
                showOptional={showOptional}
                setShowOptional={setShowOptional}
                cpu={cpu}
                setCpu={setCpu}
                batteryCapacity={batteryCapacity}
                setBatteryCapacity={setBatteryCapacity}
                warranty={warranty}
                setWarranty={setWarranty}
                acceptsExchange={acceptsExchange}
                setAcceptsExchange={setAcceptsExchange}
              />
            )}

            {/* Section 4: Finance, Location & Delivery */}
            <FinanceLocationSection
              selectedCountry={selectedCountry}
              price={price}
              setPrice={setPrice}
              location={location}
              setLocation={setLocation}
              center={center}
              setCenter={setCenter}
              isNegotiable={isNegotiable}
              setIsNegotiable={setIsNegotiable}
              hasDelivery={hasDelivery}
              setHasDelivery={setHasDelivery}
            />

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
              {loading ? 'جاري نشر إعلانك...' : preparingImages ? 'جاري تجهيز الصور...' : 'نشر الإعلان الآن'}
            </button>
          </fieldset>
        </form>
      </div>

      {/* Honesty Dialog Modal Overlay (كن صادقا في تجارتك تتيسر حياتك) */}
      {showHonestyModal && (
        <HonestyModal
          loading={loading}
          preparingImages={preparingImages}
          onCancel={() => setShowHonestyModal(false)}
          onConfirm={confirmAndPublish}
        />
      )}
    </main>
  );
}
