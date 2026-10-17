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

  // If already authenticated, redirect
  const user = await getCurrentUser()
  if (user) {
    redirect(user.role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`)
  }

  return (
    <main
      className="min-h-screen flex flex-col justify-center items-center py-10 px-4 bg-[#f6f8fa] dark:bg-[#0d1117] text-foreground"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* GitHub-style centered logo */}
      <Link href={`/${locale}`} className="mb-4 inline-block hover:opacity-80 transition-opacity">
        <Image
          src="/logo.svg"
          alt="Amr Academy"
          width={180}
          height={50}
          priority
          className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
        />
      </Link>

      {/* GitHub-style simple heading */}
      <h1 className="text-2xl font-light tracking-tight text-foreground mb-4 text-center">
        {isAr ? 'تسجيل الدخول إلى الأكاديمية' : 'Sign in to Amr Academy'}
      </h1>

      {/* Centered Login Card */}
      <div className="w-full max-w-[340px] sm:max-w-[360px]">
        <Suspense fallback={<div className="h-64 rounded-md border border-border bg-card animate-pulse" />}>
          <LoginForm locale={locale} />
        </Suspense>

        {/* GitHub-style "New to academy?" box */}
        <div className="mt-4 rounded-md border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          {isAr ? (
            <span>
              طالب جديد؟{' '}
              <Link href={`/${locale}/apply`} className="text-[#0969da] dark:text-[#58a6ff] hover:underline font-medium">
                تقديم طلب انضمام
              </Link>
            </span>
          ) : (
            <span>
              New to the academy?{' '}
              <Link href={`/${locale}/apply`} className="text-[#0969da] dark:text-[#58a6ff] hover:underline font-medium">
                Apply now
              </Link>
            </span>
          )}
        </div>

        {/* Minimal Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground hover:underline">
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span>•</span>
          <Link href={`/${locale}/hall-of-fame`} className="hover:text-foreground hover:underline">
            {isAr ? 'لوحة الشرف' : 'Hall of Fame'}
          </Link>
          <span>•</span>
          <a
            href="https://wa.me/201012006316"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            {isAr ? 'مساعدة وواتساب' : 'Support'}
          </a>
        </div>
      </div>
    </main>
  )
}
