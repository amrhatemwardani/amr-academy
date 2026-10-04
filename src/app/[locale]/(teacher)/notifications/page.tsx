import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NotificationsClientView, NotificationItem } from '@/components/notifications/NotificationsClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default async function TeacherNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireTeacher(locale)

  const admin = await createAdminClient()

  // Fetch notifications for teacher
  const { data: rawNotifications } = await (admin.from('notifications' as any) as any)
    .select('id, type, title, body, link, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications: NotificationItem[] = ((rawNotifications as any[]) || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.read_at,
    createdAt: n.created_at,
  }))

  return (
    <NotificationsClientView
      locale={locale}
      role="teacher"
      notifications={notifications}
    />
  )
}
