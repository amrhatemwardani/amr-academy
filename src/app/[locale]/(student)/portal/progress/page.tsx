import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTranslations } from 'next-intl/server'
import {
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  BarChart3,
  Star,
  Medal,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'تقرير الأداء الأكاديمي' : 'Academic Progress Report',
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const user = await requireStudent(locale)
  const supabase = await createClient()

  // Fetch all attendance
  const { data: rawAttendance } = await supabase
    .from('attendance')
    .select('id, date, status, class_id')
    .eq('student_id', user.id)
    .order('date', { ascending: false })
    .limit(60) as { data: AttendanceRow[] | null; error: unknown }

  const attendance = rawAttendance ?? []

  // Fetch all published exam results
  const { data: rawResults } = await supabase
    .from('exam_results')
    .select('attempt_id, exam_id, score, total, percentage, passed, published_at')
    .eq('student_id', user.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(30) as { data: ExamResultRow[] | null; error: unknown }

  const examResults = rawResults ?? []

  // ── Attendance stats ────────────────────────────────────────────────────────
  const total = attendance.length
  const present = attendance.filter((a) => a.status === 'present').length
  const late = attendance.filter((a) => a.status === 'late').length
  const absent = attendance.filter((a) => a.status === 'absent').length
  const excused = attendance.filter((a) => a.status === 'excused').length
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 100

  // Streak calculation (consecutive present days)
  let streak = 0
  for (const rec of attendance) {
    if (rec.status === 'present') streak++
    else break
  }

  // ── Exam stats ──────────────────────────────────────────────────────────────
  const totalExams = examResults.length
  const passed = examResults.filter((r) => r.passed).length
  const failed = totalExams - passed
  const averagePercentage =
    totalExams > 0
      ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / totalExams)
      : 0
  const highestScore = totalExams > 0 ? Math.max(...examResults.map((r) => r.percentage)) : 0
  const lowestScore = totalExams > 0 ? Math.min(...examResults.map((r) => r.percentage)) : 0

  // ── Overall grade letter ────────────────────────────────────────────────────
  const overallScore = totalExams > 0
    ? Math.round((averagePercentage * 0.6) + (attendanceRate * 0.4))
    : attendanceRate

  const gradeLetter =
    overallScore >= 95 ? 'A+' :
    overallScore >= 90 ? 'A' :
    overallScore >= 85 ? 'A-' :
    overallScore >= 80 ? 'B+' :
    overallScore >= 75 ? 'B' :
    overallScore >= 70 ? 'B-' :
    overallScore >= 65 ? 'C+' :
    overallScore >= 60 ? 'C' :
    overallScore >= 55 ? 'D' : 'F'

  const gradeColor =
    overallScore >= 90 ? 'text-emerald-500' :
    overallScore >= 75 ? 'text-blue-500' :
    overallScore >= 60 ? 'text-amber-500' : 'text-red-500'

  const gradeMessage = isAr
    ? overallScore >= 90 ? 'أداء ممتاز! استمر هكذا!' :
      overallScore >= 75 ? 'أداء جيد جداً! يمكنك التحسين أكثر.' :
      overallScore >= 60 ? 'أداء مقبول. حاول التركيز أكثر.' :
      'تحتاج إلى مجهود مضاعف. تواصل مع م. عمرو للمساعدة.'
    : overallScore >= 90 ? 'Outstanding performance! Keep it up!' :
      overallScore >= 75 ? 'Very good! There\'s still room to improve.' :
      overallScore >= 60 ? 'Acceptable. Try to focus more.' :
      'Needs extra effort. Contact Eng. Amr for help.'

  // Last 10 attendance mini-chart
  const last10 = [...attendance].slice(0, 10).reverse()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-200" />
            <span className="text-sm font-semibold text-blue-100">
              {isAr ? 'تقرير الأداء الأكاديمي' : 'Academic Progress Report'}
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {isAr ? `مرحباً ${user.fullName}` : `Hello, ${user.fullName}`}
          </h1>
          <p className="mt-1 text-sm text-blue-100/80">
            {isAr
              ? 'تابع تقدمك الأكاديمي، نسبة حضورك، وأداءك في الامتحانات.'
              : 'Track your academic progress, attendance rate, and exam performance.'}
          </p>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Overall Grade Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="flex items-center gap-6 p-6">
          <div className="flex flex-col items-center justify-center">
            <div className={`text-6xl font-black ${gradeColor}`}>{gradeLetter}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? 'التقدير العام' : 'Overall Grade'}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isAr ? 'النتيجة الإجمالية' : 'Overall Score'}
                </span>
                <span className="font-bold">{overallScore}%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overallScore >= 90 ? 'bg-emerald-500' :
                    overallScore >= 75 ? 'bg-blue-500' :
                    overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{gradeMessage}</p>

            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500">
                <Flame className="h-4 w-4" />
                {isAr ? `${streak} حصص متتالية حضور` : `${streak}-session attendance streak`}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{attendanceRate}%</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'نسبة الحضور' : 'Attendance'}
          </p>
        </Card>
        <Card className="border shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{averagePercentage}%</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'متوسط الامتحانات' : 'Exam Avg'}
          </p>
        </Card>
        <Card className="border shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-foreground">{highestScore}%</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'أعلى درجة' : 'Best Score'}
          </p>
        </Card>
        <Card className="border shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <Target className="h-6 w-6 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{passed}/{totalExams}</p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'ناجح/إجمالي' : 'Passed/Total'}
          </p>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-indigo-500" />
            {isAr ? 'تفاصيل الحضور' : 'Attendance Breakdown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            {[
              { label: isAr ? 'حاضر' : 'Present', count: present, color: 'bg-emerald-500' },
              { label: isAr ? 'متأخر' : 'Late', count: late, color: 'bg-amber-500' },
              { label: isAr ? 'غائب' : 'Absent', count: absent, color: 'bg-red-500' },
              { label: isAr ? 'بعذر' : 'Excused', count: excused, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div>
                  <p className="text-base font-bold text-foreground">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini attendance chart (last 10) */}
          {last10.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {isAr ? 'آخر ١٠ حصص' : 'Last 10 Sessions'}
              </p>
              <div className="flex gap-1.5">
                {last10.map((a) => (
                  <div
                    key={a.id}
                    title={`${a.date}: ${a.status}`}
                    className={`h-8 flex-1 rounded-md ${
                      a.status === 'present' ? 'bg-emerald-500' :
                      a.status === 'late' ? 'bg-amber-400' :
                      a.status === 'excused' ? 'bg-blue-400' : 'bg-red-400'
                    }`}
                  />
                ))}
                {last10.length < 10 && Array.from({ length: 10 - last10.length }).map((_, i) => (
                  <div key={i} className="h-8 flex-1 rounded-md bg-muted" />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />{isAr ? 'حاضر' : 'Present'}</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />{isAr ? 'متأخر' : 'Late'}</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" />{isAr ? 'غائب' : 'Absent'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Results History */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Medal className="h-4 w-4 text-amber-500" />
            {isAr ? 'سجل الامتحانات' : 'Exam History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examResults.length > 0 ? (
            <div className="space-y-3">
              {examResults.map((result, idx) => (
                <div
                  key={result.attempt_id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    result.percentage >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    result.percentage >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                    result.percentage >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {isAr ? 'امتحان' : 'Exam'} #{idx + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.published_at ? new Date(result.published_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      {result.score}/{result.total}
                    </div>
                    <Badge
                      variant={result.passed ? 'default' : 'destructive'}
                      className="text-[10px]"
                    >
                      {result.percentage}% {result.passed ? '✓' : '✗'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Award className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isAr ? 'لا توجد نتائج امتحانات بعد.' : 'No exam results yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational Footer */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-5 text-center">
        <Flame className="mx-auto mb-2 h-8 w-8 text-orange-500" />
        <p className="text-sm font-bold text-foreground">
          {isAr ? 'استمر في التميز!' : 'Keep up the excellence!'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAr
            ? 'م. عمرو حاتم يؤمن بك. تواصل معه على واتساب لأي استفسار.'
            : 'Eng. Amr Hatem believes in you. Contact him on WhatsApp for any questions.'}
        </p>
        <a
          href="https://wa.me/201012006316"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          +201012006316
        </a>
      </div>
    </div>
  )
}
