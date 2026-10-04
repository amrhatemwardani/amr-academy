-- 0013_materials.sql - Google Drive Materials system
create table if not exists materials (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  section     text        not null,
  chapter     text,
  drive_url   text        not null,
  class_id    uuid        references classes(id) on delete cascade,
  description text,
  is_active   boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists materials_class_idx on materials(class_id);
alter table materials enable row level security;
create policy "teachers_manage_materials" on materials
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));
create policy "students_view_materials" on materials
  for select using (
    is_active = true and (class_id is null or exists (
      select 1 from enrollments e where e.student_id = auth.uid() and e.class_id = materials.class_id and e.left_on is null
    ))
  );
