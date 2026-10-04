import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { TasksClientView } from './TasksClientView'

export const metadata: Metadata = { title: 'My Tasks & Assignments' }

export default async function StudentTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)
  const admin = await createAdminClient()

  // Get enrolled class IDs
  const { data: rawEnrollments } = await (admin.from('enrollments' as any) as any)
    .select('class_id')
    .eq('student_id', user.id)
    .is('left_on', null)

  const classIds = ((rawEnrollments as any[]) || []).map((e: any) => e.class_id as string)

  // Fetch assignments for this student (assigned to them directly OR to their enrolled classes)
  const { data: rawAssignments } = await (admin.from('assignments' as any) as any)
    .select('id, title, description, type, due_date, max_score, class_id, student_id, classes(name, subject)')
    .eq('is_active', true)
    .order('due_date', { ascending: true })

  const allAssignments = ((rawAssignments as any[]) || []) as any[]

  // Filter: assigned directly to student OR to one of their classes (with student_id = null)
  const relevantAssignments = allAssignments.filter((a: any) => {
    if (a.student_id === user.id) return true
    if (!a.student_id && classIds.includes(a.class_id)) return true
    return false
  })

  // Fetch existing submissions for this student
  const { data: rawSubmissions } = await (admin.from('assignment_submissions' as any) as any)
    .select('assignment_id, score, teacher_note, status, submitted_at, graded_at, content, file_name, file_url')
    .eq('student_id', user.id)

  const submissionsMap: Record<string, any> = {}
  ;((rawSubmissions as any[]) || []).forEach((s: any) => {
    submissionsMap[s.assignment_id] = {
      score: s.score,
      teacherNote: s.teacher_note || '',
      status: s.status,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
      content: s.content || '',
      fileName: s.file_name || '',
      fileUrl: s.file_url || '',
    }
  })

  const tasks = relevantAssignments.map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    type: a.type as string,
    className: a.classes?.name || '',
    classSubject: a.classes?.subject || '',
    dueDate: a.due_date || null,
    maxScore: a.max_score,
    submission: submissionsMap[a.id] || null,
  }))

  return (
    <TasksClientView
      locale={locale}
      tasks={tasks}
      studentId={user.id}
    />
  )
}
