const { loadEnvConfig } = require('@next/env');
loadEnvConfig('./');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'test1781726463860@example.com');
  console.log('User in public.users:', data, error);
}
test();
