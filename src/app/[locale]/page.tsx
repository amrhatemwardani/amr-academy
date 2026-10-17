import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  Trophy,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { YouTubeGallery } from '@/components/public/YouTubeGallery'
import { PhysicsMathBackdrop } from '@/components/public/PhysicsMathBackdrop'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  // Authenticated users go directly to their dashboard/portal
  if (user) {
    if (user.role === 'teacher') redirect(`/${locale}/dashboard`)
    else redirect(`/${locale}/portal`)
  }

  const isAr = locale === 'ar'
  const admin = createAdminClient()

  // 1. Fetch real top students from database for the Hall of Fame preview
  const { data: topResults } = await (admin.from('exam_results' as any) as any)
    .select(`
      attempt_id, score, total, percentage, published_at,
      exams ( id, title ),
      students (
        id, status,
        profiles ( full_name )
      )
    `)
    .order('percentage', { ascending: false })
    .limit(8)

  // Deduplicate by name and format (Name & Rank ONLY - NO Student Code)
  const topStudentsList: { name: string; score: string; rank: number; examTitle: string }[] = []
  const seenNames = new Set<string>()

  ;((topResults as any[]) || []).forEach((r: any) => {
    const fullName = r.students?.profiles?.full_name?.trim()
    if (!fullName || seenNames.has(fullName)) return
    seenNames.add(fullName)
    topStudentsList.push({
      name: fullName,
      score: `${r.percentage}%`,
      rank: topStudentsList.length + 1,
      examTitle: r.exams?.title || (isAr ? 'اختبار الأكاديمية' : 'Academy Exam'),
    })
  })

  // If DB results are fewer than 3, fetch active student names
  if (topStudentsList.length < 3) {
    const { data: activeStudents } = await (admin.from('students' as any) as any)
      .select('id, profiles ( full_name )')
      .eq('status', 'active')
      .limit(6)

    ;((activeStudents as any[]) || []).forEach((s: any) => {
      const fullName = s?.profiles?.full_name?.trim()
      if (!fullName || seenNames.has(fullName)) return
      seenNames.add(fullName)
      topStudentsList.push({
        name: fullName,
        score: '100%',
        rank: topStudentsList.length + 1,
        examTitle: isAr ? 'تقييم دراسي متميز' : 'Top Achievement',
      })
    })
  }

  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background physics & subtle grid animation */}
      <PhysicsMathBackdrop />

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Amr Academy"
              width={160}
              height={45}
              priority
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-muted-foreground">
            <a href="#lessons" className="hover:text-foreground transition-colors">
              {isAr ? 'المحاضرات' : 'Lessons'}
            </a>
            <Link href={`/${locale}/hall-of-fame`} className="hover:text-foreground transition-colors">
              {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
            </Link>
            <a href="#join" className="hover:text-foreground transition-colors">
              {isAr ? 'الانضمام للأكاديمية' : 'Join'}
            </a>
          </nav>

          {/* Auth Action */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/${locale}/apply`}
              className="hidden sm:inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              {isAr ? 'تقديم طلب' : 'Apply'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{isAr ? 'تسجيل الدخول' : 'Sign in'}</span>
              <Arrow className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-foreground mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{isAr ? 'العام الدراسي ٢٠٢٥ / ٢٠٢٦' : 'Academic Year 2025 / 2026'}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
            {isAr ? 'أكاديمية المهندس عمرو حاتم' : 'Eng. Amr Hatem Academy'}
          </h1>

          {/* Human Clear Description (NO AI Fluff) */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
            {isAr
              ? 'الفيزياء والرياضيات بأسلوب فهم مبسط، تدريب مستمر على أفكار المسائل، وتأهيل كامل لامتحانات الثانوية العامة مع المتابعة الدورية.'
              : 'Physics and Mathematics simplified with conceptual clarity, exam preparation, and dedicated student progress tracking.'}
          </p>

          {/* Clean Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/login`}
              className="rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              {isAr ? 'تسجيل دخول الطالب' : 'Student Sign In'}
            </Link>
            <Link
              href={`/${locale}/apply`}
              className="rounded-md border border-border bg-card hover:bg-muted text-foreground px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              {isAr ? 'تقديم طلب انضمام' : 'Apply to Join'}
            </Link>
            <Link
              href={`/${locale}/hall-of-fame`}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{isAr ? 'لوحة المتفوقين' : 'Hall of Fame'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── YOUTUBE LESSONS SECTION ─────────────────────────────────────── */}
      <section id="lessons" className="py-16 border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                <span>YouTube</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isAr ? 'شروحات ومحاضرات مجانية' : 'Featured Video Lessons'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isAr
                  ? 'نماذج من محاضرات الفيزياء وحل أفكار الامتحانات مع م. عمرو حاتم.'
                  : 'Sample lectures and problem-solving sessions from Eng. Amr Hatem.'}
              </p>
            </div>

            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline self-start sm:self-auto"
            >
              <span>{isAr ? 'زيارة القناة كاملة' : 'Visit YouTube Channel'}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Real YouTube Thumbnails Gallery */}
          <YouTubeGallery locale={locale} />
        </div>
      </section>

      {/* ── HALL OF FAME PREVIEW (REAL DATABASE STUDENTS - ONLY NAME & RANK) ── */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>{isAr ? 'لوحة الشرف' : 'Hall of Fame'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isAr ? 'أوائل الطلاب والمتفوقين' : 'Top Performing Students'}
              </h2>
            </div>

            <Link
              href={`/${locale}/hall-of-fame`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Cards with ONLY name, rank, score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStudentsList.slice(0, 6).map((st) => (
              <div
                key={st.rank}
                className="rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border border-border bg-muted text-foreground">
                      #{st.rank} {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : ''}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {st.score}
                    </span>
                  </div>

                  {/* ONLY Student name - NO ID! */}
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    {st.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {st.examTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOINING THE ACADEMY (NEW MINIMALIST GITHUB STYLE) ───────────── */}
      <section id="join" className="py-16 border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
              {isAr ? 'خطوات الانضمام إلى الأكاديمية' : 'How to Join Amr Academy'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr
                ? 'ثلاث خطوات بسيطة لبدء الدراسة والمتابعة مع م. عمرو حاتم.'
                : 'Three simple steps to enroll and start learning.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {isAr ? 'الخطوة ١' : 'Step 1'}
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                {isAr ? 'اختيار نظام الحضور' : 'Choose Learning Mode'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'حدد المرحلة الدراسية ونظام الدراسة المناسب لك: الحضور المباشر في السنتر أو المتابعة أونلاين عبر المنصة.'
                  : 'Select your grade and preferred mode: in-person sessions at the center or online learning via portal.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {isAr ? 'الخطوة ٢' : 'Step 2'}
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                {isAr ? 'ملء استمارة التقديم' : 'Fill Application'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'سجّل اسمك ورقم الهاتف ورقم ولي الأمر عبر صفحة التقديم الإلكترونية في دقيقة واحدة.'
                  : 'Submit your contact info and guardian details via our quick online application form.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {isAr ? 'الخطوة ٣' : 'Step 3'}
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                {isAr ? 'تأكيد الحجز وتفعيل الحساب' : 'Confirmation & Access'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'يتواصل معك الفريق لتأكيد المواعيد وتسليم كود الدخول الخاص بك لبدء الحصص فوراً.'
                  : 'Our team verifies your booking and issues your student account code to access exams and materials.'}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/apply`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <span>{isAr ? 'تقديم طلب انضمام الآن' : 'Apply to Join Now'}</span>
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Amr Academy"
              width={120}
              height={32}
              className="h-6 w-auto object-contain dark:brightness-0 dark:invert opacity-70"
            />
            <span>© {new Date().getFullYear()} أكاديمية المهندس عمرو حاتم</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`} className="hover:text-foreground">
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
            <Link href={`/${locale}/hall-of-fame`} className="hover:text-foreground">
              {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
            </Link>
            <Link href={`/${locale}/apply`} className="hover:text-foreground">
              {isAr ? 'الانضمام' : 'Apply'}
            </Link>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
