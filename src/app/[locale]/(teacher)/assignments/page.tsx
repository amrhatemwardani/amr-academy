import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { AssignmentsClientView } from './AssignmentsClientView'

export const metadata: Metadata = { title: 'Assignments' }

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)
  const admin = createAdminClient()

  // Fetch all classes for the filter/creation dropdown
  const { data: rawClasses } = await (admin.from('classes' as any) as any)
    .select('id, name, subject, level')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const classes = ((rawClasses as any[]) || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject || '',
    level: c.level || '',
  }))

  // Fetch all active students for individual student assignments
  const { data: rawStudents } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code,
      profiles ( full_name )
    `)
    .eq('status', 'active')
    .order('student_code', { ascending: true })

  const students = ((rawStudents as any[]) || []).map((s: any) => ({
    id: s.id,
    code: s.student_code || '',
    name: s.profiles?.full_name || 'Student',
  }))

  const studentMap: Record<string, { name: string; code: string }> = {}
  students.forEach((s) => {
    studentMap[s.id] = { name: s.name, code: s.code }
  })

  // Fetch all assignments with class name and submission count
  const { data: rawAssignments } = await (admin.from('assignments' as any) as any)
    .select(`
      id, title, description, resource_link, type, due_date, max_score, is_active, created_at,
      class_id, student_id,
      classes ( name, subject )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch submission counts per assignment
  const { data: rawCounts } = await (admin.from('assignment_submissions' as any) as any)
    .select('assignment_id')

  const submissionCounts: Record<string, number> = {}
  ;((rawCounts as any[]) || []).forEach((s: any) => {
    submissionCounts[s.assignment_id] = (submissionCounts[s.assignment_id] || 0) + 1
  })

  const assignments = ((rawAssignments as any[]) || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    resource_link: a.resource_link || null,
    type: a.type,
    classId: a.class_id || '',
    className: a.classes?.name || '',
    classSubject: a.classes?.subject || '',
    studentId: a.student_id || null,
    studentName: a.student_id ? studentMap[a.student_id]?.name || 'Student' : null,
    studentCode: a.student_id ? studentMap[a.student_id]?.code || '' : null,
    dueDate: a.due_date || null,
    maxScore: a.max_score,
    submissionCount: submissionCounts[a.id] || 0,
    createdAt: a.created_at,
  }))

  return (
    <AssignmentsClientView
      locale={locale}
      assignments={assignments}
      classes={classes}
      students={students}
    />
  )
}
