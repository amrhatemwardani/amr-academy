-- =====================================================================
-- 0001_extensions_enums.sql
-- Extensions and all application enum types
-- =====================================================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;           -- fast trigram text search
do $$ begin
  create extension if not exists pg_cron schema cron;
exception when others then
  null; -- skip if pg_cron is managed or not enabled on project
end $$;

-- ---------------------------------------------------------------------
-- Enum types (Idempotent)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('teacher', 'student');
  end if;
  if not exists (select 1 from pg_type where typname = 'student_status') then
    create type student_status as enum ('active', 'inactive', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'absent', 'late', 'excused');
  end if;
  if not exists (select 1 from pg_type where typname = 'pay_method') then
    create type pay_method as enum ('cash', 'bank_transfer', 'mobile_wallet', 'card', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'charge_kind') then
    create type charge_kind as enum ('monthly', 'course', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type question_type as enum ('mcq', 'true_false', 'short_answer', 'essay');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type exam_status as enum ('draft', 'published', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'attempt_status') then
    create type attempt_status as enum ('in_progress', 'submitted', 'auto_submitted', 'graded');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type notification_channel as enum ('in_app', 'whatsapp', 'email', 'sms');
  end if;
end $$;
