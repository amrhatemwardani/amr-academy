const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

async function test() {
  const res = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  const data = await res.json();
  console.log('Tables in PostgREST schema:');
  console.log(Object.keys(data.definitions || {}));
  const rpcs = Object.keys(data.paths || {}).filter(p => p.startsWith('/rpc/'));
  console.log('RPC functions available:');
  console.log(rpcs);
}

test();
