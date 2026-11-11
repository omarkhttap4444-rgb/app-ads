'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Calendar,
  CheckCircle,
  Star,
  Briefcase,
  Camera,
  User,
  Phone,
  X,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Share2,
  Copy,
  Globe,
  MessageCircle,
} from 'lucide-react';
import {
  cleanBio,
  extractStoreMetadata,
  mergeBio,
  getEffectiveMapsUrl,
  isStoreOpenNow,
  type StoreProfileMetadata,
} from '@/lib/store-metadata';

const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
];

type StoreType = {
  id: string;
  name: string;
  bio: string | null;
  phone: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  governorate: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  is_store: boolean;
  has_active_store_subscription?: boolean;
  followers_count: number;
  seller_rating: number;
  created_at: string;
  auth_user_id?: string;
};

type Props = {
  store: StoreType;
  productsCount: number;
};

type ToastType = {
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function ProfileHeader({ store: initialStore, productsCount }: Props) {
  const [store, setStore] = useState<StoreType>(initialStore);
  const [isOwner, setIsOwner] = useState(false);

  // Parsed metadata & clean bio
  const metadata: StoreProfileMetadata = extractStoreMetadata(store.bio);
  const displayBio = cleanBio(store.bio);
  const isOpen = isStoreOpenNow(metadata);
  const mapsUrl = getEffectiveMapsUrl(metadata);

  // Edit fields states
  const [name, setName] = useState(initialStore.name);
  const [phone, setPhone] = useState(initialStore.phone || '');
  const [governorate, setGovernorate] = useState(initialStore.governorate || GOVERNORATES[0]);
  const [bioInput, setBioInput] = useState(cleanBio(initialStore.bio));

  // UI States
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);

  // Refs for hidden inputs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const ownerMatch =
            session.user.id === initialStore.id ||
            session.user.id === initialStore.auth_user_id;
          setIsOwner(ownerMatch);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    checkAuth();
  }, [initialStore]);

  const showToast = (message: string, type: ToastType['type'] = 'info') => {
    setToast({ message, type });
  };

  // Share profile
  const handleShareProfile = async () => {
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/store/${store.id}`
      : `https://souqphone.com/store/${store.id}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text: `تصفح متجر ${store.name} على منصة سوق فون!`,
          url: profileUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('تم نسخ رابط الملف الشخصي بنجاح 📋', 'success');
    } catch {
      showToast(profileUrl, 'info');
    }
  };

  // Profile Image Upload Handler
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 4 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً. الحد الأقصى 4 ميجابايت.', 'error');
      return;
    }

    setIsUploadingProfile(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${store.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${store.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (!publicUrl) throw new Error('فشل الحصول على رابط الصورة العام');

      const { error: dbError } = await supabase
        .from('users')
        .update({
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore((prev) => ({ ...prev, profile_image_url: publicUrl }));
      showToast('تم تحديث صورة الملف الشخصي بنجاح ✅', 'success');
    } catch (err: unknown) {
      console.error('Profile upload error:', err);
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة الشخصية.';
      showToast(msg, 'error');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Cover Image Upload Handler
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم صورة الغلاف كبير جداً. الحد الأقصى 5 ميجابايت.', 'error');
      return;
    }

    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${store.id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${store.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cover-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('cover-images').getPublicUrl(filePath);

      if (!publicUrl) throw new Error('فشل الحصول على رابط الصورة العام');

      const { error: dbError } = await supabase
        .from('users')
        .update({
          cover_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore((prev) => ({ ...prev, cover_image_url: publicUrl }));
      showToast('تم تحديث صورة الغلاف بنجاح ✅', 'success');
    } catch (err: unknown) {
      console.error('Cover upload error:', err);
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع صورة الغلاف.';
      showToast(msg, 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Profile Details Edit Form Submission
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم المتجر/البائع.', 'error');
      return;
    }

    setIsSavingDetails(true);
    try {
      // Preserve existing metadata seamlessly
      const mergedBioText = mergeBio(bioInput.trim(), metadata);

      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          governorate: governorate || null,
          bio: mergedBioText || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore((prev) => ({
        ...prev,
        name: name.trim(),
        phone: phone.trim() || null,
        governorate: governorate || null,
        bio: mergedBioText || null,
      }));

      showToast('تم حفظ تغييرات الملف الشخصي بنجاح ✅', 'success');
      setShowEditModal(false);
    } catch (err: unknown) {
      console.error('Save details error:', err);
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التغييرات.';
      showToast(msg, 'error');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const profileImage = store.profile_image_url || '';
  const isStoreSubscriber = store.is_store || store.has_active_store_subscription;

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={profileInputRef}
        onChange={handleProfileImageUpload}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={coverInputRef}
        onChange={handleCoverImageUpload}
        className="hidden"
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-[100] flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl transition-all duration-300 text-sm font-bold border animate-slideIn ${
            toast.type === 'success'
              ? 'bg-teal-50 border-teal-100 text-teal-700 dark:bg-teal-950/90 dark:border-teal-900/50 dark:text-teal-400'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/90 dark:border-rose-900/50 dark:text-rose-400'
              : 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/90 dark:border-blue-900/50 dark:text-blue-400'
          }`}
        >
          {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Store Header / Cover */}
      <div className="h-60 md:h-72 w-full relative bg-slate-900 dark:bg-black overflow-hidden group/cover">
        {store.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover opacity-60 transition-all duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

        {/* Cover Edit Overlay */}
        {isOwner && (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute bottom-4 left-4 bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60"
            title="تغيير صورة الغلاف"
          >
            {isUploadingCover ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{isUploadingCover ? 'جاري الرفع...' : 'تغيير صورة الغلاف'}</span>
          </button>
        )}
      </div>

      {/* Profile Info Container */}
      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-10" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 transition-colors duration-200">
          {/* Avatar with Edit Overlay */}
          <div className="relative shrink-0 group/avatar">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-black text-5xl flex items-center justify-center overflow-hidden bg-cover bg-center"
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : {}}
            >
              {!profileImage && store.name.charAt(0)}
            </div>

            {/* Profile Avatar Loading Overlay */}
            {isUploadingProfile && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Avatar Edit camera button */}
            {isOwner && !isUploadingProfile && (
              <button
                onClick={() => profileInputRef.current?.click()}
                className="absolute -bottom-2 -left-2 bg-teal-600 hover:bg-teal-500 text-white p-2.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-900 transition-all transform hover:scale-105 cursor-pointer"
                title="تغيير الصورة الشخصية"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-right pt-2 md:pt-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    {store.name}
                    {store.is_verified && (
                      <span title="بائع موثق">
                        <CheckCircle className="w-6 h-6 text-teal-500 fill-teal-500" />
                      </span>
                    )}
                  </h1>

                  {/* Store Open/Closed Live Badge */}
                  {metadata.working_hours && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                        isOpen
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-400/30'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {isOpen ? 'مفتوح الآن' : 'مغلق مؤقتاً'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-slate-400 font-medium">
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      isStoreSubscriber
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {isStoreSubscriber ? 'متجر معتمد 🏅' : 'بائع مستقل'}
                  </span>

                  {store.governorate && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {store.governorate}
                    </span>
                  )}

                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    عضو منذ {new Date(store.created_at).getFullYear()}
                  </span>
                </div>

                {/* Actions: Edit + Share */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <button
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110 active:scale-95"
                    title="مشاركة رابط الملف الشخصي"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة المتجر</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setName(store.name);
                        setPhone(store.phone || '');
                        setGovernorate(store.governorate || GOVERNORATES[0]);
                        setBioInput(cleanBio(store.bio));
                        setShowEditModal(true);
                      }}
                      className="bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-950/70 border border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>تعديل البيانات</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Panel */}
              <div className="flex gap-6 justify-center md:justify-end bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">
                    {productsCount}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">إعلان</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">
                    {store.followers_count || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">متابع</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <div className="text-lg font-black text-amber-500 flex items-center gap-1 justify-center">
                    {store.seller_rating > 0 ? Number(store.seller_rating).toFixed(1) : 'جديد'}
                    <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">التقييم</div>
                </div>
              </div>
            </div>

            {/* 🌟 Promo Banner (العرض الترويجي للمتجر) */}
            {metadata.promo_banner && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent p-3.5 text-right dark:border-amber-500/25 dark:from-amber-950/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    عرض ترويجي خاص بالمتجر
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white md:text-sm">
                    {metadata.promo_banner}
                  </p>
                </div>
              </div>
            )}

            {/* 📝 Clean Bio Text */}
            <p className="mt-5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-w-3xl border-t border-slate-100 dark:border-slate-800 pt-5 font-medium">
              {displayBio || 'لا توجد نبذة تعريفية عن هذا البائع حتى الآن.'}
            </p>

            {/* 🏪 STORE METADATA HUB (مواعيد العمل + العنوان التفصيلي + التواصل الرقمي) */}
            {(metadata.detailed_address ||
              metadata.working_hours ||
              metadata.facebook_url ||
              metadata.instagram_url ||
              metadata.website_url ||
              mapsUrl) && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                {/* Detailed Address */}
                {metadata.detailed_address && (
                  <div className="flex flex-col justify-between gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>العنوان التفصيلي:</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed pr-5">
                        {metadata.detailed_address}
                      </p>
                    </div>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start inline-flex items-center gap-1 rounded-xl bg-emerald-600/10 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 transition"
                      >
                        <span>الاتجاهات على الخريطة</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Working Hours */}
                {metadata.working_hours && (
                  <div className="flex flex-col justify-between gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
                        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>مواعيد وساعات العمل:</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed pr-5">
                        {metadata.working_hours}
                      </p>
                    </div>
                    <div className="pr-5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] font-black ${
                          isOpen
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isOpen ? '🟢 يستقبل الزبائن الآن' : '🔴 مغلق في هذا الوقت'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Social & Contact Dock */}
                {(metadata.facebook_url ||
                  metadata.instagram_url ||
                  metadata.tiktok_url ||
                  metadata.website_url ||
                  store.contact_whatsapp ||
                  store.phone) && (
                  <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-400 ml-1">تواصل مع المتجر:</span>
                    {metadata.facebook_url && (
                      <a
                        href={metadata.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1877f2]/10 px-3 py-1.5 text-xs font-bold text-[#1877f2] hover:bg-[#1877f2]/20 transition"
                      >
                        <span>فيسبوك</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {metadata.instagram_url && (
                      <a
                        href={metadata.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/10 px-3 py-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 transition"
                      >
                        <span>انستغرام</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {metadata.tiktok_url && (
                      <a
                        href={metadata.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/10 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white hover:opacity-80 transition"
                      >
                        <span>تيك توك</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {metadata.website_url && (
                      <a
                        href={metadata.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 transition"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>الموقع الإلكتروني</span>
                      </a>
                    )}
                    {(store.contact_whatsapp || store.phone) && (
                      <a
                        href={`https://wa.me/${(store.contact_whatsapp || store.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#25d366]/15 px-3 py-1.5 text-xs font-bold text-[#128c7e] dark:text-[#25d366] hover:bg-[#25d366]/25 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب المتجر</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div
            onClick={() => setShowEditModal(false)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-scaleIn transition-colors duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">
                تعديل الملف الشخصي
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDetails} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  الاسم كامل / اسم المتجر
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="مثال: متجر الفرسان للهواتف"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  رقم الهاتف للتواصل
                </label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors text-right"
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>

              {/* Governorate */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  المحافظة / المدينة
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                  >
                    {GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clean Bio Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  نبذة تعريفية (تظهر للزوار)
                </label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  placeholder="اكتب نبذة مختصرة عنك أو عن متجرك..."
                />
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  {isSavingDetails ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ التغييرات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
