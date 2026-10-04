import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Clock, CheckCircle2, CalendarDays, Trophy, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My Exams' }

export default async function StudentExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const student = await requireStudent(locale)
  const isAr = locale === 'ar'

  const supabase = await createClient()

  // Get student record
  const { data: studentRow } = await (supabase.from('students' as any) as any)
    .select('id')
    .eq('id', student.id)
    .single()

  const studentId = (studentRow as any)?.id || student.id

  // Get available exams for this student's classes
  const { data: rawExams } = await (supabase.from('exams' as any) as any)
    .select(`
      id, title, description, status, duration_minutes, start_at, end_at, pass_marks,
      classes ( name ),
      exam_attempts!left ( id, status, submitted_at, student_id ),
      exam_results!left ( score, total, percentage, passed, published_at )
    `)
    .in('status', ['published', 'closed'])
    .order('start_at', { ascending: false })

  // Filter to only exams for classes the student is enrolled in
  const { data: enrollments } = await (supabase.from('enrollments' as any) as any)
    .select('class_id')
    .eq('student_id', studentId)
    .is('left_on', null)

  const enrolledClassIds = new Set(((enrollments as any[]) || []).map((e: any) => e.class_id))

  const exams = ((rawExams as any[]) || []).map((e: any) => {
    const myAttempt = (e.exam_attempts || []).find((a: any) => a.student_id === studentId)
    const myResult = myAttempt ? (e.exam_results || []).find((r: any) => r) : null
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      duration_minutes: e.duration_minutes,
      start_at: e.start_at,
      end_at: e.end_at,
      pass_marks: parseFloat(e.pass_marks) || 0,
      class_name: e.classes?.name || '',
      attempt: myAttempt ? {
        id: myAttempt.id,
        status: myAttempt.status,
        submitted_at: myAttempt.submitted_at,
      } : null,
      result: myResult ? {
        score: parseFloat(myResult.score),
        total: parseFloat(myResult.total),
        percentage: parseFloat(myResult.percentage),
        passed: myResult.passed,
        published: !!myResult.published_at,
      } : null,
    }
  })

  const now = new Date()
  const available = exams.filter((e) => {
    if (!enrolledClassIds.has(e.id)) return true // include all for now
    return true
  })

  const upcoming  = available.filter((e) => e.status === 'published' && new Date(e.start_at) > now && !e.attempt)
  const active    = available.filter((e) => e.status === 'published' && new Date(e.start_at) <= now && new Date(e.end_at) > now)
  const submitted = available.filter((e) => e.attempt)

  return (
    <div className="space-y-6 pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-xl font-bold">{isAr ? 'اختباراتي' : 'My Exams'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAr ? 'الاختبارات المتاحة ونتائجك' : 'Available exams and your results'}
        </p>
      </div>

      {/* Active (can take now) */}
      {active.length > 0 && (
        <section>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {isAr ? 'جاهز للبدء الآن' : 'Available Now'}
          </p>
          <div className="space-y-3">
            {active.filter((e) => !e.attempt).map((exam) => (
              <Card key={exam.id} className="border-emerald-200 dark:border-emerald-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{exam.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{exam.class_name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {exam.duration_minutes} {isAr ? 'دقيقة' : 'min'}
                        </span>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
                      )}
                    </div>
                    <Link
                      href={`/${locale}/portal/exams/${exam.id}`}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {isAr ? 'ابدأ' : 'Start'}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* In-progress (resume) */}
      {active.filter((e) => e.attempt?.status === 'in_progress').map((exam) => (
        <Card key={exam.id} className="border-amber-200 dark:border-amber-800/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{exam.title}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {isAr ? 'في التقدم — استمر' : 'In progress — continue'}
              </p>
            </div>
            <Link
              href={`/${locale}/portal/exams/${exam.id}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              {isAr ? 'استمرار' : 'Resume'}
            </Link>
          </CardContent>
        </Card>
      ))}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <p className="text-sm font-semibold text-muted-foreground mb-2">{isAr ? 'قادم' : 'Upcoming'}</p>
          <div className="space-y-2">
            {upcoming.map((exam) => (
              <Card key={exam.id} className="opacity-75">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(exam.start_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
                    </p>
                  </div>
                  <Badge variant="secondary">{isAr ? 'لم يبدأ بعد' : 'Not started'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Completed with results */}
      {submitted.filter((e) => e.attempt?.status !== 'in_progress').length > 0 && (
        <section>
          <p className="text-sm font-semibold text-muted-foreground mb-2">{isAr ? 'المكتملة' : 'Completed'}</p>
          <div className="space-y-2">
            {submitted.filter((e) => e.attempt?.status !== 'in_progress').map((exam) => (
              <Card key={exam.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {exam.result?.published ? (
                          <>
                            <span className={`text-sm font-bold ${exam.result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                              {exam.result.score}/{exam.result.total}
                            </span>
                            <span className="text-xs text-muted-foreground">({exam.result.percentage}%)</span>
                            <Badge className={exam.result.passed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                            >
                              {exam.result.passed ? (isAr ? 'ناجح ✓' : 'Passed ✓') : (isAr ? 'راسب' : 'Failed')}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isAr ? 'في انتظار النتائج' : 'Awaiting results'}
                          </span>
                        )}
                      </div>
                    </div>
                    {exam.result?.published && exam.attempt && (
                      <Link
                        href={`/${locale}/portal/exams/${exam.id}/result`}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        {isAr ? 'مراجعة الإجابات' : 'Review Answers'}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {available.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">{isAr ? 'لا توجد اختبارات متاحة' : 'No exams available yet'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
