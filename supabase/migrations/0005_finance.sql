-- =====================================================================
-- 0005_finance.sql
-- Fee structures, charges ledger, payments ledger, allocation mapping,
-- and the two authoritative balance views.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- receipt sequence — sequential across all years
-- ─────────────────────────────────────────────────────────────────────
create sequence if not exists receipt_seq start 1 increment 1;

-- ─────────────────────────────────────────────────────────────────────
-- fee_structures: what a class charges (teacher-defined)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists fee_structures (
  id           uuid        primary key default gen_random_uuid(),
  class_id     uuid        not null references classes(id) on delete cascade,
  name         text        not null,
  kind         charge_kind not null default 'monthly',
  amount       numeric(12,2) not null check (amount >= 0),
  active_from  date        not null default current_date,
  active_to    date,
  created_at   timestamptz not null default now()
);
comment on table fee_structures is 'Defines what students in a class are charged. active_to=NULL means still active.';

create index if not exists fee_structures_class_idx on fee_structures(class_id, active_from);

-- ─────────────────────────────────────────────────────────────────────
-- charges: what a student owes (the debit side of the ledger)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists charges (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references students(id) on delete restrict,
  class_id    uuid        references classes(id),
  kind        charge_kind not null,
  period      date,                                -- first day of month for monthly charges
  description text,
  amount      numeric(12,2) not null check (amount > 0),
  due_date    date        not null,
  voided_at   timestamptz,
  created_at  timestamptz not null default now()
);
comment on table charges is 'Append-only debit ledger. Void instead of deleting.';

-- Idempotent monthly charge: prevent duplicate charges for the same student/class/period
create unique index if not exists charges_monthly_uq on charges(student_id, class_id, period, kind)
  where kind = 'monthly' and voided_at is null;

create index if not exists charges_student_due_idx  on charges(student_id, due_date);
create index if not exists charges_student_idx      on charges(student_id) where voided_at is null;

-- ─────────────────────────────────────────────────────────────────────
-- payments: what the student paid (credit side of the ledger)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists payments (
  id           uuid        primary key default gen_random_uuid(),
  receipt_no   text        not null unique
                           default ('R-' || to_char(now(), 'YYYY') || '-' ||
                                    lpad(nextval('receipt_seq')::text, 6, '0')),
  student_id   uuid        not null references students(id) on delete restrict,
  amount       numeric(12,2) not null check (amount > 0),
  method       pay_method  not null,
  paid_at      timestamptz not null default now(),
  reference    text,                               -- bank ref, wallet TXN, etc.
  notes        text,
  recorded_by  uuid        references profiles(id),
  voided_at    timestamptz,
  void_reason  text,
  created_at   timestamptz not null default now()
);
comment on table payments is 'Append-only credit ledger. Void instead of deleting. voided payments are excluded from balances.';

create index if not exists payments_student_paid_idx on payments(student_id, paid_at desc);
create index if not exists payments_paid_at_idx      on payments(paid_at desc);
create index if not exists payments_receipt_idx      on payments(receipt_no);

-- ─────────────────────────────────────────────────────────────────────
-- payment_allocations: which payment pays which charge(s)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists payment_allocations (
  payment_id  uuid        not null references payments(id) on delete cascade,
  charge_id   uuid        not null references charges(id) on delete restrict,
  amount      numeric(12,2) not null check (amount > 0),
  primary key (payment_id, charge_id)
);
create index if not exists payment_allocations_charge_idx on payment_allocations(charge_id);

-- ─────────────────────────────────────────────────────────────────────
-- charge_status VIEW: balance per charge
-- security_invoker = true → runs as the calling user (RLS applies)
-- ─────────────────────────────────────────────────────────────────────
create or replace view charge_status with (security_invoker = true) as
select
  c.*,
  coalesce(
    sum(pa.amount) filter (where p.voided_at is null),
    0
  ) as paid,
  c.amount - coalesce(
    sum(pa.amount) filter (where p.voided_at is null),
    0
  ) as remaining
from charges c
left join payment_allocations pa on pa.charge_id = c.id
left join payments p              on p.id = pa.payment_id
where c.voided_at is null
group by c.id;

comment on view charge_status is 'Per-charge paid/remaining amounts. Excludes voided charges and voided payments.';

-- ─────────────────────────────────────────────────────────────────────
-- student_balances VIEW: aggregated balance per student
-- security_invoker = true → runs as the calling user (RLS applies)
-- ─────────────────────────────────────────────────────────────────────
create or replace view student_balances with (security_invoker = true) as
select
  student_id,
  sum(amount)                                          as total_charged,
  sum(paid)                                            as total_paid,
  sum(remaining)                                       as balance,
  sum(remaining) filter (where due_date < current_date) as overdue
from charge_status
group by student_id;

comment on view student_balances is 'Aggregated balance per student. All amounts computed in SQL — never in the browser.';
