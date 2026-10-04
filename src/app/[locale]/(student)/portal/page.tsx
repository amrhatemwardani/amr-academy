import { Suspense } from 'react'
import Link from 'next/link'
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getTranslations } from 'next-intl/server'
import {
  UserCheck,
  Award,
  Wallet,
  Clock,
  Trophy,
  CreditCard,
  Sparkles,
  Flame,
  Calendar,
  ClipboardList,
  BookMarked,
  MessageSquare,
  ChevronRight,
  Timer,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nav' })
  return {
    title: t('portal'),
  }
}

// ── Type helpers ────────────────────────────────────────────────────────────

type AttendanceRow = {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  class_id: string
}

type ExamResultRow = {
  attempt_id: string
  exam_id: string
  score: number
  total: number
  percentage: number
  passed: boolean
  published_at: string | null
}

type StudentRow = {
  student_code: string
  status: 'active' | 'inactive' | 'archived'
}

type BalanceRow = {
  balance: number
}

// ── Dashboard Data Component ─────────────────────────────────────────────────

async function StudentDashboardContent({ locale }: { locale: string }) {
  const user = await requireStudent(locale)
  const supabase = await createClient()

  // Fetch student info
  const { data: student } = await supabase
    .from('students')
    .select('student_code, status')
    .eq('id', user.id)
    .single() as { data: StudentRow | null; error: unknown }

  // Fetch student balance from view
  const { data: balanceData } = await supabase
    .from('student_balances')
    .select('balance')
    .eq('student_id', user.id)
    .single() as { data: BalanceRow | null; error: unknown }

  // Fetch recent attendance (last 20 for streak calculation)
  const { data: rawAttendance } = await supabase
    .from('attendance')
    .select('id, date, status, class_id')
    .eq('student_id', user.id)
    .order('date', { ascending: false })
    .limit(20) as { data: AttendanceRow[] | null; error: unknown }

  const attendance = rawAttendance ?? []

  // Calculate streak of consecutive present sessions
  let streak = 0
  for (const att of attendance) {
    if (att.status === 'present') streak++
    else break
  }

  // Fetch published exam results (last 5)
  const { data: rawResults } = await supabase
    .from('exam_results')
    .select('attempt_id, exam_id, score, total, percentage, passed, published_at')
    .eq('student_id', user.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5) as { data: ExamResultRow[] | null; error: unknown }

  const examResults = rawResults ?? []

  // Fetch upcoming exam
  const { data: rawUpcomingExams } = await supabase
    .from('exams')
    .select('id, title, opens_at, duration_mins, classes ( name )')
    .gt('opens_at', new Date().toISOString())
    .order('opens_at', { ascending: true })
    .limit(1) as { data: any[] | null; error: unknown }

  const nextExam = rawUpcomingExams && rawUpcomingExams[0] ? rawUpcomingExams[0] : null

  // Calculate days until next exam
  let daysUntilExam: number | null = null
  if (nextExam?.opens_at) {
    const diffMs = new Date(nextExam.opens_at).getTime() - Date.now()
    daysUntilExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }

  // ── Compute metrics ────────────────────────────────────────────────────────
  const totalClasses = attendance.length
  const presentClasses = attendance.filter(a => a.status === 'present').length
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100

  const totalExams = examResults.length
  const averagePercentage =
    totalExams > 0
      ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / totalExams)
      : 0

  const balance = balanceData?.balance ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              {student?.student_code ?? 'STUDENT'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md ${
                student?.status === 'active'
                  ? 'bg-emerald-500/40 text-emerald-100'
                  : 'bg-red-500/40 text-red-100'
              }`}
            >
              {student?.status === 'active' ? (locale === 'ar' ? 'حساب نشط' : 'Active') : (locale === 'ar' ? 'معلق' : 'Inactive')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {locale === 'ar'
              ? `مرحباً، ${user.fullName}`
              : `Welcome back, ${user.fullName}!`}
          </h1>
          <p className="text-sm text-indigo-100/90">
            {locale === 'ar'
              ? 'أكاديمية م. عمرو حاتم — تابع حضورك، واجباتك، وتفوقك الأكاديمي.'
              : 'Eng. Amr Hatem Academy — Track attendance, assignments, and academic excellence.'}
          </p>

          {/* Quick Action Pills */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Link
              href={`/${locale}/portal/leaderboard`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold text-white transition-colors"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              <span>{locale === 'ar' ? 'لوحة المتفوقين' : 'Hall of Fame'}</span>
            </Link>

            <Link
              href={`/${locale}/portal/id-card`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold text-white transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-200" />
              <span>{locale === 'ar' ? 'الكارنيه الذكي (ID)' : 'Digital ID'}</span>
            </Link>

            <Link
              href={`/${locale}/portal/tasks`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 backdrop-blur-md text-xs font-semibold text-amber-200 transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5 text-amber-300" />
              <span>{locale === 'ar' ? 'تسليم الواجبات' : 'My Tasks'}</span>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Streak & Upcoming Exam Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Streak Widget */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-200 dark:border-orange-900/40 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {streak > 0
                  ? locale === 'ar'
                    ? `${streak} حصص متتالية بدون غياب!`
                    : `${streak}-Session Attendance Streak!`
                  : locale === 'ar'
                  ? 'ابدأ سلسلة حضورك اليوم!'
                  : 'Start your streak today!'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {streak >= 5
                ? locale === 'ar' ? '🔥 أداء أسطوري! حافظ على استمرارك!' : '🔥 Legendary consistency! Keep it up!'
                : streak > 0
                ? locale === 'ar' ? 'التزامك بالحضور سر تفوقك الأكاديمي' : 'Your dedication leads to excellence'
                : locale === 'ar' ? 'احضر كل الحصص لترتفع في لوحة الشرف' : 'Attend all classes to climb the leaderboard'}
            </p>
          </div>
        </div>

        {/* Upcoming Exam Countdown */}
        {nextExam ? (
          <Link
            href={`/${locale}/portal/exams`}
            className="flex items-center gap-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
              <Timer className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {locale === 'ar' ? 'الامتحان القادم' : 'Upcoming Exam'}
              </p>
              <p className="text-sm font-bold text-foreground truncate">{nextExam.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysUntilExam === 0
                  ? locale === 'ar' ? '⚡ موعد الامتحان اليوم!' : '⚡ Exam is today!'
                  : locale === 'ar' ? `متبقي ${daysUntilExam} أيام` : `In ${daysUntilExam} days`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ) : (
          <Link
            href={`/${locale}/portal/resources`}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {locale === 'ar' ? 'المذكرات والمواد' : 'Study Materials'}
              </p>
              <p className="text-sm font-bold text-foreground">
                {locale === 'ar' ? 'تصفح ملخصات وفيديوهات م. عمرو' : "Browse Eng. Amr's Summaries"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === 'ar' ? 'ملفات PDF وروابط مباشرة' : 'PDF sheets & video links'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href={`/${locale}/portal/tasks`}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-105 transition-transform">
            <ClipboardList className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">{locale === 'ar' ? 'الواجبات والمهام' : 'Tasks & HW'}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{locale === 'ar' ? 'تسليم الواجب' : 'Submit Work'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/resources`}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
            <BookMarked className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">{locale === 'ar' ? 'المذكرات والملخصات' : 'Materials'}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{locale === 'ar' ? 'أوراق وقوانين' : 'Formula Sheets'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/calendar`}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">{locale === 'ar' ? 'جدول الحصص' : 'Schedule'}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{locale === 'ar' ? 'المواعيد الأسبوعية' : 'Class Timetable'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/messages`}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">{locale === 'ar' ? 'مراسلة الأستاذ' : 'Ask Teacher'}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{locale === 'ar' ? 'م. عمرو حاتم' : 'Eng. Amr Hatem'}</span>
        </Link>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{attendanceRate}%</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {presentClasses} / {totalClasses}{' '}
              {locale === 'ar' ? 'حصص' : 'sessions'}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === 'ar' ? 'متوسط الدرجات' : 'Exam Average'}
            </CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{averagePercentage}%</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {totalExams} {locale === 'ar' ? 'امتحانات' : 'exams taken'}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 border shadow-sm sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === 'ar' ? 'الرصيد المالي' : 'Account Balance'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {balance < 0
                ? `-${Math.abs(balance).toLocaleString()} EGP`
                : `${balance.toLocaleString()} EGP`}
            </div>
            <Badge
              variant={balance < 0 ? 'destructive' : 'secondary'}
              className="mt-1 text-[10px]"
            >
              {balance < 0
                ? locale === 'ar'
                  ? 'مستحق الدفع'
                  : 'Payment Due'
                : locale === 'ar'
                ? 'مستقر'
                : 'Settled'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exam Results */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Award className="h-5 w-5 text-indigo-600" />
            {locale === 'ar' ? 'أحدث نتائج الامتحانات' : 'Recent Exam Results'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examResults.length > 0 ? (
            <div className="space-y-3">
              {examResults.map((result) => (
                <div
                  key={result.attempt_id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {locale === 'ar' ? 'امتحان' : 'Exam'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.published_at
                        ? new Date(result.published_at).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {result.score} / {result.total}
                    </div>
                    <Badge
                      variant={result.passed ? 'default' : 'destructive'}
                      className="text-[10px]"
                    >
                      {result.percentage}%{' '}
                      {result.passed
                        ? locale === 'ar'
                          ? '✓ ناجح'
                          : '✓ Pass'
                        : locale === 'ar'
                        ? '✗ راسب'
                        : '✗ Fail'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'لا توجد امتحانات حتى الآن.'
                : 'No exam results available yet.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-5 w-5 text-indigo-600" />
            {locale === 'ar' ? 'سجل الحضور الأخير' : 'Recent Attendance Log'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {locale === 'ar' ? 'حصة دراسية' : 'Class Session'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(att.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      att.status === 'present'
                        ? 'default'
                        : att.status === 'late'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="capitalize text-xs"
                  >
                    {att.status === 'present'
                      ? (locale === 'ar' ? 'حاضر' : 'Present')
                      : att.status === 'late'
                      ? (locale === 'ar' ? 'متأخر' : 'Late')
                      : (locale === 'ar' ? 'غائب' : 'Absent')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'لا يوجد سجل حضور حتى الآن.'
                : 'No attendance records yet.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      }
    >
      <StudentDashboardContent locale={locale} />
    </Suspense>
  )
}
