const { loadEnvConfig } = require('@next/env');
loadEnvConfig('./');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'test' + Date.now() + '@example.com';
  console.log("Testing signup for", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'password123',
      options: { data: { name: 'Test User' } }
    });
    console.log('Signup result:', JSON.stringify({ data, error }, null, 2));
  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
