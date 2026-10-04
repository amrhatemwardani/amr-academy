import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export type AuthUser = {
  id: string
  email: string | undefined
  role: 'teacher' | 'student'
  fullName: string
  locale: string
  mustChangePassword: boolean
}

type ProfileRow = {
  role: 'teacher' | 'student'
  full_name: string
  locale: string
  must_change_password: boolean
}

/**
 * Returns the currently authenticated user with their profile,
 * or null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, locale, must_change_password')
    .eq('id', user.id)
    .single() as { data: ProfileRow | null; error: unknown }

  if (!profile) return null

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    fullName: profile.full_name,
    locale: profile.locale,
    mustChangePassword: profile.must_change_password,
  }
}

/**
 * Requires the user to be authenticated as a teacher.
 * Redirects to /login if not authenticated or wrong role.
 */
export async function requireTeacher(locale = 'en'): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  if (user.role !== 'teacher') {
    redirect(`/${locale}/portal`)
  }

  return user
}

/**
 * Requires the user to be authenticated as a student.
 * Redirects to /login if not authenticated or wrong role.
 */
export async function requireStudent(locale = 'en'): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  if (user.role !== 'student') {
    redirect(`/${locale}/dashboard`)
  }

  // Check if student is active
  const supabase = await createClient()
  const { data: studentRecord } = await (supabase.from('students' as any) as any)
    .select('status')
    .eq('id', user.id)
    .single()

  if (studentRecord && (studentRecord.status === 'inactive' || studentRecord.status === 'archived')) {
    await supabase.auth.signOut()
    redirect(`/${locale}/login?error=blocked`)
  }

  return user
}

/**
 * Gets the student record for the currently authenticated student.
 */
export async function getCurrentStudentRecord(): Promise<Tables<'students'> | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}
