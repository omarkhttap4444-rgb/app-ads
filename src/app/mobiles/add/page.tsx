'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Image as ImageIcon, X, AlertCircle, Sparkles, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
  'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

const BRANDS = ['آبل', 'سامسونج', 'شاومي', 'ريلمي', 'أوبو', 'فيفو', 'هونر', 'إنفينيكس', 'نوكيا', 'وان بلس', 'أخرى'];

const POPULAR_MODELS: Record<string, string[]> = {
  'آبل': ['آيفون 15 برو ماكس', 'آيفون 15 برو', 'آيفون 15', 'آيفون 14 برو ماكس', 'آيفون 14 برو', 'آيفون 14', 'آيفون 13 برو ماكس', 'آيفون 13 برو', 'آيفون 13', 'آيفون 12 برو ماكس', 'آيفون 12 برو', 'آيفون 12', 'آيفون 11 برو ماكس', 'آيفون 11', 'آيفون XS ماكس', 'آيفون X', 'أخرى'],
  'سامسونج': ['جالاكسي S24 الترا', 'جالاكسي S24+', 'جالاكسي S24', 'جالاكسي S23 الترا', 'جالاكسي S23', 'جالاكسي A55', 'جالاكسي A35', 'جالاكسي A54', 'جالاكسي A34', 'جالاكسي A25', 'جالاكسي A15', 'جالاكسي M54', 'جالاكسي Z فولد 5', 'جالاكسي Z فليب 5', 'أخرى'],
  'شاومي': ['ريدمي نوت 13 برو+', 'ريدمي نوت 13 برو', 'ريدمي نوت 13', 'ريدمي 13C', 'بوكو X6 برو', 'بوكو F6 برو', 'شيومي 14 الترا', 'شيومي 14', 'ريدمي نوت 12 برو', 'ريدمي نوت 12', 'أخرى'],
  'ريلمي': ['ريلمي 12 برو+', 'ريلمي 12', 'ريلمي C67', 'ريلمي C53', 'ريلمي 11 برو+', 'ريلمي 11', 'ريلمي C55', 'ريلمي GT5', 'أخرى'],
  'أوبو': ['رينو 11 F', 'رينو 11', 'رينو 10 برو', 'رينو 10', 'أوبو A78', 'أوبو A58', 'أوبو A38', 'أوبو A18', 'أخرى'],
  'أخرى': ['أخرى']
};

const STORAGE_OPTIONS = ['32 جيجا', '64 جيجا', '128 جيجا', '256 جيجا', '512 جيجا', '1 تيرابايت', 'أخرى'];
const RAM_OPTIONS = ['2 جيجا', '3 جيجا', '4 جيجا', '6 جيجا', '8 جيجا', '12 جيجا', '16 جيجا', 'أخرى'];

