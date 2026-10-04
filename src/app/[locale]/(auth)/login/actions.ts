'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const teacherLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const studentLoginSchema = z.object({
  identifier: z.string().min(1, 'Student code or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

type StudentCodeRow = { student_code: string }
type ProfileRoleRow = { role: 'teacher' | 'student' }
type ProfileRolePwRow = { role: 'teacher' | 'student'; must_change_password: boolean }

/**
 * Teacher login — uses real email + password
 */
export async function teacherLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = teacherLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Invalid email or password. Please try again.' }
  }

  // Verify role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Authentication failed.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: ProfileRoleRow | null; error: unknown }

  if (!profile || profile.role !== 'teacher') {
    await supabase.auth.signOut()
    return { error: 'This account is not a teacher account.' }
  }

  const locale = (formData.get('locale') as string) || 'en'
  revalidatePath(`/${locale}/dashboard`)
  redirect(`/${locale}/dashboard`)
}

/**
 * Student login — identifier is student_code (e.g. S1001) or phone number.
 * Maps to synthetic email: {student_code}@students.local
 */
export async function studentLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = studentLoginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const identifier = parsed.data.identifier.trim()
  const locale = (formData.get('locale') as string) || 'en'

  // Determine if identifier is a student code (starts with S and digits) or phone
  let email: string

  if (/^S\d+$/i.test(identifier)) {
    // Student code
    email = `${identifier.toUpperCase()}@students.local`
  } else {
    // Phone number — look up the student_code
    const { data: student } = await supabase
      .from('students')
      .select('student_code')
      .eq('phone', identifier)
      .single() as { data: StudentCodeRow | null; error: unknown }

    if (!student) {
      return { error: 'No account found with this phone number.' }
    }
    email = `${student.student_code}@students.local`
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (error) {
    const isBanned =
      error.message?.toLowerCase().includes('banned') ||
      error.message?.toLowerCase().includes('disabled') ||
      error.message?.toLowerCase().includes('suspended')
    if (isBanned) {
      return {
        error:
          locale === 'ar'
            ? 'تم حظر / تعليق حسابك. يرجى التواصل مع إدارة الأكاديمية أو المعلم لإعادة تفعيل الحساب.'
            : 'Your account has been suspended/blocked. Please contact the manager or your teacher to reactivate your account.',
      }
    }
    return { error: 'Invalid credentials. Please check your code/phone and password.' }
  }

  // Verify role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Authentication failed.' }

  // Check student active status
  const { data: studentRecord } = await (supabase.from('students' as any) as any)
    .select('status')
    .eq('id', user.id)
    .single()

  if (studentRecord && (studentRecord.status === 'inactive' || studentRecord.status === 'archived')) {
    await supabase.auth.signOut()
    return {
      error:
        locale === 'ar'
          ? 'تم حظر / تعليق حسابك. يرجى التواصل مع إدارة الأكاديمية أو المعلم لإعادة تفعيل الحساب.'
          : 'Your account has been suspended/blocked. Please contact the manager or your teacher to reactivate your account.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, must_change_password')
    .eq('id', user.id)
    .single() as { data: ProfileRolePwRow | null; error: unknown }

  if (!profile || profile.role !== 'student') {
    await supabase.auth.signOut()
    return { error: 'This account is not a student account.' }
  }

  if (profile.must_change_password) {
    redirect(`/${locale}/change-password`)
  }

  revalidatePath(`/${locale}/portal`)
  redirect(`/${locale}/portal`)
}

/**
 * Logout action
 */
export async function logout(locale = 'en') {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
