import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ChangePasswordForm } from './change-password-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOutAndLoginAction } from './actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'تحديث كلمة المرور | أكاديمية م. عمرو حاتم' : 'Change Password | Eng. Amr Hatem Academy',
  }
}

export default async function ChangePasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ [key: string]: string | undefined }>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }

  return (
    <main
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ backgroundColor: '#d8efe3' }}
    >
      {/* ── Decorative Background Blobs ── */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{ backgroundColor: '#c2d2fd', opacity: 0.9 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full"
        style={{ backgroundColor: '#fed876', opacity: 0.95 }}
        aria-hidden="true"
      />

      {/* Back / Sign out button */}
      {user.mustChangePassword ? (
        // When forced, use server action to sign out properly
        <form
          action={signOutAndLoginAction.bind(null, locale)}
          className="absolute top-5 start-5 z-20"
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-white transition-all hover:scale-105"
          >
            <span>{isAr ? '← تسجيل الخروج' : 'Sign Out →'}</span>
          </button>
        </form>
      ) : (
        <Link
          href={user.role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`}
          className="absolute top-5 start-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-white transition-all hover:scale-105"
        >
          <span>{isAr ? '→ العودة للمنصة' : '← Back to Portal'}</span>
        </Link>
      )}

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f6b407] flex items-center justify-center text-white text-2xl font-black shadow-md mb-2">
            🔐
          </div>
          <h1 className="text-xl font-black text-gray-900">
            {isAr ? 'أكاديمية المهندس عمرو حاتم' : 'Eng. Amr Hatem Academy'}
          </h1>
          <p className="text-xs text-gray-500 font-semibold">
            {isAr ? 'أمان وحماية الحساب' : 'Account Security & Settings'}
          </p>
        </div>

        {/* Change password card */}
        <div
          className="rounded-[32px] bg-white p-7 sm:p-9 shadow-2xl border border-white/60"
          style={{ boxShadow: '0 25px 60px -15px rgba(20, 80, 50, 0.12)' }}
        >
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-100" />}>
            <ChangePasswordForm locale={locale} role={user.role} mustChangePassword={user.mustChangePassword} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
