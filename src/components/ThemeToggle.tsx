'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Determine the current theme based on document class
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-200 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
      aria-label="تبديل المظهر"
      title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
    >
      {theme === 'light' ? (
        <Moon className="w-4.5 h-4.5 transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="w-4.5 h-4.5 text-amber-500 transition-transform duration-300 hover:scale-110" />
      )}
    </button>
  );
}
