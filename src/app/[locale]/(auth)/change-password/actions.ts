'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
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

  // 1. Verify current password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInErr) {
    return {
      error: isAr
        ? 'كلمة المرور الحالية غير صحيحة.'
        : 'Current password is incorrect.',
    }
  }

  // 2. Update to new password
  const admin = createAdminClient()
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateErr) {
    return {
      error: updateErr.message,
    }
  }

  // 3. Clear must_change_password flag
  await (admin.from('profiles' as any) as any)
    .update({ must_change_password: false })
    .eq('id', user.id)

  // 4. Determine redirect path
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  const targetPath = profile?.role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`

  revalidatePath(targetPath)
  revalidatePath(`/${locale}/change-password`)
  redirect(targetPath)
}
