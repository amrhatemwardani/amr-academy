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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: teachers } = await admin.from('profiles').select('*').eq('role', 'teacher');
  console.log('Teachers in profiles:', teachers);

  const { data: students } = await admin.from('students').select('id, student_code, phone');
  console.log('Total students:', students?.length);
  console.log('Students sample:', students?.slice(0, 5));
}

check();
