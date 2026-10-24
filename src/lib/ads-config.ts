/**
 * Google AdSense Configuration and Helper Utilities.
 *
 * Rules:
 * - Publisher ID is loaded strictly from NEXT_PUBLIC_ADSENSE_CLIENT (never hardcoded in code).
 * - Ads are completely disabled if NEXT_PUBLIC_ENABLE_ADS !== 'true'.
 * - Excluded paths (auth, chat, profile, notifications, admin, checkout, private user data) must never load ads.
 */

export const getAdSenseClient = (): string => {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || '';
};

export const isAdsEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_ADS?.trim().toLowerCase() === 'true';
};

/**
 * Excluded paths: authentication, user profile, chat, notifications,
 * ad creation/dashboard, checkout/orders, admin, and any page with private user data.
 */
export const EXCLUDED_AD_PATHS: readonly string[] = [
  '/login',
  '/signup',
  '/auth',
  '/profile',
  '/chat',
  '/notifications',
  '/mobiles/add',
  '/favorites',
  '/checkout',
  '/orders',
  '/payment',
  '/admin',
  '/dashboard',
  '/account',
  '/settings',
  '/cart',
] as const;

/**
 * Checks if a given pathname matches any excluded route.
 * Normalizes trailing slashes and handles case-insensitivity.
 */
export function isAdExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;

  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  return EXCLUDED_AD_PATHS.some((excluded) => {
    const target = excluded.toLowerCase().replace(/\/+$/, '');
    return normalized === target || normalized.startsWith(`${target}/`);
  });
}
