'use client';

import Link from 'next/link';
import { Smartphone, Shield, Headphones, CreditCard, MapPin, Mail, Phone, ChevronLeft } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'تداول آمن وموثوق', desc: 'حماية كاملة للمشتري والبائع' },
              { icon: CreditCard, title: 'بدون عمولات', desc: 'بيع واشتري بدون أي رسوم' },
              { icon: Headphones, title: 'دعم فني متواصل', desc: 'فريق الدعم جاهز لمساعدتك' },
              { icon: Smartphone, title: 'تطبيق سهل الاستخدام', desc: 'تجربة سلسة على كل الأجهزة' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-ocean-50 dark:bg-ocean-950/40 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="سوق فون" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-black text-ocean-600 dark:text-ocean-400">سوق{' '}<span className="text-slate-800 dark:text-white">فون</span></span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              المنصة الأولى في مصر لبيع وشراء الهواتف المستعملة والجديدة. تواصل مباشر مع البائعين بدون عمولات.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {['فيسبوك', 'انستجرام', 'تويتر'].map((social) => (
                <button key={social} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 dark:hover:bg-ocean-950/40 transition-all text-[10px] font-bold">
                  {social.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'الصفحة الرئيسية', href: '/' },
                { label: 'تصفح الهواتف', href: '/mobiles' },
                { label: 'أضف إعلانك', href: '/mobiles/add' },
                { label: 'المفضلة', href: '/favorites' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-medium flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">المساعدة</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'كيف أبيع جهازي؟', href: '#' },
                { label: 'نصائح الشراء الآمن', href: '#' },
                { label: 'الأسئلة الشائعة', href: '#' },
                { label: 'تواصل معنا', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-medium flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">حمّل التطبيق</h4>
            <a
              href="https://play.google.com/store/apps/details?id=com.souqphone.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white p-3 rounded-xl transition-all group"
            >
              <svg viewBox="0 0 512 512" className="w-7 h-7 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1L375 137.4l97.2 55.7c21.8 12.5 21.8 35 0 47.5zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
              </svg>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-medium">تحميل من</p>
                <p className="text-sm font-bold">Google Play</p>
              </div>
            </a>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-ocean-500" />
              <span>تطبيق آمن ورسمي 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-100 dark:border-slate-800 py-5">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            © {currentYear} سوق فون. جميع الحقوق محفوظة.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            بيع وشراء الهواتف بأمان وبدون عمولات في مصر 🇪🇬
          </p>
        </div>
      </div>
    </footer>
  );
}
