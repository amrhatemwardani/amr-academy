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
  // Clean up dummy users
  const { data: users } = await admin.auth.admin.listUsers();
  for (const u of users?.users || []) {
    if (u.email?.includes('test_')) {
      await admin.auth.admin.deleteUser(u.id);
      console.log('Deleted dummy user:', u.email);
    }
  }

  // Why did teacher fail? Let's check what exists in public.profiles for teacher
  const { data: pTeacher } = await admin.from('profiles').select('*').eq('id', '00000000-0000-0000-0000-000000000001');
  console.log('Teacher in profiles:', pTeacher);

  // What if we try to create teacher with a new fresh UUID or delete the profile row first?
  // Let's test creating teacher with email teacher@amracademy.com and a random UUID or after deleting profile
  console.log('Trying to create teacher with email teacher@amracademy.com and explicit ID...');
  const res = await admin.auth.admin.createUser({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'teacher@amracademy.com',
    password: 'Teacher@123456',
    email_confirm: true,
  });
  console.log('Create teacher res:', res.error ? res.error.message : res.data.user.id);
}

test();
