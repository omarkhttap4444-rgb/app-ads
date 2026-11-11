import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Check CDN Geolocation headers
  const cdnCountry = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cloudfront-viewer-country') ||
    request.headers.get('x-country-code') ||
    request.headers.get('geo-country')
  )?.trim().toUpperCase();

  if (cdnCountry === 'SA' || cdnCountry === 'EG') {
    return NextResponse.json({ country: cdnCountry, source: 'cdn-header' });
  }

  // 2. Fallback: extract client IP from proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp?.trim();

  // If local / private IP, default to EG
  if (
    !clientIp ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.16.')
  ) {
    return NextResponse.json({ country: 'EG', source: 'local-default' });
  }

  // 3. Fallback to free IP geolocation API (matches Flutter CountryProvider logic)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://freeipapi.com/api/json/${clientIp}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const code = (data.countryCode || data.country_code)?.toUpperCase();
      if (code === 'SA') {
        return NextResponse.json({ country: 'SA', source: 'ip-lookup' });
      }
      if (code === 'EG') {
        return NextResponse.json({ country: 'EG', source: 'ip-lookup' });
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return NextResponse.json({ country: 'EG', source: 'default-egypt' });
}

