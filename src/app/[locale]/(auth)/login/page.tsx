import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from './login-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GraduationCap, Youtube, MessageCircle, Phone, Sparkles, CheckCircle2 } from 'lucide-react'

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

  return (
    <main className="min-h-screen flex bg-background">
      {/* Left panel — Hero & Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex-col justify-between p-12">
        {/* Background ambient glows */}
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 shadow-inner">
            <GraduationCap className="h-7 w-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {isAr ? 'أكاديمية م. عمرو حاتم' : 'Eng. Amr Hatem Academy'}
            </h2>
            <p className="text-xs text-indigo-200/70">
              {isAr ? 'المنصة التعليمية الشاملة' : 'Integrated Learning Platform'}
            </p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isAr ? 'مرحباً بكم في بوابتنا الأكاديمية' : 'Welcome to our Academy Portal'}</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            {isAr
              ? 'تعليم متميز، متابعة دقيقة، ونتائج مضمونة مع م. عمرو حاتم'
              : 'Empowering students with excellence & precision under Eng. Amr Hatem'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {isAr
              ? 'منظومة إلكترونية متطورة لمتابعة الحضور، الامتحانات الإلكترونية، الواجبات الدراسية، والدروس المسجلة بكل سهولة ويسر.'
              : 'A modern academic system designed for seamless attendance tracking, auto-graded exams, homework submissions, and study materials.'}
          </p>

          <div className="space-y-3 pt-2">
            {[
              isAr ? 'امتحانات إلكترونية تفاعلية وتصحيح فوري' : 'Interactive online exams with instant scoring',
              isAr ? 'مكتبة شاملة للمواد والملفات عبر Google Drive' : 'Organized Google Drive lesson materials and notes',
              isAr ? 'متابعة دورية للواجبات ونسب الحضور والغياب' : 'Real-time homework submissions & attendance monitoring',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Social / Contact Bar */}
        <div className="relative z-10 pt-6 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-slate-400">
            {isAr ? 'قنوات التواصل والمتابعة الرسمية:' : 'Official Contact & Channels:'}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* YouTube Channel */}
            <a
              href="https://www.youtube.com/@Eng.AmrHatem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-xs font-medium text-red-200 transition-all hover:scale-105"
            >
              <Youtube className="h-4 w-4 text-red-400 shrink-0" />
              <span>@Eng.AmrHatem</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/201012006316"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-medium text-emerald-200 transition-all hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span dir="ltr">+20 101 200 6316</span>
            </a>

            {/* Phone Call */}
            <a
              href="tel:+201012006316"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-medium text-blue-200 transition-all hover:scale-105"
            >
              <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>{isAr ? 'اتصال مباشر' : 'Direct Call'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right panel — Form & Mobile view */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Branding */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-sm">
              <GraduationCap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isAr ? 'أكاديمية م. عمرو حاتم' : 'Eng. Amr Hatem Academy'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? 'تسجيل الدخول إلى البوابة التعليمية' : 'Portal Sign In'}
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
