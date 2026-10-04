'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Save,
  Users,
  Calendar,
  Sparkles,
  Scan,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { saveAttendanceAction, AttendanceRowInput } from './actions'
import { toast } from 'sonner'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface RosterStudent {
  id: string
  student_code: string
  full_name: string
  phone: string | null
  currentStatus: AttendanceStatus
  currentNote: string
}

export interface ClassOption {
  id: string
  name: string
  subject: string
  schedule: Array<{ dow: number; start: string; end: string }>
}

interface AttendanceClientViewProps {
  selectedClassId: string
  selectedDate: string
  classes: ClassOption[]
  roster: RosterStudent[]
}

const STATUS_CONFIG = {
  present: {
    labelEn: 'Present',
    labelAr: 'حاضر',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-500 text-white shadow-sm',
    inactiveClass: 'hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  late: {
    labelEn: 'Late',
    labelAr: 'متأخر',
    icon: Clock,
    activeClass: 'bg-amber-500 text-white shadow-sm',
    inactiveClass: 'hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  absent: {
    labelEn: 'Absent',
    labelAr: 'غائب',
    icon: XCircle,
    activeClass: 'bg-rose-500 text-white shadow-sm',
    inactiveClass: 'hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  excused: {
    labelEn: 'Excused',
    labelAr: 'معذور',
    icon: HelpCircle,
    activeClass: 'bg-sky-500 text-white shadow-sm',
    inactiveClass: 'hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
}

export function AttendanceClientView({
  selectedClassId,
  selectedDate,
  classes,
  roster: initialRoster,
}: AttendanceClientViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  // Map student_id -> { status, note }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >(() => {
    const map: Record<string, { status: AttendanceStatus; note: string }> = {}
    initialRoster.forEach((s) => {
      map[s.id] = { status: s.currentStatus, note: s.currentNote || '' }
    })
    return map
  })

  const [saving, setSaving] = useState(false)

  // Handle class selection switch
  const handleClassChange = (newClassId: string) => {
    router.push(`/${locale}/attendance?classId=${newClassId}&date=${selectedDate}`)
  }

  // Handle date change
  const handleDateChange = (newDate: string) => {
    router.push(`/${locale}/attendance?classId=${selectedClassId}&date=${newDate}`)
  }

  // Set single student status
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  // Set single student note
  const setStudentNote = (studentId: string, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }))
  }

  // Quick mark all present
  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev }
      initialRoster.forEach((s) => {
        next[s.id] = { ...next[s.id], status: 'present' }
      })
      return next
    })
    toast.info(isAr ? 'تم تحديد جميع الطلاب حاضرين' : 'Marked all students as present')
  }

  // Save all attendance
  const handleSave = async () => {
    if (!selectedClassId) {
      toast.error(isAr ? 'يرجى اختيار فصل دراسي' : 'Please select a class')
      return
    }

    setSaving(true)
    try {
      const rows: AttendanceRowInput[] = initialRoster.map((s) => {
        const item = attendanceMap[s.id] || { status: 'present', note: '' }
        return {
          student_id: s.id,
          status: item.status,
          note: item.note.trim() || null,
        }
      })

      const res = await saveAttendanceAction(selectedClassId, selectedDate, rows, locale)

      if (res.success) {
        toast.success(
          isAr
            ? `تم حفظ دفتر الحضور ليوم ${selectedDate} بنجاح`
            : `Attendance for ${selectedDate} saved successfully`
        )
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to save attendance')
      }
    } catch {
      toast.error('Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  // Calculate live stats
  const total = initialRoster.length
  let presentCount = 0
  let lateCount = 0
  let absentCount = 0
  let excusedCount = 0

  initialRoster.forEach((s) => {
    const st = attendanceMap[s.id]?.status || s.currentStatus
    if (st === 'present') presentCount++
    else if (st === 'late') lateCount++
    else if (st === 'absent') absentCount++
    else if (st === 'excused') excusedCount++
  })

  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0
  const selectedClass = classes.find((c) => c.id === selectedClassId)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span>{isAr ? 'تسجيل الحضور والغياب' : 'Attendance Tracking'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'تسجيل يومي سريع للحضور والغياب مع حساب النسب تلقائياً'
              : 'Daily class attendance marking with real-time statistics'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
          >
            <Link href={`/${locale}/attendance/scanner`}>
              <Scan className="h-4 w-4" />
              <span>{isAr ? 'الماسح السريع (QR)' : 'Fast QR Scanner'}</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            disabled={initialRoster.length === 0}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>{isAr ? 'الكل حاضر' : 'Mark All Present'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={initialRoster.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{isAr ? 'حفظ الحضور' : 'Save Attendance'}</span>
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card p-4 rounded-xl border border-border">
        {/* Class Selector */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {isAr ? 'الفصل الدراسي' : 'Select Class'}
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="w-full sm:w-56 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{isAr ? 'التاريخ' : 'Date'}</span>
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{total}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'إجمالي الفصل' : 'Total Enrolled'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-emerald-600 dark:text-emerald-400">{presentCount}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'حاضر' : 'Present'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-amber-600 dark:text-amber-400">{lateCount}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'متأخر' : 'Late'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
            <XCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-rose-600 dark:text-rose-400">{absentCount}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'غائب' : 'Absent'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            %
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-primary">{rate}%</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'نسبة الحضور' : 'Attendance Rate'}</p>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                <th className="p-3 text-start">{isAr ? 'الكود' : 'Code'}</th>
                <th className="p-3 text-center">{isAr ? 'الحالة اليوم' : 'Status'}</th>
                <th className="p-3 text-start">{isAr ? 'ملاحظة (اختياري)' : 'Note (Optional)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialRoster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    <p className="text-base font-semibold">{isAr ? 'لا يوجد طلاب مسجلين في هذا الفصل' : 'No students enrolled in this class'}</p>
                    <p className="text-xs mt-1">
                      {isAr
                        ? 'انتقل لصفحة الطلاب لإضافة طلاب إلى هذا الفصل'
                        : 'Go to Students page to enroll students in this class'}
                    </p>
                  </td>
                </tr>
              ) : (
                initialRoster.map((s) => {
                  const stateItem = attendanceMap[s.id] || { status: s.currentStatus, note: s.currentNote }
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                              {getInitials(s.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{s.full_name}</p>
                            {s.phone && (
                              <p className="text-[11px] text-muted-foreground font-mono">{s.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="p-3 font-mono text-xs font-bold text-muted-foreground">
                        {s.student_code}
                      </td>

                      {/* 4 Status Toggle Buttons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex rounded-lg border border-border p-1 gap-1 bg-muted/40">
                          {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((st) => {
                            const config = STATUS_CONFIG[st]
                            const Icon = config.icon
                            const isSelected = stateItem.status === st
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setStudentStatus(s.id, st)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                                  isSelected
                                    ? config.activeClass
                                    : 'text-muted-foreground hover:bg-background/80'
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{isAr ? config.labelAr : config.labelEn}</span>
                              </button>
                            )
                          })}
                        </div>
                      </td>

                      {/* Note Input */}
                      <td className="p-3">
                        <Input
                          placeholder={isAr ? 'ملاحظة...' : 'Add a note...'}
                          value={stateItem.note}
                          onChange={(e) => setStudentNote(s.id, e.target.value)}
                          className="h-8 text-xs max-w-xs"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {initialRoster.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {isAr ? `${initialRoster.length} طالب في القائمة` : `${initialRoster.length} students on roster`}
            </span>
            <Button onClick={handleSave} loading={saving} className="gap-2">
              <Save className="h-4 w-4" />
              <span>{isAr ? 'حفظ سجل الحضور' : 'Save Attendance'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
