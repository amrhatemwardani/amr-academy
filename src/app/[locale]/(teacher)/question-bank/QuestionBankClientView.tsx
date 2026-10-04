'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, Search, Layers, CheckCircle2, HelpCircle, AlignLeft,
  BookOpen, ToggleLeft, Pencil, Trash2, Lock, Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionEditorDialog } from './QuestionEditorDialog'
import { deleteQuestionAction } from './actions'

// ── Types ─────────────────────────────────────────────────────────────
export interface QuestionItem {
  id: string
  type: 'mcq' | 'true_false' | 'short_answer' | 'essay'
  body: string
  explanation?: string
  default_marks: number
  subject?: string
  tags: string[]
  is_locked: boolean
  options: { id: string; body: string; is_correct: boolean }[]
  accepted_answers: string[]
  model_answer: string
}

interface Props {
  locale: string
  questions: QuestionItem[]
}

// ── Constants ─────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: HelpCircle,
  true_false: ToggleLeft,
  short_answer: AlignLeft,
  essay: BookOpen,
}

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-indigo-500/10 text-indigo-600',
  true_false: 'bg-emerald-500/10 text-emerald-600',
  short_answer: 'bg-amber-500/10 text-amber-600',
  essay: 'bg-pink-500/10 text-pink-600',
}

export function QuestionBankClientView({ locale, questions: initialQuestions }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const TYPE_LABELS: Record<string, string> = {
    mcq:          isAr ? 'اختيار متعدد' : 'MCQ',
    true_false:   isAr ? 'صح/خطأ' : 'T/F',
    short_answer: isAr ? 'قصيرة' : 'Short',
    essay:        isAr ? 'مقال' : 'Essay',
  }

  const filtered = useMemo(() => {
    return initialQuestions.filter((q) => {
      const matchSearch = !search || q.body.toLowerCase().includes(search.toLowerCase()) ||
        (q.subject || '').toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchType = typeFilter === 'all' || q.type === typeFilter
      return matchSearch && matchType
    })
  }, [initialQuestions, search, typeFilter])

  // Count by type
  const typeCounts: Record<string, number> = { mcq: 0, true_false: 0, short_answer: 0, essay: 0 }
  initialQuestions.forEach((q) => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1 })

  function openAdd() {
    setEditingQuestion(null)
    setEditorOpen(true)
  }

  function openEdit(q: QuestionItem) {
    if (q.is_locked) {
      toast.error(isAr
        ? 'هذا السؤال مستخدم في اختبار منشور ولا يمكن تعديله'
        : 'This question is used in a published exam and cannot be edited')
      return
    }
    setEditingQuestion(q)
    setEditorOpen(true)
  }

  function handleDelete(q: QuestionItem) {
    if (q.is_locked) {
      toast.error(isAr ? 'لا يمكن حذف سؤال مستخدم في اختبار' : 'Cannot delete a question used in an exam')
      return
    }
    if (!confirm(isAr ? `حذف السؤال؟` : `Delete this question?`)) return
    setDeletingId(q.id)
    startTransition(async () => {
      const res = await deleteQuestionAction(q.id)
      setDeletingId(null)
      if (res?.error) toast.error(res.error)
      else {
        toast.success(isAr ? 'تم حذف السؤال' : 'Question deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            {isAr ? 'بنك الأسئلة' : 'Question Bank'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAr ? `${initialQuestions.length} سؤال` : `${initialQuestions.length} questions`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          {isAr ? 'سؤال جديد' : 'New Question'}
        </button>
      </div>

      {/* Type stat pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            typeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
          }`}
        >
          {isAr ? 'الكل' : 'All'} ({initialQuestions.length})
        </button>
        {(['mcq', 'true_false', 'short_answer', 'essay'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              typeFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
            }`}
          >
            {TYPE_LABELS[t]} ({typeCounts[t]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? 'بحث بالنص أو المادة أو الوسوم...' : 'Search by text, subject, or tags...'}
          className="w-full rounded-md border border-input bg-transparent ps-9 pe-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">
              {initialQuestions.length === 0
                ? (isAr ? 'بنك الأسئلة فارغ' : 'No questions yet')
                : (isAr ? 'لا توجد نتائج' : 'No results found')}
            </p>
            {initialQuestions.length === 0 && (
              <button
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                {isAr ? 'أضف أول سؤال' : 'Add first question'}
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((q, i) => {
                const Icon = TYPE_ICONS[q.type] || HelpCircle
                return (
                  <div key={q.id} className="flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors group">
                    <span className="text-xs text-muted-foreground font-mono w-6 pt-1 shrink-0">
                      {i + 1}
                    </span>
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLORS[q.type] || ''}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{q.body}</p>

                      {/* MCQ options */}
                      {q.type === 'mcq' && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {q.options.map((opt) => (
                            <span
                              key={opt.id}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs border ${
                                opt.is_correct
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : 'border-border text-muted-foreground'
                              }`}
                            >
                              {opt.is_correct && <CheckCircle2 className="h-3 w-3" />}
                              {opt.body}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* True/False answer */}
                      {q.type === 'true_false' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {isAr ? 'الإجابة: ' : 'Answer: '}
                          <span className="font-medium text-emerald-600">
                            {q.options.find((o) => o.is_correct)?.body || '—'}
                          </span>
                        </p>
                      )}

                      {/* Accepted answers (short_answer) */}
                      {q.type === 'short_answer' && q.accepted_answers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {isAr ? 'الإجابات المقبولة: ' : 'Accepted: '}
                          <span className="font-medium text-foreground">
                            {q.accepted_answers.slice(0, 3).join(' / ')}
                            {q.accepted_answers.length > 3 && ` +${q.accepted_answers.length - 3}`}
                          </span>
                        </p>
                      )}

                      {/* Tags + Subject */}
                      {(q.subject || q.tags.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {q.subject && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{q.subject}</span>
                          )}
                          {q.tags.map((tag) => (
                            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right side: marks + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">
                        {q.default_marks} {isAr ? 'درجة' : 'pt'}
                      </Badge>
                      {q.is_locked && (
                        <span title={isAr ? 'مقفل' : 'Locked'}>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(q)}
                          className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          disabled={deletingId === q.id}
                          className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Editor Dialog */}
      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => router.refresh()}
        locale={locale}
        question={editingQuestion}
      />
    </div>
  )
}
