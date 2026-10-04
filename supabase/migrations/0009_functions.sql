-- =====================================================================
-- 0009_functions.sql
-- All Postgres RPC functions.
-- All are SECURITY DEFINER with explicit set search_path = public.
-- Each verifies the caller's role or ownership explicitly.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: assert_teacher() — raises exception if caller is not teacher
-- ─────────────────────────────────────────────────────────────────────
create or replace function assert_teacher()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_teacher() then
    raise exception 'permission_denied: teacher role required'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: assert_student_owns_attempt(attempt_id)
-- ─────────────────────────────────────────────────────────────────────
create or replace function assert_student_owns_attempt(p_attempt_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from exam_attempts ea
    where ea.id = p_attempt_id and ea.student_id = auth.uid()
  ) then
    raise exception 'permission_denied: attempt not found or not owned by caller'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- save_attendance(class_id, date, rows jsonb)
-- rows: [{"student_id": "uuid", "status": "present|absent|late|excused", "note": "..."}]
-- Teacher only. Atomic upsert.
-- ─────────────────────────────────────────────────────────────────────
create or replace function save_attendance(
  p_class_id uuid,
  p_date     date,
  p_rows     jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r jsonb;
begin
  perform assert_teacher();

  for r in select * from jsonb_array_elements(p_rows)
  loop
    insert into attendance (class_id, student_id, date, status, note, marked_by)
    values (
      p_class_id,
      (r->>'student_id')::uuid,
      p_date,
      (r->>'status')::attendance_status,
      r->>'note',
      auth.uid()
    )
    on conflict (class_id, student_id, date) do update set
      status     = excluded.status,
      note       = excluded.note,
      marked_by  = excluded.marked_by,
      updated_at = now();
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- record_payment(student_id, amount, method, paid_at, reference, notes, allocations)
-- Teacher only. Single transaction: inserts payment, allocates to charges.
-- Auto-allocates oldest-due-first if allocations is null.
-- Rejects if amount > outstanding (unless allow_credit := true passed).
-- Returns the receipt data as jsonb.
-- ─────────────────────────────────────────────────────────────────────
create or replace function record_payment(
  p_student_id   uuid,
  p_amount       numeric,
  p_method       pay_method,
  p_paid_at      timestamptz default now(),
  p_reference    text        default null,
  p_notes        text        default null,
  p_allocations  jsonb       default null,  -- [{charge_id, amount}] or null for auto
  p_allow_credit boolean     default false
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_payment_id   uuid;
  v_receipt_no   text;
  v_outstanding  numeric;
  v_remaining    numeric;
  v_alloc        jsonb;
  v_charge_id    uuid;
  v_alloc_amount numeric;
  rec            record;
begin
  perform assert_teacher();

  -- Lock the student's open charges for this transaction
  perform 1 from charges
  where student_id = p_student_id and voided_at is null
  for update;

  -- Compute total outstanding
  select coalesce(sum(remaining), 0)
  into v_outstanding
  from charge_status
  where student_id = p_student_id;

  -- Reject overpayment unless credit is explicitly allowed
  if not p_allow_credit and p_amount > v_outstanding + 0.01 then
    raise exception 'overpayment: amount % exceeds outstanding %', p_amount, v_outstanding
      using errcode = 'P0002';
  end if;

  -- Insert payment
  insert into payments (student_id, amount, method, paid_at, reference, notes, recorded_by)
  values (p_student_id, p_amount, p_method, p_paid_at, p_reference, p_notes, auth.uid())
  returning id, receipt_no into v_payment_id, v_receipt_no;

  -- Allocate
  if p_allocations is not null then
    -- Use provided allocations
    for v_alloc in select * from jsonb_array_elements(p_allocations)
    loop
      v_charge_id    := (v_alloc->>'charge_id')::uuid;
      v_alloc_amount := (v_alloc->>'amount')::numeric;
      insert into payment_allocations (payment_id, charge_id, amount)
      values (v_payment_id, v_charge_id, v_alloc_amount);
    end loop;
  else
    -- Auto-allocate: oldest due_date first
    v_remaining := p_amount;
    for rec in
      select id, remaining from charge_status
      where student_id = p_student_id and remaining > 0
      order by due_date asc, created_at asc
    loop
      exit when v_remaining <= 0;
      v_alloc_amount := least(v_remaining, rec.remaining);
      insert into payment_allocations (payment_id, charge_id, amount)
      values (v_payment_id, rec.id, v_alloc_amount);
      v_remaining := v_remaining - v_alloc_amount;
    end loop;
  end if;

  -- Audit
  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'payment.record', 'payments', v_payment_id::text,
    jsonb_build_object('student_id', p_student_id, 'amount', p_amount, 'method', p_method));

  return jsonb_build_object('payment_id', v_payment_id, 'receipt_no', v_receipt_no);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- void_payment(payment_id, reason)
-- Teacher only. Sets voided_at, writes audit_log.
-- ─────────────────────────────────────────────────────────────────────
create or replace function void_payment(
  p_payment_id uuid,
  p_reason     text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  perform assert_teacher();

  select * into v_payment from payments where id = p_payment_id for update;
  if not found then
    raise exception 'not_found: payment % does not exist', p_payment_id using errcode = 'P0004';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'already_voided: payment % is already voided', p_payment_id using errcode = 'P0005';
  end if;

  update payments set voided_at = now(), void_reason = p_reason where id = p_payment_id;

  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'payment.void', 'payments', p_payment_id::text,
    jsonb_build_object('reason', p_reason, 'amount', v_payment.amount, 'student_id', v_payment.student_id));
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- generate_monthly_charges(period)
-- Idempotent: safe to run multiple times for the same period.
-- period = first day of the target month.
-- Teacher only (or called from cron as postgres role).
-- ─────────────────────────────────────────────────────────────────────
create or replace function generate_monthly_charges(p_period date)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  rec         record;
  v_amount    numeric;
  v_count     int := 0;
  v_due_date  date;
begin
  -- Allow teacher or postgres (cron) to run this
  if auth.uid() is not null then
    perform assert_teacher();
  end if;

  v_due_date := p_period + interval '14 days'; -- due 14 days after period start

  for rec in
    select
      e.student_id,
      e.class_id,
      coalesce(e.fee_override,
        (select fs.amount
         from fee_structures fs
         where fs.class_id = e.class_id
           and fs.kind = 'monthly'
           and fs.active_from <= p_period
           and (fs.active_to is null or fs.active_to >= p_period)
         order by fs.active_from desc
         limit 1)
      ) as fee_amount
    from enrollments e
    join classes c on c.id = e.class_id
    where e.left_on is null or e.left_on >= p_period
      and c.is_active = true
  loop
    if rec.fee_amount is null or rec.fee_amount = 0 then
      continue;
    end if;

    -- Insert idempotently (unique index prevents duplicates)
    begin
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      values (
        rec.student_id,
        rec.class_id,
        'monthly',
        p_period,
        'Monthly fee - ' || to_char(p_period, 'Mon YYYY'),
        rec.fee_amount,
        v_due_date
      );
      v_count := v_count + 1;
    exception when unique_violation then
      -- Already generated; skip
      null;
    end;
  end loop;

  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- start_attempt(exam_id) — Student only
-- Verifies enrollment, published status, within window, no prior attempt.
-- Returns existing in-progress attempt if already started.
-- ─────────────────────────────────────────────────────────────────────
create or replace function start_attempt(p_exam_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_exam       exams%rowtype;
  v_attempt    exam_attempts%rowtype;
  v_expires_at timestamptz;
begin
  -- Must be a student
  if is_teacher() then
    raise exception 'permission_denied: students only' using errcode = 'P0001';
  end if;

  -- Load exam
  select * into v_exam from exams where id = p_exam_id;
  if not found then
    raise exception 'not_found: exam does not exist' using errcode = 'P0004';
  end if;

  -- Must be published
  if v_exam.status <> 'published' then
    raise exception 'exam_not_available: exam is not published' using errcode = 'P0006';
  end if;

  -- Must be within the exam window
  if now() < v_exam.start_at then
    raise exception 'exam_not_started: exam has not started yet' using errcode = 'P0007';
  end if;
  if now() > v_exam.end_at then
    raise exception 'exam_ended: exam window has closed' using errcode = 'P0008';
  end if;

  -- Must be enrolled in the class
  if not exists (
    select 1 from enrollments e
    where e.class_id = v_exam.class_id
      and e.student_id = v_student_id
      and e.left_on is null
  ) then
    raise exception 'not_enrolled: student is not enrolled in this class' using errcode = 'P0009';
  end if;

  -- Return existing in-progress attempt (resume after reload)
  select * into v_attempt
  from exam_attempts
  where exam_id = p_exam_id and student_id = v_student_id;

  if found then
    if v_attempt.status = 'in_progress' then
      return jsonb_build_object(
        'attempt_id', v_attempt.id,
        'expires_at', v_attempt.expires_at,
        'status', v_attempt.status,
        'resumed', true
      );
    else
      raise exception 'attempt_already_submitted: this exam has already been submitted' using errcode = 'P0010';
    end if;
  end if;

  -- Compute expires_at: server-enforced
  v_expires_at := least(
    now() + (v_exam.duration_minutes || ' minutes')::interval,
    v_exam.end_at
  );

  -- Create the attempt
  insert into exam_attempts (exam_id, student_id, expires_at)
  values (p_exam_id, v_student_id, v_expires_at)
  returning * into v_attempt;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'expires_at', v_attempt.expires_at,
    'status', v_attempt.status,
    'resumed', false
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- get_attempt_questions(attempt_id)
-- Returns questions + options WITHOUT answer keys.
-- Owner + in_progress/submitted only.
-- Handles shuffle_questions and shuffle_options per shuffle_seed.
-- ─────────────────────────────────────────────────────────────────────
create or replace function get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_exam    exams%rowtype;
begin
  -- Load attempt and verify ownership
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  if not found then
    raise exception 'not_found: attempt does not exist' using errcode = 'P0004';
  end if;

  if v_attempt.student_id <> auth.uid() and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  if v_attempt.status not in ('in_progress', 'submitted', 'auto_submitted', 'graded') then
    raise exception 'attempt_not_accessible' using errcode = 'P0011';
  end if;

  -- Load exam config
  select * into v_exam from exams where id = v_attempt.exam_id;

  -- Build questions JSON (no answer keys)
  return (
    select jsonb_agg(
      jsonb_build_object(
        'question_id',  q.id,
        'position',     eq.position,
        'marks',        eq.marks,
        'type',         q.type,
        'body',         q.body,
        'options',      (
          select jsonb_agg(
            jsonb_build_object(
              'id',       qo.id,
              'body',     qo.body,
              'position', qo.position
            )
            order by
              case when v_exam.shuffle_options
                then (hashtext(qo.id::text || v_attempt.shuffle_seed::text) & 2147483647)
                else qo.position
              end
          )
          from question_options qo
          where qo.question_id = q.id
        ),
        'selected_option_id', sa.selected_option_id,
        'text_answer',        sa.text_answer
      )
      order by
        case when v_exam.shuffle_questions
          then (hashtext(q.id::text || v_attempt.shuffle_seed::text) & 2147483647)
          else eq.position
        end
    )
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa
      on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- save_answers(attempt_id, answers jsonb)
-- answers: [{"question_id": "uuid", "selected_option_id": "uuid|null", "text_answer": "..."}]
-- Owner only; rejects if past expires_at (+5s grace) or status ≠ in_progress.
-- ─────────────────────────────────────────────────────────────────────
create or replace function save_answers(
  p_attempt_id uuid,
  p_answers    jsonb
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  a         jsonb;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership check
  if v_attempt.student_id <> auth.uid() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  -- Status check
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_not_in_progress: cannot save answers after submission' using errcode = 'P0012';
  end if;

  -- Time check with 5-second grace period
  if now() > v_attempt.expires_at + interval '5 seconds' then
    raise exception 'attempt_expired: time limit exceeded' using errcode = 'P0013';
  end if;

  -- Batch upsert answers
  for a in select * from jsonb_array_elements(p_answers)
  loop
    insert into student_answers (attempt_id, question_id, selected_option_id, text_answer, updated_at)
    values (
      p_attempt_id,
      (a->>'question_id')::uuid,
      case when a->>'selected_option_id' is null or a->>'selected_option_id' = 'null'
           then null
           else (a->>'selected_option_id')::uuid
      end,
      a->>'text_answer',
      now()
    )
    on conflict (attempt_id, question_id) do update set
      selected_option_id = excluded.selected_option_id,
      text_answer        = excluded.text_answer,
      updated_at         = now();
  end loop;

  return jsonb_build_object(
    'saved',      jsonb_array_length(p_answers),
    'expires_at', v_attempt.expires_at,
    'server_time', now()
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: compute_and_save_result(attempt_id)
-- Internal: auto-grades MCQ/T-F/short_answer, writes exam_results.
-- ─────────────────────────────────────────────────────────────────────
create or replace function compute_and_save_result(p_attempt_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt       exam_attempts%rowtype;
  v_exam          exams%rowtype;
  v_total_marks   numeric := 0;
  v_scored        numeric := 0;
  v_has_manual    boolean := false;
  v_fully_graded  boolean;
  rec             record;
  v_correct       boolean;
  v_max_marks     numeric;
  v_awarded       numeric;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  select * into v_exam    from exams          where id = v_attempt.exam_id;

  for rec in
    select
      eq.marks,
      q.type,
      sa.attempt_id,
      sa.question_id,
      sa.selected_option_id,
      sa.text_answer,
      sa.marks_awarded
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa
      on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  loop
    v_max_marks   := rec.marks;
    v_total_marks := v_total_marks + v_max_marks;

    if rec.type in ('mcq', 'true_false') then
      -- Auto-grade: check if selected option is correct
      if rec.selected_option_id is not null then
        select is_correct into v_correct
        from option_keys where option_id = rec.selected_option_id;
        v_awarded := case when v_correct then v_max_marks else 0 end;
      else
        v_awarded := 0;
      end if;

      -- Upsert answer with awarded marks
      insert into student_answers (attempt_id, question_id, selected_option_id, marks_awarded, updated_at)
      values (p_attempt_id, rec.question_id, rec.selected_option_id, v_awarded, now())
      on conflict (attempt_id, question_id) do update set
        marks_awarded = excluded.marks_awarded,
        updated_at    = now();

      v_scored := v_scored + v_awarded;

    elsif rec.type = 'short_answer' then
      -- Try auto-match against accepted_answers
      declare
        v_accepted text[];
        v_matched  boolean := false;
      begin
        select accepted_answers into v_accepted
        from question_keys where question_id = rec.question_id;

        if v_accepted is not null and array_length(v_accepted, 1) > 0
           and rec.text_answer is not null then
          select exists (
            select 1 from unnest(v_accepted) aa
            where lower(trim(aa)) = lower(trim(rec.text_answer))
          ) into v_matched;

          if v_matched then
            v_awarded := v_max_marks;
            insert into student_answers (attempt_id, question_id, text_answer, marks_awarded, updated_at)
            values (p_attempt_id, rec.question_id, rec.text_answer, v_awarded, now())
            on conflict (attempt_id, question_id) do update set
              marks_awarded = excluded.marks_awarded,
              updated_at    = now();
            v_scored := v_scored + v_awarded;
          else
            v_has_manual := true; -- needs teacher grading
          end if;
        else
          v_has_manual := true; -- no accepted answers configured
        end if;
      end;

    else
      -- essay: always manual
      if rec.marks_awarded is not null then
        v_scored := v_scored + rec.marks_awarded;
      else
        v_has_manual := true;
      end if;
    end if;
  end loop;

  v_fully_graded := not v_has_manual;

  insert into exam_results (attempt_id, exam_id, student_id, score, total, percentage, passed, fully_graded)
  values (
    p_attempt_id,
    v_attempt.exam_id,
    v_attempt.student_id,
    v_scored,
    v_total_marks,
    case when v_total_marks > 0 then round((v_scored / v_total_marks) * 100, 2) else 0 end,
    v_scored >= v_exam.pass_marks,
    v_fully_graded
  )
  on conflict (attempt_id) do update set
    score        = excluded.score,
    total        = excluded.total,
    percentage   = excluded.percentage,
    passed       = excluded.passed,
    fully_graded = excluded.fully_graded,
    updated_at   = now();
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- submit_attempt(attempt_id)
-- Idempotent. Locks attempt row. Sets submitted/auto_submitted.
-- Auto-grades MCQ/TF. Writes exam_results.
-- ─────────────────────────────────────────────────────────────────────
create or replace function submit_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_status  attempt_status;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership: student owns it, or teacher is force-submitting, or cron (no auth.uid)
  if auth.uid() is not null
     and v_attempt.student_id <> auth.uid()
     and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  -- Idempotent: already submitted
  if v_attempt.status not in ('in_progress') then
    return jsonb_build_object('attempt_id', p_attempt_id, 'status', v_attempt.status, 'already_submitted', true);
  end if;

  -- Determine submission type
  v_status := case when now() > v_attempt.expires_at then 'auto_submitted'::attempt_status
                   else 'submitted'::attempt_status
              end;

  update exam_attempts
  set status       = v_status,
      submitted_at = now()
  where id = p_attempt_id;

  -- Grade auto-gradeable questions and write result
  perform compute_and_save_result(p_attempt_id);

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'status',     v_status,
    'submitted_at', now()
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- sweep_expired_attempts()
-- Called by pg_cron every minute.
-- Auto-submits any in_progress attempts that have passed expires_at.
-- ─────────────────────────────────────────────────────────────────────
create or replace function sweep_expired_attempts()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_count int := 0;
  rec     record;
begin
  for rec in
    select id from exam_attempts
    where status = 'in_progress' and expires_at < now()
  loop
    perform submit_attempt(rec.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- grade_answer(attempt_id, question_id, marks, feedback)
-- Teacher only. Caps at question max marks. Recomputes result.
-- ─────────────────────────────────────────────────────────────────────
create or replace function grade_answer(
  p_attempt_id  uuid,
  p_question_id uuid,
  p_marks       numeric,
  p_feedback    text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_max_marks numeric;
begin
  perform assert_teacher();

  -- Get max marks for this question in this exam
  select eq.marks into v_max_marks
  from exam_attempts ea
  join exam_questions eq on eq.exam_id = ea.exam_id and eq.question_id = p_question_id
  where ea.id = p_attempt_id;

  if not found then
    raise exception 'not_found: question not in this exam' using errcode = 'P0004';
  end if;

  if p_marks < 0 or p_marks > v_max_marks then
    raise exception 'invalid_marks: marks must be between 0 and %', v_max_marks using errcode = 'P0014';
  end if;

  update student_answers set
    marks_awarded = p_marks,
    feedback      = p_feedback,
    graded_by     = auth.uid(),
    updated_at    = now()
  where attempt_id = p_attempt_id and question_id = p_question_id;

  -- Recompute overall result
  perform compute_and_save_result(p_attempt_id);

  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'grade.update', 'student_answers',
          p_attempt_id::text || '/' || p_question_id::text,
          jsonb_build_object('marks', p_marks, 'max', v_max_marks));
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- publish_results(exam_id)
-- Teacher only. Sets published_at on all fully-graded results.
-- Creates in-app notifications for each affected student.
-- ─────────────────────────────────────────────────────────────────────
create or replace function publish_results(p_exam_id uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_exam  exams%rowtype;
  rec     record;
  v_count int := 0;
begin
  perform assert_teacher();

  select * into v_exam from exams where id = p_exam_id;

  update exams set results_published = true, updated_at = now() where id = p_exam_id;

  for rec in
    select er.attempt_id, er.student_id, er.score, er.total, er.percentage, er.passed
    from exam_results er
    where er.exam_id = p_exam_id and er.published_at is null
  loop
    update exam_results set published_at = now(), updated_at = now()
    where attempt_id = rec.attempt_id;

    insert into notifications (user_id, type, title, body, link)
    values (
      rec.student_id,
      'results_published',
      'Results Published: ' || v_exam.title,
      'Your result: ' || rec.score || '/' || rec.total || ' (' || rec.percentage || '%) — ' ||
        case when rec.passed then 'Passed ✓' else 'Not Passed' end,
      '/portal/exams/' || p_exam_id || '/result'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- get_exam_review(attempt_id)
-- Returns questions with correct answers and feedback.
-- Only allowed if: exam.status='closed' OR exam.results_published=true.
-- Owner (student) or teacher.
-- ─────────────────────────────────────────────────────────────────────
create or replace function get_exam_review(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_exam    exams%rowtype;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership check
  if v_attempt.student_id <> auth.uid() and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  select * into v_exam from exams where id = v_attempt.exam_id;

  -- Gate: must be closed or results published
  if not is_teacher() then
    if v_exam.status <> 'closed' and not v_exam.results_published then
      raise exception 'review_not_available: results have not been published yet' using errcode = 'P0015';
    end if;
    -- Also check that this student's result is published
    if not exists (
      select 1 from exam_results er
      where er.attempt_id = p_attempt_id and er.published_at is not null
    ) then
      raise exception 'review_not_available: your result has not been published yet' using errcode = 'P0015';
    end if;
  end if;

  return (
    select jsonb_agg(
      jsonb_build_object(
        'question_id',         q.id,
        'type',                q.type,
        'body',                q.body,
        'explanation',         q.explanation,
        'marks',               eq.marks,
        'marks_awarded',       sa.marks_awarded,
        'feedback',            sa.feedback,
        'selected_option_id',  sa.selected_option_id,
        'text_answer',         sa.text_answer,
        'options', (
          select jsonb_agg(
            jsonb_build_object(
              'id',         qo.id,
              'body',       qo.body,
              'position',   qo.position,
              'is_correct', ok.is_correct
            ) order by qo.position
          )
          from question_options qo
          left join option_keys ok on ok.option_id = qo.id
          where qo.question_id = q.id
        ),
        'model_answer', (select qk.model_answer from question_keys qk where qk.question_id = q.id)
      )
      order by eq.position
    )
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- dashboard_summary(from_date, to_date, class_id)
-- Teacher only. Returns dashboard card metrics.
-- ─────────────────────────────────────────────────────────────────────
create or replace function dashboard_summary(
  p_from     date default (current_date - interval '30 days')::date,
  p_to       date default current_date,
  p_class_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_total_students    int;
  v_active_students   int;
  v_total_classes     int;
  v_today_present     int;
  v_today_total       int;
  v_today_absent      int;
  v_total_revenue     numeric;
  v_this_month        numeric;
  v_pending           numeric;
  v_upcoming_exams    int;
begin
  perform assert_teacher();

  select count(*) into v_total_students  from students;
  select count(*) into v_active_students from students where status = 'active';
  select count(*) into v_total_classes   from classes where is_active = true;

  -- Today's attendance
  select
    count(*) filter (where a.status in ('present','late')),
    count(*),
    count(*) filter (where a.status = 'absent')
  into v_today_present, v_today_total, v_today_absent
  from attendance a
  where a.date = current_date
    and (p_class_id is null or a.class_id = p_class_id);

  -- Finance
  select
    coalesce(sum(p.amount) filter (where p.voided_at is null and p.paid_at::date between p_from and p_to), 0),
    coalesce(sum(p.amount) filter (where p.voided_at is null
      and date_trunc('month', p.paid_at) = date_trunc('month', current_date)), 0)
  into v_total_revenue, v_this_month
  from payments p;

  select coalesce(sum(sb.balance), 0) into v_pending from student_balances sb;

  -- Upcoming exams (next 7 days)
  select count(*) into v_upcoming_exams
  from exams e
  where e.status = 'published'
    and e.start_at between now() and now() + interval '7 days'
    and (p_class_id is null or e.class_id = p_class_id);

  return jsonb_build_object(
    'total_students',   v_total_students,
    'active_students',  v_active_students,
    'total_classes',    v_total_classes,
    'today_attendance_pct', case when v_today_total > 0
                              then round((v_today_present::numeric / v_today_total) * 100, 1)
                              else null end,
    'today_absences',   v_today_absent,
    'total_revenue',    v_total_revenue,
    'collected_this_month', v_this_month,
    'pending_balance',  v_pending,
    'upcoming_exams',   v_upcoming_exams
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_student_growth() — monthly student registration counts
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_student_growth(p_months int default 12)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.month)
    from (
      select
        to_char(date_trunc('month', p.created_at), 'YYYY-MM') as month,
        count(*) as count
      from profiles p
      where p.role = 'student'
        and p.created_at >= now() - (p_months || ' months')::interval
      group by date_trunc('month', p.created_at)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_monthly_revenue() — monthly collected payments
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_monthly_revenue(p_months int default 12)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.month)
    from (
      select
        to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
        sum(amount) as total
      from payments
      where voided_at is null
        and paid_at >= now() - (p_months || ' months')::interval
      group by date_trunc('month', paid_at)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_weekly_attendance() — weekly attendance breakdown
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_weekly_attendance(
  p_weeks    int  default 8,
  p_class_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.week)
    from (
      select
        to_char(date_trunc('week', date), 'YYYY-MM-DD') as week,
        count(*) filter (where status = 'present')  as present,
        count(*) filter (where status = 'absent')   as absent,
        count(*) filter (where status = 'late')     as late,
        count(*) filter (where status = 'excused')  as excused
      from attendance
      where date >= (current_date - (p_weeks * 7 || ' days')::interval)::date
        and (p_class_id is null or class_id = p_class_id)
      group by date_trunc('week', date)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_exam_performance() — average score per class
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_exam_performance(p_class_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t))
    from (
      select
        c.name  as class_name,
        e.title as exam_title,
        round(avg(er.percentage), 1) as avg_pct,
        min(er.percentage)  as min_pct,
        max(er.percentage)  as max_pct,
        count(er.attempt_id) as attempt_count
      from exam_results er
      join exam_attempts ea on ea.id = er.attempt_id
      join exams e  on e.id = er.exam_id
      join classes c on c.id = e.class_id
      where (p_class_id is null or e.class_id = p_class_id)
        and er.published_at is not null
      group by c.name, e.id, e.title
      order by e.created_at desc
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- students_needing_attention()
-- Teacher only. Returns students below thresholds from settings.
-- ─────────────────────────────────────────────────────────────────────
create or replace function students_needing_attention()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_thresholds jsonb;
  v_min_att    numeric;
  v_consec_abs int;
begin
  perform assert_teacher();

  select value into v_thresholds from settings where key = 'attention_thresholds';
  v_min_att    := coalesce((v_thresholds->>'min_attendance_pct')::numeric, 75);
  v_consec_abs := coalesce((v_thresholds->>'consecutive_absences')::int, 3);

  return (
    select jsonb_agg(row_to_json(t))
    from (
      select distinct
        s.id,
        p.full_name,
        s.student_code,
        array_agg(distinct reason) as reasons
      from students s
      join profiles p on p.id = s.id
      cross join lateral (
        select 'low_attendance' as reason
        where (
          select case
            when total_non_excused = 0 then null
            else round((present_count::numeric / total_non_excused) * 100, 1)
          end
          from (
            select
              count(*) filter (where a.status in ('present','late')) as present_count,
              count(*) filter (where a.status != 'excused') as total_non_excused
            from attendance a
            where a.student_id = s.id
              and a.date >= current_date - interval '30 days'
          ) att_sub
        ) < v_min_att
        union all
        select 'overdue_balance' as reason
        where (
          select balance from student_balances sb where sb.student_id = s.id
        ) > 0
          and (
          select overdue from student_balances sb where sb.student_id = s.id
        ) > 0
      ) reasons_lateral(reason)
      where s.status = 'active'
      group by s.id, p.full_name, s.student_code
    ) t
  );
end;
$$;
