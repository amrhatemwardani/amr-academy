'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { X, Search, Plus, Trash2, GripVertical, HelpCircle, AlignLeft, BookOpen, ToggleLeft } from 'lucide-react'
import type { ExamItem, ClassOption, QuestionOption } from './ExamsClientView'
import { createExamAction, updateExamAction } from './actions'

interface SelectedQuestion {
  question_id: string
  position: number
  marks: number
  body: string
  type: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  locale: string
  exam: ExamItem | null
  classes: ClassOption[]
  questions: QuestionOption[]
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: HelpCircle, true_false: ToggleLeft, short_answer: AlignLeft, essay: BookOpen,
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ExamBuilderDialog({ open, onClose, onSaved, locale, exam, classes, questions }: Props) {
  const isAr = locale === 'ar'
  const isEdit = !!exam

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [classId, setClassId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [passMarks, setPassMarks] = useState(0)
  const [shuffleQ, setShuffleQ] = useState(false)
  const [shuffleO, setShuffleO] = useState(false)
  const [selected, setSelected] = useState<SelectedQuestion[]>([])
  const [qSearch, setQSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill for edit
  useEffect(() => {
    if (open && exam) {
      setTitle(exam.title)
      setDescription(exam.description || '')
      setInstructions('')
      setClassId(exam.class_id)
      setDurationMinutes(exam.duration_minutes)
      setStartAt(toDatetimeLocal(exam.start_at))
      setEndAt(toDatetimeLocal(exam.end_at))
      setPassMarks(exam.pass_marks)
      setShuffleQ(exam.shuffle_questions)
      setShuffleO(exam.shuffle_options)
      // Build selected from exam.questions + question details
      const sel: SelectedQuestion[] = exam.questions.map((eq) => {
        const q = questions.find((qq) => qq.id === eq.question_id)
        return {
          question_id: eq.question_id,
          position: eq.position,
          marks: eq.marks,
          body: q?.body || '(question)',
          type: q?.type || 'mcq',
        }
      })
      setSelected(sel)
    } else if (open && !exam) {
      setTitle(''); setDescription(''); setInstructions('')
      setClassId(classes[0]?.id || '')
      setDurationMinutes(60); setStartAt(''); setEndAt(''); setPassMarks(0)
      setShuffleQ(false); setShuffleO(false); setSelected([])
    }
  }, [open, exam])

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.question_id)), [selected])
  const totalMarks = useMemo(() => selected.reduce((sum, q) => sum + q.marks, 0), [selected])

  const filteredQ = useMemo(() => {
    const s = qSearch.toLowerCase()
    return questions.filter(
      (q) =>
        !selectedIds.has(q.id) &&
        (!s || q.body.toLowerCase().includes(s) || (q.subject || '').toLowerCase().includes(s))
    )
  }, [questions, selectedIds, qSearch])

  function addQuestion(q: QuestionOption) {
    setSelected((prev) => [
      ...prev,
      { question_id: q.id, position: prev.length + 1, marks: q.default_marks, body: q.body, type: q.type },
    ])
  }

  function removeQuestion(id: string) {
    setSelected((prev) => {
      const next = prev.filter((q) => q.question_id !== id)
      return next.map((q, i) => ({ ...q, position: i + 1 }))
    })
  }

  function updateMarks(id: string, marks: number) {
    setSelected((prev) => prev.map((q) => q.question_id === id ? { ...q, marks } : q))
  }

