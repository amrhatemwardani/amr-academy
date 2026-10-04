const fs = require('fs');

const seedContent = `-- =====================================================================
-- seed.sql
-- Development seed data: 1 teacher, 3 classes, 30 students.
-- 100% Clean & Idempotent.
-- =====================================================================

do $$
declare
  v_teacher_id    uuid := '00000000-0000-0000-0000-000000000001';
  v_class_math    uuid := '00000000-0000-0000-0000-000000000101';
  v_class_phys    uuid := '00000000-0000-0000-0000-000000000102';
  v_class_chem    uuid := '00000000-0000-0000-0000-000000000103';

  v_students uuid[] := array[
    '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
    '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
    '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
    '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
    '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
  ];

  v_names text[] := array[
    'Ahmed Hassan', 'Fatima Ali', 'Mohamed Ibrahim', 'Nour El-Din', 'Sara Mahmoud',
    'Omar Khalid', 'Layla Ahmed', 'Youssef Sami', 'Rana Tarek', 'Kareem Nasser',
    'Dina Fouad', 'Bassem Mostafa', 'Mona Adel', 'Tamer Riad', 'Hana Walid',
    'Adam Sherif', 'Reem Gamal', 'Khaled Osama', 'Salma Hazem', 'Ziad Fathy',
    'Noha Atef', 'Amr Samir', 'Mariam Ehab', 'Hassan Wael', 'Nadia Karim',
    'Sherif Amin', 'Aliaa Hossam', 'Mahmoud Saad', 'Yasmin Reda', 'Tarek Lotfy'
  ];

  i int;
  v_sid uuid;
  v_name text;
  v_code text;
  v_phone text;
  v_enrolled_on date;

begin
  -- Clean up lingering old seed accounts if any exist from partial runs
  begin
    delete from auth.users where email like '%@students.local' or email = 'teacher@amracademy.com' or email = 'teacher@amracademy.local';
  exception when others then null;
  end;

  -- Teacher auth user (teacher@amracademy.com)
  begin
    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud
    )
    values (
      v_teacher_id,
      'teacher@amracademy.com',
      crypt('Teacher@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    )
    on conflict (id) do update set email = 'teacher@amracademy.com';
  exception when others then null;
  end;

  -- Teacher profile
  insert into profiles (id, role, full_name, locale)
  values (v_teacher_id, 'teacher', 'Amr Hassan', 'en')
  on conflict (id) do update set role = 'teacher';

  -- Classes
  insert into classes (id, name, subject, level, schedule)
  values
    (v_class_math, 'Mathematics - Grade 10', 'Mathematics', 'Grade 10',
     '[{"dow":1,"start":"16:00","end":"17:30"},{"dow":4,"start":"16:00","end":"17:30"}]'::jsonb),
    (v_class_phys, 'Physics - Grade 11', 'Physics', 'Grade 11',
     '[{"dow":2,"start":"15:00","end":"16:30"},{"dow":5,"start":"15:00","end":"16:30"}]'::jsonb),
    (v_class_chem, 'Chemistry - Grade 12', 'Chemistry', 'Grade 12',
     '[{"dow":3,"start":"17:00","end":"18:30"},{"dow":6,"start":"17:00","end":"18:30"}]'::jsonb)
  on conflict (id) do nothing;

  -- Fee structures
  insert into fee_structures (class_id, name, kind, amount, active_from)
  values
    (v_class_math, 'Monthly Fee', 'monthly', 500.00, '2024-01-01'),
    (v_class_phys, 'Monthly Fee', 'monthly', 600.00, '2024-01-01'),
    (v_class_chem, 'Monthly Fee', 'monthly', 550.00, '2024-01-01')
  on conflict do nothing;

  -- Students loop
  for i in 1..30 loop
    v_sid := v_students[i];
    v_code := 'S' || (1000 + i)::text;
    v_name := v_names[i];
    v_phone := '010' || lpad((10000000 + i * 37)::text, 8, '0');

    -- Auth user
    begin
      insert into auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, role, aud
      )
      values (
        v_sid,
        v_code || '@students.local',
        crypt('Student@123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now() - ((30 - i) || ' days')::interval,
        now(),
        'authenticated', 'authenticated'
      )
      on conflict (id) do nothing;
    exception when others then null;
    end;

    -- Profile
    insert into profiles (id, role, full_name, locale, created_at)
    values (v_sid, 'student', v_name, 'en', now() - ((30 - i) || ' days')::interval)
    on conflict (id) do nothing;

    -- Student record
    insert into students (id, student_code, phone, enrolled_on)
    values (v_sid, v_code, v_phone, (current_date - ((30 - i) || ' days')::interval)::date)
    on conflict (id) do nothing;

    -- Enrollments
    v_enrolled_on := (current_date - ((30 - i) || ' days')::interval)::date;

    if i <= 20 then
      insert into enrollments (class_id, student_id, enrolled_on)
      values (v_class_math, v_sid, v_enrolled_on)
      on conflict do nothing;
    end if;

    if i >= 1 and i <= 15 then
      insert into enrollments (class_id, student_id, enrolled_on)
      values (v_class_phys, v_sid, v_enrolled_on)
      on conflict do nothing;
    end if;

    if i >= 10 then
      insert into enrollments (class_id, student_id, enrolled_on)
      values (v_class_chem, v_sid, v_enrolled_on)
      on conflict do nothing;
    end if;

  end loop;

  -- Sample Attendance
  for i in 1..30 loop
    v_sid := v_students[i];

    if i <= 20 then
      insert into attendance (class_id, student_id, date, status, marked_by)
      select
        v_class_math, v_sid, d::date,
        (array['present','present','present','late','absent'])[floor(random()*5+1)]::attendance_status,
        v_teacher_id
      from generate_series(current_date - 14, current_date - 1, '1 day'::interval) d
      where extract(dow from d::date) in (1, 4)
      on conflict (class_id, student_id, date) do nothing;
    end if;

    if i <= 15 then
      insert into attendance (class_id, student_id, date, status, marked_by)
      select
        v_class_phys, v_sid, d::date,
        (array['present','present','absent','present','late'])[floor(random()*5+1)]::attendance_status,
        v_teacher_id
      from generate_series(current_date - 14, current_date - 1, '1 day'::interval) d
      where extract(dow from d::date) in (2, 5)
      on conflict (class_id, student_id, date) do nothing;
    end if;
  end loop;

  -- Sample Charges
  for i in 1..30 loop
    v_sid := v_students[i];

    if i <= 20 then
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      select v_sid, v_class_math, 'monthly', m, 'Monthly fee - ' || to_char(m, 'Mon YYYY'), 500.00, m + 14
      from (
        select date_trunc('month', current_date - ((n-1) || ' months')::interval)::date as m
        from generate_series(1,3) n
      ) months
      on conflict do nothing;
    end if;

    if i <= 15 then
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      select v_sid, v_class_phys, 'monthly', m, 'Monthly fee - ' || to_char(m, 'Mon YYYY'), 600.00, m + 14
      from (
        select date_trunc('month', current_date - ((n-1) || ' months')::interval)::date as m
        from generate_series(1,3) n
      ) months
      on conflict do nothing;
    end if;
  end loop;

  -- Sample Payments
  for i in 1..10 loop
    v_sid := v_students[i];
    declare
      v_pay_id uuid := ('00000000-0000-0000-0000-00000000090' || (i-1)::text)::uuid;
      v_charge_id uuid;
    begin
      select id into v_charge_id
      from charges
      where student_id = v_sid and class_id = v_class_math and voided_at is null
      order by due_date desc limit 1;

      if v_charge_id is not null then
        insert into payments (id, student_id, amount, method, paid_at, recorded_by)
        values (v_pay_id, v_sid, 500.00, 'cash', now() - ((30-i) || ' days')::interval, v_teacher_id)
        on conflict do nothing;

        insert into payment_allocations (payment_id, charge_id, amount)
        values (v_pay_id, v_charge_id, 500.00)
        on conflict do nothing;
      end if;
    end;
  end loop;

  -- Update settings
  update settings set value = '"Amr Academy"' where key = 'school_name';
  update settings set value = '"EGP"'          where key = 'currency';
  update settings set value = '"Africa/Cairo"' where key = 'timezone';

end;
$$;
`;

fs.writeFileSync('./supabase/seed.sql', seedContent, 'utf8');

// Rebuild full_setup.sql
const path = require('path');
const files = fs.readdirSync('./supabase/migrations').filter(f => f.endsWith('.sql')).sort().map(f => path.join('./supabase/migrations', f));
files.push('./supabase/seed.sql');

let text = files.map(f => fs.readFileSync(f, 'utf8')).join('\n\n');
text = text.replace(/[\u2500-\u257F]/g, '-');

fs.writeFileSync('./supabase/full_setup.sql', text, 'utf8');
console.log('Seed cleanup added!');
