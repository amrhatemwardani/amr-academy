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

async function sync() {
  console.log('--- Syncing Teacher Auth User ---');
  const teacherId = '00000000-0000-0000-0000-000000000001';
  const teacherEmail = 'teacher@amracademy.com';
  const teacherPassword = 'Teacher@123456';

  // Check if teacher user exists
  const { data: usersData } = await admin.auth.admin.listUsers();
  const existingTeacher = usersData?.users?.find(u => u.email === teacherEmail || u.id === teacherId);

  if (existingTeacher) {
    console.log('Teacher exists in auth.users, updating password...');
    const { error: updErr } = await admin.auth.admin.updateUserById(existingTeacher.id, {
      password: teacherPassword,
      email_confirm: true,
    });
    if (updErr) console.error('Teacher update error:', updErr);
    else console.log('Teacher password updated successfully!');
  } else {
    console.log('Creating teacher auth user with id:', teacherId);
    const { data: newTeacher, error: createErr } = await admin.auth.admin.createUser({
      id: teacherId,
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
      user_metadata: { role: 'teacher' }
    });
    if (createErr) console.error('Teacher create error:', createErr);
    else console.log('Teacher created successfully! ID:', newTeacher.user.id);
  }

  console.log('\n--- Syncing 30 Student Auth Users ---');
  const { data: students, error: sErr } = await admin.from('students').select('id, student_code');
  if (sErr || !students) {
    console.error('Failed to fetch students from DB:', sErr);
    return;
  }

  console.log(`Found ${students.length} students in DB.`);

  for (const s of students) {
    const studentEmail = `${s.student_code.toUpperCase()}@students.local`;
    const studentPassword = 'Student@123456';
    const existing = usersData?.users?.find(u => u.email === studentEmail || u.id === s.id);

    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password: studentPassword,
        email_confirm: true,
      });
      if (updErr) console.error(`Error updating ${s.student_code}:`, updErr.message);
      else console.log(`Updated ${s.student_code}`);
    } else {
      const { data: created, error: crErr } = await admin.auth.admin.createUser({
        id: s.id,
        email: studentEmail,
        password: studentPassword,
        email_confirm: true,
        user_metadata: { role: 'student', student_code: s.student_code }
      });
      if (crErr) console.error(`Error creating ${s.student_code} (${s.id}):`, crErr.message);
      else console.log(`Created ${s.student_code} (${created.user.id})`);
    }
  }

  console.log('\n--- Verifying Logins ---');
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Test Teacher
  const { data: tLogin, error: tErr } = await client.auth.signInWithPassword({
    email: teacherEmail,
    password: teacherPassword
  });
  if (tErr) console.error('Teacher Login FAILED:', tErr.message);
  else console.log('Teacher Login SUCCESS! Session user:', tLogin.user.email);

  // Test S1001
  const { data: sLogin, error: sLoginErr } = await client.auth.signInWithPassword({
    email: 'S1001@students.local',
    password: 'Student@123456'
  });
  if (sLoginErr) console.error('Student S1001 Login FAILED:', sLoginErr.message);
  else console.log('Student S1001 Login SUCCESS! Session user:', sLogin.user.email);
}

sync();
