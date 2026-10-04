import { requireStudent } from '@/lib/auth'
import { getCalendarEvents } from '@/lib/calendar/data'
import { AcademyCalendarClientView } from '@/components/calendar/AcademyCalendarClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Schedule' }

export default async function StudentCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const events = await getCalendarEvents({
    role: 'student',
    studentId: user.id,
  })

  return (
    <AcademyCalendarClientView
      locale={locale}
      role="student"
      events={events}
    />
  )
}
