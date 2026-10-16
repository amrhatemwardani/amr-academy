import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: {
      default: locale === 'ar' ? 'أكاديمية م. عمرو حاتم – فيزياء ورياضيات' : 'Eng. Amr Hatem Academy – Physics & Mathematics',
      template: locale === 'ar' ? '%s | م. عمرو حاتم' : '%s | Eng. Amr Hatem',
    },
    description: locale === 'ar'
      ? 'المنظومة التعليمية الرقمية المتكاملة للفيزياء والرياضيات — متابعة، بنك أسئلة، امتحانات إلكترونية مع م. عمرو حاتم'
      : 'Comprehensive Physics & Mathematics Academy Platform with Eng. Amr Hatem — exams, attendance, and resources.',
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
