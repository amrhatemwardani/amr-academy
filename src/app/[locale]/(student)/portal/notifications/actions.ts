'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStudent } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function markAllNotificationsReadAction(locale = 'en') {
  try {
    const user = await requireStudent(locale)
    const admin = createAdminClient() // SYNC
    await (admin.from('notifications' as any) as any)
      .update({ read_at: new Date().toISOString() })
      .eq('student_id', user.id)
      .is('read_at', null)
    revalidatePath(`/${locale}/portal/notifications`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}
