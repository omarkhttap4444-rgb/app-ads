export function isRemoteMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Public base URL of the Cloudflare R2 custom domain
// (e.g. https://images.souqphone.com). Client-safe: no secrets.
export const R2_PUBLIC_BASE_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
).replace(/\/$/, '');

export function isSupabaseImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      (url.hostname.endsWith('.supabase.co') ||
        url.hostname.endsWith('.supabase.in'))
    );
  } catch {
    return false;
  }
}

export function isR2ImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !R2_PUBLIC_BASE_URL) return false;
  try {
    const base = new URL(R2_PUBLIC_BASE_URL);
    const url = new URL(value.trim());
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname === base.hostname &&
      url.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/products/`)
    );
  } catch {
    return false;
  }
}

// Extracts the R2 object key (e.g. `products/<uid>/...`) from a public URL.
// Returns null for non-R2 URLs. Used for best-effort cleanup on delete.
export function getR2ObjectKeyFromUrl(value: unknown): string | null {
  if (!isR2ImageUrl(value)) return null;
  try {
    const base = new URL(R2_PUBLIC_BASE_URL);
    const url = new URL((value as string).trim());
    const basePath = base.pathname.replace(/\/$/, '');
    let key = url.pathname;
    if (basePath && key.startsWith(`${basePath}/`)) {
      key = key.slice(basePath.length + 1);
    } else {
      key = key.replace(/^\//, '');
    }
    return key.startsWith('products/') ? key : null;
  } catch {
    return null;
  }
}
