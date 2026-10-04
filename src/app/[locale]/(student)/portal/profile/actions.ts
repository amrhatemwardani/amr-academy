'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function changeStudentPasswordAction(formData: FormData) {
  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' }
  }
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Session expired. Please log in again.' }
  }

  // Verify current password by signing in
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInErr) {
    return { error: 'Current password is incorrect.' }
  }

  // Update password
  const admin = await createAdminClient()
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateErr) {
    return { error: updateErr.message }
  }

  // Clear must_change_password flag on profile if set
  await (admin.from('profiles' as any) as any)
    .update({ must_change_password: false })
    .eq('id', user.id)

  revalidatePath('/en/portal/profile')
  revalidatePath('/ar/portal/profile')

  return { success: true }
}
