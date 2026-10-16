import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Trophy,
  CheckCircle,
  Star,
  Users,
  Zap,
  Shield,
  MessageSquare,
  BarChart3,
  Youtube,
  Phone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  // Authenticated users skip the landing and go directly to their dashboard/portal
  if (user) {
    if (user.role === 'teacher') redirect(`/${locale}/dashboard`)
    else redirect(`/${locale}/portal`)
  }

  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const features = [
    {
      icon: BookOpen,
      titleEn: 'Physics & Math Digital Classes',
      titleAr: 'حصص الفيزياء والرياضيات التفاعلية',
      descEn: 'Structured curriculums, lesson notes, and recorded explanations.',
      descAr: 'مناهج منظمة، مذكرات الدروس، وشروحات مسجلة لكافة المستويات.',
      color: 'bg-primary text-primary-foreground',
    },
    {
      icon: Zap,
      titleEn: 'QR Code Attendance',
      titleAr: 'تسجيل الحضور بالباركود السريع',
      descEn: 'Instant attendance via QR scan — accurate records with zero wasted time.',
      descAr: 'حضور ذكي وفوري عبر مسح QR — تقارير دقيقة بدون تضييع وقت الحصة.',
      color: 'bg-secondary text-secondary-foreground',
    },
    {
      icon: Trophy,
      titleEn: 'Leaderboard & Hall of Fame',
      titleAr: 'لوحة الشرف وتكريم المتفوقين',
      descEn: 'Motivate students with live rankings, badges, and academic achievements.',
      descAr: 'تحفيز مستمر للطلاب من خلال لوحة المتفوقين والأوسمة والشهادات.',
      color: 'bg-[#F2B134] text-[#0F2A4A]',
    },
    {
      icon: BarChart3,
      titleEn: 'Question Bank & Auto-Exams',
      titleAr: 'بنك أسئلة وامتحانات فورية',
      descEn: 'Smart tests with categorized questions by unit, difficulty, and instant grading.',
      descAr: 'امتحانات تدريبية وإلكترونية مصنفة حسب الوحدات ومستويات الصعوبة.',
      color: 'bg-primary text-primary-foreground',
    },
    {
      icon: Shield,
      titleEn: 'Digital Student ID Card',
      titleAr: 'كارنيه الطالب الذكي',
      descEn: 'Digital student identification with QR code for classroom entry.',
      descAr: 'كارنيه رقمي متطور لكل طالب مزود برمز QR للتحقق السريع.',
      color: 'bg-secondary text-secondary-foreground',
    },
    {
      icon: MessageSquare,
      titleEn: 'Direct Teacher Communication',
      titleAr: 'متابعة مباشرة مع أولياء الأمور',
      descEn: 'Immediate updates on grades, homework submissions, and attendance.',
      descAr: 'إشعارات وتقارير دورية لأولياء الأمور عن الحضور والدرجات عبر واتساب.',
      color: 'bg-[#F2B134] text-[#0F2A4A]',
    },
  ]

  const stats = [
    { numEn: '500+', numAr: '+٥٠٠', labelEn: 'Students Enrolled', labelAr: 'طالب وطالبة' },
    { numEn: '98%', numAr: '٩٨٪', labelEn: 'Exam Pass Rate', labelAr: 'نسبة التفوق والنجاح' },
    { numEn: '4.9★', numAr: '٤٫٩★', labelEn: 'Parent & Student Rating', labelAr: 'تقييم الطلاب وأولياء الأمور' },
    { numEn: '10+', numAr: '+١٠', labelEn: 'Years Experience', labelAr: 'سنوات خبرة تعليمية' },
  ]

  return (
    <div className={`min-h-screen bg-background ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ── NAV BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={200}
              height={56}
              priority
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}/login`}
              className="rounded-xl border border-border px-4 py-2 text-xs sm:text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <a
              href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك%20في%20الأكاديمية"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-[1.02]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{isAr ? 'تواصل معنا' : 'WhatsApp'}</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#07172B] via-[#0F2A4A] to-[#0A1D33] py-20 sm:py-28 text-white">
        {/* Subtle Physics & Math Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
            <ellipse cx="80%" cy="40%" rx="260" ry="90" fill="none" stroke="#F2B134" strokeWidth="2" transform="rotate(25 500 250)" />
            <ellipse cx="80%" cy="40%" rx="260" ry="90" fill="none" stroke="#14A3A3" strokeWidth="2" transform="rotate(-35 500 250)" />
          </svg>
        </div>

        {/* Ambient brand glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#14A3A3]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#F2B134]/20 blur-3xl" />

        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F2B134]/30 bg-[#F2B134]/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#F2B134] backdrop-blur">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'أكاديمية الفيزياء والرياضيات — م. عمرو حاتم' : 'Physics & Mathematics Academy — Eng. Amr Hatem'}</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-white">
            {isAr ? (
              <>
                <span>تأسيس وفهم وتفوق دراسي مع</span>
                <br />
                <span className="bg-gradient-to-r from-[#F2B134] via-[#FCE38A] to-[#14A3A3] bg-clip-text text-transparent">
                  م. عمرو حاتم
                </span>
              </>
            ) : (
              <>
                <span>Empowering Excellence with</span>
                <br />
                <span className="bg-gradient-to-r from-[#F2B134] via-[#FCE38A] to-[#14A3A3] bg-clip-text text-transparent">
                  Eng. Amr Hatem
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg text-slate-200/90 leading-relaxed">
            {isAr
              ? 'المنظومة التعليمية الرقمية المتكاملة لمتابعة الحصص، بنك الأسئلة، الامتحانات الإلكترونية، ونسب الحضور بدقة واحترافية.'
              : 'A complete academic platform for interactive physics & math learning, auto-graded exams, attendance, and instant progress reports.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك%20في%20الأكاديمية"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#F2B134] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0F2A4A] shadow-lg shadow-[#F2B134]/20 transition-all hover:bg-[#F2B134]/90 hover:scale-[1.02]"
            >
              <Phone className="h-4 w-4" />
              <span>{isAr ? 'اشترك عبر واتساب الآن' : 'Enroll via WhatsApp'}</span>
            </a>
            <Link
              href={`/${locale}/login`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-3.5 text-sm sm:text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/40"
            >
              <Users className="h-4 w-4" />
              <span>{isAr ? 'دخول بوابة الطلاب والمعلمين' : 'Sign In to Portal'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/40">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.labelEn} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-foreground">{isAr ? s.numAr : s.numEn}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {isAr ? s.labelAr : s.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              {isAr ? 'مميزات المنظومة التعليمية' : 'Platform Features'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              {isAr
                ? 'كل ما يحتاجه الطالب وولي الأمر في منصة واحدة سهلة وسريعة الاستخدام من الهاتف والكمبيوتر.'
                : 'Everything students and parents need in one intuitive, mobile-first academic platform.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleEn}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color} shadow-sm`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-bold text-foreground">
                  {isAr ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {isAr ? f.descAr : f.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEACHER PROFILE + YOUTUBE SECTION ─────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#07172B] via-[#0F2A4A] to-[#0A1829] py-20 text-white relative overflow-hidden">
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Left: Teacher Info */}
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F2B134]">
                  {isAr ? 'عن المعلم' : 'About The Teacher'}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold">
                  {isAr ? 'م. عمرو حاتم' : 'Eng. Amr Hatem'}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-200/90 leading-relaxed">
                  {isAr
                    ? 'مهندس ومعلم متخصص في الفيزياء والرياضيات، يجمع بين الفهم العملي التطبيقي للمفاهيم الرياضية والفيزيائية وتبسيط المسائل الصعبة لضمان أعلى الدرجات.'
                    : 'Specialized Engineer & Educator in Physics and Mathematics, dedicated to conceptual mastery and exam excellence.'}
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+201012006316"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:text-sm transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4 text-[#14A3A3]" />
                  <span className="font-mono text-sm font-semibold" dir="ltr">+20 101 200 6316</span>
                </a>
                <a
                  href="https://wa.me/201012006316"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-semibold">WhatsApp: +20 101 200 6316</span>
                </a>
                <a
                  href="https://www.youtube.com/@Eng.AmrHatem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-300 transition-colors hover:bg-red-500/20"
                >
                  <Youtube className="h-4 w-4" />
                  <span className="font-semibold">YouTube: @Eng.AmrHatem</span>
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-[#F2B134] px-6 py-3 text-center text-xs sm:text-sm font-bold text-[#0F2A4A] transition-colors hover:bg-[#F2B134]/90"
                >
                  {isAr ? 'اشترك الآن' : 'Enroll Now'}
                </a>
                <Link
                  href={`/${locale}/login`}
                  className="flex-1 rounded-xl border border-white/30 px-6 py-3 text-center text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {isAr ? 'دخول الطلاب' : 'Student Login'}
                </Link>
              </div>
            </div>

            {/* Right: YouTube QR & Channel Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md shadow-2xl text-center">
                <div className="mb-4 flex items-center justify-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                    <Youtube className="h-5 w-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-bold text-white text-sm">قناة اليوتيوب الرسمية</p>
                    <p className="text-xs text-white/70">@Eng.AmrHatem</p>
                  </div>
                </div>

                {/* QR code */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fwww.youtube.com%2F%40Eng.AmrHatem&bgcolor=ffffff&color=0F2A4A&margin=10"
                  alt="QR Code for Eng. Amr Hatem YouTube Channel"
                  width={200}
                  height={200}
                  className="mx-auto rounded-2xl shadow-inner border border-white/10"
                />

                <p className="mt-4 text-xs sm:text-sm text-slate-200">
                  {isAr ? 'امسح الكود لمشاهدة الشروحات المجانية' : 'Scan to watch free physics & math lectures'}
                </p>

                <div className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600/20 px-3.5 py-1 border border-red-500/30">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-300">
                    {isAr ? 'محاضرات وتدريبات مجانية' : 'Free on YouTube'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight text-foreground">
            {isAr ? 'آراء وتجارب طلابنا' : 'What Our Students Say'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                nameEn: 'Ahmed Mohamed', nameAr: 'أحمد محمد',
                textEn: 'Eng. Amr explains complex physics problems so easily. My grade jumped from 65% to 96%!',
                textAr: 'م. عمرو بيشرح أصعب مسائل الفيزياء بأسهل طريقة. درجاتي ارتفعت بشكل كبير بفضل الله ثم متابعته الدقيقة.',
                stars: 5,
              },
              {
                nameEn: 'Sara Khaled', nameAr: 'سارة خالد',
                textEn: 'The student portal is so helpful. I can take practice exams and review questions on my phone.',
                textAr: 'المنصة ممتازة جداً، سهلة الاستخدام من الموبايل وبتابع عليها كل الامتحانات والواجبات أولاً بأول.',
                stars: 5,
              },
              {
                nameEn: 'Omar Tarek', nameAr: 'عمر طارق',
                textEn: 'The QR attendance and leaderboard make studying interactive and motivating every single week!',
                textAr: 'نظام الحضور بالباركود ولوحة الشرف بيخلقوا روح منافسة وتفوق بين كل الطلاب في المجموعة.',
                stars: 5,
              },
            ].map((t) => (
              <div
                key={t.nameEn}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#F2B134] text-[#F2B134]" />
                  ))}
                </div>
                <p className="mb-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{isAr ? t.textAr : t.textEn}&rdquo;
                </p>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  — {isAr ? t.nameAr : t.nameEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#07172B] via-[#0F2A4A] to-[#14A3A3] py-16 text-white">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-black">
            {isAr ? 'جاهز للتفوق في الفيزياء والرياضيات؟' : 'Ready to Excel in Physics & Mathematics?'}
          </h2>
          <p className="mb-8 text-sm sm:text-base text-slate-200/90 max-w-lg mx-auto">
            {isAr
              ? 'تواصل معنا الآن عبر واتساب واشترك في أقوى المجموعات الدراسية مع م. عمرو حاتم.'
              : 'Contact us now on WhatsApp to join our groups with Eng. Amr Hatem.'}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2B134] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0F2A4A] shadow-xl transition-all hover:bg-[#F2B134]/90 hover:scale-[1.02]"
            >
              <Phone className="h-4 w-4" />
              <span>{isAr ? 'واتساب: +201012006316' : 'WhatsApp: +201012006316'}</span>
            </a>
            <Link
              href={`/${locale}/login`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm sm:text-base font-semibold text-white transition-all hover:bg-white/20"
            >
              <Users className="h-4 w-4" />
              <span>{isAr ? 'دخول البوابة' : 'Portal Sign In'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Eng. Amr Hatem Academy"
                width={180}
                height={50}
                className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
              />
            </Link>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <a href="tel:+201012006316" className="transition-colors hover:text-foreground" dir="ltr">
                +20 101 200 6316
              </a>
              <span>•</span>
              <a
                href="https://wa.me/201012006316"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-emerald-600"
              >
                WhatsApp
              </a>
              <span>•</span>
              <a
                href="https://www.youtube.com/@Eng.AmrHatem"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-600"
              >
                YouTube
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {isAr ? 'أكاديمية م. عمرو حاتم — جميع الحقوق محفوظة' : 'Eng. Amr Hatem Academy — All rights reserved'}
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <aside aria-label="WhatsApp Contact" className="fixed bottom-6 end-6 z-40">
        <a
          href="https://wa.me/201012006316?text=مرحبا%20م.%20عمرو%20حاتم%20أود%20الاستفسار%20عن%20دروس%20الأكاديمية"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
          title={isAr ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="hidden sm:inline-block text-xs font-bold pe-1">
            {isAr ? 'تواصل مع م. عمرو' : 'Chat on WhatsApp'}
          </span>
        </a>
      </aside>
    </div>
  )
}
