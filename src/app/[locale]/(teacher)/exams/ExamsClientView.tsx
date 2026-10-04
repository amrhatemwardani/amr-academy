'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, FileText, Clock, BarChart2, ChevronRight,
  Pencil, Trash2, Play, StopCircle, Share2, GraduationCap,
  CalendarDays, Users, CheckSquare, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExamBuilderDialog } from './ExamBuilderDialog'
import { GradingPanel } from './GradingPanel'
import {
  publishExamAction, closeExamAction, deleteExamAction, publishResultsAction,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────
export interface ExamItem {
  id: string
  title: string
  description?: string
  status: 'draft' | 'published' | 'closed'
  duration_minutes: number
  pass_marks: number
  start_at: string
  end_at: string
  shuffle_questions: boolean
  shuffle_options: boolean
  results_published: boolean
  class_id: string
  class_name: string
  question_count: number
  total_marks: number
  submission_count: number
  graded_count: number
  questions: { question_id: string; position: number; marks: number }[]
}

export interface ClassOption  { id: string; name: string }
export interface QuestionOption {
  id: string
  type: string
  body: string
  default_marks: number
  subject?: string
  tags: string[]
}

interface Props {
  locale: string
  exams: ExamItem[]
  classes: ClassOption[]
  questions: QuestionOption[]
}

// ── Status badge helper ───────────────────────────────────────────────
function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const cfg: Record<string, { label: string; arLabel: string; class: string }> = {
    draft:     { label: 'Draft',     arLabel: 'مسودة',  class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    published: { label: 'Published', arLabel: 'منشور',  class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    closed:    { label: 'Closed',    arLabel: 'مغلق',   class: 'bg-muted text-muted-foreground' },
  }
  const c = cfg[status] || cfg.draft
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.class}`}>
      {isAr ? c.arLabel : c.label}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export function ExamsClientView({ locale, exams, classes, questions }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null)
  const [gradingExamId, setGradingExamId] = useState<string | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const setLoad = (id: string, v: boolean) => setLoading((p) => ({ ...p, [id]: v }))

  // Stats
  const published = exams.filter((e) => e.status === 'published').length
  const drafts     = exams.filter((e) => e.status === 'draft').length
  const closed     = exams.filter((e) => e.status === 'closed').length
  const needsGrading = exams.filter(
    (e) => e.submission_count > e.graded_count && e.status !== 'draft'
  ).length

  async function handlePublish(exam: ExamItem) {
    if (exam.question_count === 0) {
      toast.error(isAr ? 'أضف أسئلة أولاً' : 'Add questions first')
      return
    }
    if (!confirm(isAr
      ? `نشر الاختبار "${exam.title}"؟ لن تتمكن من تعديله بعد النشر.`
      : `Publish "${exam.title}"? You won't be able to edit it after publishing.`
    )) return

    setLoad(exam.id, true)
    const res = await publishExamAction(exam.id)
    setLoad(exam.id, false)
    if (res?.error) toast.error(res.error)
    else { toast.success(isAr ? 'تم نشر الاختبار' : 'Exam published'); router.refresh() }
  }

  async function handleClose(exam: ExamItem) {
    if (!confirm(isAr ? `إغلاق الاختبار "${exam.title}"؟` : `Close "${exam.title}"?`)) return
    setLoad(exam.id, true)
    const res = await closeExamAction(exam.id)
    setLoad(exam.id, false)
    if (res?.error) toast.error(res.error)
    else { toast.success(isAr ? 'تم إغلاق الاختبار' : 'Exam closed'); router.refresh() }
  }

  async function handleDelete(exam: ExamItem) {
    if (!confirm(isAr ? `حذف الاختبار "${exam.title}"؟` : `Delete "${exam.title}"?`)) return
    setLoad(exam.id, true)
    const res = await deleteExamAction(exam.id)
    setLoad(exam.id, false)
    if (res?.error) toast.error(res.error)
    else { toast.success(isAr ? 'تم حذف الاختبار' : 'Exam deleted'); router.refresh() }
  }

  async function handlePublishResults(exam: ExamItem) {
    if (!confirm(isAr
      ? `نشر نتائج "${exam.title}" للطلاب؟`
      : `Publish results for "${exam.title}" to students?`
    )) return
    setLoad(exam.id + '_results', true)
    const res = await publishResultsAction(exam.id)
    setLoad(exam.id + '_results', false)
    if (res?.error) toast.error(res.error)
    else { toast.success(isAr ? `تم نشر النتائج (${res.count} طالب)` : `Results published (${res.count} students)`); router.refresh() }
  }

  const gradingExam = exams.find((e) => e.id === gradingExamId) || null

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAr ? 'الاختبارات' : 'Exams'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAr ? 'إنشاء وإدارة اختبارات الطلاب' : 'Create and manage student exams'}
          </p>
        </div>
        <button
          onClick={() => { setEditingExam(null); setBuilderOpen(true) }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          {isAr ? 'اختبار جديد' : 'New Exam'}
        </button>
      </div>

      {/* Needs grading alert */}
      {needsGrading > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {isAr
              ? `${needsGrading} اختبار${needsGrading > 1 ? 'ات' : ''} تحتاج إلى تصحيح يدوي`
              : `${needsGrading} exam${needsGrading > 1 ? 's' : ''} need manual grading`}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: isAr ? 'منشور' : 'Published', value: published, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: isAr ? 'مسودة' : 'Drafts',    value: drafts,     color: 'text-amber-600',   bg: 'bg-amber-500/10' },
          { label: isAr ? 'مغلق' : 'Closed',     value: closed,     color: 'text-muted-foreground', bg: 'bg-muted' },
          { label: isAr ? 'تحتاج تصحيح' : 'Need Grading', value: needsGrading, color: 'text-red-600', bg: 'bg-red-500/10' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam list */}
      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">
              {isAr ? 'لا توجد اختبارات بعد' : 'No exams yet'}
            </p>
            <button
              onClick={() => { setEditingExam(null); setBuilderOpen(true) }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              {isAr ? 'أنشئ اختباراً' : 'Create an exam'}
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{exam.title}</p>
                      <StatusBadge status={exam.status} isAr={isAr} />
                      {exam.results_published && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 text-xs">
                          <Share2 className="h-3 w-3" />
                          {isAr ? 'النتائج منشورة' : 'Results published'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" /> {exam.class_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {exam.question_count} {isAr ? 'سؤال' : 'questions'} · {exam.total_marks} {isAr ? 'درجة' : 'pts'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {exam.duration_minutes} {isAr ? 'دقيقة' : 'min'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {exam.submission_count} {isAr ? 'إجابات' : 'submissions'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(exam.start_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {/* Draft actions */}
                    {exam.status === 'draft' && (
                      <>
                        <button
                          onClick={() => { setEditingExam(exam); setBuilderOpen(true) }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handlePublish(exam)}
                          disabled={loading[exam.id]}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                        >
                          <Play className="h-3.5 w-3.5" /> {isAr ? 'نشر' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(exam)}
                          disabled={loading[exam.id]}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {/* Published actions */}
                    {exam.status === 'published' && (
                      <>
                        <button
                          onClick={() => setGradingExamId(exam.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                        >
                          <CheckSquare className="h-3.5 w-3.5" /> {isAr ? 'التصحيح' : 'Grade'}
                        </button>
                        <button
                          onClick={() => handleClose(exam)}
                          disabled={loading[exam.id]}
                          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 text-white px-3 py-1.5 text-xs hover:bg-amber-700 disabled:opacity-60 transition-colors"
                        >
                          <StopCircle className="h-3.5 w-3.5" /> {isAr ? 'إغلاق' : 'Close'}
                        </button>
                      </>
                    )}

                    {/* Closed actions */}
                    {exam.status === 'closed' && (
                      <>
                        <button
                          onClick={() => setGradingExamId(exam.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                        >
                          <CheckSquare className="h-3.5 w-3.5" /> {isAr ? 'التصحيح' : 'Grade'}
                        </button>
                        {!exam.results_published && (
                          <button
                            onClick={() => handlePublishResults(exam)}
                            disabled={loading[exam.id + '_results']}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white px-3 py-1.5 text-xs hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                          >
                            <Share2 className="h-3.5 w-3.5" /> {isAr ? 'نشر النتائج' : 'Publish Results'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exam Builder Dialog */}
      <ExamBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaved={() => router.refresh()}
        locale={locale}
        exam={editingExam}
        classes={classes}
        questions={questions}
      />

      {/* Grading Panel */}
      {gradingExam && (
        <GradingPanel
          open={!!gradingExamId}
          onClose={() => setGradingExamId(null)}
          locale={locale}
          exam={gradingExam}
        />
      )}
    </div>
  )
}