  async function handleSave() {
    if (!title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title required'); return }
    if (!classId)       { toast.error(isAr ? 'اختر الفصل' : 'Select a class'); return }
    if (!startAt)       { toast.error(isAr ? 'وقت البداية مطلوب' : 'Start time required'); return }
    if (!endAt)         { toast.error(isAr ? 'وقت النهاية مطلوب' : 'End time required'); return }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error(isAr ? 'وقت النهاية يجب أن يكون بعد البداية' : 'End must be after start'); return
    }
    if (selected.length === 0) { toast.error(isAr ? 'أضف سؤالاً على الأقل' : 'Add at least one question'); return }

    setSaving(true)
    const payload = {
      class_id: classId,
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      duration_minutes: durationMinutes,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      pass_marks: passMarks,
      shuffle_questions: shuffleQ,
      shuffle_options: shuffleO,
      questions: selected.map((q) => ({
        question_id: q.question_id,
        position: q.position,
        marks: q.marks,
      })),
    }

    const res = isEdit
      ? await updateExamAction(exam!.id, payload)
      : await createExamAction(payload)

    setSaving(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(isEdit
        ? (isAr ? 'تم تحديث الاختبار' : 'Exam updated')
        : (isAr ? 'تم إنشاء الاختبار' : 'Exam created'))
      onSaved()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-background border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold">
            {isEdit ? (isAr ? 'تعديل الاختبار' : 'Edit Exam') : (isAr ? 'اختبار جديد' : 'New Exam')}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Settings */}
          <div className="w-80 shrink-0 border-e border-border overflow-y-auto p-5 space-y-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              {isAr ? 'إعدادات الاختبار' : 'Exam Settings'}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'العنوان *' : 'Title *'}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'الفصل *' : 'Class *'}</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full h-8 rounded border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                <input
                  type="number" min={1} max={600}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{isAr ? 'درجة النجاح' : 'Pass Marks'}</label>
                <input
                  type="number" min={0}
                  value={passMarks}
                  onChange={(e) => setPassMarks(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'البداية *' : 'Start At *'}</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'النهاية *' : 'End At *'}</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full h-8 rounded border border-input bg-transparent px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'وصف (اختياري)' : 'Description (optional)'}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded border border-input bg-transparent px-2.5 py-1.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{isAr ? 'التعليمات (اختياري)' : 'Instructions (optional)'}</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                className="w-full rounded border border-input bg-transparent px-2.5 py-1.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              {[
                { key: 'shuffleQ', label: isAr ? 'ترتيب عشوائي للأسئلة' : 'Shuffle Questions', val: shuffleQ, set: setShuffleQ },
                { key: 'shuffleO', label: isAr ? 'ترتيب عشوائي للخيارات' : 'Shuffle Options',   val: shuffleO, set: setShuffleO },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.val}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Right panel: Question picker + selected */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Selected questions */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  {isAr ? `الأسئلة المختارة (${selected.length})` : `Selected Questions (${selected.length})`}
                </p>
                <span className="text-xs text-muted-foreground">
                  {isAr ? `إجمالي الدرجات: ${totalMarks}` : `Total: ${totalMarks} pts`}
                </span>
              </div>
              {selected.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  {isAr ? 'اختر أسئلة من القائمة أدناه' : 'Pick questions from the list below'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {selected.map((sq, i) => {
                    const Icon = TYPE_ICONS[sq.type] || HelpCircle
                    return (
                      <div key={sq.question_id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
                        <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="flex-1 text-xs truncate">{sq.body}</p>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={sq.marks}
                          onChange={(e) => updateMarks(sq.question_id, parseFloat(e.target.value) || 1)}
                          className="w-14 h-6 rounded border border-input bg-transparent px-1.5 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">{isAr ? 'درجة' : 'pt'}</span>
                        <button
                          onClick={() => removeQuestion(sq.question_id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Question picker */}
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  {isAr ? 'بنك الأسئلة' : 'Question Bank'}
                </p>
              </div>
              <div className="relative mb-3">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  placeholder={isAr ? 'بحث في الأسئلة...' : 'Search questions...'}
                  className="w-full h-8 rounded border border-input bg-transparent ps-8 pe-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              {questions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {isAr ? 'بنك الأسئلة فارغ — أضف أسئلة أولاً من صفحة بنك الأسئلة' : 'Question bank is empty — add questions first'}
                </p>
              ) : (
                <div className="overflow-y-auto space-y-1.5 flex-1">
                  {filteredQ.map((q) => {
                    const Icon = TYPE_ICONS[q.type] || HelpCircle
                    return (
                      <button
                        key={q.id}
                        onClick={() => addQuestion(q)}
                        className="w-full flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-start hover:bg-muted/50 transition-colors group"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="flex-1 text-xs leading-snug truncate">{q.body}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {q.default_marks} {isAr ? 'د' : 'pt'}
                        </span>
                        <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                      </button>
                    )
                  })}
                  {filteredQ.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-6">
                      {isAr ? 'لا توجد أسئلة متبقية' : 'No more questions available'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center gap-2"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
            {saving
              ? (isAr ? 'جار الحفظ...' : 'Saving...')
              : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}
          </button>
        </div>
      </div>
    </div>
  )
}
