export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://souqphone.com'
).replace(/\/$/, '');

export const SITE_NAME = 'سوق فون';

export const absoluteUrl = (path = '/') =>
  path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

export const productConditionUrl = (condition?: string | null) => {
  const normalized = condition?.trim().toLowerCase() ?? '';
  if (normalized.includes('جديد') || normalized.includes('new')) {
    return 'https://schema.org/NewCondition';
  }
  if (normalized.includes('مجدد') || normalized.includes('refurbished')) {
    return 'https://schema.org/RefurbishedCondition';
  }
  return 'https://schema.org/UsedCondition';
};
