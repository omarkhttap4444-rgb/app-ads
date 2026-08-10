'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const theme = useSyncExternalStore<'light' | 'dark'>(
    (onStoreChange) => {
      window.addEventListener('souqphone-theme-change', onStoreChange);
      return () =>
        window.removeEventListener('souqphone-theme-change', onStoreChange);
    },
    () =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    () => 'light',
  );

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('souqphone-theme-change'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/20 active:scale-95"
      aria-label="تبديل المظهر"
      title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 fill-white transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 text-amber-300 transition-transform duration-300 hover:scale-110" />
      )}
    </button>
  );
}
