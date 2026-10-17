-- =====================================================================
-- 0014_questions_unit_lesson.sql
-- Add unit and lesson columns to questions table for better filtering
-- =====================================================================

alter table questions
  add column if not exists unit   text,
  add column if not exists lesson text;

-- Indexes for fast filtering
create index if not exists questions_unit_idx   on questions(unit)   where unit   is not null;
create index if not exists questions_lesson_idx on questions(lesson) where lesson is not null;

comment on column questions.unit   is 'The curriculum unit this question belongs to (e.g. "الوحدة الأولى - الحركة")';
comment on column questions.lesson is 'The lesson inside the unit (e.g. "الدرس الثالث - قوانين نيوتن")';
