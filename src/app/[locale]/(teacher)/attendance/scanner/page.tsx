import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AttendanceScannerClientView } from './AttendanceScannerClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fast Attendance Scanner' }

export default async function AttendanceScannerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const admin = await createAdminClient()

  // 1. Fetch active classes with student counts
  const { data: rawClasses } = await (admin.from('classes' as any) as any)
    .select(`
      id, name, subject,
      enrollments ( id )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const classes = ((rawClasses as any[]) || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    studentCount: (c.enrollments || []).length,
  }))

  // 2. Fetch today's already-marked attendance for first class
  const today = new Date().toISOString().split('T')[0]
  const firstClassId = classes[0]?.id

  let initialAttendance: any[] = []
  if (firstClassId) {
    const { data: rawAtt } = await (admin.from('attendance' as any) as any)
      .select(`
        id, status, updated_at,
        students (
          student_code,
          profiles ( full_name )
        )
      `)
      .eq('class_id', firstClassId)
      .eq('date', today)
      .order('updated_at', { ascending: false })

    initialAttendance = ((rawAtt as any[]) || []).map((a: any) => ({
      id: a.id,
      code: a.students?.student_code || 'S0000',
      name: a.students?.profiles?.full_name || 'Student',
      status: a.status,
      isEnrolled: true,
      timestamp: new Date(a.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }))
  }

  return (
    <AttendanceScannerClientView
      locale={locale}
      classes={classes}
      initialAttendance={initialAttendance}
    />
  )
}
