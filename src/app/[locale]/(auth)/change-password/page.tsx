import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ChangePasswordForm } from './change-password-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GraduationCap } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'تغيير كلمة المرور | أكاديمية م. عمرو حاتم' : 'Change Password | Eng. Amr Hatem Academy',
  }
}

import Image from 'next/image'
import Link from 'next/link'

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Academy Header with Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href={`/${locale}`} className="inline-block">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={220}
              height={68}
              priority
              className="h-14 w-auto object-contain mx-auto"
            />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isAr ? 'أكاديمية م. عمرو حاتم' : 'Eng. Amr Hatem Academy'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? 'إدارة وأمان الحساب' : 'Account Security & Settings'}
            </p>
          </div>
        </div>

        {/* Change password card */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
            <ChangePasswordForm locale={locale} role={user.role} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
