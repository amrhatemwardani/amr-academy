'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ClipboardList,
  Plus,
  Trash2,
  Users,
  User,
  Clock,
  FileText,
  BookOpen,
  PenLine,
  Upload,
  Eye,
  AlertCircle,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import { createAssignmentAction, deleteAssignmentAction, getQuestionsForPickerAction } from './actions'

type Assignment = {
  id: string
  title: string
  description: string
  type: string
  classId: string
  className: string
  classSubject: string
  studentId: string | null
  studentName?: string | null
  studentCode?: string | null
  dueDate: string | null
  maxScore: number
  submissionCount: number
  createdAt: string
  resource_link?: string | null
}

type ClassItem = {
  id: string
  name: string
  subject: string
  level: string
}

type StudentItem = {
  id: string
  code: string
  name: string
}

interface Props {
  locale: string
  assignments: Assignment[]
  classes: ClassItem[]
  students: StudentItem[]
}

const TYPE_CONFIG = {
  homework:   { labelEn: 'Homework',   labelAr: 'واجب منزلي', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',   icon: BookOpen },
  quiz:       { labelEn: 'Quiz',       labelAr: 'اختبار قصير', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', icon: FileText },
  pdf_upload: { labelEn: 'PDF Upload', labelAr: 'رفع ملف PDF', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',         icon: Upload },
  written:    { labelEn: 'Written',    labelAr: 'تحريري ومقالي', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',  icon: PenLine },
}

export function AssignmentsClientView({ locale, assignments, classes, students }: Props) {
  const isAr = locale === 'ar'

  const [list, setList] = useState(assignments)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('homework')
  const [targetType, setTargetType] = useState<'class' | 'student'>('class')
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [dueDate, setDueDate] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [resourceLink, setResourceLink] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQs, setPickerQs] = useState<any[]>([])
  const [selectedQs, setSelectedQs] = useState<Set<string>>(new Set())

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('homework')
    setTargetType('class')
    setClassId(classes[0]?.id || '')
    setStudentId(students[0]?.id || '')
    setDueDate('')
    setMaxScore('100')
    setResourceLink('')
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError(isAr ? 'العنوان مطلوب' : 'Title is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createAssignmentAction(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          classId: targetType === 'class' ? (classId || undefined) : undefined,
          studentId: targetType === 'student' ? (studentId || undefined) : undefined,
          dueDate: dueDate || undefined,
          maxScore: parseInt(maxScore) || 100,
          resource_link: resourceLink || undefined,
        },
        locale
      )
      if (res.success) {
        toast.success(isAr ? 'تم إنشاء الواجب بنجاح' : 'Assignment created!')
        setOpen(false)
        resetForm()
        window.location.reload()
      } else {
        setError(res.error || 'Failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'هل تريد حذف هذا الواجب نهائياً؟' : 'Delete this assignment?')) return
    const res = await deleteAssignmentAction(id, locale)
    if (res.success) {
      toast.success(isAr ? 'تم حذف الواجب' : 'Assignment deleted')
      setList((prev) => prev.filter((a) => a.id !== id))
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  const filteredList = list.filter((a) => {
    if (filterType === 'all') return true
    if (filterType === 'student') return !!a.studentId
    if (filterType === 'class') return !a.studentId
    return a.type === filterType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            {isAr ? 'إدارة الواجبات والمهام الدراسية' : 'Assignments & Homework'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? `إجمالي الواجبات: ${list.length} (لكل الفصول أو لطلاب محددين)`
              : `Total: ${list.length} assignments (per class or assigned individually)`}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {isAr ? 'إنشاء واجب جديد' : 'New Assignment'}
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', labelEn: 'All', labelAr: 'الكل' },
          { key: 'class', labelEn: 'Class Assignments', labelAr: 'واجبات الفصول' },
          { key: 'student', labelEn: 'Individual Students', labelAr: 'مهام فردية لطلاب' },
          { key: 'homework', labelEn: 'Homework', labelAr: 'واجبات' },
          { key: 'quiz', labelEn: 'Quizzes', labelAr: 'اختبارات' },
          { key: 'pdf_upload', labelEn: 'PDF Uploads', labelAr: 'ملفات PDF' },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilterType(chip.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === chip.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? chip.labelAr : chip.labelEn}
          </button>
        ))}
      </div>

      {/* Assignment Cards */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {isAr ? 'لا توجد واجبات مطابقة للتصفية.' : 'No assignments found matching this filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((a) => {
            const cfg = TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.homework
            const Icon = cfg.icon
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date()
            return (
              <Card key={a.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1"><p className="font-semibold text-sm text-foreground truncate">{a.title}</p>
{a.resource_link && (
  <a href={a.resource_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" title="Resource Link">
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
  </a>
)}</div>
                        {a.studentId ? (
                          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
                            <User className="h-3 w-3 shrink-0" />
                            <span>{a.studentName || 'Student'} ({a.studentCode})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <Users className="h-3 w-3 shrink-0" />
                            <span>{a.className || (isAr ? 'كل الفصول' : 'All Classes')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {isAr ? cfg.labelAr : cfg.labelEn}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {a.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  )}

                  {a.resource_link && (
                    <div className="pt-0.5">
                      <a
                        href={a.resource_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{isAr ? 'رابط المرجع / درايف' : 'Resource / Drive Link'}</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {a.submissionCount} {isAr ? 'تسليم' : 'submitted'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {isAr ? 'الدرجة:' : 'Max:'} {a.maxScore}
                    </span>
                  </div>

                  {a.dueDate && (
                    <p className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      <Clock className="h-3 w-3" />
                      {isAr ? 'الموعد:' : 'Due:'} {new Date(a.dueDate).toLocaleDateString()}
                      {isOverdue && (isAr ? ' (منتهي)' : ' (overdue)')}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Link
                      href={`/${locale}/assignments/${a.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isAr ? 'عرض وتصحيح التسليمات' : 'View & Grade'}
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              {isAr ? 'إنشاء واجب أو مهمة جديدة' : 'Create New Assignment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'عنوان الواجب / المهمة' : 'Assignment Title'}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? 'مثال: واجب الدرس الرابع - التفاضل والتكامل' : 'e.g. Chapter 4 Homework – Calculus'}
                required
              />
            </div>

            {/* Target Selector: Whole Class vs Specific Student */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'تعيين الواجب إلى:' : 'Assign To:'}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('class')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                    targetType === 'class'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>{isAr ? 'فصل دراسي كامل' : 'Whole Class'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                    targetType === 'student'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{isAr ? 'طالب مخصص' : 'Specific Student'}</span>
                </button>
              </div>
            </div>

            {/* Conditional Dropdown: Class or Student */}
            {targetType === 'class' ? (
              <div className="space-y-1.5">
                <Label>{isAr ? 'اختر الفصل' : 'Select Class'}</Label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{isAr ? '-- كل الفصول التابعة --' : '-- All Classes --'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{isAr ? 'اختر الطالب' : 'Select Student'}</Label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">{isAr ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{isAr ? 'التعليمات / الوصف والأسئلة' : 'Instructions & Questions'}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={async () => {
                    const res = await getQuestionsForPickerAction()
                    setPickerQs(res.questions || [])
                    setPickerOpen(true)
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {isAr ? 'إدراج من بنك الأسئلة' : 'Import from Question Bank'}
                </Button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder={isAr ? 'اكتب تفاصيل الواجب أو أرقام التمارين أو الأسئلة...' : 'Write assignment details, exercise numbers, or questions...'}
              />
            </div>

            {/* Resource Link (Drive / YouTube / Doc) */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'رابط ملف أو مرجع (جوجل درايف / يوتيوب - اختياري)' : 'Resource Link (Google Drive / YouTube - Optional)'}</Label>
              <Input
                type="url"
                value={resourceLink}
                onChange={(e) => setResourceLink(e.target.value)}
                placeholder="https://drive.google.com/... or https://youtube.com/..."
              />
            </div>

            {/* Type + Max Score */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isAr ? 'نوع التسليم المطلوب' : 'Submission Type'}</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="homework">{isAr ? 'واجب منزلي (إجابة أو ملاحظة)' : 'Homework (text answer)'}</option>
                  <option value="quiz">{isAr ? 'اختبار قصير (إجابات مباشرة)' : 'Quiz (direct answers)'}</option>
                  <option value="pdf_upload">{isAr ? 'رفع ملف PDF أو صورة حل' : 'Upload PDF / Image'}</option>
                  <option value="written">{isAr ? 'مقال أو حل تحريري كامل' : 'Written Essay'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? 'الدرجة الكاملة' : 'Max Score'}</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'آخر موعد للتسليم' : 'Due Date & Time'}</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء الواجب' : 'Create Assignment')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? 'بنك الأسئلة - اختيار أسئلة للواجب' : 'Question Bank - Select Questions'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
            {pickerQs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {isAr ? 'لا توجد أسئلة في بنك الأسئلة حالياً' : 'No questions found in Question Bank'}
              </p>
            ) : (
              pickerQs.map((q) => (
                <label key={q.id} className="flex items-start gap-2 p-2 border rounded hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQs.has(q.id)}
                    onChange={(e) => {
                      const next = new Set(selectedQs);
                      if (e.target.checked) next.add(q.id);
                      else next.delete(q.id);
                      setSelectedQs(next);
                    }}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-medium text-foreground">{q.body}</span>
                    {q.subject && <span className="block text-[10px] text-muted-foreground">{q.subject}</span>}
                  </div>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const selected = pickerQs.filter((q) => selectedQs.has(q.id));
                if (selected.length > 0) {
                  const qText =
                    '\n\n--- الأسئلة المحددة ---\n' +
                    selected.map((q, i) => `${i + 1}. ${q.body} (${q.default_marks || 1} درجات)`).join('\n');
                  setDescription((prev) => (prev ? prev + qText : qText.trim()));
                  toast.success(isAr ? `تم إدراج ${selected.length} أسئلة` : `Imported ${selected.length} questions`);
                }
                setPickerOpen(false);
              }}
            >
              {isAr ? 'إدراج الأسئلة المحددة' : 'Import Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
