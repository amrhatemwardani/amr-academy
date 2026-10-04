import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AttendanceClientView, RosterStudent, ClassOption, AttendanceStatus } from './AttendanceClientView'

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ classId?: string; date?: string }>
}) {
  const { locale } = await params
  const { classId: queryClassId, date: queryDate } = await searchParams
  await requireTeacher(locale)

  const supabase = await createClient()

  // 1. Fetch active classes
  const { data: rawClasses, error: cErr } = await (supabase.from('classes' as any) as any)
    .select('id, name, subject, schedule')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (cErr) {
    console.error('Error fetching classes:', cErr)
  }

  const classes: ClassOption[] = ((rawClasses as any[]) || []).map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    schedule: Array.isArray(c.schedule) ? c.schedule : [],
  }))

  // Pick target class and date
  const selectedClassId = queryClassId || (classes[0]?.id ?? '')
  const todayStr = new Date().toISOString().slice(0, 10)
  const selectedDate = queryDate || todayStr

  let roster: RosterStudent[] = []

  if (selectedClassId) {
    // 2. Fetch enrolled students for this class
    const { data: enrollments } = await (supabase.from('enrollments' as any) as any)
      .select(`
        student_id,
        students (
          id,
          student_code,
          phone,
          status,
          profiles (
            full_name
          )
        )
      `)
      .eq('class_id', selectedClassId)
      .is('left_on', null)

    // 3. Fetch existing attendance records for this class & date
    const { data: existingAttendance } = await (supabase.from('attendance' as any) as any)
      .select('student_id, status, note')
      .eq('class_id', selectedClassId)
      .eq('date', selectedDate)

    const attMap: Record<string, { status: AttendanceStatus; note: string }> = {}
    ;(existingAttendance as any[] || []).forEach((a) => {
      attMap[a.student_id] = { status: a.status, note: a.note || '' }
    })

    roster = ((enrollments as any[]) || [])
      .filter((e) => e.students && e.students.status === 'active')
      .map((e) => {
        const sid = e.student_id
        const existing = attMap[sid]
        return {
          id: sid,
          student_code: e.students.student_code,
          full_name: e.students.profiles?.full_name || 'Student',
          phone: e.students.phone,
          currentStatus: existing ? existing.status : 'present',
          currentNote: existing ? existing.note : '',
        }
      })
      .sort((a, b) => a.student_code.localeCompare(b.student_code))
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <AttendanceClientView
        selectedClassId={selectedClassId}
        selectedDate={selectedDate}
        classes={classes}
        roster={roster}
      />
    </div>
  )
}
