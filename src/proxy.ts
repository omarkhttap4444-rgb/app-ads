import { NextResponse, type NextRequest } from 'next/server';

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

function getClientIp(request: NextRequest): string {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];
  return candidates.find((v) => v && v.length <= 64) || 'unknown';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Drop exploit & credential scanner probes immediately
  if (isBlockedProbePath(pathname)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 2) Edge rate limiting on auth & API endpoints (brute-force & scraping protection)
  const isApi = pathname.startsWith('/api/');
  const isAuth =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isApi || isAuth) {
    const ip = getClientIp(request);
    const scope = isApi ? 'api' : 'auth';
    const limit = isApi ? 60 : 40;
    const windowMs = 60_000;
    const result = checkEdgeRateLimit(`${scope}:${ip}`, limit, windowMs);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again shortly.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': String(result.retryAfterSec),
            'Cache-Control': 'no-store',
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-touch-icon\\.png|og\\.png|logo\\.png|categories/|brands/).*)',
  ],
};
