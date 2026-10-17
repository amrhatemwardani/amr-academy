'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseAnonClient } from '@supabase/supabase-js'
import { resolveLoginIdentifierAction } from './actions'
import crypto from 'crypto'

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export interface EnrollFaceIdInput {
  identifier: string
  password: string
  deviceName?: string
  credentialId?: string
}

export interface EnrollFaceIdResult {
  success?: boolean
  error?: string
  email?: string
  studentCode?: string
  studentName?: string
  biometricToken?: string
  role?: 'student' | 'teacher'
}

/**
 * Enrolls Face ID for a student or teacher.
 * Verifies credentials, generates a secret biometric token,
 * hashes and stores it in Supabase Auth user_metadata.
 */
export async function enrollFaceIdAction(input: EnrollFaceIdInput): Promise<EnrollFaceIdResult> {
  try {
    const rawId = (input.identifier || '').trim()
    if (!rawId || !input.password) {
      return { error: 'Please provide identifier and password.' }
    }

    const targetEmail = await resolveLoginIdentifierAction(rawId)
    if (!targetEmail) {
      return { error: 'Account not found. Please verify your student code.' }
    }

    // 1. Verify credentials using Supabase Auth signIn
    const anon = createSupabaseAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
    )

    const { data: authData, error: authError } = await anon.auth.signInWithPassword({
      email: targetEmail,
      password: input.password,
    })

    if (authError || !authData.user) {
      return { error: 'Invalid password. Cannot activate Face ID without correct credentials.' }
    }

    const userId = authData.user.id
    const admin = createAdminClient()

    // 2. Fetch student profile
    const { data: profile } = await (admin.from('profiles' as any) as any)
      .select('full_name, role')
      .eq('id', userId)
      .single()

    const { data: student } = await (admin.from('students' as any) as any)
      .select('student_code')
      .eq('id', userId)
      .single()

    // 3. Generate raw secret biometric token
    const randomSecret = crypto.randomBytes(32).toString('hex')
    const rawBiometricToken = `face_${userId}_${randomSecret}`
    const hashed = hashToken(rawBiometricToken)

    // 4. Store hashed token in auth user_metadata
    const existingMeta = authData.user.user_metadata || {}
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        biometric_token_hash: hashed,
        biometric_device: input.deviceName || 'Personal Device',
        biometric_credential_id: input.credentialId || null,
        biometric_enrolled_at: new Date().toISOString(),
      },
    })

    return {
      success: true,
      email: targetEmail,
      studentCode: student?.student_code || rawId.toUpperCase(),
      studentName: profile?.full_name || authData.user.user_metadata?.full_name || 'Student',
      biometricToken: rawBiometricToken,
      role: (profile?.role as any) || 'student',
    }
  } catch (err: any) {
    console.error('Face ID enrollment error:', err)
    return { error: 'Failed to enable Face ID. Please try again.' }
  }
}

export interface VerifyFaceIdInput {
  identifier: string
  biometricToken: string
}

export interface VerifyFaceIdResult {
  success?: boolean
  error?: string
  email?: string
  tokenHash?: string
  emailOtp?: string
  role?: 'student' | 'teacher'
}

/**
 * Verifies Face ID biometric token and generates an authentic magic link token
 * for client-side signIn / verifyOtp.
 */
export async function verifyFaceIdLoginAction(input: VerifyFaceIdInput): Promise<VerifyFaceIdResult> {
  try {
    const rawId = (input.identifier || '').trim()
    const token = (input.biometricToken || '').trim()

    if (!rawId || !token) {
      return { error: 'Invalid biometric verification request.' }
    }

    const targetEmail = await resolveLoginIdentifierAction(rawId)
    if (!targetEmail) {
      return { error: 'Account not found.' }
    }

    const admin = createAdminClient()

    // Find user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 100 })
    if (listError || !users) {
      return { error: 'Authentication service temporarily unavailable.' }
    }

    const user = users.find(
      (u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase()
    )

    if (!user) {
      return { error: 'User account not found.' }
    }

    const storedHash = user.user_metadata?.biometric_token_hash
    if (!storedHash) {
      return { error: 'Face ID is not enrolled for this account. Please set it up once.' }
    }

    // Verify token hash
    const incomingHash = hashToken(token)
    if (incomingHash !== storedHash) {
      return { error: 'Biometric token mismatch. Please re-enable Face ID.' }
    }

    // Generate authentic one-time magiclink sign-in token
    const linkRes = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    })

    if (linkRes.error || !linkRes.data?.properties) {
      return { error: 'Failed to generate biometric login session.' }
    }

    const props = linkRes.data.properties

    return {
      success: true,
      email: targetEmail,
      tokenHash: props.hashed_token,
      emailOtp: props.email_otp,
      role: (user.user_metadata?.role as any) || 'student',
    }
  } catch (err: any) {
    console.error('Face ID verification error:', err)
    return { error: 'Unexpected error during Face ID login.' }
  }
}

/**
 * Disable Face ID for current user
 */
export async function disableFaceIdAction(identifier: string) {
  try {
    const targetEmail = await resolveLoginIdentifierAction(identifier)
    if (!targetEmail) return { error: 'User not found' }

    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 100 })
    const user = users?.find(
      (u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase()
    )

    if (user) {
      const meta = { ...user.user_metadata }
      delete meta.biometric_token_hash
      delete meta.biometric_device
      delete meta.biometric_credential_id
      delete meta.biometric_enrolled_at

      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: meta,
      })
    }

    return { success: true }
  } catch (err) {
    console.error('Disable Face ID error:', err)
    return { error: 'Failed to disable Face ID' }
  }
}
