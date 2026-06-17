import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return NextResponse.json({
    supabaseUrl: {
      exists: !!url,
      length: url.length,
      startsWith: url.substring(0, 15),
      isPlaceholder: url.includes('placeholder-url-please-set-env-var'),
    },
    supabaseAnonKey: {
      exists: !!key,
      length: key.length,
      startsWith: key.substring(0, 15),
      isPlaceholder: key.includes('placeholder-key-please-set-env-var'),
    },
  });
}
