import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سوق فون - بيع وشراء الموبايلات',
    short_name: 'سوق فون',
    description: 'منصة بيع وشراء الموبايلات والإلكترونيات الجديدة والمستعملة في مصر.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8f8',
    theme_color: '#078b43',
    lang: 'ar',
    dir: 'rtl',
    categories: ['shopping', 'business', 'lifestyle'],
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
