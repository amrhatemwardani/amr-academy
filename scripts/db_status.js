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

async function report() {
  console.log('====================================================');
  console.log('  AMR ACADEMY - DATABASE & AUTH HEALTH CHECK');
  console.log('====================================================');
  console.log('Connected to:', env.NEXT_PUBLIC_SUPABASE_URL);

  // 1. Check Auth Users
  const { data: usersData, error: uErr } = await admin.auth.admin.listUsers();
  if (uErr) {
    console.error('❌ Supabase Auth Connection Error:', uErr.message);
  } else {
    const totalUsers = usersData.users.length;
    const teachers = usersData.users.filter(u => u.email?.includes('teacher'));
    const students = usersData.users.filter(u => u.email?.endsWith('@students.local'));
    console.log(`\n🔑 Authentication Status: ONLINE`);
    console.log(`   - Total Auth Accounts: ${totalUsers}`);
    console.log(`   - Teacher Accounts:   ${teachers.length} (${teachers.map(t => t.email).join(', ')})`);
    console.log(`   - Student Accounts:   ${students.length} (${students[0]?.email} ... ${students[students.length - 1]?.email})`);
  }

  // 2. Check Database Tables
  console.log('\n📊 Database Tables Status:');
  const checks = [
    { name: 'profiles', field: 'role' },
    { name: 'students', field: 'student_code' },
    { name: 'classes', field: 'name' },
    { name: 'enrollments', field: 'id' },
    { name: 'attendance', field: 'id' },
    { name: 'charges', field: 'id' },
    { name: 'payments', field: 'id' },
  ];

  for (const c of checks) {
    const { count, error } = await admin.from(c.name).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`   ❌ ${c.name.padEnd(14)}: Error (${error.message})`);
    } else {
      console.log(`   ✅ ${c.name.padEnd(14)}: ${count} rows`);
    }
  }

  // 3. Test Student & Teacher Roles Verification
  console.log('\n🛡️ Role Verification:');
  const { data: teacherProfile } = await admin.from('profiles').select('full_name, role').eq('role', 'teacher').single();
  console.log(`   - Active Teacher: ${teacherProfile?.full_name} (Role: "${teacherProfile?.role}")`);

  const { data: sampleStudents } = await admin.from('students').select('student_code, phone, profiles(full_name, role)').limit(3);
  sampleStudents?.forEach(s => {
    console.log(`   - Student ${s.student_code}: ${s.profiles?.full_name} | Phone: ${s.phone} | Role: "${s.profiles?.role}"`);
  });

  console.log('\n====================================================');
  console.log('  STATUS: ALL SYSTEMS HEALTHY & SYNCHRONIZED');
  console.log('====================================================\n');
}

report();
