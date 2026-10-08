'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Save Academy Settings ───────────────────────────────────────────
export async function saveSettingsAction(formData: FormData) {
  const school_name = formData.get('school_name') as string
  const currency = formData.get('currency') as string
  const timezone = formData.get('timezone') as string
  const min_attendance_pct = Number(formData.get('min_attendance_pct'))
  const consecutive_absences_alert = Number(formData.get('consecutive_absences_alert'))

  if (!school_name?.trim()) return { error: 'School name is required.' }

  const supabase = await createAdminClient()

  // Upsert settings row (assume single-row settings table with id=1)
  const { error } = await (supabase.from('settings' as any) as any).upsert(
    {
      id: 1,
      school_name: school_name.trim(),
      currency: currency || 'EGP',
      timezone: timezone || 'Africa/Cairo',
      min_attendance_pct: isNaN(min_attendance_pct) ? 75 : min_attendance_pct,
      consecutive_absences_alert: isNaN(consecutive_absences_alert) ? 3 : consecutive_absences_alert,
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.error('saveSettings error:', error)
    return { error: 'Failed to save settings. ' + error.message }
  }

  revalidatePath('/en/settings')
  revalidatePath('/ar/settings')
  return { success: true }
}

// ─── Change Teacher Password ─────────────────────────────────────────
export async function changePasswordAction(formData: FormData) {
  const current_password = formData.get('current_password') as string
  const new_password = formData.get('new_password') as string
  const confirm_password = formData.get('confirm_password') as string

  if (!current_password || !new_password || !confirm_password) {
    return { error: 'All fields are required.' }
  }
  if (new_password !== confirm_password) {
    return { error: 'Passwords do not match.' }
  }
  if (new_password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // Verify current password by attempting sign-in
  const serverClient = await createClient()
  const { data: { user }, error: userErr } = await serverClient.auth.getUser()
  if (userErr || !user?.email) return { error: 'Session expired. Please log in again.' }

  const { error: signInErr } = await serverClient.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  })
  if (signInErr) return { error: 'Current password is incorrect.' }

  // Update password via admin
  const admin = createAdminClient()
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: new_password,
  })
  if (updateErr) return { error: 'Failed to update password: ' + updateErr.message }

  return { success: true }
}

// ─── Update Teacher Profile ──────────────────────────────────────────
export async function updateProfileAction(formData: FormData) {
  const full_name = formData.get('full_name') as string
  if (!full_name?.trim()) return { error: 'Name is required.' }

  const serverClient = await createClient()
  const { data: { user }, error: userErr } = await serverClient.auth.getUser()
  if (userErr || !user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await (admin.from('profiles' as any) as any)
    .update({ full_name: full_name.trim() })
    .eq('id', user.id)

  if (error) return { error: 'Failed to update profile: ' + error.message }

  revalidatePath('/en/settings')
  revalidatePath('/ar/settings')
  return { success: true }
}
