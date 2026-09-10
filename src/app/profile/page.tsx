'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  Copy,
  Eye,
  Heart,
  LogOut,
  Package,
  Pencil,
  ShoppingBag,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { compressImage } from '@/lib/image-compress';
import { firstProductImageUrl } from '@/lib/product-images';

type ProfileRow = {
  id: string;
  name: string;
  bio: string | null;
  governorate: string | null;
  contact_phone: string | null;
  is_contact_phone_visible: boolean | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean | null;
  subscription_type: string;
  subscription_end_date: string | null;
  user_id: number | null;
  created_at: string;
};

type Stats = {
  products: number;
  sold_products: number;
  views: number;
  likes: number;
  seller_rating: number;
  seller_ratings_count: number;
};

type MyProduct = {
  id: string;
  name: string;
  price: number;
  condition: string;
  location: string;
  slug: string;
  is_sold: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  product_images: { image_url: string; position?: number | null }[];
};

const PLANS_AR: Record<string, string> = {
  free: 'مجاني',
  beginner: 'مبتدئ',
  basic: 'أساسي',
  premium: 'بريميوم',
  pro: 'برو',
};

function maskPhone(phone: string) {
  const digits = phone.replace(/\s/g, '');
  if (digits.length < 9) return phone;
  return `${digits.slice(0, 5)}***${digits.slice(-4)}`;
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const loadAll = useCallback(async (authUid: string) => {
    // Resolve public users.id via auth_user_id (users.id != auth.uid() for many rows)
    let resolvedId = authUid;
    let profileRow: any = null;
    const userSelect = 'id, name, bio, governorate, contact_phone, is_contact_phone_visible, profile_image_url, cover_image_url, is_verified, subscription_type, subscription_end_date, user_id, created_at';
    try {
      const { data: byAuth } = await supabase
        .from('users')
        .select(userSelect)
        .eq('auth_user_id', authUid)
        .maybeSingle();
      if (byAuth) {
        profileRow = byAuth;
        resolvedId = (byAuth as any).id as string;
      } else {
        const { data: byId } = await supabase
          .from('users')
          .select(userSelect)
          .eq('id', authUid)
          .maybeSingle();
        if (byId) {
          profileRow = byId;
          resolvedId = (byId as any).id as string;
        }
      }
    } catch (e) {
      console.warn('[profile] users lookup failed', e);
    }

    const [statsRes, followersRes, followingRes, productsRes] = await Promise.all([
      supabase.rpc('get_seller_public_stats', { p_user_id: resolvedId }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', resolvedId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', resolvedId),
      supabase
        .from('products')
        .select('id, name, price, condition, location, slug, is_sold, views_count, likes_count, created_at, product_images(image_url,position)')
        .eq('seller_id', resolvedId)
        .order('created_at', { ascending: false })
        .order('position', { referencedTable: 'product_images', ascending: true })
        .limit(100),
    ]);

    if (profileRow) setProfile(profileRow as ProfileRow);
    else {
      // Fallback: try to set from resolved lookup if not already
      const { data: fallback } = await supabase.from('users').select(userSelect).eq('id', resolvedId).maybeSingle();
      if (fallback) setProfile(fallback as ProfileRow);
    }

    if (statsRes.error) {
      console.warn('[profile] get_seller_public_stats error', statsRes.error);
    }
    const raw = (statsRes.data ?? {}) as Record<string, any>;
    setStats({
      products: Number(raw.products ?? 0),
      sold_products: Number(raw.sold_products ?? 0),
      views: Number(raw.views ?? 0),
      likes: Number(raw.likes ?? 0),
      seller_rating: Number(raw.seller_rating ?? 0),
      seller_ratings_count: Number(raw.seller_ratings_count ?? 0),
    });

    setFollowCounts({
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    });

    setProducts((productsRes.data ?? []) as unknown as MyProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/profile');
        return;
      }
      setUser(session.user);
      await loadAll(session.user.id);
    };
    void init();
  }, [router, loadAll]);

  const isSubscribed =
    !!profile &&
    profile.subscription_type !== 'free' &&
    !!profile.subscription_end_date &&
    new Date(profile.subscription_end_date).getTime() > Date.now();

  const handleCopyUserId = async () => {
    if (!profile) return;
    const value = profile.user_id ? String(profile.user_id) : profile.id;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Avatar / cover upload — same bucket & path scheme as the store page
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'avatar' | 'cover',
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.');
      return;
    }
    setUploading(kind);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const filePath = `profiles/${user.id}/${user.id}-${Date.now()}-${kind}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, compressed, { upsert: true, contentType: compressed.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      if (!publicUrl) throw new Error('فشل الحصول على رابط الصورة');

      const patch =
        kind === 'avatar'
          ? { profile_image_url: publicUrl }
          : { cover_image_url: publicUrl };
      const { error: dbError } = await supabase
        .from('users')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (dbError) throw dbError;

      setProfile((prev) => (prev ? ({ ...prev, ...patch } as ProfileRow) : prev));
    } catch (err: any) {
      console.error(err);
      window.alert(err.message || 'حدث خطأ أثناء رفع الصورة.');
    } finally {
      setUploading(null);
    }
  };

  const saveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bioDraft.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, bio: bioDraft.trim() } : prev));
      setEditingBio(false);
    } catch (err: any) {
      window.alert(err.message || 'تعذر حفظ النبذة.');
    } finally {
      setSavingBio(false);
    }
  };

  // Mark sold / un-sell — same optimistic toggle + update as the app grid
  const toggleSold = async (product: MyProduct) => {
    setBusyId(product.id);
    const next = !product.is_sold;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_sold: next })
        .eq('id', product.id)
        .eq('seller_id', user.id); // ownership guard, mirrors app behavior
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_sold: next } : p)),
      );
    } catch (err: any) {
      window.alert(err.message || 'تعذر تحديث حالة البيع.');
    } finally {
      setBusyId(null);
    }
  };

  // Permanent delete — same remote-first destructive action as the app
  const deleteProduct = async (product: MyProduct) => {
    if (!window.confirm(`حذف "${product.name}" نهائياً؟ لا يمكن التراجع.`)) return;
    setBusyId(product.id);
    try {
      await supabase.from('product_images').delete().eq('product_id', product.id);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('seller_id', user.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err: any) {
      window.alert(err.message || 'تعذر حذف الإعلان.');
      await loadAll(user.id);
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading && !profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm">
        جاري تحميل ملفك الشخصي...
      </div>
    );
  }

  const statCards = [
    { label: 'يتابعني', value: followCounts.followers, icon: Users },
    { label: 'مبيعاتي', value: stats?.sold_products ?? 0, icon: ShoppingBag },
    { label: 'إعلاناتي', value: stats?.products ?? 0, icon: Package },
    { label: 'المشاهدات', value: stats?.views ?? 0, icon: Eye },
    { label: 'الإعجابات', value: stats?.likes ?? 0, icon: Heart },
    {
      label: 'تقييمي',
      value:
        stats && stats.seller_ratings_count > 0
          ? `${Number(stats.seller_rating).toFixed(1)} (${stats.seller_ratings_count})`
          : 0,
      icon: Star,
    },
  ];

  return (
    <main className="min-h-[calc(100vh-68px)] bg-[#f7f8f8] dark:bg-[#0d0d0d] pb-24" dir="rtl">
      {/* ===== Header block (mirrors app ProfileHeader) ===== */}
      <section className="relative">
        <div
          className="h-44 w-full bg-gradient-to-l from-[#087d3d] to-[#10ad58] md:h-52"
          style={
            profile?.cover_image_url
              ? { backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        />
        <label className="absolute left-4 top-4 cursor-pointer rounded-xl bg-black/35 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm transition hover:bg-black/50">
          {uploading === 'cover' ? 'جاري الرفع...' : 'تغيير الغلاف'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e, 'cover')} />
        </label>

        <div className="mx-auto max-w-3xl px-4">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-[#1a1a1a] dark:bg-[#1a1a1a]">
                {profile?.profile_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.profile_image_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-black text-[#087d3d]">
                    {profile?.name?.charAt(0) || '؟'}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#079447] text-white shadow-md transition hover:bg-[#067b3c]" title="تغيير الصورة">
                <Pencil className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e, 'avatar')} />
              </label>
            </div>

            <button
              onClick={handleLogout}
              className="mb-2 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              خروج
            </button>
          </div>

          {/* Name + subscription badge + meta */}
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-[#242628] dark:text-white">{profile?.name}</h1>
              {isSubscribed && (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-l from-[#FFB300] to-[#FFD54F] px-2.5 py-0.5 text-[10px] font-black text-[#5b3c00] shadow">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  مشترك · {PLANS_AR[profile?.subscription_type ?? 'free'] ?? ''}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs font-semibold text-[#7a8086]">
              {[profile?.governorate, `عضواً منذ ${memberSince(profile?.created_at ?? new Date().toISOString())}`]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {/* Numeric ID card (app UserIdCard parity) */}
            <button
              onClick={handleCopyUserId}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#e3e8e5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#56605b] transition hover:bg-[#f8faf9] dark:border-[#343434] dark:bg-[#1a1a1a] dark:text-[#d0d0d0]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'تم النسخ!' : `المعرّف: ${profile?.user_id ?? profile?.id}`}
            </button>
          </div>

          {/* Bio pill */}
          <button
            onClick={() => {
              setBioDraft(profile?.bio ?? '');
              setEditingBio(true);
            }}
            className="mt-3 w-full rounded-2xl border border-dashed border-[#bcd9c8] bg-white/70 p-3 text-right text-xs font-semibold leading-6 text-[#4f555a] transition hover:border-[#10ad58] dark:border-[#2e4a3a] dark:bg-[#152019] dark:text-[#c9d4cd]"
          >
            {profile?.bio?.trim()
              ? profile.bio
              : '+ اكتب نبذة تعريفية عنك تظهر للمشترين'}
          </button>
        </div>
      </section>

      {/* ===== Stats bar (same cards & order as the app) ===== */}
      <section className="mx-auto mt-5 max-w-3xl px-4">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#eceeed] bg-white p-3 text-center shadow-[0_6px_18px_-14px_rgba(16,24,40,0.3)] dark:border-[#303030] dark:bg-[#1a1a1a]"
            >
              <card.icon className="mx-auto h-4 w-4 text-[#10ad58]" />
              <p className="mt-1.5 text-sm font-black text-[#242628] dark:text-white">
                {typeof card.value === 'number' && card.value > 999
                  ? `${(card.value / 1000).toFixed(1)}K`
                  : card.value}
              </p>
              <p className="text-[9px] font-bold text-[#959b9f]">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== My listings grid (owner actions like the app's long-press menu) ===== */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-[#242628] dark:text-white">إعلاناتي</h2>
          <Link href="/mobiles/add" className="rounded-xl bg-[#079447] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-[#067b3c]">
            + إعلان جديد
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-[#e7e9ec] bg-white py-14 text-center dark:border-[#343434] dark:bg-[#1a1a1a]">
            <Package className="mx-auto h-10 w-10 text-[#c8ced2]" />
            <p className="mt-3 text-sm font-bold text-[#50555a] dark:text-[#d3d3d3]">لا توجد إعلانات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition dark:bg-[#1a1a1a] ${
                  p.is_sold ? 'border-emerald-300 opacity-80 dark:border-[#2e4a3a]' : 'border-[#eceeed] dark:border-[#303030]'
                }`}
              >
                <Link href={`/mobiles/${p.slug}`} className="block aspect-square overflow-hidden bg-slate-100 dark:bg-[#222]">
                  {firstProductImageUrl(p.product_images) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={firstProductImageUrl(p.product_images)} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-3xl">📱</span>
                  )}
                </Link>
                {p.is_sold && (
                  <span className="absolute -mt-[136px] mr-2 rounded-lg bg-[#00A344] px-2 py-0.5 text-[9px] font-black text-white">
                    تم البيع
                  </span>
                )}
                <div className="p-2.5">
                  <p className="truncate text-[11px] font-bold text-[#303532] dark:text-[#e0e0e0]">{p.name}</p>
                  <p className="mt-0.5 text-[11px] font-black text-[#00A344]">
                    {p.price > 0 ? `${p.price.toLocaleString('ar-EG')} جنيه` : 'قابل للتفاوض'}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => void toggleSold(p)}
                      disabled={busyId === p.id}
                      className={`flex-1 rounded-lg py-1.5 text-[9px] font-black transition disabled:opacity-50 ${
                        p.is_sold
                          ? 'bg-slate-100 text-[#56605b] hover:bg-slate-200 dark:bg-[#262626] dark:text-[#c9d4cd]'
                          : 'bg-[#E8F5E9] text-[#007a36] hover:bg-[#dcefe2]'
                      }`}
                    >
                      {p.is_sold ? 'إلغاء البيع' : 'تمييز كمباع'}
                    </button>
                    <button
                      onClick={() => void deleteProduct(p)}
                      disabled={busyId === p.id}
                      title="حذف نهائي"
                      className="rounded-lg bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bio edit dialog */}
      {editingBio && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#1c1c1c]">
            <h3 className="text-sm font-black text-[#242628] dark:text-white">نبذتك التعريفية</h3>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={4}
              maxLength={300}
              placeholder="اكتب نبذة قصيرة تظهر لمشتري إعلاناتك..."
              className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-[#00C853] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-left text-[9px] text-slate-400">{bioDraft.length}/300</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void saveBio()}
                disabled={savingBio}
                className="flex-1 rounded-xl bg-[#079447] py-2.5 text-xs font-black text-white transition hover:bg-[#067b3c] disabled:opacity-60"
              >
                {savingBio ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => setEditingBio(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-[#56605b] transition hover:bg-slate-200 dark:bg-[#262626] dark:text-[#c9d4cd]"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
