'use client';

import { ShieldCheck, MessageCircle, Percent, Sparkles } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: <Percent className="w-6 h-6 text-ocean-600 dark:text-ocean-400" />,
      title: 'بدون أي عمولات',
      desc: 'البيع والشراء مجاني تماماً بين البائع والمشتري مباشرة',
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-ocean-600 dark:text-ocean-400" />,
      title: 'تواصل مباشر وسريع',
      desc: 'اتصل أو دردش عبر واتساب مباشرة مع صاحب الإعلان بدون وسيط',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-ocean-600 dark:text-ocean-400" />,
      title: 'آمن وموثوق',
      desc: 'فحص دوري للإعلانات لمنع الاحتيال وضمان جودة المعروضات',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-ocean-600 dark:text-ocean-400" />,
      title: 'أفضل أسعار الهواتف',
      desc: 'قارن وتصفح آلاف الأجهزة الجديدة والمستعملة في مكان واحد',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y border-slate-100 dark:border-slate-800 my-8 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="p-3 bg-ocean-50 dark:bg-ocean-950/30 rounded-xl shrink-0">
            {badge.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              {badge.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {badge.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
