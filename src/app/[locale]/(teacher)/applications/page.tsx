import { requireTeacher } from '@/lib/auth'
import { getApplicationsAction } from '@/lib/applications/actions'
import { ApplicationsClientView } from './ApplicationsClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Applications',
}

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const applications = await getApplicationsAction()

  return (
    <ApplicationsClientView
      locale={locale}
      applications={applications}
    />
  )
}
