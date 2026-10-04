import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { ClassesClientView, ClassEnrollmentItem } from './ClassesClientView'

export const metadata: Metadata = { title: 'My Classes' }

export default async function StudentClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const admin = await createAdminClient()

  // 1. Fetch teacher profile
  const { data: teacher } = await (admin.from('profiles' as any) as any)
    .select('full_name')
    .eq('role', 'teacher')
    .limit(1)
    .single()

  const teacherName = teacher?.full_name || 'Teacher Amr'

  // 2. Fetch student's enrollments with class details
  const { data: rawEnrollments } = await (admin.from('enrollments' as any) as any)
    .select(`
      id, enrolled_on, fee_override,
      classes (
        id, name, subject, level, description, schedule, is_active,
        fee_structures ( amount, kind )
      )
    `)
    .eq('student_id', user.id)
    .is('left_on', null)
    .order('enrolled_on', { ascending: false })

  // 3. Fetch attendance records for this student to compute per-class rates
  const { data: rawAttendance } = await (admin.from('attendance' as any) as any)
    .select('class_id, status')
    .eq('student_id', user.id)

  const attendanceMap: Record<string, { total: number; attended: number }> = {}
  ;((rawAttendance as any[]) || []).forEach((att) => {
    if (!attendanceMap[att.class_id]) {
      attendanceMap[att.class_id] = { total: 0, attended: 0 }
    }
    attendanceMap[att.class_id].total++
    if (att.status === 'present' || att.status === 'late') {
      attendanceMap[att.class_id].attended++
    }
  })

  const classes: ClassEnrollmentItem[] = ((rawEnrollments as any[]) || []).map((e: any) => {
    const cls = e.classes
    const feeStructures = cls?.fee_structures || []
    const defaultFee = feeStructures[0]?.amount ? parseFloat(feeStructures[0].amount) : 0
    const finalFee = e.fee_override !== null && e.fee_override !== undefined
      ? parseFloat(e.fee_override)
      : defaultFee

    const classId = cls?.id || ''
    const stats = attendanceMap[classId] || { total: 0, attended: 0 }
    const attendanceRate = stats.total > 0
      ? Math.round((stats.attended / stats.total) * 100)
      : 100

    return {
      enrollmentId: e.id,
      enrolledOn: e.enrolled_on,
      fee: finalFee,
      classId,
      name: cls?.name || 'Class',
      subject: cls?.subject || '',
      level: cls?.level || '',
      description: cls?.description || '',
      schedule: (cls?.schedule as any[]) || [],
      isActive: cls?.is_active ?? true,
      totalSessions: stats.total,
      attendedSessions: stats.attended,
      attendanceRate,
    }
  })

  return (
    <ClassesClientView
      locale={locale}
      classes={classes}
      teacherName={teacherName}
    />
  )
}
