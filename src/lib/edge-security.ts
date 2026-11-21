const BLOCKED_PROBE_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.htaccess/i,
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/wp-includes/i,
  /^\/xmlrpc\.php/i,
  /^\/phpinfo/i,
  /^\/phpmyadmin/i,
  /\/etc\/passwd/i,
  /\.\.[/\\]/,
];

type BucketEntry = { count: number; resetAt: number };

const rateBuckets = new Map<string, BucketEntry>();
const MAX_BUCKETS = 4000;

export function isBlockedProbePath(pathname: string): boolean {
  const decoded = (() => {
    try {
      return decodeURIComponent(pathname);
    } catch {
      return pathname;
    }
  })();
  return BLOCKED_PROBE_PATTERNS.some((re) => re.test(pathname) || re.test(decoded));
}

export function checkEdgeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { allowed: boolean; retryAfterSec: number } {
  if (rateBuckets.size > MAX_BUCKETS) {
    for (const [k, entry] of rateBuckets.entries()) {
      if (entry.resetAt <= now) rateBuckets.delete(k);
    }
  }

  const existing = rateBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}