const ACCESSORIES_LIST = [
  { id: 'box', label: 'العلبة الأصلية' },
  { id: 'charger', label: 'الشاحن الأصلي' },
  { id: 'cable', label: 'كابل الشحن' },
  { id: 'headphone', label: 'السماعة الأصلية' },
  { id: 'cover', label: 'جراب / لاصقة حماية' }
];

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
  const [location, setLocation] = useState(GOVERNORATES[0]);
  const [center, setCenter] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  
  // Mobiles Specifications
  const [brand, setBrand] = useState(BRANDS[0]);
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [storage, setStorage] = useState(STORAGE_OPTIONS[2]); // Default 128GB
  const [ram, setRam] = useState(RAM_OPTIONS[3]); // Default 6GB
  const [color, setColor] = useState('');
  const [batteryHealth, setBatteryHealth] = useState(100);
  const [isDeviceOpened, setIsDeviceOpened] = useState('لا');
  const [ntraTax, setNtraTax] = useState('لا');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  
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
      setLoadingConfig(false);
    };

    initPage();
  }, [router]);

  // Set default model on brand changes
  useEffect(() => {
    const models = POPULAR_MODELS[brand] || ['أخرى'];
    setModel(models[0]);
  }, [brand]);

  // Handle local file preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 5 images
      if (imageFiles.length + filesArray.length > 5) {
        setErrorMsg('الحد الأقصى المسموح به هو 5 صور فقط.');
        return;
      }

      setErrorMsg(null);
      setImageFiles((prev) => [...prev, ...filesArray]);

      const previews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  // Remove local file preview
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle accessories selection
  const handleAccessoryChange = (label: string) => {
    setSelectedAccessories((prev) => 
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  // Click Submit - Validation and trigger Honesty Modal
  const onSubmitPress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
    if (!isMobiles && name.trim().length < 3) {
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
        specifications.brand = brand;
        specifications.model = resolvedModelName || 'غير محدد';
        specifications.ram = ram;
        specifications.storage = storage;
        specifications.color = color.trim() || 'غير محدد';
        specifications.accessories = selectedAccessories.join('، ') || 'بدون ملحقات';
        specifications.is_opened = isDeviceOpened;
        specifications.ntra_tax = ntraTax;
        
        if (brand === 'آبل') {
          specifications.battery_health = batteryHealth;
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
              <Plus className="w-6 h-6 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 p-1 rounded-lg" />
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
            <div className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-450 p-4 rounded-2xl text-sm border border-teal-100 dark:border-teal-900/50 font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0 animate-spin" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Images */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">صور الهاتف (5 صور كحد أقصى)</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">إضافة صور حقيقية واضحة تزيد من فرصة بيع موبايلك بسرعة</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
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
              
              {imageFiles.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 dark:text-slate-500 gap-1.5">
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الموديل</label>
                  {brand !== 'أخرى' ? (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                    >
                      {(POPULAR_MODELS[brand] || ['أخرى']).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="أدخل موديل الهاتف يدوياً"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  )}
                </div>

                {/* Show custom model input if popular model 'أخرى' is chosen */}
                {brand !== 'أخرى' && model === 'أخرى' && (
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">اسم الموديل المخصص</label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="مثال: جالاكسي نوت 10 بلس"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                )}

                {/* Storage */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">المساحة التخزينية</label>
                  <select
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                  >
                    {STORAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RAM */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الذاكرة العشوائية (RAM)</label>
                  <select
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                  >
                    {RAM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">اللون</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="مثال: أسود، أزرق، ذهبي"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                {/* Battery Health (Shown only for Apple devices) */}
                {brand === 'آبل' && (
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>نسبة صحة البطارية</span>
                      <span className="text-teal-600 dark:text-teal-400 font-extrabold">{batteryHealth}%</span>
                    </label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <input
                        type="range"
                        min="40"
                        max="100"
                        value={batteryHealth}
                        onChange={(e) => setBatteryHealth(Number(e.target.value))}
                        className="w-full accent-teal-650 h-2 bg-slate-100 dark:bg-slate-850 rounded-lg cursor-pointer"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                  >
                    <option value="لا">لا (بحالة المصنع الأصلي)</option>
                    <option value="نعم">نعم (تم فتحه أو عمل صيانة)</option>
                  </select>
                </div>

                {/* NTRA Customs Tax Paid? */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل الهاتف مسجل / مدفوع ضريبة الجمارك NTRA؟</label>
                  <select
                    value={ntraTax}
                    onChange={(e) => setNtraTax(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                  >
                    <option value="لا">لا (غير مسجل بالشبكة المصرية / دولي)</option>
                    <option value="نعم">نعم (مسجل / محلي مدفوع الضريبة)</option>
                  </select>
                </div>

                {/* Accessories Checklist */}
                <div className="sm:col-span-2 space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الملحقات المتوفرة مع الهاتف</label>
                  <div className="flex flex-wrap gap-2.5">
                    {ACCESSORIES_LIST.map((acc) => {
                      const isSelected = selectedAccessories.includes(acc.label);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleAccessoryChange(acc.label)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400' 
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {acc.label}
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
                  className="flex items-center justify-between w-full py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-450 transition-colors"
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
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650"
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
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655"
                      />
                    </div>

                    {/* Warranty */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">هل الهاتف في فترة الضمان؟</label>
                      <select
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
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
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">السعر المطلوب (جنيه)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="مثال: 12500"
                  required
                  min={1}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655"
                />
              </div>

              {/* Location Governorate */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">المحافظة</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white"
                >
                  {GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Center/District */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">المركز / الحي (المدينة)</label>
                <input
                  type="text"
                  value={center}
                  onChange={(e) => setCenter(e.target.value)}
                  placeholder="مثال: الدقي / مصر الجديدة / محرم بك"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655"
                />
              </div>

              {/* Price Negotiable Option */}
              <div className="flex items-center gap-2 py-3.5">
                <input 
                  type="checkbox" 
                  id="negotiable"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
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
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded cursor-pointer"
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
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655 resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-teal-600/10 hover:shadow-lg text-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
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
                className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-md shadow-teal-600/10 hover:shadow-lg cursor-pointer"
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
