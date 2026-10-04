import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmissionsClientView } from './SubmissionsClientView'
import { Clock, Users, ChevronLeft, BookOpen } from 'lucide-react'

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>
}) {
  const { locale, assignmentId } = await params
  await requireTeacher(locale)
  const admin = await createAdminClient()
  const isAr = locale === 'ar'

  // Fetch assignment details
  const { data: asgn } = await (admin.from('assignments' as any) as any)
    .select('id, title, description, type, due_date, max_score, class_id, student_id, classes(name)')
    .eq('id', assignmentId)
    .single()

  if (!asgn) notFound()

  // Fetch submissions with student info
  const { data: rawSubs } = await (admin.from('assignment_submissions' as any) as any)
    .select(`
      id, content, file_url, file_name, score, teacher_note, status, submitted_at, graded_at,
      students ( id, student_code, profiles(full_name) )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  const submissions = ((rawSubs as any[]) || []).map((s: any) => ({
    id: s.id,
    studentId: s.students?.id || '',
    studentCode: s.students?.student_code || '',
    studentName: s.students?.profiles?.full_name || 'Student',
    content: s.content || '',
    fileUrl: s.file_url || '',
    fileName: s.file_name || '',
    score: s.score ?? null,
    teacherNote: s.teacher_note || '',
    status: s.status as 'submitted' | 'graded' | 'late',
    submittedAt: s.submitted_at,
    gradedAt: s.graded_at,
  }))

  const assignment = {
    id: asgn.id,
    title: asgn.title,
    description: asgn.description || '',
    type: asgn.type,
    className: (asgn as any).classes?.name || '',
    dueDate: asgn.due_date || null,
    maxScore: asgn.max_score,
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${locale}/assignments`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {isAr ? 'العودة للواجبات' : 'Back to Assignments'}
      </Link>

      {/* Assignment Header */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold">{assignment.title}</p>
              {assignment.className && (
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  <BookOpen className="h-3.5 w-3.5 inline me-1" />
                  {assignment.className}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">{assignment.type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignment.description && (
            <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {submissions.length} {isAr ? 'تسليم' : 'submissions'}
            </span>
            {assignment.dueDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {isAr ? 'الموعد النهائي:' : 'Due:'}{' '}
                {new Date(assignment.dueDate).toLocaleString()}
              </span>
            )}
            <span>
              {isAr ? 'الدرجة الكاملة:' : 'Max score:'} {assignment.maxScore}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
      <SubmissionsClientView
        locale={locale}
        submissions={submissions}
        maxScore={assignment.maxScore}
      />
    </div>
  )
}
