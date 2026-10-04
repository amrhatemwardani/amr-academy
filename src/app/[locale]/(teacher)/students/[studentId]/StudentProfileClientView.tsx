'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User, Phone, School, GraduationCap, Calendar, Clock, DollarSign,
  Award, FileText, MessageSquare, AlertCircle, CheckCircle2, XCircle,
  Plus, Trash2, ArrowLeft, ArrowRight, ExternalLink, ShieldAlert,
  ChevronRight, StickyNote, Receipt, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { addStudentNoteAction, deleteStudentNoteAction } from './actions'

interface AttendanceItem {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note: string | null
  className: string
}

interface ChargeItem {
  id: string
  description: string
  className: string
  amount: number
  remaining: number
  dueDate: string
  status: 'paid' | 'partial' | 'unpaid'
}

interface PaymentItem {
  id: string
  receiptNo: string
  amount: number
  method: string
  paidAt: string
}

interface ExamResultItem {
  attemptId: string
  examId: string
  examTitle: string
  className: string
  score: number
  total: number
  percentage: number
  passed: boolean
  submittedAt: string | null
  publishedAt: string | null
}

interface EnrollmentItem {
  classId: string
  className: string
  subject: string
  enrolledOn: string
  fee: number
}

interface NoteItem {
  id: string
  note: string
  createdAt: string
  authorName: string
}

interface Props {
  locale: string
  student: {
    id: string
    code: string
    fullName: string
    phone: string | null
    parentPhone: string | null
    grade: string | null
    school: string | null
    status: 'active' | 'inactive' | 'archived'
    enrolledOn: string
  }
  enrollments: EnrollmentItem[]
  attendance: AttendanceItem[]
  charges: ChargeItem[]
  payments: PaymentItem[]
  examResults: ExamResultItem[]
  notes: NoteItem[]
  stats: {
    attendanceRate: number
    presentCount: number
    totalSessions: number
    examAverage: number
    examsCount: number
    outstandingBalance: number
    totalPaid: number
  }
}

