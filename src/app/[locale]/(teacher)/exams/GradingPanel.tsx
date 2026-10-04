'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Clock, HelpCircle, AlignLeft, BookOpen, ToggleLeft, ChevronRight, ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { gradeAnswerAction } from './actions'
import type { ExamItem } from './ExamsClientView'

// ── Types ─────────────────────────────────────────────────────────────
interface Attempt {
  id: string
  student_name: string
  student_code: string
  status: string
  submitted_at: string | null
  score: number | null
  total: number | null
  percentage: number | null
  passed: boolean | null
  fully_graded: boolean
}

interface QuestionAnswer {
  question_id: string
  type: string
  body: string
  marks: number
  marks_awarded: number | null
  feedback: string | null
  selected_option_id: string | null
  text_answer: string | null
  options: { id: string; body: string; is_correct: boolean }[]
  model_answer: string | null
  explanation: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  locale: string
  exam: ExamItem
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: HelpCircle, true_false: ToggleLeft, short_answer: AlignLeft, essay: BookOpen,
}

export function GradingPanel({ open, onClose, locale, exam }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionAnswer[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAttempt, setLoadingAttempt] = useState(false)
  const [pendingGrades, setPendingGrades] = useState<Record<string, { marks: string; feedback: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (open && exam.id) {
      fetchAttempts()
    }
  }, [open, exam.id])

  async function fetchAttempts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/exam-attempts?examId=${exam.id}`)
      const data = await res.json()
      setAttempts(data.attempts || [])
    } catch (e) {
      toast.error('Failed to load attempts')
    }
    setLoading(false)
  }

  async function loadAttemptQuestions(attemptId: string) {
    setSelectedAttempt(attemptId)
    setLoadingAttempt(true)
    try {
      const res = await fetch(`/api/exam-review?attemptId=${attemptId}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      // Initialize pending grades
      const init: Record<string, { marks: string; feedback: string }> = {}
      ;(data.questions || []).forEach((q: QuestionAnswer) => {
        init[q.question_id] = {
          marks: q.marks_awarded !== null ? String(q.marks_awarded) : '',
          feedback: q.feedback || '',
        }
      })
      setPendingGrades(init)
    } catch (e) {
      toast.error('Failed to load answers')
    }
    setLoadingAttempt(false)
  }

  async function saveGrade(questionId: string) {
    if (!selectedAttempt) return
    const grade = pendingGrades[questionId]
    if (!grade) return
    const marks = parseFloat(grade.marks)
    if (isNaN(marks) || marks < 0) {
      toast.error(isAr ? 'درجة غير صالحة' : 'Invalid marks')
      return
    }
    setSavingId(questionId)
    const res = await gradeAnswerAction(selectedAttempt, questionId, marks, grade.feedback || undefined)
    setSavingId(null)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(isAr ? 'تم حفظ الدرجة' : 'Grade saved')
      // Refresh attempts list
      fetchAttempts()
      // Reload this attempt
      loadAttemptQuestions(selectedAttempt)
    }
  }

  if (!open) return null

  const selectedAttemptData = attempts.find((a) => a.id === selectedAttempt)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl bg-background border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold">
              {isAr ? 'التصحيح' : 'Grading'} — {exam.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {attempts.length} {isAr ? 'إجابة' : 'submissions'}
              {' · '}
              {exam.total_marks} {isAr ? 'درجة إجمالي' : 'total marks'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Attempts list */}
          <div className="w-64 shrink-0 border-e border-border overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent me-2" />
                {isAr ? 'جار التحميل...' : 'Loading...'}
              </div>
            ) : attempts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {isAr ? 'لا توجد إجابات بعد' : 'No submissions yet'}
              </div>
            ) : (
              attempts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => loadAttemptQuestions(a.id)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 text-start border-b border-border hover:bg-muted/50 transition-colors ${
                    selectedAttempt === a.id ? 'bg-primary/5 border-s-2 border-s-primary' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.student_name}</p>
                    <p className="text-xs text-muted-foreground">{a.student_code}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                        a.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                        a.status === 'submitted' || a.status === 'auto_submitted' ? 'bg-amber-100 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {a.status === 'graded' ? (isAr ? 'تم التصحيح' : 'Graded') :
                         a.status === 'submitted' ? (isAr ? 'مقدّم' : 'Submitted') :
                         a.status === 'auto_submitted' ? (isAr ? 'تلقائي' : 'Auto') :
                         a.status}
                      </span>
                      {a.score !== null && (
                        <span className="text-xs text-muted-foreground">
                          {a.score}/{a.total}
                          {a.passed !== null && (
                            <span className={a.passed ? ' text-emerald-600' : ' text-red-600'}>
                              {' '}{a.passed ? '✓' : '✗'}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </button>
              ))
            )}
          </div>

          {/* Answer review */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selectedAttempt ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{isAr ? 'اختر طالباً من القائمة' : 'Select a student from the list'}</p>
                </div>
              </div>
            ) : loadingAttempt ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent me-2" />
                {isAr ? 'جار التحميل...' : 'Loading answers...'}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Attempt header */}
                {selectedAttemptData && (
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedAttemptData.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedAttemptData.student_code}
                        {selectedAttemptData.submitted_at && (
                          <> · {isAr ? 'أُرسل' : 'Submitted'} {new Date(selectedAttemptData.submitted_at).toLocaleTimeString()}</>
                        )}
                      </p>
                    </div>
                    {selectedAttemptData.score !== null && (
                      <div className="text-end">
                        <p className="text-lg font-bold">
                          {selectedAttemptData.score}/{selectedAttemptData.total}
                        </p>
                        <p className="text-xs text-muted-foreground">{selectedAttemptData.percentage}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Questions */}
                {questions.map((q, i) => {
                  const Icon = TYPE_ICONS[q.type] || HelpCircle
                  const needsManual = (q.type === 'essay' || q.type === 'short_answer') && q.marks_awarded === null
                  const pending = pendingGrades[q.question_id] || { marks: '', feedback: '' }

                  return (
                    <div key={q.question_id} className={`rounded-lg border p-4 space-y-3 ${needsManual ? 'border-amber-300 dark:border-amber-700' : 'border-border'}`}>
                      {/* Question header */}
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground font-mono w-6 shrink-0 pt-0.5">{i + 1}.</span>
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.body}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {q.marks_awarded !== null ? q.marks_awarded : '—'}/{q.marks} {isAr ? 'د' : 'pt'}
                        </Badge>
                      </div>

                      {/* MCQ answer */}
                      {(q.type === 'mcq' || q.type === 'true_false') && (
                        <div className="ms-8 space-y-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-sm ${
                                opt.is_correct
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : opt.id === q.selected_option_id && !opt.is_correct
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {opt.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                              {opt.id === q.selected_option_id && !opt.is_correct && (
                                <span className="h-3.5 w-3.5 shrink-0 text-red-500">✗</span>
                              )}
                              {opt.id === q.selected_option_id && opt.is_correct && null}
                              <span className={opt.id === q.selected_option_id ? 'font-medium' : ''}>{opt.body}</span>
                              {opt.id === q.selected_option_id && <span className="text-xs ms-auto">{isAr ? '← اختار الطالب' : '← Student'}</span>}
                            </div>
                          ))}
                          {!q.selected_option_id && (
                            <p className="text-xs text-muted-foreground italic ms-2">
                              {isAr ? 'لم يختر إجابة' : 'No answer selected'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Text answer */}
                      {(q.type === 'short_answer' || q.type === 'essay') && (
                        <div className="ms-8 space-y-2">
                          <div className="rounded border border-border bg-muted/20 px-3 py-2 text-sm">
                            {q.text_answer || <em className="text-muted-foreground">{isAr ? 'لا توجد إجابة' : 'No answer'}</em>}
                          </div>
                          {q.model_answer && (
                            <div className="rounded border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2">
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                                {isAr ? 'نموذج الإجابة' : 'Model Answer'}
                              </p>
                              <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.model_answer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual grading input */}
                      {(q.type === 'essay' || q.type === 'short_answer') && (
                        <div className="ms-8 border-t border-border pt-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="space-y-1 flex-1">
                              <label className="text-xs font-medium">{isAr ? 'التعليق (اختياري)' : 'Feedback (optional)'}</label>
                              <input
                                type="text"
                                value={pending.feedback}
                                onChange={(e) => setPendingGrades((p) => ({ ...p, [q.question_id]: { ...p[q.question_id], feedback: e.target.value } }))}
                                placeholder={isAr ? 'تعليق للطالب...' : 'Comment for student...'}
                                className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1 w-24">
                              <label className="text-xs font-medium">
                                {isAr ? `الدرجة / ${q.marks}` : `Marks / ${q.marks}`}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={q.marks}
                                step={0.5}
                                value={pending.marks}
                                onChange={(e) => setPendingGrades((p) => ({ ...p, [q.question_id]: { ...p[q.question_id], marks: e.target.value } }))}
                                className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="pt-5">
                              <button
                                onClick={() => saveGrade(q.question_id)}
                                disabled={savingId === q.question_id}
                                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5"
                              >
                                {savingId === q.question_id
                                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                  : <CheckCircle2 className="h-3.5 w-3.5" />}
                                {isAr ? 'حفظ' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="ms-8 rounded border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 px-3 py-2">
                          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1">
                            {isAr ? 'الشرح' : 'Explanation'}
                          </p>
                          <p className="text-xs text-indigo-800 dark:text-indigo-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
