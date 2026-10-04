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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing with URL:', url);
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const client = createClient(url, anonKey);

async function run() {
  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error('List users error:', listErr);
    return;
  }
  console.log('Total users in auth.users:', usersData.users.length);
  usersData.users.slice(0, 10).forEach(u => console.log(' - User:', u.id, u.email));

  console.log('\nTesting teacher login...');
  const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
    email: 'teacher@amracademy.com',
    password: 'Teacher@123456'
  });
  if (signInErr) {
    console.error('Teacher sign in error:', signInErr.message);
  } else {
    console.log('Teacher sign in SUCCESS! User ID:', signInData.user.id);
  }

  console.log('\nTesting student login (S1001@students.local)...');
  const { data: sData, error: sErr } = await client.auth.signInWithPassword({
    email: 'S1001@students.local',
    password: 'Student@123456'
  });
  if (sErr) {
    console.error('Student sign in error:', sErr.message);
  } else {
    console.log('Student sign in SUCCESS! User ID:', sData.user.id);
  }
}

run();
