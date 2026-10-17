import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Trophy, CheckCircle, ArrowRight, ArrowLeft, Star, Sparkles, Video, MessageCircle, Play, BookOpen, Target, Award } from 'lucide-react'
import { YouTubeGallery } from '@/components/public/YouTubeGallery'
import { PhysicsMathBackdrop } from '@/components/public/PhysicsMathBackdrop'

/* ─────────────────────────────────────────────────────────────────
   Playful Wave SVG Dividers (Smooth transitions between colorful sections)
───────────────────────────────────────────────────────────────── */
function WaveDown({ fill }: { fill: string }) {
  return (
    <div className="w-full leading-none overflow-hidden -mb-1" style={{ height: 50 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0,0 C360,55 1080,55 1440,0 L1440,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  )
}

function WaveUp({ fill }: { fill: string }) {
  return (
    <div className="w-full leading-none overflow-hidden -mt-1" style={{ height: 50 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0,60 C360,5 1080,5 1440,60 L1440,0 L0,0 Z" fill={fill} />
      </svg>
    </div>
  )
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (user) {
    if (user.role === 'teacher') redirect(`/${locale}/dashboard`)
    else redirect(`/${locale}/portal`)
  }

  const isAr = locale === 'ar'
  const admin = createAdminClient()

  // 1. Fetch real top students from database for the Hall of Fame preview
  const { data: topResults } = await (admin.from('exam_results' as any) as any)
    .select(`
      attempt_id,
      score,
      total,
      percentage,
      students!inner (
        id,
        profiles ( full_name )
      )
    `)
    .eq('fully_graded', true)
    .eq('passed', true)
    .not('published_at', 'is', null)
    .order('percentage', { ascending: false })
    .limit(3)

  // 2. Fetch live student count
  const { count: studentCount } = await (admin.from('students' as any) as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const topStudents: Array<{ name: string; pct: number }> = []
  if (topResults && Array.isArray(topResults)) {
    for (const r of topResults) {
      const name = (r as any).students?.profiles?.full_name ?? null
      if (name) topStudents.push({ name, pct: Math.round((r as any).percentage ?? 0) })
    }
  }

  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="font-sans overflow-x-hidden bg-white text-gray-900 selection:bg-[#f6b407] selection:text-black">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP NAVBAR (Kindergarten Cheerful Style)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-[#f6b407] flex items-center justify-center text-white text-xl font-black shadow-sm rotate-3">
              ⚡
            </div>
            <div>
              <span className="font-black text-lg text-gray-900 tracking-tight block leading-tight">
                {isAr ? 'أكاديمية م. عمرو حاتم' : 'Amr Hatem Academy'}
              </span>
              <span className="text-[10px] font-bold text-[#0050e3] block">
                {isAr ? 'فيزياء ورياضيات الثانوية العامة' : 'Physics & Math Excellence'}
              </span>
            </div>
          </Link>

          {/* Nav links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-700">
            <a href="#about" className="hover:text-[#0050e3] transition-colors">
              {isAr ? 'عن الأكاديمية' : 'About'}
            </a>
            <a href="#programs" className="hover:text-[#0050e3] transition-colors">
              {isAr ? 'البرامج الدراسية' : 'Programs'}
            </a>
            <a href="#videos" className="hover:text-[#0050e3] transition-colors">
              {isAr ? 'فيديوهات الشرح' : 'Videos'}
            </a>
            <a href="#hall-of-fame" className="hover:text-[#0050e3] transition-colors">
              {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
            </a>
            <a href="#join" className="hover:text-[#0050e3] transition-colors">
              {isAr ? 'كيف تنضم؟' : 'How to Join'}
            </a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/${locale}/apply`}
              className="inline-flex items-center gap-1.5 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold bg-[#f6b407] hover:bg-[#e5a604] text-gray-950 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>{isAr ? 'انضم الآن' : 'Enroll Now'}</span>
              <span>🎓</span>
            </Link>

            <Link
              href={`/${locale}/login`}
              className="rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold text-white bg-[#e47364] hover:bg-[#d65e4e] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              {isAr ? 'دخول المنصة' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION — Sunny Warm Yellow (Weblium Kindergarten Style)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="about"
        className="relative pt-12 sm:pt-20 pb-0 px-4 sm:px-6 overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #fff9e6 0%, #fff2b2 45%, #fedc77 100%)' }}
      >
        {/* Colorful floating geometric blobs (exact Weblium palette) */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#bfd2ff]/40 blur-sm" />
        <div className="pointer-events-none absolute top-16 right-6 w-32 h-32 rounded-full bg-[#e51e6b]/15 blur-sm" />
        <div className="pointer-events-none absolute bottom-10 left-12 w-48 h-48 rounded-full bg-[#00e2ae]/25 blur-sm" />

        {/* Physics and Math Equations Backdrop */}
        <PhysicsMathBackdrop />

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-extrabold text-[#0050e3] shadow-md border border-amber-200 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e51e6b] animate-ping" />
            <span>{isAr ? '⚡ فيزياء ورياضيات الثانوية العامة مع م. عمرو حاتم' : '⚡ Physics & Math with Eng. Amr Hatem'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-950 leading-[1.15] mb-5 tracking-tight">
            {isAr ? (
              <>
                الفيزياء مش حفظ..
                <br />
                <span className="text-[#0050e3]">فهم، وتريكات، وتفوق!</span> 🚀
              </>
            ) : (
              <>
                Physics isn&apos;t hard..
                <br />
                <span className="text-[#0050e3]">It&apos;s fun, easy & clear!</span> 🚀
              </>
            )}
          </h1>

          {/* Energetic, friendly human-made description */}
          <p className="text-base sm:text-xl text-gray-800 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            {isAr
              ? 'مع البشمهندس عمرو حاتم، هتتعلم الفيزياء من الصفر لحد ما تحل أصعب مسألة في الامتحان بابتسامة وثقة عمياء.'
              : 'With Eng. Amr Hatem — master physics principles, solve complex problems with confidence, and aim for top scores.'}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href={`/${locale}/apply`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #e51e6b 0%, #e47364 100%)' }}
            >
              <span>{isAr ? 'سجّل مكانك مجاناً الآن' : 'Enroll Free Today'}</span>
              <span>🎓</span>
            </Link>

            <a
              href="#videos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-[#0050e3] bg-white hover:bg-blue-50 border-2 border-[#0050e3] shadow-md transition-all hover:scale-105"
            >
              <Play className="h-4 w-4 fill-[#0050e3]" />
              <span>{isAr ? 'شاهد الحصص المجانية' : 'Watch Free Lessons'}</span>
            </a>
          </div>

          {/* Live Student Counter from Database */}
          <div className="inline-flex items-center gap-3 rounded-full bg-white/95 px-6 py-2.5 shadow-lg border border-amber-200 mb-8">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              <div className="w-7 h-7 rounded-full bg-[#f6b407] flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                🥇
              </div>
              <div className="w-7 h-7 rounded-full bg-[#0050e3] flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                ⚡
              </div>
              <div className="w-7 h-7 rounded-full bg-[#00e2ae] flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                🔬
              </div>
            </div>
            <span className="text-sm font-extrabold text-gray-900">
              {studentCount != null
                ? isAr
                  ? `أكثر من ${studentCount} طالب مسجلين معنا هذا العام`
                  : `Over ${studentCount} active enrolled students`
                : isAr
                  ? 'مئات الطلاب يتعلمون معنا هذا العام'
                  : 'Hundreds of students learning with us'}
            </span>
          </div>
        </div>

        {/* Wave Divider to next section */}
        <WaveDown fill="#ffffff" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2: OUR CORE VALUES (Weblium Kindergarten Style 4 Cards)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-block rounded-full bg-[#fff8e1] border border-[#f6b407] px-4 py-1 text-xs font-black text-[#c48b05] mb-3">
            {isAr ? '⭐ أسرار تفوق طلابنا' : '⭐ Our Core Values'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mb-3 tracking-tight">
            {isAr ? 'ليه تختار أكاديمية عمرو حاتم؟ 🤔' : 'Why Amr Hatem Academy?'}
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isAr
              ? 'مش مجرد دروس خصوصية.. دي منظومة متكاملة بتضمن لك الفهم الكامل وحفظ المادة في دماغك طول السنة.'
              : 'More than tutoring — a complete learning system that turns physics into your highest-scoring subject.'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              emoji: '⚡',
              bg: '#fff9e6',
              border: '#f6b407',
              badgeColor: '#f6b407',
              title: isAr ? 'الشرح من الصفر' : 'Concepts From Scratch',
              desc: isAr
                ? 'مش بنفترض إنك فاهم القديم — بنبني معاك الأساس خطوة بخطوة لحد ما تحس إن الفيزياء أسهل مادة.'
                : 'We start from absolute fundamentals and build you up step-by-step.',
            },
            {
              emoji: '🎯',
              bg: '#e8f4ff',
              border: '#0050e3',
              badgeColor: '#0050e3',
              title: isAr ? 'بنك أسئلة وتريكات' : 'Exam Tricks & Bank',
              desc: isAr
                ? 'مئات المسائل المتدرجة وأفكار امتحانات السنوات السابقة، مع حل تفصيلي لكل مسألة.'
                : 'Hundreds of graduated exam questions and key physics tricks with detailed steps.',
            },
            {
              emoji: '🏆',
              bg: '#fff0f5',
              border: '#e51e6b',
              badgeColor: '#e51e6b',
              title: isAr ? 'لوحة شرف وتكريم' : 'Hall of Fame Honors',
              desc: isAr
                ? 'امتحانات دورية وتكريم للأوائل بجوائز وشهادات تقدير معلنة على مستوى الأكاديمية.'
                : 'Periodic exams and recognition for top achievers with badges and certificates.',
            },
            {
              emoji: '💬',
              bg: '#e8fff8',
              border: '#00e2ae',
              badgeColor: '#00e2ae',
              title: isAr ? 'متابعة مباشرة وواتساب' : 'Direct WhatsApp Help',
              desc: isAr
                ? 'أي سؤال يقف معاك هتبعته على واتساب وهيرد عليك م. عمرو وفريق العمل فوراً.'
                : 'Any question you have gets answered directly on WhatsApp without waiting.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col justify-between"
              style={{ backgroundColor: card.bg, borderColor: card.border }}
            >
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm"
                  style={{ backgroundColor: '#ffffff', border: `2px solid ${card.border}` }}
                >
                  {card.emoji}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{card.desc}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200/50 flex items-center gap-1.5 text-xs font-bold text-gray-600">
                <CheckCircle className="h-4 w-4" style={{ color: card.badgeColor }} />
                <span>{isAr ? 'متاح لجميع الطلاب' : 'Available for all'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3: ACADEMIC PROGRAMS (Kidtime Programs with Pricing / Syllabi)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="programs" className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: '#f0f5ff' }}>
        <WaveUp fill="#ffffff" />

        <div className="max-w-5xl mx-auto text-center mb-12 sm:mb-16 pt-8">
          <div className="inline-block rounded-full bg-[#bfd2ff] border border-[#0050e3] px-4 py-1 text-xs font-black text-[#0050e3] mb-3">
            {isAr ? '📚 برامجنا الدراسية' : '📚 Academic Programs'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mb-3 tracking-tight">
            {isAr ? 'المراحل الدراسية في الأكاديمية' : 'Curriculum & Grade Levels'}
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isAr
              ? 'مناهج مصممة بدقة لتأهيلك لأعلى الدرجات وفق أحدث مواصفات امتحانات وزارة التربية والتعليم.'
              : 'Carefully engineered syllabus to secure top marks in all physics exams.'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              grade: isAr ? 'الصف الأول الثانوي' : '1st Secondary Grade',
              color: '#f6b407',
              badgeBg: '#fff8e1',
              badgeText: isAr ? 'تأسيس متين' : 'Foundation',
              tagline: isAr ? 'بداية الرحلة الفيزيائية الصحيحة' : 'Start the right way',
              topics: [
                isAr ? 'القياس الفيزيائي وصيغ الأبعاد' : 'Physical Units & Dimensions',
                isAr ? 'الكميات القياسية والمتجهة' : 'Scalars & Vectors',
                isAr ? 'معادلات الحركة والجاذبية الكونية' : 'Motion Equations & Gravity',
                isAr ? 'قوانين نيوتن وكمية التحرك' : 'Newton Laws & Momentum',
              ],
            },
            {
              grade: isAr ? 'الصف الثاني الثانوي' : '2nd Secondary Grade',
              color: '#0050e3',
              badgeBg: '#e8f4ff',
              badgeText: isAr ? 'المستوى المتقدم' : 'Advanced Core',
              tagline: isAr ? 'الفيزياء الموجية وخواص المادة' : 'Waves & Matter',
              topics: [
                isAr ? 'الحركة الاهتزازية والموجية' : 'Wave & Oscillatory Motion',
                isAr ? 'انعكاس وانكسار وتداخل الضوء' : 'Light Optics & Refraction',
                isAr ? 'خواص الموائع المتحركة والساكنة' : 'Fluids Statics & Dynamics',
                isAr ? 'الضغط وقاعدة باسكال' : 'Pressure & Pascal Principle',
              ],
            },
            {
              grade: isAr ? 'الصف الثالث الثانوي' : '3rd Secondary (Thanawya)',
              color: '#e51e6b',
              badgeBg: '#fff0f5',
              badgeText: isAr ? 'دفعة الـ 60/60' : 'Thanawya Amma',
              tagline: isAr ? 'طريقك نحو كليات القمة' : 'Your road to top colleges',
              topics: [
                isAr ? 'الفيزياء الكهربية وقوانين كيرشوف' : 'Electricity & Kirchhoff Laws',
                isAr ? 'التأثير المغناطيسي وأجهزة القياس' : 'Electromagnetism & Devices',
                isAr ? 'الحث الكهرومغناطيسي والدينامو' : 'Induction & Transformers',
                isAr ? 'الفيزياء الحديثة وإشعاع الجسم الأسود' : 'Modern Physics & Quantum',
              ],
            },
          ].map((prog, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 border-3 shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              style={{ borderColor: prog.color }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black"
                    style={{ backgroundColor: prog.badgeBg, color: prog.color }}
                  >
                    {prog.badgeText}
                  </span>
                  <span className="text-2xl">🎓</span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-1">{prog.grade}</h3>
                <p className="text-xs text-gray-500 font-semibold mb-5">{prog.tagline}</p>

                <div className="space-y-2.5 mb-8">
                  {prog.topics.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-bold text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: prog.color }} />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/${locale}/apply`}
                className="w-full text-center rounded-2xl py-3 text-sm font-extrabold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: prog.color }}
              >
                {isAr ? 'انضم لهذا الصف الآن ←' : 'Enroll in This Grade →'}
              </Link>
            </div>
          ))}
        </div>

        <WaveDown fill="#ffffff" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4: YOUTUBE VIDEO GALLERY (User requested real links)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="videos" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-4 py-1 text-xs font-black text-red-600 mb-3">
            <Video className="h-3.5 w-3.5" />
            <span>{isAr ? '🎬 حصص مجانية بجودة عالية' : '🎬 Free High-Yield Lessons'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mb-3 tracking-tight">
            {isAr ? 'شاهد شرح م. عمرو حاتم على اليوتيوب' : 'Watch Eng. Amr Hatem on YouTube'}
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isAr
              ? 'تريكات، وحلول مسائل، ومراجعات امتحانات مجانية لجميع الطلاب مع إمكانية المشاهدة المباشرة.'
              : 'Detailed explanations, exam revisions, and physics experiments ready to watch.'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <YouTubeGallery locale={locale} />
        </div>

        <div className="text-center mt-10">
          <a
            href="https://www.youtube.com/@Eng.AmrHatem"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 bg-red-600 hover:bg-red-700"
          >
            <span>🎥</span>
            <span>{isAr ? 'اشترك في قناة اليوتيوب الرسمية' : 'Subscribe to Official YouTube Channel'}</span>
          </a>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5: HALL OF FAME (Connected to REAL Database Students!)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="hall-of-fame"
        className="py-16 sm:py-24 px-4 sm:px-6 relative"
        style={{ backgroundColor: '#fffdf5' }}
      >
        <WaveUp fill="#ffffff" />

        <div className="max-w-4xl mx-auto text-center mb-12 pt-8">
          <div className="inline-block rounded-full bg-[#fff8e1] border border-[#f6b407] px-4 py-1 text-xs font-black text-[#c48b05] mb-3">
            {isAr ? '🏆 أبطال الأكاديمية' : '🏆 Hall of Fame'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mb-3 tracking-tight">
            {isAr ? 'لوحة الشرف — الأوائل والمتميزون' : 'Honor Board — Top Students'}
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isAr
              ? 'طلاب حصدوا أعلى الدرجات في امتحانات المنصة.. وانت تقدر تكون مكانهم في الامتحان الجاي!'
              : 'Real top students who achieved top scores on our exams — you could be next!'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {topStudents.length > 0 ? (
            topStudents.map((s, idx) => {
              const medals = ['🥇', '🥈', '🥉']
              const bgColors = ['#fff9e6', '#f3f4f6', '#fff1eb']
              const borders = ['#f6b407', '#9ca3af', '#e47364']
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-5 border-2 shadow-sm flex items-center justify-between gap-4 transition-all hover:scale-102"
                  style={{ backgroundColor: bgColors[idx] ?? '#ffffff', borderColor: borders[idx] ?? '#e5e7eb' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{medals[idx] ?? `#${idx + 1}`}</span>
                    <div>
                      {/* Name only (NO student ID per user directive) */}
                      <p className="text-lg font-black text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500 font-bold">
                        {idx === 0
                          ? isAr ? 'المركز الأول على الأكاديمية 🌟' : 'Rank 1 overall'
                          : isAr ? `المركز ${idx + 1} في الترتيب العام` : `Rank ${idx + 1} overall`}
                      </p>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-xl font-black" style={{ color: borders[idx] }}>
                      {s.pct}%
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {isAr ? 'درجة التفوق' : 'Score'}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-amber-200 text-center shadow-sm">
              <Trophy className="h-12 w-12 text-[#f6b407] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-gray-700">
                {isAr ? 'الامتحانات جارية الآن وسيتم تحديث لوحة الشرف فور صدور النتائج!' : 'Exams are ongoing, check back soon!'}
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link
            href={`/${locale}/hall-of-fame`}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-extrabold text-gray-900 bg-[#f6b407] hover:bg-[#e5a604] shadow-md transition-all hover:scale-105"
          >
            <span>{isAr ? 'عرض لوحة الشرف كاملة' : 'View Full Hall of Fame'}</span>
            <span>←</span>
          </Link>
        </div>

        <WaveDown fill="#e8fff8" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6: HOW TO JOIN (4 Friendly Steps)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="join" className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: '#e8fff8' }}>
        <div className="max-w-5xl mx-auto text-center mb-12">
          <div className="inline-block rounded-full bg-white border border-[#00e2ae] px-4 py-1 text-xs font-black text-[#047857] mb-3">
            {isAr ? '🚀 خطوات الانضمام' : '🚀 How to Join'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mb-3 tracking-tight">
            {isAr ? 'ابدأ رحلتك في 4 خطوات بسيطة' : 'Start Your Journey in 4 Simple Steps'}
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            {isAr
              ? 'الانضمام مش معقد — كل المطلوب خطوة واحدة وهنكون معاك لحظة بلحظة.'
              : 'Enrolling is fast and painless — we guide you every step of the way.'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              emoji: '📝',
              title: isAr ? 'سجّل طلب انضمام' : 'Submit Application',
              desc: isAr ? 'ادخل على صفحة الانضمام واكتب اسمك ورقم تليفونك وسنتواصل معك فوراً.' : 'Fill out your name, grade and phone in 30 seconds.',
            },
            {
              step: '02',
              emoji: '💬',
              title: isAr ? 'تواصل عبر واتساب' : 'WhatsApp Chat',
              desc: isAr ? 'تأكيد الحجز واختيار مواعيد الحصص المناسبة لجدولك الدراسي.' : 'Confirm your registration and schedule with the team.',
            },
            {
              step: '03',
              emoji: '🔑',
              title: isAr ? 'استلم كود المنصة' : 'Receive Portal Code',
              desc: isAr ? 'استلم بيانات حسابك الخاص للدخول لمنصة الامتحانات وبنك الأسئلة.' : 'Get your student credentials to access online tasks and materials.',
            },
            {
              step: '04',
              emoji: '🎯',
              title: isAr ? 'ابدأ التفوق والـ 60' : 'Aim For 100%',
              desc: isAr ? 'شاهد الحصص، حل الواجبات، وامتحن كل أسبوع وتابع نتيجتك أول بأول.' : 'Attend sessions, practice tests, and watch your grade climb!',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm flex flex-col justify-between text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <span className="text-4xl block mb-3">{item.emoji}</span>
                <span className="inline-block rounded-full bg-[#00e2ae] text-gray-950 text-xs font-black px-3 py-0.5 mb-2">
                  {isAr ? 'الخطوة' : 'Step'} {item.step}
                </span>
                <h3 className="text-lg font-black text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Big Action Callout */}
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-xl text-center">
          <h3 className="text-2xl font-black text-gray-950 mb-2">
            {isAr ? 'مستعد تبدأ رحلة التفوق مع م. عمرو حاتم؟' : 'Ready to master physics with Eng. Amr?'}
          </h3>
          <p className="text-sm text-gray-600 mb-6 font-medium">
            {isAr
              ? 'احجز مكانك الآن وتواصل معنا مباشرة على واتساب للاستفسار عن المواعيد والأسعار.'
              : 'Secure your spot today and chat directly with us on WhatsApp.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${locale}/apply`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #e51e6b, #e47364)' }}
            >
              <span>{isAr ? 'سجّل طلب الانضمام ✏️' : 'Apply Online ✏️'}</span>
            </Link>

            <a
              href="https://wa.me/201012006316?text=مرحباً، أود الاستفسار عن تفاصيل الحجز ومواعيد كورسات الفيزياء"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold text-white bg-[#25d366] hover:bg-[#20ba59] shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{isAr ? 'تواصل معنا على واتساب' : 'Chat on WhatsApp'}</span>
            </a>
          </div>
        </div>

        <WaveDown fill="#1a1c29" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER (Dark, Clean, Authoritative)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-[#1a1c29] text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f6b407] flex items-center justify-center text-white text-2xl font-black">
              ⚡
            </div>
            <div>
              <p className="text-white font-black text-lg">
                {isAr ? 'أكاديمية المهندس عمرو حاتم' : 'Eng. Amr Hatem Academy'}
              </p>
              <p className="text-xs text-gray-500">
                {isAr ? 'فيزياء ورياضيات الثانوية العامة بأعلى معايير الجودة' : 'High School Physics & Math'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-400 transition-colors"
            >
              🎥 YouTube
            </a>
            <span>•</span>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              💬 WhatsApp (+201012006316)
            </a>
            <span>•</span>
            <Link href={`/${locale}/hall-of-fame`} className="hover:text-[#f6b407] transition-colors">
              🏆 {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
            </Link>
            <span>•</span>
            <Link href={`/${locale}/login`} className="hover:text-[#e47364] transition-colors">
              🔐 {isAr ? 'دخول المنصة' : 'Sign In'}
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Amr Hatem Academy. All rights reserved.</p>
          <p>{isAr ? 'صممت خصيصاً لطلاب الفيزياء والرياضيات' : 'Engineered for top physics performance'}</p>
        </div>
      </footer>
    </main>
  )
}
