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
  AlertCircle 
} from 'lucide-react';

const GOVERNORATES = [
  'القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية',
  'الغربية','المنوفية','البحيرة','كفر الشيخ','دمياط','بورسعيد',
  'الإسماعيلية','السويس','الفيوم','بني سويف','المنيا','أسيوط',
  'سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد',
  'مطروح','شمال سيناء','جنوب سيناء'
];

type StoreType = {
  id: string;
  name: string;
  bio: string | null;
  phone: string | null;
  governorate: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  is_store: boolean;
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
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Edit fields states
  const [name, setName] = useState(initialStore.name);
  const [phone, setPhone] = useState(initialStore.phone || '');
  const [governorate, setGovernorate] = useState(initialStore.governorate || GOVERNORATES[0]);
  const [bio, setBio] = useState(initialStore.bio || '');

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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSessionUser(session.user);
          // Check if user is owner by matching ID
          const ownerMatch = session.user.id === initialStore.id || session.user.id === initialStore.auth_user_id;
          setIsOwner(ownerMatch);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    checkAuth();
  }, [initialStore]);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Profile Avatar Upload Handler
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.', 'error');
      return;
    }

    setIsUploadingProfile(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${store.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${store.id}/${fileName}`;

      // Upload file to bucket 'profile-images'
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('فشل الحصول على رابط الصورة العام');

      // Update in database users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore(prev => ({ ...prev, profile_image_url: publicUrl }));
      showToast('تم تحديث صورة الملف الشخصي بنجاح ✅', 'success');
    } catch (err: any) {
      console.error('Profile upload error:', err);
      showToast(err.message || 'حدث خطأ أثناء رفع الصورة الشخصية.', 'error');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Cover Image Upload Handler
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم صورة الغلاف كبير جداً. الحد الأقصى 5 ميجابايت.', 'error');
      return;
    }

    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${store.id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${store.id}/${fileName}`;

      // Upload file to bucket 'cover-images'
      const { error: uploadError } = await supabase.storage
        .from('cover-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cover-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('فشل الحصول على رابط الصورة العام');

      // Update in database users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          cover_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore(prev => ({ ...prev, cover_image_url: publicUrl }));
      showToast('تم تحديث صورة الغلاف بنجاح ✅', 'success');
    } catch (err: any) {
      console.error('Cover upload error:', err);
      showToast(err.message || 'حدث خطأ أثناء رفع صورة الغلاف.', 'error');
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
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          governorate: governorate || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      setStore(prev => ({
        ...prev,
        name: name.trim(),
        phone: phone.trim() || null,
        governorate: governorate || null,
        bio: bio.trim() || null
      }));

      showToast('تم حفظ تغييرات الملف الشخصي بنجاح ✅', 'success');
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Save details error:', err);
      showToast(err.message || 'حدث خطأ أثناء حفظ التغييرات.', 'error');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const profileImage = store.profile_image_url || '';

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
          className={`fixed bottom-5 left-5 z-[100] flex items-center gap-2.5 px-5 py-4 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 text-sm font-bold border animate-slideIn ${
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
      <div className="h-60 md:h-72 w-full relative bg-gradient-to-r from-slate-850 via-teal-950 to-slate-900 overflow-hidden group/cover">
        {store.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-60 transition-all duration-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

        {/* Cover Edit Overlay */}
        {isOwner && (
          <button 
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute bottom-4 left-4 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-md text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-8 transition-colors duration-200">
          
          {/* Avatar with Edit Overlay */}
          <div className="relative shrink-0 group/avatar">
            <div 
              className="w-32 h-32 md:w-36 md:h-36 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-black text-5xl flex items-center justify-center overflow-hidden bg-cover bg-center" 
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
                <Camera className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-right pt-2 md:pt-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
                  {store.name}
                  {store.is_verified && (
                    <span title="بائع موثق">
                      <CheckCircle className="w-6 h-6 text-teal-500 fill-teal-500" />
                    </span>
                  )}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-400 font-medium">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                    <Briefcase className="w-3.5 h-3.5" />
                    {store.is_store ? 'متجر معتمد' : 'بائع مستقل'}
                  </span>
                  
                  {store.governorate && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      {store.governorate}
                    </span>
                  )}

                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    عضو منذ {new Date(store.created_at).getFullYear()}
                  </span>
                </div>

                {/* Owner Profile Edit Action Trigger Button */}
                {isOwner && (
                  <div className="pt-1.5 flex justify-center md:justify-start">
                    <button
                      onClick={() => {
                        setName(store.name);
                        setPhone(store.phone || '');
                        setGovernorate(store.governorate || GOVERNORATES[0]);
                        setBio(store.bio || '');
                        setShowEditModal(true);
                      }}
                      className="bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-950/70 border border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>تعديل بيانات الملف الشخصي</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="flex gap-6 justify-center md:justify-end bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">{productsCount}</div>
                  <div className="text-xs text-slate-400 font-semibold">إعلان</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-white">{store.followers_count || 0}</div>
                  <div className="text-xs text-slate-400 font-semibold">متابع</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-lg font-black text-amber-500 flex items-center gap-1 justify-center">
                    {store.seller_rating > 0 ? store.seller_rating : 'جديد'} 
                    <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">التقييم</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-w-3xl border-t border-slate-50 dark:border-slate-800 pt-6">
              {store.bio || 'لا يوجد نبذة تعريفية عن هذا البائع حتى الآن.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (Glassmorphism design, matches phone app style) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          {/* Backdrop blur */}
          <div 
            onClick={() => setShowEditModal(false)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          ></div>

          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-scaleIn transition-colors duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-850 dark:text-white">تعديل الملف الشخصي</h2>
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">الاسم كامل</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="مثال: أحمد محمد"
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">رقم الهاتف (اختياري)</label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400 text-right"
                  />
                </div>
              </div>

              {/* Governorate Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">المحافظة (اختياري)</label>
                <div className="relative">
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450 pointer-events-none" />
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white appearance-none cursor-pointer"
                  >
                    {GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">النبذة الشخصية (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="اكتب نبذة مختصرة عن متجرك، ساعات العمل، أو أنواع الموبايلات التي تبيعها..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400 resize-none leading-relaxed"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
                >
                  {isSavingDetails ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>حفظ التغييرات</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingDetails}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 font-bold py-3.5 rounded-2xl transition-all cursor-pointer disabled:opacity-65 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
