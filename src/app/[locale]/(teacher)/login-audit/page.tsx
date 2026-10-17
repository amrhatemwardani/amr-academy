import { requireTeacher } from '@/lib/auth'
import { getStudentCredentialsListAction, getLoginAuditsAction } from '@/lib/audit/actions'
import { LoginAuditClientView } from './LoginAuditClientView'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'بيانات الدخول وسجل الأمان | أكاديمية م. عمرو حاتم' : 'Credentials & Login Audit | Eng. Amr Hatem Academy',
  }
}

export default async function LoginAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const [students, audits] = await Promise.all([
    getStudentCredentialsListAction(),
    getLoginAuditsAction(150),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amr-academy.com'

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <LoginAuditClientView
        locale={locale}
        initialStudents={students}
        initialAudits={audits}
        appUrl={appUrl}
      />
    </div>
  )
}
