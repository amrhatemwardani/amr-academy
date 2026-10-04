import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { CalendarCheck, UserCheck, AlertTriangle, XCircle, Clock, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My Attendance' }

type AttendanceRecord = {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note: string | null
  className: string
}

export default async function StudentAttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)
  const isAr = locale === 'ar'

  const admin = await createAdminClient()

  // Fetch student attendance records with class names
  const { data: rawAttendance } = await (admin.from('attendance' as any) as any)
    .select(`
      id, date, status, note,
      classes ( name )
    `)
    .eq('student_id', user.id)
    .order('date', { ascending: false })

  const records: AttendanceRecord[] = ((rawAttendance as any[]) || []).map((r: any) => ({
    id: r.id,
    date: r.date,
    status: r.status,
    note: r.note,
    className: r.classes?.name || (isAr ? 'حصة دراسية' : 'Class Session'),
  }))

  // Calculate statistics
  const total = records.length
  const presentCount = records.filter((r) => r.status === 'present').length
  const lateCount    = records.filter((r) => r.status === 'late').length
  const absentCount  = records.filter((r) => r.status === 'absent').length
  const excusedCount = records.filter((r) => r.status === 'excused').length

  const attendanceRate = total > 0
    ? Math.round(((presentCount + lateCount) / total) * 100)
    : 100

  const statusConfig = {
    present: {
      label: isAr ? 'حاضر' : 'Present',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300',
    },
    late: {
      label: isAr ? 'متأخر' : 'Late',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300',
    },
    absent: {
      label: isAr ? 'غائب' : 'Absent',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300',
    },
    excused: {
      label: isAr ? 'معذور' : 'Excused',
      badgeClass: 'bg-muted text-muted-foreground border-border',
    },
  }

  return (
    <div className="space-y-6 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          {isAr ? 'سجل الحضور والغياب' : 'My Attendance'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAr ? 'متابعة سجل حضورك لكافة الحصص' : 'Track your session attendance history'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{isAr ? 'نسبة الحضور' : 'Attendance Rate'}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${
                attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {attendanceRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{isAr ? 'أيام الحضور' : 'Present'}</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{isAr ? 'تأخير' : 'Late'}</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{lateCount}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{isAr ? 'غياب' : 'Absent'}</p>
            <p className="text-2xl font-black text-red-600 mt-1">{absentCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Log List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>{isAr ? 'سجل الحصص' : 'Attendance Log'}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {total} {isAr ? 'حصة مسجلة' : 'sessions logged'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {isAr ? 'لا توجد سجلات حضور مسجلة بعد' : 'No attendance records logged yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {records.map((r) => {
                const conf = statusConfig[r.status] || statusConfig.present
                return (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{r.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {r.note && (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1 pt-0.5">
                          <Info className="h-3 w-3 shrink-0" />
                          <span>{r.note}</span>
                        </p>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${conf.badgeClass}`}>
                      {conf.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
