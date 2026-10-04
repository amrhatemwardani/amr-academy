import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NotificationsClient } from './NotificationsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default async function StudentNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const admin = createAdminClient()

  // Fetch notifications for student
  const { data: rawNotifications } = await (admin.from('notifications' as any) as any)
    .select('id, type, title, body, link, read_at, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <NotificationsClient
      locale={locale}
      initialNotifications={rawNotifications || []}
    />
  )
}
