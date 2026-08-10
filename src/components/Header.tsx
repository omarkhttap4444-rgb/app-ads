'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Bell,
  ChevronDown,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Store,
  User,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

type Profile = {
  id: string;
  name?: string | null;
  profile_image_url?: string | null;
};

function CounterBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#ff5a45] px-1 text-[9px] font-black leading-none text-white dark:border-[#202020]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, name, profile_image_url')
      .eq('id', userId)
      .maybeSingle();

    setProfile((data as Profile | null) ?? null);
  };

  const fetchCounts = async (userId: string) => {
    const [messagesResult, notificationsResult, favoritesResult] =
      await Promise.all([
        supabase.rpc('get_total_unread'),
        supabase.rpc('get_unread_notifications_count', { p_user_id: userId }),
        supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

    if (!messagesResult.error && messagesResult.data !== null) {
      setUnreadMessages(Number(messagesResult.data));
    }
    if (!notificationsResult.error && notificationsResult.data !== null) {
      setUnreadNotifications(Number(notificationsResult.data));
    }
    if (!favoritesResult.error && favoritesResult.count !== null) {
      setFavoritesCount(favoritesResult.count);
    }
  };

  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        await Promise.all([
          fetchProfile(nextUser.id),
          fetchCounts(nextUser.id),
        ]);
      } else {
        setProfile(null);
        setUnreadMessages(0);
        setUnreadNotifications(0);
        setFavoritesCount(0);
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        void fetchProfile(nextUser.id);
        void fetchCounts(nextUser.id);
      } else {
        setProfile(null);
        setUnreadMessages(0);
        setUnreadNotifications(0);
        setFavoritesCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshCounts = () => void fetchCounts(user.id);
    const notificationsChannel = supabase
      .channel(`web-header-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        refreshCounts,
      )
      .subscribe();
    const conversationsChannel = supabase
      .channel(`web-header-conversations-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        refreshCounts,
      )
      .subscribe();
    const favoritesChannel = supabase
      .channel(`web-header-favorites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        refreshCounts,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(notificationsChannel);
      void supabase.removeChannel(conversationsChannel);
      void supabase.removeChannel(favoritesChannel);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDrawerOpen(false);
    setProfileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const accountHref = user
    ? `/store/${profile?.id ?? user.id}`
    : '/login';
  const isProductPage = pathname.startsWith('/mobiles/') && pathname !== '/mobiles/add';
  const searchPlaceholder = 'بتدور على إيه؟';

  return (
    <>
      <header
        className="app-shell-header sticky top-0 z-50 text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(2, 86, 46, 0.88), rgba(5, 129, 69, 0.62)), url('/nile_background.jpg')",
          backgroundPosition: 'center 52%',
          backgroundSize: 'cover',
        }}
      >
        <div className="mx-auto hidden h-[92px] max-w-7xl items-center gap-5 px-6 md:flex">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="سوق فون">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="سوق فون"
              className="h-12 w-12 rounded-2xl bg-white/92 object-contain p-1 shadow-lg"
            />
            <div className="leading-none">
              <span className="block text-xl font-black">سوق فون</span>
              <span className="mt-1 block text-[9px] font-bold text-white/78">
                بيع واشتري بسهولة
              </span>
            </div>
          </Link>

          <form action="/mobiles" className="app-search-pill mx-auto flex h-14 min-w-0 max-w-2xl flex-1 items-center rounded-full bg-white px-5 text-[#202124]">
            <Search className="h-6 w-6 shrink-0 text-[#44b765]" strokeWidth={2.7} />
            <input
              name="q"
              dir="rtl"
              aria-label="ابحث عن منتج"
              placeholder={searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold outline-none placeholder:text-[#8b95a1]"
            />
            <button className="rounded-full bg-[#079447] px-5 py-2 text-xs font-black text-white transition hover:bg-[#067b3c]">
              بحث
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-2" dir="ltr">
            <ThemeToggle />
            <Link href="/mobiles" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/10 backdrop-blur-sm transition hover:bg-black/20" aria-label="المتجر">
              <Store className="h-5 w-5" />
            </Link>
            <Link href={user ? '/notifications' : '/login'} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/10 backdrop-blur-sm transition hover:bg-black/20" aria-label="الإشعارات">
              <Bell className="h-5 w-5" />
              <CounterBadge count={unreadNotifications} />
            </Link>
            <Link href="/mobiles/add" className="flex h-10 items-center gap-2 rounded-full bg-[#079447] px-4 text-xs font-black shadow-lg transition hover:bg-[#067b3c]">
              <Plus className="h-4 w-4" strokeWidth={3} />
              أضف إعلانك
            </Link>
            {user ? (
              <div className="relative" dir="rtl">
                <button
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/10 px-2.5 backdrop-blur-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-black text-[#079447]">
                    {profile?.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.profile_image_url} alt="الحساب" className="h-full w-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) ?? user.email?.charAt(0) ?? 'ح'
                    )}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {profileMenuOpen && (
                  <div className="absolute left-0 top-12 w-48 overflow-hidden rounded-2xl border border-[#e7e9ec] bg-white p-2 text-[#202124] shadow-2xl dark:border-[#353535] dark:bg-[#202020] dark:text-white">
                    <Link href={accountHref} onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-[#f3f5f4] dark:hover:bg-[#292929]">
                      <User className="h-4 w-4" />
                      حسابي
                    </Link>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="rounded-full border border-white/80 px-4 py-2.5 text-xs font-black transition hover:bg-white hover:text-[#087d3d]">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>

        <div className="flex h-[104px] items-center gap-2.5 px-4 md:hidden" dir="ltr">
          <button onClick={() => setDrawerOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm" aria-label="فتح القائمة">
            <Menu className="h-7 w-7" strokeWidth={2.8} />
          </button>
          <ThemeToggle />
          <form action="/mobiles" className="app-search-pill flex h-14 min-w-0 flex-1 items-center rounded-full bg-white px-3 text-[#202124]">
            <Search className="h-6 w-6 shrink-0 text-[#48b765]" strokeWidth={2.8} />
            <input name="q" dir="rtl" aria-label="ابحث عن منتج" placeholder={searchPlaceholder} className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs font-bold outline-none placeholder:text-[#8b95a1]" />
          </form>
          <Link href="/mobiles" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm" aria-label="المتجر">
            <Store className="h-7 w-7 fill-white/20" strokeWidth={2.4} />
          </Link>
          <Link href={user ? '/notifications' : '/login'} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm" aria-label="الإشعارات">
            <Bell className="h-6 w-6" />
            <CounterBadge count={unreadNotifications} />
          </Link>
        </div>
      </header>

      {!isProductPage && (
        <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 grid h-[74px] grid-cols-5 items-end rounded-t-[28px] border-t border-[#eceeed] bg-white px-2 pb-2 pt-1 dark:border-[#303030] dark:bg-[#1f1f1f] md:hidden" dir="rtl">
          {[
            { href: '/', label: 'الرئيسية', icon: Home, count: 0, active: pathname === '/' },
            { href: user ? '/favorites' : '/login', label: 'مفضلة', icon: Heart, count: favoritesCount, active: pathname === '/favorites' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold ${item.active ? 'text-[#10b759]' : 'text-[#70757a]'}`}>
              <span className="relative">
                <item.icon className={`h-6 w-6 ${item.active ? 'fill-[#10b759]' : ''}`} strokeWidth={item.active ? 2.8 : 2} />
                <CounterBadge count={item.count} />
              </span>
              {item.label}
              {item.active && <span className="absolute -bottom-1 h-1 w-7 rounded-full bg-[#10b759]" />}
            </Link>
          ))}

          <Link href="/mobiles/add" className="relative flex h-14 flex-col items-center justify-end text-[10px] font-black text-[#10b759]">
            <span className="absolute -top-7 flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#12b95f] text-white shadow-[0_10px_30px_rgba(18,185,95,0.35)] dark:border-[#1f1f1f]">
              <Plus className="h-8 w-8" strokeWidth={2.7} />
            </span>
          </Link>

          <Link href={user ? '/chat' : '/login'} className={`relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold ${pathname === '/chat' ? 'text-[#10b759]' : 'text-[#70757a]'}`}>
            <span className="relative">
              <MessageSquare className="h-6 w-6" strokeWidth={2} />
              <CounterBadge count={unreadMessages} />
            </span>
            رسائل
          </Link>
          <Link href={accountHref} className={`relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold ${pathname.startsWith('/store/') ? 'text-[#10b759]' : 'text-[#70757a]'}`}>
            <User className="h-6 w-6" strokeWidth={2} />
            حسابي
          </Link>
        </nav>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" dir="rtl">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} aria-label="إغلاق القائمة" />
          <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white p-5 shadow-2xl dark:bg-[#1f1f1f]">
            <div className="flex items-center justify-between border-b border-[#eceeed] pb-4 dark:border-[#343434]">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="سوق فون" className="h-11 w-11 rounded-2xl object-contain" />
                <div>
                  <p className="font-black text-[#087d3d] dark:text-[#53d889]">سوق فون</p>
                  <p className="text-[10px] text-[#7a8086]">كل السوق في إيدك</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f3] dark:bg-[#292929]" aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user && (
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#b7efcf] bg-[#f5fff8] p-4 dark:border-[#164c31] dark:bg-[#12261b]">
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="rounded-xl border-2 border-[#078b43] py-2.5 text-center text-xs font-black text-[#078b43]">تسجيل الدخول</Link>
                <Link href="/signup" onClick={() => setDrawerOpen(false)} className="rounded-xl bg-[#078b43] py-2.5 text-center text-xs font-black text-white shadow-lg">إنشاء حساب</Link>
              </div>
            )}

            <div className="mt-5 space-y-1.5">
              {[
                { href: '/', label: 'الرئيسية', icon: Home },
                { href: '/mobiles', label: 'تصفح المنتجات', icon: Search },
                { href: '/mobiles/add', label: 'أضف إعلانك', icon: Plus },
                { href: user ? '/favorites' : '/login', label: 'المفضلة', icon: Heart },
                { href: user ? '/chat' : '/login', label: 'الرسائل', icon: MessageSquare },
                { href: accountHref, label: 'حسابي', icon: User },
              ].map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${pathname === item.href ? 'bg-[#ecfdf3] text-[#078b43] dark:bg-[#173323] dark:text-[#54db8d]' : 'text-[#4f555a] hover:bg-[#f3f5f4] dark:text-[#d0d0d0] dark:hover:bg-[#292929]'}`}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>

            {user && (
              <button onClick={handleLogout} className="mt-auto flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-950/25">
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </button>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
