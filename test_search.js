const { createClient } = require('@supabase/supabase-js');
const url = 'https://xcjbjqndflhzmsxiasdb.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjamJqcW5kZmxoem1zeGlhc2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzMxNTcsImV4cCI6MjA4MzU0OTE1N30.EmQEUGmVuAFPJjcuPbPJveEzQgqB6j_Yn5gIL4VG-Tc';
const supabase = createClient(url, key);

async function main() {
  // Let's run a query via RPC or check if we can run it. Wait, anon doesn't have permissions to run raw query, but let's see if we can do something else or check if we can use public.pg_extension or similar.
  // Actually, we can run a simple check to see if extensions schema works.
  const { data, error } = await supabase.rpc('search_products_smart', {
    p_query: 'ايفون',
    p_category: null,
    p_condition: null,
    p_min_price: null,
    p_max_price: null,
    p_user_id: null,
    p_limit: 10,
    p_offset: 0
  });
  console.log('Error:', error);
  console.log('Data count:', data?.length);
}
main();
