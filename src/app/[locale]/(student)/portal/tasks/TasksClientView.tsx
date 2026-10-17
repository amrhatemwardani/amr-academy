'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  PenLine,
  Upload,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Send,
  File,
  X,
  ExternalLink,
  Download,
  Video,
  Camera,
  Play,
  Eye,
} from 'lucide-react'
import { submitAssignmentAction } from './actions'

type Submission = {
  score: number | null
  teacherNote: string
  status: 'submitted' | 'graded' | 'late'
  submittedAt: string
  content: string
  fileName?: string
  fileUrl?: string
}

type Task = {
  id: string
  title: string
  description: string
  type: string
  className: string
  classSubject: string
  dueDate: string | null
  maxScore: number
  submission: Submission | null
  resourceLink?: string | null
}

interface Props {
  locale: string
  tasks: Task[]
  studentId: string
}

const TYPE_CONFIG = {
  homework:   { labelEn: 'Homework',   labelAr: 'واجب منزلي', icon: BookOpen,  color: 'from-blue-500 to-indigo-600' },
  quiz:       { labelEn: 'Quiz',       labelAr: 'اختبار قصير', icon: FileText,  color: 'from-purple-500 to-violet-600' },
  written:    { labelEn: 'Written',    labelAr: 'تحريري ومقالي', icon: PenLine,   color: 'from-amber-500 to-orange-500' },
  pdf_upload: { labelEn: 'PDF Upload', labelAr: 'رفع ملف PDF',  icon: Upload,    color: 'from-red-500 to-rose-600' },
}

