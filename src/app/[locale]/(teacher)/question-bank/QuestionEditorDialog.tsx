'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { createQuestionAction, updateQuestionAction } from '../exams/actions'

type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay'

interface Option {
  body: string
  is_correct: boolean
}

interface ExistingQuestion {
  id: string
  type: QuestionType
  body: string
  explanation?: string
  default_marks: number
  subject?: string
  tags?: string[]
  options?: { id: string; body: string; is_correct: boolean }[]
  accepted_answers?: string[]
  model_answer?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  locale: string
  question?: ExistingQuestion | null
}

const TYPE_LABELS: Record<QuestionType, { en: string; ar: string }> = {
  mcq:          { en: 'Multiple Choice (MCQ)', ar: 'اختيار متعدد' },
  true_false:   { en: 'True / False', ar: 'صح / خطأ' },
  short_answer: { en: 'Short Answer', ar: 'إجابة قصيرة' },
  essay:        { en: 'Essay', ar: 'مقال' },
}

export function QuestionEditorDialog({ open, onClose, onSaved, locale, question }: Props) {
  const isAr = locale === 'ar'
  const isEdit = !!question

  const [type, setType] = useState<QuestionType>('mcq')
  const [body, setBody] = useState('')
  const [explanation, setExplanation] = useState('')
  const [marks, setMarks] = useState(1)
  const [subject, setSubject] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [options, setOptions] = useState<Option[]>([
    { body: '', is_correct: false },
    { body: '', is_correct: false },
  ])
  const [acceptedAnswers, setAcceptedAnswers] = useState('')
  const [modelAnswer, setModelAnswer] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill for edit
  useEffect(() => {
    if (open && question) {
      setType(question.type)
      setBody(question.body)
      setExplanation(question.explanation || '')
      setMarks(question.default_marks)
      setSubject(question.subject || '')
      setTagsInput((question.tags || []).join(', '))
      setModelAnswer(question.model_answer || '')
      setAcceptedAnswers((question.accepted_answers || []).join('\n'))
      if (question.options && question.options.length > 0) {
        setOptions(question.options.map((o) => ({ body: o.body, is_correct: o.is_correct })))
      } else {
        setOptions([{ body: '', is_correct: false }, { body: '', is_correct: false }])
      }
    } else if (open && !question) {
      // Reset for new
      setType('mcq')
      setBody('')
      setExplanation('')
      setMarks(1)
      setSubject('')
      setTagsInput('')
      setOptions([{ body: '', is_correct: false }, { body: '', is_correct: false }])
      setAcceptedAnswers('')
      setModelAnswer('')
    }
  }, [open, question])

  // When type changes to true_false, reset to 2 canonical options
  useEffect(() => {
    if (type === 'true_false') {
      setOptions([
        { body: isAr ? 'صح' : 'True', is_correct: true },
        { body: isAr ? 'خطأ' : 'False', is_correct: false },
      ])
    }
  }, [type])

  function addOption() {
    setOptions((prev) => [...prev, { body: '', is_correct: false }])
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  function setCorrect(i: number) {
    setOptions((prev) => prev.map((o, idx) => ({ ...o, is_correct: idx === i })))
  }

  async function handleSave() {
    if (!body.trim()) { toast.error(isAr ? 'السؤال مطلوب' : 'Question body is required'); return }
    if ((type === 'mcq') && options.filter((o) => o.body.trim()).length < 2) {
      toast.error(isAr ? 'أضف خيارين على الأقل' : 'Add at least 2 options'); return
    }
    if ((type === 'mcq' || type === 'true_false') && !options.some((o) => o.is_correct)) {
      toast.error(isAr ? 'حدد الإجابة الصحيحة' : 'Mark the correct answer'); return
    }

    setSaving(true)
    const payload = {
      type,
      body: body.trim(),
      explanation: explanation.trim() || undefined,
      default_marks: marks,
      subject: subject.trim() || undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      options: ['mcq', 'true_false'].includes(type)
        ? options.filter((o) => o.body.trim())
        : undefined,
      accepted_answers: type === 'short_answer'
        ? acceptedAnswers.split('\n').map((a) => a.trim()).filter(Boolean)
        : undefined,
      model_answer: ['short_answer', 'essay'].includes(type) ? modelAnswer.trim() || undefined : undefined,
    }

    const res = isEdit
      ? await updateQuestionAction(question!.id, payload)
      : await createQuestionAction(payload)

    setSaving(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(isEdit
        ? (isAr ? 'تم تحديث السؤال' : 'Question updated')
        : (isAr ? 'تم إضافة السؤال' : 'Question added'))
      onSaved()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-background z-10">
          <h2 className="text-base font-semibold">
            {isEdit ? (isAr ? 'تعديل السؤال' : 'Edit Question') : (isAr ? 'سؤال جديد' : 'New Question')}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isAr ? 'نوع السؤال' : 'Question Type'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['mcq', 'true_false', 'short_answer', 'essay'] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={isEdit}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {TYPE_LABELS[t][isAr ? 'ar' : 'en']}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isAr ? 'نص السؤال' : 'Question'} <span className="text-destructive">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={isAr ? 'اكتب نص السؤال...' : 'Write the question text...'}
            />
          </div>

          {/* Options (MCQ / True-False) */}
          {(type === 'mcq' || type === 'true_false') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isAr ? 'الخيارات (حدد الصحيح)' : 'Options (mark the correct one)'}
              </label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    disabled={type === 'true_false'}
                    className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      opt.is_correct
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border hover:border-emerald-400'
                    } disabled:cursor-default`}
                    title={isAr ? 'الإجابة الصحيحة' : 'Correct answer'}
                  >
                    {opt.is_correct && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                  <input
                    type="text"
                    value={opt.body}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, body: e.target.value } : o))}
                    disabled={type === 'true_false'}
                    placeholder={`${isAr ? 'خيار' : 'Option'} ${i + 1}`}
                    className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                  />
                  {type === 'mcq' && options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {type === 'mcq' && options.length < 6 && (
                <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                  <Plus className="h-3.5 w-3.5" />
                  {isAr ? 'إضافة خيار' : 'Add option'}
                </button>
              )}
            </div>
          )}

          {/* Accepted answers (short_answer) */}
          {type === 'short_answer' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? 'الإجابات المقبولة (كل إجابة في سطر)' : 'Accepted Answers (one per line, for auto-grading)'}
              </label>
              <textarea
                value={acceptedAnswers}
                onChange={(e) => setAcceptedAnswers(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isAr ? 'الإجابة الأولى\nالإجابة الثانية...' : 'Answer one\nAnswer two...'}
              />
              <p className="text-xs text-muted-foreground">{isAr ? 'المطابقة غير حساسة لحالة الأحرف' : 'Matching is case-insensitive'}</p>
            </div>
          )}

          {/* Model answer (short_answer / essay) */}
          {(type === 'short_answer' || type === 'essay') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isAr ? 'نموذج الإجابة (للمراجعة)' : 'Model Answer (shown to teacher when grading)'}
              </label>
              <textarea
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isAr ? 'نموذج الإجابة...' : 'Model answer...'}
              />
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {isAr ? 'شرح الإجابة (اختياري — يُعرض للطالب بعد الاختبار)' : 'Explanation (optional — shown to student in review)'}
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={isAr ? 'اشرح الإجابة الصحيحة...' : 'Explain the correct answer...'}
            />
          </div>

          {/* Marks + Subject + Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? 'الدرجة' : 'Marks'}</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={marks}
                onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? 'المادة' : 'Subject'}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isAr ? 'مثال: رياضيات' : 'e.g., Math'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isAr ? 'الوسوم (فاصلة)' : 'Tags (comma-sep)'}</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={isAr ? 'وسم1, وسم2' : 'tag1, tag2'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4 sticky bottom-0 bg-background">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center gap-2"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
            {saving ? (isAr ? 'جار الحفظ...' : 'Saving...') : (isAr ? 'حفظ السؤال' : 'Save Question')}
          </button>
        </div>
      </div>
    </div>
  )
}
