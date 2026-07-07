'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Home, Search, MessageSquare, Bell, User, LogOut, ChevronDown,
  Heart, Plus, Menu, X, Smartphone
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isProductPage = pathname.startsWith('/mobiles/') && pathname !== '/mobiles/add' && pathname !== '/mobiles';
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [country, setCountry] = useState<string>('SA'); // Default to SA

  useEffect(() => {
    // Check cookie or localStorage for country preference
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? match[2] : null;
    };
    
    let activeCountry = getCookie('selected_country');
    if (!activeCountry) {
      activeCountry = localStorage.getItem('selected_country');
    }
    
    if (activeCountry) {
      setCountry(activeCountry);
    } else {
      // Auto detect country by IP Geolocation
      const detectCountry = async () => {
        try {
          const res = await fetch('https://freeipapi.com/api/json');
          if (res.ok) {
            const data = await res.json();
            const code = data.countryCode?.toUpperCase();
            if (code === 'EG') {
              setCountry('EG');
              document.cookie = `selected_country=EG; path=/; max-age=${60 * 60 * 24 * 365}`;
              localStorage.setItem('selected_country', 'EG');
              router.refresh();
            } else {
              setCountry('SA');
              document.cookie = `selected_country=SA; path=/; max-age=${60 * 60 * 24 * 365}`;
              localStorage.setItem('selected_country', 'SA');
              router.refresh();
            }
          } else {
            // Fallback to SA
            setCountry('SA');
            document.cookie = `selected_country=SA; path=/; max-age=${60 * 60 * 24 * 365}`;
            localStorage.setItem('selected_country', 'SA');
          }
        } catch (e) {
          // Fallback to SA
          setCountry('SA');
          document.cookie = `selected_country=SA; path=/; max-age=${60 * 60 * 24 * 365}`;
          localStorage.setItem('selected_country', 'SA');
        }
      };
      detectCountry();
    }
  }, [router]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    document.cookie = `selected_country=${newCountry}; path=/; max-age=${60 * 60 * 24 * 365}`;
    localStorage.setItem('selected_country', newCountry);
    router.refresh();
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchCounts(session.user.id);
      } else {
        setUser(null); setProfile(null);
        setUnreadMessages(0); setUnreadNotifications(0); setFavoritesCount(0);
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
          setUser(null); setProfile(null);
          setUnreadMessages(0); setUnreadNotifications(0);
        }
      }
    );
    return () => { subscription.unsubscribe(); };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) setProfile(data);
    } catch (err) { console.error('Error fetching profile:', err); }
  };

  const fetchCounts = async (userId: string) => {
    try {
      const { data: unreadMsgs, error: err1 } = await supabase.rpc('get_total_unread');
      if (!err1 && unreadMsgs !== null) setUnreadMessages(Number(unreadMsgs));

      const { data: unreadNotifs, error: err2 } = await supabase.rpc('get_unread_notifications_count', { p_user_id: userId });
      if (!err2 && unreadNotifs !== null) setUnreadNotifications(Number(unreadNotifs));

      const { count: favCount, error: err3 } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      if (!err3 && favCount !== null) setFavoritesCount(favCount);
    } catch (err) { console.error('Error fetching counts:', err); }
  };

  useEffect(() => {
    if (!user) return;
    const notificationsChannel = supabase.channel('header-notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { fetchCounts(user.id); }).subscribe();
    const conversationsChannel = supabase.channel('header-conversations').on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => { fetchCounts(user.id); }).subscribe();
    const favoritesChannel = supabase.channel('header-favorites').on('postgres_changes', { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` }, () => { fetchCounts(user.id); }).subscribe();
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

  const isActive = (path: string) => pathname === path;

  const Badge = ({ count }: { count: number }) => count > 0 ? (
    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 animate-scaleIn">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

  return (
    <>
      {/* ══════ DESKTOP HEADER ══════ */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800/60 transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-[65px]">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="سوق فون" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-xl font-black text-ocean-600 dark:text-ocean-400 hidden sm:inline">سوق{' '}<span className="text-slate-800 dark:text-white">فون</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/', label: 'الرئيسية', icon: Home },
                { href: '/mobiles', label: 'تصفح الهواتف', icon: Smartphone },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive(item.href)
                      ? 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-ocean-600'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              
              {user && (
                <>
                  <Link href="/favorites" className={`relative px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/favorites') ? 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="relative">
                      <Heart className="w-4 h-4" />
                      <Badge count={favoritesCount} />
                    </div>
                    المفضلة
                  </Link>
                  <Link href="/chat" className={`relative px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/chat') ? 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4" />
                      <Badge count={unreadMessages} />
                    </div>
                    المحادثات
                  </Link>
                  <Link href="/notifications" className={`relative px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/notifications') ? 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="relative">
                      <Bell className="w-4 h-4" />
                      <Badge count={unreadNotifications} />
                    </div>
                    الإشعارات
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Country Selector Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700/60 py-1.5 px-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer">
                  <span>{country === 'SA' ? '🇸🇦 السعودية' : '🇪🇬 مصر'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl py-1.5 hidden group-hover:block animate-fadeInDown z-50">
                  <button
                    onClick={() => handleCountryChange('SA')}
                    className={`w-full text-right px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      country === 'SA' ? 'text-ocean-600 bg-ocean-50/50 dark:bg-ocean-950/20' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    🇸🇦 السعودية
                  </button>
                  <button
                    onClick={() => handleCountryChange('EG')}
                    className={`w-full text-right px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      country === 'EG' ? 'text-ocean-600 bg-ocean-50/50 dark:bg-ocean-950/20' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    🇪🇬 مصر
                  </button>
                </div>
              </div>

              <ThemeToggle />
              
              <Link 
                href="/mobiles/add"
                className="bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-ocean-600/15"
              >
                <Plus className="w-4 h-4" />
                أضف إعلان
              </Link>

              {user ? (
                <div className="relative group">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)} 
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-ocean-100 dark:bg-ocean-900 text-ocean-700 dark:text-ocean-300 font-bold text-xs flex items-center justify-center overflow-hidden">
                      {profile?.profile_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl py-1.5 hidden group-hover:block animate-fadeInDown z-50">
                    {profile && (
                      <Link href={`/store/${profile.id}`} className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors">
                        <User className="w-3.5 h-3.5" />
                        ملفي الشخصي
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold transition-colors border-t border-slate-50 dark:border-slate-700 mt-0.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-ocean-600 font-bold text-xs px-3 py-2 transition-colors">
                    دخول
                  </Link>
                  <Link href="/signup" className="bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm">
                    حساب جديد
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Controls */}
            <div className="flex md:hidden items-center gap-1">
              {user && (
                <Link href="/notifications" className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-ocean-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  <Badge count={unreadNotifications} />
                </Link>
              )}
              <ThemeToggle />
              {user ? (
                <Link href={`/store/${user.id}`} className="w-8 h-8 rounded-lg bg-ocean-100 dark:bg-ocean-900 text-ocean-700 dark:text-ocean-300 font-bold text-xs flex items-center justify-center overflow-hidden">
                  {profile?.profile_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                  )}
                </Link>
              ) : (
                <Link href="/login" className="bg-ocean-50 dark:bg-ocean-950 text-ocean-700 dark:text-ocean-400 font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all">
                  دخول
                </Link>
              )}
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-ocean-600 transition-colors cursor-pointer"
                aria-label="القائمة"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════ MOBILE BOTTOM NAV ══════ */}
      {!isProductPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center transition-colors">
          {[
            { href: '/', icon: Home, label: 'الرئيسية', active: isActive('/') },
            { href: user ? '/favorites' : '/login', icon: Heart, label: 'المفضلة', active: isActive('/favorites'), badge: favoritesCount },
            { href: '/mobiles/add', icon: Plus, label: 'بيع الآن', active: false, isCenter: true },
            { href: user ? '/chat' : '/login', icon: MessageSquare, label: 'المحادثات', active: isActive('/chat'), badge: unreadMessages },
            { href: user ? (profile ? `/store/${profile.id}` : `/store/${user.id}`) : '/login', icon: User, label: 'حسابي', active: pathname.startsWith('/store/') },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 transition-all relative ${
                item.isCenter ? '' : item.active 
                  ? 'text-ocean-600 dark:text-ocean-400' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {item.isCenter ? (
                <>
                  <div className="w-11 h-11 bg-gradient-to-tr from-ocean-600 to-ocean-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-ocean-500/20 -mt-5 border-2 border-white dark:border-slate-900">
                    <Plus className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <span className="text-[9px] font-bold text-ocean-600 dark:text-ocean-400 mt-0.5">{item.label}</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className={`w-5 h-5 ${item.active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[7px] font-bold min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium mt-0.5">{item.label}</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      )}

      {/* ══════ MOBILE DRAWER ══════ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" dir="rtl">
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl p-5 z-50 animate-slideInRight">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-base font-black text-ocean-600 dark:text-ocean-400">القائمة</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl mb-5">
                <div className="w-10 h-10 rounded-lg bg-ocean-100 dark:bg-ocean-900 text-ocean-700 dark:text-ocean-300 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.profile_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">مرحباً بك</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{profile?.name || user.email}</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-5 text-center">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">سجل دخولك لتجربة كاملة</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="bg-ocean-600 text-white text-xs font-bold py-2 rounded-lg text-center">دخول</Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded-lg text-center">حساب جديد</Link>
                </div>
              </div>
            )}

            {/* Country Selector in Mobile Drawer */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-450">تغيير الدولة</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { handleCountryChange('SA'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    country === 'SA' 
                      ? 'bg-ocean-600 text-white' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  🇸🇦 السعودية
                </button>
                <button
                  onClick={() => { handleCountryChange('EG'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    country === 'EG' 
                      ? 'bg-ocean-600 text-white' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  🇪🇬 مصر
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto">
              {[
                { href: '/', icon: Home, label: 'الرئيسية', active: isActive('/') },
                { href: '/mobiles', icon: Search, label: 'تصفح الهواتف', active: isActive('/mobiles') },
                ...(user ? [
                  ...(profile ? [{ href: `/store/${profile.id}`, icon: User, label: 'ملفي الشخصي', active: pathname.startsWith('/store/') }] : []),
                  { href: '/favorites', icon: Heart, label: 'المفضلة', active: isActive('/favorites'), badge: favoritesCount },
                  { href: '/chat', icon: MessageSquare, label: 'المحادثات', active: isActive('/chat'), badge: unreadMessages },
                  { href: '/notifications', icon: Bell, label: 'الإشعارات', active: isActive('/notifications'), badge: unreadNotifications },
                ] : []),
              ].map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    item.active ? 'bg-ocean-50 dark:bg-ocean-950/30 text-ocean-600 dark:text-ocean-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                  {item.badge > 0 && (
                    <span className="mr-auto bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            {user && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
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