export function StudentProfileClientView({
  locale,
  student,
  enrollments,
  attendance,
  charges,
  payments,
  examResults,
  notes,
  stats,
}: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'finance' | 'exams' | 'notes'>('overview')
  const [newNote, setNewNote] = useState('')
  const [isPending, startTransition] = useTransition()

  // Format phone for WhatsApp
  const cleanPhone = (phone?: string | null) => {
    if (!phone) return ''
    let p = phone.replace(/[^0-9]/g, '')
    if (p.startsWith('0')) p = '2' + p // default Egyptian country code 20...
    return p
  }

  const parentWhatsAppUrl = useMemo(() => {
    const p = cleanPhone(student.parentPhone)
    if (!p) return null
    const text = isAr
      ? `السلام عليكم، بخصوص الطالب ${student.fullName} (كود ${student.code}) في أكاديمية عمرو:`
      : `Hello, regarding student ${student.fullName} (Code ${student.code}) at Amr Academy:`
    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
  }, [student, isAr])

  const studentWhatsAppUrl = useMemo(() => {
    const p = cleanPhone(student.phone)
    if (!p) return null
    const text = isAr
      ? `أهلاً ${student.fullName}، بخصوص حسابك في أكاديمية عمرو:`
      : `Hello ${student.fullName}, regarding your account at Amr Academy:`
    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
  }, [student, isAr])

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim() || isPending) return

    startTransition(async () => {
      const res = await addStudentNoteAction(student.id, newNote)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تمت إضافة الملاحظة بنجاح' : 'Note added successfully')
        setNewNote('')
        router.refresh()
      }
    })
  }

  function handleDeleteNote(noteId: string) {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Delete this note?')) return

    startTransition(async () => {
      const res = await deleteStudentNoteAction(noteId, student.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تم حذف الملاحظة' : 'Note deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Navigation Breadcrumb ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/students`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{isAr ? 'العودة لقائمة الطلاب' : 'Back to Students List'}</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {parentWhatsAppUrl && (
            <a
              href={parentWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{isAr ? 'واتساب ولي الأمر' : "Parent's WhatsApp"}</span>
            </a>
          )}

          {/* WhatsApp Full Report Button */}
          {(() => {
            const p = cleanPhone(student.parentPhone || student.phone)
            if (!p) return null
            const reportText = isAr
              ? `📊 تقرير أداء الطالب\n━━━━━━━━━━━━━━━\nالاسم: ${student.fullName}\nالكود: ${student.code}\nالحضور: ${stats.attendanceRate}%\nمتوسط الدرجات: ${stats.examAverage}%\nالرصيد المستحق: ${stats.outstandingBalance} EGP\nإجمالي المدفوع: ${stats.totalPaid} EGP\n━━━━━━━━━━━━━━━\nللتواصل مع م. عمرو حاتم:\n+201012006316`
              : `📊 Student Performance Report\n━━━━━━━━━━━━━━━\nName: ${student.fullName}\nCode: ${student.code}\nAttendance: ${stats.attendanceRate}%\nExam Average: ${stats.examAverage}%\nOutstanding Balance: ${stats.outstandingBalance} EGP\nTotal Paid: ${stats.totalPaid} EGP\n━━━━━━━━━━━━━━━\nContact Eng. Amr Hatem:\n+201012006316`
            return (
              <a
                href={`https://wa.me/${p}?text=${encodeURIComponent(reportText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{isAr ? 'إرسال التقرير' : 'Send Report'}</span>
              </a>
            )
          })()}

          <Link
            href={`/${locale}/messages`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span>{isAr ? 'محادثة الأكاديمية' : 'Chat'}</span>
          </Link>
        </div>
      </div>

      {/* ── Student Header Card ───────────────────────────────────────── */}
      <Card className="border shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-md">
              {student.fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{student.fullName}</h1>
                <Badge variant="outline" className="font-mono text-xs bg-background font-bold">
                  {student.code}
                </Badge>
                <Badge
                  className={
                    student.status === 'active'
                      ? 'bg-emerald-600 text-white'
                      : student.status === 'inactive'
                      ? 'bg-amber-600 text-white'
                      : 'bg-red-600 text-white'
                  }
                >
                  {student.status === 'active'
                    ? (isAr ? 'نشط' : 'Active')
                    : student.status === 'inactive'
                    ? (isAr ? 'غير نشط' : 'Inactive')
                    : (isAr ? 'مؤرشف' : 'Archived')}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                {student.grade && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> {student.grade}
                  </span>
                )}
                {student.school && (
                  <span className="flex items-center gap-1">
                    <School className="h-3.5 w-3.5" /> {student.school}
                  </span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5" /> {student.phone}
                  </span>
                )}
                {student.parentPhone && (
                  <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                    <Phone className="h-3.5 w-3.5" /> {student.parentPhone} (ولي الأمر)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Key Metrics Bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse border-t border-border bg-background">
          <div className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'نسبة الحضور' : 'Attendance Rate'}</p>
            <p className={`text-xl font-black mt-0.5 ${
              stats.attendanceRate >= 80 ? 'text-emerald-600' : stats.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {stats.attendanceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stats.presentCount} / {stats.totalSessions} {isAr ? 'حصة' : 'sessions'}
            </p>
          </div>

          <div className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'متوسط الامتحانات' : 'Exam Average'}</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">
              {stats.examsCount > 0 ? `${stats.examAverage}%` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stats.examsCount} {isAr ? 'امتحان مسجل' : 'exams taken'}
            </p>
          </div>

          <div className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'الرصيد المستحق' : 'Balance Due'}</p>
            <p className={`text-xl font-black mt-0.5 ${stats.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              EGP {stats.outstandingBalance.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? 'تم سداد: ' : 'Paid: '} EGP {stats.totalPaid.toLocaleString()}
            </p>
          </div>

          <div className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'الفصول المسجلة' : 'Enrolled Classes'}</p>
            <p className="text-xl font-black text-foreground mt-0.5">
              {enrollments.length}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? 'مجموعات دراسية' : 'active groups'}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Navigation Tabs ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1">
        {[
          { key: 'overview',   label: isAr ? 'نظرة عامة والفصول' : 'Overview & Classes', icon: Layers },
          { key: 'attendance', label: isAr ? 'سجل الحضور' : 'Attendance',               icon: Calendar },
          { key: 'finance',    label: isAr ? 'المعاملات المالية' : 'Finance & Ledger',   icon: DollarSign },
          { key: 'exams',      label: isAr ? 'الامتحانات والدرجات' : 'Exams & Grades',   icon: Award },
          { key: 'notes',      label: isAr ? 'ملاحظات المعلم الخاصة' : 'Teacher Notes', icon: StickyNote, count: notes.length },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab 1: Overview & Classes ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {isAr ? 'الفصول والمجموعات المقيد بها' : 'Enrolled Classes'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {enrollments.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {isAr ? 'الطالب غير مقيد في أي فصول حالياً' : 'Not enrolled in any classes'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {enrollments.map((e) => (
                    <div key={e.classId} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/20">
                      <div>
                        <p className="font-bold text-sm text-foreground">{e.className}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.subject} • {isAr ? 'تاريخ القيد:' : 'Enrolled:'} {new Date(e.enrolledOn).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-end">
                        <span className="text-sm font-bold font-mono">
                          EGP {e.fee.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{isAr ? 'شهرياً' : 'monthly'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab 2: Attendance ─────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>{isAr ? 'سجل حضور وغياب الطالب' : 'Attendance Log'}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {attendance.length} {isAr ? 'سجل' : 'records'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendance.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {isAr ? 'لا توجد سجلات حضور مسجلة لهذا الطالب' : 'No attendance records logged'}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto scrollbar-thin">
                {attendance.map((a) => (
                  <div key={a.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20 text-xs">
                    <div>
                      <p className="font-semibold text-sm">{a.className}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(a.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {a.note && <span className="italic"> — {a.note}</span>}
                      </p>
                    </div>

                    <Badge
                      className={
                        a.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : a.status === 'late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : a.status === 'absent'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {a.status === 'present' ? (isAr ? 'حاضر' : 'Present')
                       : a.status === 'late' ? (isAr ? 'متأخر' : 'Late')
                       : a.status === 'absent' ? (isAr ? 'غائب' : 'Absent')
                       : (isAr ? 'معذور' : 'Excused')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab 3: Finance & Ledger ───────────────────────────────────── */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          {/* Charges */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {isAr ? 'المصروفات المستحقة' : 'Charges & Invoices'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {charges.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {isAr ? 'لا توجد مصروفات مسجلة' : 'No charges recorded'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {charges.map((c) => (
                    <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-sm">{c.description}</p>
                        <p className="text-muted-foreground">
                          {c.className} • {isAr ? 'الاستحقاق: ' : 'Due: '} {new Date(c.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-sm font-mono">EGP {c.amount.toLocaleString()}</span>
                        <p className="text-[10px]">
                          {c.status === 'paid' && <span className="text-emerald-600 font-bold">{isAr ? 'مدفوع ✓' : 'Paid ✓'}</span>}
                          {c.status === 'partial' && <span className="text-amber-600">{isAr ? `متبقي ${c.remaining}` : `Due: ${c.remaining}`}</span>}
                          {c.status === 'unpaid' && <span className="text-red-600 font-bold">{isAr ? 'غير مدفوع' : 'Unpaid'}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                {isAr ? 'سجل المدفوعات والإيصالات' : 'Payment Receipts'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {isAr ? 'لا توجد مدفوعات مسجلة بعد' : 'No payments recorded'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-mono font-bold text-primary">{p.receiptNo}</span>
                        <p className="text-muted-foreground">
                          {new Date(p.paidAt).toLocaleDateString()} • {p.method}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600 text-sm font-mono">
                        EGP {p.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab 4: Exams & Grades ─────────────────────────────────────── */}
      {activeTab === 'exams' && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>{isAr ? 'سجل امتحانات الطالب' : 'Exams History'}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {examResults.length} {isAr ? 'امتحان' : 'exams'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {examResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {isAr ? 'لا توجد امتحانات مسجلة لهذا الطالب' : 'No exam records for this student'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {examResults.map((r) => (
                  <div key={r.attemptId} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/20">
                    <div>
                      <p className="font-bold text-sm">{r.examTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.className}
                        {r.submittedAt && ` • ${new Date(r.submittedAt).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="text-end flex items-center gap-3">
                      <div>
                        <span className="text-base font-black font-mono">{r.score}/{r.total}</span>
                        <p className="text-xs text-muted-foreground font-semibold">{r.percentage}%</p>
                      </div>
                      <Badge className={r.passed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}>
                        {r.passed ? (isAr ? 'ناجح ✓' : 'Passed ✓') : (isAr ? 'راسب' : 'Failed')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab 5: Private Teacher Notes ──────────────────────────────── */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add note card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                {isAr ? 'إضافة ملاحظة خاصة للمعلم' : 'Add Private Teacher Note'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب ملاحظتك الخاصة هنا (مثال: أداء الطالب في الواجب، نقاط الضعف، تنبيه لولي الأمر)... لا يراها الطالب'
                      : 'Write a private note here (only visible to teachers)...'
                  }
                  className="w-full rounded-xl border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>{isAr ? 'حفظ الملاحظة' : 'Save Note'}</span>
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notes list */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{isAr ? 'الملاحظات السابقة' : 'Previous Notes'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {notes.length} {isAr ? 'ملاحظة' : 'notes'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notes.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {isAr ? 'لا توجد ملاحظات مسجلة لهذا الطالب' : 'No teacher notes recorded yet'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notes.map((n) => (
                    <div key={n.id} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/20">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{n.note}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? 'أُضيفت في: ' : 'Added: '}
                          {new Date(n.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-red-600 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
