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
} from 'lucide-react'

// ── QR code for YouTube channel (inline SVG approach using a public QR API) ──

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  // Authenticated users skip the landing and go directly to their home
  if (user) {
    if (user.role === 'teacher') redirect(`/${locale}/dashboard`)
    else redirect(`/${locale}/portal`)
  }

  const isAr = locale === 'ar'

  const features = [
    {
      icon: BookOpen,
      titleEn: 'Smart Digital Classes',
      titleAr: 'فصول رقمية ذكية',
      descEn: 'Full class schedules, session notes, and live materials all in one place.',
      descAr: 'جداول الحصص الكاملة، ملاحظات الجلسات، والمواد الدراسية الحية في مكان واحد.',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      icon: Zap,
      titleEn: 'QR Code Attendance',
      titleAr: 'حضور بكود QR',
      descEn: 'Instant attendance via QR scan — no paperwork, no delays, no excuses.',
      descAr: 'حضور فوري عبر مسح QR — بدون أوراق، بدون تأخير، بدون أعذار.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Trophy,
      titleEn: 'Leaderboard & Hall of Fame',
      titleAr: 'لوحة الشرف والمتفوقين',
      descEn: 'Motivate students with live rankings, badges, and academic achievements.',
      descAr: 'حفز الطلاب بالتصنيفات الحية والشارات والإنجازات الأكاديمية.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: BarChart3,
      titleEn: 'Instant Grade Reports',
      titleAr: 'تقارير الدرجات الفورية',
      descEn: 'Auto-generated performance reports sent directly to parents via WhatsApp.',
      descAr: 'تقارير الأداء المُنشأة تلقائياً تُرسل مباشرةً لأولياء الأمور عبر واتساب.',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Shield,
      titleEn: 'Digital Student ID Card',
      titleAr: 'كارنيه الطالب الرقمي',
      descEn: '3D flip digital ID card with scannable QR for secure identification.',
      descAr: 'كارنيه رقمي ثلاثي الأبعاد مع QR قابل للمسح للتعرف الآمن على الطالب.',
      color: 'from-pink-500 to-rose-600',
    },
    {
      icon: MessageSquare,
      titleEn: 'Direct Teacher Messaging',
      titleAr: 'المراسلة المباشرة مع المعلم',
      descEn: 'Students can ask questions and get answers directly from the teacher.',
      descAr: 'يمكن للطلاب طرح الأسئلة والحصول على إجابات مباشرة من المعلم.',
      color: 'from-violet-500 to-purple-600',
    },
  ]

  const stats = [
    { numEn: '500+', numAr: '+٥٠٠', labelEn: 'Students Enrolled', labelAr: 'طالب مسجل' },
    { numEn: '98%', numAr: '٩٨٪', labelEn: 'Exam Pass Rate', labelAr: 'نسبة النجاح في الامتحانات' },
    { numEn: '4.9★', numAr: '٤٫٩★', labelEn: 'Student Rating', labelAr: 'تقييم الطلاب' },
    { numEn: '10+', numAr: '+١٠', labelEn: 'Years Experience', labelAr: 'سنوات خبرة' },
  ]

  return (
    <div className={`min-h-screen bg-background ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ── NAV BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-foreground">
                {isAr ? 'م. عمرو حاتم' : 'Eng. Amr Hatem'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? 'أكاديمية التميز الأكاديمي' : 'Academic Excellence Academy'}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href={`/${locale}/login`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {isAr ? 'تسجيل الدخول' : 'Login'}
            </Link>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition-all hover:bg-emerald-600 hover:shadow-md"
            >
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 py-24 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 backdrop-blur">
            <Star className="h-4 w-4 fill-indigo-300 text-indigo-300" />
            <span>{isAr ? 'أفضل أكاديمية تعليم رقمي في مصر' : "Egypt's #1 Digital Teaching Academy"}</span>
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {isAr ? (
              <>
                <span className="text-white">تعلّم بذكاء مع</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  م. عمرو حاتم
                </span>
              </>
            ) : (
              <>
                <span className="text-white">Learn Smarter with</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Eng. Amr Hatem
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-100/80">
            {isAr
              ? 'منصة تعليمية متكاملة تجمع بين الذكاء الرقمي والتعليم المتميز. تابع حضورك، درجاتك، ومواد دراستك في مكان واحد.'
              : 'A complete digital learning platform combining smart technology with top-tier education. Track attendance, grades, and study materials in one place.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <Phone className="h-5 w-5" />
              {isAr ? 'اشترك عبر واتساب الآن' : 'Enroll via WhatsApp Now'}
            </a>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:border-white/60 hover:bg-white/10"
            >
              <Users className="h-5 w-5" />
              {isAr ? 'دخول بوابة الطالب' : 'Student Portal Login'}
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
                <p className="text-3xl font-black text-foreground">{isAr ? s.numAr : s.numEn}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {isAr ? s.labelAr : s.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              {isAr ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need, in One Place'}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {isAr
                ? 'منصتنا مصممة لتجعل تجربة التعلم أسهل، أسرع، وأكثر متعة.'
                : 'Our platform is designed to make learning easier, faster, and more engaging.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleEn}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-bold text-foreground">
                  {isAr ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isAr ? f.descAr : f.descEn}
                </p>
                <div className={`pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEACHER PROFILE + QR ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-20 text-white">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Left: Teacher Info */}
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-400">
                  {isAr ? 'مدرسك' : 'Your Teacher'}
                </p>
                <h2 className="text-4xl font-black">
                  {isAr ? 'م. عمرو حاتم' : 'Eng. Amr Hatem'}
                </h2>
                <p className="mt-2 text-indigo-200/80">
                  {isAr
                    ? 'مهندس ومعلم متميز، يجمع بين الخبرة التقنية والأسلوب التعليمي الفريد الذي يجعل كل طالب يفهم ويتفوق.'
                    : 'Engineer & outstanding educator combining technical expertise with a unique teaching style that makes every student understand and excel.'}
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+201012006316"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors hover:bg-white/10"
                >
                  <Phone className="h-5 w-5 text-emerald-400" />
                  <span className="font-mono text-base font-semibold">+20 101 200 6316</span>
                </a>
                <a
                  href="https://wa.me/201012006316"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-semibold">WhatsApp: +201012006316</span>
                </a>
                <a
                  href="https://www.youtube.com/@Eng.AmrHatem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                >
                  <Youtube className="h-5 w-5" />
                  <span className="font-semibold">@Eng.AmrHatem</span>
                </a>
              </div>

              <div className="flex gap-3">
                <a
                  href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-emerald-500 px-6 py-3 text-center font-bold text-white transition-colors hover:bg-emerald-400"
                >
                  {isAr ? 'اشترك الآن' : 'Enroll Now'}
                </a>
                <Link
                  href={`/${locale}/login`}
                  className="flex-1 rounded-xl border-2 border-white/30 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {isAr ? 'دخول الطلاب' : 'Student Login'}
                </Link>
              </div>
            </div>

            {/* Right: YouTube QR Card */}
            <div className="flex justify-center">
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                    <Youtube className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white">YouTube Channel</p>
                    <p className="text-xs text-white/60">@Eng.AmrHatem</p>
                  </div>
                </div>

                {/* QR code via public API — no package needed on server */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fwww.youtube.com%2F%40Eng.AmrHatem&bgcolor=ffffff&color=1a0533&margin=10"
                  alt="QR Code for Eng. Amr Hatem YouTube Channel"
                  width={200}
                  height={200}
                  className="mx-auto rounded-xl"
                />

                <p className="mt-4 text-center text-sm text-white/70">
                  {isAr ? 'امسح الكود لمشاهدة المحاضرات' : 'Scan to watch free lectures'}
                </p>

                <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-300">
                    {isAr ? 'مجاني على يوتيوب' : 'Free on YouTube'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight text-foreground">
            {isAr ? 'ماذا يقول طلابنا؟' : 'What Our Students Say'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                nameEn: 'Ahmed Mohamed', nameAr: 'أحمد محمد',
                textEn: 'Eng. Amr explains complex topics so simply. My grade jumped from 60% to 95% in just one semester!',
                textAr: 'الأستاذ عمرو يشرح المواد الصعبة ببساطة مذهلة. درجتي ارتفعت من ٦٠٪ إلى ٩٥٪ في فصل واحد!',
                stars: 5,
              },
              {
                nameEn: 'Sara Khaled', nameAr: 'سارة خالد',
                textEn: 'The digital student portal is amazing. I can track everything — attendance, grades, payments — on my phone.',
                textAr: 'بوابة الطالب الرقمية رائعة. أتابع كل شيء — الحضور والدرجات والمدفوعات — من هاتفي.',
                stars: 5,
              },
              {
                nameEn: 'Omar Tarek', nameAr: 'عمر طارق',
                textEn: 'The QR attendance system is super cool. No more paper lists. The leaderboard keeps me motivated!',
                textAr: 'نظام الحضور بـ QR ممتاز جداً. لا قوائم ورقية. لوحة الشرف تحفزني دائماً!',
                stars: 5,
              },
            ].map((t) => (
              <div
                key={t.nameEn}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{isAr ? t.textAr : t.textEn}&rdquo;
                </p>
                <p className="text-sm font-bold text-foreground">
                  — {isAr ? t.nameAr : t.nameEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-black">
            {isAr ? 'جاهز تبدأ رحلتك مع م. عمرو؟' : 'Ready to Start Your Journey with Eng. Amr?'}
          </h2>
          <p className="mb-8 text-lg text-indigo-100/90">
            {isAr
              ? 'تواصل معنا الآن على واتساب واشترك في أفضل أكاديمية تعليمية رقمية.'
              : 'Contact us now on WhatsApp and join the best digital academic academy.'}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/201012006316?text=مرحبا%20أستاذ%20عمرو%20أريد%20الاشتراك"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-indigo-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              <Phone className="h-5 w-5" />
              {isAr ? 'واتساب: +201012006316' : 'WhatsApp: +201012006316'}
            </a>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              {isAr ? 'دخول الطلاب' : 'Student Login'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {isAr ? 'أكاديمية م. عمرو حاتم' : 'Eng. Amr Hatem Academy'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'للتميز الأكاديمي' : 'For Academic Excellence'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="tel:+201012006316" className="transition-colors hover:text-foreground">
                +201012006316
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
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {isAr ? 'م. عمرو حاتم — جميع الحقوق محفوظة' : 'Eng. Amr Hatem — All rights reserved'}
          </p>
        </div>
      </footer>
    </div>
  )
}
