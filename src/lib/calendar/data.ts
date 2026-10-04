import { createAdminClient } from '@/lib/supabase/admin'
import { CalendarEvent } from '@/components/calendar/AcademyCalendarClientView'

export async function getCalendarEvents({
  role,
  studentId,
}: {
  role: 'teacher' | 'student'
  studentId?: string
}): Promise<CalendarEvent[]> {
  const admin = await createAdminClient()
  const events: CalendarEvent[] = []

  // 1. Fetch classes
  let classQuery = (admin.from('classes' as any) as any)
    .select('id, name, subject, schedule, is_active')
    .eq('is_active', true)

  if (role === 'student' && studentId) {
    const { data: enrollments } = await (admin.from('enrollments' as any) as any)
      .select('class_id')
      .eq('student_id', studentId)
      .is('left_on', null)

    const classIds = ((enrollments as any[]) || []).map((e) => e.class_id)
    if (classIds.length === 0) return []
    classQuery = classQuery.in('id', classIds)
  }

  const { data: classes } = await classQuery

  // Expand weekly schedules into actual calendar days for the current & surrounding 2 months
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Generate for month - 1, month, month + 1
  for (let mOffset = -1; mOffset <= 2; mOffset++) {
    const targetMonthDate = new Date(year, month + mOffset, 1)
    const tYear = targetMonthDate.getFullYear()
    const tMonth = targetMonthDate.getMonth()
    const daysInMonth = new Date(tYear, tMonth + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(tYear, tMonth, day)
      const dow = d.getDay() // 0 = Sun
      const dateStr = `${tYear}-${String(tMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      ;(classes || []).forEach((c: any) => {
        const schedule = (c.schedule as any[]) || []
        schedule.forEach((slot: any, sIdx: number) => {
          if (slot.dow === dow) {
            events.push({
              id: `class-${c.id}-${dateStr}-${sIdx}`,
              title: c.name,
              subtitle: c.subject || 'Class Session',
              date: dateStr,
              startTime: slot.start,
              endTime: slot.end,
              type: 'class',
              badge: c.subject || 'Class',
              link: role === 'student' ? `/portal/classes` : `/classes`,
            })
          }
        })
      })
    }
  }

  // 2. Fetch Exams
  const { data: exams } = await (admin.from('exams' as any) as any)
    .select('id, title, start_at, end_at, duration_minutes, classes ( name )')
    .neq('status', 'draft')

  ;(exams || []).forEach((ex: any) => {
    if (ex.start_at) {
      const dateStr = ex.start_at.split('T')[0]
      const timeStr = ex.start_at.split('T')[1]?.slice(0, 5)

      events.push({
        id: `exam-${ex.id}`,
        title: ex.title,
        subtitle: `${ex.classes?.name || 'Class'} • ${ex.duration_minutes} min`,
        date: dateStr,
        startTime: timeStr,
        type: 'exam',
        badge: 'Exam',
        link: role === 'student' ? `/portal/exams/${ex.id}` : `/exams`,
      })
    }
  })

  // 3. Fetch Charges Due Dates
  let chargesQuery = (admin.from('charges' as any) as any)
    .select('id, description, amount, due_date, classes ( name )')
    .is('voided_at', null)

  if (role === 'student' && studentId) {
    chargesQuery = chargesQuery.eq('student_id', studentId)
  }

  const { data: charges } = await chargesQuery.limit(50)

  ;(charges || []).forEach((ch: any) => {
    if (ch.due_date) {
      events.push({
        id: `charge-${ch.id}`,
        title: ch.description || 'Tuition Fee Due',
        subtitle: `${ch.classes?.name || ''} • EGP ${parseFloat(ch.amount).toLocaleString()}`,
        date: ch.due_date,
        type: 'payment',
        badge: 'Due',
        link: role === 'student' ? `/portal/payments` : `/finance`,
      })
    }
  })

  return events
}
