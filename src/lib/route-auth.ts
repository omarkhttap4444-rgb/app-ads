import { createClient } from '@supabase/supabase-js';

import 'server-only';

// Validates the caller's Supabase access token (sent as
// `Authorization: Bearer <token>`) and returns the authenticated user id.
// Throws on any failure so routes fail closed: no token / bad token /
// missing server env => no upload URL, no delete.
export async function requireUserId(request: Request): Promise<string> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new Error('Authentication required');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Auth service is not configured');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid session');
  return data.user.id;
}
