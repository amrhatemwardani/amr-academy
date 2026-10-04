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

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const STUDENT_NAMES = [
  'Ahmed Hassan', 'Fatima Ali', 'Mohamed Ibrahim', 'Nour El-Din', 'Sara Mahmoud',
  'Omar Khalid', 'Layla Ahmed', 'Youssef Sami', 'Rana Tarek', 'Kareem Nasser',
  'Dina Fouad', 'Bassem Mostafa', 'Mona Adel', 'Tamer Riad', 'Hana Walid',
  'Adam Sherif', 'Reem Gamal', 'Khaled Osama', 'Salma Hazem', 'Ziad Fathy',
  'Noha Atef', 'Amr Samir', 'Mariam Ehab', 'Hassan Wael', 'Nadia Karim',
  'Sherif Amin', 'Aliaa Hossam', 'Mahmoud Saad', 'Yasmin Reda', 'Tarek Lotfy'
];

async function seed() {
  console.log('--- Cleaning Up Public Tables & Auth Users ---');

  // 1. Delete all data from public tables in correct FK order
  const tables = [
    'audit_log',
    'student_answers',
    'exam_results',
    'exam_attempts',
    'exam_questions',
    'question_options',
    'option_keys',
    'question_keys',
    'questions',
    'exams',
    'notifications',
    'payment_allocations',
    'payments',
    'charges',
    'fee_structures',
    'attendance',
    'enrollments',
    'classes',
    'student_notes',
    'students',
    'profiles',
  ];

  for (const table of tables) {
    const { error } = await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.log(`Note on clearing ${table}:`, error.message);
  }

  // 2. Clean up any existing auth users matching our seed emails
  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of userList?.users || []) {
    if (u.email === 'teacher@amracademy.com' || u.email?.endsWith('@students.local')) {
      await admin.auth.admin.deleteUser(u.id);
      console.log(`Deleted existing auth user: ${u.email}`);
    }
  }

  // 3. Create Teacher Auth User
  console.log('\n--- Creating Teacher ---');
  const { data: teacherAuth, error: tErr } = await admin.auth.admin.createUser({
    email: 'teacher@amracademy.com',
    password: 'Teacher@123456',
    email_confirm: true,
    user_metadata: { role: 'teacher' }
  });
  if (tErr) throw new Error('Teacher auth creation failed: ' + tErr.message);
  const teacherId = teacherAuth.user.id;
  console.log(`Teacher created with ID: ${teacherId}`);

  // Insert Teacher profile
  const { error: tProfErr } = await admin.from('profiles').insert({
    id: teacherId,
    role: 'teacher',
    full_name: 'Amr Hassan',
    locale: 'en'
  });
  if (tProfErr) throw new Error('Teacher profile failed: ' + tProfErr.message);

  // 4. Create Classes
  console.log('\n--- Creating Classes ---');
  const { data: classesData, error: cErr } = await admin.from('classes').insert([
    {
      name: 'Mathematics - Grade 10',
      subject: 'Mathematics',
      level: 'Grade 10',
      schedule: [{ dow: 1, start: '16:00', end: '17:30' }, { dow: 4, start: '16:00', end: '17:30' }]
    },
    {
      name: 'Physics - Grade 11',
      subject: 'Physics',
      level: 'Grade 11',
      schedule: [{ dow: 2, start: '15:00', end: '16:30' }, { dow: 5, start: '15:00', end: '16:30' }]
    },
    {
      name: 'Chemistry - Grade 12',
      subject: 'Chemistry',
      level: 'Grade 12',
      schedule: [{ dow: 3, start: '17:00', end: '18:30' }, { dow: 6, start: '17:00', end: '18:30' }]
    }
  ]).select();

  if (cErr) throw new Error('Classes failed: ' + cErr.message);
  const mathClass = classesData[0].id;
  const physClass = classesData[1].id;
  const chemClass = classesData[2].id;

  // 5. Fee structures
  await admin.from('fee_structures').insert([
    { class_id: mathClass, name: 'Monthly Fee', kind: 'monthly', amount: 500.00, active_from: '2024-01-01' },
    { class_id: physClass, name: 'Monthly Fee', kind: 'monthly', amount: 600.00, active_from: '2024-01-01' },
    { class_id: chemClass, name: 'Monthly Fee', kind: 'monthly', amount: 550.00, active_from: '2024-01-01' }
  ]);

  // 6. Create 30 Students
  console.log('\n--- Creating 30 Students ---');
  const students = [];

  for (let i = 1; i <= 30; i++) {
    const code = `S${1000 + i}`;
    const email = `${code}@students.local`;
    const phone = `010${String(10000000 + i * 37).padStart(8, '0')}`;
    const name = STUDENT_NAMES[i - 1];

    const { data: sAuth, error: sErr } = await admin.auth.admin.createUser({
      email,
      password: 'Student@123456',
      email_confirm: true,
      user_metadata: { role: 'student', student_code: code }
    });

    if (sErr) {
      console.error(`Failed to create ${code}:`, sErr.message);
      continue;
    }

    const sid = sAuth.user.id;

    // Profile
    await admin.from('profiles').insert({
      id: sid,
      role: 'student',
      full_name: name,
      locale: 'en'
    });

    // Student
    await admin.from('students').insert({
      id: sid,
      student_code: code,
      phone: phone,
      enrolled_on: new Date(Date.now() - (30 - i) * 86400000).toISOString().slice(0, 10)
    });

    students.push({ id: sid, code, phone, index: i });
    process.stdout.write(`.` );
  }
  console.log(`\nCreated ${students.length} students.`);

  // 7. Enrollments
  console.log('\n--- Enrolling Students ---');
  for (const s of students) {
    const enrollDate = new Date(Date.now() - (30 - s.index) * 86400000).toISOString().slice(0, 10);
    if (s.index <= 20) {
      await admin.from('enrollments').insert({ class_id: mathClass, student_id: s.id, enrolled_on: enrollDate });
    }
    if (s.index >= 1 && s.index <= 15) {
      await admin.from('enrollments').insert({ class_id: physClass, student_id: s.id, enrolled_on: enrollDate });
    }
    if (s.index >= 10) {
      await admin.from('enrollments').insert({ class_id: chemClass, student_id: s.id, enrolled_on: enrollDate });
    }
  }

  // 8. Sample Charges
  console.log('\n--- Creating Sample Charges ---');
  const now = new Date();
  for (let m = 0; m < 3; m++) {
    const periodDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const periodStr = periodDate.toISOString().slice(0, 10);
    const dueDate = new Date(periodDate.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    const monthName = periodDate.toLocaleString('default', { month: 'short', year: 'numeric' });

    for (const s of students) {
      if (s.index <= 20) {
        await admin.from('charges').insert({
          student_id: s.id,
          class_id: mathClass,
          kind: 'monthly',
          period: periodStr,
          description: `Monthly fee - ${monthName}`,
          amount: 500.00,
          due_date: dueDate
        });
      }
      if (s.index <= 15) {
        await admin.from('charges').insert({
          student_id: s.id,
          class_id: physClass,
          kind: 'monthly',
          period: periodStr,
          description: `Monthly fee - ${monthName}`,
          amount: 600.00,
          due_date: dueDate
        });
      }
    }
  }

  // 9. Sample Payments for first 10 students
  console.log('\n--- Creating Sample Payments ---');
  for (let i = 0; i < 10; i++) {
    const s = students[i];
    const { data: charges } = await admin.from('charges').select('id, amount')
      .eq('student_id', s.id).order('due_date', { ascending: false }).limit(1);

    if (charges && charges.length > 0) {
      const charge = charges[0];
      const { data: pay } = await admin.from('payments').insert({
        student_id: s.id,
        amount: 500.00,
        method: 'cash',
        paid_at: new Date(Date.now() - (15 - i) * 86400000).toISOString(),
        recorded_by: teacherId
      }).select().single();

      if (pay) {
        await admin.from('payment_allocations').insert({
          payment_id: pay.id,
          charge_id: charge.id,
          amount: 500.00
        });
      }
    }
  }

  // 10. Sample Attendance
  console.log('\n--- Creating Sample Attendance ---');
  const statuses = ['present', 'present', 'present', 'late', 'absent'];
  for (let d = 1; d <= 14; d++) {
    const attDate = new Date(Date.now() - d * 86400000);
    const dayOfWeek = attDate.getDay();
    const dateStr = attDate.toISOString().slice(0, 10);

    // Monday (1) or Thursday (4) -> Math
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      for (const s of students.filter(st => st.index <= 20)) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await admin.from('attendance').insert({
          class_id: mathClass,
          student_id: s.id,
          date: dateStr,
          status,
          marked_by: teacherId
        });
      }
    }

    // Tuesday (2) or Friday (5) -> Physics
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      for (const s of students.filter(st => st.index <= 15)) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await admin.from('attendance').insert({
          class_id: physClass,
          student_id: s.id,
          date: dateStr,
          status,
          marked_by: teacherId
        });
      }
    }
  }

  // 11. Update settings
  await admin.from('settings').update({ value: '"Amr Academy"' }).eq('key', 'school_name');
  await admin.from('settings').update({ value: '"EGP"' }).eq('key', 'currency');
  await admin.from('settings').update({ value: '"Africa/Cairo"' }).eq('key', 'timezone');

  console.log('\n========================================');
  console.log('TESTING SIGN-IN FOR BOTH ROLES');
  console.log('========================================');

  // Test Teacher Sign-In
  const { data: tLogin, error: tLogErr } = await client.auth.signInWithPassword({
    email: 'teacher@amracademy.com',
    password: 'Teacher@123456'
  });
  if (tLogErr) {
    console.error('❌ Teacher sign in FAILED:', tLogErr.message);
  } else {
    console.log('✅ TEACHER LOGIN SUCCESS!');
    console.log('   User ID:', tLogin.user.id);
    console.log('   Email:', tLogin.user.email);
  }

  // Test Student S1001 Sign-In
  const { data: sLogin, error: sLogErr } = await client.auth.signInWithPassword({
    email: 'S1001@students.local',
    password: 'Student@123456'
  });
  if (sLogErr) {
    console.error('❌ Student S1001 sign in FAILED:', sLogErr.message);
  } else {
    console.log('✅ STUDENT S1001 LOGIN SUCCESS!');
    console.log('   User ID:', sLogin.user.id);
    console.log('   Email:', sLogin.user.email);
  }

  console.log('\n--- Done! All data seeded and tested successfully. ---');
}

seed().catch(err => {
  console.error('Fatal Seed Error:', err);
  process.exit(1);
});
