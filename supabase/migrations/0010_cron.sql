-- =====================================================================
-- 0010_cron.sql
-- pg_cron scheduled jobs.
-- Requires pg_cron extension (enabled in 0001).
-- Run AFTER the extension is available.
-- =====================================================================

-- Sweep expired exam attempts every minute & monthly charges & reminders
do $cron$
begin
  begin perform cron.unschedule('sweep-expired-attempts'); exception when others then null; end;
  perform cron.schedule('sweep-expired-attempts', '* * * * *', 'select sweep_expired_attempts()');

  begin perform cron.unschedule('generate-monthly-charges'); exception when others then null; end;
  perform cron.schedule('generate-monthly-charges', '5 22 28-31 * *', $cmd$
    select generate_monthly_charges(date_trunc('month', current_date + interval '1 day')::date)
    where extract(day from current_date + interval '1 day') = 1;
  $cmd$);

  begin perform cron.unschedule('exam-reminders'); exception when others then null; end;
  perform cron.schedule('exam-reminders', '0 * * * *', $cmd$
    insert into notifications (user_id, type, title, body, link)
    select
      e2.student_id,
      'exam_reminder',
      'Upcoming Exam: ' || ex.title,
      'Your exam starts in less than 24 hours. Prepare yourself!',
      '/portal/exams/' || ex.id
    from exams ex
    join (
      select e.student_id, e.class_id
      from enrollments e
      where e.left_on is null
    ) e2 on e2.class_id = ex.class_id
    where ex.status = 'published'
      and ex.start_at between now() + interval '23 hours' and now() + interval '25 hours'
      and not exists (
        select 1 from notifications n
        where n.user_id = e2.student_id
          and n.type = 'exam_reminder'
          and n.metadata->>'exam_id' = ex.id::text
          and n.created_at > now() - interval '12 hours'
      );
  $cmd$);
exception when others then
  null; -- skip gracefully if pg_cron is managed or not enabled
end $cron$;
