'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resolves a student code, phone number, or email into the exact email
 * registered in Supabase Auth.
 * Examples:
 * - 'S1036' -> 's1036@students.local'
 * - 's1036' -> 's1036@students.local'
 * - '1036'  -> 's1036@students.local'
 * - '01012345678' -> queries student table for student_code -> 's...courses@students.local'
 * - 'user@example.com' -> 'user@example.com'
 */
export async function resolveLoginIdentifierAction(rawIdentifier: string): Promise<string> {
  const trimmed = rawIdentifier.trim()
  if (!trimmed) return ''

  // 1. If it's already an email, return as-is
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }

  // 2. If it's a student code format (e.g. S1036, s1036, 1036, S20260012)
  if (/^s?\d+$/i.test(trimmed)) {
    const numPart = trimmed.replace(/^s/i, '')
    const syntheticEmail = `s${numPart.toLowerCase()}@students.local`

    // Verify if this auth user exists
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 100 })
    const matched = users.find(
      (u) => (u.email || '').toLowerCase() === syntheticEmail
    )
    if (matched && matched.email) {
      return matched.email
    }
  }

  // 3. Query students table by student_code (case-insensitive) or by phone
  try {
    const admin = createAdminClient()
    const cleanPhone = trimmed.replace(/[\s\-\+]/g, '')

    const { data: student } = await (admin.from('students' as any) as any)
      .select('id, student_code, phone, email')
      .or(`student_code.ilike.${trimmed},phone.ilike.%${cleanPhone}%,parent_phone.ilike.%${cleanPhone}%`)
      .limit(1)
      .single()

    if (student) {
      if (student.email && student.email.includes('@')) {
        return student.email.toLowerCase()
      }
      if (student.student_code) {
        return `${student.student_code.toLowerCase()}@students.local`
      }
    }
  } catch (err) {
    console.error('Error resolving student identifier:', err)
  }

  // 4. Default fallback: if alphanumeric without @, try appending @students.local
  if (!trimmed.includes('@')) {
    return `${trimmed.toLowerCase()}@students.local`
  }

  return trimmed.toLowerCase()
}

/**
 * In-app password reset request
 */
export async function requestPasswordResetAction(identifier: string) {
  try {
    const resolvedEmail = await resolveLoginIdentifierAction(identifier)
    if (!resolvedEmail) {
      return { error: 'Please enter a valid student code or email.' }
    }

    const admin = createAdminClient()
    // Find teacher to notify
    const { data: teacher } = await (admin.from('profiles' as any) as any)
      .select('id')
      .eq('role', 'teacher')
      .limit(1)
      .single()

    if (teacher?.id) {
      await (admin.from('notifications' as any) as any).insert({
        user_id: teacher.id,
        type: 'password_reset_request',
        title: `طلب استعادة كلمة المرور: ${identifier}`,
        body: `قام الحساب (${resolvedEmail}) بطلب إعادة تعيين كلمة المرور.`,
        channel: 'in_app',
        metadata: {
          identifier,
          resolvedEmail,
          requestedAt: new Date().toISOString(),
        },
      })
    }

    // Also attempt Supabase native reset email if valid domain
    if (!resolvedEmail.endsWith('@students.local')) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.auth.resetPasswordForEmail(resolvedEmail)
    }

    return { success: true, email: resolvedEmail }
  } catch (err) {
    return { error: String(err) }
  }
}
