import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExamRunner } from './ExamRunner'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string }>
}) {
  const { locale, examId } = await params
  const user = await requireStudent(locale)
  const isAr = locale === 'ar'

  const supabase = await createClient()

  // 1. Fetch exam info
  const { data: examData, error: examErr } = await (supabase.from('exams' as any) as any)
    .select(`
      id, title, description, instructions, duration_minutes, pass_marks,
      start_at, end_at, status, results_published,
      classes ( name )
    `)
    .eq('id', examId)
    .single()

  if (examErr || !examData) {
    return (
      <div className="py-12 text-center space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">{isAr ? 'الاختبار غير موجود' : 'Exam Not Found'}</h2>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'تأكد من الرابط أو راجع معلمك.' : 'Please check the link or contact your teacher.'}
        </p>
        <Link
          href={`/${locale}/portal/exams`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          {isAr ? 'العودة للاختبارات' : 'Back to Exams'}
        </Link>
      </div>
    )
  }

  // 2. Try starting or resuming the attempt
  const { data: attemptRes, error: startErr } = await (supabase.rpc as any)('start_attempt', {
    p_exam_id: examId,
  })

  // If already submitted
  if (startErr && (startErr.message?.includes('already_submitted') || startErr.message?.includes('already been submitted'))) {
    // Check if result is published
    const { data: result } = await (supabase.from('exam_results' as any) as any)
      .select('score, total, percentage, passed, published_at')
      .eq('exam_id', examId)
      .eq('student_id', user.id)
      .single()

    return (
      <div className="py-12 max-w-md mx-auto space-y-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isAr ? 'تم تسليم هذا الاختبار مسبقاً' : 'Exam Already Submitted'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr
                  ? 'لقد قمت بإرسال إجاباتك لهذا الاختبار.'
                  : 'You have already submitted your answers for this exam.'}
              </p>
            </div>

            {result?.published_at ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  {isAr ? 'نتيجتك' : 'Your Result'}
                </p>
                <div className="text-3xl font-black text-foreground">
                  {result.score} / {result.total}
                </div>
                <div className="text-sm font-medium">
                  {result.percentage}% —{' '}
                  <span className={result.passed ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {result.passed ? (isAr ? 'ناجح ✓' : 'Passed ✓') : (isAr ? 'راسب' : 'Not Passed')}
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/${locale}/portal/exams/${examId}/result`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{isAr ? 'مراجعة الأسئلة والإجابات النموذجية' : 'Review Questions & Model Answers'}</span>
                    {isAr ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-900/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                {isAr
                  ? 'النتائج قيد المراجعة والتصحيح من قبل المعلم، ستظهر هنا فور نشرها.'
                  : 'Results are being graded/reviewed by the teacher and will be published soon.'}
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/${locale}/portal/exams`}
                className="inline-flex items-center justify-center w-full rounded-lg bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                {isAr ? 'العودة لقائمة الاختبارات' : 'Back to Exams List'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Other error (not enrolled, expired, not published)
  if (startErr || !attemptRes) {
    return (
      <div className="py-12 text-center space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">{isAr ? 'تعذر بدء الاختبار' : 'Cannot Start Exam'}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {startErr?.message || (isAr ? 'الاختبار غير متاح حالياً.' : 'The exam is not available right now.')}
        </p>
        <Link
          href={`/${locale}/portal/exams`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          {isAr ? 'العودة للاختبارات' : 'Back to Exams'}
        </Link>
      </div>
    )
  }

  // 3. Fetch questions for this attempt (without answer keys)
  const { data: questionsData, error: qErr } = await (supabase.rpc as any)('get_attempt_questions', {
    p_attempt_id: attemptRes.attempt_id,
  })

  if (qErr) {
    return (
      <div className="py-12 text-center space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">{isAr ? 'خطأ في تحميل الأسئلة' : 'Failed to Load Questions'}</h2>
        <p className="text-sm text-muted-foreground">{qErr.message}</p>
      </div>
    )
  }

  return (
    <ExamRunner
      locale={locale}
      exam={{
        id: examData.id,
        title: examData.title,
        description: examData.description,
        instructions: examData.instructions,
        duration_minutes: examData.duration_minutes,
        pass_marks: parseFloat(examData.pass_marks) || 0,
        class_name: examData.classes?.name,
      }}
      attempt={{
        id: attemptRes.attempt_id,
        expires_at: attemptRes.expires_at,
        status: attemptRes.status,
      }}
      initialQuestions={questionsData || []}
    />
  )
}
