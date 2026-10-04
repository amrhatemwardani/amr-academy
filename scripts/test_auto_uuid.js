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
  console.log('Testing create teacher with auto UUID...');
  const resAuto = await admin.auth.admin.createUser({
    email: 'teacher@amracademy.com',
    password: 'Teacher@123456',
    email_confirm: true,
  });
  console.log('ResAuto:', resAuto.error ? resAuto.error.message : resAuto.data.user.id);

  if (resAuto.data?.user) {
    console.log('Teacher created with auto UUID! Cleaning up...');
    await admin.auth.admin.deleteUser(resAuto.data.user.id);
  }

  console.log('Testing student with auto UUID and @students.local domain...');
  const resStudent = await admin.auth.admin.createUser({
    email: 's1001@students.local',
    password: 'Student@123456',
    email_confirm: true,
  });
  console.log('ResStudent:', resStudent.error ? resStudent.error.message : resStudent.data.user.id);

  if (resStudent.data?.user) {
    console.log('Student created with auto UUID! Cleaning up...');
    await admin.auth.admin.deleteUser(resStudent.data.user.id);
  }
}

test();
