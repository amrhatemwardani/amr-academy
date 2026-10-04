'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, Clock, AlertCircle, File, Download, ExternalLink } from 'lucide-react'
import { gradeSubmissionAction } from '../actions'

type Submission = {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  content: string
  fileUrl: string
  fileName: string
  score: number | null
  teacherNote: string
  status: 'submitted' | 'graded' | 'late'
  submittedAt: string
  gradedAt: string | null
}

interface Props {
  locale: string
  submissions: Submission[]
  maxScore: number
}

const STATUS_CONFIG = {
  submitted: { labelEn: 'Submitted',   labelAr: 'مُسلَّم',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  graded:    { labelEn: 'Graded',      labelAr: 'مُصحَّح',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  late:      { labelEn: 'Late',        labelAr: 'متأخر',   color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

export function SubmissionsClientView({ locale, submissions: initial, maxScore }: Props) {
  const isAr = locale === 'ar'
  const [subs, setSubs] = useState(initial)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const handleGrade = async (subId: string) => {
    const score = parseInt(grades[subId] || '')
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast.error(isAr ? `الدرجة يجب أن تكون بين 0 و ${maxScore}` : `Score must be 0–${maxScore}`)
      return
    }
    setSaving(subId)
    const res = await gradeSubmissionAction(subId, score, notes[subId] || '', locale)
    setSaving(null)
    if (res.success) {
      toast.success(isAr ? 'تم التصحيح بنجاح' : 'Graded successfully')
      setSubs((prev) =>
        prev.map((s) =>
          s.id === subId
            ? { ...s, score, teacherNote: notes[subId] || '', status: 'graded', gradedAt: new Date().toISOString() }
            : s
        )
      )
    } else {
      toast.error(res.error || 'Failed')
    }
  }

  if (subs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isAr ? 'لا توجد تسليمات بعد لهذا الواجب.' : 'No submissions yet for this assignment.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        {isAr ? `التسليمات (${subs.length})` : `Submissions (${subs.length})`}
      </h2>

      {subs.map((sub) => {
        const cfg = STATUS_CONFIG[sub.status]
        return (
          <Card key={sub.id} className="border shadow-sm">
            <CardContent className="p-4 space-y-3">
              {/* Student header */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">{sub.studentName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{sub.studentCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                    {isAr ? cfg.labelAr : cfg.labelEn}
                  </span>
                  {sub.score !== null && (
                    <span className="text-sm font-bold text-foreground">
                      {sub.score}/{maxScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Uploaded File */}
              {sub.fileName && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <File className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{isAr ? 'الملف المرفوع:' : 'Uploaded file:'}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{sub.fileName}</p>
                    </div>
                  </div>
                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      download={sub.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isAr ? 'عرض / تحميل' : 'View / Download'}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Submitted content */}
              {sub.content && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {isAr ? 'إجابة الطالب:' : "Student's answer:"}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{sub.content}</p>
                </div>
              )}

              {/* Previous teacher note */}
              {sub.teacherNote && sub.status === 'graded' && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                    {isAr ? 'ملاحظة المعلم:' : 'Teacher feedback:'}
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">{sub.teacherNote}</p>
                </div>
              )}

              {/* Grading form */}
              <div className="flex gap-2 items-start pt-1 border-t border-border">
                <div className="flex-1 space-y-1.5">
                  <Input
                    type="number"
                    min="0"
                    max={maxScore}
                    step="any"
                    placeholder={sub.score !== null ? String(sub.score) : isAr ? `الدرجة (0-${maxScore})` : `Score (0-${maxScore})`}
                    value={grades[sub.id] || ''}
                    onChange={(e) => setGrades((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-[2]">
                  <Input
                    type="text"
                    placeholder={isAr ? 'ملاحظة / تغذية راجعة (اختياري)' : 'Feedback (optional)'}
                    value={notes[sub.id] ?? sub.teacherNote}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => handleGrade(sub.id)}
                  disabled={saving === sub.id}
                >
                  {saving === sub.id
                    ? (isAr ? 'حفظ...' : 'Saving...')
                    : (isAr ? 'تصحيح' : 'Grade')}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                {isAr ? 'تسليم:' : 'Submitted:'}{' '}
                {new Date(sub.submittedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
