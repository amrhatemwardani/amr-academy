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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  console.log('Testing createUser without explicit ID...');
  const res1 = await admin.auth.admin.createUser({
    email: 'test_auto_id@amracademy.com',
    password: 'TestPassword123!',
    email_confirm: true
  });
  console.log('Res1 (without ID):', res1.error || res1.data.user.id);

  console.log('Testing createUser with explicit ID...');
  const testId = '11111111-1111-1111-1111-111111111111';
  const res2 = await admin.auth.admin.createUser({
    id: testId,
    email: 'test_explicit_id@amracademy.com',
    password: 'TestPassword123!',
    email_confirm: true
  });
  console.log('Res2 (with ID):', res2.error || res2.data.user.id);
}

test();
