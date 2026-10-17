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
 * In-app password reset request with student resolution & teacher notification
 */
export async function requestPasswordResetAction(identifier: string) {
  try {
    const rawId = (identifier || '').trim()
    const resolvedEmail = await resolveLoginIdentifierAction(rawId)
    if (!resolvedEmail) {
      return { error: 'Please enter a valid student code or email.' }
    }

    const admin = createAdminClient()

    // 1. Look up student information to enrich notification for teacher
    let studentName = ''
    let studentCode = rawId
    let studentPhone = ''

    const { data: students } = await (admin.from('students' as any) as any)
      .select('id, student_code, phone, parent_phone, profiles(full_name)')
      .limit(200)

    const cleanInput = rawId.toLowerCase().replace(/[^0-9a-z]/g, '')
    const matched = (students as any[] || []).find((s) => {
      const code = (s.student_code || '').toLowerCase().replace(/[^0-9a-z]/g, '')
      const ph = (s.phone || '').replace(/[^0-9]/g, '')
      const pph = (s.parent_phone || '').replace(/[^0-9]/g, '')
      return (
        code === cleanInput ||
        code === `s${cleanInput}` ||
        `s${code}` === cleanInput ||
        ph.endsWith(cleanInput) ||
        pph.endsWith(cleanInput)
      )
    })

    if (matched) {
      studentName = matched.profiles?.full_name || ''
      studentCode = matched.student_code || rawId
      studentPhone = matched.phone || matched.parent_phone || ''
    }

    // 2. Find teacher to notify
    const { data: teacher } = await (admin.from('profiles' as any) as any)
      .select('id')
      .eq('role', 'teacher')
      .limit(1)
      .single()

    if (teacher?.id) {
      const title = `طلب استعادة كلمة المرور: ${studentName || studentCode}`
      const body = `الطالب: ${studentName || 'غير محدد'} | كود: ${studentCode} | هاتف: ${studentPhone || 'غير مسجل'}. اضغط للتعيين وإرسال كلمة المرور عبر واتساب فوراً.`

      await (admin.from('notifications' as any) as any).insert({
        user_id: teacher.id,
        type: 'password_reset_request',
        title,
        body,
        channel: 'in_app',
        link: `/ar/login-audit?search=${encodeURIComponent(studentCode)}`,
        metadata: {
          identifier: rawId,
          studentCode,
          studentName,
          phone: studentPhone,
          resolvedEmail,
          requestedAt: new Date().toISOString(),
        },
      })
    }

    // 3. Log audit event
    const { recordLoginAuditAction } = await import('@/lib/audit/actions')
    await recordLoginAuditAction({
      identifier: rawId,
      studentCode,
      studentName,
      method: 'password',
      success: true,
      failureReason: 'Password reset request submitted by student',
    })

    // 4. Also attempt Supabase native reset email if valid external domain
    if (!resolvedEmail.endsWith('@students.local')) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.auth.resetPasswordForEmail(resolvedEmail)
    }

    return {
      success: true,
      email: resolvedEmail,
      studentCode,
      studentName,
      phone: studentPhone,
    }
  } catch (err) {
    return { error: String(err) }
  }
}
