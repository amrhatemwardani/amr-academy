import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './login-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SproutIllustration } from '@/components/public/SproutIllustration'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'تسجيل الدخول | أكاديمية عمرو حاتم' : 'Sign In | Amr Academy',
  }
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const user = await getCurrentUser()
  if (user) {
    redirect(user.role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`)
  }

  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ backgroundColor: '#d8efe3' }}
    >
      {/* ── Decorative Background Blobs (Exactly from reference image) ── */}
      {/* Top-Right Periwinkle / Lavender Blob */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 sm:-top-20 sm:-right-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full"
        style={{ backgroundColor: '#c2d2fd', opacity: 0.9 }}
        aria-hidden="true"
      />

      {/* Bottom-Left Yellow Blob */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 rounded-full"
        style={{ backgroundColor: '#fed876', opacity: 0.95 }}
        aria-hidden="true"
      />

      {/* Back to Home pill (Top Corner) */}
      <Link
        href={`/${locale}`}
        className="absolute top-5 start-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-white transition-all hover:scale-105"
      >
        <span>{isAr ? '→ العودة للرئيسية' : '← Back to Home'}</span>
      </Link>

      {/* ── Center Sprout Card (Split 50% / 50%) ── */}
      <div
        className="relative z-10 w-full max-w-[820px] rounded-[32px] sm:rounded-[36px] overflow-hidden shadow-2xl bg-white border border-white/60 flex flex-col md:flex-row"
        style={{ boxShadow: '0 25px 60px -15px rgba(20, 80, 50, 0.12)' }}
      >
        {/* LEFT PANEL — Vector Illustration & Peach Background */}
        <div
          className="w-full md:w-1/2 flex flex-col items-center justify-between p-7 sm:p-10 relative select-none"
          style={{ backgroundColor: '#fce5d8' }}
        >
          {/* Top spacer */}
          <div className="w-full flex justify-start">
            <span className="text-[11px] font-bold text-[#eb6744]/80 tracking-wider uppercase">
              {isAr ? 'أكاديمية الفيزياء والرياضيات' : 'Physics & Math Academy'}
            </span>
          </div>

          {/* Central Cute Vector Illustration */}
          <div className="my-auto py-4 w-full flex items-center justify-center">
            <SproutIllustration className="w-full max-w-[270px] h-auto drop-shadow-sm" />
          </div>

          {/* Bottom Badge (Exact match to Sprout reference) */}
          <div className="w-full flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-5 py-2 text-xs font-bold text-[#1f6f47] shadow-sm border border-emerald-50">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isAr
                  ? '412+ طالباً أنجزوا تدريباتهم في الموعد اليوم'
                  : '412 students completed tasks on time today'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Sign In Form (White Background) */}
        <div className="w-full md:w-1/2 bg-white p-7 sm:p-10 flex flex-col justify-center">
          {/* Brand Logo Row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-sm rotate-45 bg-[#2c8c5c] shadow-xs" />
            <span className="font-extrabold text-base tracking-tight text-[#1b4332]">
              {isAr ? 'أكاديمية عمرو حاتم' : 'Amr Academy'}
            </span>
          </div>

          {/* Main Welcome Heading */}
          <h1 className="text-2xl sm:text-[26px] font-black text-gray-900 leading-tight">
            {isAr ? 'أهلاً بك يا بطل! 👋' : 'Hello again, plant pal!'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 mb-6">
            {isAr
              ? 'دروسك وتمارين الفيزياء بانتظارك اليوم.'
              : 'Your courses and lessons have been asking about you.'}
          </p>

          {/* Form */}
          <Suspense fallback={<div className="h-44 animate-pulse rounded-2xl bg-gray-100" />}>
            <LoginForm locale={locale} />
          </Suspense>

          {/* New Account / Apply Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            {isAr ? (
              <>
                طالب جديد؟{' '}
                <Link
                  href={`/${locale}/apply`}
                  className="font-bold text-[#2563eb] hover:underline"
                >
                  سجّل حسابك في الأكاديمية
                </Link>
              </>
            ) : (
              <>
                First time here?{' '}
                <Link
                  href={`/${locale}/apply`}
                  className="font-bold text-[#2563eb] hover:underline"
                >
                  Plant your account
                </Link>
              </>
            )}
          </div>

          <p className="mt-2 text-center text-[11px] text-gray-400">
            {isAr ? 'منصة م. عمرو حاتم — دليلك لأعلى الدرجات' : 'Amr Hatem Academy — Learn with confidence'}
          </p>
        </div>
      </div>
    </main>
  )
}
