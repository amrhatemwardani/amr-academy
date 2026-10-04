'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markAllNotificationsReadAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = await createAdminClient()

  const { error } = await (admin.from('notifications' as any) as any)
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) return { error: error.message }

  revalidatePath('/en/notifications')
  revalidatePath('/ar/notifications')
  revalidatePath('/en/portal/notifications')
  revalidatePath('/ar/portal/notifications')

  return { success: true }
}

export async function deleteNotificationAction(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = await createAdminClient()

  const { error } = await (admin.from('notifications' as any) as any)
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/en/notifications')
  revalidatePath('/ar/notifications')
  revalidatePath('/en/portal/notifications')
  revalidatePath('/ar/portal/notifications')

  return { success: true }
}
