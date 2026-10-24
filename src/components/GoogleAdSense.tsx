'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useAdSense } from '@/lib/ads-context';
import { getAdSenseClient, isAdExcludedPath, isAdsEnabled } from '@/lib/ads-config';

export default function GoogleAdSense() {
  const pathname = usePathname();
  const { isSuppressed } = useAdSense();

  // 1. Feature flag check: do not load at all if ads are disabled
  if (!isAdsEnabled()) {
    return null;
  }

  // 2. Client ID check: do not load if publisher ID is missing
  const clientId = getAdSenseClient();
  if (!clientId) {
    return null;
  }

  // 3. Path exclusion check: do not load on private/auth/admin/chat/profile pages
  if (isAdExcludedPath(pathname)) {
    return null;
  }

  // 4. Content check: do not load on empty search or empty category results
  if (isSuppressed) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
