-- =====================================================================
-- 0007_notifications.sql
-- Notifications, app settings, audit log
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- notifications: in-app notifications with outbox channel for future expansion
-- ─────────────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid                 primary key default gen_random_uuid(),
  user_id    uuid                 not null references profiles(id) on delete cascade,
  type       text                 not null,  -- e.g. 'exam_published', 'payment_reminder', 'results_published'
  title      text                 not null,
  body       text,
  link       text,                            -- deep link within the app
  read_at    timestamptz,
  channel    notification_channel not null default 'in_app',
  metadata   jsonb               not null default '{}'::jsonb,
  created_at timestamptz          not null default now()
);
comment on column notifications.channel is 'Outbox pattern: default in_app. WhatsApp/SMS can be added without schema changes.';

create index if not exists notifications_user_unread_idx on notifications(user_id, read_at, created_at desc);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- settings: key/value store for app-wide configuration
-- ─────────────────────────────────────────────────────────────────────
create table if not exists settings (
  key        text  primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
comment on table settings is 'App-wide config: currency, school_name, logo_url, attention_thresholds, etc.';

-- Seed with defaults (will be overridden by seed.sql)
insert into settings (key, value) values
  ('school_name',          '"Amr Academy"'),
  ('currency',             '"EGP"'),
  ('timezone',             '"Africa/Cairo"'),
  ('attention_thresholds', '{"min_attendance_pct": 75, "consecutive_absences": 3}'),
  ('logo_url',             'null')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- audit_log: immutable append-only log of significant actions
-- ─────────────────────────────────────────────────────────────────────
create table if not exists audit_log (
  id         bigserial   primary key,
  actor      uuid        references profiles(id),
  action     text        not null,  -- e.g. 'payment.void', 'student.archive', 'grade.update'
  entity     text        not null,  -- table name
  entity_id  text        not null,  -- row id
  meta       jsonb       not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
comment on table audit_log is 'Immutable audit trail. Never update or delete rows here.';

create index if not exists audit_log_entity_idx on audit_log(entity, entity_id);
create index if not exists audit_log_actor_idx  on audit_log(actor, at desc);
create index if not exists audit_log_at_idx     on audit_log(at desc);
