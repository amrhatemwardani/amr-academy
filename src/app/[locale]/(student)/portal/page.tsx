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
  CheckCircle2,
  TrendingUp,
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
  const isAr = locale === 'ar'
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
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Sunny Kindergarten / Elegant Deep Space Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 shadow-xl text-gray-950 dark:text-white border-2 border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-[#fff2b2] via-[#f6b407] to-[#e47364] dark:from-[#111726] dark:via-[#162137] dark:to-[#1d1e33] dark:shadow-[0_0_40px_rgba(247,185,28,0.06)]"
      >
        {/* Floating playful physics icons */}
        <div className="pointer-events-none select-none absolute top-4 end-6 text-3xl opacity-80 animate-bounce-apple">
          🍎
        </div>
        <div className="pointer-events-none select-none absolute bottom-4 end-16 text-2xl opacity-75 animate-orbit-slow">
          ⚛️
        </div>

        <div className="relative z-10 space-y-3">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md px-3.5 py-1 text-xs font-black text-gray-900 dark:text-amber-300 shadow-xs border border-transparent dark:border-amber-500/30">
              🔖 {student?.student_code ?? 'STUDENT'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold backdrop-blur-md shadow-xs ${
                student?.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {student?.status === 'active'
                ? isAr ? '✓ حساب نشط ومفعّل' : 'Active Account'
                : isAr ? 'معلق' : 'Inactive'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight leading-tight">
            {isAr ? `أهلاً بك يا ${user.fullName} 👋` : `Welcome back, ${user.fullName}! 👋`}
          </h1>

          <p className="text-xs sm:text-sm text-gray-900 dark:text-slate-300 font-medium max-w-lg leading-relaxed">
            {isAr
              ? 'أكاديمية م. عمرو حاتم — تابع واجباتك ونتائج امتحاناتك وكن دائماً في الصدارة!'
              : 'Eng. Amr Hatem Academy — Track tasks, exams and stay on top of the leaderboard!'}
          </p>

          {/* Quick Action Pills (Sprout 3D style) */}
          <div className="flex items-center gap-2.5 pt-2 flex-wrap">
            <Link
              href={`/${locale}/portal/leaderboard`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#151d2e] hover:bg-amber-50 dark:hover:bg-[#1d273e] text-xs font-black text-gray-900 dark:text-slate-100 border border-transparent dark:border-slate-700/60 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Trophy className="h-4 w-4 text-[#f6b407]" />
              <span>{isAr ? 'لوحة المتفوقين' : 'Hall of Fame'}</span>
            </Link>

            <Link
              href={`/${locale}/portal/id-card`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#151d2e] hover:bg-amber-50 dark:hover:bg-[#1d273e] text-xs font-black text-[#0050e3] dark:text-[#60a5fa] border border-transparent dark:border-slate-700/60 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <CreditCard className="h-4 w-4 text-[#0050e3] dark:text-[#60a5fa]" />
              <span>{isAr ? 'الكارنيه الذكي (ID)' : 'Digital ID'}</span>
            </Link>

            <Link
              href={`/${locale}/portal/tasks`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#0050e3] hover:bg-blue-700 text-xs font-black text-white shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <ClipboardList className="h-4 w-4 text-white" />
              <span>{isAr ? 'تسليم الواجبات' : 'My Tasks'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Streak & Upcoming Exam Alerts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Streak Widget (Warm Yellow/Orange) */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 dark:border-amber-500/30 bg-[#fff9e6] dark:bg-[#1a1710] shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6b407] text-white shadow-md text-2xl">
            🔥
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-black text-gray-950 dark:text-slate-100 block">
              {streak > 0
                ? isAr
                  ? `${streak} حصص متتالية بدون غياب!`
                  : `${streak}-Session Attendance Streak!`
                : isAr
                  ? 'ابدأ سلسلة حضورك اليوم!'
                  : 'Start your streak today!'}
            </span>
            <p className="text-xs text-gray-600 dark:text-slate-400 font-semibold mt-0.5">
              {streak >= 5
                ? isAr ? 'أداء أسطوري! استمر بنفس الحماس 🚀' : 'Legendary consistency! Keep it up!'
                : streak > 0
                  ? isAr ? 'التزامك بالحضور سر تفوقك الأكاديمي' : 'Your dedication leads to excellence'
                  : isAr ? 'احضر الحصص القادمة واصعد للوحة الشرف' : 'Attend classes to climb the leaderboard'}
            </p>
          </div>
        </div>

        {/* Upcoming Exam Countdown (Blue Card) */}
        {nextExam ? (
          <Link
            href={`/${locale}/portal/exams`}
            className="flex items-center gap-3.5 p-4 sm:p-5 rounded-3xl border-2 border-[#0050e3]/30 dark:border-blue-500/30 bg-[#e8f4ff] dark:bg-[#0c182c] shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0050e3] text-white shadow-md">
              <Timer className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-[#0050e3] dark:text-[#60a5fa] uppercase">
                {isAr ? 'الامتحان القادم' : 'Upcoming Exam'}
              </p>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">{nextExam.title}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-bold mt-0.5">
                {daysUntilExam === 0
                  ? isAr ? '⚡ موعد الامتحان اليوم!' : '⚡ Exam is today!'
                  : isAr ? `متبقي ${daysUntilExam} أيام` : `In ${daysUntilExam} days`}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#0050e3] dark:text-[#60a5fa] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0" />
          </Link>
        ) : (
          <Link
            href={`/${locale}/portal/resources`}
            className="flex items-center gap-3.5 p-4 sm:p-5 rounded-3xl border-2 border-emerald-300 dark:border-emerald-500/30 bg-[#e8fff8] dark:bg-[#081f19] shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00e2ae] text-gray-950 shadow-md">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-[#047857] dark:text-emerald-400 uppercase">
                {isAr ? 'المذكرات والمواد' : 'Study Materials'}
              </p>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                {isAr ? 'ملخصات وقوانين م. عمرو' : "Browse Eng. Amr's Summaries"}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-bold mt-0.5">
                {isAr ? 'أوراق وقوانين وروابط مباشرة' : 'PDF sheets & video links'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#047857] dark:text-emerald-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0" />
          </Link>
        )}
      </div>

      {/* ── Quick Action 4-Grid (Playful Weblium Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href={`/${locale}/portal/tasks`}
          className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-amber-200 dark:border-amber-500/25 bg-white dark:bg-[#101726] hover:bg-amber-50/60 dark:hover:bg-amber-950/20 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md text-center group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8e1] dark:bg-amber-950/40 text-[#f6b407] text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            📝
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-slate-100">{isAr ? 'الواجبات والمهام' : 'Tasks & HW'}</span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">{isAr ? 'تسليم الواجب' : 'Submit Work'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/resources`}
          className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-emerald-200 dark:border-emerald-500/25 bg-white dark:bg-[#101726] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md text-center group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8fff8] dark:bg-emerald-950/40 text-[#00e2ae] text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            📚
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-slate-100">{isAr ? 'المذكرات والملخصات' : 'Materials'}</span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">{isAr ? 'أوراق وقوانين' : 'Formula Sheets'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/calendar`}
          className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-blue-200 dark:border-blue-500/25 bg-white dark:bg-[#101726] hover:bg-blue-50/60 dark:hover:bg-blue-950/20 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md text-center group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4ff] dark:bg-blue-950/40 text-[#0050e3] text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            🗓️
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-slate-100">{isAr ? 'جدول الحصص' : 'Schedule'}</span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">{isAr ? 'المواعيد الأسبوعية' : 'Class Timetable'}</span>
        </Link>

        <Link
          href={`/${locale}/portal/messages`}
          className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-pink-200 dark:border-pink-500/25 bg-white dark:bg-[#101726] hover:bg-pink-50/60 dark:hover:bg-pink-950/20 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md text-center group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f5] dark:bg-pink-950/40 text-[#e51e6b] text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            💬
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-slate-100">{isAr ? 'مراسلة الأستاذ' : 'Ask Teacher'}</span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">{isAr ? 'م. عمرو حاتم' : 'Eng. Amr Hatem'}</span>
        </Link>
      </div>

      {/* ── Key Metrics (Kindergarten & Dark Luxury Style) ── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {/* Attendance KPI */}
        <div className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#101726] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {isAr ? 'نسبة الحضور' : 'Attendance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#e8fff8] dark:bg-emerald-950/50 flex items-center justify-center text-[#047857] dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 dark:text-white">{attendanceRate}%</div>
          <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-slate-400">
            {presentClasses} / {totalClasses} {isAr ? 'حصص حضور' : 'sessions'}
          </p>
        </div>

        {/* Exam Average KPI */}
        <div className="rounded-3xl border-2 border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#101726] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {isAr ? 'متوسط الدرجات' : 'Exam Average'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#e8f4ff] dark:bg-blue-950/50 flex items-center justify-center text-[#0050e3] dark:text-blue-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 dark:text-white">{averagePercentage}%</div>
          <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-slate-400">
            {totalExams} {isAr ? 'امتحانات مكتملة' : 'exams taken'}
          </p>
        </div>

        {/* Account Balance KPI */}
        <div className="col-span-2 sm:col-span-1 rounded-3xl border-2 border-amber-200 dark:border-amber-500/30 bg-white dark:bg-[#101726] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {isAr ? 'حالة المصروفات' : 'Tuition Status'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#fff8e1] dark:bg-amber-950/50 flex items-center justify-center text-[#c48b05] dark:text-amber-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 dark:text-white">
            {balance < 0
              ? `-${Math.abs(balance).toLocaleString()} EGP`
              : `${balance.toLocaleString()} EGP`}
          </div>
          <span
            className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
              balance < 0
                ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}
          >
            {balance < 0
              ? isAr ? 'مستحق السداد' : 'Payment Due'
              : isAr ? '✓ سليم ومسدد' : 'Settled'}
          </span>
        </div>
      </div>

      {/* ── Recent Exam Results ── */}
      <div className="rounded-[32px] border-2 border-amber-100 dark:border-slate-800 bg-white dark:bg-[#101726] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/80 mb-4">
          <h2 className="flex items-center gap-2 text-base font-black text-gray-900 dark:text-white">
            <Award className="h-5 w-5 text-[#f6b407]" />
            <span>{isAr ? 'أحدث نتائج الامتحانات' : 'Recent Exam Results'}</span>
          </h2>
          <Link
            href={`/${locale}/portal/exams`}
            className="text-xs font-bold text-[#0050e3] dark:text-[#60a5fa] hover:underline"
          >
            {isAr ? 'عرض الكل ←' : 'View all →'}
          </Link>
        </div>

        {examResults.length > 0 ? (
          <div className="space-y-3">
            {examResults.map((result) => (
              <div
                key={result.attempt_id}
                className="flex items-center justify-between rounded-2xl bg-[#fcf6f3] dark:bg-[#151c2b] p-3.5 border border-[#eddcd6] dark:border-slate-800 transition-colors hover:bg-amber-50/50 dark:hover:bg-slate-800/60"
              >
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                    {isAr ? 'اختبار تقييم فيزيائي' : 'Physics Exam'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-bold mt-0.5">
                    {result.published_at
                      ? new Date(result.published_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-sm font-black text-gray-900 dark:text-slate-100">
                    {result.score} / {result.total}
                  </div>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-black ${
                      result.passed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                    }`}
                  >
                    {result.percentage}% {result.passed ? (isAr ? '✓ ناجح' : '✓ Pass') : (isAr ? '✗ راسب' : '✗ Fail')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm font-bold text-gray-400 dark:text-slate-500">
            {isAr ? 'لا توجد نتائج امتحانات منشورة حتى الآن.' : 'No exam results available yet.'}
          </p>
        )}
      </div>

      {/* ── Recent Attendance Log ── */}
      <div className="rounded-[32px] border-2 border-emerald-100 dark:border-slate-800 bg-white dark:bg-[#101726] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/80 mb-4">
          <h2 className="flex items-center gap-2 text-base font-black text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 text-[#00e2ae]" />
            <span>{isAr ? 'سجل الحضور الأخير' : 'Recent Attendance Log'}</span>
          </h2>
          <Link
            href={`/${locale}/portal/attendance`}
            className="text-xs font-bold text-[#0050e3] dark:text-[#60a5fa] hover:underline"
          >
            {isAr ? 'عرض السجل كامل ←' : 'Full log →'}
          </Link>
        </div>

        {attendance.length > 0 ? (
          <div className="space-y-3">
            {attendance.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-2xl bg-[#fcf6f3] dark:bg-[#151c2b] p-3.5 border border-[#eddcd6] dark:border-slate-800 transition-colors hover:bg-emerald-50/50 dark:hover:bg-slate-800/60"
              >
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                    {isAr ? 'حصة دراسية بالجدول' : 'Class Session'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-bold mt-0.5">
                    {new Date(att.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    att.status === 'present'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : att.status === 'late'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                  }`}
                >
                  {att.status === 'present'
                    ? (isAr ? '✓ حاضر' : 'Present')
                    : att.status === 'late'
                    ? (isAr ? 'متأخر' : 'Late')
                    : (isAr ? 'غائب' : 'Absent')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm font-bold text-gray-400 dark:text-slate-500">
            {isAr ? 'لا يوجد سجل حضور مسجل بعد.' : 'No attendance records yet.'}
          </p>
        )}
      </div>
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
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      }
    >
      <StudentDashboardContent locale={locale} />
    </Suspense>
  )
}
