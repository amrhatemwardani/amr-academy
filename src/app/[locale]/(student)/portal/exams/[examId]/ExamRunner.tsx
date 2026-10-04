'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Clock, CheckCircle2, AlertCircle, Bookmark, Flag, ChevronLeft, ChevronRight,
  Send, HelpCircle, ToggleLeft, AlignLeft, BookOpen, AlertTriangle, WifiOff, Cloud
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { saveAnswersAction, submitAttemptAction } from './actions'

interface Option {
  id: string
  body: string
  position: number
}

interface Question {
  question_id: string
  position: number
  marks: number
  type: 'mcq' | 'true_false' | 'short_answer' | 'essay'
  body: string
  options: Option[] | null
  selected_option_id: string | null
  text_answer: string | null
}

interface Props {
  locale: string
  exam: {
    id: string
    title: string
    description?: string | null
    instructions?: string | null
    duration_minutes: number
    pass_marks: number
    class_name?: string
  }
  attempt: {
    id: string
    expires_at: string
    status: string
  }
  initialQuestions: Question[]
}

export function ExamRunner({ locale, exam, attempt, initialQuestions }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  // State
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [answers, setAnswers] = useState<Record<string, { selected_option_id: string | null; text_answer: string | null }>>(() => {
    const init: Record<string, { selected_option_id: string | null; text_answer: string | null }> = {}
    initialQuestions.forEach((q) => {
      init[q.question_id] = {
        selected_option_id: q.selected_option_id,
        text_answer: q.text_answer,
      }
    })
    return init
  })

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expires = new Date(attempt.expires_at).getTime()
    const now = Date.now()
    return Math.max(0, Math.floor((expires - now) / 1000))
  })

  // Dirty tracker for debounced auto-save
  const dirtyRef = useRef<boolean>(false)
  const answersRef = useRef(answers)
  answersRef.current = answers

  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save answers to server
  const persistAnswers = useCallback(async () => {
    if (!dirtyRef.current || isSubmitting) return

    setSaveStatus('saving')
    const current = answersRef.current
    const payload = Object.entries(current).map(([qId, ans]) => ({
      question_id: qId,
      selected_option_id: ans.selected_option_id,
      text_answer: ans.text_answer,
    }))

    try {
      const res = await saveAnswersAction(attempt.id, payload)
      if (res?.error) {
        setSaveStatus('error')
      } else {
        dirtyRef.current = false
        setSaveStatus('saved')
      }
    } catch {
      setSaveStatus('error')
    }
  }, [attempt.id, isSubmitting])

  // Periodic autosave every 10 seconds if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        persistAnswers()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [persistAnswers])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Auto-submit when time expires
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    toast.info(isAr ? 'انتهى الوقت! جارِ تسليم الاختبار تلقائياً...' : "Time's up! Auto-submitting exam...")

    // Persist final answers
    const current = answersRef.current
    const payload = Object.entries(current).map(([qId, ans]) => ({
      question_id: qId,
      selected_option_id: ans.selected_option_id,
      text_answer: ans.text_answer,
    }))
    try {
      await saveAnswersAction(attempt.id, payload)
    } catch {
      // proceed anyway
    }

    const res = await submitAttemptAction(attempt.id)
    if (res?.error) {
      toast.error(res.error)
      setIsSubmitting(false)
    } else {
      toast.success(isAr ? 'تم تسليم الاختبار بنجاح' : 'Exam submitted successfully')
      router.push(`/${locale}/portal/exams`)
      router.refresh()
    }
  }, [attempt.id, isAr, isSubmitting, locale, router])

  // Manual submit
  async function handleFinalSubmit() {
    setIsSubmitting(true)
    setShowConfirmModal(false)

    // Persist latest answers first
    const current = answersRef.current
    const payload = Object.entries(current).map(([qId, ans]) => ({
      question_id: qId,
      selected_option_id: ans.selected_option_id,
      text_answer: ans.text_answer,
    }))
    await saveAnswersAction(attempt.id, payload)

    const res = await submitAttemptAction(attempt.id)
    if (res?.error) {
      toast.error(res.error)
      setIsSubmitting(false)
    } else {
      toast.success(isAr ? 'تم تسليم الاختبار بنجاح' : 'Exam submitted successfully')
      router.push(`/${locale}/portal/exams`)
      router.refresh()
    }
  }

  // Answer handlers
  function handleSelectOption(questionId: string, optionId: string) {
    dirtyRef.current = true
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selected_option_id: optionId,
      },
    }))
  }

  function handleTextChange(questionId: string, text: string) {
    dirtyRef.current = true
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text_answer: text,
      },
    }))
  }

  function toggleFlag(questionId: string) {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  // Format timer
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const currentQ = questions[currentIndex]
  const currentAnswer = currentQ ? answers[currentQ.question_id] : null
  const isAnswered = (qId: string) => {
    const a = answers[qId]
    if (!a) return false
    return !!a.selected_option_id || (!!a.text_answer && a.text_answer.trim().length > 0)
  }

  const answeredCount = questions.filter((q) => isAnswered(q.question_id)).length
  const totalCount = questions.length
  const isUrgent = timeLeft < 300 // under 5 min

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Bar: Title, Timer & Save Indicator ──────────────────────── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border border-border rounded-xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-base sm:text-lg truncate">{exam.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{exam.class_name || (isAr ? 'اختبار' : 'Exam')}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              {!isOnline ? (
                <span className="text-red-500 flex items-center gap-1 font-medium">
                  <WifiOff className="h-3 w-3" /> {isAr ? 'غير متصل' : 'Offline'}
                </span>
              ) : saveStatus === 'saving' ? (
                <span className="text-amber-500 flex items-center gap-1">
                  <Cloud className="h-3 w-3 animate-pulse" /> {isAr ? 'جارِ الحفظ...' : 'Saving...'}
                </span>
              ) : saveStatus === 'error' ? (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {isAr ? 'خطأ في الحفظ' : 'Save error'}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {isAr ? 'تم الحفظ' : 'Saved'}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm sm:text-base font-bold transition-colors ${
              isUrgent
                ? 'bg-red-500/10 border-red-500 text-red-600 animate-pulse'
                : 'bg-muted/50 border-border text-foreground'
            }`}
          >
            <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isAr ? 'تسليم' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* ── Question Navigation Strip ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              {isAr
                ? `تمت الإجابة: ${answeredCount} من ${totalCount}`
                : `Answered: ${answeredCount} of ${totalCount}`}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> {isAr ? 'مُجاب' : 'Answered'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> {isAr ? 'مُعلّم' : 'Flagged'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {questions.map((q, idx) => {
              const answered = isAnswered(q.question_id)
              const isCurrent = idx === currentIndex
              const isFlag = !!flagged[q.question_id]

              return (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 h-8 w-8 rounded-lg text-xs font-semibold transition-all border ${
                    isCurrent
                      ? 'ring-2 ring-primary ring-offset-2 border-primary'
                      : 'border-border'
                  } ${
                    answered
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-foreground hover:bg-muted'
                  }`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-background" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Active Question Card ────────────────────────────────────────── */}
      {currentQ && (
        <Card className="shadow-md">
          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Header of Question */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {currentIndex + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-medium text-muted-foreground">
                      {currentQ.type === 'mcq' && (isAr ? 'اختيار من متعدد' : 'Multiple Choice')}
                      {currentQ.type === 'true_false' && (isAr ? 'صح أم خطأ' : 'True / False')}
                      {currentQ.type === 'short_answer' && (isAr ? 'إجابة قصيرة' : 'Short Answer')}
                      {currentQ.type === 'essay' && (isAr ? 'سؤال مقالي' : 'Essay')}
                    </span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {currentQ.marks} {isAr ? 'درجات' : 'pts'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Flag / Bookmark */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.question_id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  flagged[currentQ.question_id]
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{flagged[currentQ.question_id] ? (isAr ? 'مُعلّم' : 'Flagged') : (isAr ? 'تعليم' : 'Flag')}</span>
              </button>
            </div>

            {/* Question Body */}
            <div className="text-base sm:text-lg font-medium leading-relaxed whitespace-pre-wrap">
              {currentQ.body}
            </div>

            {/* MCQ Options */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = currentAnswer?.selected_option_id === opt.id
                  const letter = String.fromCharCode(65 + oIdx) // A, B, C, D

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.question_id, opt.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border hover:bg-muted/50 hover:border-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-sm sm:text-base font-normal text-foreground">
                        {opt.body}
                      </span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* True / False */}
            {currentQ.type === 'true_false' && currentQ.options && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAnswer?.selected_option_id === opt.id
                  const isTrue = opt.body.toLowerCase().includes('true') || opt.body.includes('صح')

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.question_id, opt.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border font-bold text-base transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary'
                          : 'border-border hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <span className="text-xl">{isTrue ? '✓' : '✗'}</span>
                      <span>{opt.body}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQ.type === 'short_answer' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {isAr ? 'اكتب إجابتك هنا:' : 'Type your answer here:'}
                </label>
                <input
                  type="text"
                  value={currentAnswer?.text_answer || ''}
                  onChange={(e) => handleTextChange(currentQ.question_id, e.target.value)}
                  placeholder={isAr ? 'إجابتك...' : 'Your answer...'}
                  className="w-full h-11 rounded-lg border border-input bg-transparent px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* Essay */}
            {currentQ.type === 'essay' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {isAr ? 'اكتب مقالك أو خطوات الحل بالتفصيل:' : 'Write your essay or detailed response:'}
                </label>
                <textarea
                  rows={6}
                  value={currentAnswer?.text_answer || ''}
                  onChange={(e) => handleTextChange(currentQ.question_id, e.target.value)}
                  placeholder={isAr ? 'اكتب هنا...' : 'Type here...'}
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>
            )}

            {/* ── Question Navigation Buttons ────────────────────────────── */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors"
              >
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>

              {currentIndex < totalCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span>{isAr ? 'التالي' : 'Next'}</span>
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>{isAr ? 'مراجعة وتسليم' : 'Review & Submit'}</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Submission Confirmation Modal ─────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-background border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{isAr ? 'تأكيد تسليم الاختبار' : 'Submit Exam'}</h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'لن تتمكن من تعديل إجاباتك بعد التسليم.' : 'You will not be able to edit your answers after submitting.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 border border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? 'الأسئلة المُجابة:' : 'Answered questions:'}</span>
                <span className="font-bold text-emerald-600">
                  {answeredCount} / {totalCount}
                </span>
              </div>
              {answeredCount < totalCount && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium pt-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    {isAr
                      ? `لديك ${totalCount - answeredCount} سؤال بدون إجابة!`
                      : `You have ${totalCount - answeredCount} unanswered questions!`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {isAr ? 'متابعة الحل' : 'Continue Exam'}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
              >
                {isSubmitting && <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />}
                <span>{isAr ? 'نعم، قم بالتسليم' : 'Yes, Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
