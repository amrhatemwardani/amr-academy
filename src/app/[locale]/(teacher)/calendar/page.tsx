import { requireTeacher } from '@/lib/auth'
import { getCalendarEvents } from '@/lib/calendar/data'
import { AcademyCalendarClientView } from '@/components/calendar/AcademyCalendarClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Academy Calendar' }

export default async function TeacherCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const events = await getCalendarEvents({
    role: 'teacher',
  })

  return (
    <AcademyCalendarClientView
      locale={locale}
      role="teacher"
      events={events}
    />
  )
}
