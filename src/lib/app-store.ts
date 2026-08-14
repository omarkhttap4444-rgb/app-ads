export const PLAY_STORE_APP_ID = 'com.souqphone.app';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_APP_ID}`;

export type PlayStorePlacement =
  | 'home_banner'
  | 'products_banner'
  | 'footer'
  | 'product_details'
  | 'unknown';

export function getTrackedPlayStoreUrl(placement: PlayStorePlacement): string {
  const campaign = new URLSearchParams({
    utm_source: 'souqphone_web',
    utm_medium: 'referral',
    utm_campaign: 'app_growth',
    utm_content: placement,
  });

  const url = new URL(PLAY_STORE_URL);
  url.searchParams.set('referrer', campaign.toString());
  return url.toString();
}

