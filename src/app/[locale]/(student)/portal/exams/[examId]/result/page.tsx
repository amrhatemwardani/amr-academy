import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, HelpCircle,
  ToggleLeft, AlignLeft, BookOpen, AlertCircle, ArrowLeft, Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: HelpCircle,
  true_false: ToggleLeft,
  short_answer: AlignLeft,
  essay: BookOpen,
}

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string }>
}) {
  const { locale, examId } = await params
  const user = await requireStudent(locale)
  const isAr = locale === 'ar'

  const supabase = await createClient()

  // 1. Fetch exam
  const { data: exam } = await (supabase.from('exams' as any) as any)
    .select('id, title, pass_marks, classes ( name )')
    .eq('id', examId)
    .single()

  // 2. Fetch attempt
  const { data: attempt } = await (supabase.from('exam_attempts' as any) as any)
    .select('id, submitted_at, status')
    .eq('exam_id', examId)
    .eq('student_id', user.id)
    .single()

  if (!attempt) {
    return (
      <div className="py-12 text-center space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">{isAr ? 'لم يتم العثور على محاولة' : 'No Attempt Found'}</h2>
        <Link href={`/${locale}/portal/exams`} className="text-sm text-primary hover:underline">
          {isAr ? 'العودة للاختبارات' : 'Back to Exams'}
        </Link>
      </div>
    )
  }

  // 3. Fetch exam result
  const { data: result } = await (supabase.from('exam_results' as any) as any)
    .select('score, total, percentage, passed, published_at')
    .eq('attempt_id', attempt.id)
    .single()

  // 4. Try fetching detailed review
  let questions: any[] = []
  let reviewError: string | null = null

  if (result?.published_at) {
    const { data: reviewData, error: rErr } = await (supabase.rpc as any)('get_exam_review', {
      p_attempt_id: attempt.id,
    })
    if (rErr) {
      reviewError = rErr.message
    } else {
      questions = reviewData || []
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/portal/exams`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <span>{isAr ? 'العودة للاختبارات' : 'Back to Exams'}</span>
        </Link>

        <Badge variant="outline" className="text-xs">
          {exam?.classes?.name || 'Class'}
        </Badge>
      </div>

      {/* Result Hero Card */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <div className={`p-6 sm:p-8 text-center space-y-3 ${
          result?.passed
            ? 'bg-gradient-to-b from-emerald-500/10 to-transparent'
            : 'bg-gradient-to-b from-red-500/10 to-transparent'
        }`}>
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-background shadow-md">
            {result?.passed ? (
              <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>

          <h1 className="text-2xl font-black">{exam?.title}</h1>

          {result?.published_at ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">{result.score}</span>
                <span className="text-xl sm:text-2xl text-muted-foreground font-semibold">/ {result.total}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-bold text-muted-foreground">({result.percentage}%)</span>
                <Badge
                  className={
                    result.passed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : 'bg-red-600 text-white hover:bg-red-600'
                  }
                >
                  {result.passed ? (isAr ? 'ناجح' : 'Passed') : (isAr ? 'راسب' : 'Not Passed')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {isAr
                  ? `تاريخ التسليم: ${new Date(attempt.submitted_at).toLocaleString('ar-EG')}`
                  : `Submitted on: ${new Date(attempt.submitted_at).toLocaleString('en-US')}`}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 max-w-md mx-auto text-amber-800 dark:text-amber-300 text-sm space-y-1">
              <Clock className="h-5 w-5 mx-auto text-amber-600" />
              <p className="font-semibold">{isAr ? 'النتائج قيد التصحيح' : 'Grading in Progress'}</p>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'لم يتم نشر النتائج التفصيلية بعد من قبل المعلم.'
                  : 'Detailed results have not been published yet by your teacher.'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Review Questions List */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {isAr ? 'مراجعة الإجابات والحلول النموذجية' : 'Questions & Model Answers'}
            </h2>
            <span className="text-xs text-muted-foreground">
              {questions.length} {isAr ? 'سؤال' : 'questions'}
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const Icon = TYPE_ICONS[q.type] || HelpCircle
              const isFullMarks = q.marks_awarded === q.marks
              const isZero = q.marks_awarded === 0 || q.marks_awarded === null

              return (
                <Card key={q.question_id} className="overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md bg-muted text-foreground flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                          {q.type}
                        </span>
                      </div>
                      <Badge
                        variant={isFullMarks ? 'default' : isZero ? 'destructive' : 'secondary'}
                        className="text-xs font-mono"
                      >
                        {q.marks_awarded ?? 0} / {q.marks} {isAr ? 'د' : 'pts'}
                      </Badge>
                    </div>

                    {/* Question Body */}
                    <p className="font-medium text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {q.body}
                    </p>

                    {/* Options (MCQ / True False) */}
                    {(q.type === 'mcq' || q.type === 'true_false') && q.options && (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt: any) => {
                          const isStudentSelected = opt.id === q.selected_option_id
                          const isCorrect = opt.is_correct

                          let style = 'border-border bg-background text-foreground'
                          if (isCorrect) {
                            style = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold'
                          } else if (isStudentSelected && !isCorrect) {
                            style = 'border-red-500 bg-red-500/10 text-red-800 dark:text-red-300 line-through'
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-colors ${style}`}
                            >
                              <div className="flex items-center gap-2.5">
                                {isCorrect ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : isStudentSelected ? (
                                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                ) : (
                                  <span className="h-4 w-4 rounded-full border border-border inline-block shrink-0" />
                                )}
                                <span>{opt.body}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                {isStudentSelected && (
                                  <Badge variant="outline" className="text-[10px] bg-background">
                                    {isAr ? 'إجابتك' : 'Your Choice'}
                                  </Badge>
                                )}
                                {isCorrect && (
                                  <Badge className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-600">
                                    {isAr ? 'الإجابة الصحيحة' : 'Correct'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Short Answer / Essay review */}
                    {(q.type === 'short_answer' || q.type === 'essay') && (
                      <div className="space-y-3 pt-1">
                        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {isAr ? 'إجابتك المُرسلة:' : 'Your Answer:'}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {q.text_answer || <span className="italic text-muted-foreground">{isAr ? '(لم تتم الإجابة)' : '(No answer)'}</span>}
                          </p>
                        </div>

                        {q.model_answer && (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                              {isAr ? 'الإجابة النموذجية:' : 'Model Answer:'}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{q.model_answer}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher Feedback */}
                    {q.feedback && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                        <p className="text-xs font-semibold text-primary uppercase">
                          {isAr ? 'ملاحظات المعلم:' : 'Teacher Feedback:'}
                        </p>
                        <p className="text-sm text-foreground">{q.feedback}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">{isAr ? 'توضيح وشرح الحل:' : 'Explanation:'}</p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
