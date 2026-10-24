'use client';

import { useEffect } from 'react';
import { useAdSense } from '@/lib/ads-context';

export default function SuppressAds() {
  const { setSuppressed } = useAdSense();

  useEffect(() => {
    setSuppressed(true);

    return () => {
      setSuppressed(false);
    };
  }, [setSuppressed]);

  return null;
}
