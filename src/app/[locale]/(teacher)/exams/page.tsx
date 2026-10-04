import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExamsClientView } from './ExamsClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exams' }

export default async function ExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const admin = await createAdminClient()

  // Fetch exams with submission counts and results
  const { data: rawExams } = await (admin.from('exams' as any) as any)
    .select(`
      id, title, description, status, duration_minutes, pass_marks,
      start_at, end_at, shuffle_questions, shuffle_options, results_published,
      classes ( id, name ),
      exam_questions ( question_id, marks, position ),
      exam_attempts ( id, status, student_id )
    `)
    .order('created_at', { ascending: false })

  // Fetch classes for new exam dialog
  const { data: rawClasses } = await (admin.from('classes' as any) as any)
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name')

  // Fetch questions for the exam builder picker
  const { data: rawQuestions } = await (admin.from('questions' as any) as any)
    .select('id, type, body, default_marks, subject, tags')
    .order('created_at', { ascending: false })

  const exams = ((rawExams as any[]) || []).map((e: any) => {
    const attempts: any[] = e.exam_attempts || []
    const totalMarks = (e.exam_questions || []).reduce((sum: number, q: any) => sum + parseFloat(q.marks), 0)
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      duration_minutes: e.duration_minutes,
      pass_marks: parseFloat(e.pass_marks) || 0,
      start_at: e.start_at,
      end_at: e.end_at,
      shuffle_questions: e.shuffle_questions,
      shuffle_options: e.shuffle_options,
      results_published: e.results_published,
      class_id: e.classes?.id || '',
      class_name: e.classes?.name || '',
      question_count: (e.exam_questions || []).length,
      total_marks: totalMarks,
      submission_count: attempts.length,
      graded_count: attempts.filter((a: any) => a.status === 'graded').length,
      questions: (e.exam_questions || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((q: any) => ({ question_id: q.question_id, position: q.position, marks: parseFloat(q.marks) })),
    }
  })

  const classes = ((rawClasses as any[]) || []).map((c: any) => ({ id: c.id, name: c.name }))

  const questions = ((rawQuestions as any[]) || []).map((q: any) => ({
    id: q.id,
    type: q.type,
    body: q.body,
    default_marks: parseFloat(q.default_marks) || 1,
    subject: q.subject,
    tags: q.tags || [],
  }))

  return (
    <ExamsClientView
      locale={locale}
      exams={exams}
      classes={classes}
      questions={questions}
    />
  )
}
