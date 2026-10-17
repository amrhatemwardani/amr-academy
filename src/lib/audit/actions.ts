'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface RecordLoginAuditParams {
  actorId?: string | null
  identifier: string
  studentCode?: string | null
  studentName?: string | null
  method: 'password' | 'face_id' | 'magic_link'
  success: boolean
  failureReason?: string | null
  deviceInfo?: string | null
  userAgent?: string | null
}

/**
 * Records an authentication attempt into the audit_log table
 */
export async function recordLoginAuditAction(params: RecordLoginAuditParams) {
  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()

    await (admin.from('audit_log' as any) as any).insert({
      actor: params.actorId || null,
      action: params.success ? `auth.${params.method}.success` : `auth.${params.method}.failed`,
      entity: 'auth',
      entity_id: params.studentCode || params.identifier || 'unknown',
      meta: {
        identifier: params.identifier,
        studentCode: params.studentCode || null,
        studentName: params.studentName || null,
        method: params.method,
        success: params.success,
        failureReason: params.failureReason || null,
        deviceInfo: params.deviceInfo || null,
        userAgent: params.userAgent || null,
        timestamp: nowIso,
      },
      at: nowIso,
    })
  } catch (err) {
    console.error('Failed to record login audit:', err)
  }
}

export interface LoginAuditItem {
  id: number
  actor: string | null
  action: string
  entityId: string
  at: string
  method: 'password' | 'face_id' | 'magic_link'
  success: boolean
  identifier: string
  studentCode: string | null
  studentName: string | null
  failureReason: string | null
  deviceInfo: string | null
  userAgent: string | null
}

/**
 * Fetches recent login audit records for the Teacher Portal
 */
export async function getLoginAuditsAction(limit = 100): Promise<LoginAuditItem[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from('audit_log' as any) as any)
      .select('id, actor, action, entity, entity_id, meta, at')
      .like('action', 'auth.%')
      .order('at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as any[]).map((row) => {
      const meta = row.meta || {}
      return {
        id: row.id,
        actor: row.actor,
        action: row.action,
        entityId: row.entity_id || '',
        at: row.at,
        method: meta.method || (row.action.includes('face_id') ? 'face_id' : 'password'),
        success: meta.success !== undefined ? meta.success : row.action.endsWith('.success'),
        identifier: meta.identifier || row.entity_id || '',
        studentCode: meta.studentCode || (row.entity_id?.startsWith('S') ? row.entity_id : null),
        studentName: meta.studentName || null,
        failureReason: meta.failureReason || null,
        deviceInfo: meta.deviceInfo || null,
        userAgent: meta.userAgent || null,
      }
    })
  } catch (err) {
    console.error('Error fetching login audits:', err)
    return []
  }
}

export interface StudentCredentialItem {
  id: string
  studentCode: string
  fullName: string
  email: string
  phone: string | null
  parentPhone: string | null
  status: string
  mustChangePassword: boolean
  hasFaceId: boolean
  enrolledOn: string
}

/**
 * Fetches all student login credentials and security states for the Teacher Portal
 */
export async function getStudentCredentialsListAction(): Promise<StudentCredentialItem[]> {
  try {
    const admin = createAdminClient()

    // 1. Fetch students and profiles
    const { data: students, error: studentsError } = await (admin.from('students' as any) as any)
      .select(`
        id,
        student_code,
        phone,
        parent_phone,
        email,
        status,
        enrolled_on,
        profiles (
          full_name,
          role,
          must_change_password
        )
      `)
      .order('student_code', { ascending: true })

    if (studentsError || !students) return []

    // 2. Fetch auth users to see who has Face ID enrolled
    const { data: authList } = await admin.auth.admin.listUsers({ perPage: 250 })
    const authMap = new Map((authList?.users || []).map((u) => [u.id, u]))

    return (students as any[]).map((s) => {
      const authUser = authMap.get(s.id)
      const hasBiometric = !!authUser?.user_metadata?.biometric_token_hash

      const cleanCode = s.student_code || 'S1000'
      const fallbackEmail = `s${cleanCode.toLowerCase().replace(/[^0-9]/g, '')}@students.local`

      const profileObj = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles

      return {
        id: s.id,
        studentCode: cleanCode,
        fullName: profileObj?.full_name || 'Student',
        email: s.email || authUser?.email || fallbackEmail,
        phone: s.phone,
        parentPhone: s.parent_phone,
        status: s.status || 'active',
        mustChangePassword: profileObj?.must_change_password === true,
        hasFaceId: hasBiometric,
        enrolledOn: s.enrolled_on || '',
      }
    })
  } catch (err) {
    console.error('Error fetching student credentials:', err)
    return []
  }
}

/**
 * Teacher resets student password and optionally enforces must_change_password
 */
export async function teacherResetStudentPasswordAction(params: {
  studentId: string
  studentCode: string
  studentName?: string
  newPassword: string
  mustChangePassword: boolean
}) {
  try {
    const admin = createAdminClient()

    // 1. Update password in Supabase Auth
    const { error: authError } = await admin.auth.admin.updateUserById(params.studentId, {
      password: params.newPassword,
    })

    if (authError) throw new Error(authError.message)

    // 2. Set must_change_password on profile
    await (admin.from('profiles' as any) as any)
      .update({ must_change_password: params.mustChangePassword })
      .eq('id', params.studentId)

    // 3. Log audit event
    await recordLoginAuditAction({
      actorId: null,
      identifier: params.studentCode,
      studentCode: params.studentCode,
      studentName: params.studentName,
      method: 'password',
      success: true,
      failureReason: `Password reset by teacher (must_change: ${params.mustChangePassword})`,
    })

    revalidatePath('/[locale]/students')
    revalidatePath('/[locale]/login-audit')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reset password'
    return { success: false, error: msg }
  }
}

/**
 * Teacher revokes a student's Face ID biometric enrollment
 */
export async function teacherRevokeStudentFaceIdAction(params: {
  studentId: string
  studentCode: string
  studentName?: string
}) {
  try {
    const admin = createAdminClient()

    // Fetch user to clear biometric_token_hash in metadata
    const { data: { user }, error: getError } = await admin.auth.admin.getUserById(params.studentId)
    if (getError || !user) throw new Error('Student account not found')

    const newMeta = { ...user.user_metadata }
    delete newMeta.biometric_token_hash
    delete newMeta.biometric_enrolled_at

    await admin.auth.admin.updateUserById(params.studentId, {
      user_metadata: newMeta,
    })

    // Log audit event
    await recordLoginAuditAction({
      actorId: null,
      identifier: params.studentCode,
      studentCode: params.studentCode,
      studentName: params.studentName,
      method: 'face_id',
      success: true,
      failureReason: 'Face ID revoked by teacher',
    })

    revalidatePath('/[locale]/students')
    revalidatePath('/[locale]/login-audit')

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to revoke Face ID'
    return { success: false, error: msg }
  }
}