function getYouTubeId(url?: string | null) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function TasksClientView({ locale, tasks, studentId }: Props) {
  const isAr = locale === 'ar'
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attachedFiles, setAttachedFiles] = useState<Record<string, { name: string; url: string; size: string }>>({})
  const [driveLink, setDriveLink] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [cardWindow, setCardWindow] = useState<{ url: string; title: string } | null>(null)

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const handleFileChange = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? 'حجم الملف يجب ألا يتجاوز 10 ميجابايت' : 'File size must not exceed 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64Url = reader.result as string
      const sizeStr = (file.size / 1024).toFixed(1) + ' KB'
      setAttachedFiles((prev) => ({
        ...prev,
        [taskId]: { name: file.name, url: base64Url, size: sizeStr },
      }))
      toast.success(isAr ? `تم إرفاق الملف: ${file.name}` : `Attached: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (taskId: string) => {
    setAttachedFiles((prev) => {
      const copy = { ...prev }
      delete copy[taskId]
      return copy
    })
  }

  const handleSubmit = async (taskId: string) => {
    const answer = answers[taskId]?.trim() || ''
    const file = attachedFiles[taskId]
    const dLink = driveLink[taskId]?.trim()

    if (!answer && !file && !dLink) {
      toast.error(isAr ? 'يرجى كتابة إجابتك أو إرفاق ملف أو رابط قبل التسليم' : 'Please write your answer, attach a file, or provide a link')
      return
    }

    if (dLink && !dLink.startsWith('https://drive.google.com') && !dLink.startsWith('https://docs.google.com')) {
      toast.error(isAr ? 'يجب أن يكون الرابط من جوجل درايف' : 'Link must be a Google Drive link')
      return
    }

    setSubmitting(taskId)
    let fileData = file ? { fileName: file.name, fileUrl: file.url } : null
    if (dLink) {
      fileData = { fileName: 'Google Drive Link', fileUrl: dLink }
    }
    const res = await submitAssignmentAction(taskId, answer, fileData, locale)
    setSubmitting(null)

    if (res.success) {
      toast.success(
        res.late
          ? (isAr ? 'تم التسليم بنجاح (سُجِّل متأخراً)' : 'Submitted successfully (marked late)')
          : (isAr ? 'تم تسليم الواجب بنجاح!' : 'Assignment submitted successfully!')
      )
      setSubmitted((p) => ({ ...p, [taskId]: true }))
      setExpanded((p) => ({ ...p, [taskId]: false }))
      // Refresh to reload data
      window.location.reload()
    } else {
      toast.error(res.error || 'Failed to submit')
    }
  }

  // Separate tasks by status
  const pending = tasks.filter((t) => !t.submission && !submitted[t.id])
  const done = tasks.filter((t) => t.submission || submitted[t.id])

  const TaskCard = ({ task }: { task: Task }) => {
    const cfg = TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.homework
    const Icon = cfg.icon
    const isOpen = expanded[task.id]
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.submission
    const alreadySubmitted = !!task.submission || submitted[task.id]
    const currentFile = attachedFiles[task.id]

    return (
      <Card className={`border shadow-sm transition-all ${isOverdue && !alreadySubmitted ? 'border-red-300 dark:border-red-800' : ''}`}>
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.color} text-white shadow-sm`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-sm text-foreground">{task.title}</p>
                  {task.className && (
                    <p className="text-xs text-muted-foreground">{task.className}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alreadySubmitted ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      {task.submission?.status === 'graded'
                        ? (isAr ? 'تم التصحيح' : 'Graded')
                        : task.submission?.status === 'late'
                        ? (isAr ? 'مُسلَّم (متأخر)' : 'Submitted (Late)')
                        : (isAr ? 'تم التسليم' : 'Submitted')}
                    </span>
                  ) : isOverdue ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                      <AlertCircle className="h-3 w-3" />
                      {isAr ? 'فائت / متأخر' : 'Overdue'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {isAr ? 'قيد الانتظار' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                {task.dueDate ? (
                  <p className={`flex items-center gap-1 text-[11px] ${isOverdue && !alreadySubmitted ? 'text-red-500 font-semibold' : ''}`}>
                    <Clock className="h-3 w-3" />
                    {isAr ? 'الموعد:' : 'Due:'} {new Date(task.dueDate).toLocaleString()}
                  </p>
                ) : <span />}
                <span className="font-medium text-foreground">
                  {isAr ? 'الدرجة:' : 'Max:'} {task.maxScore}
                </span>
              </div>

              {/* Grade display */}
              {task.submission?.status === 'graded' && task.submission.score !== null && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {isAr ? `الدرجة: ${task.submission.score} من ${task.maxScore}` : `Score: ${task.submission.score} / ${task.maxScore}`}
                  </span>
                  {task.submission.teacherNote && (
                    <span className="text-xs text-muted-foreground truncate">
                      — {task.submission.teacherNote}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description / Instructions */}
          {task.description && (
            <div className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">
              <p className="font-semibold text-foreground mb-0.5">{isAr ? 'تعليمات الواجب:' : 'Instructions:'}</p>
              {task.description}
            </div>
          )}

          {/* Attached Resource / YouTube Video */}
          {task.resourceLink && (
            <div className="mt-3 space-y-2">
              {getYouTubeId(task.resourceLink) ? (
                <div className="rounded-xl overflow-hidden border border-border bg-black shadow-sm">
                  <div className="px-3 py-1.5 bg-muted/80 backdrop-blur flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-600 flex items-center gap-1.5">
                      <Video className="h-4 w-4" />
                      {isAr ? 'فيديو الشرح المرفق من الأستاذ عمرو' : 'Explanation Video by Eng. Amr'}
                    </span>
                    <a
                      href={task.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {isAr ? 'فتح في يوتيوب' : 'Open in YouTube'}
                    </a>
                  </div>
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(task.resourceLink)}`}
                      title="Assignment explanation video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-foreground">
                      {isAr ? 'ملف أو مرجع مرفق مع الواجب' : 'Attached Reference / File'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCardWindow({ url: task.resourceLink!, title: task.title })}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 py-1 rounded border border-blue-300 dark:border-blue-800 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{isAr ? 'معاينة في نافذة سريعة' : 'Open in Card Window'}</span>
                    </button>
                    <a
                      href={task.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={isAr ? 'فتح في تبويب خارجي' : 'Open in new tab'}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission form / toggle */}
          {!alreadySubmitted && (
            <div className="mt-3">
              <button
                onClick={() => toggle(task.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {isOpen
                  ? (isAr ? 'إخفاء نموذج الإجابة' : 'Hide submission form')
                  : (isAr ? 'تسليم الواجب الآن' : 'Submit your work now')}
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3 pt-2 border-t border-border">
                  {/* Drive Link Box */}
                  <div className="space-y-1 mb-3">
                    <label className="text-xs font-medium text-foreground">
                      {isAr ? 'أو أدخل رابط Google Drive / أو أدخل رابط Google Drive:' : 'Or paste Google Drive link / أو أدخل رابط Google Drive:'}
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="https://drive.google.com/..."
                      value={driveLink[task.id] || ''}
                      onChange={(e) => setDriveLink((p) => ({ ...p, [task.id]: e.target.value }))}
                    />
                  </div>
                  {/* File Upload Box */}
                  <div className="rounded-xl border-2 border-dashed border-border p-4 bg-muted/20 text-center hover:bg-muted/40 transition-colors">
                    {currentFile ? (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="h-5 w-5 text-primary shrink-0" />
                          <div className="text-start min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{currentFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{currentFile.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(task.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                          title={isAr ? 'إزالة الملف' : 'Remove file'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="cursor-pointer block py-2">
                          <Upload className="mx-auto h-7 w-7 text-muted-foreground/60 mb-1" />
                          <p className="text-xs font-semibold text-foreground">
                            {isAr ? 'اختر ملف PDF أو صورة حل للواجب' : 'Upload PDF or photo of your work'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isAr ? 'PDF, PNG, JPG حتى 10 ميجابايت' : 'PDF, PNG, JPG up to 10MB'}
                          </p>
                          <input
                            type="file"
                            accept=".pdf,image/*,.doc,.docx"
                            onChange={(e) => handleFileChange(task.id, e)}
                            className="hidden"
                          />
                        </label>
                        <div className="pt-2 border-t border-border/50 flex justify-center">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors">
                            <Camera className="h-4 w-4 text-primary" />
                            <span>{isAr ? 'التقاط صورة بكاميرا الهاتف' : 'Take photo with camera'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleFileChange(task.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Written Answer / Note Textarea */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isAr ? 'إجابة تحريرية / ملاحظات إضافية للمدرس:' : 'Written Answer / Notes for Teacher:'}
                    </label>
                    <textarea
                      className="w-full min-h-[90px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder={
                        task.type === 'quiz'
                          ? (isAr ? 'اكتب إجابات أسئلة الاختبار بالتفصيل...' : 'Write your detailed quiz answers...')
                          : (isAr ? 'اكتب حل المسائل أو إجابتك هنا...' : 'Write your solutions or notes here...')
                      }
                      value={answers[task.id] || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [task.id]: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit(task.id)}
                    disabled={submitting === task.id}
                    className="w-full gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting === task.id
                      ? (isAr ? 'جاري التسليم...' : 'Submitting...')
                      : (isAr ? 'تسليم الواجب للأستاذ عمرو' : 'Submit Assignment')}
                  </Button>

                  {isOverdue && (
                    <p className="text-[11px] text-red-500 text-center font-medium">
                      {isAr ? '⚠️ تنبيه: الموعد النهائي انقضى. سيتم تسجيل التسليم كـ "متأخر".' : '⚠️ Due date has passed. Submission will be marked as late.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Already submitted content review */}
          {task.submission && (
            <div className="mt-3 rounded-lg bg-muted/40 p-3 space-y-2 border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {isAr ? 'ما قمت بتسليمه:' : 'Your Submission:'}
              </p>

              {task.submission.fileName && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    {task.submission.fileUrl?.includes('drive.google.com') || task.submission.fileUrl?.includes('docs.google.com') ? (
                      <svg className="h-4 w-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                    ) : (
                      <File className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-xs font-medium text-foreground truncate">{task.submission.fileName}</span>
                  </div>
                  {task.submission.fileUrl && (
                    task.submission.fileUrl.includes('drive.google.com') || task.submission.fileUrl.includes('docs.google.com') ? (
                      <a
                        href={task.submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:underline shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{isAr ? 'فتح الرابط' : 'Open Link'}</span>
                      </a>
                    ) : (
                      <a
                        href={task.submission.fileUrl}
                        download={task.submission.fileName}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تحميل' : 'Download'}</span>
                      </a>
                    )
                  )}
                </div>
              )}

              {task.submission.content && (
                <p className="text-xs text-foreground whitespace-pre-wrap">{task.submission.content}</p>
              )}

              <p className="text-[10px] text-muted-foreground pt-1">
                {isAr ? 'تاريخ التسليم:' : 'Submitted on:'} {new Date(task.submission.submittedAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-violet-200" />
            <span className="text-sm font-semibold text-violet-100">
              {isAr ? 'أكاديمية م. عمرو حاتم' : 'Eng. Amr Hatem Academy'}
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {isAr ? 'الواجبات والمهام الدراسية' : 'Assignments & Homework'}
          </h1>
          <p className="mt-1 text-xs text-violet-100/90 max-w-md">
            {isAr
              ? 'سلّم حلولك كملف PDF أو كتابة تحريرية واحصل على تصحيح وملاحظات مباشرة من م. عمرو.'
              : 'Submit your work as a PDF or written answers and receive direct feedback from Eng. Amr.'}
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {pending.length} {isAr ? 'واجب بانتظار الحل' : 'pending'}
            </span>
            <span className="rounded-full bg-emerald-500/40 px-3 py-1 text-xs font-semibold">
              {done.length} {isAr ? 'تم تسليمه' : 'completed'}
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>

      {tasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">
              {isAr ? 'لا توجد واجبات مطلوب تسليمها حالياً' : 'No assignments due right now'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'أي واجب يحدده الأستاذ عمرو سيظهر هنا مباشرة.' : 'Any assignment assigned by Eng. Amr will appear here.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            {isAr ? `واجبات بانتظار تسليمك (${pending.length})` : `Pending Tasks (${pending.length})`}
          </h2>
          <div className="space-y-3">
            {pending.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {isAr ? `واجبات تم تسليمها وتصحيحها (${done.length})` : `Completed & Graded (${done.length})`}
          </h2>
          <div className="space-y-3">
            {done.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      )}

      {/* ── Small Card Window for Assignment Resources ── */}
      <Dialog open={!!cardWindow} onOpenChange={(o) => { if (!o) setCardWindow(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-background border border-border shadow-2xl">
          <DialogHeader className="px-5 py-3 border-b border-border bg-muted/40 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold truncate flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>{cardWindow?.title}</span>
            </DialogTitle>
            {cardWindow?.url && (
              <a
                href={cardWindow.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0 me-6"
              >
                <span>{isAr ? 'فتح خارجي' : 'Open External'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-[380px] p-2 bg-slate-100 dark:bg-slate-950 flex flex-col">
            {cardWindow?.url ? (
              <iframe
                src={cardWindow.url.includes('drive.google.com') && !cardWindow.url.includes('/preview')
                  ? cardWindow.url.replace(/\/view(\?.*)?$/, '/preview')
                  : cardWindow.url}
                title={cardWindow.title}
                className="w-full flex-1 rounded-lg border border-border min-h-[400px] bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
