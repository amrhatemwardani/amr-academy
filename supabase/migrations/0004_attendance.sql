-- =====================================================================
-- 0004_attendance.sql
-- Attendance tracking
-- =====================================================================

create table if not exists attendance (
  id          uuid              primary key default gen_random_uuid(),
  class_id    uuid              not null references classes(id) on delete cascade,
  student_id  uuid              not null references students(id) on delete cascade,
  date        date              not null,
  status      attendance_status not null,
  note        text,
  marked_by   uuid              references profiles(id),
  updated_at  timestamptz       not null default now(),
  created_at  timestamptz       not null default now(),
  -- Prevents duplicates: one attendance record per student per class per day
  unique (class_id, student_id, date)
);
comment on table attendance is 'One row per (class, student, date). Upsert via save_attendance RPC.';

create index if not exists attendance_student_date_idx  on attendance(student_id, date desc);
create index if not exists attendance_class_date_idx    on attendance(class_id, date);
create index if not exists attendance_date_idx          on attendance(date);

drop trigger if exists attendance_updated_at on attendance;
create trigger attendance_updated_at
  before update on attendance
  for each row execute function update_updated_at();
