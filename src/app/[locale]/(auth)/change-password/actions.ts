'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = (formData.get('currentPassword') as string) || ''
  const newPassword = (formData.get('newPassword') as string) || ''
  const confirmPassword = (formData.get('confirmPassword') as string) || ''
  const locale = (formData.get('locale') as string) || 'en'
  const isAr = locale === 'ar'

  const parsed = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstErr = Object.values(fieldErrors)[0]?.[0]
    return {
      fieldErrors,
      error: firstErr || (isAr ? 'يرجى مراجعة البيانات المدخلة' : 'Please check input fields'),
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return {
      error: isAr
        ? 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.'
        : 'Session expired. Please sign in again.',
    }
  }

  // 1. Verify the current (temporary) password by re-authenticating
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInErr) {
    return {
      error: isAr
        ? 'كلمة المرور الحالية غير صحيحة. اكتب كلمة المرور المؤقتة التي سلمها لك المعلم.'
        : 'Current password is incorrect. Enter the temporary password given by your teacher.',
    }
  }

  // 2. Update to the new password using admin client (bypasses RLS, no session conflicts)
  const admin = createAdminClient()
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateErr) {
    return {
      error: isAr
        ? `فشل تحديث كلمة المرور: ${updateErr.message}`
        : `Failed to update password: ${updateErr.message}`,
    }
  }

  // 3. Clear the must_change_password flag so student isn't stuck in the loop
  const { error: profileErr } = await (admin.from('profiles' as any) as any)
    .update({ must_change_password: false })
    .eq('id', user.id)

  if (profileErr) {
    // Log but do not fail — the password was already updated
    console.error('Failed to clear must_change_password flag:', profileErr)
  }

  // 4. Sign out the old session so a fresh login is forced with the new password.
  //    This prevents stale session tokens from keeping the old password context.
  await supabase.auth.signOut()

  // 5. Redirect to login with a success flag so we can show a toast
  redirect(`/${locale}/login?passwordChanged=1`)
}

/**
 * Signs the user out completely — used in the forced change-password page
 * so the student can bail out and go back to the login screen.
 */
export async function signOutAndLoginAction(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
