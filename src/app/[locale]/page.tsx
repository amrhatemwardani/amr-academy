import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Trophy, CheckCircle } from 'lucide-react'
import { YouTubeGallery } from '@/components/public/YouTubeGallery'

/* ─────────────────────────────────────────────────────────────────
   Wave SVG helpers for section dividers
───────────────────────────────────────────────────────────────── */
function WaveDown({ fill }: { fill: string }) {
  return (
    <div className="w-full leading-none overflow-hidden" style={{ height: 60 }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  )
}
function WaveUp({ fill }: { fill: string }) {
  return (
    <div className="w-full leading-none overflow-hidden" style={{ height: 60 }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill={fill} />
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

  // Fetch real top students from database
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

  // Fetch live student count
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
    <main dir={isAr ? 'rtl' : 'ltr'} className="font-sans overflow-x-hidden">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NAVBAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ background: '#fff' }}
      >
        <Link href={`/${locale}`}>
          <Image src="/logo.svg" alt="Amr Academy" width={120} height={34} className="h-8 w-auto" priority />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/apply`}
            className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-sm font-bold border-2 transition-colors hover:bg-yellow-50"
            style={{ borderColor: '#f6b407', color: '#c48b05' }}
          >
            {isAr ? 'انضم الآن' : 'Join Now'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="rounded-full px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#e47364' }}
          >
            {isAr ? 'دخول' : 'Sign In'}
          </Link>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — Yellow Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="relative pt-16 pb-0 px-6 text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #fff8e1 0%, #fff3b0 50%, #ffe082 100%)' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute top-10 left-10 h-24 w-24 rounded-full opacity-40" style={{ background: '#0050e3' }} />
        <div className="pointer-events-none absolute top-6 right-16 h-16 w-16 rounded-full opacity-30" style={{ background: '#e51e6b' }} />
        <div className="pointer-events-none absolute bottom-0 right-8 h-32 w-32 rounded-full opacity-20" style={{ background: '#00e2ae' }} />

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-5 shadow-sm"
            style={{ background: '#e51e6b', color: '#fff' }}
          >
            ⚡ {isAr ? 'الفيزياء مش حفظ.. هي فهم وتفكير' : 'Physics is thinking, not memorizing'}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4">
            {isAr
              ? <>الفيزياء مش<br /><span style={{ color: '#0050e3' }}>صعبة!</span> 🚀</>
              : <>Physics isn&apos;t<br /><span style={{ color: '#0050e3' }}>Hard!</span> 🚀</>
            }
          </h1>
          <p className="text-base sm:text-lg text-gray-700 max-w-xl mx-auto mb-8 font-medium">
            {isAr
              ? 'مع م. عمرو حاتم، هتفهم الفيزياء بأسلوب مختلف — تريكات، وحلول، وأسلوب بيوصل.'
              : 'With Eng. Amr Hatem — physics explained in a way that actually clicks.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href={`/${locale}/apply`}
              className="rounded-full px-8 py-3.5 text-base font-extrabold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #e51e6b, #e47364)' }}
            >
              {isAr ? '🎓 سجّل مجاناً دلوقتي' : '🎓 Join Free Now'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full px-7 py-3 text-base font-bold border-2 transition-all hover:scale-105"
              style={{ borderColor: '#0050e3', color: '#0050e3', background: 'rgba(255,255,255,0.8)' }}
            >
              {isAr ? 'دخول لحسابي ←' : 'My Account →'}
            </Link>
          </div>

          {/* Live counter */}
          {studentCount != null && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold shadow-md mb-6"
              style={{ background: '#fff', color: '#0050e3', border: '2px solid #bfd2ff' }}
            >
              🎓 {studentCount.toLocaleString('ar-EG')}{' '}
              {isAr ? 'طالب منضم بالفعل' : 'students enrolled'}
            </div>
          )}

          {/* Floating emojis */}
          <div className="pointer-events-none select-none">
            <span className="absolute top-20 left-20 text-3xl animate-float-math" style={{ animationDelay: '0s' }}>⚛️</span>
            <span className="absolute top-32 right-28 text-2xl animate-float-math-alt" style={{ animationDelay: '1s' }}>🔭</span>
            <span className="absolute bottom-10 left-32 text-2xl animate-float-math" style={{ animationDelay: '2s' }}>📐</span>
            <span className="absolute bottom-8 right-40 text-xl animate-float-math-alt" style={{ animationDelay: '0.5s' }}>🧲</span>
          </div>
        </div>

        <WaveDown fill="#ffffff" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FEATURES CARDS — White Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {isAr ? 'ليه أكاديمية عمرو حاتم؟ 🤔' : 'Why Amr Hatem Academy?'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isAr ? 'مش أي أكاديمية — دي أكاديمية مختلفة' : 'Not just any academy — this one is different.'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            {
              emoji: '⚡',
              bg: '#fff8e1',
              border: '#f6b407',
              title: isAr ? 'شرح بأسلوب بيوصل' : 'Explanations That Click',
              desc: isAr
                ? 'مش بنحفظ — بنفهم. كل درس بيتشرح بطريقة تخليك تحله من غير ما تحفظ.'
                : "We don't memorize — we understand. Every lesson is explained so you can solve without memorizing.",
            },
            {
              emoji: '📊',
              bg: '#e8f4ff',
              border: '#0050e3',
              title: isAr ? 'متابعة دايمة' : 'Continuous Follow-up',
              desc: isAr
                ? 'امتحانات، واجبات، ونتايج فورية. شايفين تقدمك خطوة بخطوة.'
                : 'Exams, assignments, and instant results. We see your progress step by step.',
            },
            {
              emoji: '🏆',
              bg: '#fff0f5',
              border: '#e51e6b',
              title: isAr ? 'لوحة الشرف' : 'Hall of Fame',
              desc: isAr
                ? 'أفضل الطلاب بيتجمعوا في لوحة الشرف — وانت المقبل!'
                : "Top students celebrated in our Hall of Fame — you're next!",
            },
            {
              emoji: '🎬',
              bg: '#e8fff8',
              border: '#00e2ae',
              title: isAr ? 'فيديوهات YouTube مجانية' : 'Free YouTube Videos',
              desc: isAr
                ? 'محتوى مجاني على يوتيوب — استذكر أي درس في أي وقت.'
                : 'Free content on YouTube — review any lesson anytime.',
            },
            {
              emoji: '📱',
              bg: '#f0eeff',
              border: '#7c3aed',
              title: isAr ? 'على أي جهاز' : 'Any Device',
              desc: isAr
                ? 'تابع دروسك من موبايلك، تابلت، أو لابتوب بدون تعقيد.'
                : 'Follow lessons from your phone, tablet, or laptop without hassle.',
            },
            {
              emoji: '🤝',
              bg: '#fff5ee',
              border: '#e47364',
              title: isAr ? 'مجتمع داعم' : 'Supportive Community',
              desc: isAr
                ? 'مش بس أكاديمية — دا مجتمع من الطلاب بيتساعدوا ويتنافسوا بشكل صحي.'
                : "It's not just an academy — it's a community of students helping each other and competing healthily.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-6 border-2 hover:shadow-lg transition-shadow"
              style={{ background: card.bg, borderColor: card.border }}
            >
              <div className="text-4xl mb-3">{card.emoji}</div>
              <h3 className="font-extrabold text-gray-900 text-base mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          YOUTUBE SECTION — Blue Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#f0f5ff' }}>
        <WaveUp fill="#ffffff" />
        <div className="py-12 px-6">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-black mb-2" style={{ color: '#0050e3' }}>
              {isAr ? '🎬 شوف الدروس المجانية' : '🎬 Free Lessons on YouTube'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isAr ? 'أكتر من مجرد شرح — تجربة تعليمية بالكامل' : 'More than just explanations — a complete learning experience'}
            </p>
          </div>
          <YouTubeGallery locale={locale} />
          <div className="text-center mt-8">
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: '#e51e6b' }}
            >
              🎥 {isAr ? 'اشترك في قناة اليوتيوب' : 'Subscribe on YouTube'}
            </a>
          </div>
        </div>
        <WaveDown fill="#ffffff" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HALL OF FAME PREVIEW — White Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {topStudents.length > 0 && (
        <section className="py-16 px-6" style={{ background: '#ffffff' }}>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              🏆 {isAr ? 'أبطال الأكاديمية' : 'Academy Champions'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isAr ? 'الطلاب الأوائل اللي وصلوا للقمة' : 'Top students who reached the summit'}
            </p>
          </div>
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {topStudents.map((s, i) => {
              const medals = ['🥇', '🥈', '🥉']
              const colors = ['#fff8e1', '#f5f5f5', '#fff5ee']
              const borders = ['#f6b407', '#9e9e9e', '#e47364']
              return (
                <div
                  key={s.name}
                  className="flex items-center gap-4 rounded-2xl px-6 py-4 border-2"
                  style={{ background: colors[i] ?? '#f9f9f9', borderColor: borders[i] ?? '#ddd' }}
                >
                  <span className="text-3xl">{medals[i] ?? `#${i + 1}`}</span>
                  <div className="flex-1">
                    <div className="font-extrabold text-gray-900 text-base">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.pct}% {isAr ? 'نتيجة' : 'score'}</div>
                  </div>
                  <Trophy className="h-5 w-5" style={{ color: borders[i] ?? '#ddd' }} />
                </div>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/hall-of-fame`}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: '#f6b407', color: '#1a1a1a' }}
            >
              {isAr ? 'شوف لوحة الشرف كاملة ←' : 'See Full Hall of Fame →'}
            </Link>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HOW TO JOIN — Coral/Mint Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#e8fff8' }}>
        <WaveUp fill="#ffffff" />
        <div className="py-14 px-6">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-black mb-2" style={{ color: '#047857' }}>
              {isAr ? '🚀 ازاي تنضم للأكاديمية؟' : '🚀 How to Join the Academy?'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isAr ? 'خطوات بسيطة جداً' : 'Super simple steps'}
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: '01', emoji: '📋', title: isAr ? 'سجّل بياناتك' : 'Submit Your Info', desc: isAr ? 'ابعت اسمك ورقم الهاتف وهتتواصل معاك' : 'Send your name and phone — we\'ll contact you' },
              { num: '02', emoji: '💬', title: isAr ? 'تواصل على واتساب' : 'Contact via WhatsApp', desc: isAr ? 'هتتواصل معاك تيم الأكاديمية لإكمال الانضمام' : 'The academy team will reach out to complete your enrollment' },
              { num: '03', emoji: '🎓', title: isAr ? 'ابدأ دراستك' : 'Start Studying', desc: isAr ? 'ادخل البوابة وابدأ الدروس والامتحانات فوراً' : 'Enter the portal and start lessons and exams immediately' },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-6 shadow-sm text-center border border-green-100">
                <div className="text-4xl mb-3">{step.emoji}</div>
                <div
                  className="inline-block rounded-full px-3 py-0.5 text-xs font-black mb-2"
                  style={{ background: '#00e2ae', color: '#fff' }}
                >
                  {isAr ? 'خطوة' : 'Step'} {step.num}
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/apply`}
              className="rounded-full px-8 py-3.5 text-base font-extrabold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #e51e6b, #e47364)' }}
            >
              {isAr ? '✏️ سجّل طلب انضمام' : '✏️ Submit Application'}
            </Link>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-8 py-3.5 text-base font-extrabold transition-all hover:scale-105"
              style={{ background: '#25d366', color: '#fff' }}
            >
              💬 {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
          </div>
        </div>
        <WaveDown fill="#1a1a2e" />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER — Dark Background
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer
        className="px-6 py-12 text-center"
        style={{ background: '#1a1a2e', color: '#a0a8c0' }}
      >
        <div className="max-w-4xl mx-auto">
          <Image
            src="/logo.svg"
            alt="Amr Academy"
            width={120}
            height={34}
            className="h-8 w-auto mx-auto mb-4 opacity-80"
          />
          <p className="text-sm mb-5" style={{ color: '#a0a8c0' }}>
            {isAr
              ? 'أكاديمية عمرو حاتم — تعليم الفيزياء بأسلوب مختلف'
              : 'Amr Hatem Academy — Physics education done differently'}
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm mb-6">
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              🎥 YouTube
            </a>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              💬 WhatsApp
            </a>
            <Link href={`/${locale}/hall-of-fame`} className="hover:text-white transition-colors">
              🏆 {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
            </Link>
            <Link href={`/${locale}/apply`} className="hover:text-white transition-colors">
              ✏️ {isAr ? 'انضم' : 'Join'}
            </Link>
          </div>
          <div
            className="flex items-center justify-center gap-3 text-xs"
            style={{ color: '#555c7a' }}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>© {new Date().getFullYear()} Amr Hatem Academy</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
