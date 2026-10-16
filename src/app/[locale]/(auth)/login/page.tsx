import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from './login-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Youtube, MessageCircle, Phone, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'تسجيل الدخول | أكاديمية م. عمرو حاتم' : 'Sign In | Eng. Amr Hatem Academy',
  }
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'

  // Already logged in → redirect
  const user = await getCurrentUser()
  if (user) {
    redirect(user.role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`)
  }

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <main className="min-h-screen flex bg-background">
      {/* Left panel — Hero & Academic Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#07172B] via-[#0F2A4A] to-[#0A1A2F] text-white flex-col justify-between p-12">
        {/* Subtle Physics & Math Motifs Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Orbits */}
            <ellipse cx="70%" cy="30%" rx="180" ry="60" fill="none" stroke="#F2B134" strokeWidth="1.5" transform="rotate(30 400 200)" />
            <ellipse cx="70%" cy="30%" rx="180" ry="60" fill="none" stroke="#14A3A3" strokeWidth="1.5" transform="rotate(-40 400 200)" />
            {/* Wave curve */}
            <path d="M0,450 Q120,400 240,450 T480,450 T720,450 T960,450" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M0,480 Q120,530 240,480 T480,480 T720,480 T960,480" fill="none" stroke="#14A3A3" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Ambient glows with brand colors */}
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-[#14A3A3]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-[#F2B134]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#0F2A4A]/40 blur-[140px] pointer-events-none" />

        {/* Top Header — Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href={`/${locale}`} className="inline-block transition-transform hover:scale-[1.02]">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={260}
              height={80}
              priority
              className="h-16 w-auto object-contain brightness-0 invert"
            />
          </Link>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
          >
            <BackIcon className="h-3.5 w-3.5" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2B134]/15 border border-[#F2B134]/30 text-xs font-semibold text-[#F2B134]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'بوابة الفيزياء والرياضيات المتطورة' : 'Physics & Mathematics Portal'}</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
            {isAr
              ? 'تعليم متميز، فهم عميق، وتفوق مضمون مع م. عمرو حاتم'
              : 'Empowering deep understanding and academic excellence with Eng. Amr Hatem'}
          </h1>

          <p className="text-sm text-slate-200/90 leading-relaxed">
            {isAr
              ? 'المنظومة التعليمية الشاملة لمتابعة الحصص الدراسية، الامتحانات الإلكترونية المجهزة، الواجبات، ونسب الحضور بدقة متناهية.'
              : 'The comprehensive platform for physics & math classes, interactive exams, homework grading, and attendance tracking.'}
          </p>

          <div className="space-y-3 pt-2">
            {[
              isAr ? 'امتحانات تفاعلية ونظام بنك أسئلة متخصص' : 'Specialized question bank & interactive exams',
              isAr ? 'مكتبة شاملة لشروحات وملفات الدروس والواجبات' : 'Complete lesson library, assignments & study materials',
              isAr ? 'متابعة دورية مستمرة للدرجات والحضور والتقارير' : 'Continuous progress tracking, grades & attendance',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-100">
                <CheckCircle2 className="h-4 w-4 text-[#14A3A3] shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Social / Contact Bar */}
        <div className="relative z-10 pt-6 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-slate-300">
            {isAr ? 'قنوات التواصل والمتابعة الرسمية:' : 'Official Contact & Channels:'}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* YouTube Channel */}
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-medium text-white transition-all hover:scale-105"
            >
              <Youtube className="h-4 w-4 text-red-400 shrink-0" />
              <span>@Eng.AmrHatem</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium text-white transition-all hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span dir="ltr">+20 101 200 6316</span>
            </a>

            {/* Phone Call */}
            <a
              href="tel:+201012006316"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14A3A3]/20 hover:bg-[#14A3A3]/30 border border-[#14A3A3]/40 text-xs font-medium text-white transition-all hover:scale-105"
            >
              <Phone className="h-3.5 w-3.5 text-[#14A3A3] shrink-0" />
              <span>{isAr ? 'اتصال مباشر' : 'Direct Call'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right panel — Form & Mobile view */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 md:p-12 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Branding with Logo */}
          <div className="flex flex-col items-center text-center space-y-3 lg:hidden">
            <Link href={`/${locale}`} className="inline-block">
              <Image
                src="/logo.svg"
                alt="Eng. Amr Hatem Academy"
                width={240}
                height={74}
                priority
                className="h-14 w-auto object-contain mx-auto"
              />
            </Link>
            <div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? 'تسجيل الدخول إلى البوابة التعليمية' : 'Sign in to your learning portal'}
              </p>
            </div>
          </div>

          <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-muted" />}>
            <LoginForm locale={locale} />
          </Suspense>

          {/* Mobile Contact Quick Links */}
          <div className="lg:hidden pt-4 border-t border-border flex items-center justify-center gap-4 text-xs">
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Youtube className="h-4 w-4 text-red-500" />
              <span>YouTube</span>
            </a>
            <span className="text-muted-foreground/30">•</span>
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-emerald-500 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span dir="ltr">+201012006316</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
