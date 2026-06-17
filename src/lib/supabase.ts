import { createClient } from '@supabase/supabase-js';

// These variables must be defined in .env.local / Vercel Environment Variables
// If they are missing (e.g. during build-time compilation on Vercel), we fallback
// to placeholder strings so that createClient does not crash the build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-please-set-env-var.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-please-set-env-var';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Using placeholder values for build compilation.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
