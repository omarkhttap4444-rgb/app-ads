'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  Search, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown,
  Heart,
  Plus,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auth & Session state
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchCounts(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setUnreadMessages(0);
        setUnreadNotifications(0);
        setFavoritesCount(0);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
          fetchCounts(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setUnreadMessages(0);
          setUnreadNotifications(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from public.users table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch unread messages, notifications & favorites counts
  const fetchCounts = async (userId: string) => {
    try {
      // Unread messages
      const { data: unreadMsgs, error: err1 } = await supabase.rpc('get_total_unread');
      if (!err1 && unreadMsgs !== null) {
        setUnreadMessages(Number(unreadMsgs));
      }

      // Unread notifications
      const { data: unreadNotifs, error: err2 } = await supabase.rpc('get_unread_notifications_count', {
        p_user_id: userId
      });
      if (!err2 && unreadNotifs !== null) {
        setUnreadNotifications(Number(unreadNotifs));
      }

      // Favorites count
      const { count: favCount, error: err3 } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!err3 && favCount !== null) {
        setFavoritesCount(favCount);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  // Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    // Realtime channel for notifications
    const notificationsChannel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCounts(user.id);
        }
      )
      .subscribe();

    // Realtime channel for conversations (which updates message counts)
    const conversationsChannel = supabase
      .channel('header-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchCounts(user.id);
        }
      )
      .subscribe();

    // Realtime channel for favorites (to update the counter badge)
    const favoritesChannel = supabase
      .channel('header-favorites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCounts(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(favoritesChannel);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Helper for active route styling
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Top Header - Desktop & Tablet */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm py-4 transition-colors duration-200">
        <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="text-2xl font-black text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="سوق فون Logo" className="w-9 h-9 rounded-xl object-contain shadow-md shadow-teal-500/10 border border-slate-100 dark:border-slate-800" />
            سوق<span className="text-slate-900 dark:text-slate-100">فون</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <Link 
              href="/" 
              className={`transition-colors py-1.5 border-b-2 ${
                isActive('/') 
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold' 
                  : 'border-transparent text-slate-650 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              الرئيسية
            </Link>
            <Link 
              href="/mobiles" 
              className={`transition-colors py-1.5 border-b-2 ${
                isActive('/mobiles') 
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold' 
                  : 'border-transparent text-slate-655 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              تصفح الهواتف
            </Link>
            {user && (
              <>
                <Link 
                  href="/favorites" 
                  className={`transition-colors py-1.5 border-b-2 flex items-center gap-1.5 ${
                    isActive('/favorites') 
                      ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold' 
                      : 'border-transparent text-slate-655 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  المفضلة
                  {favoritesCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {favoritesCount}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/chat" 
                  className={`transition-colors py-1.5 border-b-2 flex items-center gap-1.5 ${
                    isActive('/chat') 
                      ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold' 
                      : 'border-transparent text-slate-655 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  المحادثات
                  {unreadMessages > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/notifications" 
                  className={`transition-colors py-1.5 border-b-2 flex items-center gap-1.5 ${
                    isActive('/notifications') 
                      ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold' 
                      : 'border-transparent text-slate-655 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  الإشعارات
                  {unreadNotifications > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* Desktop User Panel */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {/* Add product button on desktop */}
            <Link 
              href="/mobiles/add"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-md shadow-teal-600/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              أضف إعلان
            </Link>

            {user ? (
              <div className="relative group">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)} 
                  className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 py-1.5 px-3 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-bold text-sm flex items-center justify-center overflow-hidden border border-teal-200 dark:border-teal-850">
                    {profile?.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">مرحباً بك</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{profile?.name || user.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200 group-hover:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl py-2 hidden group-hover:block transition-all z-50">
                  {profile && (
                    <Link href={`/store/${profile.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      <User className="w-4 h-4" />
                      ملفي الشخصي
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border-t border-slate-50 dark:border-slate-700 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-semibold text-sm transition-colors px-4 py-2"
                >
                  تسجيل الدخول
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-teal-600/10 hover:shadow-lg transition-all"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation Controls (Top bar) */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Notifications Icon (Only visible if logged in) */}
            {user && (
              <Link 
                href="/notifications" 
                className="p-2 text-slate-550 dark:text-slate-400 hover:text-teal-655 dark:hover:text-teal-400 transition-colors relative"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full min-w-[12px] text-center animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            <ThemeToggle />

            {/* Profile Avatar / Login Button outside (exactly as it was) */}
            {user ? (
              <Link href={`/store/${user.id}`} className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-350 font-bold text-sm flex items-center justify-center overflow-hidden border border-teal-200 dark:border-teal-800">
                {profile?.profile_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                )}
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                دخول
              </Link>
            )}

            {/* Hamburger Menu Icon (Toggles Drawer) */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-550 dark:text-slate-400 hover:text-teal-655 dark:hover:text-teal-400 transition-colors cursor-pointer"
              aria-label="القائمة الرئيسية"
              title="القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* Bottom Navigation Bar - Mobile View Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100/90 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-4 py-2 flex justify-around items-center backdrop-blur-md transition-colors duration-200">
        {/* 1. الرئيسية */}
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 py-1 transition-all ${
            isActive('/') ? 'text-teal-650 dark:text-teal-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Home className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] font-medium">الرئيسية</span>
        </Link>

        {/* 2. المفضلة */}
        <Link 
          href={user ? "/favorites" : "/login"} 
          className={`flex flex-col items-center gap-1 py-1 transition-all relative ${
            isActive('/favorites') ? 'text-teal-650 dark:text-teal-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Heart className={`w-5 h-5 ${isActive('/favorites') ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] font-medium">المفضلة</span>
          {favoritesCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center">
              {favoritesCount}
            </span>
          )}
        </Link>

        {/* 3. الزر الأوسط (بيع الآن) */}
        <Link 
          href="/mobiles/add" 
          className="flex flex-col items-center transition-all relative z-50 cursor-pointer"
        >
          <div className="w-11 h-11 bg-gradient-to-tr from-teal-650 to-cyan-650 hover:from-teal-755 hover:to-cyan-755 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 active:scale-95 transition-transform border-2 border-white dark:border-slate-900 -mt-6">
            <Plus className="w-5.5 h-5.5 stroke-[2.5px]" />
          </div>
          <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">بيع الآن</span>
        </Link>

        {/* 4. المحادثات */}
        <Link 
          href={user ? "/chat" : "/login"} 
          className={`flex flex-col items-center gap-1 py-1 transition-all relative ${
            isActive('/chat') ? 'text-teal-650 dark:text-teal-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className={`w-5 h-5 ${isActive('/chat') ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] font-medium">المحادثات</span>
          {unreadMessages > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center">
              {unreadMessages}
            </span>
          )}
        </Link>

        {/* 5. حسابي */}
        <Link 
          href={user ? (profile ? `/store/${profile.id}` : `/store/${user.id}`) : "/login"} 
          className={`flex flex-col items-center gap-1 py-1 transition-all ${
            isActive('/login') || isActive('/signup') || pathname.startsWith('/store/') ? 'text-teal-650 dark:text-teal-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <User className={`w-5 h-5 ${isActive('/login') || isActive('/signup') || pathname.startsWith('/store/') ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] font-medium">حسابي</span>
        </Link>
      </nav>

      {/* Mobile Hamburger Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" dir="rtl">
          {/* Overlay Background */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Side Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl p-6 transition-transform duration-300 transform translate-x-0 ease-out z-50">
            {/* Drawer Header */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-lg font-black text-teal-650 dark:text-teal-400">القائمة</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-550 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card inside Drawer */}
            <div className="mb-6">
              {user ? (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="w-12 h-12 rounded-xl bg-teal-105 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-bold text-base flex items-center justify-center overflow-hidden border border-teal-200 dark:border-teal-850 shrink-0">
                    {profile?.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xs text-slate-400 font-medium">مرحباً بك</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{profile?.name || user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">سجل دخولك لتجربة كاملة</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      href="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-teal-650 hover:bg-teal-755 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all text-center"
                    >
                      تسجيل دخول
                    </Link>
                    <Link 
                      href="/signup" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl transition-all text-center"
                    >
                      حساب جديد
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive('/') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Home className="w-5 h-5" />
                الرئيسية
              </Link>

              <Link 
                href="/mobiles" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive('/mobiles') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Search className="w-5 h-5" />
                تصفح الهواتف
              </Link>

              {user && (
                <>
                  {profile && (
                    <Link 
                      href={`/store/${profile.id}`} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        pathname.startsWith('/store/') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      ملفي الشخصي
                    </Link>
                  )}

                  <Link 
                    href="/favorites" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive('/favorites') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    المفضلة
                    {favoritesCount > 0 && (
                      <span className="mr-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/chat" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive('/chat') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    المحادثات
                    {unreadMessages > 0 && (
                      <span className="mr-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/notifications" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive('/notifications') ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    الإشعارات
                    {unreadNotifications > 0 && (
                      <span className="mr-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Logout at bottom of Drawer */}
            {user && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
