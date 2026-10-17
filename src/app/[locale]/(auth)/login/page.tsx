import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from './login-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(135deg, #e8f7ec 0%, #d4f0e0 50%, #e0f0fb 100%)' }}
    >
      {/* Decorative blobs — exactly like Sprout screenshot */}
      {/* Top-right lavender blob */}
      <div
        className="pointer-events-none absolute top-[-60px] right-[-60px] h-52 w-52 rounded-full opacity-70"
        style={{ background: '#c7d2fe' }}
      />
      {/* Bottom-left yellow blob */}
      <div
        className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-48 w-48 rounded-full opacity-80"
        style={{ background: '#fde68a' }}
      />
      {/* Extra mint blob mid-left */}
      <div
        className="pointer-events-none absolute top-1/2 left-[-30px] h-28 w-28 rounded-full opacity-40"
        style={{ background: '#6ee7b7' }}
      />

      {/* The Main Card — split left/right */}
      <div
        className="relative z-10 flex w-full max-w-2xl mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ minHeight: '460px' }}
      >
        {/* LEFT PANEL — Illustration (peach background) */}
        <div
          className="hidden sm:flex w-2/5 flex-col items-center justify-between py-8 px-6 relative"
          style={{ background: '#fde5d9' }}
        >
          {/* Big emoji illustration representing Physics */}
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            {/* Sun */}
            <div className="absolute top-8 right-8 text-3xl animate-bounce-apple">☀️</div>
            {/* Cloud */}
            <div className="absolute top-6 left-6 text-2xl">☁️</div>

            {/* Main Physics Character */}
            <div className="text-[80px] leading-none select-none drop-shadow-lg mt-4">
              🧪
            </div>
            <div className="text-4xl leading-none select-none">⚛️</div>

            {/* Sparkles */}
            <div className="absolute top-1/3 left-5 text-pink-400 text-lg">✦</div>
            <div className="absolute top-1/2 right-5 text-pink-400 text-sm">✦</div>
          </div>

          {/* Stat Badge at bottom */}
          <div
            className="rounded-full px-4 py-2 text-xs font-bold text-gray-700 shadow-sm"
            style={{ background: 'rgba(255,255,255,0.75)' }}
          >
            {isAr ? '🎓 مئات الطلاب يدرسون معنا' : '🎓 Hundreds of students learning daily'}
          </div>
        </div>

        {/* RIGHT PANEL — Form (pure white) */}
        <div className="flex-1 bg-white py-8 px-7 sm:px-9 flex flex-col justify-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="inline-block mb-5 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Amr Academy"
              width={130}
              height={36}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Warm greeting */}
          <h1 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
            {isAr ? 'أهلاً بعودتك! 👋' : 'Hello again! 👋'}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            {isAr ? 'سعداء برؤيتك مجدداً.' : 'Great to see you back.'}
          </p>

          <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-gray-100" />}>
            <LoginForm locale={locale} />
          </Suspense>

          {/* Apply link */}
          <p className="mt-5 text-center text-xs text-gray-400">
            {isAr ? (
              <>
                طالب جديد؟{' '}
                <Link href={`/${locale}/apply`} className="font-bold text-[#0050e3] hover:underline">
                  تقديم طلب انضمام
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link href={`/${locale}/apply`} className="font-bold text-[#0050e3] hover:underline">
                  Apply to join
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Top-left home link */}
      <Link
        href={`/${locale}`}
        className="absolute top-5 left-5 z-20 text-xs text-gray-500 hover:text-gray-700 bg-white/60 backdrop-blur rounded-full px-3 py-1.5 transition-colors"
      >
        ← {isAr ? 'الرئيسية' : 'Home'}
      </Link>
    </main>
  )
}
