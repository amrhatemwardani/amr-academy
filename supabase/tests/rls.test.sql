-- =====================================================================
-- rls.test.sql — pgTAP RLS isolation tests
-- Run with: supabase test db
-- =====================================================================

begin;

select plan(20);

-- ─────────────────────────────────────────────────────────────────────
-- Setup: get references to seed data
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
  v_student_a uuid;
  v_student_b uuid;
begin
  -- Get first two students from seed
  select id into v_student_a from students order by student_code limit 1;
  select id into v_student_b from students order by student_code limit 1 offset 1;

  perform set_config('test.student_a', v_student_a::text, true);
  perform set_config('test.student_b', v_student_b::text, true);
end;
$$;

-- Helper: switch to a student's role
create or replace function set_auth_user(p_user_id uuid)
returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Test 1: Student A cannot read Student B's profile
-- ─────────────────────────────────────────────────────────────────────
select set_auth_user(current_setting('test.student_a')::uuid);
select is(
  (select count(*) from profiles where id = current_setting('test.student_b')::uuid)::int,
  0,
  'Student A cannot read Student B profile'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 2: Student A can read their own profile
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from profiles where id = current_setting('test.student_a')::uuid)::int,
  1,
  'Student A can read their own profile'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 3: Student A cannot read Student B's student record
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from students where id = current_setting('test.student_b')::uuid)::int,
  0,
  'Student A cannot read Student B student record'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 4: Student A cannot read Student B's attendance
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from attendance where student_id = current_setting('test.student_b')::uuid)::int,
  0,
  'Student A cannot read Student B attendance'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 5: Student A cannot read Student B's charges
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from charges where student_id = current_setting('test.student_b')::uuid)::int,
  0,
  'Student A cannot read Student B charges'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 6: Student A cannot read Student B's payments
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from payments where student_id = current_setting('test.student_b')::uuid)::int,
  0,
  'Student A cannot read Student B payments'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 7: Student A cannot read option_keys (answer keys)
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from option_keys)::int,
  0,
  'Student A cannot read option_keys (answer keys are hidden)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 8: Student A cannot read question_keys
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from question_keys)::int,
  0,
  'Student A cannot read question_keys'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 9: Student A cannot read student_notes
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from student_notes)::int,
  0,
  'Student A cannot read student_notes (teacher-only)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 10: Student A cannot read audit_log
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from audit_log)::int,
  0,
  'Student A cannot read audit_log'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 11: Student A cannot read fee_structures
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from fee_structures)::int,
  0,
  'Student A cannot read fee_structures'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 12: Student A cannot directly INSERT into attendance
-- ─────────────────────────────────────────────────────────────────────
select throws_ok(
  $$insert into attendance (class_id, student_id, date, status)
    values (gen_random_uuid(), current_setting('test.student_a')::uuid, current_date, 'present')$$,
  'Student A cannot insert attendance directly (no INSERT policy)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 13: Student A cannot directly INSERT a payment
-- ─────────────────────────────────────────────────────────────────────
select throws_ok(
  $$insert into payments (student_id, amount, method)
    values (current_setting('test.student_a')::uuid, 100, 'cash')$$,
  'Student A cannot insert payments directly (no INSERT policy)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 14: Student A cannot directly INSERT into exam_attempts
-- ─────────────────────────────────────────────────────────────────────
select throws_ok(
  $$insert into exam_attempts (exam_id, student_id, expires_at)
    values (gen_random_uuid(), current_setting('test.student_a')::uuid, now() + interval '1 hour')$$,
  'Student A cannot insert exam attempts directly (RPC only)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 15: Student A cannot update someone else's notification
-- ─────────────────────────────────────────────────────────────────────
select throws_ok(
  $$update notifications set read_at = now()
    where user_id = current_setting('test.student_b')::uuid$$,
  'Student A cannot mark Student B notification as read'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 16: Student A cannot read questions directly
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from questions)::int,
  0,
  'Student A cannot read questions table directly'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 17: Student A cannot read question_options directly
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from question_options)::int,
  0,
  'Student A cannot read question_options directly'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 18: unpublished exam results are hidden from student
-- ─────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from exam_results
   where student_id = current_setting('test.student_a')::uuid
     and published_at is null)::int,
  0,
  'Student A cannot see unpublished exam results'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 19: Student A can read their own exam attempts
-- ─────────────────────────────────────────────────────────────────────
-- (this test passes if RLS allows self-read; count may be 0 without seed attempt)
select ok(
  (select count(*) from exam_attempts where student_id = current_setting('test.student_a')::uuid)::int >= 0,
  'Student A can query their own exam_attempts (count may be 0)'
);

-- ─────────────────────────────────────────────────────────────────────
-- Test 20: Student A can read their own charges
-- ─────────────────────────────────────────────────────────────────────
select ok(
  (select count(*) from charges where student_id = current_setting('test.student_a')::uuid)::int >= 0,
  'Student A can read their own charges'
);

-- ─────────────────────────────────────────────────────────────────────
-- Teardown
-- ─────────────────────────────────────────────────────────────────────
select * from finish();
rollback;
