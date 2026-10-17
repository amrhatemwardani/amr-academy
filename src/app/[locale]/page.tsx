import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
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
  Calendar,
  Globe,
  HelpCircle,
  Check,
  MapPin,
  Clock,
  Award,
  Flame,
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
      id, score, total, percentage,
      exams ( title ),
      students (
        id, student_code, grade,
        profiles ( full_name )
      )
    `)
    .order('percentage', { ascending: false })
    .limit(4)

  const { data: activeStudents } = await (admin.from('students' as any) as any)
    .select('id, student_code, profiles(full_name)')
    .eq('status', 'active')
    .limit(4)

  // Merge real student names
  const realHonorNames: { name: string; score: string; code: string }[] = []
  const seenIds = new Set<string>()

  ;((topResults as any[]) || []).forEach((r: any) => {
    if (r.students?.profiles?.full_name && !seenIds.has(r.students.id)) {
      seenIds.add(r.students.id)
      realHonorNames.push({
        name: r.students.profiles.full_name,
        score: `${r.percentage}%`,
        code: r.students.student_code || 'S1001',
      })
    }
  })

  ;((activeStudents as any[]) || []).forEach((s: any) => {
    if (s.profiles?.full_name && !seenIds.has(s.id) && realHonorNames.length < 4) {
      seenIds.add(s.id)
      realHonorNames.push({
        name: s.profiles.full_name,
        score: '100% تميز',
        code: s.student_code || 'S1001',
      })
    }
  })

  return (
    <div className={`min-h-screen bg-background text-foreground relative overflow-hidden ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Floating Math & Physics Formulas Backdrop ─────────────────── */}
      <PhysicsMathBackdrop />

      {/* ── TOP NAVIGATION ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={190}
              height={52}
              priority
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}/hall-of-fame`}
              className="hidden sm:inline-flex text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-lg hover:bg-muted"
            >
              {isAr ? '🏆 لوحة الشرف' : '🏆 Hall of Fame'}
            </Link>
            <Link
              href={`/${locale}/apply`}
              className="rounded-xl bg-[#F2B134] text-[#0F2A4A] px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-sm hover:bg-[#F2B134]/90 transition-all hover:scale-105"
            >
              {isAr ? 'احجز مكانك' : 'Apply Now'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-bold text-foreground transition-all hover:bg-muted"
            >
              {isAr ? 'دخول المنصة' : 'Sign In'}
            </Link>
            <Link
              href={isAr ? '/en' : '/ar'}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 px-4 text-center">
        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>{isAr ? 'أكاديمية الفيزياء والرياضيات — المهندس عمرو حاتم' : 'Physics & Math Academy — Eng. Amr Hatem'}</span>
          </div>

          <h1 className="mb-6 text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-foreground">
            {isAr ? (
              <>
                <span>الفيزياء مش حفظ وتسميع..</span>
                <br />
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 bg-clip-text text-transparent">
                  الفيزياء فهم وتريكات هتوصلك للـ ٦٠/٦٠!
                </span>
              </>
            ) : (
              <>
                <span>Master Physics & Math with</span>
                <br />
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 bg-clip-text text-transparent">
                  Eng. Amr Hatem
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {isAr
              ? 'مع البشمهندس عمرو حاتم، هتبدأ من تأسيس المفاهيم والقوانين من الصفر، لحد حل أعقد أفكار امتحانات الثانوية العامة بثقة وهدوء وبدون أي تعقيد.'
              : 'From core fundamentals to mastering the toughest exam problems, step by step with clear explanations, continuous tracking, and direct teacher follow-up.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row mb-10">
            <Link
              href={`/${locale}/apply`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2B134] px-8 py-3.5 text-base font-black text-[#0F2A4A] shadow-lg shadow-amber-500/20 hover:bg-[#F2B134]/90 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? 'احجز مكانك في المجموعات' : 'Enroll Now'}</span>
            </Link>

            <Link
              href={`/${locale}/login`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-base font-bold text-foreground transition-all hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              <span>{isAr ? 'دخول منصة الطالب' : 'Student Portal'}</span>
            </Link>

            <a
              href="https://wa.me/201012006316?text=السلام%20عليكم%20مهندس%20عمرو%20أريد%20الاستفسار%20عن%20مواعيد%20الحصص"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3.5 text-base font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>{isAr ? 'تواصل واتساب' : 'WhatsApp'}</span>
            </a>
          </div>

          {/* Humorous Human Newton Box 🍎 */}
          <div className="max-w-xl mx-auto rounded-2xl border border-amber-300/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 text-start flex items-center gap-3 shadow-sm">
            <span className="text-3xl animate-bounce-apple select-none shrink-0">🍎</span>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
              {isAr
                ? '«التفاحة لما وقعت على نيوتن عملتلنا منهج.. بس مع م. عمرو كل مسألة صعبة ليها قصة وتجربة وتريكة فيزيائية هتثبت في دماغك!»'
                : 'Physics is not about memorization — it is the art of understanding how our universe and equations work!'}
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="container mx-auto max-w-4xl px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-500">+٥٠٠</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{isAr ? 'طالب وطالبة متفوقين' : 'Active Students'}</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">٩٨٪</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{isAr ? 'نسبة اجتياز وتفوق' : 'Pass & High Marks'}</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-500">+٢٠٠</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{isAr ? 'سؤال ببنك الأسئلة' : 'Curated Questions'}</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">+١٠</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{isAr ? 'سنوات خبرة وتدريس' : 'Years Experience'}</p>
          </div>
        </div>
      </section>

      {/* ── YOUTUBE GALLERY (REAL 5 VIDEOS) ───────────────────────────── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold mb-2">
              <Youtube className="h-4 w-4" />
              <span>{isAr ? 'شروحات وحل مسائل مجانية' : 'Free Video Lessons'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isAr ? 'فيديوهات شرح مميزة مع م. عمرو حاتم' : 'Featured Video Lessons'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isAr ? 'شاهد نماذج من شرح الدروس وحل المسائل المتقدمة على قناتنا' : 'Watch concept breakdowns and problem-solving sessions'}
            </p>
          </div>

          <YouTubeGallery locale={locale} />
        </div>
      </section>

      {/* ── REAL STUDENTS HALL OF FAME PREVIEW ─────────────────────────── */}
      <section className="py-16 px-4 bg-muted/20 border-y border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-1">
                <Trophy className="h-4 w-4" />
                <span>{isAr ? 'لوحة الشرف والتكريم' : 'Hall of Fame'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {isAr ? 'أبطال ومتفوقو الأكاديمية' : 'Academy Honor Roll'}
              </h2>
            </div>
            <Link
              href={`/${locale}/hall-of-fame`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              <span>{isAr ? 'عرض لوحة الشرف كاملة' : 'View Full Hall of Fame'}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {realHonorNames.map((st, i) => (
              <div
                key={st.code + i}
                className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐'}
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">{st.name}</h3>
                <p className="text-xs font-mono font-bold text-emerald-600 mb-1">{st.score}</p>
                <p className="text-[11px] text-muted-foreground">كود الطالب: {st.code}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES THE ACADEMY UNIQUE ─────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isAr ? 'ليه تدرس فيزياء ورياضيات مع م. عمرو حاتم؟' : 'Why Study With Eng. Amr Hatem?'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              {isAr ? 'منظومة تعليمية تجمع بين الشرح العميق والمتابعة الصارمة والتكنولوجيا السريعة' : 'Comprehensive academic care, deep concepts, and instant digital progress tracking.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                titleAr: 'تأسيس وبناء علمي حقيقي',
                descAr: 'القانون لا يُحفظ فقط؛ بل نفهم أصله وتطبيقه العملي وتفاصيل استنتاجه لتكون جاهزاً لأي سؤال غير تقليدي.',
                color: 'text-amber-500 bg-amber-500/10',
              },
              {
                icon: BarChart3,
                titleAr: 'بنك أسئلة وتدريب مستمر',
                descAr: 'مئات الأسئلة المتدرجة من البسيط حتى مسائل المستويات العليا المتطابقة مع نظام امتحانات الثانوية العامة الجديد.',
                color: 'text-teal-600 bg-teal-500/10',
              },
              {
                icon: Zap,
                titleAr: 'حضور ذكي بالباركود (QR)',
                descAr: 'تسجيل حضور فوري بكارنيه الطالب الذكي، لضمان عدم إضاعة أي دقيقة من وقت الشرح والحل.',
                color: 'text-orange-500 bg-orange-500/10',
              },
              {
                icon: MessageSquare,
                titleAr: 'تقارير أسبوعية لأولياء الأمور',
                descAr: 'رسائل دورية على واتساب توضح درجات الامتحانات والواجبات ونسبة الحضور ليكون ولي الأمر مطمئناً دائماً.',
                color: 'text-emerald-600 bg-emerald-500/10',
              },
              {
                icon: Award,
                titleAr: 'شهادات تقدير وتكريم المتفوقين',
                descAr: 'تكريم شهري للمتصدرين مع شهادات تقدير موثقة برمز QR رقمي لتشجيع الطلاب على الاستمرار في القمة.',
                color: 'text-amber-500 bg-amber-500/10',
              },
              {
                icon: Phone,
                titleAr: 'دعم مباشر وإجابة استفساراتك',
                descAr: 'خط اتصال وواتساب مباشر لمتابعة أي مسألة تقف أمامك وتوضيح خطوات الحل خطوة بخطوة.',
                color: 'text-blue-500 bg-blue-500/10',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">{card.titleAr}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.descAr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GROUPS & STAGES ────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-muted/20 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            {isAr ? 'المراحل الدراسية والمناهج المتاحة' : 'Available Academic Stages'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8">
            {isAr ? 'شرح وافٍ وتدريبات مكثفة للثانوية العامة ومدارس اللغات' : 'Curriculums for Thanaweya Amma and Language Schools'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="text-xs font-bold text-amber-500 block mb-1">الصف الأول الثانوي</span>
              <h3 className="font-bold text-lg mb-2">فيزياء ومبادئ الرياضيات</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تأسيس قوي في معادلات الحركة وقوانين نيوتن والمتجهات وحساب المثلثات.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="text-xs font-bold text-teal-600 block mb-1">الصف الثاني الثانوي</span>
              <h3 className="font-bold text-lg mb-2">الحركة الموجية والضوء والتفاضل</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                دراسة متعمقة للموجات، الانعكاس والانكسار، وقواعد التفاضل وحساب المثلثات.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-500 bg-card p-6 shadow-md relative">
              <span className="absolute -top-3 start-6 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                الأكثر طلباً
              </span>
              <span className="text-xs font-bold text-amber-500 block mb-1">الصف الثالث الثانوي</span>
              <h3 className="font-bold text-lg mb-2">الفيزياء والرياضيات للثانوية العامة</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                الكهربية والمغناطيسية، أجهزة القياس، والفيزياء الحديثة، بالإضافة للتفاضل والتكامل والاستاتيكا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isAr ? 'الأسئلة الشائعة وإجاباتها' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'إزاي أحجز مكان مع المهندس عمرو حاتم؟',
                a: 'تقدر تضغط على زر "احجز مكانك" وتسجل بياناتك في ثوانٍ، أو تتواصل مباشرة عبر واتساب على رقم +201012006316 وسيقوم فريق العمل بتأكيد المجموعة المناسبة لك.',
              },
              {
                q: 'هل المنصة بتتابع غياب ودرجات الطالب؟',
                a: 'نعم، المنصة بتوفر كود QR لكل طالب لتسجيل الحضور، وكل امتحان أو واجب بيتم تصحيحه وتسجيل درجاته وإرسال تقرير فوري لولي الأمر.',
              },
              {
                q: 'هل الشرح متوفر لمدارس اللغات (Physics & Math)؟',
                a: 'نعم، المناهج مشروحة لكلا القسمين (عربي ولغات) مع التركيز على المصطلحات العلمية باللغة الإنجليزية وحل الامتحانات الوزارية والتجريبية.',
              },
              {
                q: 'لو فاتني درس أو حصة، هل فيه مراجعة أو تسجيل؟',
                a: 'توفر الأكاديمية ملخصات وشروحات مسجلة وبنك أسئلة إلكتروني يتيح للطالب مراجعة وحل أي جزء فاته في أي وقت.',
              },
            ].map((faq, i) => (
              <details key={i} className="rounded-xl border border-border bg-card p-4 text-start cursor-pointer group">
                <summary className="font-bold text-sm text-foreground list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed pt-2 border-t border-border">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOATING WHATSAPP BUTTON ──────────────────────────────────── */}
      <aside aria-label="تواصل واتساب" className="fixed bottom-6 end-6 z-50">
        <a
          href="https://wa.me/201012006316?text=السلام%20عليكم%20مهندس%20عمرو%20حاتم"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white font-bold text-xs sm:text-sm shadow-xl hover:bg-emerald-600 hover:scale-105 transition-all"
        >
          <Phone className="h-5 w-5" />
          <span>{isAr ? 'تواصل مع م. عمرو' : 'Chat with Eng. Amr'}</span>
        </a>
      </aside>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/40 py-10 px-4 text-center">
        <div className="container mx-auto max-w-4xl space-y-4">
          <Image
            src="/logo.svg"
            alt="Amr Hatem Academy"
            width={160}
            height={46}
            className="h-8 w-auto mx-auto object-contain dark:brightness-0 dark:invert"
          />
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            أكاديمية المهندس عمرو حاتم المتخصصة في تدريس الفيزياء والرياضيات للمرحلة الثانوية.
          </p>
          <p className="text-xs text-muted-foreground">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — Eng. Amr Hatem Academy
          </p>
        </div>
      </footer>
    </div>
  )
}
